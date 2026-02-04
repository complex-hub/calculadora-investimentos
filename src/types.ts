// ===== Investment Types =====

export type InvestmentType =
  | 'cdi-percent'   // X% do CDI
  | 'ipca-plus'     // IPCA + X% a.a.
  | 'cdi-plus'      // CDI + X% a.a.
  | 'prefixed'      // X% a.a.
  | 'selic-plus';   // SELIC + X% a.a.

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  rate: number;           // The "X" in the formulas (as percentage, e.g., 110 for "110% do CDI")
  isTaxed: boolean;
  dueDate: Date | null;   // null = no due date
  createdAt: Date;
}

// ===== Global Rates =====

export interface GlobalRates {
  cdi: number;    // Annual rate as decimal (e.g., 0.1065 for 10.65%)
  ipca: number;   // Annual rate as decimal
  selic: number;  // Annual rate as decimal
}

// ===== Chart Data =====

export interface ChartDataPoint {
  date: Date;
  netReturn: number;  // As decimal (e.g., 0.05 for 5% return)
}

export interface InvestmentSeries {
  investment: Investment;
  data: ChartDataPoint[];
}

// ===== Application State =====

export interface AppState {
  investments: Investment[];
  globalRates: GlobalRates;
  chartEndDate: Date;
  editingInvestmentId: string | null;
  showBaseline: boolean;
}

// ===== Tax Bracket =====

export interface TaxBracket {
  minDays: number;
  maxDays: number;    // Infinity for last bracket
  rate: number;       // As decimal (e.g., 0.225 for 22.5%)
}

// ===== Investment Type Display Info =====

export interface InvestmentTypeInfo {
  value: InvestmentType;
  label: string;
  rateLabel: string;        // Label for the rate input
  ratePlaceholder: string;  // Placeholder example
  alwaysTaxed: boolean;     // If true, no tax toggle shown
}