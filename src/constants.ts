import type { TaxBracket, GlobalRates, InvestmentTypeInfo } from './types';

// ===== Tax Brackets (IR Regressivo) =====

export const TAX_BRACKETS: TaxBracket[] = [
  { minDays: 0,   maxDays: 180,      rate: 0.225 },
  { minDays: 181, maxDays: 360,      rate: 0.20  },
  { minDays: 361, maxDays: 720,      rate: 0.175 },
  { minDays: 721, maxDays: Infinity, rate: 0.15  },
];

export const TAX_BRACKET_DAYS = [180, 360, 720] as const;

// ===== Default Rates (Fallback) =====

export const DEFAULT_RATES: GlobalRates = {
  cdi: 0.1065,   // 10.65%
  ipca: 0.045,   // 4.5%
  selic: 0.1075, // 10.75%
};

// ===== Time Constants =====

export const DEFAULT_CHART_PERIOD_DAYS = 365;
export const DAYS_IN_YEAR = 365;

// ===== BCB API Series Codes =====

export const BCB_SERIES = {
  selic: 432,
  cdi: 12,
  ipca: 433,
} as const;

// ===== Investment Type Configurations =====

export const INVESTMENT_TYPES: InvestmentTypeInfo[] = [
  {
    value: 'cdi-percent',
    label: 'X% do CDI',
    rateLabel: 'Percentual do CDI (%)',
    ratePlaceholder: 'Ex: 110',
    alwaysTaxed: false,  // User can toggle (LCA/LCI vs CDB)
  },
  {
    value: 'ipca-plus',
    label: 'IPCA + X% a.a.',
    rateLabel: 'Taxa adicional (% a.a.)',
    ratePlaceholder: 'Ex: 6.5',
    alwaysTaxed: false,
  },
  {
    value: 'cdi-plus',
    label: 'CDI + X% a.a.',
    rateLabel: 'Taxa adicional (% a.a.)',
    ratePlaceholder: 'Ex: 2',
    alwaysTaxed: false,
  },
  {
    value: 'prefixed',
    label: 'X% a.a. (Pré-fixado)',
    rateLabel: 'Taxa anual (%)',
    ratePlaceholder: 'Ex: 12.5',
    alwaysTaxed: false,
  },
  {
    value: 'selic-plus',
    label: 'SELIC + X% a.a.',
    rateLabel: 'Taxa adicional (% a.a.)',
    ratePlaceholder: 'Ex: 0.1',
    alwaysTaxed: false,
  },
];

// ===== Helper to get type info =====

export function getInvestmentTypeInfo(type: string): InvestmentTypeInfo | undefined {
  return INVESTMENT_TYPES.find(t => t.value === type);
}