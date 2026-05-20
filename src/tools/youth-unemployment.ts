import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const youthUnemploymentSchema = z.object({}).optional();

export const youthUnemploymentTool = {
  name: "youth_unemployment",
  description:
    "Get the current AU youth (15-24) unemployment rate vs the overall rate, with the gap and trend. Use this when an agent is asked 'how bad is youth unemployment in Australia?' or comparing youth labour market conditions to the broader workforce. Sources ABS Labour Force.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleYouthUnemployment(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/youth-unemployment",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
