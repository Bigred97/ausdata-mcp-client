/**
 * Format an API response as an MCP text content block.
 *
 * AI agents read JSON text well; we keep the formatting simple and stable so
 * Claude / Cursor / Windsurf all parse it consistently. We do NOT try to
 * pretty-render — the agent can do that.
 */
export interface McpSuccessResponse {
  content: Array<{ type: "text"; text: string }>;
}

export function mcpJson(payload: unknown): McpSuccessResponse {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}
