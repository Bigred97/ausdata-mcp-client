import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

// Round-11 P2: accept BOTH dotted form (`abs.CPI_MONTHLY`) and the
// split form (`source="abs", dataset_id="CPI_MONTHLY"`) so the MCP
// surface mirrors the REST surface `/v1/data/{source}/{dataset_id}`.
// Customers reported the dotted-only requirement was confusing and
// inconsistent with the REST API.
const VALID_SOURCES = [
  "abs",
  "rba",
  "ato",
  "apra",
  "aihw",
  "asic",
  "aemo",
  "wgea",
  "au_weather",
] as const;

export const getDataSchema = z.object({
  dataset_id: z
    .string()
    .min(1)
    .describe(
      "Dataset ID. Two forms accepted: dotted ('abs.CPI_MONTHLY') OR bare ('CPI_MONTHLY' — then pass `source` separately).",
    ),
  source: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Source slug (abs/rba/ato/apra/aihw/asic/aemo/wgea/au_weather). Required when dataset_id is bare; optional when dataset_id is dotted.",
    ),
  filters: z.record(z.unknown()).optional(),
  start_period: z.string().optional(),
  end_period: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});

export type GetDataInput = z.infer<typeof getDataSchema>;

export const getDataTool = {
  name: "get_data",
  description:
    "Generic accessor for any curated Australian government dataset. Use search_datasets first to find the dataset_id, then call this with filters. Two input forms are accepted: dotted (`dataset_id='abs.CPI_MONTHLY'`) OR split (`source='abs', dataset_id='CPI_MONTHLY'`). Period format depends on the dataset: YYYY-MM for monthly, YYYY-Qn for quarterly, YYYY for annual. Example: dataset_id='abs.LF', filters={region:'australia', measure:'unemployment_rate'}, start_period='2024-01'.",
  inputSchema: {
    type: "object",
    properties: {
      dataset_id: {
        type: "string",
        description:
          "Dataset ID returned by search_datasets. Two forms accepted: dotted ('abs.CPI_MONTHLY', 'rba.F1.1') OR bare ('CPI_MONTHLY' — then pass `source` separately).",
        examples: ["abs.LF", "rba.F1.1", "apra.ADI_KEY_STATS", "CPI_MONTHLY"],
      },
      source: {
        type: "string",
        description:
          "Source slug. Required only when dataset_id is bare (no dot). One of: abs/rba/ato/apra/aihw/asic/aemo/wgea/au_weather.",
        examples: ["abs", "rba", "apra"],
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

/**
 * Resolve (source, datasetId) from the flexible input shape.
 *
 * Accepts:
 *   1. dataset_id="abs.CPI_MONTHLY"                      → ("abs", "CPI_MONTHLY")
 *   2. dataset_id="CPI_MONTHLY", source="abs"            → ("abs", "CPI_MONTHLY")
 *   3. dataset_id="abs.CPI_MONTHLY", source="abs"        → ("abs", "CPI_MONTHLY")
 *
 * Returns an Error if neither form yields a source.
 */
export function resolveSourceAndId(
  datasetId: string,
  source?: string,
): { source: string; datasetId: string } | Error {
  const dot = datasetId.indexOf(".");
  if (dot > 0) {
    // Dotted form. If `source` was also passed, the dotted prefix wins
    // (case-insensitive consistency check is not enforced — the REST
    // endpoint will 404 if the pair is invalid).
    return {
      source: datasetId.slice(0, dot).toLowerCase(),
      datasetId: datasetId.slice(dot + 1),
    };
  }
  if (source && source.trim()) {
    return { source: source.trim().toLowerCase(), datasetId };
  }
  return new Error(
    `Specify \`source\` (one of ${VALID_SOURCES.join("/")}) OR use dotted form like 'abs.${datasetId}'. Got dataset_id='${datasetId}' with no source.`,
  );
}

export async function handleGetData(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = getDataSchema.parse(rawInput);
    const resolved = resolveSourceAndId(input.dataset_id, input.source);
    if (resolved instanceof Error) {
      return toMcpError(resolved);
    }
    const { source, datasetId } = resolved;

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
