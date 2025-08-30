// Dashboard Types for CoalLens Core12 Dashboard
// Based on coalensreport.md specification

export type PeriodFilter = { 
  period: string; 
  site?: string; 
  currency?: 'IDR' | 'USD'; 
  buyer?: string;
  vendor?: string;
  contractType?: 'spot' | 'term';
  status?: 'approved' | 'all';
  viewMode?: 'monthly' | 'weekly' | 'daily';
};

export type Core12KPI = {
  // Core 12 Metrics from CoalLens specification
  realizedPricePerTon: number;
  benchmarkDiff: number;
  saleableTons: number;
  yieldPct: number;
  stripRatio: number;
  cashCostPerTon: number;
  royaltyPerTon: number;
  cashMarginPerTon: number;
  ebitdaPerTon: number;
  ebitdaMarginPct: number;
  aiscPerTon: number;
  fcf: number;
  fcfPerTon: number;
  netDebt: number;
  netDebtToEbitda: number;
  interestCover: number;
  
  // Additional Executive KPIs
  totalTons: number;
  totalRevenue: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  onTimeDeliveryPct: number;
};

export type FinanceSummary = {
  revenue: number;
  cogs: number;
  opex: number;
  ebitda: number;
  netIncome: number;
  cashIn: number;
  cashOut: number;
  cashClosing: number;
  ar: number;
  ap: number;
  ccc: number; // Cash Conversion Cycle
  dso: number; // Days Sales Outstanding
  dpo: number; // Days Payable Outstanding
  daysStockpile: number;
};

export type ProductionBridge = {
  deposit: number;
  adjustments: number;
  finalTons: number;
  pricePerTon: number;
  totalRevenue: number;
  steps: Array<{
    label: string;
    value: number;
    cumulative: number;
  }>;
};

export type AlertItem = { 
  id: string; 
  type: string; 
  severity: 'low' | 'med' | 'high'; 
  message: string; 
  createdAt: string; 
  status: 'open' | 'closed';
  owner?: string;
  sla?: number;
  ref?: { 
    kind: 'invoice' | 'expense' | 'weigh' | 'production'; 
    id: string;
    description?: string;
  };
};

export type CostBreakdown = {
  category: string;
  amount: number;
  perTon: number;
  percentage: number;
  subcategories?: Array<{
    name: string;
    amount: number;
    perTon: number;
  }>;
};

export type VendorPerformance = {
  vendorId: string;
  vendorName: string;
  totalSpend: number;
  percentage: number;
  priceChange: number; // MoM price change %
  isCritical: boolean; // 80/20 Pareto flag
  categories: string[];
};

export type WorkingCapitalData = {
  dso: number;
  dpo: number;
  daysStockpile: number;
  ccc: number;
  arAging: Array<{
    bucket: string; // '0-30', '31-60', '>60'
    amount: number;
    count: number;
  }>;
  apAging: Array<{
    bucket: string;
    amount: number;
    count: number;
  }>;
};

export type BudgetComparison = {
  category: string;
  actual: number;
  budget: number;
  variance: number;
  variancePct: number;
  status: 'good' | 'warning' | 'critical'; // traffic light
};

export type ProductionMetrics = {
  stripRatio: number;
  haulCostPerTonKm: number;
  demurragePct: number;
  qualityAdjustments: Array<{
    buyer: string;
    ash: number;
    sulfur: number;
    moisture: number;
    adjustmentPerTon: number;
  }>;
  dailyProduction: Array<{
    date: string;
    tons: number;
    ritase: number;
    sevenDayMA: number;
  }>;
};

export type CashflowData = {
  inflows: Array<{
    category: string;
    amount: number;
    date: string;
  }>;
  outflows: Array<{
    category: string;
    amount: number;
    date: string;
  }>;
  netCashflow: number;
  runwayMonths: number;
  burnRate: number;
};

export type DashboardSummary = {
  kpi: Core12KPI;
  finance: FinanceSummary;
  productionBridge: ProductionBridge;
  alerts: AlertItem[];
  costBreakdown: CostBreakdown[];
  vendorPerformance: VendorPerformance[];
  workingCapital: WorkingCapitalData;
  budgetComparison: BudgetComparison[];
  productionMetrics: ProductionMetrics;
  cashflow: CashflowData;
  lastUpdated: string;
};

// Chart data types
export type ChartDataPoint = {
  name: string;
  value: number;
  [key: string]: any;
};

export type WaterfallDataPoint = {
  name: string;
  value: number;
  cumulative: number;
  isPositive: boolean;
};

export type TimeSeriesDataPoint = {
  date: string;
  [metric: string]: number | string;
};

// Filter context type
export type DashboardFilters = {
  period: string;
  site: string;
  currency: 'IDR' | 'USD';
  buyer?: string;
  vendor?: string;
  contractType?: 'spot' | 'term' | 'all';
  status: 'approved' | 'all';
  viewMode: 'monthly' | 'weekly' | 'daily';
};

// Export utilities
export type ExportFormat = 'excel' | 'pdf' | 'csv';

export type ExportOptions = {
  format: ExportFormat;
  includeCharts: boolean;
  includeTransactions: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  filters: DashboardFilters;
};
