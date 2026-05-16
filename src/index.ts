/**
 * Bootstrap. Loads config, starts the stdio MCP server.
 *
 * Anything that throws here is fatal — the wrapper in bin/run.js writes the
 * message to stderr and exits non-zero so the user's MCP client surfaces the
 * connection failure properly.
 */
import { loadConfig } from "./config.js";
import { startStdio } from "./server.js";

export { createServer, startStdio } from "./server.js";
export { AusdataClient } from "./client.js";
export { loadConfig } from "./config.js";
export { TOOLS, getToolDefinitions, findTool } from "./tools/index.js";

export async function main(): Promise<void> {
  const config = loadConfig();
  await startStdio(config);
}
