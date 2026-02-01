import type { Investment, AppState } from '../types';
import { getToday, addDays } from '../utils/dates';
import { DEFAULT_CHART_PERIOD_DAYS, DEFAULT_RATES } from '../constants';

/**
 * LocalStorage keys.
 */
const STORAGE_KEYS = {
  investments: 'investment-calculator-investments',
  chartEndDate: 'investment-calculator-chart-end-date',
} as const;

/**
 * Serialized investment for storage.
 */
interface StoredInvestment extends Omit<Investment, 'dueDate' | 'createdAt'> {
  dueDate: string | null;
  createdAt: string;
}

/**
 * Saves investments to localStorage.
 */
export function saveInvestments(investments: Investment[]): void {
  try {
    const serialized: StoredInvestment[] = investments.map(inv => ({
      ...inv,
      dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
      createdAt: inv.createdAt.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEYS.investments, JSON.stringify(serialized));
    console.log(`Saved ${investments.length} investments to localStorage`);
  } catch (error) {
    console.error('Failed to save investments:', error);
  }
}

/**
 * Loads investments from localStorage.
 */
export function loadInvestments(): Investment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.investments);
    if (!stored) return [];

    const parsed: StoredInvestment[] = JSON.parse(stored);
    
    const investments: Investment[] = parsed.map(inv => ({
      ...inv,
      dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
      createdAt: new Date(inv.createdAt),
    }));

    console.log(`Loaded ${investments.length} investments from localStorage`);
    return investments;
  } catch (error) {
    console.error('Failed to load investments:', error);
    return [];
  }
}

/**
 * Saves chart end date to localStorage.
 */
export function saveChartEndDate(date: Date): void {
  try {
    localStorage.setItem(STORAGE_KEYS.chartEndDate, date.toISOString());
  } catch (error) {
    console.error('Failed to save chart end date:', error);
  }
}

/**
 * Loads chart end date from localStorage.
 */
export function loadChartEndDate(): Date {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.chartEndDate);
    if (stored) {
      const date = new Date(stored);
      // Ensure date is in the future
      if (date > getToday()) {
        return date;
      }
    }
  } catch (error) {
    console.error('Failed to load chart end date:', error);
  }
  return addDays(getToday(), DEFAULT_CHART_PERIOD_DAYS);
}

/**
 * Clears all stored data.
 */
export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('All storage cleared');
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}

/**
 * Exports current state as JSON for backup.
 */
export function exportState(state: AppState): string {
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    investments: state.investments.map(inv => ({
      ...inv,
      dueDate: inv.dueDate?.toISOString() ?? null,
      createdAt: inv.createdAt.toISOString(),
    })),
    chartEndDate: state.chartEndDate.toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Imports state from JSON backup.
 */
export function importState(json: string): { investments: Investment[]; chartEndDate: Date } | null {
  try {
    const data = JSON.parse(json);
    
    if (!data.version || !data.investments) {
      throw new Error('Invalid backup format');
    }

    const investments: Investment[] = data.investments.map((inv: any) => ({
      ...inv,
      dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
      createdAt: new Date(inv.createdAt),
    }));

    const chartEndDate = data.chartEndDate 
      ? new Date(data.chartEndDate)
      : addDays(getToday(), DEFAULT_CHART_PERIOD_DAYS);

    return { investments, chartEndDate };
  } catch (error) {
    console.error('Failed to import state:', error);
    return null;
  }
}