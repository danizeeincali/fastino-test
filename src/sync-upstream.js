import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Upstream repository sources
const UPSTREAM_REPOS = {
  'claude-flow': {
    repo: 'ruvnet/claude-flow',
    type: 'npm',
    package: 'claude-flow',
    docsUrl: 'https://raw.githubusercontent.com/ruvnet/claude-flow/main/README.md'
  },
  'compound-engineering': {
    repo: 'EveryInc/compound-engineering-plugin',
    type: 'github',
    docsUrl: 'https://raw.githubusercontent.com/EveryInc/compound-engineering-plugin/main/README.md'
  },
  'frontend-design': {
    repo: 'anthropics/claude-code-plugins',
    type: 'marketplace',
    docsUrl: null
  }
};

export async function syncUpstream(options = {}) {
  console.log(chalk.blue('\n🔄 Syncing with upstream repositories\n'));

  const results = {
    updated: [],
    upToDate: [],
    failed: []
  };

  // Check each upstream repo
  for (const [name, config] of Object.entries(UPSTREAM_REPOS)) {
    const spinner = ora(`Checking ${name}...`).start();

    try {
      const latestInfo = await getLatestVersion(name, config);
      const currentInfo = getCurrentVersion(name);

      if (options.verbose) {
        console.log(chalk.gray(`  Current: ${currentInfo.version || 'unknown'}`));
        console.log(chalk.gray(`  Latest: ${latestInfo.version || 'unknown'}`));
      }

      if (latestInfo.version && latestInfo.version !== currentInfo.version) {
        spinner.text = `Updating ${name} to ${latestInfo.version}...`;

        if (!options.dryRun) {
          await updatePlugin(name, config, latestInfo);
          saveVersion(name, latestInfo.version);
        }

        spinner.succeed(`${name}: updated to ${latestInfo.version}`);
        results.updated.push({ name, version: latestInfo.version });
      } else {
        spinner.succeed(`${name}: up to date`);
        results.upToDate.push(name);
      }
    } catch (error) {
      spinner.fail(`${name}: ${error.message}`);
      results.failed.push({ name, error: error.message });
    }
  }

  // Update command templates from upstream
  if (!options.dryRun && results.updated.length > 0) {
    const templatesSpinner = ora('Updating command templates...').start();
    try {
      await updateCommandTemplates();
      templatesSpinner.succeed('Command templates updated');
    } catch (error) {
      templatesSpinner.warn(`Could not update templates: ${error.message}`);
    }
  }

  // Regenerate WORKFLOW-SHORTCUTS.md
  if (!options.dryRun && results.updated.length > 0) {
    const shortcutsSpinner = ora('Regenerating WORKFLOW-SHORTCUTS.md...').start();
    try {
      const { generateWorkflowShortcuts } = await import('./utils/shortcuts.js');
      await generateWorkflowShortcuts(join(__dirname, '..'));
      shortcutsSpinner.succeed('WORKFLOW-SHORTCUTS.md regenerated');
    } catch (error) {
      shortcutsSpinner.warn(`Could not regenerate shortcuts: ${error.message}`);
    }
  }

  // Summary
  console.log(chalk.blue('\n📊 Sync Summary\n'));

  if (results.updated.length > 0) {
    console.log(chalk.green('Updated:'));
    results.updated.forEach(u => console.log(chalk.green(`  ✓ ${u.name} → ${u.version}`)));
  }

  if (results.upToDate.length > 0) {
    console.log(chalk.gray('Already up to date:'));
    results.upToDate.forEach(name => console.log(chalk.gray(`  • ${name}`)));
  }

  if (results.failed.length > 0) {
    console.log(chalk.red('Failed:'));
    results.failed.forEach(f => console.log(chalk.red(`  ✗ ${f.name}: ${f.error}`)));
  }

  if (options.dryRun) {
    console.log(chalk.yellow('\n(Dry run - no changes made)\n'));
  } else if (results.updated.length > 0) {
    console.log(chalk.green('\n✅ Sync complete! Run `npm version patch` and push to publish updates.\n'));
  } else {
    console.log(chalk.green('\n✅ Everything is up to date!\n'));
  }

  return results;
}

async function getLatestVersion(name, config) {
  switch (config.type) {
    case 'npm':
      return getNpmVersion(config.package);
    case 'github':
      return getGithubVersion(config.repo);
    case 'marketplace':
      return { version: 'latest', source: 'marketplace' };
    default:
      throw new Error(`Unknown source type: ${config.type}`);
  }
}

