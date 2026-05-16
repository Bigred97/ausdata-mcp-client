/**
 * MCP protocol handler. Wires the tool registry to the SDK's Server class
 * over stdio transport. Logs to stderr (stdout is reserved for JSON-RPC).
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { AusdataClient } from "./client.js";
import type { Config } from "./config.js";
import { findTool, getToolDefinitions } from "./tools/index.js";
import { mcpError } from "./lib/errors.js";

export function createServer(config: Config): {
  server: Server;
  client: AusdataClient;
} {
  const client = new AusdataClient(config);

  const server = new Server(
    {
      name: "ausdata-mcp",
      version: config.serverVersion,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: getToolDefinitions(),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const entry = findTool(name);
    if (!entry) {
      return mcpError(
        `Unknown tool: ${name}. Available: ${getToolDefinitions()
          .map((t) => t.name)
          .join(", ")}`,
      ) as unknown as Record<string, unknown>;
    }
    const result = await entry.handler(client, args ?? {});
    return result as unknown as Record<string, unknown>;
  });

  return { server, client };
}

export async function startStdio(config: Config): Promise<void> {
  const { server } = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[ausdata-mcp] connected (api=${config.apiUrl}, key=${config.apiKey ? "set" : "missing"})\n`,
  );
}
