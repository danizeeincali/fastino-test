import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Merge all plugin settings into a unified settings.json
 * This prevents conflicts by using unique namespaces for each plugin
 */
export async function mergeSettings(cwd) {
  const settingsPath = join(cwd, '.claude', 'settings.json');

  // Load existing settings or create new
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      settings = {};
    }
  }

  // Ensure required structures exist
  settings.mcp_servers = settings.mcp_servers || {};
  settings.permissions = settings.permissions || {};
  settings.hooks = settings.hooks || {};
  settings.features = settings.features || {};

  // Add Claude Flow MCP server
  settings.mcp_servers['claude-flow'] = {
    command: 'npx',
    args: ['claude-flow@alpha', 'mcp', 'start'],
    description: 'Claude Flow multi-agent orchestration',
    version: '2.0.0-alpha'
  };

  // Set up permissions for all plugins (using unique names to avoid conflicts)
  const permissions = [
    'mcp__claude-flow',
    'Bash(npx claude-flow*)',
    'Bash(npm run*)',
    'Bash(git *)',
    'Read',
    'Write',
    'Edit'
  ];

  settings.permissions.allow = [
    ...(settings.permissions.allow || []),
    ...permissions.filter(p => !(settings.permissions.allow || []).includes(p))
  ];

  // Configure hooks
  settings.hooks = {
    enabled: true,
    ...settings.hooks,
    post_task: settings.hooks.post_task || '.claude/commands/hooks/post-task.md',
    pre_edit: settings.hooks.pre_edit || null,
    post_edit: settings.hooks.post_edit || null
  };

  // Feature flags
  settings.features = {
    telemetry: 'basic',
    parallel_execution: true,
    cross_session_memory: true,
    github_integration: true,
    auto_commit: false,
    auto_push: false,
    ...settings.features
  };

  // Add danizee-suite metadata
  settings._danizee_suite = {
    version: '1.0.0',
    installed_at: new Date().toISOString(),
    plugins: [
      'claude-flow',
      'compound-engineering',
      'frontend-design'
    ]
  };

  // Write settings
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  return settings;
}

/**
 * Remove danizee-suite specific settings
 */
export async function cleanSettings(cwd, keepConfig = false) {
  const settingsPath = join(cwd, '.claude', 'settings.json');

  if (!existsSync(settingsPath)) return;

  const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));

  if (keepConfig) {
    // Only remove danizee-suite metadata
    delete settings._danizee_suite;
  } else {
    // Remove all suite-related configurations
    delete settings._danizee_suite;
    delete settings.mcp_servers?.['claude-flow'];

    // Remove suite-specific permissions
    if (settings.permissions?.allow) {
      settings.permissions.allow = settings.permissions.allow.filter(
        p => !p.includes('claude-flow')
      );
    }
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}
