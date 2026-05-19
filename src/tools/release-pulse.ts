import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const releasePulseSchema = z.object({
  days_ahead: z.number().int().min(1).max(90).optional(),
});

export type ReleasePulseInput = z.infer<typeof releasePulseSchema>;

export const releasePulseTool = {
  name: "release_pulse",
  description:
    "Returns the AU data-release pulse — a high-signal summary of the upcoming economic release calendar across ABS, RBA, APRA, AEMO and friends, ranked by market-moving importance. Use this when an agent is asked 'what data drops this week?' or 'when's the next big print?'. Differs from `releases` (the raw calendar) by ranking events by impact and grouping by week. Sources cross-agency calendars.",
  inputSchema: {
    type: "object",
    properties: {
      days_ahead: {
        type: "integer",
        minimum: 1,
        maximum: 90,
        description:
          "How many days ahead to scan (1-90). Defaults to the server-side default (typically 14). Pass a smaller value for the next-week pulse, larger for the monthly view.",
        examples: [7, 14, 30],
      },
    },
  },
} as const;

export async function handleReleasePulse(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = releasePulseSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/release-pulse",
      query: { days_ahead: input.days_ahead },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
