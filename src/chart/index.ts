export {
  initializeChart,
  updateChart,
  calculateChartEndDate,
  getChartInstance,
  destroyChart,
  toggleChartPlaceholder,
  refreshChart,
  handleChartResize,
} from './render';

export {
  getColorForIndex,
  CHART_COLORS,
  TAX_BRACKET_LINE_COLOR,
} from './config';

export {
  buildAllDatasets,
  buildInvestmentDataPoints,
  buildTaxBracketLines,
} from './datasets';