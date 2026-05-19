import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const sectoralEmploymentShiftTool = {
  name: "sectoral_employment_shift",
  description:
    "Returns the AU sectoral employment shift — year-on-year change in employed persons by ANZSIC industry division. Single call answers 'which industries are hiring and which are shedding?'. Sources ABS Labour Force Detailed. Returns per-industry deltas (absolute + percentage), share of total employment, and a sorted ranking of growth/decline. Useful for labour-market narrative and career-pivot queries.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleSectoralEmploymentShift(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/sectoral-employment-shift",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
