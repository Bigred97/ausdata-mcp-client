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

  http.get(`${API_URL}/v1/real-cash-rate`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      data: {
        as_of: "2024-Q4",
        cash_rate_pct: 4.35,
        cpi_annual_pct: 3.5,
        real_cash_rate_pct: 0.85,
        stance: "restrictive",
      },
      meta: { endpoint: "/real-cash-rate" },
    });
  }),

  http.get(`${API_URL}/v1/gender-pay-context`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    const url = new URL(request.url);
    return HttpResponse.json({
      data: {
        industry: url.searchParams.get("industry"),
        gender_pay_gap_pct: 21.7,
        female_share_of_employment_pct: 47.4,
      },
      meta: { endpoint: "/gender-pay-context" },
    });
  }),

  http.get(`${API_URL}/v1/energy-snapshot`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    const url = new URL(request.url);
    return HttpResponse.json({
      data: {
        region: url.searchParams.get("region") ?? "NEM",
        spot_price_aud_per_mwh: 87.5,
        demand_mw: 21450,
        renewable_share_pct: 37.2,
      },
      meta: { endpoint: "/energy-snapshot" },
    });
  }),

  http.get(`${API_URL}/v1/cost-of-living`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      data: {
        as_of: "2024-Q4",
        cpi_annual_pct: 2.4,
        slci: {
          employee: 3.1,
          pensioner: 2.8,
          self_funded_retiree: 2.5,
        },
      },
      meta: { endpoint: "/cost-of-living" },
    });
  }),

  http.get(`${API_URL}/v1/youth-unemployment`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      data: {
        as_of: "2024-12",
        youth_unemployment_rate_pct: 9.2,
        overall_unemployment_rate_pct: 4.0,
        gap_pct: 5.2,
      },
      meta: { endpoint: "/youth-unemployment" },
    });
  }),

  http.get(`${API_URL}/v1/trade-balance`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      data: {
        as_of: "2024-12",
        exports_aud_bn: 47.2,
        imports_aud_bn: 41.5,
        trade_balance_aud_bn: 5.7,
        status: "surplus",
      },
      meta: { endpoint: "/trade-balance" },
    });
  }),

  http.get(`${API_URL}/v1/housing-affordability`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    return HttpResponse.json({
      data: {
        as_of: "2024-Q4",
        median_dwelling_price_aud: 820000,
        median_household_income_aud: 95000,
        price_to_income_ratio: 8.6,
        mortgage_serviceability_pct: 38.4,
      },
      meta: { endpoint: "/housing-affordability" },
    });
  }),

  http.get(`${API_URL}/v1/releases`, ({ request }) => {
    const auth = requireAuth(request.headers.get("authorization"));
    if (auth) return auth;
    const url = new URL(request.url);
    return HttpResponse.json({
      data: [
        {
          date: "2026-05-28",
          source: "abs",
          dataset_id: "abs.CPI",
          event_type: "release",
          title: "Consumer Price Index, Australia",
        },
      ],
      meta: {
        endpoint: "/releases",
        query: {
          days_ahead: Number(url.searchParams.get("days_ahead") ?? 30),
          source: url.searchParams.get("source"),
          dataset_id: url.searchParams.get("dataset_id"),
          event_type: url.searchParams.get("event_type"),
        },
        row_count: 1,
      },
    });
  }),
];
