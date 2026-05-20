# Changelog

## [0.4.2] — 2026-05-21

### Added

- Add `mcpName: io.ausdata/ausdata-mcp` field to package.json (required by the
  MCP Registry npm package-ownership validator).

## [0.4.1] — 2026-05-21

### Added

- Add MCP Registry ownership marker (`mcp-name: io.ausdata/ausdata-mcp`) to the
  README so the server can be listed under the verified `io.ausdata` namespace.

## [0.4.0] — 2026-05-19

### Added (Wave 4 P0 — MCP/REST surface drift fix)

- 13 new MCP tools wrapping the Wave 2 composer surface that shipped on
  ausdata-api over the past two weeks. Closes the surface-drift gap
  found in the Wave 4 retest: REST had 42 paths, MCP exposed only 15.
  AI agents (Claude Desktop, Cursor, Continue, Windsurf) can now reach
  the full composer surface without falling back to raw HTTP:
  - `real_mortgage_rate` — `GET /v1/real-mortgage-rate` (RBA mortgage rate − CPI)
  - `real_savings_rate` — `GET /v1/real-savings-rate` (RBA deposit rate − CPI)
  - `regional_cost_of_living` — `GET /v1/regional-cost-of-living` (capital-city CPI)
  - `wage_vs_rent_gap` — `GET /v1/wage-vs-rent-gap` (WPI vs rent CPI)
  - `super_fund_real_return` — `GET /v1/super-fund-real-return` (APRA + CPI)
  - `sectoral_employment_shift` — `GET /v1/sectoral-employment-shift` (LF Detailed by ANZSIC)
  - `bank_deposit_share` — `GET /v1/bank-deposit-share` (APRA ADI deposit shares)
  - `charity_sector_health` — `GET /v1/charity-sector-health` (ACNC aggregates)
  - `state_fiscal_snapshot` — `GET /v1/state-fiscal-snapshot?state=...` (ABS GFS)
  - `inflation_decomposition` — `GET /v1/inflation-decomposition` (CPI contributors)
  - `release_pulse` — `GET /v1/release-pulse?days_ahead=...` (ranked release calendar)
  - `macro_snapshot_state` — `GET /v1/macro-snapshot-state?state=...` (state macro)
  - `nem_dispatch_5min` — `GET /v1/nem-dispatch-5min?region=...&limit=...` (AEMO 5min)
- Tool count: 15 → 28.

## [0.3.3] — 2026-05-19

### Fixed (customer-fit audit 2026-05-19, Bug 8)

- **5xx errors now surface the upstream detail.** Previously every 5xx
  mapped to a generic "ausdata.io is having trouble, try again in a
  moment" — stripping the actionable hint the REST API provides
  ("Retry in ~11s when the circuit breaker probes upstream again",
  "Hint: retry once after cold deploy"). LLM agents saw no signal to
  recover from. The MCP error now includes `HTTP {status}: {detail}`
  when the API returned a structured error body.
- **Single auto-retry on 5xx and timeout.** Hosted API cold-deploy
  paths briefly return 503-with-stale or 504; a single retry after
  800ms usually hits a warm cache. Two max attempts → max latency is
  2 × `AUSDATA_TIMEOUT` (default 30s × 2 = 60s), still under the
  typical LLM agent tool-call budget. Eliminates the
  `economic_dashboard` / `get_data` regressions reported by the
  builders persona (`isError: true` on calls that succeed via REST
  in 2.7-8s).

## [0.3.2] — 2026-05-19

### Fixed (Round-17 P2)

- **`get_data` now surfaces a `meta.client_hint` when auto-prefixing a bare
  dataset_id.** Round-17 audit found that LLM agents repeatedly passed
  `source='abs', dataset_id='RES_DWELL_ST'` (bare) on the first try because
  every model's pretrained data assumes split form. The call already
  succeeded thanks to 0.3.1 — but the agent had no signal that the canonical
  form is `abs.RES_DWELL_ST`. Now the augmented response includes
  `meta.client_hint = "Auto-prefixed 'RES_DWELL_ST' to 'abs.RES_DWELL_ST'..."`
  so the agent can learn the dotted form for the next call without a
  separate help round-trip. Two new vitest cases cover the hint shape and
  its absence when dotted form is used.

## [0.3.1] — 2026-05-19

### Fixed (Round-11 P2)

- **`get_data` now accepts both dotted and split dataset_id forms.**
  Round-11 audit found the MCP tool only accepted the dotted form
  (`dataset_id="abs.CPI_MONTHLY"`), while the REST endpoint
  `/v1/data/{source}/{dataset_id}` takes source + ID separately —
  so AI agents who'd just read the REST docs were getting confused.

  All three input shapes now work:
  - `dataset_id="abs.CPI_MONTHLY"` (dotted, original form — still works)
  - `dataset_id="CPI_MONTHLY", source="abs"` (split — new)
  - `dataset_id="abs.CPI_MONTHLY", source="abs"` (both — dotted prefix wins)

  When `dataset_id` is bare and `source` is missing, the tool returns a
  clear error listing the valid sources and the dotted shortcut. Tool
  docstring + JSON schema description updated to document both forms.

## [0.3.0] — 2026-05-18

### Added

- 8 new MCP tools wrapping the composed-endpoint surface that shipped on
  ausdata-api 0.3.0–0.6.2. AI agents can now reach the full hosted API:
  - `real_cash_rate` — `GET /v1/real-cash-rate` (RBA minus CPI)
  - `gender_pay_context` — `GET /v1/gender-pay-context` (WGEA + ABS)
  - `energy_snapshot` — `GET /v1/energy-snapshot` (AEMO NEM live)
  - `cost_of_living` — `GET /v1/cost-of-living` (ABS SLCI by household)
  - `youth_unemployment` — `GET /v1/youth-unemployment` (ABS LF)
  - `trade_balance` — `GET /v1/trade-balance` (ABS trade)
  - `housing_affordability` — `GET /v1/housing-affordability` (ABS + RBA)
  - `releases` — `GET /v1/releases` (upcoming ABS/RBA release calendar)
- Tool count: 7 → 15.

## [0.2.0] — 2026-05-17

### Added

- `describe_dataset` MCP tool — wraps `GET /v1/describe/{source}/{id}`.
  Closes the LLM self-correction loop: after `get_data` returns
  `Unknown filter`, the agent calls `describe_dataset` to see the valid
  filter shape and retries.
- `list_datasets` MCP tool — wraps `GET /v1/datasets/{source}`. Lets
  agents survey a source's catalog before drilling in.
- Tool count: 5 → 7.

### Changed

- Default API base URL is now `https://ausdata-api.fly.dev` (was the
  unconfigured `https://api.ausdata.io`). Override via `AUSDATA_BASE_URL`
  (or legacy `AUSDATA_API_URL`).
- `get_data` tool now hits `GET /v1/data/{source}/{id}` with filters as
  query params (was POSTing to a non-existent `/v1/get-data`). Dotted
  dataset IDs (`abs.LF`) split correctly into URL path segments.

## 0.1.0 — 2026-05-16

Initial scaffold of `@ausdata/mcp` — TypeScript MCP server that wraps the ausdata.io REST API.

- 5 MCP tools: `search_datasets`, `real_wages`, `economic_dashboard`, `get_data`, `health`
- stdio transport via `@modelcontextprotocol/sdk`
- Zod parameter validation on every tool
- Structured MCP error responses for 401 / 403 / 429 / 5xx / network / missing-key paths
- 35 tests (vitest + msw), build + lint green
