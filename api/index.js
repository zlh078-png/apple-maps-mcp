import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();

// 1. 基础检查路由（访问首页不该报500）
app.get("/", (req, res) => {
  res.send("Apple Maps MCP is running! Please connect via /sse");
});

// 2. 创建 MCP 服务器实例
const server = new Server({
  name: "apple-maps-helper",
  version: "1.0.0",
}, {
  capabilities: { tools: {} }
});

// 3. 注册工具
server.tool("search_in_apple_maps", {
  location: { type: "string" }
}, async ({ location }) => {
  return {
    content: [{ type: "text", text: `maps://?q=${encodeURIComponent(location)}` }]
  };
});

server.tool("navigate_in_apple_maps", {
  destination: { type: "string" },
  mode: { type: "string" }
}, async ({ destination, mode }) => {
  return {
    content: [{ type: "text", text: `maps://?daddr=${encodeURIComponent(destination)}&dirflg=${mode}` }]
  };
});

// 关键修复：处理 SSE 连接
let transport = null;

app.get("/sse", async (req, res) => {
  console.log("New SSE request received");
  try {
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
  } catch (error) {
    console.error("SSE Error:", error);
    res.status(500).send("Internal Server Error during SSE setup");
  }
});

app.post("/messages", async (req, res) => {
  if (transport) {
    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error("Message handling error:", error);
      res.status(500).send("Error handling message");
    }
  } else {
    res.status(400).send("No active SSE transport");
  }
});

// 导出 Express 实例供 Vercel 使用
export default app;
