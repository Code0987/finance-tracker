import { ChartOptions, Chart } from 'chart.js';

// Default color palette for charts
export const chartColors = {
  primary: '#3b82f6',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  lime: '#84cc16',
  orange: '#f97316',
  indigo: '#6366f1',
};

export const categoryColorPalette = [
  '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#78716c', '#0ea5e9', '#d946ef', '#a855f7',
];

// Default chart options
export const defaultChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: 'Inter, sans-serif',
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleFont: {
        family: 'Inter, sans-serif',
        size: 13,
        weight: '600',
      },
      bodyFont: {
        family: 'Inter, sans-serif',
        size: 12,
      },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      boxPadding: 4,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(100, 116, 139, 0.1)',
      },
      ticks: {
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
        callback: function(value) {
          return '₹' + formatCompact(value as number);
        },
      },
    },
  },
};

// Doughnut/Pie chart options
export const doughnutChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const value = context.raw as number;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `₹${value.toLocaleString('en-IN')} (${percentage}%)`;
        },
      },
    },
  },
};

// Line chart options
export const lineChartOptions: ChartOptions<'line'> = {
  ...defaultChartOptions,
  elements: {
    point: {
      radius: 3,
      hoverRadius: 6,
    },
    line: {
      tension: 0.4,
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
};

// Bar chart options
export const barChartOptions: ChartOptions<'bar'> = {
  ...defaultChartOptions,
  barThickness: 'flex',
  maxBarThickness: 50,
};

// Horizontal bar chart options
export const horizontalBarChartOptions: ChartOptions<'bar'> = {
  ...defaultChartOptions,
  indexAxis: 'y' as const,
  scales: {
    x: {
      grid: {
        color: 'rgba(100, 116, 139, 0.1)',
      },
      ticks: {
        callback: function(value) {
          return '₹' + formatCompact(value as number);
        },
      },
    },
    y: {
      grid: {
        display: false,
      },
    },
  },
};

// Utility function for compact number formatting
function formatCompact(num: number): string {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
  if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Currency formatter for tooltips
export const currencyTooltipFormatter = {
  callbacks: {
    label: function(context: any) {
      const value = context.raw as number;
      return context.dataset.label + ': ₹' + value.toLocaleString('en-IN');
    },
  },
};

// Gradient generator for charts
export const createGradient = (
  ctx: CanvasRenderingContext2D,
  color: string,
  opacity: { start: number; end: number } = { start: 0.4, end: 0 }
): CanvasGradient => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, `${color}${Math.round(opacity.start * 255).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(1, `${color}${Math.round(opacity.end * 255).toString(16).padStart(2, '0')}`);
  return gradient;
};

// Dataset presets
export const datasetPresets = {
  income: {
    label: 'Income',
    backgroundColor: chartColors.success,
    borderColor: chartColors.success,
    borderWidth: 2,
  },
  expenses: {
    label: 'Expenses',
    backgroundColor: chartColors.danger,
    borderColor: chartColors.danger,
    borderWidth: 2,
  },
  savings: {
    label: 'Savings',
    backgroundColor: chartColors.primary,
    borderColor: chartColors.primary,
    borderWidth: 2,
  },
  investments: {
    label: 'Investments',
    backgroundColor: chartColors.purple,
    borderColor: chartColors.purple,
    borderWidth: 2,
  },
};

// Register Chart.js defaults
export const registerChartDefaults = () => {
  Chart.defaults.font.family = 'Inter, sans-serif';
  Chart.defaults.color = '#64748b';
  Chart.defaults.borderColor = 'rgba(100, 116, 139, 0.1)';
};
