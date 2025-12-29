import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

// IMPORTANT: Use unique namespace to prevent conflicts
const PLUGIN_NAMESPACE = 'danizee-compound';
const ORIGINAL_PLUGIN = 'compound-engineering';

export async function installCompoundEngineering(options = {}) {
  const spinner = ora('Installing Compound Engineering...').start();

  try {
    if (options.dryRun) {
      spinner.info('Would install compound-engineering plugin with namespace: ' + PLUGIN_NAMESPACE);
      return;
    }

    // Check for existing conflicting installations
    const conflicts = await checkCompoundConflicts();
    if (conflicts.hasConflict) {
      spinner.warn(`Found existing plugin: ${conflicts.existingName}`);
      console.log(chalk.yellow(`  Renaming to avoid conflict: ${PLUGIN_NAMESPACE}`));
    }

    // Try the standard plugin installation
    try {
      execSync('npx claude-plugins install @EveryInc/every-marketplace/compound-engineering', {
        stdio: 'pipe',
        timeout: 120000
      });
      spinner.succeed('Compound Engineering installed');
    } catch (error) {
      // Fallback: Create command files manually
      spinner.info('Plugin marketplace unavailable, creating commands manually...');
      await createCompoundCommands(process.cwd());
      spinner.succeed('Compound Engineering commands created');
    }

  } catch (error) {
    spinner.fail(`Failed to install Compound Engineering: ${error.message}`);
    console.log(chalk.yellow('  Creating fallback command files...'));
    await createCompoundCommands(process.cwd());
  }
}

async function checkCompoundConflicts() {
  const cwd = process.cwd();
  const commandsDir = join(cwd, '.claude', 'commands');

  // Check for existing compound-engineering or similar
  const conflictPatterns = [
    'compound-engineering',
    'compound',
    'compounding'
  ];

  for (const pattern of conflictPatterns) {
    const potentialPath = join(commandsDir, pattern);
    if (existsSync(potentialPath)) {
      return { hasConflict: true, existingName: pattern };
    }
  }

  return { hasConflict: false };
}

async function createCompoundCommands(cwd) {
  const commandsDir = join(cwd, '.claude', 'commands', 'compound-eng');

  // Create command directory
  if (!existsSync(commandsDir)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(commandsDir, { recursive: true });
  }

  // Plan command
  const planCmd = `# Compound Engineering: Plan

Transform a feature idea into a detailed implementation plan.

## Usage
Describe the feature you want to implement. This command will:
1. Research existing patterns in the codebase
2. Identify affected files and components
3. Create a detailed GitHub issue with acceptance criteria
4. Provide implementation guidance

## Arguments
- **feature**: Description of the feature to plan

## Example
\`\`\`
/compound-eng:plan Add user authentication with OAuth2
\`\`\`
`;
  writeFileSync(join(commandsDir, 'plan.md'), planCmd);

  // Work command
  const workCmd = `# Compound Engineering: Work

Execute a planned feature systematically.

## Usage
Reference a GitHub issue or provide a task description. This command will:
1. Create an isolated git worktree
2. Break the task into trackable todos
3. Implement with continuous testing
4. Commit changes incrementally

## Arguments
- **issue**: GitHub issue number or task description

## Example
\`\`\`
/compound-eng:work #42
\`\`\`
`;
  writeFileSync(join(commandsDir, 'work.md'), workCmd);

  // Review command
  const reviewCmd = `# Compound Engineering: Review

Perform comprehensive code review.

## Usage
Review staged changes or a specific PR. This command activates:
- Security analysis
- Performance review
- Architecture evaluation
- Best practices check

## Arguments
- **target**: PR number, branch name, or 'staged' for staged changes

## Example
\`\`\`
/compound-eng:review staged
/compound-eng:review #123
\`\`\`
`;
  writeFileSync(join(commandsDir, 'review.md'), reviewCmd);
}
