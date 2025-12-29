import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { generateWorkflowShortcuts } from './utils/shortcuts.js';
import { mergeSettings } from './utils/settings.js';

export async function updateSuite() {
  const cwd = process.cwd();

  // Check if suite is installed
  const settingsPath = join(cwd, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) {
    console.log(chalk.red('❌ Danizee Claude Suite not found in this directory.'));
    console.log(chalk.gray('   Run: npx danizee-claude-suite init'));
    process.exit(1);
  }

  // Update Claude Flow
  const cfSpinner = ora('Updating Claude Flow...').start();
  try {
    execSync('npx claude-flow@alpha init --force', {
      stdio: 'pipe',
      timeout: 120000
    });
    cfSpinner.succeed('Claude Flow updated');
  } catch (error) {
    cfSpinner.warn('Could not update Claude Flow');
  }

  // Regenerate settings
  const settingsSpinner = ora('Refreshing settings...').start();
  try {
    await mergeSettings(cwd);
    settingsSpinner.succeed('Settings refreshed');
  } catch (error) {
    settingsSpinner.warn('Could not refresh settings');
  }

  // Regenerate shortcuts
  const shortcutsSpinner = ora('Regenerating WORKFLOW-SHORTCUTS.md...').start();
  try {
    await generateWorkflowShortcuts(cwd);
    shortcutsSpinner.succeed('WORKFLOW-SHORTCUTS.md regenerated');
  } catch (error) {
    shortcutsSpinner.warn('Could not regenerate shortcuts');
  }

  console.log(chalk.green('\n✅ Update complete!\n'));
}
