import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const housingAffordabilitySchema = z.object({}).optional();

export const housingAffordabilityTool = {
  name: "housing_affordability",
  description:
    "Get the AU housing affordability snapshot: median dwelling price, household income, price-to-income ratio, mortgage serviceability at the current cash rate, and rent burden. Use this when an agent is asked 'is Australian housing more unaffordable than it was?'. Cross-sources ABS + RBA.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleHousingAffordability(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/housing-affordability",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
