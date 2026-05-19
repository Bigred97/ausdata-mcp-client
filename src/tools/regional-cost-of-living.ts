import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const regionalCostOfLivingTool = {
  name: "regional_cost_of_living",
  description:
    "Get the AU regional cost-of-living comparison: per-capital-city CPI changes plus the weighted-eight-capitals average. Use this when an agent is asked 'is the cost of living rising faster in Brisbane than Sydney?' or 'which capital city has the worst inflation?'. Sources ABS CPI by capital city. Returns city-by-city annual CPI deltas and a ranked comparison.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleRegionalCostOfLiving(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/regional-cost-of-living",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
