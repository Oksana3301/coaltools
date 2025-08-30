"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Calculator, 
  TrendingUp, 
  Factory, 
  DollarSign,
  Truck,
  BarChart3,
  AlertTriangle,
  Plus,
  Trash2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProductionData {
  date: string
  romTons: number
  saleableTons: number
  overburdentTons: number
  ashContent: number
  sulfurContent: number
  moistureContent: number
  ritaseCount: number
}

interface SalesData {
  date: string
  buyer: string
  tons: number
  pricePerTon: number
  contract: 'spot' | 'term'
  qualityAdjustment: number
}

interface ExpenseData {
  date: string
  category: string
  subcategory: string
  vendor: string
  amount: number
  tons?: number
  description: string
}

interface CoalMetricsInput {
  productionData: ProductionData[]
  salesData: SalesData[]
  expenseData: ExpenseData[]
  benchmarkPrice: number
  currency: 'IDR' | 'USD'
  period: string
  site: string
}

export function DataInputForm({ onCalculate }: { onCalculate: (data: any) => void }) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('production')
  const [calculating, setCalculating] = useState(false)
  
  const [metricsInput, setMetricsInput] = useState<CoalMetricsInput>({
    productionData: [{
      date: new Date().toISOString().split('T')[0],
      romTons: 0,
      saleableTons: 0,
      overburdentTons: 0,
      ashContent: 0,
      sulfurContent: 0,
      moistureContent: 0,
      ritaseCount: 0
    }],
    salesData: [{
      date: new Date().toISOString().split('T')[0],
      buyer: '',
      tons: 0,
      pricePerTon: 0,
      contract: 'spot',
      qualityAdjustment: 0
    }],
    expenseData: [{
      date: new Date().toISOString().split('T')[0],
      category: 'COGS',
      subcategory: 'Fuel',
      vendor: '',
      amount: 0,
      tons: 0,
      description: ''
    }],
    benchmarkPrice: 120,
    currency: 'USD',
    period: new Date().toISOString().slice(0, 7),
    site: 'Sawahlunto'
  })

  const addProductionEntry = () => {
    setMetricsInput(prev => ({
      ...prev,
      productionData: [...prev.productionData, {
        date: new Date().toISOString().split('T')[0],
        romTons: 0,
        saleableTons: 0,
        overburdentTons: 0,
        ashContent: 0,
        sulfurContent: 0,
        moistureContent: 0,
        ritaseCount: 0
      }]
    }))
  }

  const addSalesEntry = () => {
    setMetricsInput(prev => ({
      ...prev,
      salesData: [...prev.salesData, {
        date: new Date().toISOString().split('T')[0],
        buyer: '',
        tons: 0,
        pricePerTon: 0,
        contract: 'spot',
        qualityAdjustment: 0
      }]
    }))
  }

  const addExpenseEntry = () => {
    setMetricsInput(prev => ({
      ...prev,
      expenseData: [...prev.expenseData, {
        date: new Date().toISOString().split('T')[0],
        category: 'COGS',
        subcategory: 'Fuel',
        vendor: '',
        amount: 0,
        tons: 0,
        description: ''
      }]
    }))
  }

  const removeEntry = (type: 'production' | 'sales' | 'expense', index: number) => {
    if (type === 'production' && metricsInput.productionData.length > 1) {
      setMetricsInput(prev => ({
        ...prev,
        productionData: prev.productionData.filter((_, i) => i !== index)
      }))
    } else if (type === 'sales' && metricsInput.salesData.length > 1) {
      setMetricsInput(prev => ({
        ...prev,
        salesData: prev.salesData.filter((_, i) => i !== index)
      }))
    } else if (type === 'expense' && metricsInput.expenseData.length > 1) {
      setMetricsInput(prev => ({
        ...prev,
        expenseData: prev.expenseData.filter((_, i) => i !== index)
      }))
    }
  }

  const calculateMetrics = async () => {
    setCalculating(true)
    try {
      // Calculate Core12 KPIs based on input data
      const calculations = performCore12Calculations(metricsInput)
      
      // Simulate API call to save and process data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onCalculate(calculations)
      
      toast({
        title: "Perhitungan Berhasil!",
        description: "Core12 metrics telah dihitung berdasarkan data yang diinput.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghitung metrics. Silakan periksa data input.",
        variant: "destructive"
      })
    } finally {
      setCalculating(false)
    }
  }

  const performCore12Calculations = (data: CoalMetricsInput) => {
    const totalRomTons = data.productionData.reduce((sum, p) => sum + p.romTons, 0)
    const totalSaleableTons = data.productionData.reduce((sum, p) => sum + p.saleableTons, 0)
    const totalOverburdenTons = data.productionData.reduce((sum, p) => sum + p.overburdentTons, 0)
    const totalSalesTons = data.salesData.reduce((sum, s) => sum + s.tons, 0)
    const totalRevenue = data.salesData.reduce((sum, s) => sum + (s.tons * s.pricePerTon), 0)
    const totalExpenses = data.expenseData.reduce((sum, e) => sum + e.amount, 0)
    
    // Core12 Calculations based on coalensreport.md
    const realizedPricePerTon = totalSalesTons > 0 ? totalRevenue / totalSalesTons : 0
    const benchmarkDiff = realizedPricePerTon - data.benchmarkPrice
    const yieldPct = totalRomTons > 0 ? (totalSaleableTons / totalRomTons) * 100 : 0
    const stripRatio = totalRomTons > 0 ? totalOverburdenTons / totalRomTons : 0
    
    // Cost calculations
    const cogsExpenses = data.expenseData.filter(e => e.category === 'COGS')
    const cashCost = cogsExpenses.reduce((sum, e) => sum + e.amount, 0)
    const cashCostPerTon = totalSalesTons > 0 ? cashCost / totalSalesTons : 0
    
    const royaltyExpenses = data.expenseData.filter(e => e.subcategory === 'Royalty')
    const royaltyTotal = royaltyExpenses.reduce((sum, e) => sum + e.amount, 0)
    const royaltyPerTon = totalSalesTons > 0 ? royaltyTotal / totalSalesTons : 0
    
    const cashMarginPerTon = realizedPricePerTon - cashCostPerTon - royaltyPerTon
    
    // EBITDA calculations
    const opexExpenses = data.expenseData.filter(e => e.category === 'OPEX')
    const opexTotal = opexExpenses.reduce((sum, e) => sum + e.amount, 0)
    const ebitda = totalRevenue - cashCost - opexTotal
    const ebitdaPerTon = totalSalesTons > 0 ? ebitda / totalSalesTons : 0
    const ebitdaMarginPct = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0
    
    // AISC (All-in Sustaining Cost) - includes sustaining capex
    const capexExpenses = data.expenseData.filter(e => e.subcategory === 'Sustaining CAPEX')
    const capexTotal = capexExpenses.reduce((sum, e) => sum + e.amount, 0)
    const aiscPerTon = totalSalesTons > 0 ? (cashCost + capexTotal) / totalSalesTons : 0
    
    // FCF calculation (simplified)
    const fcf = ebitda - capexTotal
    const fcfPerTon = totalSalesTons > 0 ? fcf / totalSalesTons : 0

    return {
      kpi: {
        realizedPricePerTon,
        benchmarkDiff,
        saleableTons: totalSaleableTons,
        yieldPct,
        stripRatio,
        cashCostPerTon,
        royaltyPerTon,
        cashMarginPerTon,
        ebitdaPerTon,
        ebitdaMarginPct,
        aiscPerTon,
        fcf,
        fcfPerTon,
        netDebt: 0, // Would need balance sheet data
        netDebtToEbitda: 0,
        interestCover: 0,
        totalTons: totalSalesTons,
        totalRevenue,
        cashBalance: 0, // Would need cashflow data
        accountsReceivable: 0,
        accountsPayable: 0,
        onTimeDeliveryPct: 95 // Default assumption
      },
      finance: {
        revenue: totalRevenue,
        cogs: cashCost,
        opex: opexTotal,
        ebitda,
        netIncome: ebitda * 0.8, // Simplified, assume 20% tax
        cashIn: totalRevenue,
        cashOut: totalExpenses,
        cashClosing: totalRevenue - totalExpenses,
        ar: totalRevenue * 0.15, // Assume 15% AR
        ap: totalExpenses * 0.12, // Assume 12% AP
        ccc: 45, // Default CCC assumption
        dso: 45, // Days sales outstanding
        dpo: 30, // Days payable outstanding  
        daysStockpile: 15 // Days stockpile
      },
      productionBridge: {
        deposit: totalRomTons,
        adjustments: totalSaleableTons - totalRomTons,
        finalTons: totalSaleableTons,
        pricePerTon: realizedPricePerTon,
        totalRevenue,
        steps: [
          { label: 'ROM Tons', value: totalRomTons, cumulative: totalRomTons },
          { label: 'Yield Loss', value: totalRomTons - totalSaleableTons, cumulative: totalSaleableTons },
          { label: 'Saleable Tons', value: 0, cumulative: totalSaleableTons }
        ]
      },
      costBreakdown: calculateCostBreakdown(data.expenseData, totalSalesTons),
      vendorPerformance: calculateVendorPerformance(data.expenseData),
      workingCapital: {
        dso: 45,
        dpo: 30,
        daysStockpile: 15,
        ccc: 45,
        arAging: [
          { bucket: '0-30', amount: totalRevenue * 0.1, count: 5 },
          { bucket: '31-60', amount: totalRevenue * 0.04, count: 2 },
          { bucket: '>60', amount: totalRevenue * 0.01, count: 1 }
        ],
        apAging: [
          { bucket: '0-30', amount: totalExpenses * 0.08, count: 8 },
          { bucket: '31-60', amount: totalExpenses * 0.03, count: 3 },
          { bucket: '>60', amount: totalExpenses * 0.01, count: 1 }
        ]
      },
      alerts: generateAlerts(data),
      lastUpdated: new Date().toISOString()
    }
  }

  const calculateCostBreakdown = (expenses: ExpenseData[], totalTons: number) => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      if (!acc[expense.subcategory]) {
        acc[expense.subcategory] = 0
      }
      acc[expense.subcategory] += expense.amount
      return acc
    }, {} as Record<string, number>)

    const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      perTon: totalTons > 0 ? amount / totalTons : 0,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
    }))
  }

  const calculateVendorPerformance = (expenses: ExpenseData[]) => {
    const vendorTotals = expenses.reduce((acc, expense) => {
      if (!acc[expense.vendor]) {
        acc[expense.vendor] = 0
      }
      acc[expense.vendor] += expense.amount
      return acc
    }, {} as Record<string, number>)

    const totalSpend = Object.values(vendorTotals).reduce((sum, amount) => sum + amount, 0)
    
    return Object.entries(vendorTotals)
      .map(([vendor, amount]) => ({
        vendorId: vendor,
        vendorName: vendor,
        totalSpend: amount,
        percentage: totalSpend > 0 ? (amount / totalSpend) * 100 : 0,
        priceChange: Math.random() * 10 - 5, // Random price change for demo
        isCritical: (amount / totalSpend) > 0.2, // 20% threshold for critical vendors
        categories: ['COGS', 'OPEX']
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
  }

  const generateAlerts = (data: CoalMetricsInput) => {
    const alerts = []
    const totalSaleableTons = data.productionData.reduce((sum, p) => sum + p.saleableTons, 0)
    const totalRomTons = data.productionData.reduce((sum, p) => sum + p.romTons, 0)
    const yieldPct = totalRomTons > 0 ? (totalSaleableTons / totalRomTons) * 100 : 0

    if (yieldPct < 80) {
      alerts.push({
        id: 'yield-low',
        type: 'YIELD_LOW',
        severity: 'high' as const,
        message: `Yield rendah: ${yieldPct.toFixed(1)}% (target: >80%)`,
        createdAt: new Date().toISOString(),
        status: 'open' as const
      })
    }

    return alerts
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Input Data Tambang & Kalkulasi Metrics Core12
        </CardTitle>
        <CardDescription>
          Masukkan data produksi, penjualan, dan biaya untuk menghitung KPI Core12 secara komprehensif
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Global Settings */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="period">Periode</Label>
            <Input
              id="period"
              type="month"
              value={metricsInput.period}
              onChange={(e) => setMetricsInput(prev => ({ ...prev, period: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="site">Site</Label>
            <Select value={metricsInput.site} onValueChange={(value) => setMetricsInput(prev => ({ ...prev, site: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sawahlunto">Sawahlunto</SelectItem>
                <SelectItem value="Padang">Padang</SelectItem>
                <SelectItem value="Jambi">Jambi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={metricsInput.currency} onValueChange={(value: 'IDR' | 'USD') => setMetricsInput(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="IDR">IDR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="benchmark">Benchmark Price ({metricsInput.currency}/ton)</Label>
            <Input
              id="benchmark"
              type="number"
              value={metricsInput.benchmarkPrice}
              onChange={(e) => setMetricsInput(prev => ({ ...prev, benchmarkPrice: Number(e.target.value) }))}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="production" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Data Produksi
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Data Penjualan  
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Data Biaya
            </TabsTrigger>
          </TabsList>

          {/* Production Data Tab */}
          <TabsContent value="production" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Data Produksi Harian</h3>
              <Button onClick={addProductionEntry} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Entry
              </Button>
            </div>
            
            {metricsInput.productionData.map((prod, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  <div>
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={prod.date}
                      onChange={(e) => {
                        const newData = [...metricsInput.productionData]
                        newData[index].date = e.target.value
                        setMetricsInput(prev => ({ ...prev, productionData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>ROM (tons)</Label>
                    <Input
                      type="number"
                      value={prod.romTons}
                      onChange={(e) => {
                        const newData = [...metricsInput.productionData]
                        newData[index].romTons = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, productionData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Saleable (tons)</Label>
                    <Input
                      type="number"
                      value={prod.saleableTons}
                      onChange={(e) => {
                        const newData = [...metricsInput.productionData]
                        newData[index].saleableTons = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, productionData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Overburden (tons)</Label>
                    <Input
                      type="number"
                      value={prod.overburdentTons}
                      onChange={(e) => {
                        const newData = [...metricsInput.productionData]
                        newData[index].overburdentTons = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, productionData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Ash (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={prod.ashContent}
                      onChange={(e) => {
                        const newData = [...metricsInput.productionData]
                        newData[index].ashContent = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, productionData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Sulfur (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={prod.sulfurContent}
                      onChange={(e) => {
                        const newData = [...metricsInput.productionData]
                        newData[index].sulfurContent = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, productionData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Moisture (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={prod.moistureContent}
                      onChange={(e) => {
                        const newData = [...metricsInput.productionData]
                        newData[index].moistureContent = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, productionData: newData }))
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEntry('production', index)}
                      disabled={metricsInput.productionData.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Sales Data Tab */}
          <TabsContent value="sales" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Data Penjualan</h3>
              <Button onClick={addSalesEntry} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Entry
              </Button>
            </div>
            
            {metricsInput.salesData.map((sale, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={sale.date}
                      onChange={(e) => {
                        const newData = [...metricsInput.salesData]
                        newData[index].date = e.target.value
                        setMetricsInput(prev => ({ ...prev, salesData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Buyer</Label>
                    <Input
                      value={sale.buyer}
                      onChange={(e) => {
                        const newData = [...metricsInput.salesData]
                        newData[index].buyer = e.target.value
                        setMetricsInput(prev => ({ ...prev, salesData: newData }))
                      }}
                      placeholder="Nama buyer"
                    />
                  </div>
                  <div>
                    <Label>Tons</Label>
                    <Input
                      type="number"
                      value={sale.tons}
                      onChange={(e) => {
                        const newData = [...metricsInput.salesData]
                        newData[index].tons = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, salesData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Price/ton ({metricsInput.currency})</Label>
                    <Input
                      type="number"
                      value={sale.pricePerTon}
                      onChange={(e) => {
                        const newData = [...metricsInput.salesData]
                        newData[index].pricePerTon = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, salesData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Contract Type</Label>
                    <Select value={sale.contract} onValueChange={(value: 'spot' | 'term') => {
                      const newData = [...metricsInput.salesData]
                      newData[index].contract = value
                      setMetricsInput(prev => ({ ...prev, salesData: newData }))
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spot">Spot</SelectItem>
                        <SelectItem value="term">Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEntry('sales', index)}
                      disabled={metricsInput.salesData.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Expenses Data Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Data Biaya Operasional</h3>
              <Button onClick={addExpenseEntry} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Entry
              </Button>
            </div>
            
            {metricsInput.expenseData.map((expense, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div>
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={expense.date}
                      onChange={(e) => {
                        const newData = [...metricsInput.expenseData]
                        newData[index].date = e.target.value
                        setMetricsInput(prev => ({ ...prev, expenseData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select value={expense.category} onValueChange={(value) => {
                      const newData = [...metricsInput.expenseData]
                      newData[index].category = value
                      setMetricsInput(prev => ({ ...prev, expenseData: newData }))
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COGS">COGS</SelectItem>
                        <SelectItem value="OPEX">OPEX</SelectItem>
                        <SelectItem value="CAPEX">CAPEX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sub-kategori</Label>
                    <Select value={expense.subcategory} onValueChange={(value) => {
                      const newData = [...metricsInput.expenseData]
                      newData[index].subcategory = value
                      setMetricsInput(prev => ({ ...prev, expenseData: newData }))
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fuel">Fuel</SelectItem>
                        <SelectItem value="Hauling">Hauling</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Consumables">Consumables</SelectItem>
                        <SelectItem value="Site G&A">Site G&A</SelectItem>
                        <SelectItem value="Royalty">Royalty</SelectItem>
                        <SelectItem value="Sustaining CAPEX">Sustaining CAPEX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vendor</Label>
                    <Input
                      value={expense.vendor}
                      onChange={(e) => {
                        const newData = [...metricsInput.expenseData]
                        newData[index].vendor = e.target.value
                        setMetricsInput(prev => ({ ...prev, expenseData: newData }))
                      }}
                      placeholder="Nama vendor"
                    />
                  </div>
                  <div>
                    <Label>Amount ({metricsInput.currency})</Label>
                    <Input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => {
                        const newData = [...metricsInput.expenseData]
                        newData[index].amount = Number(e.target.value)
                        setMetricsInput(prev => ({ ...prev, expenseData: newData }))
                      }}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={expense.description}
                      onChange={(e) => {
                        const newData = [...metricsInput.expenseData]
                        newData[index].description = e.target.value
                        setMetricsInput(prev => ({ ...prev, expenseData: newData }))
                      }}
                      placeholder="Deskripsi"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEntry('expense', index)}
                      disabled={metricsInput.expenseData.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Calculate Button */}
        <div className="flex justify-center mt-8">
          <Button 
            onClick={calculateMetrics} 
            disabled={calculating}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {calculating ? (
              <>
                <BarChart3 className="h-5 w-5 mr-2 animate-pulse" />
                Menghitung Core12 Metrics...
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5 mr-2" />
                Hitung Core12 Metrics
              </>
            )}
          </Button>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📊 Data Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Production Entries:</span>
              <Badge variant="outline" className="ml-2">{metricsInput.productionData.length}</Badge>
            </div>
            <div>
              <span className="text-blue-600">Sales Entries:</span>
              <Badge variant="outline" className="ml-2">{metricsInput.salesData.length}</Badge>
            </div>
            <div>
              <span className="text-blue-600">Expense Entries:</span>
              <Badge variant="outline" className="ml-2">{metricsInput.expenseData.length}</Badge>
            </div>
            <div>
              <span className="text-blue-600">Total ROM:</span>
              <Badge variant="outline" className="ml-2">
                {metricsInput.productionData.reduce((sum, p) => sum + p.romTons, 0).toLocaleString()} tons
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
