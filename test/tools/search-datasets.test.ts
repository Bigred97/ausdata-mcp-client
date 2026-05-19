import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer, API_URL } from "../setup.js";
import { AusdataClient } from "../../src/client.js";
import { handleSearchDatasets } from "../../src/tools/search-datasets.js";
import { loadConfig } from "../../src/config.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("search_datasets tool", () => {
  it("returns MCP content array on success", async () => {
    const result = await handleSearchDatasets(client(), { q: "unemployment nsw" });
    expect(result).toHaveProperty("content");
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.data[0].dataset_id).toBe("abs.LF");
  });

  it("returns MCP error when q is missing", async () => {
    const result = await handleSearchDatasets(client(), {});
    expect(result).toHaveProperty("isError", true);
  });

  it("returns MCP error when API key is missing", async () => {
    const result = await handleSearchDatasets(client(null), { q: "test" });
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("AUSDATA_API_KEY");
  });

  it("returns helpful error on 401", async () => {
    const result = await handleSearchDatasets(client("invalid_key"), { q: "test" });
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("invalid");
  });

  it("returns rate-limit error on 429", async () => {
    mswServer.use(
      http.get(`${API_URL}/v1/search-datasets`, () => {
        return HttpResponse.json(
          { error: "rate limited" },
          { status: 429, headers: { "Retry-After": "30" } },
        );
      }),
    );
    const result = await handleSearchDatasets(client(), { q: "test" });
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("Rate limit");
    expect(text).toContain("30");
  });

  it("surfaces upstream detail on 5xx (0.3.3)", async () => {
    // 0.3.3: 5xx errors now include the upstream detail rather than
    // a generic "having trouble" message, so LLM agents can recover.
    // The client now also retries once on 5xx, so both responses below
    // need to be 5xx for the final error to bubble.
    mswServer.use(
      http.get(`${API_URL}/v1/search-datasets`, () => {
        return HttpResponse.json({ error: "down" }, { status: 503 });
      }),
    );
    const result = await handleSearchDatasets(client(), { q: "test" });
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("HTTP 503");
    expect(text).toContain("down");
  });
});
