import type { GlobalRates } from '../types';

/**
 * Initializes global rates — attempts API fetch, falls back to defaults.
 */
export async function initializeRates(): Promise<GlobalRates>;

/**
 * Updates a single rate manually.
 */
export function updateRate(
  currentRates: GlobalRates,
  key: keyof GlobalRates,
  value: number
): GlobalRates;