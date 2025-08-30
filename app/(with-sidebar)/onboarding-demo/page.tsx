"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Factory, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"
import { apiService } from "@/lib/api"
import { DashboardSummaryResponse, PeriodFilter } from "@/lib/dashboard-types"
import { useToast } from "@/hooks/use-toast"

export default function CoalLensDashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse | null>(null)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({ period: '2025-08', site: 'ALL' }) // Default filters

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      try {
        const response = await apiService.getDashboardSummary(periodFilter)
        if (response.success && response.data) {
          setSummaryData(response.data)
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to load dashboard summary",
            variant: "destructive"
          })
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard summary",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [periodFilter, toast])

  return (
    <DashboardShell
      title="CoalLens Dashboard"
      description="Comprehensive analytics for coal mining operations."
      periodFilter={periodFilter}
      onPeriodFilterChange={setPeriodFilter}
      loading={loading}
    >
      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="unit-economics">Unit Economics</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="working-capital">Working Capital</TabsTrigger>
          <TabsTrigger value="cash-pnl">Cash & P&L</TabsTrigger>
        </TabsList>
        <TabsContent value="executive" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>Key performance indicators and top alerts.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading executive data...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Example KPI Cards */}
                  <Card className="p-4">
                    <h4 className="text-sm font-medium">Realized Price/ton</h4>
                    <p className="text-2xl font-bold mt-1">Rp {summaryData?.kpi.realizedPricePerTon?.toLocaleString('id-ID') || '0'}</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium">Cash Margin/ton</h4>
                    <p className="text-2xl font-bold mt-1">Rp {summaryData?.kpi.cashMarginPerTon?.toLocaleString('id-ID') || '0'}</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium">Total TON</h4>
                    <p className="text-2xl font-bold mt-1">{summaryData?.kpi.saleableTons?.toLocaleString('id-ID') || '0'} MT</p>
                  </Card>
                  <h3 className="col-span-full text-lg font-semibold mt-4">Top Alerts</h3>
                  {summaryData?.alerts && summaryData.alerts.length > 0 ? (
                    <div className="col-span-full space-y-2">
                      {summaryData.alerts.map(alert => (
                        <div key={alert.id} className="flex items-center gap-2 p-3 border rounded-md">
                          <AlertTriangle className={`h-5 w-5 ${alert.severity === 'high' ? 'text-red-500' : alert.severity === 'med' ? 'text-yellow-500' : 'text-blue-500'}`} />
                          <p className="text-sm">{alert.message}</p>
                          <span className="ml-auto text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="col-span-full text-sm text-muted-foreground">No active alerts.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="unit-economics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Unit Economics</CardTitle>
              <CardDescription>Per-ton analysis of production to revenue.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading unit economics data...</div>
              ) : (
                <p className="text-sm text-muted-foreground">Unit Economics content will go here. Data: {JSON.stringify(summaryData?.kpi)}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="costs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Costs</CardTitle>
              <CardDescription>Detailed breakdown of operational costs.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading costs data...</div>
              ) : (
                <p className="text-sm text-muted-foreground">Costs content will go here.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="working-capital" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Working Capital</CardTitle>
              <CardDescription>Analysis of working capital metrics.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading working capital data...</div>
              ) : (
                <p className="text-sm text-muted-foreground">Working Capital content will go here.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cash-pnl" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash & P&L</CardTitle>
              <CardDescription>Cash flow and profit & loss statements.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading cash & P&L data...</div>
              ) : (
                <p className="text-sm text-muted-foreground">Cash & P&L content will go here.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
