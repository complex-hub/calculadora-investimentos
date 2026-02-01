import type { Investment, GlobalRates } from '../types';

/**
 * Calculates the gross (pre-tax) annual rate for an investment
 * based on its type and the current global rates.
 */
export function getGrossAnnualRate(
  investment: Investment,
  rates: GlobalRates
): number;

/**
 * Calculates the gross accumulated return for a given number of days.
 * Uses compound interest: (1 + annualRate)^(days/365) - 1
 */
export function calculateGrossReturn(
  annualRate: number,
  days: number
): number;

/**
 * Generates an array of gross returns for each day from 0 to totalDays.
 */
export function generateGrossReturnSeries(
  investment: Investment,
  rates: GlobalRates,
  totalDays: number
): number[];