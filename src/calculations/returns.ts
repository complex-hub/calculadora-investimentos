import type { Investment, GlobalRates, InvestmentType } from '../types';
import { DAYS_IN_YEAR } from '../constants';
import { calculateNetReturn } from './taxation';

/**
 * Calculates the effective annual rate for an investment based on its type.
 * 
 * Rate formulas by type:
 * - cdi-percent: CDI × (rate / 100)     → e.g., 110% of CDI
 * - ipca-plus:   IPCA + (rate / 100)    → e.g., IPCA + 6%
 * - cdi-plus:    CDI + (rate / 100)     → e.g., CDI + 2%
 * - prefixed:    rate / 100             → e.g., 12% fixed
 * - selic-plus:  SELIC + (rate / 100)   → e.g., SELIC + 0.1%
 * 
 * @param investment - The investment configuration
 * @param rates - Current global rates (CDI, IPCA, SELIC as decimals)
 * @returns Annual rate as a decimal (e.g., 0.1165 for 11.65%)
 */
export function getEffectiveAnnualRate(
  investment: Investment,
  rates: GlobalRates
): number {
  const { type, rate } = investment;
  
  switch (type) {
    case 'cdi-percent':
      // rate is the percentage OF CDI (e.g., 110 means 110% of CDI)
      return rates.cdi * (rate / 100);
    
    case 'ipca-plus':
      // rate is the additional percentage above IPCA
      return rates.ipca + (rate / 100);
    
    case 'cdi-plus':
      // rate is the additional percentage above CDI
      return rates.cdi + (rate / 100);
    
    case 'prefixed':
      // rate is the fixed annual rate
      return rate / 100;
    
    case 'selic-plus':
      // rate is the additional percentage above SELIC
      return rates.selic + (rate / 100);
    
    default:
      console.warn(`Unknown investment type: ${type}`);
      return 0;
  }
}

/**
 * Calculates gross (pre-tax) accumulated return using compound interest.
 * 
 * Formula: (1 + annualRate)^(days/365) - 1
 * 
 * @param annualRate - Annual rate as decimal (e.g., 0.1065 for 10.65%)
 * @param days - Number of days invested
 * @returns Gross return as decimal (e.g., 0.05 for 5% return)
 */
export function calculateGrossReturn(annualRate: number, days: number): number {
  if (days <= 0) {
    return 0;
  }
  
  if (annualRate <= -1) {
    // Prevent invalid calculations with extreme negative rates
    return -1;
  }
  
  const yearsElapsed = days / DAYS_IN_YEAR;
  const grossReturn = Math.pow(1 + annualRate, yearsElapsed) - 1;
  
  return grossReturn;
}

/**
 * Calculates the gross return for a specific investment over a number of days.
 * 
 * @param investment - The investment configuration
 * @param rates - Current global rates
 * @param days - Number of days invested
 * @returns Gross return as decimal
 */
export function calculateInvestmentGrossReturn(
  investment: Investment,
  rates: GlobalRates,
  days: number
): number {
  const annualRate = getEffectiveAnnualRate(investment, rates);
  return calculateGrossReturn(annualRate, days);
}

/**
 * Calculates the net (after-tax) return for an investment.
 * 
 * @param investment - The investment configuration
 * @param rates - Current global rates
 * @param days - Number of days invested
 * @returns Net return as decimal
 */
export function calculateInvestmentNetReturn(
  investment: Investment,
  rates: GlobalRates,
  days: number
): number {
  const grossReturn = calculateInvestmentGrossReturn(investment, rates, days);
  return calculateNetReturn(grossReturn, days, investment.isTaxed);
}

/**
 * Generates an array of gross returns for each day from 0 to totalDays.
 * 
 * @param investment - The investment configuration
 * @param rates - Current global rates
 * @param totalDays - Total number of days to calculate
 * @returns Array of gross returns (index = day number)
 */
export function generateGrossReturnSeries(
  investment: Investment,
  rates: GlobalRates,
  totalDays: number
): number[] {
  const annualRate = getEffectiveAnnualRate(investment, rates);
  const series: number[] = [];
  
  for (let day = 0; day <= totalDays; day++) {
    series.push(calculateGrossReturn(annualRate, day));
  }
  
  return series;
}

/**
 * Generates an array of net returns for each day from 0 to totalDays.
 * This accounts for tax bracket changes at 180, 360, and 720 days.
 * 
 * @param investment - The investment configuration
 * @param rates - Current global rates
 * @param totalDays - Total number of days to calculate
 * @returns Array of net returns (index = day number)
 */
export function generateNetReturnSeries(
  investment: Investment,
  rates: GlobalRates,
  totalDays: number
): number[] {
  const grossSeries = generateGrossReturnSeries(investment, rates, totalDays);
  
  return grossSeries.map((grossReturn, day) => 
    calculateNetReturn(grossReturn, day, investment.isTaxed)
  );
}

/**
 * Calculates equivalent rates for comparison purposes.
 * Useful for comparing different investment types.
 */
export interface EquivalentRates {
  grossAnnual: number;      // Effective annual rate (gross)
  gross30Days: number;      // 30-day return (gross)
  gross365Days: number;     // 1-year return (gross)
  net30Days: number;        // 30-day return (net)
  net365Days: number;       // 1-year return (net)
  net720Days: number;       // 2-year return (net, best tax bracket)
}

export function calculateEquivalentRates(
  investment: Investment,
  rates: GlobalRates
): EquivalentRates {
  const annualRate = getEffectiveAnnualRate(investment, rates);
  
  const gross30 = calculateGrossReturn(annualRate, 30);
  const gross365 = calculateGrossReturn(annualRate, 365);
  const gross720 = calculateGrossReturn(annualRate, 720);
  
  return {
    grossAnnual: annualRate,
    gross30Days: gross30,
    gross365Days: gross365,
    net30Days: calculateNetReturn(gross30, 30, investment.isTaxed),
    net365Days: calculateNetReturn(gross365, 365, investment.isTaxed),
    net720Days: calculateNetReturn(gross720, 720, investment.isTaxed),
  };
}

/**
 * Finds the break-even point where a taxed investment matches an untaxed one.
 * Useful for comparing CDB vs LCA/LCI.
 * 
 * @param taxedInvestment - Taxed investment (e.g., CDB)
 * @param untaxedInvestment - Untaxed investment (e.g., LCA)
 * @param rates - Current global rates
 * @param maxDays - Maximum days to search (default 1080 = ~3 years)
 * @returns Day when taxed catches up, or null if never
 */
export function findBreakEvenDay(
  taxedInvestment: Investment,
  untaxedInvestment: Investment,
  rates: GlobalRates,
  maxDays: number = 1080
): number | null {
  for (let day = 1; day <= maxDays; day++) {
    const taxedNet = calculateInvestmentNetReturn(taxedInvestment, rates, day);
    const untaxedNet = calculateInvestmentNetReturn(untaxedInvestment, rates, day);
    
    if (taxedNet >= untaxedNet) {
      return day;
    }
  }
  
  return null;
}