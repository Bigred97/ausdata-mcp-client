import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

const STATE_RE = /^(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)$/;

export const stateFiscalSnapshotSchema = z.object({
  state: z
    .string()
    .regex(STATE_RE, "state must be one of NSW, VIC, QLD, SA, WA, TAS, NT, ACT")
    .optional(),
});

export type StateFiscalSnapshotInput = z.infer<typeof stateFiscalSnapshotSchema>;

export const stateFiscalSnapshotTool = {
  name: "state_fiscal_snapshot",
  description:
    "Returns the AU state/territory fiscal snapshot — Government Finance Statistics (GFS) by jurisdiction: revenue, expenses, net operating balance, net debt. Single call answers 'what's the fiscal position of <state>?' or 'which state is running the largest deficit?'. Sources ABS GFS. Pass a single state code to focus on one jurisdiction, or omit for all eight states/territories.",
  inputSchema: {
    type: "object",
    properties: {
      state: {
        type: "string",
        enum: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"],
        description:
          "Australian state/territory code (NSW, VIC, QLD, SA, WA, TAS, NT, ACT). Omit for all jurisdictions.",
        examples: ["NSW", "VIC", "WA"],
      },
    },
  },
} as const;

export async function handleStateFiscalSnapshot(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = stateFiscalSnapshotSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/state-fiscal-snapshot",
      query: { state: input.state },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
