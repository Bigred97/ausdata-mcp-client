import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const charitySectorHealthTool = {
  name: "charity_sector_health",
  description:
    "Returns the AU charity sector health snapshot — ACNC registered-charity aggregates: total active charities, total revenue, donations received, employment, and year-on-year deltas. Single call answers 'how is the AU not-for-profit sector tracking?'. Sources ATO/ACNC. Useful for philanthropy, NFP-policy, and grant-funder context.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleCharitySectorHealth(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/charity-sector-health",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
