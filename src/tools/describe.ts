import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const describeSchema = z.object({
  dataset_id: z
    .string()
    .min(1)
    .describe("Dotted dataset ID, e.g. 'abs.LF', 'rba.F1.1', 'apra.ADI_KEY_STATS'"),
});

export type DescribeInput = z.infer<typeof describeSchema>;

export const describeTool = {
  name: "describe_dataset",
  description:
    "Returns the schema of a curated Australian government dataset: the available dimensions (filters), valid values per dimension, units, frequency, and source URL. Use this when get_data returns an 'Unknown filter' or 'Unknown value' error — the response tells you exactly which filter keys and values are accepted.",
  inputSchema: {
    type: "object",
    properties: {
      dataset_id: {
        type: "string",
        description:
          "Dotted dataset ID returned by search_datasets, e.g. 'abs.LF', 'rba.F1.1', 'apra.ADI_KEY_STATS'",
        examples: ["abs.LF", "rba.F1.1", "apra.ADI_KEY_STATS"],
      },
    },
    required: ["dataset_id"],
  },
} as const;

export async function handleDescribe(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = describeSchema.parse(rawInput);
    const dot = input.dataset_id.indexOf(".");
    if (dot <= 0) {
      return toMcpError(
        new Error(
          `dataset_id must be source-prefixed (e.g. 'abs.LF'). Got '${input.dataset_id}'. Use search_datasets to discover valid IDs.`,
        ),
      );
    }
    const source = input.dataset_id.slice(0, dot).toLowerCase();
    const datasetId = input.dataset_id.slice(dot + 1);

    const data = await client.request({
      method: "GET",
      path: `/v1/describe/${encodeURIComponent(source)}/${encodeURIComponent(datasetId)}`,
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
