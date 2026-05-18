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

  it("forwards filters as query params on /v1/data/{source}/{id}", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/data/:source/:datasetId`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ data: [], meta: {} });
      }),
    );
    await handleGetData(client(), {
      dataset_id: "rba.F1.1",
      filters: { series: "FIRMMCRT" },
    });
    expect(receivedUrl).toContain("/v1/data/rba/F1.1");
    expect(receivedUrl).toContain("series=FIRMMCRT");
  });

  it("handles tier-blocked 403 with upgrade hint", async () => {
    mswServer.use(
      http.get(`${API_URL}/v1/data/:source/:datasetId`, () => {
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

  it("rejects bare dataset_id when no source is supplied", async () => {
    const result = await handleGetData(client(), { dataset_id: "LF" });
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toMatch(/source/i);
    expect(text).toMatch(/dotted/i);
  });

  it("accepts dotted dataset_id form (abs.CPI_MONTHLY)", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/data/:source/:datasetId`, ({ request, params }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ data: [], meta: { params } });
      }),
    );
    const result = await handleGetData(client(), {
      dataset_id: "abs.CPI_MONTHLY",
    });
    expect(result).toHaveProperty("content");
    expect(receivedUrl).toContain("/v1/data/abs/CPI_MONTHLY");
  });

  it("accepts split form (dataset_id + source separately)", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/data/:source/:datasetId`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ data: [], meta: {} });
      }),
    );
    const result = await handleGetData(client(), {
      dataset_id: "CPI_MONTHLY",
      source: "abs",
    });
    expect(result).toHaveProperty("content");
    expect(receivedUrl).toContain("/v1/data/abs/CPI_MONTHLY");
  });

  it("dotted prefix wins when both dotted dataset_id and source are passed", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/data/:source/:datasetId`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ data: [], meta: {} });
      }),
    );
    // dotted prefix "abs" should win over the explicit `source: rba`.
    await handleGetData(client(), {
      dataset_id: "abs.CPI_MONTHLY",
      source: "rba",
    });
    expect(receivedUrl).toContain("/v1/data/abs/CPI_MONTHLY");
  });

  it("normalises source casing", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/data/:source/:datasetId`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ data: [], meta: {} });
      }),
    );
    await handleGetData(client(), {
      dataset_id: "CPI_MONTHLY",
      source: "ABS",
    });
    expect(receivedUrl).toContain("/v1/data/abs/CPI_MONTHLY");
  });
});
