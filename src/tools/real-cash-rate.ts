import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const realCashRateSchema = z.object({}).optional();

export const realCashRateTool = {
  name: "real_cash_rate",
  description:
    "Returns the current real (inflation-adjusted) cash rate — RBA cash rate minus ABS CPI annual change. Single call answers 'is monetary policy restrictive?'. Cross-sources RBA + ABS. Returns nominal cash rate, CPI annual change, the computed real rate, and a stance flag (restrictive/neutral/accommodative).",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleRealCashRate(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/real-cash-rate",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
