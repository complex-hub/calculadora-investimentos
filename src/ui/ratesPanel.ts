import type { GlobalRates } from '../types';
import { formatRateForInput, parsePercentageInput } from '../utils/formatting';

/**
 * Populates the rates panel with current values.
 */
export function renderRatesPanel(rates: GlobalRates): void {
  const cdiInput = document.getElementById('rate-cdi') as HTMLInputElement;
  const ipcaInput = document.getElementById('rate-ipca') as HTMLInputElement;
  const selicInput = document.getElementById('rate-selic') as HTMLInputElement;

  if (cdiInput) cdiInput.value = formatRateForInput(rates.cdi);
  if (ipcaInput) ipcaInput.value = formatRateForInput(rates.ipca);
  if (selicInput) selicInput.value = formatRateForInput(rates.selic);

  console.log('Rates panel rendered:', rates);
}

/**
 * Updates the rates status message.
 */
export function setRatesStatus(message: string, type: 'loading' | 'success' | 'error'): void {
  const statusElement = document.getElementById('rates-status');
  
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.className = 'rates-status';
  
  if (type !== 'loading') {
    statusElement.classList.add(type);
  }
}

/**
 * Sets up event listeners for manual rate changes.
 */
export function initializeRatesPanelHandlers(
  onRateChange: (key: keyof GlobalRates, value: number) => void
): void {
  const inputs: { id: string; key: keyof GlobalRates }[] = [
    { id: 'rate-cdi', key: 'cdi' },
    { id: 'rate-ipca', key: 'ipca' },
    { id: 'rate-selic', key: 'selic' },
  ];

  inputs.forEach(({ id, key }) => {
    const input = document.getElementById(id) as HTMLInputElement;
    
    if (!input) {
      console.warn(`Rate input not found: ${id}`);
      return;
    }

    // Handle blur (when user leaves the field)
    input.addEventListener('blur', () => {
      const value = parsePercentageInput(input.value);
      
      if (value !== null && value > 0) {
        console.log(`Rate changed: ${key} = ${value}`);
        onRateChange(key, value);
      } else {
        console.warn(`Invalid rate value for ${key}:`, input.value);
        // Could reset to previous value here
      }
    });

    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  });

  console.log('Rates panel handlers initialized');
}