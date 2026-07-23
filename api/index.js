import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";

const app = express();
app.use(express.json());

const server = new Server({
  name: "apple-maps-helper",
  version: "1.0.0",
}, {
  capabilities: { tools: {} },
});

const TOOLS = [
  {
    name: "search_in_apple_maps",
    description: "在苹果地图中搜索地点",
    inputSchema: {
      type: "object",
      properties: { location: { type: "string" } },
      required: ["location"],
    },
  },
  {
    name: "navigate_in_apple_maps",
    description: "在苹果地图中开启导航",
    inputSchema: {
      type: "object",
      properties: {
        destination: { type: "string" },
        mode: { type: "string", enum: ["d", "w", "r"] },
      },
      required: ["destination", "mode"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "search_in_apple_maps") {
    return { content: [{ type: "text", text: `maps://?q=${encodeURIComponent(args.location)}` }] };
  }
  if (name === "navigate_in_apple_maps") {
    return { content: [{ type: "text", text: `maps://?daddr=${encodeURIComponent(args.destination)}&dirflg=${args.mode}` }] };
  }
  throw new Error("Tool not found");
});

app.get("/", (req, res) => res.send("Apple Maps MCP is Running! (Always Awake)"));

let transport;
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport");
  }
});

// 核心：常驻服务器必须监听端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
