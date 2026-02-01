// Re-export all calculation functions for convenient importing

export {
  getTaxBracket,
  getTaxRate,
  calculateNetReturn,
  calculateTaxAmount,
  getTaxBracketTransitionDays,
  formatTaxRate,
  getTaxBracketDescription,
} from './taxation';

export {
  getEffectiveAnnualRate,
  calculateGrossReturn,
  calculateInvestmentGrossReturn,
  calculateInvestmentNetReturn,
  generateGrossReturnSeries,
  generateNetReturnSeries,
  calculateEquivalentRates,
  findBreakEvenDay,
} from './returns';

export type { EquivalentRates } from './returns';