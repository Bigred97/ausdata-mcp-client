import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleCostOfLiving } from "../../src/tools/cost-of-living.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("cost_of_living tool", () => {
  it("returns the SLCI snapshot", async () => {
    const result = await handleCostOfLiving(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.cpi_annual_pct).toBe(2.4);
    expect(parsed.data.slci.employee).toBe(3.1);
  });
});
