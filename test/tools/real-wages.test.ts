import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleRealWages } from "../../src/tools/real-wages.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("real_wages tool", () => {
  it("returns MCP content on default call", async () => {
    const result = await handleRealWages(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data[0].real_wages_gap_pct).toBe(0.8);
  });

  it("accepts valid quarter strings", async () => {
    const result = await handleRealWages(client(), {
      start: "2019-Q1",
      end: "2024-Q4",
      seasonal_adjustment: "trend",
    });
    expect(result).toHaveProperty("content");
  });

  it("rejects invalid quarter format", async () => {
    const result = await handleRealWages(client(), { start: "2019" });
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("YYYY-Qn");
  });

  it("rejects invalid seasonal_adjustment", async () => {
    const result = await handleRealWages(client(), {
      seasonal_adjustment: "bogus",
    });
    expect(result).toHaveProperty("isError", true);
  });

  it("returns missing-key error when no AUSDATA_API_KEY", async () => {
    const result = await handleRealWages(client(null), {});
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("AUSDATA_API_KEY");
  });
});
