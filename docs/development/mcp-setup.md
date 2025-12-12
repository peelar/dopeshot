# MCP Server Setup

This project uses MCP (Model Context Protocol) servers to enhance the development experience with Claude Code.

## Playwright MCP Server

The Playwright MCP server provides browser automation for testing and debugging.

### What it does
- Navigate to localhost and interact with the running app
- Take screenshots for visual verification  
- Inspect DOM elements and measure dimensions
- Test user interactions automatically
- Verify UI changes without manual testing

### Setup for Contributors

**Automatic Setup** (Recommended):
The MCP server is configured in `.mcp.json` (in the project root) and will be automatically installed via `npx` when Claude Code starts. No manual installation needed!

**Manual Installation** (Optional):
If you want to install it globally:
```bash
npm install -g @executeautomation/playwright-mcp-server
```

### Usage

Once configured, Claude Code will have access to browser automation tools. You can ask Claude to:
- "Navigate to localhost:3000 and take a screenshot"
- "Click on the Code look and verify the canvas size"
- "Test the language auto-detection by pasting Java code"

### Documentation

- [MCP Playwright Docs](https://executeautomation.github.io/mcp-playwright/docs/intro)
- [GitHub Repository](https://github.com/executeautomation/mcp-playwright)

## Adding More MCP Servers

To add additional MCP servers, edit `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "your-server": {
      "command": "npx",
      "args": ["-y", "@your/mcp-server"]
    }
  }
}
```

See [Anthropic MCP Documentation](https://docs.anthropic.com/en/docs/build-with-claude/mcp) for more information.
