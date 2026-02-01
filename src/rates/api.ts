import type { GlobalRates } from '../types';
import { BCB_SERIES } from '../constants';

/**
 * BCB API response format.
 */
interface BCBResponse {
  data: string;   // Date in DD/MM/YYYY format
  valor: string;  // Value as string
}

/**
 * CORS proxy options for BCB API.
 * We try multiple proxies in case one fails.
 * 
 * Note: Public proxies can be unstable. In a production environment,
 * it is recommended to set up your own proxy server.
 */
const CORS_PROXIES = [
  // Prioritize CodeTabs and ThingProxy as they are often more stable for this API
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
  // Fallbacks
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
] as const;

/**
 * BCB API base URL.
 */
const BCB_API_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

/**
 * Timeout for API requests (in milliseconds).
 */
const API_TIMEOUT = 10000;

/**
 * Builds the BCB API URL for a given series.
 */
function buildBCBUrl(seriesCode: number, lastN: number = 1): string {
  return `${BCB_API_BASE}.${seriesCode}/dados/ultimos/${lastN}?formato=json`;
}

/**
 * Fetches data with timeout support.
 */
async function fetchWithTimeout(
  url: string,
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Attempts to fetch from BCB API using CORS proxies.
 */
async function fetchFromBCB(seriesCode: number): Promise<number | null> {
  const bcbUrl = buildBCBUrl(seriesCode);

  // Try direct fetch first (might work in some environments)
  try {
    const response = await fetchWithTimeout(bcbUrl, 3000);
    if (response.ok) {
      const data: BCBResponse[] = await response.json();
      if (data && data.length > 0) {
        return parseFloat(data[data.length - 1].valor);
      }
    }
  } catch {
    // Direct fetch failed, try proxies
  }

  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
    try {
      // AllOrigins and others expect encoded URLs
      const proxyUrl = `${proxy}${encodeURIComponent(bcbUrl)}`;
      console.log(`Trying proxy: ${proxy}...`);
      
      const response = await fetchWithTimeout(proxyUrl);

      if (response.ok) {
        const data: BCBResponse[] = await response.json();
        if (data && data.length > 0) {
          console.log(`Success with proxy: ${proxy}`);
          return parseFloat(data[data.length - 1].valor);
        }
      }
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error);
      continue;
    }
  }

  return null;
}

/**
 * Fetches the latest Selic rate from BCB API.
 * Returns the annual rate as a decimal (e.g., 0.1075 for 10.75%).
 */
export async function fetchSelic(): Promise<number | null> {
  try {
    const value = await fetchFromBCB(BCB_SERIES.selic);
    if (value !== null) {
      // BCB returns as percentage (e.g., 10.75), convert to decimal
      return value / 100;
    }
  } catch (error) {
    console.error('Failed to fetch Selic:', error);
  }
  return null;
}

/**
 * Fetches the latest CDI rate from BCB API.
 * Returns the annual rate as a decimal.
 */
export async function fetchCDI(): Promise<number | null> {
  try {
    const value = await fetchFromBCB(BCB_SERIES.cdi);
    if (value !== null) {
      // CDI from BCB is daily rate, need to annualize
      // Annual rate = (1 + daily)^252 - 1
      const dailyRate = value / 100;
      const annualRate = Math.pow(1 + dailyRate, 252) - 1;
      return annualRate;
    }
  } catch (error) {
    console.error('Failed to fetch CDI:', error);
  }
  return null;
}

/**
 * Fetches the latest IPCA (last 12 months accumulated) from BCB API.
 * Returns the annual rate as a decimal.
 */
export async function fetchIPCA(): Promise<number | null> {
  try {
    // Fetch last 12 months of IPCA
    const bcbUrl = buildBCBUrl(BCB_SERIES.ipca, 12);
    
    // Manual loop for IPCA since URL is different (uses last 12 items)
    for (const proxy of CORS_PROXIES) {
      try {
        const proxyUrl = `${proxy}${encodeURIComponent(bcbUrl)}`;
        const response = await fetchWithTimeout(proxyUrl);

        if (response.ok) {
          const data: BCBResponse[] = await response.json();
          if (data && data.length > 0) {
            // Accumulate monthly rates: (1 + r1) * (1 + r2) * ... - 1
            let accumulated = 1;
            for (const item of data) {
              const monthlyRate = parseFloat(item.valor) / 100;
              accumulated *= (1 + monthlyRate);
            }
            return accumulated - 1;
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error('Failed to fetch IPCA:', error);
  }
  return null;
}

/**
 * Fetch status for UI feedback.
 */
export interface FetchStatus {
  success: boolean;
  message: string;
  rates: GlobalRates;
  fetchedRates: {
    cdi: boolean;
    ipca: boolean;
    selic: boolean;
  };
}

/**
 * Attempts to fetch all rates, falling back to defaults on failure.
 */
export async function fetchAllRates(): Promise<FetchStatus> {
  console.log('Fetching rates from BCB API...');

  const fetchedRates = {
    cdi: false,
    ipca: false,
    selic: false,
  };

  // Fetch all rates in parallel
  const [cdi, ipca, selic] = await Promise.all([
    fetchCDI(),
    fetchIPCA(),
    fetchSelic(),
  ]);

  // Use a temporary object to hold fetched values, but don't depend on DEFAULT_RATES import
  // which causes circular dependencies or unused vars.
  // The caller (manager.ts) should handle merging with defaults if needed,
  // or we return a partial object.
  // However, preserving existing logic: we return the defaults if fetch fails.
  // We'll define defaults locally to avoid import issues.
  const localDefaults: GlobalRates = {
     cdi: 0.1065,
     ipca: 0.045,
     selic: 0.1075
  };

  const rates: GlobalRates = { ...localDefaults };

  if (cdi !== null) {
    rates.cdi = cdi;
    fetchedRates.cdi = true;
    console.log(`CDI fetched: ${(cdi * 100).toFixed(2)}%`);
  }

  if (ipca !== null) {
    rates.ipca = ipca;
    fetchedRates.ipca = true;
    console.log(`IPCA fetched: ${(ipca * 100).toFixed(2)}%`);
  }

  if (selic !== null) {
    rates.selic = selic;
    fetchedRates.selic = true;
    console.log(`Selic fetched: ${(selic * 100).toFixed(2)}%`);
  }

  const fetchedCount = Object.values(fetchedRates).filter(Boolean).length;
  const totalCount = Object.keys(fetchedRates).length;

  let message: string;
  let success: boolean;

  if (fetchedCount === totalCount) {
    message = 'Taxas atualizadas do Banco Central';
    success = true;
  } else if (fetchedCount > 0) {
    const missing = Object.entries(fetchedRates)
      .filter(([_, fetched]) => !fetched)
      .map(([name]) => name.toUpperCase())
      .join(', ');
    message = `Algumas taxas não disponíveis (${missing})`;
    success = true;
  } else {
    message = 'Usando taxas padrão (API indisponível)';
    success = false;
  }

  return { success, message, rates, fetchedRates };
}