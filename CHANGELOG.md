# Changelog

## 0.1.0 — 2026-05-16

Initial scaffold of `@ausdata/mcp` — TypeScript MCP server that wraps the ausdata.io REST API.

- 5 MCP tools: `search_datasets`, `real_wages`, `economic_dashboard`, `get_data`, `health`
- stdio transport via `@modelcontextprotocol/sdk`
- Zod parameter validation on every tool
- Structured MCP error responses for 401 / 403 / 429 / 5xx / network / missing-key paths
- 35 tests (vitest + msw), build + lint green
