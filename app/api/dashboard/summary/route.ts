import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db'
import type { DashboardSummary, Core12KPI, FinanceSummary, AlertItem } from '@/lib/dashboard-types';


// Use shared prisma client from lib/db


const QuerySchema = z.object({
  period: z.string().min(1),
  site: z.string().optional().default('ALL'),
  currency: z.enum(['IDR', 'USD']).optional().default('IDR'),
  buyer: z.string().optional(),
  vendor: z.string().optional(),
  contractType: z.enum(['spot', 'term', 'all']).optional().default('all'),
  status: z.enum(['approved', 'all']).optional().default('approved'),
  viewMode: z.enum(['monthly', 'weekly', 'daily']).optional().default('monthly')
});

export async function GET(request: NextRequest) {
  try {
  // Check if prisma client is available
  if (!prisma) {
  return NextResponse.json(
  { success: false, error: 'Database connection not available' },
  { status: 503 }
  )
  }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      period: searchParams.get('period') || new Date().toISOString().slice(0, 7), // YYYY-MM
      site: searchParams.get('site') || 'ALL',
      currency: searchParams.get('currency') || 'IDR',
      buyer: searchParams.get('buyer') || undefined,
      vendor: searchParams.get('vendor') || undefined,
      contractType: searchParams.get('contractType') || 'all',
      status: searchParams.get('status') || 'approved',
      viewMode: searchParams.get('viewMode') || 'monthly'
    };

    const validatedParams = QuerySchema.parse(queryParams);
    const { period, site, currency } = validatedParams;

    // Get Core12 KPIs (mock data for now - in production this would query materialized views)
    const kpi: Core12KPI = await getCore12KPIs(prisma, period, site);
    
    // Get Financial Summary
    const finance: FinanceSummary = await getFinanceSummary(prisma, period, site);
    
    // Get Production Bridge Data
    const productionBridge = await getProductionBridge(prisma, period, site);
    
    // Get Active Alerts
    const alerts: AlertItem[] = await getActiveAlerts(prisma);
    
    // Get Cost Breakdown
    const costBreakdown = await getCostBreakdown(prisma, period, site);
    
    // Get Vendor Performance (Pareto)
    const vendorPerformance = await getVendorPerformance(prisma, period, site);
    
    // Get Working Capital Data
    const workingCapital = await getWorkingCapital(prisma, period);
    
    // Get Budget Comparison
    const budgetComparison = await getBudgetComparison(prisma, period, site);
    
    // Get Production Metrics
    const productionMetrics = await getProductionMetrics(prisma, period, site);
    
    // Get Cashflow Data
    const cashflow = await getCashflowData(prisma, period);

    const dashboardData: DashboardSummary = {
      kpi,
      finance,
      productionBridge,
      alerts,
      costBreakdown,
      vendorPerformance,
      workingCapital,
      budgetComparison,
      productionMetrics,
      cashflow,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      filters: validatedParams
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions to fetch dashboard data
async function getCore12KPIs(prisma: any, period: string, site: string): Promise<Core12KPI> {
  // In production, this would query materialized views
  // For now, returning mock data based on existing production reports
  
  try {
    // Get production data
    const productionData = await prisma!.productionReport.aggregate({
      where: {
        tanggal: {
          startsWith: period
        },
        status: 'APPROVED'
      },
      _sum: {
        nettoTon: true,
        grossTon: true,
        tareTon: true
      },
      _count: true
    });

    // Get financial data from expenses
    const expenseData = await prisma!.kasBesarExpense.aggregate({
      where: {
        tanggal: {
          startsWith: period
        },
        status: 'APPROVED'
      },
      _sum: {
        total: true
      }
    });

    const totalTons = Number(productionData._sum.nettoTon || 0);
    const totalExpenses = Number(expenseData._sum.total || 0);
    const estimatedRevenue = totalTons * 800000; // Estimate IDR 800k per ton

    return {
      realizedPricePerTon: totalTons > 0 ? estimatedRevenue / totalTons : 0,
      benchmarkDiff: 50000, // Mock benchmark difference
      saleableTons: totalTons,
      yieldPct: 85.5,
      stripRatio: 2.3,
      cashCostPerTon: totalTons > 0 ? totalExpenses / totalTons : 0,
      royaltyPerTon: 45000,
      cashMarginPerTon: totalTons > 0 ? (estimatedRevenue - totalExpenses) / totalTons : 0,
      ebitdaPerTon: 250000,
      ebitdaMarginPct: 31.25,
      aiscPerTon: 320000,
      fcf: estimatedRevenue - totalExpenses - (totalExpenses * 0.2),
      fcfPerTon: 180000,
      netDebt: 5000000000,
      netDebtToEbitda: 1.8,
      interestCover: 12.5,
      totalTons,
      totalRevenue: estimatedRevenue,
      cashBalance: 2500000000,
      accountsReceivable: 1200000000,
      accountsPayable: 800000000,
      onTimeDeliveryPct: 94.2
    };
  } catch (error) {
    console.error('Error fetching Core12 KPIs:', error);
    // Return default values if error
    return {
      realizedPricePerTon: 0,
      benchmarkDiff: 0,
      saleableTons: 0,
      yieldPct: 0,
      stripRatio: 0,
      cashCostPerTon: 0,
      royaltyPerTon: 0,
      cashMarginPerTon: 0,
      ebitdaPerTon: 0,
      ebitdaMarginPct: 0,
      aiscPerTon: 0,
      fcf: 0,
      fcfPerTon: 0,
      netDebt: 0,
      netDebtToEbitda: 0,
      interestCover: 0,
      totalTons: 0,
      totalRevenue: 0,
      cashBalance: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      onTimeDeliveryPct: 0
    };
  }
}

async function getFinanceSummary(prisma: any, period: string, site: string): Promise<FinanceSummary> {
  try {
    const expenseData = await prisma!.kasBesarExpense.aggregate({
      where: {
        tanggal: { startsWith: period },
        status: 'APPROVED'
      },
      _sum: { total: true }
    });

    const totalExpenses = Number(expenseData._sum.total || 0);
    const revenue = totalExpenses * 1.4; // Mock revenue calculation

    return {
      revenue,
      cogs: totalExpenses * 0.7,
      opex: totalExpenses * 0.3,
      ebitda: revenue - totalExpenses,
      netIncome: revenue - totalExpenses - (totalExpenses * 0.1),
      cashIn: revenue * 0.9,
      cashOut: totalExpenses,
      cashClosing: 2500000000,
      ar: 1200000000,
      ap: 800000000,
      ccc: 35, // days
      dso: 25,
      dpo: 15,
      daysStockpile: 8
    };
  } catch (error) {
    console.error('Error fetching finance summary:', error);
    return {
      revenue: 0, cogs: 0, opex: 0, ebitda: 0, netIncome: 0,
      cashIn: 0, cashOut: 0, cashClosing: 0, ar: 0, ap: 0,
      ccc: 0, dso: 0, dpo: 0, daysStockpile: 0
    };
  }
}

async function getProductionBridge(prisma: any, period: string, site: string) {
  const totalTons = 125000; // Mock data
  return {
    deposit: totalTons,
    adjustments: -5000,
    finalTons: 120000,
    pricePerTon: 800000,
    totalRevenue: 96000000000,
    steps: [
      { label: 'ROM Deposit', value: totalTons, cumulative: totalTons },
      { label: 'Quality Adj', value: -3000, cumulative: totalTons - 3000 },
      { label: 'Moisture Adj', value: -2000, cumulative: totalTons - 5000 },
      { label: 'Final Saleable', value: 0, cumulative: 120000 }
    ]
  };
}

async function getActiveAlerts(prisma: any): Promise<AlertItem[]> {
  // Mock alerts for demonstration
  return [
    {
      id: '1',
      type: 'AR_AGING',
      severity: 'high',
      message: 'Invoice #INV-2024-001 overdue by 65 days',
      createdAt: new Date().toISOString(),
      status: 'open',
      owner: 'Finance Team',
      sla: 48,
      ref: { kind: 'invoice', id: 'INV-2024-001', description: 'PT Mining Solutions - Coal Delivery' }
    },
    {
      id: '2',
      type: 'PRODUCTION',
      severity: 'med',
      message: 'Strip ratio exceeded target (2.8 vs 2.5)',
      createdAt: new Date().toISOString(),
      status: 'open',
      owner: 'Operations',
      sla: 24
    },
    {
      id: '3',
      type: 'WEIGHBRIDGE',
      severity: 'low',
      message: 'Missing weigh ticket for truck B1234XY',
      createdAt: new Date().toISOString(),
      status: 'open',
      ref: { kind: 'weigh', id: 'W-2024-1205' }
    }
  ];
}

async function getCostBreakdown(prisma: any, period: string, site: string) {
  return [
    { category: 'Fuel', amount: 2500000000, perTon: 125000, percentage: 35 },
    { category: 'Contractor', amount: 1800000000, perTon: 90000, percentage: 25 },
    { category: 'Maintenance', amount: 1200000000, perTon: 60000, percentage: 17 },
    { category: 'Consumables', amount: 800000000, perTon: 40000, percentage: 11 },
    { category: 'Logistics', amount: 600000000, perTon: 30000, percentage: 8 },
    { category: 'Site G&A', amount: 300000000, perTon: 15000, percentage: 4 }
  ];
}

async function getVendorPerformance(prisma: any, period: string, site: string) {
  return [
    { vendorId: '1', vendorName: 'PT Fuel Supply', totalSpend: 2500000000, percentage: 35, priceChange: 5.2, isCritical: true, categories: ['Fuel'] },
    { vendorId: '2', vendorName: 'CV Mining Contractor', totalSpend: 1800000000, percentage: 25, priceChange: -2.1, isCritical: true, categories: ['Contractor'] },
    { vendorId: '3', vendorName: 'PT Heavy Equipment', totalSpend: 1200000000, percentage: 17, priceChange: 3.5, isCritical: true, categories: ['Maintenance'] }
  ];
}

async function getWorkingCapital(prisma: any, period: string) {
  return {
    dso: 25,
    dpo: 15,
    daysStockpile: 8,
    ccc: 18,
    arAging: [
      { bucket: '0-30', amount: 800000000, count: 12 },
      { bucket: '31-60', amount: 250000000, count: 5 },
      { bucket: '>60', amount: 150000000, count: 3 }
    ],
    apAging: [
      { bucket: '0-30', amount: 600000000, count: 18 },
      { bucket: '31-60', amount: 150000000, count: 4 },
      { bucket: '>60', amount: 50000000, count: 2 }
    ]
  };
}

async function getBudgetComparison(prisma: any, period: string, site: string) {
  return [
    { category: 'Revenue', actual: 96000000000, budget: 90000000000, variance: 6000000000, variancePct: 6.7, status: 'good' as const },
    { category: 'COGS', actual: 65000000000, budget: 63000000000, variance: 2000000000, variancePct: 3.2, status: 'warning' as const },
    { category: 'OPEX', actual: 18000000000, budget: 15000000000, variance: 3000000000, variancePct: 20, status: 'critical' as const }
  ];
}

async function getProductionMetrics(prisma: any, period: string, site: string) {
  return {
    stripRatio: 2.8,
    haulCostPerTonKm: 1250,
    demurragePct: 3.2,
    qualityAdjustments: [
      { buyer: 'PT Coal Buyer A', ash: 8.2, sulfur: 0.45, moisture: 12.1, adjustmentPerTon: -15000 },
      { buyer: 'PT Coal Buyer B', ash: 7.8, sulfur: 0.38, moisture: 11.5, adjustmentPerTon: 8000 }
    ],
    dailyProduction: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2024, 11, i + 1).toISOString().split('T')[0],
      tons: Math.floor(Math.random() * 2000) + 3000,
      ritase: Math.floor(Math.random() * 20) + 60,
      sevenDayMA: 4200
    }))
  };
}

async function getCashflowData(prisma: any, period: string) {
  return {
    inflows: [
      { category: 'Coal Sales', amount: 85000000000, date: period },
      { category: 'Other Revenue', amount: 5000000000, date: period }
    ],
    outflows: [
      { category: 'Operating Costs', amount: 65000000000, date: period },
      { category: 'Capital Expenditure', amount: 8000000000, date: period },
      { category: 'Debt Service', amount: 3000000000, date: period }
    ],
    netCashflow: 14000000000,
    runwayMonths: 18,
    burnRate: 5500000000
  };
}
