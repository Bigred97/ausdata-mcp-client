import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const listDatasetsSchema = z.object({
  source: z
    .string()
    .min(1)
    .describe(
      "One of: abs, rba, ato, apra, aihw, asic, aemo, wgea (au_weather is location-based and not in this list).",
    ),
});

export type ListDatasetsInput = z.infer<typeof listDatasetsSchema>;

export const listDatasetsTool = {
  name: "list_datasets",
  description:
    "Enumerate every curated dataset a source exposes (e.g. all ABS datasets, all RBA tables). Use this for surveying what's available before picking one to describe or fetch. Pairs with search_datasets (free-text discovery), describe_dataset (schema), and get_data (fetch).",
  inputSchema: {
    type: "object",
    properties: {
      source: {
        type: "string",
        description:
          "Source name. One of: abs, rba, ato, apra, aihw, asic, aemo, wgea.",
        examples: ["abs", "rba", "apra"],
        enum: ["abs", "rba", "ato", "apra", "aihw", "asic", "aemo", "wgea"],
      },
    },
    required: ["source"],
  },
} as const;

export async function handleListDatasets(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = listDatasetsSchema.parse(rawInput);
    const data = await client.request({
      method: "GET",
      path: `/v1/datasets/${encodeURIComponent(input.source.toLowerCase())}`,
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
