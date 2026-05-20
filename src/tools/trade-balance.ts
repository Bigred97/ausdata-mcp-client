import { z } from "zod";
import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const tradeBalanceSchema = z.object({}).optional();

export const tradeBalanceTool = {
  name: "trade_balance",
  description:
    "Get the current AU trade balance: exports minus imports, with top trading partners and surplus/deficit trend. Use this when an agent is asked 'is Australia running a trade surplus?' or 'who are Australia's biggest trade partners?'. Sources ABS International Trade.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleTradeBalance(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/trade-balance",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
