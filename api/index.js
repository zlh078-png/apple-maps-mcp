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
  location: { type: "string", description: "地点名称，如：武康大楼" }
}, async ({ location }) => {
  return {
    content: [{ 
      type: "text", 
      text: `已为你找到地点。点击链接在苹果地图中打开：\nmaps://?q=${encodeURIComponent(location)}` 
    }]
  };
});

server.tool("navigate_in_apple_maps", {
  destination: { type: "string", description: "目的地名称" },
  mode: { type: "string", enum: ["d", "w", "r"], description: "模式：d(开车), w(走路), r(公交)" }
}, async ({ destination, mode }) => {
  const modes = { d: "驾车", w: "步行", r: "公交" };
  return {
    content: [{ 
      type: "text", 
      text: `已生成前往 ${destination} 的${modes[mode]}路线：\nmaps://?daddr=${encodeURIComponent(destination)}&dirflg=${mode}` 
    }]
  };
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
