import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const getDataSchema = z.object({
  dataset_id: z
    .string()
    .min(1)
    .describe("Dotted dataset ID, e.g. 'abs.LF', 'rba.F1.1', 'apra.ADI_KEY_STATS'"),
  filters: z.record(z.unknown()).optional(),
  start_period: z.string().optional(),
  end_period: z.string().optional(),
});

export type GetDataInput = z.infer<typeof getDataSchema>;

export const getDataTool = {
  name: "get_data",
  description:
    "Generic accessor for any curated Australian government dataset. Use search_datasets first to find the dataset_id, then call this with filters. Period format depends on the dataset: YYYY-MM for monthly, YYYY-Qn for quarterly, YYYY for annual. Example: dataset_id='abs.LF', filters={region:'nsw'}, start_period='2024-01'.",
  inputSchema: {
    type: "object",
    properties: {
      dataset_id: {
        type: "string",
        description:
          "Dotted dataset ID returned by search_datasets, e.g. 'abs.LF', 'rba.F1.1', 'apra.ADI_KEY_STATS'",
        examples: ["abs.LF", "rba.F1.1", "apra.ADI_KEY_STATS"],
      },
      filters: {
        type: "object",
        description:
          "Filter dict, dataset-specific. Run describe via search_datasets first to see valid filters. Example: {\"region\": \"nsw\", \"measure\": \"unemployment_rate\"}",
        additionalProperties: true,
      },
      start_period: {
        type: "string",
        description: "Start period in dataset's native format (YYYY, YYYY-MM, YYYY-Qn).",
        examples: ["2024", "2024-01", "2024-Q1"],
      },
      end_period: {
        type: "string",
        description: "End period in dataset's native format.",
        examples: ["2024-12", "2024-Q4"],
      },
    },
    required: ["dataset_id"],
  },
} as const;

export async function handleGetData(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = getDataSchema.parse(rawInput);
    const data = await client.request({
      method: "POST",
      path: "/v1/get-data",
      body: {
        dataset_id: input.dataset_id,
        filters: input.filters ?? {},
        start_period: input.start_period,
        end_period: input.end_period,
      },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
