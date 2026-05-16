import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

const QUARTER_RE = /^\d{4}-Q[1-4]$/;

export const realWagesSchema = z.object({
  start: z
    .string()
    .regex(QUARTER_RE, "start must be YYYY-Qn (e.g. 2019-Q1)")
    .optional(),
  end: z
    .string()
    .regex(QUARTER_RE, "end must be YYYY-Qn (e.g. 2024-Q4)")
    .optional(),
  seasonal_adjustment: z
    .enum(["original", "trend", "seasonally_adjusted"])
    .default("trend")
    .optional(),
});

export type RealWagesInput = z.infer<typeof realWagesSchema>;

export const realWagesTool = {
  name: "real_wages",
  description:
    "Get Australian real wages time series (Wage Price Index minus CPI). The flagship 'Greg Jericho chart' — published weekly by AU economic commentators. Returns nominal wage growth, CPI annual change, and the computed gap for each quarter in the range. Example: range 2019-Q1 to 2024-Q4 to see the post-pandemic real wages collapse.",
  inputSchema: {
    type: "object",
    properties: {
      start: {
        type: "string",
        description: "Period start (YYYY-Q1 format)",
        examples: ["2019-Q1", "2020-Q1"],
        pattern: "^\\d{4}-Q[1-4]$",
      },
      end: {
        type: "string",
        description: "Period end (YYYY-Q4 format). Omit for latest.",
        examples: ["2024-Q4"],
        pattern: "^\\d{4}-Q[1-4]$",
      },
      seasonal_adjustment: {
        type: "string",
        enum: ["original", "trend", "seasonally_adjusted"],
        default: "trend",
        description: "ABS methodology variant. 'trend' matches Greg Jericho's published charts.",
      },
    },
  },
} as const;

export async function handleRealWages(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = realWagesSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/real-wages",
      query: {
        start: input.start,
        end: input.end,
        seasonal_adjustment: input.seasonal_adjustment ?? "trend",
      },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
