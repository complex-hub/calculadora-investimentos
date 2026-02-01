import type { AppState, Investment, GlobalRates } from './types';
import { DEFAULT_RATES } from './constants';
import { getDefaultEndDate } from './utils/dates';

/**
 * Creates initial application state.
 */
export function createInitialState(rates?: Partial<GlobalRates>): AppState {
  return {
    investments: [],
    globalRates: {
      ...DEFAULT_RATES,
      ...rates,
    },
    chartEndDate: getDefaultEndDate(),
    editingInvestmentId: null,
  };
}

/**
 * Adds a new investment to state.
 */
export function addInvestment(state: AppState, investment: Investment): AppState {
  return {
    ...state,
    investments: [...state.investments, investment],
    editingInvestmentId: null,
  };
}

/**
 * Updates an existing investment in state.
 */
export function updateInvestment(state: AppState, investment: Investment): AppState {
  return {
    ...state,
    investments: state.investments.map(inv =>
      inv.id === investment.id ? investment : inv
    ),
    editingInvestmentId: null,
  };
}

/**
 * Adds or updates an investment in state.
 */
export function upsertInvestment(state: AppState, investment: Investment): AppState {
  const exists = state.investments.some(inv => inv.id === investment.id);
  
  if (exists) {
    return updateInvestment(state, investment);
  } else {
    return addInvestment(state, investment);
  }
}

/**
 * Removes an investment from state.
 */
export function removeInvestment(state: AppState, investmentId: string): AppState {
  return {
    ...state,
    investments: state.investments.filter(inv => inv.id !== investmentId),
    editingInvestmentId: state.editingInvestmentId === investmentId 
      ? null 
      : state.editingInvestmentId,
  };
}

/**
 * Updates global rates in state.
 */
export function updateGlobalRates(
  state: AppState,
  rates: Partial<GlobalRates>
): AppState {
  return {
    ...state,
    globalRates: {
      ...state.globalRates,
      ...rates,
    },
  };
}

/**
 * Sets the investment currently being edited.
 */
export function setEditingInvestment(
  state: AppState,
  investmentId: string | null
): AppState {
  return {
    ...state,
    editingInvestmentId: investmentId,
  };
}

/**
 * Updates the chart end date.
 */
export function setChartEndDate(state: AppState, endDate: Date): AppState {
  return {
    ...state,
    chartEndDate: endDate,
  };
}

/**
 * Gets an investment by ID.
 */
export function getInvestmentById(
  state: AppState,
  investmentId: string
): Investment | undefined {
  return state.investments.find(inv => inv.id === investmentId);
}

/**
 * Replaces all investments in state.
 */
export function setInvestments(state: AppState, investments: Investment[]): AppState {
  return {
    ...state,
    investments,
    editingInvestmentId: null,
  };
}