import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const superFundRealReturnTool = {
  name: "super_fund_real_return",
  description:
    "Returns the average AU superannuation fund real return — APRA fund-level performance net of fees minus ABS CPI annual change. Single call answers 'is super outpacing inflation right now?'. Cross-sources APRA + ABS. Returns nominal return, CPI annual change, the computed real return, and a stance flag (real_growth vs eroding). Useful for retirement-planning queries.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleSuperFundRealReturn(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/super-fund-real-return",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
