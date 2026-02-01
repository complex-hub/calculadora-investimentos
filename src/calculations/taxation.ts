import type { TaxBracket } from '../types';

/**
 * Returns the applicable tax rate for a given holding period.
 */
export function getTaxRate(holdingDays: number): number;

/**
 * Calculates net return after applying IR.
 * Net = Gross - (Gross × TaxRate)
 * 
 * Note: Tax is applied only to the GAINS, not the principal.
 */
export function calculateNetReturn(
  grossReturn: number,
  holdingDays: number,
  isTaxed: boolean
): number;

/**
 * Generates an array of net returns for each day from 0 to totalDays.
 */
export function generateNetReturnSeries(
  grossReturns: number[],
  isTaxed: boolean
): number[];