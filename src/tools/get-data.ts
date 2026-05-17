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
  limit: z.number().int().min(1).max(1000).optional(),
});

export type GetDataInput = z.infer<typeof getDataSchema>;

export const getDataTool = {
  name: "get_data",
  description:
    "Generic accessor for any curated Australian government dataset. Use search_datasets first to find the dataset_id, then call this with filters. Period format depends on the dataset: YYYY-MM for monthly, YYYY-Qn for quarterly, YYYY for annual. Example: dataset_id='abs.LF', filters={region:'australia', measure:'unemployment_rate'}, start_period='2024-01'.",
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
          "Filter dict — source-specific dimension keys passed through to the upstream sister MCP. Example: {\"region\": \"australia\", \"measure\": \"unemployment_rate\"} for abs.LF.",
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
      limit: {
        type: "integer",
        description: "Max rows (1-1000). Default 100.",
        minimum: 1,
        maximum: 1000,
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
    const dot = input.dataset_id.indexOf(".");
    if (dot <= 0) {
      return toMcpError(
        new Error(
          `dataset_id must be source-prefixed (e.g. 'abs.LF', 'rba.F1.1'). Got '${input.dataset_id}'. Use search_datasets to discover valid IDs.`,
        ),
      );
    }
    const source = input.dataset_id.slice(0, dot).toLowerCase();
    const datasetId = input.dataset_id.slice(dot + 1);

    const query: Record<string, string | number | undefined> = {
      limit: input.limit,
      start: input.start_period,
      end: input.end_period,
    };
    if (input.filters) {
      for (const [k, v] of Object.entries(input.filters)) {
        if (v !== undefined && v !== null) {
          query[k] = typeof v === "string" || typeof v === "number" ? v : String(v);
        }
      }
    }

    const data = await client.request({
      method: "GET",
      path: `/v1/data/${encodeURIComponent(source)}/${encodeURIComponent(datasetId)}`,
      query,
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
