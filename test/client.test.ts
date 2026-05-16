import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer, API_URL } from "./setup.js";
import { AusdataClient } from "../src/client.js";
import { ApiError, MissingApiKeyError } from "../src/lib/errors.js";
import { loadConfig } from "../src/config.js";

function makeClient(key?: string | null): AusdataClient {
  const finalKey = key === null ? undefined : (key ?? "test_key");
  const env = { AUSDATA_API_URL: API_URL } as Record<string, string | undefined>;
  if (finalKey !== undefined) env.AUSDATA_API_KEY = finalKey;
  return new AusdataClient(loadConfig(env as NodeJS.ProcessEnv));
}

describe("AusdataClient", () => {
  it("sends Authorization header with bearer token", async () => {
    let receivedAuth: string | null = null;
    mswServer.use(
      http.get(`${API_URL}/v1/health`, ({ request }) => {
        receivedAuth = request.headers.get("authorization");
        return HttpResponse.json({ status: "ok" });
      }),
    );
    const client = makeClient("ak_live_123");
    await client.request({ method: "GET", path: "/v1/health" });
    expect(receivedAuth).toBe("Bearer ak_live_123");
  });

  it("throws MissingApiKeyError when key is undefined", async () => {
    const client = makeClient(null);
    await expect(
      client.request({ method: "GET", path: "/v1/health" }),
    ).rejects.toBeInstanceOf(MissingApiKeyError);
  });

  it("throws ApiError with status 401 for invalid key", async () => {
    const client = makeClient("invalid_key");
    await expect(
      client.request({ method: "GET", path: "/v1/health" }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("parses retry-after header on 429", async () => {
    mswServer.use(
      http.get(`${API_URL}/v1/health`, () => {
        return HttpResponse.json(
          { error: "rate limited" },
          { status: 429, headers: { "Retry-After": "120" } },
        );
      }),
    );
    const client = makeClient();
    try {
      await client.request({ method: "GET", path: "/v1/health" });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(429);
      expect((err as ApiError).retryAfterSec).toBe(120);
    }
  });

  it("converts 5xx into ApiError with status", async () => {
    mswServer.use(
      http.get(`${API_URL}/v1/health`, () => {
        return HttpResponse.json({ error: "down" }, { status: 503 });
      }),
    );
    const client = makeClient();
    await expect(
      client.request({ method: "GET", path: "/v1/health" }),
    ).rejects.toMatchObject({ status: 503 });
  });

  it("serializes query params", async () => {
    let receivedUrl = "";
    mswServer.use(
      http.get(`${API_URL}/v1/search-datasets`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ data: [], meta: {} });
      }),
    );
    const client = makeClient();
    await client.request({
      method: "GET",
      path: "/v1/search-datasets",
      query: { q: "housing nsw", limit: 5 },
    });
    expect(receivedUrl).toContain("q=housing+nsw");
    expect(receivedUrl).toContain("limit=5");
  });

  it("serializes POST body as JSON", async () => {
    let receivedBody: unknown = null;
    mswServer.use(
      http.post(`${API_URL}/v1/get-data`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ data: [], meta: {} });
      }),
    );
    const client = makeClient();
    await client.request({
      method: "POST",
      path: "/v1/get-data",
      body: { dataset_id: "abs.LF", filters: { region: "nsw" } },
    });
    expect(receivedBody).toEqual({ dataset_id: "abs.LF", filters: { region: "nsw" } });
  });

  it("hasKey reflects config", () => {
    expect(makeClient("k").hasKey).toBe(true);
    expect(makeClient(null).hasKey).toBe(false);
  });
});
