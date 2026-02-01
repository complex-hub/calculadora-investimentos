import type { Chart } from 'chart.js';
import type { Investment, GlobalRates } from '../types';

/**
 * Initializes and renders the chart on the given canvas element.
 */
export function initializeChart(
  canvas: HTMLCanvasElement
): Chart;

/**
 * Updates the chart with new investment data.
 */
export function updateChart(
  chart: Chart,
  investments: Investment[],
  rates: GlobalRates,
  startDate: Date,
  endDate: Date
): void;

/**
 * Calculates the appropriate end date based on investments.
 * Returns max due date, or startDate + 1 year if no due dates.
 */
export function calculateEndDate(
  investments: Investment[],
  startDate: Date
): Date;