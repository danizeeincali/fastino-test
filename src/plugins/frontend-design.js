import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

// IMPORTANT: Use unique namespace to prevent conflicts with other plugins
// The original issue was that both compound-engineering and frontend-design
// installed plugins with conflicting names
const PLUGIN_NAMESPACE = 'danizee-frontend';

export async function installFrontendDesign(options = {}) {
  const spinner = ora('Installing Frontend Design...').start();

  try {
    if (options.dryRun) {
      spinner.info('Would install frontend-design plugin with namespace: ' + PLUGIN_NAMESPACE);
      return;
    }

    // Check for conflicts with existing plugins
    const conflicts = await checkFrontendConflicts();
    if (conflicts.hasConflict) {
      spinner.warn(`Found existing plugin: ${conflicts.existingName}`);
      console.log(chalk.yellow(`  Using unique namespace: ${PLUGIN_NAMESPACE}`));
    }

    // Try the Anthropic marketplace installation
    try {
      // First add the marketplace
      execSync('/plugin marketplace add anthropics/claude-code', {
        stdio: 'pipe',
        timeout: 60000
      });
    } catch (e) {
      // Marketplace might already be added, continue
    }

    try {
      // Install the frontend-design plugin
      execSync('/plugin install frontend-design@claude-code-plugins', {
        stdio: 'pipe',
        timeout: 120000
      });
      spinner.succeed('Frontend Design installed from marketplace');
    } catch (error) {
      // Fallback: Create command files manually
      spinner.info('Marketplace unavailable, creating commands manually...');
      await createFrontendCommands(process.cwd());
      spinner.succeed('Frontend Design commands created');
    }

  } catch (error) {
    spinner.fail(`Failed to install Frontend Design: ${error.message}`);
    console.log(chalk.yellow('  Creating fallback command files...'));
    await createFrontendCommands(process.cwd());
  }
}

async function checkFrontendConflicts() {
  const cwd = process.cwd();
  const commandsDir = join(cwd, '.claude', 'commands');

  // Check for existing frontend-design or similar plugins
  // This is the conflict that was reported
  const conflictPatterns = [
    'frontend-design',
    'frontend',
    'design',
    'ui-design'
  ];

  for (const pattern of conflictPatterns) {
    const potentialPath = join(commandsDir, pattern);
    if (existsSync(potentialPath)) {
      return { hasConflict: true, existingName: pattern };
    }
  }

  // Also check settings.json for conflicting plugin registrations
  const settingsPath = join(cwd, '.claude', 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const { readFileSync } = await import('fs');
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      if (settings.plugins) {
        for (const plugin of Object.keys(settings.plugins)) {
          if (conflictPatterns.some(p => plugin.includes(p))) {
            return { hasConflict: true, existingName: plugin };
          }
        }
      }
    } catch (e) {
      // Settings file might be malformed, continue
    }
  }

  return { hasConflict: false };
}

async function createFrontendCommands(cwd) {
  const commandsDir = join(cwd, '.claude', 'commands', 'frontend');

  // Create command directory
  if (!existsSync(commandsDir)) {
    mkdirSync(commandsDir, { recursive: true });
  }

  // Design command
  const designCmd = `# Frontend Design

Generate UI component designs and implementations.

## Usage
Describe the UI component or page you want to design. This command will:
1. Analyze your existing design system (if present)
2. Generate component structure
3. Create responsive layouts
4. Follow accessibility best practices

## Arguments
- **component**: Description of the UI to design

## Example
\`\`\`
/frontend:design Create a user profile card with avatar, name, and bio
\`\`\`
`;
  writeFileSync(join(commandsDir, 'design.md'), designCmd);

  // Component command
  const componentCmd = `# Frontend Component Generator

Generate a complete React/Vue/Svelte component.

## Usage
Specify the component type and framework.

## Arguments
- **name**: Component name
- **framework**: react | vue | svelte (default: react)
- **style**: tailwind | css | styled-components (default: tailwind)

## Example
\`\`\`
/frontend:component Button --framework react --style tailwind
\`\`\`
`;
  writeFileSync(join(commandsDir, 'component.md'), componentCmd);

  // Layout command
  const layoutCmd = `# Frontend Layout

Generate page layouts and grid systems.

## Usage
Describe the layout you need.

## Arguments
- **type**: dashboard | landing | form | list | detail

## Example
\`\`\`
/frontend:layout dashboard with sidebar and header
\`\`\`
`;
  writeFileSync(join(commandsDir, 'layout.md'), layoutCmd);

  // Theme command
  const themeCmd = `# Frontend Theme

Generate or modify theme/design tokens.

## Usage
Create consistent design tokens for your application.

## Example
\`\`\`
/frontend:theme Create a dark mode theme with blue accent colors
\`\`\`
`;
  writeFileSync(join(commandsDir, 'theme.md'), themeCmd);
}
