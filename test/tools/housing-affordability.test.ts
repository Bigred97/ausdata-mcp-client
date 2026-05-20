import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleHousingAffordability } from "../../src/tools/housing-affordability.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("housing_affordability tool", () => {
  it("returns the housing affordability snapshot", async () => {
    const result = await handleHousingAffordability(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.price_to_income_ratio).toBe(8.6);
  });
});
