import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const costOfLivingSchema = z.object({}).optional();

export const costOfLivingTool = {
  name: "cost_of_living",
  description:
    "Get the AU cost-of-living snapshot in one call. Returns ABS Selected Living Cost Indexes (SLCI) for the 5 household types (Employee, Age pensioner, Other government transfer recipient, Self-funded retiree, Pensioner & beneficiary) plus headline CPI for comparison. Use this when an agent is asked 'how much are living costs rising for retirees vs workers?'.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleCostOfLiving(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/cost-of-living",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
