# Changelog

## [Unreleased]

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
