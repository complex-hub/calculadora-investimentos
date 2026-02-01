export {
  fetchSelic,
  fetchCDI,
  fetchIPCA,
  fetchAllRates,
  type FetchStatus,
} from './api';

export {
  initializeRates,
  refreshRates,
  updateRate,
  clearRatesCache,
} from './manager';