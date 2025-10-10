'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
// Table components - using basic HTML table elements with Tailwind styling
// Replace with shadcn/ui table components if available
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Eye, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Users,
  DollarSign,
  PieChart,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PayrollCalculationResult } from './PayrollCalculationForm'

/**
 * Interface untuk statistik payroll
 */
interface PayrollStatistics {
  totalEmployees: number
  totalGrossPay: number
  totalTax: number
  totalDeductions: number
  totalNetPay: number
  averageGrossPay: number
  averageNetPay: number
  highestPay: {
    employeeName: string
    amount: number
  }
  lowestPay: {
    employeeName: string
    amount: number
  }
  totalWorkingDays: number
  averageWorkingDays: number
}

/**
 * Interface untuk breakdown komponen
 */
interface ComponentBreakdown {
  earnings: Array<{
    name: string
    total: number
    count: number
    average: number
  }>
  deductions: Array<{
    name: string
    total: number
    count: number
    average: number
  }>
}

/**
 * Props untuk komponen PayrollSummary
 */
interface PayrollSummaryProps {
  results: PayrollCalculationResult[]
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void
  onPreview?: () => void
  className?: string
  showDetailedBreakdown?: boolean
}

/**
 * Komponen untuk menampilkan ringkasan dan hasil perhitungan payroll
 * Menampilkan statistik, breakdown komponen, dan tabel detail hasil
 */
