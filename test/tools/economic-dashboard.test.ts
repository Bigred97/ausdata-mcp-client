import { describe, it, expect } from "vitest";
import { AusdataClient } from "../../src/client.js";
import { handleEconomicDashboard } from "../../src/tools/economic-dashboard.js";
import { loadConfig } from "../../src/config.js";
import { API_URL } from "../msw-handlers.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("economic_dashboard tool", () => {
  it("returns 5 headline indicators on success", async () => {
    const result = await handleEconomicDashboard(client(), { period: "latest" });
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data.cash_rate_pct).toBeDefined();
    expect(parsed.data.cpi_annual_pct).toBeDefined();
    expect(parsed.data.unemployment_rate_pct).toBeDefined();
    expect(parsed.data.wage_growth_annual_pct).toBeDefined();
    expect(parsed.data.lending_housing_change_qoq_pct).toBeDefined();
  });

  it("defaults to 'latest' when no period passed", async () => {
    const result = await handleEconomicDashboard(client(), {});
    expect(result).toHaveProperty("content");
  });

  it("accepts YYYY-Qn period", async () => {
    const result = await handleEconomicDashboard(client(), { period: "2024-Q4" });
    expect(result).toHaveProperty("content");
  });

  it("rejects garbage period values", async () => {
    const result = await handleEconomicDashboard(client(), { period: "yesterday" });
    expect(result).toHaveProperty("isError", true);
  });
});
