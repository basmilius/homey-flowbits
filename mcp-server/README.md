# FlowBits Model Context Protocol (MCP) Server

This is the Model Context Protocol (MCP) server for FlowBits. It exposes FlowBits documentation, app manifests (flow cards info), and flow patterns to AI coding assistants.

---

## 💻 Local Setup

You can set up and run the MCP server locally using either **Bun** (recommended) or the standard **Node/npm** stack.

### Option A: Using Bun (Recommended)

#### 1. Install Dependencies
Run `bun install` in this directory:
```bash
bun install
```

#### 2. Configure Your Client
Add the server to your IDE or Claude Desktop configuration:
```json
{
  "mcpServers": {
    "flowbits-doc": {
      "command": "bun",
      "args": [
        "run",
        "/absolute/path/to/homey-flowbits/mcp-server/index.js"
      ]
    }
  }
}
```

---

### Option B: Standard Node & npm

#### 1. Install Dependencies
Run `npm install` in this directory:
```bash
npm install
```

#### 2. Configure Your Client
Add the server to your IDE or Claude Desktop configuration:
```json
{
  "mcpServers": {
    "flowbits-doc": {
      "command": "node",
      "args": [
        "/absolute/path/to/homey-flowbits/mcp-server/index.js"
      ]
    }
  }
}
```

*Note: Make sure to replace `/absolute/path/to/` with the actual path to the repository on your machine.*

---

## 🌐 Production Deployment & Hosting (For flowbits.nl Maintainers)

Since `flowbits.nl` is a static site built with VitePress and served via Cloudflare, you cannot run the dynamic Node.js MCP server directly on the static site host. 

Instead, the MCP server must be hosted on a Node.js environment (such as a VPS, container host, or serverless runtime) and proxied through Cloudflare.

Here is how to set up public hosting at a subdomain like `mcp.flowbits.nl`:

### 1. Enable SSE Transport in the Code
To host the MCP server as a public web API, it must run over **SSE (Server-Sent Events)** instead of local `stdio`.

1. Install Express in this directory:
   ```bash
   bun add express
   ```
2. Create a `server.js` file in this directory to wrap the server:
   ```javascript
   import express from "express";
   import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
   import { server } from "./index.js";

   const app = express();
   let sseTransport;

   app.get("/sse", (req, res) => {
     console.log("New client connecting via SSE");
     sseTransport = new SSEServerTransport("/messages", res);
     server.connect(sseTransport);
   });

   app.post("/messages", express.json(), (req, res) => {
     if (sseTransport) {
       sseTransport.handleMessage(req, res);
     } else {
       res.status(500).send("No active transport");
     }
   });

   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
     console.log(`FlowBits MCP Server listening on port ${PORT}`);
   });
   ```
3. Export the `server` in `index.js` (at the bottom) and ensure `StdioServerTransport` only runs if called directly:
   ```javascript
   export { server };

   if (import.meta.url === `file://${process.argv[1]}`) {
     import("@modelcontextprotocol/sdk/server/stdio.js").then(({ StdioServerTransport }) => {
       const transport = new StdioServerTransport();
       server.connect(transport);
       console.error("FlowBits Documentation MCP Server running on stdio");
     });
   }
   ```

### 2. Deployment on VPS (Docker / PM2 / Bun)
Deploy the code to your server. You can run the server continuously using **PM2**:
```bash
pm2 start server.js --interpreter ~/.bun/bin/bun --name "flowbits-mcp"
```
Or run it directly with Bun:
```bash
bun server.js
```

### 3. Cloudflare Configuration
1. **DNS**: Add a CNAME/A record in Cloudflare for `mcp.flowbits.nl` pointing to your server.
2. **Proxy Status**: Set the Proxy status to **Proxied** (orange cloud) so that Cloudflare handles SSL, protects your server's IP, and enables HTTP/3.
3. **SSL/TLS**: Ensure your Cloudflare SSL/TLS settings are set to **Flexible** or **Full** so users can safely connect over HTTPS (`https://mcp.flowbits.nl/sse`).

### 4. Client Usage (Remote/Shared)
Once deployed and proxied, anyone can use the public server in their IDE/client without downloading any files:

```json
{
  "mcpServers": {
    "flowbits-doc": {
      "url": "https://mcp.flowbits.nl/sse"
    }
  }
}
```