export function PayrollSummary({
  results,
  onExport,
  onPreview,
  className,
  showDetailedBreakdown = true
}: PayrollSummaryProps) {
  
  // Hitung statistik payroll
  const statistics = useMemo((): PayrollStatistics => {
    if (results.length === 0) {
      return {
        totalEmployees: 0,
        totalGrossPay: 0,
        totalTax: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        averageGrossPay: 0,
        averageNetPay: 0,
        highestPay: { employeeName: '', amount: 0 },
        lowestPay: { employeeName: '', amount: 0 },
        totalWorkingDays: 0,
        averageWorkingDays: 0
      }
    }

    const totalGrossPay = results.reduce((sum, r) => sum + r.bruto, 0)
    const totalTax = results.reduce((sum, r) => sum + r.pajak, 0)
    const totalDeductions = results.reduce((sum, r) => {
      return sum + r.deductions.reduce((deductSum, d) => deductSum + d.amount, 0)
    }, 0)
    const totalNetPay = results.reduce((sum, r) => sum + r.neto, 0)
    const totalWorkingDays = results.reduce((sum, r) => sum + r.hariKerja, 0)

    const sortedByNetPay = [...results].sort((a, b) => b.neto - a.neto)
    
    return {
      totalEmployees: results.length,
      totalGrossPay,
      totalTax,
      totalDeductions,
      totalNetPay,
      averageGrossPay: totalGrossPay / results.length,
      averageNetPay: totalNetPay / results.length,
      highestPay: {
        employeeName: sortedByNetPay[0]?.employeeName || '',
        amount: sortedByNetPay[0]?.neto || 0
      },
      lowestPay: {
        employeeName: sortedByNetPay[sortedByNetPay.length - 1]?.employeeName || '',
        amount: sortedByNetPay[sortedByNetPay.length - 1]?.neto || 0
      },
      totalWorkingDays,
      averageWorkingDays: totalWorkingDays / results.length
    }
  }, [results])

  // Hitung breakdown komponen
  const componentBreakdown = useMemo((): ComponentBreakdown => {
    const earningsMap = new Map<string, { total: number; count: number }>()
    const deductionsMap = new Map<string, { total: number; count: number }>()

    results.forEach(result => {
      // Process earnings
      result.earnings.forEach(earning => {
        const existing = earningsMap.get(earning.name) || { total: 0, count: 0 }
        earningsMap.set(earning.name, {
          total: existing.total + earning.amount,
          count: existing.count + 1
        })
      })

      // Process deductions
      result.deductions.forEach(deduction => {
        const existing = deductionsMap.get(deduction.name) || { total: 0, count: 0 }
        deductionsMap.set(deduction.name, {
          total: existing.total + deduction.amount,
          count: existing.count + 1
        })
      })
    })

    return {
      earnings: Array.from(earningsMap.entries()).map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        average: data.total / data.count
      })).sort((a, b) => b.total - a.total),
      deductions: Array.from(deductionsMap.entries()).map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        average: data.total / data.count
      })).sort((a, b) => b.total - a.total)
    }
  }, [results])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  if (results.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calculator className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum Ada Hasil Perhitungan</h3>
          <p className="text-muted-foreground text-center">
            Pilih karyawan dan lakukan perhitungan untuk melihat ringkasan payroll
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header dengan Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>Ringkasan Payroll</span>
              </CardTitle>
              <CardDescription>
                Hasil perhitungan gaji untuk {statistics.totalEmployees} karyawan
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onPreview && (
                <Button variant="outline" onClick={onPreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
              {onExport && (
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onExport('pdf')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onExport('excel')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onExport('csv')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Karyawan</p>
                <p className="text-2xl font-bold">{statistics.totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bruto</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(statistics.totalGrossPay)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pajak</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(statistics.totalTax)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Neto</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(statistics.totalNetPay)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistik Tambahan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistik Rata-rata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rata-rata Bruto</span>
              <span className="font-medium">{formatCurrency(statistics.averageGrossPay)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rata-rata Neto</span>
              <span className="font-medium">{formatCurrency(statistics.averageNetPay)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rata-rata Hari Kerja</span>
              <span className="font-medium">{statistics.averageWorkingDays.toFixed(1)} hari</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Gaji Tertinggi & Terendah
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tertinggi</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{statistics.highestPay.employeeName}</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {formatCurrency(statistics.highestPay.amount)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Terendah</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{statistics.lowestPay.employeeName}</span>
                <Badge variant="outline">
                  {formatCurrency(statistics.lowestPay.amount)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Breakdown */}
      {showDetailedBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Breakdown Komponen</CardTitle>
            <CardDescription>
              Rincian komponen pendapatan dan potongan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="earnings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="earnings">Pendapatan</TabsTrigger>
                <TabsTrigger value="deductions">Potongan</TabsTrigger>
              </TabsList>
              
              <TabsContent value="earnings">
                <div className="space-y-4">
                  {componentBreakdown.earnings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Komponen</th>
                            <th className="text-right p-2 font-medium">Total</th>
                            <th className="text-right p-2 font-medium">Jumlah Karyawan</th>
                            <th className="text-right p-2 font-medium">Rata-rata</th>
                          </tr>
                        </thead>
                        <tbody>
                          {componentBreakdown.earnings.map((earning, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{earning.name}</td>
                              <td className="p-2 text-right font-medium text-green-600">
                                {formatCurrency(earning.total)}
                              </td>
                              <td className="p-2 text-right">{earning.count}</td>
                              <td className="p-2 text-right">
                                {formatCurrency(earning.average)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada komponen pendapatan</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="deductions">
                <div className="space-y-4">
                  {componentBreakdown.deductions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Komponen</th>
                            <th className="text-right p-2 font-medium">Total</th>
                            <th className="text-right p-2 font-medium">Jumlah Karyawan</th>
                            <th className="text-right p-2 font-medium">Rata-rata</th>
                          </tr>
                        </thead>
                        <tbody>
                          {componentBreakdown.deductions.map((deduction, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{deduction.name}</td>
                              <td className="p-2 text-right font-medium text-red-600">
                                {formatCurrency(deduction.total)}
                              </td>
                              <td className="p-2 text-right">{deduction.count}</td>
                              <td className="p-2 text-right">
                                {formatCurrency(deduction.average)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada komponen potongan</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Tabel Detail Hasil */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Hasil Perhitungan</CardTitle>
          <CardDescription>
            Rincian perhitungan gaji untuk setiap karyawan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Nama Karyawan</th>
                    <th className="text-right p-2 font-medium">Hari Kerja</th>
                    <th className="text-right p-2 font-medium">Upah Harian</th>
                    <th className="text-right p-2 font-medium">Upah Pokok</th>
                    <th className="text-right p-2 font-medium">Lembur</th>
                    <th className="text-right p-2 font-medium">Bruto</th>
                    <th className="text-right p-2 font-medium">Pajak</th>
                    <th className="text-right p-2 font-medium">Potongan</th>
                    <th className="text-right p-2 font-medium">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => {
                    const totalDeductions = result.deductions.reduce((sum, d) => sum + d.amount, 0)
                    
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{result.employeeName}</td>
                        <td className="p-2 text-right">{result.hariKerja}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(result.upahHarian)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(result.upahPokok)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(result.overtimeAmount)}
                        </td>
                        <td className="p-2 text-right font-medium text-green-600">
                          {formatCurrency(result.bruto)}
                        </td>
                        <td className="p-2 text-right text-orange-600">
                          {formatCurrency(result.pajak)}
                        </td>
                        <td className="p-2 text-right text-red-600">
                          {formatCurrency(totalDeductions)}
                        </td>
                        <td className="p-2 text-right font-bold text-blue-600">
                          {formatCurrency(result.neto)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}