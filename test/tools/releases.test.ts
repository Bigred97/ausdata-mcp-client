import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleReleases } from "../../src/tools/releases.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("releases tool", () => {
  it("returns the upcoming release calendar with defaults", async () => {
    const result = await handleReleases(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data[0].dataset_id).toBe("abs.CPI");
    expect(parsed.meta.query.days_ahead).toBe(30);
  });

  it("passes days_ahead and source through", async () => {
    const result = await handleReleases(client(), { days_ahead: 7, source: "abs" });
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.meta.query.days_ahead).toBe(7);
    expect(parsed.meta.query.source).toBe("abs");
  });

  it("rejects days_ahead out of range", async () => {
    const result = await handleReleases(client(), { days_ahead: 200 });
    expect(result).toHaveProperty("isError", true);
  });

  it("rejects invalid source", async () => {
    const result = await handleReleases(client(), { source: "ato" });
    expect(result).toHaveProperty("isError", true);
  });
});
