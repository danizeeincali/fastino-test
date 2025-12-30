# Danizee Claude Suite

Unified installer for Claude Code that combines:
- **[Claude Flow](https://github.com/ruvnet/claude-flow)** - Multi-agent swarm orchestration
- **[Compound Engineering](https://github.com/EveryInc/compound-engineering-plugin)** - Systematic feature development
- **Frontend Design** - UI component generation (Anthropic marketplace)

## Quick Start

```bash
# Install in any project
npx danizee-claude-suite init

# Or using the short alias
npx dcs init
```

## What Gets Installed

### Directory Structure
```
your-project/
├── .claude/
│   ├── commands/
│   │   ├── compound-eng/      # Plan, Work, Review commands
│   │   ├── frontend/          # Design, Component, Layout, Theme
│   │   └── workflows/         # Workflow management
│   ├── helpers/
│   │   ├── quick-start.sh     # Initialize all components
│   │   └── setup-mcp.sh       # MCP server registration
│   └── settings.json          # Unified configuration
└── WORKFLOW-SHORTCUTS.md      # Quick reference guide
```

### MCP Servers
- `claude-flow` - Multi-agent orchestration with 100+ tools

### Available Commands

| Command | Description |
|---------|-------------|
| `/compound-eng:plan` | Transform feature ideas into detailed plans |
| `/compound-eng:work` | Execute plans with tracking |
| `/compound-eng:review` | Multi-agent code review |
| `/frontend:design` | Generate UI designs |
| `/frontend:component` | Create framework components |
| `/frontend:layout` | Generate page layouts |
| `/frontend:theme` | Create/modify themes |

## CLI Commands

```bash
# Initialize suite
npx danizee-claude-suite init

# Check for conflicts
npx danizee-claude-suite check

# Update to latest
npx danizee-claude-suite update

# Sync with upstream repos (claude-flow, compound-engineering, etc.)
npx danizee-claude-suite sync-upstream

# Check upstream versions
npx danizee-claude-suite versions

# Uninstall
npx danizee-claude-suite uninstall
```

### Options

```bash
# Force reinstall
npx danizee-claude-suite init --force

# Skip MCP registration
npx danizee-claude-suite init --skip-mcp

# Preview changes
npx danizee-claude-suite init --dry-run

# Check for upstream updates without applying
npx danizee-claude-suite sync-upstream --dry-run

# Verbose sync output
npx danizee-claude-suite sync-upstream --verbose
```

## Keeping Up to Date

This suite pulls from three upstream sources:
- **claude-flow** (npm) - `ruvnet/claude-flow`
- **compound-engineering** (GitHub) - `EveryInc/compound-engineering-plugin`
- **frontend-design** (marketplace) - Anthropic plugins

### Sync with upstream

```bash
# Check what's new
npx danizee-claude-suite versions

# Pull latest and update templates
npx danizee-claude-suite sync-upstream
```

This will:
1. Check latest versions from npm/GitHub
2. Update command templates if APIs changed
3. Regenerate WORKFLOW-SHORTCUTS.md
4. Track versions in `.upstream-versions.json`

## Conflict Prevention

This suite uses unique namespaces to prevent conflicts:
- Commands are installed in separate directories (`compound-eng/`, `frontend/`)
- MCP servers use distinct names
- Settings are merged, not overwritten

Run `npx danizee-claude-suite check` to detect potential conflicts.

## Usage Examples

### Full Feature Development
```bash
# 1. Plan
/compound-eng:plan Add user authentication

# 2. Initialize swarm
npx claude-flow@alpha swarm init

# 3. Design UI
/frontend:design Login form with OAuth buttons

# 4. Execute
/compound-eng:work #42

# 5. Review
/compound-eng:review staged
```

### Rapid Prototyping
```bash
/frontend:layout dashboard with sidebar
/frontend:component Sidebar
/frontend:theme Dark mode
```

## Requirements

- Node.js 18+
- Claude Code CLI installed
- Git

## License

MIT
