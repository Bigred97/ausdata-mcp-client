import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const genderPayContextSchema = z.object({
  industry: z
    .string()
    .min(1)
    .optional()
    .describe("ANZSIC industry name, letter, or division code (e.g. 'mining', 'B', 'financial')"),
});

export type GenderPayContextInput = z.infer<typeof genderPayContextSchema>;

export const genderPayContextTool = {
  name: "gender_pay_context",
  description:
    "Get the AU gender pay gap with industry context in one call. Combines WGEA national + industry gender pay gap data with ABS labour-force composition. Use this when an agent is asked 'what's the pay gap in <industry>?' or comparing AU industries on gender equity. Cross-sources WGEA + ABS.",
  inputSchema: {
    type: "object",
    properties: {
      industry: {
        type: "string",
        description:
          "Optional ANZSIC industry filter. Accepts industry name, ANZSIC division letter (A-S), or code. Omit for national-level data.",
        examples: ["mining", "B", "financial services", "health care"],
      },
    },
  },
} as const;

export async function handleGenderPayContext(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = genderPayContextSchema.parse(rawInput ?? {});
    const data = await client.request({
      method: "GET",
      path: "/v1/gender-pay-context",
      query: { industry: input.industry },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
