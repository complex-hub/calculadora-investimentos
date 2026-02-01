/**
 * Manual test suite for calculations.
 * Run these in the browser console to verify correctness.
 * 
 * Usage: Import and call runCalculationTests() from main.ts
 */

import type { Investment, GlobalRates } from '../types';
import {
  getTaxRate,
  calculateNetReturn,
  getEffectiveAnnualRate,
  calculateGrossReturn,
  calculateInvestmentNetReturn,
  generateNetReturnSeries,
  calculateEquivalentRates,
} from './index';

// Test rates (realistic values as of 2024)
const TEST_RATES: GlobalRates = {
  cdi: 0.1065,   // 10.65%
  ipca: 0.045,   // 4.5%
  selic: 0.1075, // 10.75%
};

// Test investments
const testInvestments: Record<string, Investment> = {
  cdb110: {
    id: 'test-cdb-110',
    name: 'CDB 110% CDI',
    type: 'cdi-percent',
    rate: 110,
    isTaxed: true,
    dueDate: null,
    createdAt: new Date(),
  },
  lca100: {
    id: 'test-lca-100',
    name: 'LCA 100% CDI',
    type: 'cdi-percent',
    rate: 100,
    isTaxed: false, // LCA is tax-exempt
    dueDate: null,
    createdAt: new Date(),
  },
  tesouroPre: {
    id: 'test-tesouro-pre',
    name: 'Tesouro Prefixado 12%',
    type: 'prefixed',
    rate: 12,
    isTaxed: true,
    dueDate: null,
    createdAt: new Date(),
  },
  tesouroIPCA: {
    id: 'test-tesouro-ipca',
    name: 'Tesouro IPCA+ 6%',
    type: 'ipca-plus',
    rate: 6,
    isTaxed: true,
    dueDate: null,
    createdAt: new Date(),
  },
  tesouroSelic: {
    id: 'test-tesouro-selic',
    name: 'Tesouro Selic + 0.1%',
    type: 'selic-plus',
    rate: 0.1,
    isTaxed: true,
    dueDate: null,
    createdAt: new Date(),
  },
};

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

function assertEqual(
  name: string,
  actual: number,
  expected: number,
  tolerance: number = 0.0001
): TestResult {
  const passed = Math.abs(actual - expected) < tolerance;
  return {
    name,
    passed,
    expected: expected.toFixed(6),
    actual: actual.toFixed(6),
  };
}

