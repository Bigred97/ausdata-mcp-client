import { describe, it, expect } from "vitest";
import { createServer } from "../src/server.js";
import { getToolDefinitions } from "../src/tools/index.js";
import { loadConfig } from "../src/config.js";
import { API_URL } from "./msw-handlers.js";

function makeConfig(key?: string | null) {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return loadConfig(env as NodeJS.ProcessEnv);
}

describe("MCP server", () => {
  it("exposes the 28 expected tools (7 core + 8 Wave 1 + 13 Wave 2)", () => {
    const names = getToolDefinitions().map((t) => t.name);
    expect(names).toEqual([
      "search_datasets",
      "list_datasets",
      "describe_dataset",
      "real_wages",
      "economic_dashboard",
      "get_data",
      "health",
      "real_cash_rate",
      "gender_pay_context",
      "energy_snapshot",
      "cost_of_living",
      "youth_unemployment",
      "trade_balance",
      "housing_affordability",
      "releases",
      "real_mortgage_rate",
      "real_savings_rate",
      "regional_cost_of_living",
      "wage_vs_rent_gap",
      "super_fund_real_return",
      "sectoral_employment_shift",
      "bank_deposit_share",
      "charity_sector_health",
      "state_fiscal_snapshot",
      "inflation_decomposition",
      "release_pulse",
      "macro_snapshot_state",
      "nem_dispatch_5min",
    ]);
  });

  it("every tool has a description and inputSchema", () => {
    for (const tool of getToolDefinitions()) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema).toBeDefined();
      expect((tool.inputSchema as { type: string }).type).toBe("object");
    }
  });

  it("createServer instantiates without error", () => {
    const { server, client } = createServer(makeConfig());
    expect(server).toBeDefined();
    expect(client).toBeDefined();
    expect(client.hasKey).toBe(true);
  });

  it("createServer accepts missing api key (tools surface error at call time)", () => {
    const { server, client } = createServer(makeConfig(null));
    expect(server).toBeDefined();
    expect(client.hasKey).toBe(false);
  });

  it("required parameters are declared on schemas that need them", () => {
    const defs = getToolDefinitions();
    const search = defs.find((t) => t.name === "search_datasets")!;
    expect((search.inputSchema as { required: string[] }).required).toEqual(["q"]);

    const getData = defs.find((t) => t.name === "get_data")!;
    expect((getData.inputSchema as { required: string[] }).required).toEqual(["dataset_id"]);

    // health takes no required params
    const health = defs.find((t) => t.name === "health")!;
    const healthRequired = (health.inputSchema as { required?: string[] }).required;
    expect(healthRequired === undefined || healthRequired.length === 0).toBe(true);
  });

  it("each tool name follows snake_case verb_noun convention", () => {
    for (const tool of getToolDefinitions()) {
      // snake_case: lowercase letters + digits + underscores, must start with a letter.
      // Digits permitted to match REST surface (e.g. `nem_dispatch_5min` ↔ `/v1/nem-dispatch-5min`).
      expect(tool.name).toMatch(/^[a-z][a-z0-9_]+$/);
    }
  });
});
