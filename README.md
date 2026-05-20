# ausdata-mcp

mcp-name: io.ausdata/ausdata-mcp

MCP server for the Australian public data API. Plug into Claude Code, Cursor, Windsurf, or any other MCP client and get one-call access to 100+ curated Australian government datasets across 9 sources.

## Install

Add to your MCP client config:

```json
{
  "mcpServers": {
    "ausdata": {
      "command": "npx",
      "args": ["-y", "ausdata-mcp"],
      "env": {
        "AUSDATA_API_KEY": "ak_xxx"
      }
    }
  }
}
```

Get a free API key at https://ausdata.io (500 calls/month on the free tier, no credit card).

## Tools exposed

| Tool | What it does |
|---|---|
| `search_datasets` | Plain-English search across the catalog. "unemployment NSW" → dataset IDs to call. |
| `list_datasets` | List curated datasets for a given source (abs, rba, ato, …). |
| `describe_dataset` | Schema + filter dictionary for one dataset before you `get_data` it. |
| `get_data` | Generic accessor by `source` + `dataset_id`. Search first, fetch second. |
| `releases` | Upcoming + recent statistical release calendar across all sources. |
| `real_wages` | Wage Price Index minus CPI, quarterly. The Greg Jericho chart in one call. |
| `real_cash_rate` | RBA cash rate minus CPI — the real policy stance. |
| `economic_dashboard` | Cash rate, CPI, unemployment, wage growth, lending — in one response. |
| `cost_of_living` | ABS Selected Living Cost Indexes by household type. |
| `youth_unemployment` | 15-24 unemployment rate, state-level. |
| `trade_balance` | Goods + services trade balance, monthly. |
| `housing_affordability` | House prices vs household disposable income, indexed. |
| `gender_pay_context` | WGEA gender pay gap by industry / employer-size context. |
| `energy_snapshot` | AEMO NEM dispatch + price snapshot, current trading interval. |
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

## The ausdata.io ecosystem
Part of a family of MCP servers + a hosted API for Australian public data:
- **Sister MCPs** (free, MIT): [abs](https://github.com/Bigred97/abs-mcp) · [rba](https://github.com/Bigred97/rba-mcp) · [ato](https://github.com/Bigred97/ato-mcp) · [apra](https://github.com/Bigred97/apra-mcp) · [aihw](https://github.com/Bigred97/aihw-mcp) · [asic](https://github.com/Bigred97/asic-mcp) · [aemo](https://github.com/Bigred97/aemo-mcp) · [au-weather](https://github.com/Bigred97/au-weather-mcp) · [wgea](https://github.com/Bigred97/wgea-mcp)
- **Hosted API + cross-source endpoints**: [ausdata.io](https://ausdata.io)
- **Python SDK**: `pip install ausdataio` · **Node MCP**: `npx -y ausdata-mcp`

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
