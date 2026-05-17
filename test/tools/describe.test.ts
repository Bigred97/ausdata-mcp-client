import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer, API_URL } from "../setup.js";
import { AusdataClient } from "../../src/client.js";
import { handleDescribe } from "../../src/tools/describe.js";
import { loadConfig } from "../../src/config.js";

function client(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("describe_dataset tool", () => {
  it("routes to /v1/describe/<source>/<id>", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/describe/:source/:datasetId`, ({ request, params }) => {
        receivedUrl = request.url;
        return HttpResponse.json({
          data: { id: params.datasetId, dimensions: [{ name: "region" }] },
          meta: { source: params.source },
        });
      }),
    );
    const result = await handleDescribe(client(), { dataset_id: "abs.LF" });
    expect(result).toHaveProperty("content");
    expect(receivedUrl).toContain("/v1/describe/abs/LF");
  });

  it("rejects unprefixed dataset_id", async () => {
    const result = await handleDescribe(client(), { dataset_id: "LF" });
    expect(result).toHaveProperty("isError", true);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toMatch(/source-prefixed/i);
  });

  it("rejects missing dataset_id", async () => {
    const result = await handleDescribe(client(), {});
    expect(result).toHaveProperty("isError", true);
  });
});
