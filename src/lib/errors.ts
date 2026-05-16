/**
 * Error helpers. Tools must NEVER throw — they must return MCP-format errors
 * so AI agents can recover and explain to the user what went wrong.
 */

export interface ApiErrorContext {
  status: number;
  body: unknown;
  retryAfterSec?: number;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;
  public readonly retryAfterSec?: number;

  constructor(message: string, ctx: ApiErrorContext) {
    super(message);
    this.name = "ApiError";
    this.status = ctx.status;
    this.body = ctx.body;
    this.retryAfterSec = ctx.retryAfterSec;
  }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("AUSDATA_API_KEY missing");
    this.name = "MissingApiKeyError";
  }
}

/**
 * MCP tool error response shape. Per spec: `isError: true` plus a text content
 * block. AI agents treat this as a recoverable error and can show it to the
 * user.
 */
export interface McpErrorResponse {
  isError: true;
  content: Array<{ type: "text"; text: string }>;
}

export function mcpError(message: string): McpErrorResponse {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

export function missingKeyError(): McpErrorResponse {
  return mcpError(
    "Set AUSDATA_API_KEY in your MCP config. Get a free key at https://ausdata.io",
  );
}

export function toMcpError(err: unknown): McpErrorResponse {
  if (err instanceof MissingApiKeyError) {
    return missingKeyError();
  }
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return mcpError(
        "AUSDATA_API_KEY is invalid. Get a fresh one at https://ausdata.io/dashboard",
      );
    }
    if (err.status === 403) {
      const reason = extractMessage(err.body) ?? "this tool requires a higher tier";
      return mcpError(
        `Access denied: ${reason}. Upgrade at https://ausdata.io/pricing`,
      );
    }
    if (err.status === 429) {
      const after = err.retryAfterSec ?? 60;
      return mcpError(
        `Rate limit hit. Retry in ${after} seconds, or upgrade your plan at https://ausdata.io/pricing`,
      );
    }
    if (err.status >= 500) {
      return mcpError(
        "ausdata.io is having trouble, try again in a moment. Status: https://ausdata.io/status",
      );
    }
    if (err.status >= 400) {
      const reason = extractMessage(err.body) ?? err.message;
      return mcpError(`Request rejected (${err.status}): ${reason}`);
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  return mcpError(`Unexpected error: ${msg}`);
}

function extractMessage(body: unknown): string | undefined {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.error === "string") return b.error;
    if (typeof b.message === "string") return b.message;
    if (typeof b.detail === "string") return b.detail;
  }
  return undefined;
}
