import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

const REGION_RE = /^(NSW1|QLD1|SA1|TAS1|VIC1)$/;

export const energySnapshotSchema = z.object({
  region: z
    .string()
    .regex(REGION_RE, "region must be one of NSW1, QLD1, SA1, TAS1, VIC1")
    .optional(),
});

export type EnergySnapshotInput = z.infer<typeof energySnapshotSchema>;

export const energySnapshotTool = {
  name: "energy_snapshot",
  description:
    "Get the current AU National Electricity Market (NEM) snapshot for a region: spot price, demand, renewable share, and generation mix. Use this when an agent is asked 'how much is electricity costing right now in NSW?' or 'what's the renewable share in SA?'. Sources AEMO live data.",
  inputSchema: {
    type: "object",
    properties: {
      region: {
        type: "string",
        enum: ["NSW1", "QLD1", "SA1", "TAS1", "VIC1"],
        description:
          "NEM region code. NSW1 = New South Wales, QLD1 = Queensland, SA1 = South Australia, TAS1 = Tasmania, VIC1 = Victoria. Omit for all regions.",
        examples: ["NSW1", "VIC1", "SA1"],
      },
    },
  },
} as const;

export async function handleEnergySnapshot(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = energySnapshotSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/energy-snapshot",
      query: { region: input.region },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
