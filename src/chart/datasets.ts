import type { Investment, GlobalRates, ChartDataPoint } from '../types';

/**
 * Builds the full data series for a single investment.
 */
export function buildInvestmentDataset(
  investment: Investment,
  rates: GlobalRates,
  startDate: Date,
  endDate: Date
): ChartDataPoint[];

/**
 * Builds Chart.js dataset objects for all investments.
 */
export function buildAllDatasets(
  investments: Investment[],
  rates: GlobalRates,
  startDate: Date,
  endDate: Date
): object[]; // Chart.js dataset format