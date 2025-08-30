"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarDays, 
  Factory, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Calculator,
  BarChart3,
  RefreshCw,
  Database,
  Activity,
  Download,
  FileSpreadsheet
} from "lucide-react"
import { DataInputForm } from "@/components/dashboard/data-input-form"
import { KPIStat } from "@/components/dashboard/kpi-stat"
import { ChartCard } from "@/components/dashboard/chart-card"
import { WaterfallChart } from "@/components/dashboard/waterfall-chart"
import { StackedBarChart } from "@/components/dashboard/stacked-bar-chart"
import { LineAreaChart } from "@/components/dashboard/line-area-chart"
import { ParetoChart } from "@/components/dashboard/pareto-chart"
import { AlertList } from "@/components/dashboard/alert-list"
import { useToast } from "@/hooks/use-toast"
import type { DashboardSummary } from "@/lib/dashboard-types"

export default function CoalLensDashboardPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('input')
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDataCalculated = (calculatedData: DashboardSummary) => {
    setDashboardData(calculatedData)
    setActiveTab('executive')
    
    toast({
      title: "Perhitungan Selesai!",
      description: "Dashboard telah diperbarui dengan data yang baru dihitung.",
    })
  }

  const exportDashboard = (format: 'excel' | 'pdf') => {
    if (!dashboardData) {
      toast({
        title: "Tidak Ada Data",
        description: "Silakan input data dan hitung metrics terlebih dahulu.",
        variant: "destructive"
      })
      return
    }

    // Simulate export
    toast({
      title: "Export Berhasil",
      description: `Dashboard berhasil di-export ke format ${format.toUpperCase()}`,
    })
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CoalLens Core12 Dashboard
        </h1>
            <p className="text-gray-600">
              Comprehensive coal mining analytics with real-time data input and Core12 metrics calculation
            </p>
            {dashboardData && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Activity className="h-4 w-4" />
                Last calculated: {new Date(dashboardData.lastUpdated).toLocaleString('id-ID')}
              </div>
            )}
          </div>

          {/* Export Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportDashboard('excel')}
              disabled={!dashboardData}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportDashboard('pdf')}
              disabled={!dashboardData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
      </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit">
            <TabsTrigger value="input" className="text-xs lg:text-sm">
              <Calculator className="h-4 w-4 mr-1 lg:mr-2" />
              Input Data
            </TabsTrigger>
            <TabsTrigger value="executive" className="text-xs lg:text-sm" disabled={!dashboardData}>
              Executive
            </TabsTrigger>
            <TabsTrigger value="unit-economics" className="text-xs lg:text-sm" disabled={!dashboardData}>
              Unit Economics
            </TabsTrigger>
            <TabsTrigger value="costs" className="text-xs lg:text-sm" disabled={!dashboardData}>
              Costs
            </TabsTrigger>
            <TabsTrigger value="working-capital" className="text-xs lg:text-sm" disabled={!dashboardData}>
              Working Capital
            </TabsTrigger>
            <TabsTrigger value="cash-pnl" className="text-xs lg:text-sm" disabled={!dashboardData}>
              Cash & P&L
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs lg:text-sm" disabled={!dashboardData}>
              Alerts
            </TabsTrigger>
          </TabsList>

          {/* Data Input Tab */}
          <TabsContent value="input" className="space-y-6">
            <DataInputForm onCalculate={handleDataCalculated} />
          </TabsContent>

          {/* Executive Tab */}
          <TabsContent value="executive" className="space-y-6">
            {dashboardData && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  <KPIStat 
                    label="Realized Price/ton" 
                    value={dashboardData.kpi.realizedPricePerTon} 
                    suffix=" USD"
                    delta={3.2}
                    format="currency"
                  />
                  <KPIStat 
                    label="Cash Cost/ton" 
                    value={dashboardData.kpi.cashCostPerTon} 
                    suffix=" USD"
                    delta={-1.5}
                    format="currency"
                  />
                  <KPIStat 
                    label="Cash Margin/ton" 
                    value={dashboardData.kpi.cashMarginPerTon} 
                    suffix=" USD"
                    delta={8.7}
                    format="currency"
                  />
                  <KPIStat 
                    label="EBITDA Margin" 
                    value={dashboardData.kpi.ebitdaMarginPct} 
                    suffix="%"
                    delta={2.1}
                  />
                  <KPIStat 
                    label="Total Tons" 
                    value={dashboardData.kpi.saleableTons} 
                    delta={5.3}
                    format="number"
                  />
                  <KPIStat 
                    label="Yield %" 
                    value={dashboardData.kpi.yieldPct} 
                    suffix="%"
                    delta={1.2}
                  />
            </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Production → Revenue Bridge" subtitle="Tons to revenue conversion">
                    <WaterfallChart 
                      data={dashboardData.productionBridge.steps.map(step => ({
                        name: step.label,
                        value: step.value,
                        cumulative: step.cumulative,
                        isPositive: step.value >= 0
                      }))}
                      height={300}
                    />
                  </ChartCard>
                  
                  <ChartCard title="Monthly Cash Flow" subtitle="Inflow vs Outflow">
                    <LineAreaChart 
                      data={[
                        { name: 'Week 1', inflow: dashboardData.finance.cashIn / 4, outflow: dashboardData.finance.cashOut / 4, net: (dashboardData.finance.cashIn - dashboardData.finance.cashOut) / 4 },
                        { name: 'Week 2', inflow: dashboardData.finance.cashIn / 4 * 1.1, outflow: dashboardData.finance.cashOut / 4 * 0.9, net: (dashboardData.finance.cashIn - dashboardData.finance.cashOut) / 4 * 1.2 },
                        { name: 'Week 3', inflow: dashboardData.finance.cashIn / 4 * 0.9, outflow: dashboardData.finance.cashOut / 4 * 1.1, net: (dashboardData.finance.cashIn - dashboardData.finance.cashOut) / 4 * 0.8 },
                        { name: 'Week 4', inflow: dashboardData.finance.cashIn / 4, outflow: dashboardData.finance.cashOut / 4, net: (dashboardData.finance.cashIn - dashboardData.finance.cashOut) / 4 }
                      ]}
                      xKey="name"
                      lines={[
                        { key: 'inflow', name: 'Cash In', color: '#22c55e' },
                        { key: 'outflow', name: 'Cash Out', color: '#ef4444' },
                        { key: 'net', name: 'Net Flow', color: '#3b82f6' }
                      ]}
                      height={300}
                    />
                  </ChartCard>
                </div>

                {/* Alerts Section */}
                <ChartCard title="Active Alerts" subtitle="Priority issues requiring attention">
                  <AlertList alerts={dashboardData.alerts} />
                </ChartCard>
              </>
            )}
          </TabsContent>

          {/* Unit Economics Tab */}
          <TabsContent value="unit-economics" className="space-y-6">
            {dashboardData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <KPIStat 
                    label="Yield %" 
                    value={dashboardData.kpi.yieldPct} 
                    suffix="%"
                    delta={2.1}
                  />
                  <KPIStat 
                    label="Strip Ratio" 
                    value={dashboardData.kpi.stripRatio} 
                    delta={-5.3}
                  />
                  <KPIStat 
                    label="Benchmark Diff" 
                    value={dashboardData.kpi.benchmarkDiff} 
                    suffix=" USD/ton"
                    delta={12.5}
                    format="currency"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Per-Ton Economics Waterfall" subtitle="Price → Cost → Margin breakdown">
                    <WaterfallChart 
                      data={[
                        { name: 'Price', value: dashboardData.kpi.realizedPricePerTon, cumulative: dashboardData.kpi.realizedPricePerTon, isPositive: true },
                        { name: 'Cash Cost', value: -dashboardData.kpi.cashCostPerTon, cumulative: dashboardData.kpi.realizedPricePerTon - dashboardData.kpi.cashCostPerTon, isPositive: false },
                        { name: 'Royalty', value: -dashboardData.kpi.royaltyPerTon, cumulative: dashboardData.kpi.cashMarginPerTon, isPositive: false },
                        { name: 'Margin', value: 0, cumulative: dashboardData.kpi.cashMarginPerTon, isPositive: true }
                      ]}
                      height={300}
                    />
                  </ChartCard>

                  <ChartCard title="Production Yield Analysis" subtitle="ROM vs Saleable tons">
                    <StackedBarChart 
                      data={[
                        { 
                          name: 'This Period', 
                          saleable: dashboardData.kpi.saleableTons, 
                          loss: (dashboardData.kpi.saleableTons / (dashboardData.kpi.yieldPct / 100)) - dashboardData.kpi.saleableTons
                        }
                      ]}
                      height={300}
                      stackKeys={['saleable', 'loss']}
                      colors={['#22c55e', '#ef4444']}
                    />
                  </ChartCard>
                </div>
              </>
            )}
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            {dashboardData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <KPIStat 
                    label="Cash Cost/ton" 
                    value={dashboardData.kpi.cashCostPerTon} 
                    suffix=" USD"
                    delta={-2.3}
                    format="currency"
                  />
                  <KPIStat 
                    label="AISC/ton" 
                    value={dashboardData.kpi.aiscPerTon} 
                    suffix=" USD"
                    delta={1.8}
                    format="currency"
                  />
                  <KPIStat 
                    label="Cost Categories" 
                    value={dashboardData.costBreakdown.length} 
                    delta={0}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Cost Breakdown by Category" subtitle="Cost per ton by category">
                    <StackedBarChart 
                      data={dashboardData.costBreakdown.map(item => ({
                        name: item.category,
                        amount: item.perTon
                      }))}
                      height={300}
                      stackKeys={['amount']}
                      colors={['#3b82f6']}
                    />
                  </ChartCard>

                  <ChartCard title="Vendor Performance (Pareto)" subtitle="Spend distribution analysis">
                    <ParetoChart 
                      data={dashboardData.vendorPerformance.map(vendor => ({
                        name: vendor.vendorName,
                        value: vendor.totalSpend,
                        percentage: vendor.percentage,
                        trend: vendor.priceChange
                      }))}
                      height={300}
                    />
                  </ChartCard>
                </div>
              </>
            )}
          </TabsContent>

          {/* Working Capital Tab */}
          <TabsContent value="working-capital" className="space-y-6">
            {dashboardData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <KPIStat 
                    label="DSO" 
                    value={dashboardData.workingCapital.dso} 
                    suffix=" days"
                    delta={-2.1}
                  />
                  <KPIStat 
                    label="DPO" 
                    value={dashboardData.workingCapital.dpo} 
                    suffix=" days"
                    delta={1.5}
                  />
                  <KPIStat 
                    label="Days Stockpile" 
                    value={dashboardData.workingCapital.daysStockpile} 
                    suffix=" days"
                    delta={-0.8}
                  />
                  <KPIStat 
                    label="CCC" 
                    value={dashboardData.workingCapital.ccc} 
                    suffix=" days"
                    delta={-2.3}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="AR Aging Analysis" subtitle="Accounts receivable by age">
                    <StackedBarChart 
                      data={dashboardData.workingCapital.arAging.map(item => ({
                        name: item.bucket,
                        amount: item.amount / 1000000 // Convert to millions
                      }))}
                      height={300}
                      stackKeys={['amount']}
                      colors={['#22c55e']}
                    />
                  </ChartCard>

                  <ChartCard title="AP Aging Analysis" subtitle="Accounts payable by age">
                    <StackedBarChart 
                      data={dashboardData.workingCapital.apAging.map(item => ({
                        name: item.bucket,
                        amount: item.amount / 1000000 // Convert to millions
                      }))}
                      height={300}
                      stackKeys={['amount']}
                      colors={['#ef4444']}
                    />
                  </ChartCard>
                </div>
              </>
            )}
          </TabsContent>

          {/* Cash & P&L Tab */}
          <TabsContent value="cash-pnl" className="space-y-6">
            {dashboardData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <KPIStat 
                    label="Revenue" 
                    value={dashboardData.finance.revenue} 
                    suffix=" USD"
                    delta={6.7}
                    format="currency"
                  />
                  <KPIStat 
                    label="EBITDA" 
                    value={dashboardData.finance.ebitda} 
                    suffix=" USD"
                    delta={8.2}
                    format="currency"
                  />
                  <KPIStat 
                    label="Cash Balance" 
                    value={dashboardData.finance.cashClosing} 
                    suffix=" USD"
                    delta={2.1}
                    format="currency"
                  />
                  <KPIStat 
                    label="FCF" 
                    value={dashboardData.kpi.fcf} 
                    suffix=" USD"
                    delta={15.3}
                    format="currency"
                  />
            </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="P&L Waterfall" subtitle="Revenue → EBITDA → Net Income">
                    <WaterfallChart 
                      data={[
                        { name: 'Revenue', value: dashboardData.finance.revenue, cumulative: dashboardData.finance.revenue, isPositive: true },
                        { name: 'COGS', value: -dashboardData.finance.cogs, cumulative: dashboardData.finance.revenue - dashboardData.finance.cogs, isPositive: false },
                        { name: 'OPEX', value: -dashboardData.finance.opex, cumulative: dashboardData.finance.ebitda, isPositive: false },
                        { name: 'Net Income', value: 0, cumulative: dashboardData.finance.netIncome, isPositive: true }
                      ]}
                      height={300}
                    />
                  </ChartCard>

                  <ChartCard title="Cash Flow Summary" subtitle="Monthly cash position">
                    <LineAreaChart 
                      data={[
                        { name: 'Opening', balance: dashboardData.finance.cashClosing * 0.8 },
                        { name: 'Operating', balance: dashboardData.finance.cashClosing * 0.9 },
                        { name: 'Investing', balance: dashboardData.finance.cashClosing * 0.95 },
                        { name: 'Financing', balance: dashboardData.finance.cashClosing }
                      ]}
                      xKey="name"
                      lines={[
                        { key: 'balance', name: 'Cash Balance', color: '#3b82f6' }
                      ]}
                      height={300}
                    />
                  </ChartCard>
            </div>
              </>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            {dashboardData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <KPIStat 
                    label="Open Alerts" 
                    value={dashboardData.alerts.filter(a => a.status === 'open').length} 
                    delta={-15.2}
                  />
                  <KPIStat 
                    label="High Priority" 
                    value={dashboardData.alerts.filter(a => a.severity === 'high').length} 
                    delta={-25.0}
                  />
                  <KPIStat 
                    label="Total Alerts" 
                    value={dashboardData.alerts.length} 
                    delta={-8.1}
                  />
      </div>

                <ChartCard title="Alert Management" subtitle="Rules, threshold monitoring, and incident tracking">
                  <AlertList alerts={dashboardData.alerts} />
                </ChartCard>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Status Message */}
        {!dashboardData && activeTab !== 'input' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum Ada Data</h3>
            <p className="text-gray-500 mb-4">
              Silakan input data produksi, penjualan, dan biaya terlebih dahulu untuk melihat dashboard analytics.
            </p>
            <Button onClick={() => setActiveTab('input')} className="bg-blue-600 hover:bg-blue-700">
              <Calculator className="h-4 w-4 mr-2" />
              Input Data Sekarang
          </Button>
          </div>
        )}
      </div>
    </div>
  )
}
