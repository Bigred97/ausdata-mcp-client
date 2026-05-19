import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const wageVsRentGapTool = {
  name: "wage_vs_rent_gap",
  description:
    "Compares ABS Wage Price Index (WPI) annual growth against ABS rents-component CPI annual growth — single call answers 'are rents outpacing wages?'. Returns nominal wage growth, rent growth, the gap in percentage points, and a direction flag (rents_outpacing_wages vs wages_keeping_pace). Useful for affordability narrative — when negative, real housing-cost pressure is mounting.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleWageVsRentGap(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/wage-vs-rent-gap",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
