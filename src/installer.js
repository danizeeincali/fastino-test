import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { installClaudeFlow } from './plugins/claude-flow.js';
import { installCompoundEngineering } from './plugins/compound-engineering.js';
import { installFrontendDesign } from './plugins/frontend-design.js';
import { generateWorkflowShortcuts } from './utils/shortcuts.js';
import { mergeSettings } from './utils/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function installSuite(options = {}) {
  const cwd = process.cwd();
  const claudeDir = join(cwd, '.claude');

  if (options.dryRun) {
    console.log(chalk.cyan('Dry run mode - no changes will be made\n'));
  }

  // Step 1: Create .claude directory structure
  const spinner = ora('Creating .claude directory structure...').start();

  try {
    if (!options.dryRun) {
      const dirs = [
        '.claude',
        '.claude/commands',
        '.claude/commands/workflows',
        '.claude/commands/coordination',
        '.claude/commands/analysis',
        '.claude/helpers'
      ];

      dirs.forEach(dir => {
        const fullPath = join(cwd, dir);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
      });
    }
    spinner.succeed('Created .claude directory structure');
  } catch (error) {
    spinner.fail(`Failed to create directories: ${error.message}`);
    process.exit(1);
  }

  // Step 2: Install Claude Flow
  console.log(chalk.blue('\n📦 Installing Claude Flow MCP Server\n'));
  await installClaudeFlow(options);

  // Step 3: Install Compound Engineering (with conflict prevention)
  console.log(chalk.blue('\n📦 Installing Compound Engineering Plugin\n'));
  await installCompoundEngineering(options);

  // Step 4: Install Frontend Design (with conflict prevention)
  console.log(chalk.blue('\n📦 Installing Frontend Design Plugin\n'));
  await installFrontendDesign(options);

  // Step 5: Generate settings.json with all MCP configurations
  const settingsSpinner = ora('Configuring settings.json...').start();
  try {
    if (!options.dryRun) {
      await mergeSettings(cwd);
    }
    settingsSpinner.succeed('Configured settings.json');
  } catch (error) {
    settingsSpinner.fail(`Failed to configure settings: ${error.message}`);
  }

  // Step 6: Generate WORKFLOW-SHORTCUTS.md
  const shortcutsSpinner = ora('Generating WORKFLOW-SHORTCUTS.md...').start();
  try {
    if (!options.dryRun) {
      await generateWorkflowShortcuts(cwd);
    }
    shortcutsSpinner.succeed('Generated WORKFLOW-SHORTCUTS.md');
  } catch (error) {
    shortcutsSpinner.fail(`Failed to generate shortcuts: ${error.message}`);
  }

  // Step 7: Create helper scripts
  const helpersSpinner = ora('Creating helper scripts...').start();
  try {
    if (!options.dryRun) {
      await createHelperScripts(cwd);
    }
    helpersSpinner.succeed('Created helper scripts');
  } catch (error) {
    helpersSpinner.fail(`Failed to create helpers: ${error.message}`);
  }

  // Done!
  console.log(chalk.green('\n✅ Danizee Claude Suite installed successfully!\n'));
  console.log(chalk.white('Available commands:'));
  console.log(chalk.gray('  Claude Flow:           ') + chalk.cyan('npx claude-flow@alpha swarm init'));
  console.log(chalk.gray('  Compound Engineering:  ') + chalk.cyan('/compound-engineering:plan'));
  console.log(chalk.gray('  Frontend Design:       ') + chalk.cyan('/frontend-design'));
  console.log(chalk.gray('\nSee WORKFLOW-SHORTCUTS.md for full command reference.\n'));
}

async function createHelperScripts(cwd) {
  const helpersDir = join(cwd, '.claude', 'helpers');

  // Quick start script
  const quickStart = `#!/bin/bash
# Danizee Claude Suite - Quick Start
# Run this to initialize all components

echo "🚀 Initializing Claude Suite..."

# Initialize Claude Flow swarm
npx claude-flow@alpha swarm init --topology hierarchical

echo "✅ Claude Suite ready!"
echo ""
echo "Try these commands:"
echo "  /compound-engineering:plan  - Plan a feature"
echo "  /compound-engineering:work  - Execute a plan"
echo "  /frontend-design           - Design UI components"
`;

  writeFileSync(join(helpersDir, 'quick-start.sh'), quickStart, { mode: 0o755 });

  // Setup MCP script
  const setupMcp = `#!/bin/bash
# Register all MCP servers

echo "📡 Registering MCP servers..."

# Claude Flow MCP
claude mcp add claude-flow -- npx claude-flow@alpha mcp start

echo "✅ MCP servers registered!"
`;

  writeFileSync(join(helpersDir, 'setup-mcp.sh'), setupMcp, { mode: 0o755 });
}

export async function verifyClaude() {
  try {
    execSync('claude --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
