import type { AusdataClient } from "../client.js";
import { mcpJson, type McpSuccessResponse } from "../lib/format.js";
import { toMcpError, type McpErrorResponse } from "../lib/errors.js";

export const bankDepositShareTool = {
  name: "bank_deposit_share",
  description:
    "Returns the AU bank-deposit market-share snapshot — APRA Monthly Authorised Deposit-taking Institutions (ADI) statistics aggregated by parent group. Single call answers 'who holds the deposits in Australia right now?'. Sources APRA. Returns deposit totals per ADI, market-share percentages, and the top-N concentration (Big Four share). Useful for banking-competition and concentration-risk analysis.",
  inputSchema: {
    type: "object",
    properties: {},
  },
} as const;

export async function handleBankDepositShare(
  client: AusdataClient,
  _rawInput: unknown,
): Promise<McpSuccessResponse | McpErrorResponse> {
  try {
    const data = await client.request({
      method: "GET",
      path: "/v1/bank-deposit-share",
    });
    return mcpJson(data);
  } catch (err) {
    return toMcpError(err);
  }
}
