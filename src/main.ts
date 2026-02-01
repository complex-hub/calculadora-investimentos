import type { Investment, GlobalRates, AppState } from './types';
import { 
  createInitialState, 
  upsertInvestment, 
  removeInvestment, 
  updateGlobalRates,
  getInvestmentById,
  setChartEndDate,
  setInvestments,
} from './state';
import { initializeFormHandlers, populateForm, resetForm } from './ui/form';
import { renderInvestmentList } from './ui/investmentList';
import { 
  renderRatesPanel, 
  initializeRatesPanelHandlers, 
  setRatesStatus,
  showRefreshButton,
} from './ui/ratesPanel';
import { 
  formatDateForInput, 
  parseInputDate, 
  getToday,
} from './utils/dates';
import { runCalculationTests } from './calculations/tests';
import {
  initializeChart,
  updateChart,
  calculateChartEndDate,
  toggleChartPlaceholder,
  refreshChart,
} from './chart';
import { initializeRates, refreshRates } from './rates';
import {
  saveInvestments,
  loadInvestments,
  saveChartEndDate,
  loadChartEndDate,
  clearAllStorage,
  exportState,
  importState,
} from './storage';

// ===== Application State =====

let state: AppState;

// ===== Initialization =====

async function main(): Promise<void> {
  console.log('Investment Calculator starting...');

  // 1. Show loading state
  setRatesStatus('Buscando taxas do Banco Central...', 'loading');

  // 2. Load saved investments from localStorage
  const savedInvestments = loadInvestments();
  const savedEndDate = loadChartEndDate();

  // 3. Initialize rates (from cache or API)
  const ratesResult = await initializeRates();

  // 4. Initialize state
  state = createInitialState(ratesResult.rates);
  state = setInvestments(state, savedInvestments);
  state = setChartEndDate(state, savedEndDate);

  // 5. Update UI with rates status
  setRatesStatus(ratesResult.message, ratesResult.success ? 'success' : 'error');
  showRefreshButton(true);

  // 6. Initialize chart
  const canvas = document.getElementById('investment-chart') as HTMLCanvasElement;
  if (canvas) {
    initializeChart(canvas);
    toggleChartPlaceholder(state.investments.length === 0);
    
    // Initial chart render if we have investments
    if (state.investments.length > 0) {
      updateChartWithCurrentState();
    }
  }

  // 7. Render initial UI
  renderRatesPanel(state.globalRates);
  renderInvestmentList(
    state.investments,
    state.globalRates,
    handleInvestmentEdit,
    handleInvestmentRemove
  );
  initializeChartEndDate();

  // 8. Set up event handlers
  initializeFormHandlers(handleInvestmentSubmit);
  initializeRatesPanelHandlers(handleRateChange, handleRatesRefresh);
  initializeChartEndDateHandler();
  initializeWindowResizeHandler();
  initializeClearAllHandler();
  initializeExportImportHandlers();

  console.log('Investment Calculator initialized');
  console.log('Initial state:', state);
  console.log(`Loaded ${savedInvestments.length} saved investments`);
}

// ===== Chart Update Helper =====

function updateChartWithCurrentState(): void {
  const startDate = getToday();
  
  // Recalculate end date based on investments
  const autoEndDate = calculateChartEndDate(state.investments, startDate);
  
  // Use the later of: auto-calculated end date or user-set end date
  const endDate = autoEndDate > state.chartEndDate ? autoEndDate : state.chartEndDate;
  
  // Update state if end date changed
  if (endDate.getTime() !== state.chartEndDate.getTime()) {
    state = setChartEndDate(state, endDate);
    updateChartEndDateInput(endDate);
    saveChartEndDate(endDate);
  }
  
  // Toggle placeholder based on whether there are investments
  toggleChartPlaceholder(state.investments.length === 0);
  
  // Update chart
  if (state.investments.length > 0) {
    updateChart(state.investments, state.globalRates, startDate, endDate);
  }
}

function updateChartEndDateInput(date: Date): void {
  const input = document.getElementById('chart-end-date') as HTMLInputElement;
  if (input) {
    input.value = formatDateForInput(date);
  }
}

// ===== Event Handlers =====

function handleInvestmentSubmit(investment: Investment): void {
  console.log('Investment submitted:', investment);

  // Update state
  state = upsertInvestment(state, investment);

  // Save to localStorage
  saveInvestments(state.investments);

  // Re-render UI
  renderInvestmentList(
    state.investments,
    state.globalRates,
    handleInvestmentEdit,
    handleInvestmentRemove
  );

  // Update chart
  updateChartWithCurrentState();

  // Show success feedback
  showToast(`"${investment.name}" adicionado com sucesso!`);

  console.log('Updated state:', state);
}

function handleInvestmentEdit(id: string): void {
  console.log('Editing investment:', id);

  const investment = getInvestmentById(state, id);
  
  if (investment) {
    populateForm(investment);
    
    // Scroll form into view on mobile
    const form = document.getElementById('investment-form');
    if (form && window.innerWidth < 900) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  } else {
    console.error('Investment not found:', id);
  }
}

