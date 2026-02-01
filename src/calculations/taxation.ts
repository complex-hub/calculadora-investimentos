import { TAX_BRACKETS } from '../constants';
import type { TaxBracket } from '../types';

/**
 * Returns the applicable tax bracket for a given holding period.
 */
export function getTaxBracket(holdingDays: number): TaxBracket {
  const bracket = TAX_BRACKETS.find(
    b => holdingDays >= b.minDays && holdingDays <= b.maxDays
  );
  
  // Fallback to lowest tax rate if somehow not found
  return bracket ?? TAX_BRACKETS[TAX_BRACKETS.length - 1];
}

/**
 * Returns the applicable tax rate (as decimal) for a given holding period.
 * 
 * Brazilian IR rates:
 * - 0-180 days: 22.5%
 * - 181-360 days: 20%
 * - 361-720 days: 17.5%
 * - 721+ days: 15%
 */
export function getTaxRate(holdingDays: number): number {
  return getTaxBracket(holdingDays).rate;
}

/**
 * Calculates net return after applying Income Tax (IR).
 * 
 * Tax is applied only to the GAINS, not the principal.
 * Formula: netReturn = grossReturn × (1 - taxRate)
 * 
 * @param grossReturn - The gross return as a decimal (e.g., 0.10 for 10%)
 * @param holdingDays - Number of days the investment was held
 * @param isTaxed - Whether this investment is subject to IR
 * @returns Net return as a decimal
 */
export function calculateNetReturn(
  grossReturn: number,
  holdingDays: number,
  isTaxed: boolean
): number {
  // If not taxed (LCA/LCI), return gross
  if (!isTaxed) {
    return grossReturn;
  }
  
  // If no gains, no tax
  if (grossReturn <= 0) {
    return grossReturn;
  }
  
  const taxRate = getTaxRate(holdingDays);
  const netReturn = grossReturn * (1 - taxRate);
  
  return netReturn;
}

/**
 * Calculates the tax amount on a given gross return.
 * 
 * @param grossReturn - The gross return as a decimal
 * @param holdingDays - Number of days the investment was held
 * @param isTaxed - Whether this investment is subject to IR
 * @returns Tax amount as a decimal (e.g., 0.02 for 2% tax on principal)
 */
export function calculateTaxAmount(
  grossReturn: number,
  holdingDays: number,
  isTaxed: boolean
): number {
  if (!isTaxed || grossReturn <= 0) {
    return 0;
  }
  
  const taxRate = getTaxRate(holdingDays);
  return grossReturn * taxRate;
}

/**
 * Returns the days at which tax brackets change.
 * Useful for rendering vertical lines on the chart.
 */
export function getTaxBracketTransitionDays(): number[] {
  return [180, 360, 720];
}

/**
 * Formats the tax rate for display.
 */
export function formatTaxRate(holdingDays: number): string {
  const rate = getTaxRate(holdingDays);
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Returns a description of the current tax bracket.
 */
export function getTaxBracketDescription(holdingDays: number): string {
  const rate = getTaxRate(holdingDays);
  const percentage = (rate * 100).toFixed(1);
  
  if (holdingDays <= 180) {
    return `${percentage}% (até 180 dias)`;
  } else if (holdingDays <= 360) {
    return `${percentage}% (181-360 dias)`;
  } else if (holdingDays <= 720) {
    return `${percentage}% (361-720 dias)`;
  } else {
    return `${percentage}% (acima de 720 dias)`;
  }
}