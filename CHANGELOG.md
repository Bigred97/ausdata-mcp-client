# Changelog

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
