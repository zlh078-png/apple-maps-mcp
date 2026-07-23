import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();

const server = new Server({
  name: "apple-maps-helper",
  version: "1.0.0",
}, {
  capabilities: { tools: {} }
});

server.tool("search_in_apple_maps", {
  location: { type: "string", description: "地点名称" }
}, async ({ location }) => {
  return {
    content: [{ type: "text", text: `已生成链接：\nmaps://?q=${encodeURIComponent(location)}` }]
  };
});

server.tool("navigate_in_apple_maps", {
  destination: { type: "string", description: "目的地名称" },
  mode: { type: "string", enum: ["d", "w", "r"], description: "模式：d驾车, w走路, r公交" }
}, async ({ destination, mode }) => {
  return {
    content: [{ type: "text", text: `已生成导航：\nmaps://?daddr=${encodeURIComponent(destination)}&dirflg=${mode}` }]
  };
});

// 首页路由：防止 Vercel 崩溃，并让你确认服务器在线
app.get("/", (req, res) => {
  res.send("Apple Maps MCP Server is Running!");
});

let transport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active SSE transport");
  }
});

export default app;
