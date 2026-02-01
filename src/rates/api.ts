import type { GlobalRates } from '../types';

/**
 * Fetches the latest Selic rate from BCB API.
 * Returns null if fetch fails.
 */
export async function fetchSelic(): Promise<number | null>;

/**
 * Fetches the latest CDI rate from BCB API.
 * Returns null if fetch fails.
 */
export async function fetchCDI(): Promise<number | null>;

/**
 * Fetches the latest IPCA (last 12 months accumulated) from BCB API.
 * Returns null if fetch fails.
 */
export async function fetchIPCA(): Promise<number | null>;

/**
 * Attempts to fetch all rates, falling back to defaults on failure.
 */
export async function fetchAllRates(): Promise<GlobalRates>;