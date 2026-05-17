import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer, API_URL } from "../setup.js";
import { AusdataClient } from "../../src/client.js";
import { handleListDatasets } from "../../src/tools/list-datasets.js";
import { loadConfig } from "../../src/config.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("list_datasets tool", () => {
  it("GETs /v1/datasets/<source>", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/datasets/:source`, ({ request, params }) => {
        receivedUrl = request.url;
        return HttpResponse.json({
          data: [{ id: "LF" }, { id: "CPI" }],
          meta: { source: params.source, row_count: 2 },
        });
      }),
    );
    const result = await handleListDatasets(client(), { source: "abs" });
    expect(result).toHaveProperty("content");
    expect(receivedUrl).toContain("/v1/datasets/abs");
  });

  it("lowercases the source", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/datasets/:source`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ data: [], meta: {} });
      }),
    );
    await handleListDatasets(client(), { source: "ABS" });
    expect(receivedUrl).toContain("/v1/datasets/abs");
  });

  it("rejects missing source", async () => {
    const result = await handleListDatasets(client(), {});
    expect(result).toHaveProperty("isError", true);
  });
});
