import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleTradeBalance } from "../../src/tools/trade-balance.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("trade_balance tool", () => {
  it("returns the trade balance snapshot", async () => {
    const result = await handleTradeBalance(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.trade_balance_aud_bn).toBe(5.7);
    expect(parsed.data.status).toBe("surplus");
  });
});
