import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate WORKFLOW-SHORTCUTS.md with all available commands
 */
export async function generateWorkflowShortcuts(cwd) {
  const content = `# Workflow Shortcuts

Quick reference for all Danizee Claude Suite commands.

## Installation Info
- **Installed by**: danizee-claude-suite
- **Version**: 1.0.0
- **Generated**: ${new Date().toISOString()}

---

## Claude Flow Commands

Multi-agent swarm orchestration for complex tasks.

### Swarm Management
\`\`\`bash
# Initialize swarm with hierarchical topology
npx claude-flow@alpha swarm init --topology hierarchical

# Initialize with different topologies
npx claude-flow@alpha swarm init --topology mesh
npx claude-flow@alpha swarm init --topology ring
npx claude-flow@alpha swarm init --topology star

# Check swarm status
npx claude-flow@alpha swarm status
\`\`\`

### Agent Operations
\`\`\`bash
# Spawn specialized agents
npx claude-flow@alpha agent spawn --type architect
npx claude-flow@alpha agent spawn --type coder
npx claude-flow@alpha agent spawn --type researcher
npx claude-flow@alpha agent spawn --type tester

# List active agents
npx claude-flow@alpha agent list
\`\`\`

### Workflow Execution
\`\`\`bash
# Create a new workflow
npx claude-flow@alpha workflow create --name "my-workflow"

# Execute workflow
npx claude-flow@alpha workflow execute --name "my-workflow"

# Dry run (preview without executing)
npx claude-flow@alpha workflow execute --name "my-workflow" --dry-run
\`\`\`

### Memory Operations
\`\`\`bash
# Query memory
npx claude-flow@alpha memory query "previous implementations"

# Clear memory
npx claude-flow@alpha memory clear
\`\`\`

---

## Compound Engineering Commands

Systematic feature development with planning, execution, and review.

### Planning
\`\`\`
/compound-eng:plan <feature description>
\`\`\`
Transform a feature idea into a detailed implementation plan with:
- Research on existing patterns
- Affected files identification
- GitHub issue creation
- Acceptance criteria

**Example:**
\`\`\`
/compound-eng:plan Add user authentication with OAuth2 support
\`\`\`

### Execution
\`\`\`
/compound-eng:work <issue number or description>
\`\`\`
Execute planned work systematically:
- Isolated git worktree
- Trackable todos
- Continuous testing
- Incremental commits

**Example:**
\`\`\`
/compound-eng:work #42
/compound-eng:work Implement the login flow from issue 42
\`\`\`

### Review
\`\`\`
/compound-eng:review <target>
\`\`\`
Comprehensive multi-agent code review:
- Security analysis
- Performance review
- Architecture evaluation
- Best practices check

**Example:**
\`\`\`
/compound-eng:review staged
/compound-eng:review #123
/compound-eng:review feature/auth
\`\`\`

---

## Frontend Design Commands

UI component design and generation.

### Design
\`\`\`
/frontend:design <component description>
\`\`\`
Generate UI component designs with:
- Design system analysis
- Responsive layouts
- Accessibility compliance

**Example:**
\`\`\`
/frontend:design Create a user profile card with avatar, name, and bio
\`\`\`

### Component
\`\`\`
/frontend:component <name> [--framework react|vue|svelte] [--style tailwind|css|styled]
\`\`\`
Generate complete components for your framework.

**Example:**
\`\`\`
/frontend:component Button --framework react --style tailwind
/frontend:component Modal --framework vue --style css
\`\`\`

### Layout
\`\`\`
/frontend:layout <type> <description>
\`\`\`
Generate page layouts and grid systems.

**Types:** dashboard | landing | form | list | detail

**Example:**
\`\`\`
/frontend:layout dashboard with sidebar and header
/frontend:layout landing hero section with features grid
\`\`\`

### Theme
\`\`\`
/frontend:theme <description>
\`\`\`
Generate or modify theme/design tokens.

**Example:**
\`\`\`
/frontend:theme Create a dark mode theme with blue accent colors
/frontend:theme Generate design tokens for minimalist style
\`\`\`

---

## Combined Workflows

Power workflows that chain multiple tools.

### Full Feature Development
\`\`\`bash
# 1. Plan the feature
/compound-eng:plan Add dark mode support

# 2. Initialize swarm for complex work
npx claude-flow@alpha swarm init --topology hierarchical

# 3. Design the UI components
/frontend:design Dark mode toggle and theme switcher

# 4. Execute the plan
/compound-eng:work #<issue-number>

# 5. Review the implementation
/compound-eng:review staged
\`\`\`

### Rapid Prototyping
\`\`\`bash
# 1. Design multiple components quickly
/frontend:layout dashboard with sidebar
/frontend:component Sidebar --framework react
/frontend:component Header --framework react
/frontend:theme Modern dark theme

# 2. Review all changes
/compound-eng:review staged
\`\`\`

---

## Helper Scripts

Located in \`.claude/helpers/\`:

| Script | Description |
|--------|-------------|
| \`quick-start.sh\` | Initialize all components |
| \`setup-mcp.sh\` | Register MCP servers |

Run with:
\`\`\`bash
bash .claude/helpers/quick-start.sh
\`\`\`

---

## Troubleshooting

### MCP Server Not Found
\`\`\`bash
# Re-register the MCP server
claude mcp add claude-flow -- npx claude-flow@alpha mcp start
\`\`\`

### Plugin Conflicts
\`\`\`bash
# Check for conflicts
npx danizee-claude-suite check

# Force reinstall
npx danizee-claude-suite init --force
\`\`\`

### Update Suite
\`\`\`bash
npx danizee-claude-suite update
\`\`\`

---

## Resources

- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
- [Compound Engineering Plugin](https://github.com/EveryInc/compound-engineering-plugin)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
`;

  writeFileSync(join(cwd, 'WORKFLOW-SHORTCUTS.md'), content);
}
