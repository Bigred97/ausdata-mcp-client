import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

const REGION_RE = /^(NSW1|QLD1|SA1|TAS1|VIC1)$/;

export const nemDispatch5minSchema = z.object({
  region: z
    .string()
    .regex(REGION_RE, "region must be one of NSW1, QLD1, SA1, TAS1, VIC1")
    .optional(),
  limit: z.number().int().min(1).max(288).optional(),
});

export type NemDispatch5minInput = z.infer<typeof nemDispatch5minSchema>;

export const nemDispatch5minTool = {
  name: "nem_dispatch_5min",
  description:
    "Returns the AEMO 5-minute NEM dispatch series — recent dispatch intervals for a region (or all regions): spot price, scheduled demand, dispatched generation by fuel/technology. Use this when an agent is asked 'what's been happening in the NEM over the last hour?' or 'show me the dispatch curve in QLD today'. Higher cadence than `energy_snapshot` (which is a point-in-time summary). Sources AEMO live dispatch.",
  inputSchema: {
    type: "object",
    properties: {
      region: {
        type: "string",
        enum: ["NSW1", "QLD1", "SA1", "TAS1", "VIC1"],
        description:
          "NEM region code. NSW1 = New South Wales, QLD1 = Queensland, SA1 = South Australia, TAS1 = Tasmania, VIC1 = Victoria. Omit for all regions.",
        examples: ["NSW1", "VIC1", "QLD1"],
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 288,
        description:
          "Maximum number of 5-minute intervals to return (1-288 — 288 covers a full 24h day). Defaults to the server-side default.",
        examples: [12, 60, 288],
      },
    },
  },
} as const;

export async function handleNemDispatch5min(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = nemDispatch5minSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/nem-dispatch-5min",
      query: { region: input.region, limit: input.limit },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
