"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  DollarSign, 
  Factory, 
  AlertTriangle, 
  Download,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KPIStat } from "@/components/dashboard/kpi-stat"
import { ChartCard } from "@/components/dashboard/chart-card"
import { AlertList } from "@/components/dashboard/alert-list"
import { WaterfallChart } from "@/components/dashboard/waterfall-chart"
import { StackedBarChart } from "@/components/dashboard/stacked-bar-chart"
import { LineAreaChart } from "@/components/dashboard/line-area-chart"
import { ParetoChart } from "@/components/dashboard/pareto-chart"
import { DataTableDrawer } from "@/components/dashboard/data-table-drawer"
import { exportDashboard } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"
import type { DashboardSummary, DashboardFilters } from "@/lib/dashboard-types"

export default function CoalLensDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)
  const [filters, setFilters] = useState<DashboardFilters>({
    period: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
    site: 'ALL',
    currency: 'IDR',
    status: 'approved',
    viewMode: 'monthly'
  })
  const [activeTab, setActiveTab] = useState('executive')

  useEffect(() => {
    loadDashboardData()
  }, [filters])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        period: filters.period,
        site: filters.site,
        currency: filters.currency,
        status: filters.status,
        viewMode: filters.viewMode
      })

      const response = await fetch(`/api/dashboard/summary?${queryParams}`)
      const result = await response.json()

      if (result.success) {
        setDashboardData(result.data)
      } else {
        throw new Error(result.error || 'Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Dashboard loading error:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      await exportDashboard(dashboardData, format, filters)
      toast({
        title: "Export Successful",
        description: `Dashboard exported to ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard",
        variant: "destructive"
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: filters.currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number, decimals = 0) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-lg font-medium text-gray-600">Loading CoalLens Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-600" />
          <p className="text-lg font-medium text-gray-600">Failed to load dashboard data</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CoalLens Core12 Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive coal mining analytics and insights
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className="h-4 w-4" />
            Last updated: {new Date(dashboardData.lastUpdated).toLocaleString('id-ID')}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filters.period} onValueChange={(value) => setFilters({...filters, period: value})}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-12">December 2024</SelectItem>
              <SelectItem value="2024-11">November 2024</SelectItem>
              <SelectItem value="2024-10">October 2024</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.site} onValueChange={(value) => setFilters({...filters, site: value})}>
            <SelectTrigger className="w-32">
              <Factory className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sites</SelectItem>
              <SelectItem value="SITE1">Sawahlunto</SelectItem>
              <SelectItem value="SITE2">Padang</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.currency} onValueChange={(value) => setFilters({...filters, currency: value as 'IDR' | 'USD'})}>
            <SelectTrigger className="w-24">
              <DollarSign className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">IDR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>

          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>

          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-fit">
          <TabsTrigger value="executive" className="text-xs lg:text-sm">Executive</TabsTrigger>
          <TabsTrigger value="unit-economics" className="text-xs lg:text-sm">Unit Economics</TabsTrigger>
          <TabsTrigger value="costs" className="text-xs lg:text-sm">Costs</TabsTrigger>
          <TabsTrigger value="working-capital" className="text-xs lg:text-sm">Working Capital</TabsTrigger>
          <TabsTrigger value="cash-pnl" className="text-xs lg:text-sm">Cash & P&L</TabsTrigger>
          <TabsTrigger value="production" className="text-xs lg:text-sm">Production</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs lg:text-sm">Risk & Alerts</TabsTrigger>
        </TabsList>

        {/* Executive Tab */}
        <TabsContent value="executive" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <KPIStat 
              label="Realized Price/ton" 
              value={dashboardData.kpi.realizedPricePerTon} 
              suffix={` ${filters.currency}`}
              delta={3.2}
              format="currency"
            />
            <KPIStat 
              label="Cash Cost/ton" 
              value={dashboardData.kpi.cashCostPerTon} 
              suffix={` ${filters.currency}`}
              delta={-1.5}
              format="currency"
            />
            <KPIStat 
              label="Cash Margin/ton" 
              value={dashboardData.kpi.cashMarginPerTon} 
              suffix={` ${filters.currency}`}
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
              value={dashboardData.kpi.totalTons} 
              delta={5.3}
              format="number"
            />
            <KPIStat 
              label="On-time Delivery" 
              value={dashboardData.kpi.onTimeDeliveryPct} 
              suffix="%"
              delta={1.2}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Production → Revenue Bridge" subtitle="Monthly breakdown">
              <WaterfallChart 
                data={dashboardData.productionBridge.steps}
                height={300}
              />
            </ChartCard>
            
            <ChartCard title="Cashflow Overview" subtitle="In vs Out">
              <LineAreaChart 
                data={[
                  { name: 'Jan', inflow: 85000, outflow: 65000, net: 20000 },
                  { name: 'Feb', inflow: 92000, outflow: 68000, net: 24000 },
                  { name: 'Mar', inflow: 88000, outflow: 72000, net: 16000 },
                  { name: 'Apr', inflow: 95000, outflow: 70000, net: 25000 }
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
        </TabsContent>

        {/* Unit Economics Tab */}
        <TabsContent value="unit-economics" className="space-y-6">
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
              suffix={` ${filters.currency}/ton`}
              delta={12.5}
              format="currency"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Per-Ton Economics Waterfall" subtitle="Price → Cost → Margin → FCF">
              <WaterfallChart 
                data={[
                  { name: 'Price', value: dashboardData.kpi.realizedPricePerTon, cumulative: dashboardData.kpi.realizedPricePerTon, isPositive: true },
                  { name: 'Cash Cost', value: -dashboardData.kpi.cashCostPerTon, cumulative: dashboardData.kpi.realizedPricePerTon - dashboardData.kpi.cashCostPerTon, isPositive: false },
                  { name: 'Royalty', value: -dashboardData.kpi.royaltyPerTon, cumulative: dashboardData.kpi.cashMarginPerTon, isPositive: false },
                  { name: 'FCF/ton', value: 0, cumulative: dashboardData.kpi.fcfPerTon, isPositive: true }
                ]}
                height={300}
              />
            </ChartCard>

            <ChartCard title="ROM vs Saleable Tons" subtitle="Yield efficiency">
              <StackedBarChart 
                data={[
                  { name: 'This Month', rom: 125000, saleable: 120000, waste: 5000 }
                ]}
                height={300}
                stackKeys={['saleable', 'waste']}
                colors={['#22c55e', '#ef4444']}
              />
            </ChartCard>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <KPIStat 
              label="Cash Cost/ton" 
              value={dashboardData.kpi.cashCostPerTon} 
              suffix={` ${filters.currency}`}
              delta={-2.3}
              format="currency"
            />
            <KPIStat 
              label="AISC/ton" 
              value={dashboardData.kpi.aiscPerTon} 
              suffix={` ${filters.currency}`}
              delta={1.8}
              format="currency"
            />
            <KPIStat 
              label="Fuel Intensity" 
              value={15.2} 
              suffix=" L/ton"
              delta={-3.1}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Cash Operating Cost Breakdown" subtitle="Cost per ton by category">
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

            <ChartCard title="Vendor Performance (Pareto)" subtitle="80/20 analysis with price trends">
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
        </TabsContent>

        {/* Working Capital Tab */}
        <TabsContent value="working-capital" className="space-y-6">
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
                  amount: item.amount / 1000000000 // Convert to billions
                }))}
                height={300}
                stackKeys={['amount']}
                colors={['#22c55e', '#f59e0b', '#ef4444']}
              />
            </ChartCard>

            <ChartCard title="AP Aging Analysis" subtitle="Accounts payable by age">
              <StackedBarChart 
                data={dashboardData.workingCapital.apAging.map(item => ({
                  name: item.bucket,
                  amount: item.amount / 1000000000 // Convert to billions
                }))}
                height={300}
                stackKeys={['amount']}
                colors={['#22c55e', '#f59e0b', '#ef4444']}
              />
            </ChartCard>
          </div>
        </TabsContent>

        {/* Cash & P&L Tab */}
        <TabsContent value="cash-pnl" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <KPIStat 
              label="Revenue" 
              value={dashboardData.finance.revenue} 
              suffix={` ${filters.currency}`}
              delta={6.7}
              format="currency"
            />
            <KPIStat 
              label="EBITDA" 
              value={dashboardData.finance.ebitda} 
              suffix={` ${filters.currency}`}
              delta={8.2}
              format="currency"
            />
            <KPIStat 
              label="Cash Runway" 
              value={dashboardData.cashflow.runwayMonths} 
              suffix=" months"
              delta={2.1}
            />
            <KPIStat 
              label="FCF" 
              value={dashboardData.kpi.fcf} 
              suffix={` ${filters.currency}`}
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

            <ChartCard title="Budget vs Actual" subtitle="Performance against budget">
              <StackedBarChart 
                data={dashboardData.budgetComparison.map(item => ({
                  name: item.category,
                  actual: item.actual / 1000000000,
                  budget: item.budget / 1000000000,
                  variance: item.variance / 1000000000
                }))}
                height={300}
                stackKeys={['actual', 'budget']}
                colors={['#3b82f6', '#94a3b8']}
              />
            </ChartCard>
          </div>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <KPIStat 
              label="Strip Ratio" 
              value={dashboardData.productionMetrics.stripRatio} 
              delta={-8.1}
            />
            <KPIStat 
              label="Haul Cost/ton-km" 
              value={dashboardData.productionMetrics.haulCostPerTonKm} 
              suffix={` ${filters.currency}`}
              delta={2.3}
              format="currency"
            />
            <KPIStat 
              label="Demurrage %" 
              value={dashboardData.productionMetrics.demurragePct} 
              suffix="%"
              delta={-1.2}
            />
            <KPIStat 
              label="Yield %" 
              value={dashboardData.kpi.yieldPct} 
              suffix="%"
              delta={1.8}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Daily Production Trend" subtitle="Tons per day with 7-day MA">
              <LineAreaChart 
                data={dashboardData.productionMetrics.dailyProduction.slice(-30)}
                xKey="date"
                lines={[
                  { key: 'tons', name: 'Daily Tons', color: '#3b82f6' },
                  { key: 'sevenDayMA', name: '7-day MA', color: '#f59e0b' }
                ]}
                height={300}
              />
            </ChartCard>

            <ChartCard title="Quality Adjustments by Buyer" subtitle="Price impact per buyer">
              <StackedBarChart 
                data={dashboardData.productionMetrics.qualityAdjustments.map(adj => ({
                  name: adj.buyer,
                  adjustment: adj.adjustmentPerTon
                }))}
                height={300}
                stackKeys={['adjustment']}
                colors={['#22c55e', '#ef4444']}
              />
            </ChartCard>
          </div>
        </TabsContent>

        {/* Risk & Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
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
              label="Avg Resolution" 
              value={2.3} 
              suffix=" days"
              delta={-8.1}
            />
          </div>

          <ChartCard title="Alert Management" subtitle="Rules, threshold monitoring, and incident tracking">
            <AlertList alerts={dashboardData.alerts} />
          </ChartCard>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}