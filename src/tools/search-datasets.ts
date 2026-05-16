import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const searchDatasetsSchema = z.object({
  q: z
    .string()
    .min(1, "q must be a non-empty search string")
    .describe("Search query in plain English, e.g. 'unemployment NSW' or 'banking statistics'"),
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

export type SearchDatasetsInput = z.infer<typeof searchDatasetsSchema>;

export const searchDatasetsTool = {
  name: "search_datasets",
  description:
    "Search the catalog of curated Australian government datasets. Returns matched datasets with their IDs, sources, and example queries. Use this when you don't know the exact dataset_id for the data you need. Examples: 'unemployment nsw', 'housing approvals', 'cash rate'.",
  inputSchema: {
    type: "object",
    properties: {
      q: {
        type: "string",
        description:
          "Search query in plain English, e.g. 'unemployment NSW' or 'banking statistics'",
        examples: ["unemployment nsw", "housing approvals", "cash rate"],
      },
      limit: {
        type: "integer",
        default: 10,
        minimum: 1,
        maximum: 50,
        description: "Max results (1-50). Defaults to 10.",
      },
    },
    required: ["q"],
  },
} as const;

export async function handleSearchDatasets(
  client: AusdataClient,
  rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const input = searchDatasetsSchema.parse(rawInput);
    const data = await client.request({
      method: "GET",
      path: "/v1/search-datasets",
      query: { q: input.q, limit: input.limit ?? 10 },
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
