import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

export async function installClaudeFlow(options = {}) {
  const spinner = ora('Installing Claude Flow...').start();

  try {
    if (options.dryRun) {
      spinner.info('Would run: npx claude-flow@alpha init --force');
      return;
    }

    // Install claude-flow
    execSync('npx claude-flow@alpha init --force', {
      stdio: 'pipe',
      timeout: 120000
    });

    spinner.succeed('Claude Flow installed');

    // Register MCP server if not skipped
    if (!options.skipMcp) {
      const mcpSpinner = ora('Registering Claude Flow MCP server...').start();
      try {
        execSync('claude mcp add claude-flow -- npx claude-flow@alpha mcp start', {
          stdio: 'pipe',
          timeout: 30000
        });
        mcpSpinner.succeed('Claude Flow MCP server registered');
      } catch (error) {
        // MCP might already be registered
        if (error.message.includes('already exists')) {
          mcpSpinner.info('Claude Flow MCP server already registered');
        } else {
          mcpSpinner.warn('Could not register MCP server - you may need to run: claude mcp add claude-flow -- npx claude-flow@alpha mcp start');
        }
      }
    }

  } catch (error) {
    spinner.fail(`Failed to install Claude Flow: ${error.message}`);
    console.log(chalk.yellow('  You can try manually: npx claude-flow@alpha init --force'));
  }
}

export function getClaudeFlowMcpConfig() {
  return {
    "claude-flow": {
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"],
      "description": "Claude Flow multi-agent orchestration"
    }
  };
}
