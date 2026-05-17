import { http, HttpResponse } from "msw";

/**
 * Shared MSW handlers for happy-path tests. Each test file can override these
 * with `mswServer.use(...)` to simulate auth failures, rate limits, etc.
 */
export const API_URL = "https://api.test.ausdata.io";

function requireAuth(authHeader: string | null): HttpResponse | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return HttpResponse.json({ error: "missing or malformed Authorization" }, { status: 401 });
  }
  const token = authHeader.slice("Bearer ".length);
  if (token === "invalid_key") {
    return HttpResponse.json({ error: "invalid API key" }, { status: 401 });
  }
  return null;
}

export const handlers = [
  http.get(`${API_URL}/v1/search-datasets`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const limit = url.searchParams.get("limit") ?? "10";
    return HttpResponse.json({
      data: [
        {
          dataset_id: "abs.LF",
          source: "ABS",
          name: "Labour Force, Australia",
          relevance: 0.95,
        },
      ],
      meta: { endpoint: "/search-datasets", query: { q, limit: Number(limit) }, row_count: 1 },
    });
  }),

  http.get(`${API_URL}/v1/real-wages`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      data: [
        {
          period: "2024-Q4",
          wpi_annual_change_pct: 3.2,
          cpi_annual_change_pct: 2.4,
          real_wages_gap_pct: 0.8,
          real_wages_direction: "growing",
        },
      ],
      meta: { endpoint: "/real-wages", period: { start: "2024-Q1", end: "2024-Q4" }, row_count: 1 },
    });
  }),

  http.get(`${API_URL}/v1/economic-dashboard`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      data: {
        as_of: "2024-Q4",
        cash_rate_pct: 4.35,
        cpi_annual_pct: 2.4,
        unemployment_rate_pct: 4.0,
        wage_growth_annual_pct: 3.2,
        lending_housing_change_qoq_pct: 1.8,
      },
      meta: { endpoint: "/economic-dashboard" },
    });
  }),

  http.get(`${API_URL}/v1/data/:source/:datasetId`, ({ request, params }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      data: [{ period: "2024-12", value: 4.1, unit: "Percent" }],
      meta: {
        endpoint: `/v1/data/${params.source}/${params.datasetId}`,
        row_count: 1,
      },
    });
  }),

  http.get(`${API_URL}/v1/health`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      status: "ok",
      version: "1.0.0",
      quota: { remaining: 9421, limit: 10000 },
    });
  }),
];