function handleInvestmentRemove(id: string): void {
  console.log('Removing investment:', id);

  const investment = getInvestmentById(state, id);
  const name = investment?.name ?? 'Investimento';

  // Update state
  state = removeInvestment(state, id);

  // Save to localStorage
  saveInvestments(state.investments);

  // Re-render UI
  renderInvestmentList(
    state.investments,
    state.globalRates,
    handleInvestmentEdit,
    handleInvestmentRemove
  );

  // Reset form if we were editing this investment
  resetForm();

  // Update chart
  updateChartWithCurrentState();

  // Show feedback
  showToast(`"${name}" removido`);

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

  // Update chart with new rates
  updateChartWithCurrentState();

  console.log('Updated state:', state);
}

async function handleRatesRefresh(): Promise<void> {
  console.log('Refreshing rates...');
  setRatesStatus('Atualizando taxas...', 'loading');

  const result = await refreshRates();

  // Update state with new rates
  state = updateGlobalRates(state, result.rates);

  // Update UI
  renderRatesPanel(state.globalRates);
  setRatesStatus(result.message, result.success ? 'success' : 'error');

  // Re-render investment list with new rates
  renderInvestmentList(
    state.investments,
    state.globalRates,
    handleInvestmentEdit,
    handleInvestmentRemove
  );

  // Update chart
  updateChartWithCurrentState();

  if (result.success) {
    showToast('Taxas atualizadas!');
  }
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
      saveChartEndDate(newDate);
      console.log('Chart end date changed:', newDate);
      updateChartWithCurrentState();
    }
  });
}

// ===== Window Resize Handler =====

function initializeWindowResizeHandler(): void {
  let resizeTimeout: number;
  let lastWidth = window.innerWidth;
  
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    
    resizeTimeout = window.setTimeout(() => {
      const currentWidth = window.innerWidth;
      
      // Only handle significant width changes
      if (Math.abs(currentWidth - lastWidth) > 50) {
        lastWidth = currentWidth;
        refreshChart();
      }
    }, 300);
  });
}

// ===== Clear All Handler =====

function initializeClearAllHandler(): void {
  const clearBtn = document.getElementById('clear-all-btn');
  
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    if (state.investments.length === 0) {
      showToast('Nenhum investimento para remover');
      return;
    }

    const count = state.investments.length;
    if (confirm(`Remover todos os ${count} investimentos?`)) {
      // Clear state
      state = setInvestments(state, []);
      
      // Clear storage
      saveInvestments([]);
      
      // Reset form
      resetForm();
      
      // Re-render UI
      renderInvestmentList(
        state.investments,
        state.globalRates,
        handleInvestmentEdit,
        handleInvestmentRemove
      );
      
      // Update chart
      updateChartWithCurrentState();

      showToast('Todos os investimentos removidos');
    }
  });
}

// ===== Export/Import Handlers =====

function initializeExportImportHandlers(): void {
  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (state.investments.length === 0) {
        showToast('Nenhum investimento para exportar');
        return;
      }

      const json = exportState(state);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `investimentos-${formatDateForFilename(new Date())}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      showToast('Dados exportados!');
    });
  }

  // Import button
  const importBtn = document.getElementById('import-btn');
  const importInput = document.getElementById('import-input') as HTMLInputElement;
  
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => {
      importInput.click();
    });

    importInput.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = importState(text);
        
        if (imported) {
          state = setInvestments(state, imported.investments);
          state = setChartEndDate(state, imported.chartEndDate);
          
          saveInvestments(state.investments);
          saveChartEndDate(state.chartEndDate);
          
          renderInvestmentList(
            state.investments,
            state.globalRates,
            handleInvestmentEdit,
            handleInvestmentRemove
          );
          
          updateChartEndDateInput(state.chartEndDate);
          updateChartWithCurrentState();
          
          showToast(`${imported.investments.length} investimentos importados!`);
        } else {
          showToast('Erro ao importar arquivo');
        }
      } catch (error) {
        console.error('Import error:', error);
        showToast('Erro ao ler arquivo');
      }

      // Reset input
      importInput.value = '';
    });
  }
}

// ===== Toast Notifications =====

function showToast(message: string, duration: number = 3000): void {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) {
    existing.remove();
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== Utility Functions =====

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ===== Development Helpers =====

declare global {
  interface Window {
    appState: () => AppState;
    runTests: () => void;
    updateChart: () => void;
    clearAll: () => void;
    exportData: () => string;
  }
}

window.appState = () => state;
window.runTests = runCalculationTests;
window.updateChart = updateChartWithCurrentState;
window.clearAll = () => {
  clearAllStorage();
  location.reload();
};
window.exportData = () => exportState(state);

console.log('💡 Debug helpers available:');
console.log('   window.appState() - Get current app state');
console.log('   window.runTests() - Run calculation tests');
console.log('   window.updateChart() - Force chart update');
console.log('   window.clearAll() - Clear all data and reload');
console.log('   window.exportData() - Export data as JSON');

// ===== Start Application =====

document.addEventListener('DOMContentLoaded', main);