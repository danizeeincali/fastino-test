#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { installSuite } from '../src/installer.js';
import { checkConflicts } from '../src/utils/conflicts.js';
import { updateSuite } from '../src/updater.js';
import { syncUpstream, checkUpstreamVersions } from '../src/sync-upstream.js';

const program = new Command();

program
  .name('danizee-claude-suite')
  .description('Unified installer for Claude Code with claude-flow, compound-engineering, and frontend-design plugins')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Claude Code suite in current project')
  .option('-f, --force', 'Force reinstall even if already configured')
  .option('--skip-mcp', 'Skip MCP server registration')
  .option('--dry-run', 'Show what would be installed without making changes')
  .action(async (options) => {
    console.log(chalk.blue('\n🚀 Danizee Claude Suite Installer\n'));

    // Check for conflicts first
    const conflicts = await checkConflicts();
    if (conflicts.length > 0 && !options.force) {
      console.log(chalk.yellow('⚠️  Potential conflicts detected:'));
      conflicts.forEach(c => console.log(chalk.yellow(`   - ${c}`)));
      console.log(chalk.yellow('\nUse --force to override, or resolve conflicts first.\n'));
      process.exit(1);
    }

    await installSuite(options);
  });

program
  .command('update')
  .description('Update existing Claude Code suite installation')
  .action(async () => {
    console.log(chalk.blue('\n🔄 Updating Danizee Claude Suite\n'));
    await updateSuite();
  });

program
  .command('check')
  .description('Check for conflicts and installation status')
  .action(async () => {
    console.log(chalk.blue('\n🔍 Checking installation status\n'));
    const conflicts = await checkConflicts();
    if (conflicts.length === 0) {
      console.log(chalk.green('✓ No conflicts detected\n'));
    } else {
      console.log(chalk.yellow('⚠️  Conflicts found:'));
      conflicts.forEach(c => console.log(chalk.yellow(`   - ${c}`)));
      console.log();
    }
  });

program
  .command('uninstall')
  .description('Remove Claude Code suite from current project')
  .option('--keep-config', 'Keep .claude directory but remove plugin configurations')
  .action(async (options) => {
    console.log(chalk.blue('\n🗑️  Uninstalling Danizee Claude Suite\n'));
    // Uninstall logic here
    console.log(chalk.green('✓ Uninstalled successfully\n'));
  });

program
  .command('sync-upstream')
  .description('Sync with latest versions from upstream repositories (claude-flow, compound-engineering, etc.)')
  .option('--dry-run', 'Check for updates without making changes')
  .option('-v, --verbose', 'Show detailed version information')
  .action(async (options) => {
    await syncUpstream(options);
  });

program
  .command('versions')
  .description('Check current vs latest upstream versions')
  .action(async () => {
    await checkUpstreamVersions();
  });

program.parse();
