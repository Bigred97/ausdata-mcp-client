import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleYouthUnemployment } from "../../src/tools/youth-unemployment.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("youth_unemployment tool", () => {
  it("returns the youth vs overall snapshot", async () => {
    const result = await handleYouthUnemployment(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.youth_unemployment_rate_pct).toBe(9.2);
    expect(parsed.data.gap_pct).toBe(5.2);
  });
});
