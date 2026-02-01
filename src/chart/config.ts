import type { ChartConfiguration } from 'chart.js';

/**
 * Returns the base Chart.js configuration for the investment comparison chart.
 */
export function getChartConfig(): ChartConfiguration<'line'>;

/**
 * Returns annotation configuration for tax bracket vertical lines.
 */
export function getTaxBracketAnnotations(
  startDate: Date
): object[]; // Chart.js annotation plugin format