import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const inflationDecompositionTool = {
  name: "inflation_decomposition",
  description:
    "Returns the AU CPI inflation decomposition — headline CPI broken down by ABS expenditure group (housing, food, transport, recreation, etc.) plus contribution-to-total-inflation in percentage points. Single call answers 'what is actually driving inflation right now?'. Sources ABS CPI. Returns the top contributors ranked by contribution, alongside YoY growth per group. Useful for monetary-policy commentary and household-impact analysis.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleInflationDecomposition(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/inflation-decomposition",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
