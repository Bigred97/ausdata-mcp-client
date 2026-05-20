import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleGenderPayContext } from "../../src/tools/gender-pay-context.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("gender_pay_context tool", () => {
  it("returns the gender pay snapshot with no industry", async () => {
    const result = await handleGenderPayContext(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.gender_pay_gap_pct).toBe(21.7);
  });

  it("passes the industry filter through", async () => {
    const result = await handleGenderPayContext(client(), { industry: "mining" });
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.industry).toBe("mining");
  });
});
