import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const realMortgageRateTool = {
  name: "real_mortgage_rate",
  description:
    "Returns the current real (inflation-adjusted) standard variable mortgage rate — RBA owner-occupier standard variable rate minus ABS CPI annual change. Single call answers 'are mortgage holders paying a real cost above inflation?'. Cross-sources RBA F-tables + ABS. Returns nominal mortgage rate, CPI annual change, the computed real rate, and a borrower-stance flag (real_cost_positive vs negative).",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleRealMortgageRate(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/real-mortgage-rate",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