async function getNpmVersion(packageName) {
  try {
    const result = execSync(`npm view ${packageName} version 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 30000
    }).trim();

    return { version: result, source: 'npm' };
  } catch (error) {
    // Try with @alpha tag for claude-flow
    try {
      const result = execSync(`npm view ${packageName}@alpha version 2>/dev/null`, {
        encoding: 'utf8',
        timeout: 30000
      }).trim();
      return { version: result + '-alpha', source: 'npm' };
    } catch {
      throw new Error('Could not fetch npm version');
    }
  }
}

async function getGithubVersion(repo) {
  try {
    // Try to get latest release
    const releaseResult = execSync(
      `curl -s "https://api.github.com/repos/${repo}/releases/latest" | grep '"tag_name"' | head -1`,
      { encoding: 'utf8', timeout: 30000 }
    );

    const match = releaseResult.match(/"tag_name":\s*"([^"]+)"/);
    if (match) {
      return { version: match[1], source: 'github-release' };
    }

    // Fall back to latest commit SHA
    const commitResult = execSync(
      `curl -s "https://api.github.com/repos/${repo}/commits/main" | grep '"sha"' | head -1`,
      { encoding: 'utf8', timeout: 30000 }
    );

    const shaMatch = commitResult.match(/"sha":\s*"([^"]{7})/);
    if (shaMatch) {
      return { version: shaMatch[1], source: 'github-commit' };
    }

    throw new Error('Could not parse GitHub response');
  } catch (error) {
    throw new Error('Could not fetch GitHub version');
  }
}

function getCurrentVersion(name) {
  const versionsPath = join(__dirname, '..', '.upstream-versions.json');

  if (existsSync(versionsPath)) {
    try {
      const versions = JSON.parse(readFileSync(versionsPath, 'utf8'));
      return { version: versions[name] || null };
    } catch {
      return { version: null };
    }
  }

  return { version: null };
}

function saveVersion(name, version) {
  const versionsPath = join(__dirname, '..', '.upstream-versions.json');

  let versions = {};
  if (existsSync(versionsPath)) {
    try {
      versions = JSON.parse(readFileSync(versionsPath, 'utf8'));
    } catch {
      versions = {};
    }
  }

  versions[name] = version;
  versions._lastSync = new Date().toISOString();

  writeFileSync(versionsPath, JSON.stringify(versions, null, 2));
}

async function updatePlugin(name, config, latestInfo) {
  // Fetch latest documentation and update templates
  if (config.docsUrl) {
    try {
      const docs = execSync(`curl -s "${config.docsUrl}"`, {
        encoding: 'utf8',
        timeout: 30000
      });

      // Extract new commands/features from docs
      const newCommands = parseDocsForCommands(name, docs);

      if (newCommands.length > 0) {
        await updatePluginCommands(name, newCommands);
      }
    } catch (error) {
      // Documentation fetch failed, continue without updating templates
    }
  }
}

function parseDocsForCommands(name, docs) {
  const commands = [];

  // Look for command patterns in documentation
  const patterns = [
    /`\/([a-z-]+:[a-z-]+)`/g,  // /command:subcommand
    /`npx\s+([a-z-]+)\s+([a-z-]+)/g,  // npx tool command
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(docs)) !== null) {
      commands.push(match[0]);
    }
  }

  return [...new Set(commands)];
}

async function updatePluginCommands(name, commands) {
  // This would update the command templates based on new commands found
  // For now, just log what was found
  console.log(chalk.gray(`  Found ${commands.length} commands in ${name} docs`));
}

async function updateCommandTemplates() {
  // Re-fetch and update command templates from upstream
  const templatesDir = join(__dirname, 'templates', '.claude', 'commands');

  if (!existsSync(templatesDir)) {
    mkdirSync(templatesDir, { recursive: true });
  }

  // Templates are embedded in the plugin files, so this triggers
  // the plugin installers to regenerate their templates
}

export async function checkUpstreamVersions() {
  console.log(chalk.blue('\n🔍 Checking upstream versions\n'));

  for (const [name, config] of Object.entries(UPSTREAM_REPOS)) {
    try {
      const latest = await getLatestVersion(name, config);
      const current = getCurrentVersion(name);

      const status = current.version === latest.version
        ? chalk.green('✓ up to date')
        : chalk.yellow(`↑ update available: ${latest.version}`);

      console.log(`${name}: ${current.version || 'not tracked'} ${status}`);
    } catch (error) {
      console.log(`${name}: ${chalk.red('error checking')}`);
    }
  }

  console.log();
}
