import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

const STATE_RE = /^(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)$/;

export const macroSnapshotStateSchema = z.object({
  state: z
    .string()
    .regex(STATE_RE, "state must be one of NSW, VIC, QLD, SA, WA, TAS, NT, ACT")
    .optional(),
});

export type MacroSnapshotStateInput = z.infer<typeof macroSnapshotStateSchema>;

export const macroSnapshotStateTool = {
  name: "macro_snapshot_state",
  description:
    "Returns the AU state-level macroeconomic snapshot — unemployment rate, state final demand growth, dwelling-price change, CPI (where state-level is published), and population growth for a given state. Single call answers 'how is <state> tracking economically?'. Cross-sources ABS labour-force, national-accounts, residential-property indexes. Pass a state code to focus on one jurisdiction; omit for all eight states/territories.",
  inputSchema: {
    type: "object",
    properties: {
      state: {
        type: "string",
        enum: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"],
        description:
          "Australian state/territory code (NSW, VIC, QLD, SA, WA, TAS, NT, ACT). Omit for all jurisdictions.",
        examples: ["NSW", "VIC", "QLD"],
      },
    },
  },
} as const;

export async function handleMacroSnapshotState(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = macroSnapshotStateSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/macro-snapshot-state",
      query: { state: input.state },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
