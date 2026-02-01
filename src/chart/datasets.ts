import type { ChartDataset } from 'chart.js';
import type { Investment, GlobalRates, ChartDataPoint } from '../types';
import { generateNetReturnSeries } from '../calculations';
import { addDays, daysBetween } from '../utils/dates';
import { getColorForIndex } from './config';

/**
 * Represents a data point for Chart.js with x as timestamp.
 */
interface ChartPoint {
  x: number;  // Timestamp in milliseconds
  y: number;  // Net return as decimal
}

/**
 * Builds the data series for a single investment.
 * 
 * @param investment - The investment configuration
 * @param rates - Current global rates
 * @param startDate - Start date for the chart
 * @param endDate - End date for the chart
 * @returns Array of chart data points
 */
export function buildInvestmentDataPoints(
  investment: Investment,
  rates: GlobalRates,
  startDate: Date,
  endDate: Date
): ChartPoint[] {
  const totalDays = daysBetween(startDate, endDate);
  
  // Handle edge case
  if (totalDays <= 0) {
    return [{ x: startDate.getTime(), y: 0 }];
  }
  
  // Generate net returns for each day
  const netReturns = generateNetReturnSeries(investment, rates, totalDays);
  
  // Convert to chart points
  // We don't need every single day - sample based on total period
  const points: ChartPoint[] = [];
  const sampleInterval = getSampleInterval(totalDays);
  
  for (let day = 0; day <= totalDays; day += sampleInterval) {
    const date = addDays(startDate, day);
    points.push({
      x: date.getTime(),
      y: netReturns[day],
    });
  }
  
  // Always include the last day
  if (points.length === 0 || points[points.length - 1].x !== addDays(startDate, totalDays).getTime()) {
    points.push({
      x: addDays(startDate, totalDays).getTime(),
      y: netReturns[totalDays],
    });
  }
  
  // Also include tax bracket transition days for all investments
  // This ensures datasets are aligned for tooltip sync (index mode)
  const taxDays = [180, 181, 360, 361, 720, 721];
  taxDays.forEach(day => {
    if (day <= totalDays) {
      const date = addDays(startDate, day);
      const timestamp = date.getTime();
      // Only add if not already in points
      if (!points.find(p => p.x === timestamp)) {
        points.push({
          x: timestamp,
          y: netReturns[day],
        });
      }
    }
  });
  
  // Sort by date
  points.sort((a, b) => a.x - b.x);
  
  return points;
}

/**
 * Determines the sampling interval based on total days.
 * More days = less frequent sampling to keep performance good.
 */
function getSampleInterval(totalDays: number): number {
  if (totalDays <= 90) return 1;      // Daily for up to 3 months
  if (totalDays <= 365) return 3;     // Every 3 days for up to 1 year
  if (totalDays <= 730) return 7;     // Weekly for up to 2 years
  if (totalDays <= 1825) return 14;   // Bi-weekly for up to 5 years
  return 30;                           // Monthly for longer periods
}

/**
 * Builds a Chart.js dataset for a single investment.
 */
export function buildInvestmentDataset(
  investment: Investment,
  rates: GlobalRates,
  startDate: Date,
  endDate: Date,
  colorIndex: number
): ChartDataset<'line', ChartPoint[]> {
  const data = buildInvestmentDataPoints(investment, rates, startDate, endDate);
  const color = getColorForIndex(colorIndex);
  
  return {
    label: investment.name,
    data: data,
    borderColor: color,
    backgroundColor: color,
    fill: false,
    tension: 0,
    pointRadius: 0,
    pointHoverRadius: 6,
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: '#ffffff',
    pointHoverBorderWidth: 2,
    borderWidth: 2,
  };
}

/**
 * Builds Chart.js datasets for all investments.
 */
export function buildAllDatasets(
  investments: Investment[],
  rates: GlobalRates,
  startDate: Date,
  endDate: Date
): ChartDataset<'line', ChartPoint[]>[] {
  return investments.map((investment, index) => 
    buildInvestmentDataset(investment, rates, startDate, endDate, index)
  );
}

/**
 * Builds vertical line annotations for tax bracket transitions.
 * Returns data for custom drawing (since we're not using annotation plugin).
 */
export interface TaxBracketLine {
  date: Date;
  day: number;
  label: string;
}

export function buildTaxBracketLines(
  startDate: Date,
  endDate: Date
): TaxBracketLine[] {
  const totalDays = daysBetween(startDate, endDate);
  const transitionDays = [180, 360, 720];
  
  return transitionDays
    .filter(day => day <= totalDays)
    .map(day => ({
      date: addDays(startDate, day),
      day,
      label: `${day} dias`,
    }));
}