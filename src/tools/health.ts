import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const healthSchema = z.object({}).optional();

export const healthTool = {
  name: "health",
  description:
    "Check the ausdata.io API is reachable and your API key is valid. Useful for debugging MCP connection issues. Returns the server status, API version, and your remaining quota.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleHealth(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({ method: "GET", path: "/v1/health" });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
