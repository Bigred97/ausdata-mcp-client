/**
 * End-to-end stdio transport test. Spawns the built binary, exchanges
 * JSON-RPC over stdin/stdout, confirms tools/list returns the 5 tools and
 * tools/call returns content. msw doesn't intercept across processes — this
 * test only goes as far as confirming the protocol shape; auth errors are
 * the path exercised because we don't proxy fetch to msw from the subprocess.
 */
import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(__dirname, "..", "bin", "run.js");

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: number;
  result?: unknown;
  error?: { code: number; message: string };
}

async function rpc(messages: object[]): Promise<JsonRpcResponse[]> {
  return new Promise((resolveP, rejectP) => {
    const proc = spawn("node", [BIN], {
      env: {
        ...process.env,
        AUSDATA_API_KEY: "test_key",
        // Point at a non-routable URL so the tool call surfaces a network
        // error response (still a structured MCP result, not a crash).
        AUSDATA_API_URL: "http://127.0.0.1:1",
        AUSDATA_TIMEOUT: "2000",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", () => {
      /* discard logs */
    });
    proc.on("error", rejectP);
    proc.on("close", () => {
      const responses = stdout
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .map((l) => JSON.parse(l) as JsonRpcResponse);
      resolveP(responses);
    });

    for (const m of messages) {
      proc.stdin.write(JSON.stringify(m) + "\n");
    }
    setTimeout(() => proc.kill(), 3000);
  });
}

describe("stdio transport", () => {
  it("responds to initialize + tools/list with 6 tools", async () => {
    const responses = await rpc([
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "smoke", version: "0.0.1" },
        },
      },
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    ]);

    const init = responses.find((r) => r.id === 1);
    expect(init?.result).toMatchObject({
      serverInfo: { name: "ausdata-mcp" },
    });

    const list = responses.find((r) => r.id === 2);
    expect(list).toBeDefined();
    const tools = (list?.result as { tools: { name: string }[] }).tools;
    expect(tools.map((t) => t.name)).toEqual([
      "search_datasets",
      "describe_dataset",
      "real_wages",
      "economic_dashboard",
      "get_data",
      "health",
    ]);
  }, 10000);

  it("tools/call returns an MCP content response (isError on unreachable api)", async () => {
    const responses = await rpc([
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "smoke", version: "0.0.1" },
        },
      },
      { jsonrpc: "2.0", method: "notifications/initialized" },
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "health", arguments: {} },
      },
    ]);

    const call = responses.find((r) => r.id === 2);
    expect(call).toBeDefined();
    // Either isError true (network failed) or a content array — both are
    // valid MCP-shaped responses. We never want the JSON-RPC error path.
    expect(call?.error).toBeUndefined();
    const result = call?.result as { content?: unknown[]; isError?: boolean };
    expect(Array.isArray(result.content)).toBe(true);
  }, 10000);
});
