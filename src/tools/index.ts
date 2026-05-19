/**
 * Tool registry. The MCP server dispatches by `name` and the registry holds
 * the schema + handler for each tool. Adding a new tool here is the only
 * change required to expose it — the server iterates this list.
 *
 * Current surface: 28 tools (7 core + 8 Wave 1 composers + 13 Wave 2 composers).
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
import { listDatasetsTool, handleListDatasets } from "./list-datasets.js";
import { healthTool, handleHealth } from "./health.js";
import { realCashRateTool, handleRealCashRate } from "./real-cash-rate.js";
import {
  genderPayContextTool,
  handleGenderPayContext,
} from "./gender-pay-context.js";
import { energySnapshotTool, handleEnergySnapshot } from "./energy-snapshot.js";
import { costOfLivingTool, handleCostOfLiving } from "./cost-of-living.js";
import {
  youthUnemploymentTool,
  handleYouthUnemployment,
} from "./youth-unemployment.js";
import { tradeBalanceTool, handleTradeBalance } from "./trade-balance.js";
import {
  housingAffordabilityTool,
  handleHousingAffordability,
} from "./housing-affordability.js";
import { releasesTool, handleReleases } from "./releases.js";
import {
  realMortgageRateTool,
  handleRealMortgageRate,
} from "./real-mortgage-rate.js";
import {
  realSavingsRateTool,
  handleRealSavingsRate,
} from "./real-savings-rate.js";
import {
  regionalCostOfLivingTool,
  handleRegionalCostOfLiving,
} from "./regional-cost-of-living.js";
import { wageVsRentGapTool, handleWageVsRentGap } from "./wage-vs-rent-gap.js";
import {
  superFundRealReturnTool,
  handleSuperFundRealReturn,
} from "./super-fund-real-return.js";
import {
  sectoralEmploymentShiftTool,
  handleSectoralEmploymentShift,
} from "./sectoral-employment-shift.js";
import {
  bankDepositShareTool,
  handleBankDepositShare,
} from "./bank-deposit-share.js";
import {
  charitySectorHealthTool,
  handleCharitySectorHealth,
} from "./charity-sector-health.js";
import {
  stateFiscalSnapshotTool,
  handleStateFiscalSnapshot,
} from "./state-fiscal-snapshot.js";
import {
  inflationDecompositionTool,
  handleInflationDecomposition,
} from "./inflation-decomposition.js";
import { releasePulseTool, handleReleasePulse } from "./release-pulse.js";
import {
  macroSnapshotStateTool,
  handleMacroSnapshotState,
} from "./macro-snapshot-state.js";
import {
  nemDispatch5minTool,
  handleNemDispatch5min,
} from "./nem-dispatch-5min.js";

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
  { definition: listDatasetsTool, handler: handleListDatasets },
  { definition: describeTool, handler: handleDescribe },
  { definition: realWagesTool, handler: handleRealWages },
  { definition: economicDashboardTool, handler: handleEconomicDashboard },
  { definition: getDataTool, handler: handleGetData },
  { definition: healthTool, handler: handleHealth },
  { definition: realCashRateTool, handler: handleRealCashRate },
  { definition: genderPayContextTool, handler: handleGenderPayContext },
  { definition: energySnapshotTool, handler: handleEnergySnapshot },
  { definition: costOfLivingTool, handler: handleCostOfLiving },
  { definition: youthUnemploymentTool, handler: handleYouthUnemployment },
  { definition: tradeBalanceTool, handler: handleTradeBalance },
  { definition: housingAffordabilityTool, handler: handleHousingAffordability },
  { definition: releasesTool, handler: handleReleases },
  // Wave 2 composers (0.4.0, 2026-05-19)
  { definition: realMortgageRateTool, handler: handleRealMortgageRate },
  { definition: realSavingsRateTool, handler: handleRealSavingsRate },
  { definition: regionalCostOfLivingTool, handler: handleRegionalCostOfLiving },
  { definition: wageVsRentGapTool, handler: handleWageVsRentGap },
  { definition: superFundRealReturnTool, handler: handleSuperFundRealReturn },
  {
    definition: sectoralEmploymentShiftTool,
    handler: handleSectoralEmploymentShift,
  },
  { definition: bankDepositShareTool, handler: handleBankDepositShare },
  { definition: charitySectorHealthTool, handler: handleCharitySectorHealth },
  { definition: stateFiscalSnapshotTool, handler: handleStateFiscalSnapshot },
  {
    definition: inflationDecompositionTool,
    handler: handleInflationDecomposition,
  },
  { definition: releasePulseTool, handler: handleReleasePulse },
  { definition: macroSnapshotStateTool, handler: handleMacroSnapshotState },
  { definition: nemDispatch5minTool, handler: handleNemDispatch5min },
];

export function getToolDefinitions(): ToolDefinition[] {
  return TOOLS.map((t) => t.definition);
}

export function findTool(name: string): ToolRegistryEntry | undefined {
  return TOOLS.find((t) => t.definition.name === name);
}
