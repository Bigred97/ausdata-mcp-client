import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleRealCashRate } from "../../src/tools/real-cash-rate.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("real_cash_rate tool", () => {
  it("returns the real cash rate snapshot", async () => {
    const result = await handleRealCashRate(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.cash_rate_pct).toBe(4.35);
    expect(parsed.data.real_cash_rate_pct).toBe(0.85);
  });

  it("returns missing-key error when no AUSDATA_API_KEY", async () => {
    const result = await handleRealCashRate(client(null), {});
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("AUSDATA_API_KEY");
  });
});
