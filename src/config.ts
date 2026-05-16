/**
 * Runtime configuration loaded from environment.
 *
 * AUSDATA_API_KEY  - required for any tool that hits the API. Missing key
 *                    surfaces a clear MCP error to the agent rather than a
 *                    runtime crash.
 * AUSDATA_API_URL  - override the base URL (default: https://api.ausdata.io).
 *                    Tests inject this to point at msw fixtures.
 * AUSDATA_TIMEOUT  - per-request timeout in ms (default: 30000).
 */
export interface Config {
  apiKey: string | undefined;
  apiUrl: string;
  timeoutMs: number;
  serverVersion: string;
}

export const SERVER_VERSION = "0.1.0";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    apiKey: env.AUSDATA_API_KEY?.trim() || undefined,
    apiUrl: (env.AUSDATA_API_URL?.trim() || "https://api.ausdata.io").replace(/\/+$/, ""),
    timeoutMs: Number.parseInt(env.AUSDATA_TIMEOUT ?? "30000", 10) || 30000,
    serverVersion: SERVER_VERSION,
  };
}
