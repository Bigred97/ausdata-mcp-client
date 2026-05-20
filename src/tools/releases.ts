import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const releasesSchema = z.object({
  days_ahead: z.number().int().min(1).max(90).default(30).optional(),
  source: z.enum(["abs", "rba"]).optional(),
  dataset_id: z.string().min(1).optional(),
  event_type: z.string().min(1).optional(),
});

export type ReleasesInput = z.infer<typeof releasesSchema>;

export const releasesTool = {
  name: "releases",
  description:
    "Get the upcoming AU economic release calendar: ABS publication dates, RBA board meeting dates, and other scheduled data releases in the next N days. Use this when an agent is asked 'when is the next CPI release?' or 'when is the RBA next deciding on rates?'. Cross-sources ABS + RBA calendars.",
  inputSchema: {
    type: "object",
    properties: {
      days_ahead: {
        type: "integer",
        minimum: 1,
        maximum: 90,
        default: 30,
        description: "How many days ahead to look (1-90). Defaults to 30.",
        examples: [7, 30, 60],
      },
      source: {
        type: "string",
        enum: ["abs", "rba"],
        description: "Filter by source agency. Omit for all sources.",
        examples: ["abs", "rba"],
      },
      dataset_id: {
        type: "string",
        description: "Filter to a specific dataset (e.g. 'abs.CPI', 'abs.LF').",
        examples: ["abs.CPI", "abs.LF"],
      },
      event_type: {
        type: "string",
        description: "Filter by event type (e.g. 'release', 'board_meeting', 'statement').",
        examples: ["release", "board_meeting"],
      },
    },
  },
} as const;

export async function handleReleases(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = releasesSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/releases",
      query: {
        days_ahead: input.days_ahead ?? 30,
        source: input.source,
        dataset_id: input.dataset_id,
        event_type: input.event_type,
      },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