export function runCalculationTests(): void {
  console.log('='.repeat(60));
  console.log('CALCULATION TESTS');
  console.log('='.repeat(60));
  
  const results: TestResult[] = [];
  
  // ===== Tax Rate Tests =====
  console.log('\n--- Tax Rate Tests ---');
  
  results.push(assertEqual('Tax rate at day 30', getTaxRate(30), 0.225));
  results.push(assertEqual('Tax rate at day 180', getTaxRate(180), 0.225));
  results.push(assertEqual('Tax rate at day 181', getTaxRate(181), 0.20));
  results.push(assertEqual('Tax rate at day 360', getTaxRate(360), 0.20));
  results.push(assertEqual('Tax rate at day 361', getTaxRate(361), 0.175));
  results.push(assertEqual('Tax rate at day 720', getTaxRate(720), 0.175));
  results.push(assertEqual('Tax rate at day 721', getTaxRate(721), 0.15));
  results.push(assertEqual('Tax rate at day 1000', getTaxRate(1000), 0.15));
  
  // ===== Gross Return Tests =====
  console.log('\n--- Gross Return Tests ---');
  
  // 10% annual rate for 365 days should give ~10% return
  results.push(assertEqual(
    'Gross return 10% for 365 days',
    calculateGrossReturn(0.10, 365),
    0.10,
    0.001
  ));
  
  // 10% annual rate for 730 days (2 years) with compound interest
  // (1.10)^2 - 1 = 0.21
  results.push(assertEqual(
    'Gross return 10% for 730 days',
    calculateGrossReturn(0.10, 730),
    0.21,
    0.001
  ));
  
  // 10% annual rate for 182.5 days (half year)
  // (1.10)^0.5 - 1 ≈ 0.0488
  results.push(assertEqual(
    'Gross return 10% for 182.5 days',
    calculateGrossReturn(0.10, 182.5),
    0.0488,
    0.001
  ));
  
  // ===== Effective Annual Rate Tests =====
  console.log('\n--- Effective Annual Rate Tests ---');
  
  // CDB 110% of CDI (10.65%) = 11.715%
  results.push(assertEqual(
    'CDB 110% CDI effective rate',
    getEffectiveAnnualRate(testInvestments.cdb110, TEST_RATES),
    0.11715,
    0.0001
  ));
  
  // LCA 100% of CDI = 10.65%
  results.push(assertEqual(
    'LCA 100% CDI effective rate',
    getEffectiveAnnualRate(testInvestments.lca100, TEST_RATES),
    0.1065,
    0.0001
  ));
  
  // Tesouro Prefixado 12% = 12%
  results.push(assertEqual(
    'Tesouro Pre 12% effective rate',
    getEffectiveAnnualRate(testInvestments.tesouroPre, TEST_RATES),
    0.12,
    0.0001
  ));
  
  // Tesouro IPCA+ 6% = 4.5% + 6% = 10.5%
  results.push(assertEqual(
    'Tesouro IPCA+ 6% effective rate',
    getEffectiveAnnualRate(testInvestments.tesouroIPCA, TEST_RATES),
    0.105,
    0.0001
  ));
  
  // Tesouro Selic + 0.1% = 10.75% + 0.1% = 10.85%
  results.push(assertEqual(
    'Tesouro Selic + 0.1% effective rate',
    getEffectiveAnnualRate(testInvestments.tesouroSelic, TEST_RATES),
    0.1085,
    0.0001
  ));
  
  // ===== Net Return Tests =====
  console.log('\n--- Net Return Tests ---');
  
  // CDB 110% CDI for 365 days
  // Gross: 11.715% annual → ~11.715% for 365 days
  // Tax: 17.5% (361-720 days bracket)
  // Net: 11.715% * (1 - 0.175) = ~9.665%
  const cdb365Gross = calculateGrossReturn(0.11715, 365);
  const cdb365Net = calculateNetReturn(cdb365Gross, 365, true);
  results.push(assertEqual(
    'CDB 110% CDI net return 365 days',
    cdb365Net,
    cdb365Gross * 0.825, // 1 - 0.175
    0.0001
  ));
  
  // LCA 100% CDI for 365 days (tax-exempt)
  // Gross: 10.65% → Net: 10.65% (no tax)
  const lca365Net = calculateInvestmentNetReturn(testInvestments.lca100, TEST_RATES, 365);
  results.push(assertEqual(
    'LCA 100% CDI net return 365 days (no tax)',
    lca365Net,
    calculateGrossReturn(0.1065, 365),
    0.0001
  ));
  
  // ===== CDB vs LCA Comparison =====
  console.log('\n--- CDB vs LCA Comparison ---');
  
  // At 365 days:
  // CDB 110% CDI net: ~9.665%
  // LCA 100% CDI net: ~10.65%
  // LCA should win at this point
  const cdb365 = calculateInvestmentNetReturn(testInvestments.cdb110, TEST_RATES, 365);
  const lca365 = calculateInvestmentNetReturn(testInvestments.lca100, TEST_RATES, 365);
  
  console.log(`At 365 days:`);
  console.log(`  CDB 110% CDI (net): ${(cdb365 * 100).toFixed(2)}%`);
  console.log(`  LCA 100% CDI (net): ${(lca365 * 100).toFixed(2)}%`);
  console.log(`  Difference: ${((lca365 - cdb365) * 100).toFixed(2)}% in favor of ${lca365 > cdb365 ? 'LCA' : 'CDB'}`);
  
  // At 721 days (best tax bracket):
  const cdb721 = calculateInvestmentNetReturn(testInvestments.cdb110, TEST_RATES, 721);
  const lca721 = calculateInvestmentNetReturn(testInvestments.lca100, TEST_RATES, 721);
  
  console.log(`\nAt 721 days (best tax bracket 15%):`);
  console.log(`  CDB 110% CDI (net): ${(cdb721 * 100).toFixed(2)}%`);
  console.log(`  LCA 100% CDI (net): ${(lca721 * 100).toFixed(2)}%`);
  console.log(`  Difference: ${((lca721 - cdb721) * 100).toFixed(2)}% in favor of ${lca721 > cdb721 ? 'LCA' : 'CDB'}`);
  
  // ===== Series Generation Test =====
  console.log('\n--- Series Generation Test ---');
  
  const series = generateNetReturnSeries(testInvestments.cdb110, TEST_RATES, 730);
  console.log(`Generated series with ${series.length} points`);
  console.log(`  Day 0: ${(series[0] * 100).toFixed(4)}%`);
  console.log(`  Day 180: ${(series[180] * 100).toFixed(4)}%`);
  console.log(`  Day 181: ${(series[181] * 100).toFixed(4)}% (tax bracket change)`);
  console.log(`  Day 360: ${(series[360] * 100).toFixed(4)}%`);
  console.log(`  Day 361: ${(series[361] * 100).toFixed(4)}% (tax bracket change)`);
  console.log(`  Day 365: ${(series[365] * 100).toFixed(4)}%`);
  console.log(`  Day 720: ${(series[720] * 100).toFixed(4)}%`);
  console.log(`  Day 721: ${(series[721] * 100).toFixed(4)}% (tax bracket change - expect jump!)`);
  console.log(`  Day 730: ${(series[730] * 100).toFixed(4)}%`);
  
  // ===== Equivalent Rates Test =====
  console.log('\n--- Equivalent Rates Summary ---');
  
  Object.entries(testInvestments).forEach(([key, inv]) => {
    const rates = calculateEquivalentRates(inv, TEST_RATES);
    console.log(`\n${inv.name}:`);
    console.log(`  Effective annual (gross): ${(rates.grossAnnual * 100).toFixed(2)}%`);
    console.log(`  1-year return (gross): ${(rates.gross365Days * 100).toFixed(2)}%`);
    console.log(`  1-year return (net): ${(rates.net365Days * 100).toFixed(2)}%`);
    console.log(`  2-year return (net): ${(rates.net720Days * 100).toFixed(2)}%`);
  });
  
  // ===== Print Results Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\nPassed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}`);
      console.log(`     Expected: ${r.expected}, Actual: ${r.actual}`);
    });
  }
  
  results.filter(r => r.passed).forEach(r => {
    console.log(`  ✅ ${r.name}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

// Export test investments and rates for use in console
export { testInvestments, TEST_RATES };