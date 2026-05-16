import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer, API_URL } from "../setup.js";
import { AusdataClient } from "../../src/client.js";
import { handleGetData } from "../../src/tools/get-data.js";
import { loadConfig } from "../../src/config.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("get_data tool", () => {
  it("returns MCP content for valid request", async () => {
    const result = await handleGetData(client(), {
      dataset_id: "abs.LF",
      filters: { region: "nsw" },
      start_period: "2024-01",
      end_period: "2024-12",
    });
    expect(result).toHaveProperty("content");
    const parsed = JSON.parse((result as { content: { text: string }[] }).content[0].text);
    expect(parsed.data).toBeDefined();
  });

  it("rejects missing dataset_id", async () => {
    const result = await handleGetData(client(), { filters: {} });
    expect(result).toHaveProperty("isError", true);
  });

  it("passes filters as POST body", async () => {
    let received: unknown = null;
    mswServer.use(
      http.post(`${API_URL}/v1/get-data`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ data: [], meta: {} });
      }),
    );
    await handleGetData(client(), {
      dataset_id: "rba.F1.1",
      filters: { series: "FIRMMCRT" },
    });
    expect(received).toMatchObject({
      dataset_id: "rba.F1.1",
      filters: { series: "FIRMMCRT" },
    });
  });

  it("handles tier-blocked 403 with upgrade hint", async () => {
    mswServer.use(
      http.post(`${API_URL}/v1/get-data`, () => {
        return HttpResponse.json(
          { error: "this dataset requires Pro tier" },
          { status: 403 },
        );
      }),
    );
    const result = await handleGetData(client(), { dataset_id: "abs.LF" });
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("Access denied");
    expect(text).toContain("Pro tier");
  });
});
