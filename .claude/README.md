# Claude Configuration

This directory contains configuration for Claude Code and MCP servers.

## MCP Servers

### Playwright MCP Server

The Playwright MCP server provides browser automation capabilities for testing and debugging.

**Installation**: The server will be automatically installed via `npx` when Claude Code starts. No manual installation required.

**What it provides:**
- Navigate to localhost and interact with running app
- Take screenshots for visual verification
- Inspect DOM elements and measure dimensions
- Test user interactions (clicks, form filling, etc.)
- Verify UI changes without manual testing

**Configuration**: See `.mcp.json` in the project root

**Documentation**: https://executeautomation.github.io/mcp-playwright/docs/intro

## Directory Structure

- `agents/` - Custom Claude agents
- `commands/` - Custom slash commands
- `settings.local.json` - Local user settings (gitignored)

**Note**: MCP server configuration is in `.mcp.json` at the project root (not in this directory)
