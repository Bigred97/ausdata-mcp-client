/**
 * Tool registry. The MCP server dispatches by `name` and the registry holds
 * the schema + handler for each tool. Adding a new tool here is the only
 * change required to expose it — the server iterates this list.
 *
 * Keep this list at exactly 5 entries. Anti-pattern: drift past 5 — see
 * CLAUDE.md.
 */
import type { AusdataClient } from "../client.js";
import type { McpErrorResponse } from "../lib/errors.js";
import type { McpSuccessResponse } from "../lib/format.js";

import {
  searchDatasetsTool,
  handleSearchDatasets,
} from "./search-datasets.js";
import { realWagesTool, handleRealWages } from "./real-wages.js";
import {
  economicDashboardTool,
  handleEconomicDashboard,
} from "./economic-dashboard.js";
import { getDataTool, handleGetData } from "./get-data.js";
import { describeTool, handleDescribe } from "./describe.js";
import { healthTool, handleHealth } from "./health.js";

export type ToolHandler = (
  client: AusdataClient,
  input: unknown,
) => Promise<McpSuccessResponse | McpErrorResponse>;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolRegistryEntry {
  definition: ToolDefinition;
  handler: ToolHandler;
}

export const TOOLS: ToolRegistryEntry[] = [
  { definition: searchDatasetsTool, handler: handleSearchDatasets },
  { definition: describeTool, handler: handleDescribe },
  { definition: realWagesTool, handler: handleRealWages },
  { definition: economicDashboardTool, handler: handleEconomicDashboard },
  { definition: getDataTool, handler: handleGetData },
  { definition: healthTool, handler: handleHealth },
];

export function getToolDefinitions(): ToolDefinition[] {
  return TOOLS.map((t) => t.definition);
}

export function findTool(name: string): ToolRegistryEntry | undefined {
  return TOOLS.find((t) => t.definition.name === name);
}
