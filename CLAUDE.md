# ausdata-mcp — TypeScript MCP client

One-line value prop: **public MCP server that routes AI-agent tool calls to the hosted ausdata.io REST API.**

License: **MIT**. Distribution: **public npm** (when published).

## CRITICAL — distinction from `ausdata-mcp` (Python)

This repo is **NOT** the private bundle. There are two related packages and they must never be conflated:

| Package | Language | Distribution | Purpose |
|---|---|---|---|
| `ausdata-mcp` (Python, **private**) | Python / FastMCP | Internal only — DO NOT PUBLISH | Direct sister-MCP imports, commercial moat, sold as enterprise self-host |
| `ausdata-mcp` (TypeScript, **THIS REPO**) | TypeScript / MCP SDK | Public npm under `@ausdata` org | Routes to hosted API; free entry-point for AI agent devs |

If you find yourself reading from `/Users/harry/Desktop/MCP Endpoint Creation/ausdata-mcp/`, you are in the WRONG repo for this work. The private bundle lives there. This repo (`ausdata-mcp-client/`) is the public TypeScript client.

## TypeScript + MCP SDK rationale

- TypeScript matches the audience: Claude Code / Cursor / Windsurf devs already have node + npm. `npx ausdata-mcp` is friction-free.
- The `@modelcontextprotocol/sdk` TS implementation is the reference client; stays compatible with all transports.
- HTTP routing only — zero parsing — keeps this client trivial to maintain. New endpoints in the REST API need a new tool file, that's it.

## Architecture

```
src/
├── index.ts        main() entry point
├── server.ts       MCP Server bootstrap (stdio transport)
├── client.ts       HTTP client → ausdata-api.fly.dev (override via AUSDATA_BASE_URL)
├── config.ts       env var loading
├── tools/          one file per MCP tool
│   ├── index.ts    registry — 7 entries
│   ├── search-datasets.ts
│   ├── list-datasets.ts
│   ├── describe.ts
│   ├── real-wages.ts
│   ├── economic-dashboard.ts
│   ├── get-data.ts
│   └── health.ts
└── lib/
    ├── errors.ts   ApiError + mcpError + toMcpError
    └── format.ts   mcpJson — wrap any JSON in MCP content
```

The tool registry in `src/tools/index.ts` is the source of truth. Adding a tool = a new file + a registry entry. Removing a tool = delete the file + the registry entry. The server iterates the registry; it doesn't hard-code anything.

## Tool surface

The 7 tools cover the portfolio's mandatory 5-tool core surface (search,
list, describe, get_data, latest) plus 2 composed flagships (real_wages,
economic_dashboard) and health. `latest` is folded into `get_data` (no
period filter = latest).

| Name | Path on the API |
|---|---|
| `search_datasets` | `GET /v1/search-datasets` |
| `list_datasets` | `GET /v1/datasets/{source}` |
| `describe_dataset` | `GET /v1/describe/{source}/{dataset_id}` |
| `real_wages` | `GET /v1/real-wages` |
| `economic_dashboard` | `GET /v1/economic-dashboard` |
| `get_data` | `GET /v1/data/{source}/{dataset_id}` |
| `health` | `GET /v1/health` |

New endpoints get a new tool only after the REST endpoint ships and stabilizes — keep this registry in sync with the API's actual surface.

## Test patterns

- **vitest + msw** — msw intercepts `fetch` so tests don't hit network.
- Setup file at `test/setup.ts` registers msw lifecycle hooks (vitest setupFiles run before each test file).
- `test/msw-handlers.ts` is the central handler list — happy-path stubs for all 5 endpoints. Individual tests override with `mswServer.use(...)` to simulate 401 / 429 / 5xx.
- Tests live next to their unit: `test/tools/<tool>.test.ts` per tool, plus `test/client.test.ts`, `test/server.test.ts`, `test/stdio.test.ts`.
- The stdio test spawns the built binary as a subprocess and exchanges JSON-RPC — the most realistic protocol check we can run offline.
- Helper `client(key?)` / `makeClient(key?)`: pass `null` to simulate missing AUSDATA_API_KEY (NOT `undefined`, which triggers default-parameter substitution).

## Error handling discipline

- **Tools NEVER throw.** They return `McpSuccessResponse` (content array) or `McpErrorResponse` (`{ isError: true, content: [...] }`). AI agents need to see structured failures so they can recover or explain to the user.
- Map upstream HTTP status to a friendly, actionable string:
  - 401 → "AUSDATA_API_KEY is invalid. Get a fresh one at..."
  - 403 → "Access denied: <reason>. Upgrade at..."
  - 429 → "Rate limit hit. Retry in N seconds..."
  - 5xx → "ausdata.io is having trouble, try again..."
- Use `toMcpError(err)` as the catch-all — it routes by `ApiError.status` and falls back to a generic message.

## Anti-patterns

- **Don't import from the private `ausdata-mcp` Python bundle.** They are separate products. The TypeScript client routes HTTP; the Python bundle imports sisters directly.
- **Don't reimplement parsing or shaping.** The REST API owns response shape. This client passes JSON through.
- **Don't add tools without a corresponding REST endpoint.** Each tool must wrap one stable API path. Adding a tool means: (1) the REST endpoint ships and stabilises on ausdata-api first, (2) a new tool file + registry entry here, (3) the tool-count assertions in `test/server.test.ts` and `test/stdio.test.ts` are bumped in the same commit. Don't drift past the API's actual surface.
- **Don't add a CLI surface.** That's `ausdata-cli` — a separate package.
- **Don't auto-publish to npm.** Releases go through a manual `npm publish --access public` once tests + lint + build are all green and the user is ready.
- **Don't echo tokens** in logs, errors, or test fixtures. The `Authorization` header is the only place an API key should appear.

## Release process (when ready)

```bash
npm install
npm run build
npm test         # all 35+ tests green
npm run lint     # clean
npm publish --access public
```

The `@ausdata` npm organization scope requires `--access public` on first publish; subsequent publishes inherit the scope's visibility.
