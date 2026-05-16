import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

const PERIOD_RE = /^(latest|\d{4}|\d{4}-Q[1-4]|\d{4}-\d{2})$/;

export const economicDashboardSchema = z.object({
  period: z
    .string()
    .regex(PERIOD_RE, "period must be 'latest', YYYY, YYYY-Qn, or YYYY-MM")
    .default("latest")
    .optional(),
});

export type EconomicDashboardInput = z.infer<typeof economicDashboardSchema>;

export const economicDashboardTool = {
  name: "economic_dashboard",
  description:
    "Get the 5 headline AU economic indicators in one call: RBA cash rate, ABS CPI, unemployment, wage growth, and housing lending growth. Use this when an agent needs a macro economic snapshot. Cross-sources RBA + ABS in one query. Replaces 5 separate sister-MCP calls.",
  inputSchema: {
    type: "object",
    properties: {
      period: {
        type: "string",
        description: "Quarter (YYYY-Qn), year (YYYY), month (YYYY-MM), or 'latest'",
        examples: ["latest", "2024-Q4", "2024", "2024-09"],
        default: "latest",
      },
    },
  },
} as const;

export async function handleEconomicDashboard(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = economicDashboardSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/economic-dashboard",
      query: { period: input.period ?? "latest" },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
