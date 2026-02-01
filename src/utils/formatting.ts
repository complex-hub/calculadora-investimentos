/**
 * Formats a decimal as percentage string for display.
 * e.g., 0.1065 → "10,65%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const percentage = value * 100;
  return percentage.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + '%';
}

/**
 * Formats a number for display in inputs (using comma as decimal separator).
 * e.g., 0.1065 → "10,65"
 */
export function formatRateForInput(value: number): string {
  const percentage = value * 100;
  return percentage.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parses a percentage input string to decimal.
 * Handles both comma and dot as decimal separators.
 * e.g., "10,65" → 0.1065
 * e.g., "110" → 1.10 (for "110% do CDI")
 */
export function parsePercentageInput(value: string): number | null {
  if (!value || value.trim() === '') return null;
  
  // Replace comma with dot for parsing
  const normalized = value.trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  
  if (isNaN(parsed)) return null;
  
  return parsed / 100;
}

/**
 * Parses a rate input and returns the raw number (not converted to decimal).
 * e.g., "110" → 110
 * e.g., "6,5" → 6.5
 */
export function parseRateInput(value: string): number | null {
  if (!value || value.trim() === '') return null;
  
  const normalized = value.trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  
  if (isNaN(parsed)) return null;
  
  return parsed;
}

/**
 * Generates a unique ID for investments.
 */
export function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats an investment type for display.
 */
export function formatInvestmentType(type: string, rate: number): string {
  switch (type) {
    case 'cdi-percent':
      return `${rate}% do CDI`;
    case 'ipca-plus':
      return `IPCA + ${rate}% a.a.`;
    case 'cdi-plus':
      return `CDI + ${rate}% a.a.`;
    case 'prefixed':
      return `${rate}% a.a.`;
    case 'selic-plus':
      return `SELIC + ${rate}% a.a.`;
    default:
      return `${rate}%`;
  }
}