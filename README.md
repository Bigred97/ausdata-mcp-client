# @ausdata/mcp

MCP server for the Australian public data API. Plug into Claude Code, Cursor, Windsurf, or any other MCP client and get one-call access to 60+ curated Australian government datasets.

## Install

Add to your MCP client config:

```json
{
  "mcpServers": {
    "ausdata": {
      "command": "npx",
      "args": ["-y", "@ausdata/mcp"],
      "env": {
        "AUSDATA_API_KEY": "ak_xxx"
      }
    }
  }
}
```

Get a free API key at https://ausdata.io (100 calls/mo on the free tier).

## Tools exposed

| Tool | What it does |
|---|---|
| `search_datasets` | Plain-English search across the catalog. "unemployment NSW" → dataset IDs to call. |
| `real_wages` | Wage Price Index minus CPI, quarterly. The Greg Jericho chart in one call. |
| `economic_dashboard` | Cash rate, CPI, unemployment, wage growth, lending — in one response. |
| `get_data` | Generic accessor by `dataset_id`. Search first, fetch second. |
| `health` | API reachability check. Useful for debugging. |

## Example agent prompts

Once the MCP is connected, try asking your agent:

- *"What's the latest RBA cash rate and how does it compare to a year ago?"*
- *"Show me the real wages trend since 2019."*
- *"Search for AU housing approval data and pull the last 2 years for NSW."*

## Configuration

| Env var | Purpose | Default |
|---|---|---|
| `AUSDATA_API_KEY` | Bearer token | required |
| `AUSDATA_API_URL` | Override the API base URL | `https://api.ausdata.io` |
| `AUSDATA_TIMEOUT` | Per-request timeout (ms) | `30000` |

## Errors

Every tool returns MCP-formatted errors that AI agents can read and recover from:

- Missing key → `Set AUSDATA_API_KEY in your MCP config. Get a free key at https://ausdata.io`
- 401 → reauth hint
- 403 → upgrade hint
- 429 → retry-after seconds
- 5xx → "try again, status page is at..."

## License

MIT — see [LICENSE](LICENSE).

This client is independent of the upstream data; each response carries attribution metadata for the underlying ABS / RBA / APRA / AIHW / etc. source under their respective CC-BY licenses.

## Development

```bash
npm install
npm run build
npm test
npm run lint
```

Source lives in `src/`. Tool definitions are in `src/tools/`. The HTTP routing layer is `src/client.ts` — it does NOT parse responses, that's the API server's job.
