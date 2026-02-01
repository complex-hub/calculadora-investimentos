import type { GlobalRates } from '../types';
import { fetchAllRates, type FetchStatus } from './api';

/**
 * Cache duration in milliseconds (1 hour).
 */
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * LocalStorage key for cached rates.
 */
const RATES_CACHE_KEY = 'investment-calculator-rates';

/**
 * Cached rates structure.
 */
interface CachedRates {
  rates: GlobalRates;
  timestamp: number;
}

/**
 * Gets cached rates from localStorage.
 */
function getCachedRates(): CachedRates | null {
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedRates = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age < CACHE_DURATION) {
      console.log('Using cached rates (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
      return parsed;
    }

    console.log('Cached rates expired');
    return null;
  } catch (error) {
    console.error('Failed to read cached rates:', error);
    return null;
  }
}

/**
 * Saves rates to localStorage cache.
 */
function setCachedRates(rates: GlobalRates): void {
  try {
    const cached: CachedRates = {
      rates,
      timestamp: Date.now(),
    };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cached));
    console.log('Rates cached');
  } catch (error) {
    console.error('Failed to cache rates:', error);
  }
}

/**
 * Initializes global rates.
 * 1. Check cache
 * 2. If expired/missing, fetch from API
 * 3. Fall back to defaults if all else fails
 */
export async function initializeRates(): Promise<FetchStatus> {
  // Check cache first
  const cached = getCachedRates();
  if (cached) {
    return {
      success: true,
      message: 'Taxas carregadas do cache',
      rates: cached.rates,
      fetchedRates: { cdi: true, ipca: true, selic: true },
    };
  }

  // Fetch from API
  const result = await fetchAllRates();

  // Cache successful fetches
  if (result.success) {
    setCachedRates(result.rates);
  }

  return result;
}

/**
 * Forces a refresh of rates from API.
 */
export async function refreshRates(): Promise<FetchStatus> {
  const result = await fetchAllRates();

  if (result.success) {
    setCachedRates(result.rates);
  }

  return result;
}

/**
 * Updates a single rate manually.
 */
export function updateRate(
  currentRates: GlobalRates,
  key: keyof GlobalRates,
  value: number
): GlobalRates {
  const newRates = {
    ...currentRates,
    [key]: value,
  };

  // Update cache with manual changes
  setCachedRates(newRates);

  return newRates;
}

/**
 * Clears the rates cache.
 */
export function clearRatesCache(): void {
  try {
    localStorage.removeItem(RATES_CACHE_KEY);
    console.log('Rates cache cleared');
  } catch (error) {
    console.error('Failed to clear rates cache:', error);
  }
}