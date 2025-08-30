"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Calculator, 
  Zap, 
  TrendingUp,
  DollarSign,
  BarChart3
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SimulationInputs {
  // Basic Production Data
  romTons: number
  saleableTons: number
  overburdentTons: number
  
  // Sales Data
  pricePerTon: number
  benchmarkPrice: number
  
  // Cost Data
  fuelCost: number
  haulingCost: number
  maintenanceCost: number
  royaltyCost: number
  otherCost: number
  
  // Capital Investment
  initialCapital: number
  equipmentCost: number
  infrastructureCost: number
  workingCapital: number
  
  // Settings
  currency: 'USD' | 'IDR'
  analysisMonths: number
}

export function SimpleSimulationForm({ onCalculate }: { onCalculate: (data: any) => void }) {
  const { toast } = useToast()
  const [calculating, setCalculating] = useState(false)
  
  const [inputs, setInputs] = useState<SimulationInputs>({
    romTons: 1000,
    saleableTons: 850,
    overburdentTons: 4000,
    pricePerTon: 1800000, // 1.8 juta rupiah per ton
    benchmarkPrice: 1725000, // 1.725 juta rupiah per ton
    fuelCost: 375000000, // 375 juta rupiah
    haulingCost: 225000000, // 225 juta rupiah
    maintenanceCost: 120000000, // 120 juta rupiah
    royaltyCost: 90000000, // 90 juta rupiah
    otherCost: 150000000, // 150 juta rupiah
    initialCapital: 50000000000, // 50 miliar rupiah total investment
    equipmentCost: 35000000000, // 35 miliar untuk equipment
    infrastructureCost: 10000000000, // 10 miliar untuk infrastruktur
    workingCapital: 5000000000, // 5 miliar working capital
    currency: 'IDR',
    analysisMonths: 24 // 2 tahun analisis
  })

  const calculateSimpleMetrics = async () => {
    setCalculating(true)
    
    try {
      // Basic calculations
      const totalRevenue = inputs.saleableTons * inputs.pricePerTon
      const totalCosts = inputs.fuelCost + inputs.haulingCost + inputs.maintenanceCost + inputs.royaltyCost + inputs.otherCost
      
      // Core12 KPI calculations
      const yieldPct = inputs.romTons > 0 ? (inputs.saleableTons / inputs.romTons) * 100 : 0
      const stripRatio = inputs.romTons > 0 ? inputs.overburdentTons / inputs.romTons : 0
      const cashCostPerTon = inputs.saleableTons > 0 ? (totalCosts - inputs.royaltyCost) / inputs.saleableTons : 0
      const royaltyPerTon = inputs.saleableTons > 0 ? inputs.royaltyCost / inputs.saleableTons : 0
      const cashMarginPerTon = inputs.pricePerTon - cashCostPerTon - royaltyPerTon
      const benchmarkDiff = inputs.pricePerTon - inputs.benchmarkPrice
      const ebitda = totalRevenue - totalCosts
      const ebitdaMarginPct = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0
      const ebitdaPerTon = inputs.saleableTons > 0 ? ebitda / inputs.saleableTons : 0
      
      // BEP and ROI Calculations
      const monthlyProfit = ebitda // Assuming monthly production
      const totalInvestment = inputs.equipmentCost + inputs.infrastructureCost + inputs.workingCapital
      const breakEvenMonths = monthlyProfit > 0 ? totalInvestment / monthlyProfit : 0
      const breakEvenYears = breakEvenMonths / 12
      const roi = totalInvestment > 0 ? (monthlyProfit * 12 / totalInvestment) * 100 : 0
      const paybackPeriod = breakEvenMonths
      
      // Profit projections for analysis period
      const monthlyProfitProjection = []
      const cumulativeProfitProjection = []
      let cumulativeProfit = -totalInvestment // Start with negative investment
      
      for (let month = 1; month <= inputs.analysisMonths; month++) {
        const monthProfit = monthlyProfit
        cumulativeProfit += monthProfit
        
        monthlyProfitProjection.push({
          month,
          profit: monthProfit,
          cumulative: cumulativeProfit,
          isBreakEven: cumulativeProfit >= 0 && month === Math.ceil(breakEvenMonths)
        })
        
        cumulativeProfitProjection.push({
          name: `Bulan ${month}`,
          profit: monthProfit,
          cumulative: cumulativeProfit,
          investment: month === 1 ? -totalInvestment : 0
        })
      }
      
      // IRR approximation (simplified)
      const finalCumulative = cumulativeProfit
      const irr = totalInvestment > 0 && finalCumulative > 0 ? 
        (Math.pow(finalCumulative / totalInvestment, 12 / inputs.analysisMonths) - 1) * 100 : 0
      
      // Simulate delay for calculation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const dashboardData = {
        kpi: {
          realizedPricePerTon: inputs.pricePerTon,
          benchmarkDiff,
          saleableTons: inputs.saleableTons,
          yieldPct,
          stripRatio,
          cashCostPerTon,
          royaltyPerTon,
          cashMarginPerTon,
          ebitdaPerTon,
          ebitdaMarginPct,
          aiscPerTon: cashCostPerTon * 1.15, // Assume AISC is 15% higher
          fcf: ebitda * 0.8, // Simplified FCF
          fcfPerTon: inputs.saleableTons > 0 ? (ebitda * 0.8) / inputs.saleableTons : 0,
          netDebt: 0,
          netDebtToEbitda: 0,
          interestCover: 0,
          totalTons: inputs.saleableTons,
          totalRevenue,
          cashBalance: ebitda,
          accountsReceivable: totalRevenue * 0.15,
          accountsPayable: totalCosts * 0.12,
          onTimeDeliveryPct: 95
        },
        finance: {
          revenue: totalRevenue,
          cogs: totalCosts - inputs.royaltyCost,
          opex: inputs.otherCost,
          ebitda,
          netIncome: ebitda * 0.8,
          cashIn: totalRevenue,
          cashOut: totalCosts,
          cashClosing: totalRevenue - totalCosts,
          ar: totalRevenue * 0.15,
          ap: totalCosts * 0.12,
          ccc: 45,
          dso: 45,
          dpo: 30,
          daysStockpile: 15
        },
        productionBridge: {
          deposit: inputs.romTons,
          adjustments: inputs.saleableTons - inputs.romTons,
          finalTons: inputs.saleableTons,
          pricePerTon: inputs.pricePerTon,
          totalRevenue,
          steps: [
            { label: 'ROM Tons', value: inputs.romTons, cumulative: inputs.romTons },
            { label: 'Kerugian Yield', value: inputs.romTons - inputs.saleableTons, cumulative: inputs.saleableTons },
            { label: 'Saleable Tons', value: 0, cumulative: inputs.saleableTons }
          ]
        },
        costBreakdown: [
          { category: 'Bahan Bakar', amount: inputs.fuelCost, perTon: inputs.fuelCost / inputs.saleableTons, percentage: (inputs.fuelCost / totalCosts) * 100 },
          { category: 'Hauling', amount: inputs.haulingCost, perTon: inputs.haulingCost / inputs.saleableTons, percentage: (inputs.haulingCost / totalCosts) * 100 },
          { category: 'Maintenance', amount: inputs.maintenanceCost, perTon: inputs.maintenanceCost / inputs.saleableTons, percentage: (inputs.maintenanceCost / totalCosts) * 100 },
          { category: 'Royalty', amount: inputs.royaltyCost, perTon: inputs.royaltyCost / inputs.saleableTons, percentage: (inputs.royaltyCost / totalCosts) * 100 },
          { category: 'Lainnya', amount: inputs.otherCost, perTon: inputs.otherCost / inputs.saleableTons, percentage: (inputs.otherCost / totalCosts) * 100 }
        ],
        vendorPerformance: [
          { vendorId: 'V001', vendorName: 'Vendor Fuel', totalSpend: inputs.fuelCost, percentage: (inputs.fuelCost / totalCosts) * 100, priceChange: 2.5, isCritical: true, categories: ['COGS'] },
          { vendorId: 'V002', vendorName: 'Vendor Hauling', totalSpend: inputs.haulingCost, percentage: (inputs.haulingCost / totalCosts) * 100, priceChange: -1.2, isCritical: false, categories: ['COGS'] }
        ],
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
            { bucket: '0-30', amount: totalCosts * 0.08, count: 8 },
            { bucket: '31-60', amount: totalCosts * 0.03, count: 3 },
            { bucket: '>60', amount: totalCosts * 0.01, count: 1 }
          ]
        },
        alerts: yieldPct < 80 ? [{
          id: 'yield-low',
          type: 'YIELD_LOW',
          severity: 'high' as const,
          message: `Rendemen rendah: ${yieldPct.toFixed(1)}% (target: >80%)`,
          createdAt: new Date().toISOString(),
          status: 'open' as const
        }] : [],
        // BEP and ROI Analysis
        bepAnalysis: {
          totalInvestment,
          monthlyProfit,
          breakEvenMonths,
          breakEvenYears,
          roi,
          irr,
          paybackPeriod,
          monthlyProfitProjection,
          cumulativeProfitProjection,
          npv: finalCumulative, // Simplified NPV
          profitAfterPayback: finalCumulative - totalInvestment
        },
        lastUpdated: new Date().toISOString()
      }
      
      onCalculate(dashboardData)
      
      toast({
        title: "Simulasi Berhasil!",
        description: `Metrics Core12 telah dihitung berdasarkan data simulasi`,
      })
    } catch (error) {
      toast({
        title: "Error Simulasi",
        description: "Gagal menghitung metrics. Silakan coba lagi.",
        variant: "destructive"
      })
    } finally {
      setCalculating(false)
    }
  }

  const resetToDefaults = () => {
    setInputs({
      romTons: 1000,
      saleableTons: 850,
      overburdentTons: 4000,
      pricePerTon: 1800000, // 1.8 juta rupiah per ton
      benchmarkPrice: 1725000, // 1.725 juta rupiah per ton
      fuelCost: 375000000, // 375 juta rupiah
      haulingCost: 225000000, // 225 juta rupiah
      maintenanceCost: 120000000, // 120 juta rupiah
      royaltyCost: 90000000, // 90 juta rupiah
      otherCost: 150000000, // 150 juta rupiah
      initialCapital: 50000000000, // 50 miliar rupiah total investment
      equipmentCost: 35000000000, // 35 miliar untuk equipment
      infrastructureCost: 10000000000, // 10 miliar untuk infrastruktur
      workingCapital: 5000000000, // 5 miliar working capital
      currency: 'IDR',
      analysisMonths: 24 // 2 tahun analisis
    })
  }

  return (
    <Card className="w-full border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Zap className="h-5 w-5" />
          Simulasi Cepat Metrics Core12
        </CardTitle>
        <CardDescription>
          Input data sederhana untuk perhitungan cepat semua metrics Core12. Cocok untuk simulasi dan analisis cepat.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Currency Selection */}
        <div className="mb-6">
          <Label htmlFor="currency">Mata Uang</Label>
          <Select value={inputs.currency} onValueChange={(value: 'USD' | 'IDR') => setInputs(prev => ({ ...prev, currency: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="IDR">IDR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Production Data */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Data Produksi
            </h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="romTons" className="flex items-center gap-2">
                  ROM Tons
                  <span className="text-xs text-gray-500">(Run of Mine)</span>
                </Label>
                <Input
                  id="romTons"
                  type="number"
                  value={inputs.romTons}
                  onChange={(e) => setInputs(prev => ({ ...prev, romTons: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Total batubara yang ditambang dari tambang sebelum diproses. Termasuk semua material batubara mentah.
                </p>
              </div>
              <div>
                <Label htmlFor="saleableTons" className="flex items-center gap-2">
                  Saleable Tons
                  <span className="text-xs text-gray-500">(Siap Jual)</span>
                </Label>
                <Input
                  id="saleableTons"
                  type="number"
                  value={inputs.saleableTons}
                  onChange={(e) => setInputs(prev => ({ ...prev, saleableTons: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Jumlah batubara berkualitas yang siap dijual setelah proses washing dan pemisahan kotoran.
                </p>
              </div>
              <div>
                <Label htmlFor="overburdentTons" className="flex items-center gap-2">
                  Overburden Tons
                  <span className="text-xs text-gray-500">(Tanah Penutup)</span>
                </Label>
                <Input
                  id="overburdentTons"
                  type="number"
                  value={inputs.overburdentTons}
                  onChange={(e) => setInputs(prev => ({ ...prev, overburdentTons: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Volume tanah, batu, dan material lain yang harus diangkat untuk mengakses batubara. Berpengaruh pada strip ratio.
                </p>
              </div>
            </div>
          </Card>

          {/* Sales Data */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Data Penjualan
            </h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pricePerTon" className="flex items-center gap-2">
                  Harga/ton ({inputs.currency})
                  <span className="text-xs text-gray-500">(Realisasi)</span>
                </Label>
                <Input
                  id="pricePerTon"
                  type="number"
                  value={inputs.pricePerTon}
                  onChange={(e) => setInputs(prev => ({ ...prev, pricePerTon: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Harga jual realisasi batubara per ton. Biasanya berdasarkan kontrak jangka panjang atau harga spot market.
                </p>
              </div>
              <div>
                <Label htmlFor="benchmarkPrice" className="flex items-center gap-2">
                  Benchmark Price ({inputs.currency})
                  <span className="text-xs text-gray-500">(Newcastle/HBA)</span>
                </Label>
                <Input
                  id="benchmarkPrice"
                  type="number"
                  value={inputs.benchmarkPrice}
                  onChange={(e) => setInputs(prev => ({ ...prev, benchmarkPrice: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Harga referensi pasar global (Newcastle/HBA). Digunakan untuk mengukur premium/discount terhadap market.
                </p>
              </div>
              <div className="pt-4 p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <strong>Total Pendapatan:</strong> 
                  <br />
                  <span className="text-lg font-semibold text-green-700">
                    {inputs.currency} {(inputs.saleableTons * inputs.pricePerTon).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  📊 {inputs.saleableTons.toLocaleString()} tons × {inputs.pricePerTon.toLocaleString('id-ID')} {inputs.currency}/ton
                </div>
              </div>
            </div>
          </Card>

          {/* Cost Data */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Data Biaya ({inputs.currency})
            </h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fuelCost" className="flex items-center gap-2">
                  Biaya Bahan Bakar
                  <span className="text-xs text-gray-500">(Solar/HSD)</span>
                </Label>
                <Input
                  id="fuelCost"
                  type="number"
                  value={inputs.fuelCost}
                  onChange={(e) => setInputs(prev => ({ ...prev, fuelCost: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Biaya bahan bakar untuk excavator, dump truck, dan alat berat lainnya. Komponen biaya terbesar di mining.
                </p>
              </div>
              <div>
                <Label htmlFor="haulingCost" className="flex items-center gap-2">
                  Biaya Hauling
                  <span className="text-xs text-gray-500">(Kontrak/Internal)</span>
                </Label>
                <Input
                  id="haulingCost"
                  type="number"
                  value={inputs.haulingCost}
                  onChange={(e) => setInputs(prev => ({ ...prev, haulingCost: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Biaya pengangkutan batubara dari pit ke stockpile/port. Bisa kontrak dengan vendor atau fleet internal.
                </p>
              </div>
              <div>
                <Label htmlFor="maintenanceCost" className="flex items-center gap-2">
                  Biaya Maintenance
                  <span className="text-xs text-gray-500">(Perawatan)</span>
                </Label>
                <Input
                  id="maintenanceCost"
                  type="number"
                  value={inputs.maintenanceCost}
                  onChange={(e) => setInputs(prev => ({ ...prev, maintenanceCost: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Biaya pemeliharaan equipment (spare parts, service, overhaul). Biasanya 10-15% dari fuel cost.
                </p>
              </div>
              <div>
                <Label htmlFor="royaltyCost" className="flex items-center gap-2">
                  Biaya Royalty
                  <span className="text-xs text-gray-500">(Pemerintah)</span>
                </Label>
                <Input
                  id="royaltyCost"
                  type="number"
                  value={inputs.royaltyCost}
                  onChange={(e) => setInputs(prev => ({ ...prev, royaltyCost: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Royalty kepada pemerintah berdasarkan HBA (Harga Batubara Acuan). Biasanya 13.5% dari HBA × produksi.
                </p>
              </div>
              <div>
                <Label htmlFor="otherCost" className="flex items-center gap-2">
                  Biaya Lainnya
                  <span className="text-xs text-gray-500">(Overheads)</span>
                </Label>
                <Input
                  id="otherCost"
                  type="number"
                  value={inputs.otherCost}
                  onChange={(e) => setInputs(prev => ({ ...prev, otherCost: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Biaya operasional lain: gaji, asuransi, eksplorasi, rehabilitasi lahan, administrasi, security.
                </p>
              </div>
              <div className="pt-4 p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <strong>Total Biaya:</strong> 
                  <br />
                  <span className="text-lg font-semibold text-red-700">
                    {inputs.currency} {(inputs.fuelCost + inputs.haulingCost + inputs.maintenanceCost + inputs.royaltyCost + inputs.otherCost).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  📊 Cash Cost per ton: {inputs.currency} {inputs.saleableTons > 0 ? ((inputs.fuelCost + inputs.haulingCost + inputs.maintenanceCost + inputs.otherCost) / inputs.saleableTons).toLocaleString('id-ID') : 0}/ton
                </div>
              </div>
            </div>
          </Card>

          {/* Capital Investment Data */}
          <Card className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Investasi Modal ({inputs.currency})
            </h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="equipmentCost" className="flex items-center gap-2">
                  Biaya Equipment
                  <span className="text-xs text-gray-500">(Alat Berat)</span>
                </Label>
                <Input
                  id="equipmentCost"
                  type="number"
                  value={inputs.equipmentCost}
                  onChange={(e) => setInputs(prev => ({ ...prev, equipmentCost: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Investasi excavator, dump truck, bulldozer, dan alat berat lainnya untuk operasi mining.
                </p>
              </div>
              <div>
                <Label htmlFor="infrastructureCost" className="flex items-center gap-2">
                  Biaya Infrastruktur
                  <span className="text-xs text-gray-500">(Fasilitas)</span>
                </Label>
                <Input
                  id="infrastructureCost"
                  type="number"
                  value={inputs.infrastructureCost}
                  onChange={(e) => setInputs(prev => ({ ...prev, infrastructureCost: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Pembangunan jalan tambang, workshop, stockpile area, office, dan fasilitas penunjang.
                </p>
              </div>
              <div>
                <Label htmlFor="workingCapital" className="flex items-center gap-2">
                  Working Capital
                  <span className="text-xs text-gray-500">(Modal Kerja)</span>
                </Label>
                <Input
                  id="workingCapital"
                  type="number"
                  value={inputs.workingCapital}
                  onChange={(e) => setInputs(prev => ({ ...prev, workingCapital: Number(e.target.value) }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Modal kerja untuk biaya operasional awal, gaji karyawan, stock fuel dan spare parts.
                </p>
              </div>
              <div>
                <Label htmlFor="analysisMonths" className="flex items-center gap-2">
                  Periode Analisis
                  <span className="text-xs text-gray-500">(Bulan)</span>
                </Label>
                <Input
                  id="analysisMonths"
                  type="number"
                  value={inputs.analysisMonths}
                  onChange={(e) => setInputs(prev => ({ ...prev, analysisMonths: Number(e.target.value) }))}
                  className="mt-1"
                  min="12"
                  max="60"
                />
                <p className="text-xs text-gray-600 mt-1">
                  📖 Periode proyeksi untuk analisis BEP dan ROI (12-60 bulan). Recommended: 24-36 bulan.
                </p>
              </div>
              <div className="pt-4 p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <strong>Total Investasi:</strong> 
                  <br />
                  <span className="text-lg font-semibold text-orange-700">
                    {inputs.currency} {(inputs.equipmentCost + inputs.infrastructureCost + inputs.workingCapital).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  💰 Equipment + Infrastruktur + Working Capital
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Metrics Preview */}
        <div className="mt-6 p-4 bg-white rounded-lg border shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📊 Preview Metrics Cepat
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-600 block text-xs">Rendemen (Yield):</span>
              <Badge variant="outline" className="mt-1 font-semibold">
                {inputs.romTons > 0 ? ((inputs.saleableTons / inputs.romTons) * 100).toFixed(1) : 0}%
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Target: &gt;80%</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <span className="text-gray-600 block text-xs">Strip Ratio:</span>
              <Badge variant="outline" className="mt-1 font-semibold">
                {inputs.romTons > 0 ? (inputs.overburdentTons / inputs.romTons).toFixed(1) : 0}:1
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Typical: 3-8</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <span className="text-gray-600 block text-xs">Margin/ton:</span>
              <Badge variant="outline" className="mt-1 font-semibold">
                {inputs.currency} {inputs.saleableTons > 0 ? 
                  Number(inputs.pricePerTon - ((inputs.fuelCost + inputs.haulingCost + inputs.maintenanceCost + inputs.otherCost) / inputs.saleableTons) - (inputs.royaltyCost / inputs.saleableTons)).toLocaleString('id-ID', { maximumFractionDigits: 0 })
                  : 0}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Cash Margin</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-600 block text-xs">Benchmark Diff:</span>
              <Badge variant="outline" className="mt-1 font-semibold">
                {inputs.currency} {Number(inputs.pricePerTon - inputs.benchmarkPrice).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">vs Newcastle/HBA</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <span className="text-gray-600 block text-xs">BEP (Break Even):</span>
              <Badge variant="outline" className="mt-1 font-semibold">
                {(() => {
                  const monthlyProfit = (inputs.saleableTons * inputs.pricePerTon) - (inputs.fuelCost + inputs.haulingCost + inputs.maintenanceCost + inputs.royaltyCost + inputs.otherCost)
                  const totalInvestment = inputs.equipmentCost + inputs.infrastructureCost + inputs.workingCapital
                  const breakEvenMonths = monthlyProfit > 0 ? totalInvestment / monthlyProfit : 0
                  return breakEvenMonths > 0 ? `${Math.ceil(breakEvenMonths)} bulan` : 'N/A'
                })()}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Waktu Balik Modal</p>
            </div>
            <div className="p-3 bg-pink-50 rounded-lg">
              <span className="text-gray-600 block text-xs">ROI Tahunan:</span>
              <Badge variant="outline" className="mt-1 font-semibold">
                {(() => {
                  const monthlyProfit = (inputs.saleableTons * inputs.pricePerTon) - (inputs.fuelCost + inputs.haulingCost + inputs.maintenanceCost + inputs.royaltyCost + inputs.otherCost)
                  const totalInvestment = inputs.equipmentCost + inputs.infrastructureCost + inputs.workingCapital
                  const roi = totalInvestment > 0 ? (monthlyProfit * 12 / totalInvestment) * 100 : 0
                  return roi > 0 ? `${roi.toFixed(1)}%` : 'N/A'
                })()}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">Return on Investment</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button 
            onClick={calculateSimpleMetrics} 
            disabled={calculating}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {calculating ? (
              <>
                <BarChart3 className="h-5 w-5 mr-2 animate-pulse" />
                Menghitung Simulasi...
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5 mr-2" />
                Hitung Simulasi Core12
              </>
            )}
          </Button>
          
          <Button 
            onClick={resetToDefaults} 
            variant="outline"
            size="lg"
          >
            Reset Default
          </Button>
        </div>

        {/* Comprehensive Info */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              💡 Tips Simulasi & Panduan Input
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h5 className="font-semibold mb-2">📊 Benchmarks Normal:</h5>
                <ul className="space-y-1">
                  <li>• Rendemen (Yield): 80-90%</li>
                  <li>• Strip Ratio: 3-8 (tergantung deposit)</li>
                  <li>• Cash Cost: $30-60/ton (Rp450-900rb)</li>
                  <li>• EBITDA Margin: 25-45%</li>
                  <li>• BEP: 12-36 bulan (normal)</li>
                  <li>• ROI: 15-35% per tahun</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">💰 Panduan Biaya (per bulan):</h5>
                <ul className="space-y-1">
                  <li>• Fuel: 40-50% dari total biaya</li>
                  <li>• Hauling: 20-30% dari total biaya</li>
                  <li>• Maintenance: 10-15% dari fuel cost</li>
                  <li>• Royalty: 13.5% × HBA × produksi</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3">📋 Cara Mengisi Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
              <div>
                <h5 className="font-semibold mb-2">🏗️ Data Produksi:</h5>
                <ul className="space-y-1">
                  <li>• ROM: Total ditambang</li>
                  <li>• Saleable: Setelah washing</li>
                  <li>• Overburden: Tanah kupasan</li>
                  <li>• Ukuran dalam metric tons</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">💵 Data Penjualan:</h5>
                <ul className="space-y-1">
                  <li>• Harga: Kontrak realisasi</li>
                  <li>• Benchmark: Newcastle/HBA</li>
                  <li>• Dalam rupiah per ton</li>
                  <li>• FOB port price</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">🏭 Data Biaya:</h5>
                <ul className="space-y-1">
                  <li>• Total biaya per periode</li>
                  <li>• Fuel: HSD/diesel equipment</li>
                  <li>• Hauling: Transport costs</li>
                  <li>• Include overhead costs</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">💼 Investasi Modal:</h5>
                <ul className="space-y-1">
                  <li>• Equipment: 60-70% total invest</li>
                  <li>• Infrastruktur: 20-25%</li>
                  <li>• Working Capital: 10-15%</li>
                  <li>• Periode analisis: 24-36 bulan</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Catatan Penting</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Simulasi ini menggunakan formula standar industri batubara</li>
              <li>• Hasil perhitungan bersifat estimasi untuk analisis cepat</li>
              <li>• BEP dan ROI tidak memperhitungkan inflasi, pajak, dan depresiasi</li>
              <li>• Untuk laporan resmi, gunakan data aktual dan audit profesional</li>
              <li>• Currency default: IDR (Rupiah), bisa diganti ke USD jika perlu</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
