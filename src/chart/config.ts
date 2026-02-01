import type { ChartOptions, TooltipItem } from 'chart.js';

/**
 * Color palette for investment lines.
 * Using a colorblind-friendly palette.
 */
export const CHART_COLORS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#ca8a04', // Yellow/Gold
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#be185d', // Pink
  '#4f46e5', // Indigo
  '#059669', // Emerald
] as const;

/**
 * Get a color for an investment by index.
 * Cycles through the palette if there are more investments than colors.
 */
export function getColorForIndex(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Tax bracket transition line color.
 */
export const TAX_BRACKET_LINE_COLOR = 'rgba(156, 163, 175, 0.5)'; // Gray with transparency

/**
 * Base chart options configuration.
 */
export function getChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    
    interaction: {
      mode: 'index',
      intersect: false,
    },
    
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: (tooltipItems: TooltipItem<'line'>[]) => {
            if (tooltipItems.length === 0) return '';
            const xValue = tooltipItems[0].parsed.x;
            if (xValue === null || xValue === undefined) return '';
            const date = new Date(xValue);
            return formatTooltipDate(date);
          },
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y;
            if (value === null || value === undefined) return '';
            const percentage = (value * 100).toFixed(2);
            return `  ${context.dataset.label}: ${percentage}%`;
          },
          afterBody: (tooltipItems: TooltipItem<'line'>[]) => {
            if (tooltipItems.length === 0) return '';
            
            const xValue = tooltipItems[0].parsed.x;
            if (xValue === null || xValue === undefined) return '';
            
            // Calculate days from start
            const firstDataset = tooltipItems[0].chart.data.datasets[0];
            if (!firstDataset || !firstDataset.data || firstDataset.data.length === 0) {
              return '';
            }
            
            const firstPoint = firstDataset.data[0] as { x: number };
            if (!firstPoint || typeof firstPoint.x !== 'number') return '';
            
            const startTimestamp = firstPoint.x;
            const days = Math.round((xValue - startTimestamp) / (1000 * 60 * 60 * 24));
            
            return `\n  📅 ${days} dias`;
          },
        },
      },
    },
    
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: {
            day: 'dd MMM',
            month: 'MMM yyyy',
          },
          tooltipFormat: 'dd/MM/yyyy',
        },
        title: {
          display: true,
          text: 'Data',
          font: {
            size: 12,
            weight: 'bold',
          },
          padding: { top: 10 },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxTicksLimit: 12,
          font: {
            size: 11,
          },
        },
      },
      
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Rendimento Líquido (%)',
          font: {
            size: 12,
            weight: 'bold',
          },
          padding: { bottom: 10 },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value) {
            return (Number(value) * 100).toFixed(1) + '%';
          },
          font: {
            size: 11,
          },
        },
        beginAtZero: true,
      },
    },
    
    elements: {
      point: {
        radius: 0,        // Hide points by default
        hoverRadius: 6,   // Show on hover
        hitRadius: 10,    // Easier to hover
      },
      line: {
        tension: 0,       // No curve smoothing (accurate representation)
        borderWidth: 2,
      },
    },
  };
}

/**
 * Format date for tooltip display.
 */
function formatTooltipDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

/**
 * Configuration for tax bracket annotation lines.
 */
export interface TaxBracketAnnotation {
  day: number;
  label: string;
  rate: string;
}

export const TAX_BRACKET_ANNOTATIONS: TaxBracketAnnotation[] = [
  { day: 180, label: '180 dias', rate: '22.5% → 20%' },
  { day: 360, label: '360 dias', rate: '20% → 17.5%' },
  { day: 720, label: '720 dias', rate: '17.5% → 15%' },
];