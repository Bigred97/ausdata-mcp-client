/**
 * Runtime configuration loaded from environment.
 *
 * AUSDATA_API_KEY  - required for any tool that hits the API. Missing key
 *                    surfaces a clear MCP error to the agent rather than a
 *                    runtime crash.
 * AUSDATA_BASE_URL - override the base URL (default: https://api.ausdata.io).
 *                    AUSDATA_API_URL accepted as an alias for backwards compat.
 * AUSDATA_TIMEOUT  - per-request timeout in ms (default: 30000).
 */
export interface Config {
  apiKey: string | undefined;
  apiUrl: string;
  timeoutMs: number;
  serverVersion: string;
}

export const SERVER_VERSION = "0.3.0";
export const DEFAULT_API_URL = "https://api.ausdata.io";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const urlFromEnv =
    env.AUSDATA_BASE_URL?.trim() || env.AUSDATA_API_URL?.trim() || "";
  return {
    apiKey: env.AUSDATA_API_KEY?.trim() || undefined,
    apiUrl: (urlFromEnv || DEFAULT_API_URL).replace(/\/+$/, ""),
    timeoutMs: Number.parseInt(env.AUSDATA_TIMEOUT ?? "30000", 10) || 30000,
    serverVersion: SERVER_VERSION,
  };
}
