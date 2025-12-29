import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Check for conflicts between plugins that might register the same names
 * This addresses the issue where compound-engineering and frontend-design
 * were installing conflicting plugin entries
 */
export async function checkConflicts() {
  const conflicts = [];
  const cwd = process.cwd();

  // Check 1: Duplicate command directories
  const commandsDir = join(cwd, '.claude', 'commands');
  if (existsSync(commandsDir)) {
    const duplicateChecks = await checkDuplicateCommands(commandsDir);
    conflicts.push(...duplicateChecks);
  }

  // Check 2: Settings.json plugin conflicts
  const settingsPath = join(cwd, '.claude', 'settings.json');
  if (existsSync(settingsPath)) {
    const settingsConflicts = await checkSettingsConflicts(settingsPath);
    conflicts.push(...settingsConflicts);
  }

  // Check 3: MCP server conflicts
  const mcpConflicts = await checkMcpConflicts(cwd);
  conflicts.push(...mcpConflicts);

  return conflicts;
}

async function checkDuplicateCommands(commandsDir) {
  const conflicts = [];

  try {
    const entries = readdirSync(commandsDir, { withFileTypes: true });
    const commandNames = entries
      .filter(e => e.isDirectory())
      .map(e => e.name.toLowerCase());

    // Known conflicting pairs
    const conflictPairs = [
      ['compound-engineering', 'compound-eng', 'compound'],
      ['frontend-design', 'frontend', 'design'],
    ];

    for (const pair of conflictPairs) {
      const found = pair.filter(name => commandNames.includes(name));
      if (found.length > 1) {
        conflicts.push(`Duplicate command directories: ${found.join(', ')}`);
      }
    }
  } catch (e) {
    // Directory might not exist yet
  }

  return conflicts;
}

async function checkSettingsConflicts(settingsPath) {
  const conflicts = [];

  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));

    // Check for duplicate plugin registrations
    if (settings.plugins) {
      const pluginNames = Object.keys(settings.plugins);

      // Check for similar names that might conflict
      const similarityGroups = groupSimilarNames(pluginNames);
      for (const group of similarityGroups) {
        if (group.length > 1) {
          conflicts.push(`Similar plugin names may conflict: ${group.join(', ')}`);
        }
      }
    }

    // Check for duplicate MCP servers
    if (settings.mcp_servers) {
      const mcpNames = Object.keys(settings.mcp_servers);
      const duplicates = findDuplicatesByCommand(settings.mcp_servers);
      conflicts.push(...duplicates.map(d => `Duplicate MCP command: ${d}`));
    }
  } catch (e) {
    // Settings file might not exist or be malformed
  }

  return conflicts;
}

async function checkMcpConflicts(cwd) {
  const conflicts = [];

  // Check settings.local.json too
  const localSettingsPath = join(cwd, '.claude', 'settings.local.json');
  if (existsSync(localSettingsPath)) {
    try {
      const localSettings = JSON.parse(readFileSync(localSettingsPath, 'utf8'));
      const mainSettingsPath = join(cwd, '.claude', 'settings.json');

      if (existsSync(mainSettingsPath)) {
        const mainSettings = JSON.parse(readFileSync(mainSettingsPath, 'utf8'));

        // Check for MCP servers defined in both files
        if (localSettings.mcp_servers && mainSettings.mcp_servers) {
          const localMcp = Object.keys(localSettings.mcp_servers);
          const mainMcp = Object.keys(mainSettings.mcp_servers);
          const duplicates = localMcp.filter(m => mainMcp.includes(m));

          if (duplicates.length > 0) {
            conflicts.push(`MCP servers defined in both settings files: ${duplicates.join(', ')}`);
          }
        }
      }
    } catch (e) {
      // Files might be malformed
    }
  }

  return conflicts;
}

function groupSimilarNames(names) {
  const groups = [];
  const processed = new Set();

  for (const name of names) {
    if (processed.has(name)) continue;

    const similar = names.filter(n =>
      !processed.has(n) && areSimilar(name, n)
    );

    if (similar.length > 0) {
      groups.push(similar);
      similar.forEach(n => processed.add(n));
    }
  }

  return groups;
}

function areSimilar(a, b) {
  if (a === b) return true;

  // Normalize names
  const normalize = s => s.toLowerCase().replace(/[-_]/g, '');
  const normA = normalize(a);
  const normB = normalize(b);

  // Check if one contains the other
  if (normA.includes(normB) || normB.includes(normA)) return true;

  // Check Levenshtein distance for short names
  if (normA.length < 15 && normB.length < 15) {
    const distance = levenshtein(normA, normB);
    return distance <= 3;
  }

  return false;
}

function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findDuplicatesByCommand(mcpServers) {
  const duplicates = [];
  const commandMap = new Map();

  for (const [name, config] of Object.entries(mcpServers)) {
    const command = `${config.command} ${(config.args || []).join(' ')}`;

    if (commandMap.has(command)) {
      duplicates.push(`${commandMap.get(command)} and ${name} use same command`);
    } else {
      commandMap.set(command, name);
    }
  }

  return duplicates;
}
