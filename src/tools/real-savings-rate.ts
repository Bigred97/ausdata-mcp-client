import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const realSavingsRateTool = {
  name: "real_savings_rate",
  description:
    "Returns the current real (inflation-adjusted) bank term-deposit / savings rate — RBA retail deposit rate minus ABS CPI annual change. Single call answers 'are savers being compensated for inflation?'. Cross-sources RBA + ABS. Returns nominal savings rate, CPI annual change, the computed real savings rate, and a saver-stance flag (positive_real_return vs eroding).",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleRealSavingsRate(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/real-savings-rate",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
