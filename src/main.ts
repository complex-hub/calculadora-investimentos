import type { Investment, GlobalRates, AppState } from './types';
import { 
  createInitialState, 
  upsertInvestment, 
  removeInvestment, 
  updateGlobalRates,
  getInvestmentById,
  setChartEndDate 
} from './state';
import { initializeFormHandlers, populateForm, resetForm } from './ui/form';
import { renderInvestmentList } from './ui/investmentList';
import { 
  renderRatesPanel, 
  initializeRatesPanelHandlers, 
  setRatesStatus 
} from './ui/ratesPanel';
import { formatDateForInput, parseInputDate, getToday } from './utils/dates';
import { runCalculationTests } from './calculations/tests';

// ===== Application State =====

let state: AppState;

// ===== Initialization =====

async function main(): Promise<void> {
  console.log('Investment Calculator starting...');

  // 1. Initialize state with default rates
  state = createInitialState();
  setRatesStatus('Usando taxas padrão', 'success');

  // 2. Render initial UI
  renderRatesPanel(state.globalRates);
  renderInvestmentList(
    state.investments,
    state.globalRates,
    handleInvestmentEdit,
    handleInvestmentRemove
  );
  initializeChartEndDate();

  // 3. Set up event handlers
  initializeFormHandlers(handleInvestmentSubmit);
  initializeRatesPanelHandlers(handleRateChange);
  initializeChartEndDateHandler();

  console.log('Investment Calculator initialized');
  console.log('Initial state:', state);
}

// ===== Event Handlers =====

function handleInvestmentSubmit(investment: Investment): void {
  console.log('Investment submitted:', investment);

  // Update state
  state = upsertInvestment(state, investment);

  // Re-render UI
  renderInvestmentList(
    state.investments,
    state.globalRates,
    handleInvestmentEdit,
    handleInvestmentRemove
  );

  // TODO: Update chart (Phase 4)
  console.log('Updated state:', state);
}

function handleInvestmentEdit(id: string): void {
  console.log('Editing investment:', id);

  const investment = getInvestmentById(state, id);
  
  if (investment) {
    populateForm(investment);
  } else {
    console.error('Investment not found:', id);
  }
}

function handleInvestmentRemove(id: string): void {
  console.log('Removing investment:', id);

  // Update state
  state = removeInvestment(state, id);

  // Re-render UI
  renderInvestmentList(
    state.investments,
    state.globalRates,
    handleInvestmentEdit,
    handleInvestmentRemove
  );

  // Reset form if we were editing this investment
  resetForm();

  // TODO: Update chart (Phase 4)
  console.log('Updated state:', state);
}

function handleRateChange(key: keyof GlobalRates, value: number): void {
  console.log('Rate changed:', key, '=', value);

  // Update state
  state = updateGlobalRates(state, { [key]: value });

  // Re-render rates panel (to normalize display)
  renderRatesPanel(state.globalRates);

  // Re-render investment list (returns will recalculate)
  renderInvestmentList(
    state.investments,
    state.globalRates,
    handleInvestmentEdit,
    handleInvestmentRemove
  );

  // TODO: Update chart (Phase 4)
  console.log('Updated state:', state);
}

// ===== Chart End Date =====

function initializeChartEndDate(): void {
  const input = document.getElementById('chart-end-date') as HTMLInputElement;
  
  if (input) {
    input.value = formatDateForInput(state.chartEndDate);
    input.min = formatDateForInput(getToday());
  }
}

function initializeChartEndDateHandler(): void {
  const input = document.getElementById('chart-end-date') as HTMLInputElement;
  
  if (!input) return;

  input.addEventListener('change', () => {
    const newDate = parseInputDate(input.value);
    
    if (newDate && newDate > getToday()) {
      state = setChartEndDate(state, newDate);
      console.log('Chart end date changed:', newDate);
      // TODO: Update chart (Phase 4)
    }
  });
}

// ===== Development Helpers =====

declare global {
  interface Window {
    appState: () => AppState;
    runTests: () => void;
  }
}

window.appState = () => state;
window.runTests = runCalculationTests;

console.log('💡 Debug helpers available:');
console.log('   window.appState() - Get current app state');
console.log('   window.runTests() - Run calculation tests');

// ===== Start Application =====

document.addEventListener('DOMContentLoaded', main);