import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleEnergySnapshot } from "../../src/tools/energy-snapshot.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("energy_snapshot tool", () => {
  it("returns the NEM snapshot for no region", async () => {
    const result = await handleEnergySnapshot(client(), {});
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.spot_price_aud_per_mwh).toBe(87.5);
  });

  it("accepts a valid region", async () => {
    const result = await handleEnergySnapshot(client(), { region: "NSW1" });
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.region).toBe("NSW1");
  });

  it("rejects an invalid region", async () => {
    const result = await handleEnergySnapshot(client(), { region: "WA1" });
    expect(result).toHaveProperty("isError", true);
  });
});
