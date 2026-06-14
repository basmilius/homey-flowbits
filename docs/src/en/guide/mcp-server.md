---
outline: deep
---

# Model Context Protocol (MCP) <VPBadge type="tip" text="v1.1.0+"/>

FlowBits hosts a public Model Context Protocol (MCP) server at **`https://mcp.flowbits.nl/sse`**. 

This allows AI coding assistants (like Cursor, Windsurf, Claude Desktop, and VS Code extensions) to directly access FlowBits documentation, flow cards, and logic patterns. By enabling this server, your AI assistant can understand the FlowBits design philosophy and write correct, optimized Homey flows using FlowBits patterns.

## Available data

When connected, the MCP server exposes the following resources and tools to your AI assistant:

- **FlowBits Guide** (`flowbits://docs/guide/*`) — Full access to all guides (Modes, Flags, Sets, Philosophy, etc.) so the AI can read documentation on demand.
- **App Manifest** (`flowbits://app/manifest`) — Parses the `app.json` file to retrieve all active FlowBits triggers, conditions, and actions, along with their parameters and Dutch/English translations.
- **Pattern tool** (`explain-pattern`) — Helps the AI construct common automation patterns (such as toilet presence tracking, double guards, or multi-room occupancy tracking).

## Configuring your client

You can configure your AI assistant to connect to the hosted FlowBits MCP server using the Server-Sent Events (SSE) protocol.

Add the configuration below to your IDE or client settings.

:::: code-group
::: code-group-item Claude Desktop
Add this to your `claude_desktop_config.json` (located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "flowbits-doc": {
      "url": "https://mcp.flowbits.nl/sse"
    }
  }
}
```
:::
::: code-group-item Cursor
1. Go to **Settings** → **Features** → **MCP**.
2. Click **+ Add New MCP Server**.
3. Set **Name** to `flowbits`.
4. Set **Type** to `SSE`.
5. Set **URL** to `https://mcp.flowbits.nl/sse`.
:::
::::
