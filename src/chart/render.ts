import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { ptBR } from 'date-fns/locale';

import type { Investment, GlobalRates } from '../types';
import { getChartOptions, TAX_BRACKET_LINE_COLOR } from './config';
import { buildAllDatasets, buildTaxBracketLines, type TaxBracketLine } from './datasets';
import { daysBetween } from '../utils/dates';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler
);

// Store reference to chart instance
let chartInstance: Chart<'line'> | null = null;

// Store tax bracket lines for custom drawing
let taxBracketLines: TaxBracketLine[] = [];

// Store current data for re-rendering
let currentData: {
  investments: Investment[];
  rates: GlobalRates;
  startDate: Date;
  endDate: Date;
  showBaseline: boolean;
} | null = null;

/**
 * Custom plugin to draw tax bracket vertical lines.
 */
const taxBracketLinesPlugin = {
  id: 'taxBracketLines',
  
  afterDraw(chart: Chart) {
    if (taxBracketLines.length === 0) return;
    
    const ctx = chart.ctx;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    
    if (!xScale || !yScale) return;
    
    ctx.save();
    
    taxBracketLines.forEach(line => {
      const x = xScale.getPixelForValue(line.date.getTime());
      
      // Only draw if within chart area
      if (x < xScale.left || x > xScale.right) return;
      
      // Draw vertical line
      ctx.beginPath();
      ctx.strokeStyle = TAX_BRACKET_LINE_COLOR;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(x, yScale.top);
      ctx.lineTo(x, yScale.bottom);
      ctx.stroke();
      
      // Draw label at top
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(107, 114, 128, 0.8)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(line.label, x, yScale.top - 5);
    });
    
    ctx.restore();
  },
};

// Register custom plugin
Chart.register(taxBracketLinesPlugin);

/**
 * Initializes and renders the chart on the given canvas element.
 */
export function initializeChart(canvas: HTMLCanvasElement): Chart<'line'> {
  // Destroy existing chart if any
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  
  const options = getChartOptions();
  
  // Set locale for date-fns adapter
  if (options.scales?.x) {
    (options.scales.x as any).adapters = {
      date: { locale: ptBR },
    };
  }
  
  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [],
    },
    options: options,
  });
  
  return chartInstance;
}

/**
 * Updates the chart with new investment data.
 */
export function updateChart(
  investments: Investment[],
  rates: GlobalRates,
  startDate: Date,
  endDate: Date,
  showBaseline: boolean
): void {
  if (!chartInstance) {
    console.error('Chart not initialized');
    return;
  }
  
  // Store current data for resize re-renders
  currentData = { investments, rates, startDate, endDate, showBaseline };
  
  // Build datasets
  const datasets = buildAllDatasets(investments, rates, startDate, endDate, showBaseline);
  
  // Build tax bracket lines
  taxBracketLines = buildTaxBracketLines(startDate, endDate);
  
  // Update chart data
  chartInstance.data.datasets = datasets;
  
  // Update x-axis range
  if (chartInstance.options.scales?.x) {
    const xScale = chartInstance.options.scales.x as any;
    xScale.min = startDate.getTime();
    xScale.max = endDate.getTime();
    
    // Adjust time unit based on date range
    const totalDays = daysBetween(startDate, endDate);
    if (totalDays <= 90) {
      xScale.time.unit = 'week';
    } else if (totalDays <= 365) {
      xScale.time.unit = 'month';
    } else {
      xScale.time.unit = 'quarter';
    }
  }
  
  // Trigger update
  chartInstance.update('none'); // 'none' disables animation for smoother updates
  
  console.log(`Chart updated with ${investments.length} investments`);
}

/**
 * Calculates the appropriate end date based on investments.
 * Returns max due date, or startDate if no due dates.
 */
export function calculateChartEndDate(
  investments: Investment[],
  startDate: Date
): Date {
  // Filter investments with due dates
  const investmentsWithDueDate = investments.filter(inv => inv.dueDate !== null);
  
  if (investmentsWithDueDate.length === 0) {
    // No due dates constraint
    return startDate;
  }
  
  // Find the latest due date
  const latestDueDate = investmentsWithDueDate.reduce((latest, inv) => {
    if (!inv.dueDate) return latest;
    return inv.dueDate > latest ? inv.dueDate : latest;
  }, investmentsWithDueDate[0].dueDate!);
  
  // Ensure we don't return something before start date (shouldn't happen with valid data)
  return latestDueDate > startDate ? latestDueDate : startDate;
}

/**
 * Gets the current chart instance.
 */
export function getChartInstance(): Chart<'line'> | null {
  return chartInstance;
}

/**
 * Destroys the chart instance.
 */
export function destroyChart(): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  taxBracketLines = [];
  currentData = null;
}

/**
 * Shows or hides the chart placeholder.
 */
export function toggleChartPlaceholder(show: boolean): void {
  const placeholder = document.querySelector('.chart-placeholder') as HTMLElement;
  const wrapper = document.querySelector('.chart-wrapper') as HTMLElement;
  
  if (placeholder) {
    placeholder.style.display = show ? 'block' : 'none';
  }
  
  if (wrapper) {
    wrapper.style.visibility = show ? 'hidden' : 'visible';
  }
}

/**
 * Properly handles chart resize.
 * Destroys and recreates the chart to ensure proper dimensions.
 */
export function handleChartResize(): void {
  if (!chartInstance || !currentData) return;
  
  const canvas = chartInstance.canvas;
  if (!canvas) return;
  
  // Store parent reference before destroying
  const parent = canvas.parentElement;
  if (!parent) return;
  
  // Destroy current chart
  chartInstance.destroy();
  
  // Reset canvas dimensions
  canvas.style.width = '';
  canvas.style.height = '';
  canvas.width = 0;
  canvas.height = 0;
  
  // Recreate chart
  chartInstance = initializeChart(canvas);
  
  // Re-apply data
  updateChart(
    currentData.investments,
    currentData.rates,
    currentData.startDate,
    currentData.endDate,
    currentData.showBaseline
  );
}

/**
 * Refreshes the chart size (simple resize).
 */
export function refreshChart(): void {
  handleChartResize();
}