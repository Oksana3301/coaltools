"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Truck,
  TrendingUp,
  Plus,
  Save,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calculator,
  FileText,
  Users
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  uploadFile, 
  exportToExcel, 
  exportToCSV, 
  generatePDF,
  saveToLocalStorage,
  loadFromLocalStorage,
  validateFileType,
  validateFileSize,
  generateProductionTemplate,
  importExcelFile
} from "@/lib/file-utils"

// Types
interface WeighTransaction {
  id: string
  tanggal: string
  nopol: string
  pembeli_id?: string
  pembeli_nama: string
  tujuan: string
  gross_ton: number
  tare_ton: number
  netto_ton: number
  source_file?: string
  notes?: string
  created_at: string
}

interface Buyer {
  id: string
  nama: string
  harga_per_ton_default?: number
}

interface ProductionPeriod {
  id: string
  bulan: string
  tahun: number
  start_date: string
  end_date: string
  harga_per_ton_default: number
  deposit_opening_ton: number
  adj_plus_ton: number
  adj_minus_ton: number
  total_penjualan_ton: number
  total_harga_penjualan: number
}

interface DailySummary {
  tanggal: string
  netto_total_ton: number
  transaksi_count: number
}

// Sample data
const SAMPLE_BUYERS: Buyer[] = [
  { id: '1', nama: 'PT. Sumber Energi', harga_per_ton_default: 850000 },
  { id: '2', nama: 'CV. Bara Mandiri', harga_per_ton_default: 820000 },
  { id: '3', nama: 'PT. Mega Coal', harga_per_ton_default: 870000 }
]

const SAMPLE_TRANSACTIONS: WeighTransaction[] = [
  {
    id: '1',
    tanggal: '2024-01-15',
    nopol: 'B 1234 XYZ',
    pembeli_id: '1',
    pembeli_nama: 'PT. Sumber Energi',
    tujuan: 'Stockpile A',
    gross_ton: 35.680,
    tare_ton: 11.000,
    netto_ton: 24.680,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    tanggal: '2024-01-15',
    nopol: 'B 5678 ABC',
    pembeli_id: '2',
    pembeli_nama: 'CV. Bara Mandiri',
    tujuan: 'Stockpile B',
    gross_ton: 42.150,
    tare_ton: 12.500,
    netto_ton: 29.650,
    created_at: new Date().toISOString()
  }
]

export function ProductionReport() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [transactions, setTransactions] = useState<WeighTransaction[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>(SAMPLE_BUYERS)
  const [selectedBuyer, setSelectedBuyer] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [productionTargets, setProductionTargets] = useState<Map<string, number>>(new Map())
  const [analytics, setAnalytics] = useState({
    monthlyTrend: [] as Array<{month: string, production: number}>,
    buyerAnalysis: [] as Array<{buyer: string, volume: number, percentage: number}>,
    efficiency: { target: 0, actual: 0, percentage: 0 }
  })
  const [currentPeriod, setCurrentPeriod] = useState<ProductionPeriod>({
    id: '1',
    bulan: 'Januari',
    tahun: 2024,
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    harga_per_ton_default: 850000,
    deposit_opening_ton: 0,
    adj_plus_ton: 0,
    adj_minus_ton: 0,
    total_penjualan_ton: 0,
    total_harga_penjualan: 0
  })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<WeighTransaction | null>(null)
  const [formData, setFormData] = useState({
    tanggal: '',
    nopol: '',
    pembeli_nama: '',
    tujuan: '',
    gross_ton: 0,
    tare_ton: 0,
    notes: ''
  })

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTransactions = loadFromLocalStorage('production_transactions', SAMPLE_TRANSACTIONS)
    setTransactions(savedTransactions)
  }, [])

  // Save to localStorage whenever transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      saveToLocalStorage('production_transactions', transactions)
    }
  }, [transactions])

  // Calculate analytics whenever transactions change
  useEffect(() => {
    calculateAnalytics()
  }, [transactions, currentPeriod])

  // Advanced Analytics Functions
  const calculateAnalytics = () => {
    // Monthly production trend
    const monthlyData = getMonthlyProductionTrend()
    
    // Buyer analysis
    const buyerData = getBuyerAnalysis()
    
    // Production efficiency
    const efficiency = calculateProductionEfficiency()
    
    setAnalytics({
      monthlyTrend: monthlyData,
      buyerAnalysis: buyerData,
      efficiency
    })
  }

  const getMonthlyProductionTrend = () => {
    const monthlyProduction: Record<string, number> = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.tanggal)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyProduction[monthKey]) {
        monthlyProduction[monthKey] = 0
      }
      monthlyProduction[monthKey] += transaction.netto_ton
    })
    
    return Object.entries(monthlyProduction)
      .map(([month, production]) => ({ month, production }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  const getBuyerAnalysis = () => {
    const buyerVolumes: Record<string, number> = {}
    const totalVolume = transactions.reduce((sum, t) => sum + t.netto_ton, 0)
    
    transactions.forEach(transaction => {
      const buyerName = transaction.pembeli_nama
      if (!buyerVolumes[buyerName]) {
        buyerVolumes[buyerName] = 0
      }
      buyerVolumes[buyerName] += transaction.netto_ton
    })
    
    return Object.entries(buyerVolumes)
      .map(([buyer, volume]) => ({
        buyer,
        volume,
        percentage: totalVolume > 0 ? (volume / totalVolume) * 100 : 0
      }))
      .sort((a, b) => b.volume - a.volume)
  }

  const calculateProductionEfficiency = () => {
    const currentMonthTarget = productionTargets.get(currentPeriod.bulan) || 1000
    const actualProduction = transactions.reduce((sum, t) => sum + t.netto_ton, 0)
    
    return {
      target: currentMonthTarget,
      actual: actualProduction,
      percentage: currentMonthTarget > 0 ? (actualProduction / currentMonthTarget) * 100 : 0
    }
  }

  // Buyer Management Functions
  const addBuyer = (buyerData: Omit<Buyer, 'id'>) => {
    const newBuyer: Buyer = {
      ...buyerData,
      id: Date.now().toString()
    }
    setBuyers(prev => [...prev, newBuyer])
    toast({
      title: "Pembeli ditambahkan",
      description: `${newBuyer.nama} berhasil ditambahkan`
    })
  }

  const updateBuyer = (id: string, updates: Partial<Buyer>) => {
    setBuyers(prev => prev.map(buyer => 
      buyer.id === id ? { ...buyer, ...updates } : buyer
    ))
  }

  const getBuyerPerformance = (buyerId: string) => {
    const buyerTransactions = transactions.filter(t => t.pembeli_id === buyerId)
    const totalVolume = buyerTransactions.reduce((sum, t) => sum + t.netto_ton, 0)
    const avgVolume = buyerTransactions.length > 0 ? totalVolume / buyerTransactions.length : 0
    
    return {
      totalTransactions: buyerTransactions.length,
      totalVolume,
      averageVolume: avgVolume,
      lastTransaction: buyerTransactions.length > 0 ? buyerTransactions[buyerTransactions.length - 1].tanggal : null
    }
  }

  // Advanced filtering with date range and buyer
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      const matchesBuyer = selectedBuyer === 'all' || transaction.pembeli_nama === selectedBuyer
      
      let matchesDateRange = true
      if (dateRange.start && dateRange.end) {
        matchesDateRange = transaction.tanggal >= dateRange.start && transaction.tanggal <= dateRange.end
      }
      
      return matchesBuyer && matchesDateRange
    })
  }

  // Production Target Management
  const setMonthlyTarget = (month: string, target: number) => {
    setProductionTargets(prev => new Map(prev.set(month, target)))
    toast({
      title: "Target produksi diperbarui",
      description: `Target untuk ${month}: ${formatNumber(target)} ton`
    })
  }

  // Auto calculate netto from gross and tare
  const calculatedNetto = formData.gross_ton - formData.tare_ton

  const formatNumber = (num: number, decimals: number = 3) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImport = async (file: File) => {
    try {
      const data = await importExcelFile(file)
      if (data.length < 2) {
        toast({
          title: "File kosong",
          description: "File Excel tidak memiliki data yang valid",
          variant: "destructive"
        })
        return
      }

      // Skip header row and convert to transactions
      const importedTransactions: WeighTransaction[] = data.slice(1).map((row: unknown[], index: number) => {
        const rowData = row as string[]
        return {
          id: `imported_${Date.now()}_${index}`,
          tanggal: rowData[0] || '',
          nopol: rowData[1] || '',
          pembeli_id: '',
          pembeli_nama: rowData[2] || '',
          tujuan: rowData[3] || '',
          gross_ton: parseFloat(rowData[4]) || 0,
          tare_ton: parseFloat(rowData[5]) || 0,
          netto_ton: parseFloat(rowData[6]) || (parseFloat(rowData[4]) - parseFloat(rowData[5])),
          notes: rowData[7] || '',
          created_at: new Date().toISOString()
        }
      })

      setTransactions(prev => [...prev, ...importedTransactions])
      
      toast({
        title: "Import berhasil",
        description: `Berhasil mengimpor ${importedTransactions.length} transaksi produksi`
      })
    } catch (error) {
      toast({
        title: "Import gagal",
        description: "Terjadi kesalahan saat mengimpor file Excel",
        variant: "destructive"
      })
    }
  }

  const validateForm = () => {
    const requiredFields = ['tanggal', 'nopol', 'pembeli_nama', 'tujuan']
    const missingFields = requiredFields.filter(field => !formData[field])
    
    if (missingFields.length > 0) {
      toast({
        title: "Form tidak lengkap",
        description: `Mohon lengkapi field: ${missingFields.join(', ')}`,
        variant: "destructive"
      })
      return false
    }

    if (formData.gross_ton <= 0 || formData.tare_ton <= 0) {
      toast({
        title: "Nilai tidak valid",
        description: "Gross dan Tare harus lebih dari 0",
        variant: "destructive"
      })
      return false
    }

    if (formData.gross_ton <= formData.tare_ton) {
      toast({
        title: "Gross tidak valid",
        description: "Gross harus lebih besar dari Tare",
        variant: "destructive"
      })
      return false
    }

    // Validate tare range (normal truck tare between 9-15 tons)
    if (formData.tare_ton < 9 || formData.tare_ton > 15) {
      toast({
        title: "Tare tidak wajar",
        description: "Tare truck umumnya antara 9-15 ton. Apakah Anda yakin?",
        variant: "destructive"
      })
    }

    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const transaction: WeighTransaction = {
      id: editingTransaction ? editingTransaction.id : Date.now().toString(),
      ...formData,
      netto_ton: calculatedNetto,
      created_at: new Date().toISOString()
    }

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? transaction : t))
      toast({
        title: "Berhasil diperbarui",
        description: "Data transaksi berhasil diperbarui"
      })
    } else {
      setTransactions(prev => [...prev, transaction])
      toast({
        title: "Berhasil ditambahkan",
        description: "Data transaksi berhasil ditambahkan"
      })
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      tanggal: '',
      nopol: '',
      pembeli_nama: '',
      tujuan: '',
      gross_ton: 0,
      tare_ton: 0,
      notes: ''
    })
    setEditingTransaction(null)
    setIsFormOpen(false)
  }

  const handleEdit = (transaction: WeighTransaction) => {
    setFormData({
      tanggal: transaction.tanggal,
      nopol: transaction.nopol,
      pembeli_nama: transaction.pembeli_nama,
      tujuan: transaction.tujuan,
      gross_ton: transaction.gross_ton,
      tare_ton: transaction.tare_ton,
      notes: transaction.notes || ''
    })
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    toast({
      title: "Berhasil dihapus",
      description: "Data transaksi berhasil dihapus"
    })
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      toast({
        title: "Format file tidak valid",
        description: "Mohon upload file Excel (.xlsx) atau CSV",
        variant: "destructive"
      })
      return
    }

    // Simulate file processing
    toast({
      title: "File sedang diproses",
      description: "Mengimpor data dari file..."
    })

    // Simulate delay and success
    setTimeout(() => {
      toast({
        title: "Import berhasil",
        description: `Berhasil mengimpor ${Math.floor(Math.random() * 50) + 10} transaksi dari ${file.name}`
      })
    }, 2000)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const exportToExcel = () => {
    toast({
      title: "Export berhasil",
      description: "Data produksi berhasil diekspor ke Excel"
    })
  }

  const exportToPDF = () => {
    const reportData = transactions.map(t => `
      <tr>
        <td>${t.tanggal}</td>
        <td>${t.nopol}</td>
        <td>${t.pembeli_nama}</td>
        <td>${t.tujuan}</td>
        <td style="text-align: right;">${formatNumber(t.gross_ton)} ton</td>
        <td style="text-align: right;">${formatNumber(t.tare_ton)} ton</td>
        <td style="text-align: right;">${formatNumber(t.netto_ton)} ton</td>
      </tr>
    `).join('')

    const htmlContent = `
      <h2>Laporan Produksi Batu Bara</h2>
      <p><strong>Periode:</strong> ${currentPeriod.bulan} ${currentPeriod.tahun}</p>
      <p><strong>Total Transaksi:</strong> ${transactions.length}</p>
      <p><strong>Total Produksi:</strong> ${formatNumber(transactions.reduce((sum, t) => sum + t.netto_ton, 0))} ton</p>
      <p><strong>Total Penjualan:</strong> ${formatNumber(getTotalPenjualan())} ton</p>
      <p><strong>Total Nilai:</strong> ${formatCurrency(getTotalHargaPenjualan())}</p>
      
      <h3>Detail Transaksi:</h3>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>No Polisi</th>
            <th>Pembeli</th>
            <th>Tujuan</th>
            <th>Gross (ton)</th>
            <th>Tare (ton)</th>
            <th>Netto (ton)</th>
          </tr>
        </thead>
        <tbody>
          ${reportData}
        </tbody>
      </table>
    `

    generatePDF(htmlContent, `Laporan_Produksi_${currentPeriod.bulan}_${currentPeriod.tahun}.pdf`)
    
    toast({
      title: "PDF berhasil dibuat",
      description: "Laporan produksi berhasil digenerate ke PDF"
    })
  }

  const handleExportExcel = () => {
    const exportData = transactions.map(t => ({
      Tanggal: t.tanggal,
      'No Polisi': t.nopol,
      Pembeli: t.pembeli_nama,
      Tujuan: t.tujuan,
      'Gross (ton)': t.gross_ton,
      'Tare (ton)': t.tare_ton,
      'Netto (ton)': t.netto_ton,
      Catatan: t.notes || ''
    }))

    if (exportToExcel(exportData, `Produksi_${currentPeriod.bulan}_${currentPeriod.tahun}.xlsx`, 'Produksi')) {
      toast({
        title: "Export berhasil",
        description: "Data produksi berhasil diekspor ke Excel"
      })
    }
  }

  const handleExportCSV = () => {
    const exportData = transactions.map(t => ({
      Tanggal: t.tanggal,
      'No_Polisi': t.nopol,
      Pembeli: t.pembeli_nama,
      Tujuan: t.tujuan,
      'Gross_ton': t.gross_ton,
      'Tare_ton': t.tare_ton,
      'Netto_ton': t.netto_ton,
      Catatan: t.notes || ''
    }))

    if (exportToCSV(exportData, `Produksi_${currentPeriod.bulan}_${currentPeriod.tahun}.csv`)) {
      toast({
        title: "Export berhasil",
        description: "Data produksi berhasil diekspor ke CSV"
      })
    }
  }

  // Calculate daily summaries
  const getDailySummaries = (): DailySummary[] => {
    const summaries: { [key: string]: DailySummary } = {}
    
    transactions.forEach(t => {
      if (!summaries[t.tanggal]) {
        summaries[t.tanggal] = {
          tanggal: t.tanggal,
          netto_total_ton: 0,
          transaksi_count: 0
        }
      }
      summaries[t.tanggal].netto_total_ton += t.netto_ton
      summaries[t.tanggal].transaksi_count += 1
    })
    
    return Object.values(summaries).sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  }

  // Calculate period summary
  const getTotalPenjualan = (): number => {
    return transactions.reduce((sum, t) => sum + t.netto_ton, 0) + 
           currentPeriod.adj_plus_ton - 
           currentPeriod.adj_minus_ton + 
           currentPeriod.deposit_opening_ton
  }

  const getTotalHargaPenjualan = (): number => {
    const totalTon = getTotalPenjualan()
    return totalTon * currentPeriod.harga_per_ton_default
  }

  // Get top buyers
  const getTopBuyers = () => {
    const buyerSummary: { [key: string]: { nama: string, total_ton: number, transaksi_count: number } } = {}
    
    transactions.forEach(t => {
      if (!buyerSummary[t.pembeli_nama]) {
        buyerSummary[t.pembeli_nama] = {
          nama: t.pembeli_nama,
          total_ton: 0,
          transaksi_count: 0
        }
      }
      buyerSummary[t.pembeli_nama].total_ton += t.netto_ton
      buyerSummary[t.pembeli_nama].transaksi_count += 1
    })
    
    return Object.values(buyerSummary)
      .sort((a, b) => b.total_ton - a.total_ton)
      .slice(0, 5)
  }

  // Check for outliers (unusual tare weights)
  const getOutliers = () => {
    return transactions.filter(t => t.tare_ton < 9 || t.tare_ton > 15)
  }

  const dailySummaries = getDailySummaries()
  const totalPenjualan = getTotalPenjualan()
  const totalHargaPenjualan = getTotalHargaPenjualan()
  const topBuyers = getTopBuyers()
  const outliers = getOutliers()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Laporan Produksi Batu Bara</h2>
          <p className="text-muted-foreground">
            Kelola transaksi timbangan harian dan laporan produksi dengan import/export Excel
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleImport(file)
                e.target.value = ''
              }
            }}
            className="hidden"
          />
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => generateProductionTemplate()}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Advanced Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Production Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Production Efficiency */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Target vs Actual ({currentPeriod.bulan})</span>
                <span className="text-sm text-muted-foreground">
                  {analytics.efficiency.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(analytics.efficiency.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Actual: {formatNumber(analytics.efficiency.actual)} ton</span>
                <span>Target: {formatNumber(analytics.efficiency.target)} ton</span>
              </div>
            </div>

            {/* Buyer Distribution */}
            <div>
              <h4 className="font-medium mb-3">Top Buyers Volume</h4>
              <div className="space-y-2">
                {analytics.buyerAnalysis.slice(0, 5).map((buyer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{buyer.buyer}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${buyer.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {formatNumber(buyer.volume)} ton
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Buyer Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="buyer-filter">Filter by Buyer</Label>
              <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                <SelectTrigger>
                  <SelectValue placeholder="All Buyers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buyers</SelectItem>
                  {buyers.map(buyer => (
                    <SelectItem key={buyer.id} value={buyer.nama}>
                      {buyer.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSelectedBuyer('all')
                setDateRange({ start: '', end: '' })
              }}
            >
              Reset Filters
            </Button>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Quick Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Buyers:</span>
                  <span className="font-medium">{buyers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Transactions:</span>
                  <span className="font-medium">{getFilteredTransactions().length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtered Volume:</span>
                  <span className="font-medium">
                    {formatNumber(getFilteredTransactions().reduce((sum, t) => sum + t.netto_ton, 0))} ton
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transaksi Harian</TabsTrigger>
          <TabsTrigger value="period">Periode & Harga</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6">
          <div className="space-y-6">
            {/* Form Input */}
            {isFormOpen && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {editingTransaction ? 'Edit Transaksi' : 'Form Input Transaksi Timbangan'}
                  </CardTitle>
                  <CardDescription>
                    Input data timbangan harian. Netto akan dihitung otomatis dari Gross - Tare.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tanggal">Tanggal *</Label>
                      <Input
                        id="tanggal"
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => handleInputChange('tanggal', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nopol">No Polisi *</Label>
                      <Input
                        id="nopol"
                        value={formData.nopol}
                        onChange={(e) => handleInputChange('nopol', e.target.value)}
                        placeholder="B 1234 XYZ"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pembeli_nama">Pembeli *</Label>
                      <Select 
                        value={formData.pembeli_nama} 
                        onValueChange={(value) => handleInputChange('pembeli_nama', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pembeli" />
                        </SelectTrigger>
                        <SelectContent>
                          {buyers.map(buyer => (
                            <SelectItem key={buyer.id} value={buyer.nama}>
                              {buyer.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tujuan">Tujuan *</Label>
                      <Input
                        id="tujuan"
                        value={formData.tujuan}
                        onChange={(e) => handleInputChange('tujuan', e.target.value)}
                        placeholder="Stockpile A / Site B"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gross_ton">Gross (Ton) *</Label>
                      <Input
                        id="gross_ton"
                        type="number"
                        min="0"
                        step="0.001"
                        value={formData.gross_ton}
                        onChange={(e) => handleInputChange('gross_ton', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tare_ton">Tare (Ton) *</Label>
                      <Input
                        id="tare_ton"
                        type="number"
                        min="0"
                        step="0.001"
                        value={formData.tare_ton}
                        onChange={(e) => handleInputChange('tare_ton', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="netto_calculated">Netto (Ton)</Label>
                      <Input
                        id="netto_calculated"
                        value={formatNumber(calculatedNetto)}
                        readOnly
                        className="bg-green-50 font-semibold text-green-800"
                      />
                    </div>
                  </div>

                  {/* Quality Check Warnings */}
                  {formData.tare_ton > 0 && (formData.tare_ton < 9 || formData.tare_ton > 15) && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-800 text-sm">
                        Peringatan: Tare {formatNumber(formData.tare_ton)} ton di luar kisaran normal (9-15 ton)
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Catatan tambahan (opsional)"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
                      <Save className="h-4 w-4 mr-2" />
                      {editingTransaction ? 'Perbarui' : 'Simpan'} Transaksi
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Transaksi Timbangan</CardTitle>
                <CardDescription>
                  Total {transactions.length} transaksi • 
                  Total Netto: {formatNumber(transactions.reduce((sum, t) => sum + t.netto_ton, 0))} ton
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Belum ada data transaksi</p>
                    <Button onClick={() => setIsFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Transaksi Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{transaction.nopol}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.tanggal).toLocaleDateString('id-ID')} • {transaction.pembeli_nama}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-2xl text-green-600">
                                {formatNumber(transaction.netto_ton)} ton
                              </p>
                              <p className="text-sm text-muted-foreground">Netto</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="font-medium">Tujuan:</span>
                              <p className="text-muted-foreground">{transaction.tujuan}</p>
                            </div>
                            <div>
                              <span className="font-medium">Gross:</span>
                              <p className="text-muted-foreground">{formatNumber(transaction.gross_ton)} ton</p>
                            </div>
                            <div>
                              <span className="font-medium">Tare:</span>
                              <p className={`${(transaction.tare_ton < 9 || transaction.tare_ton > 15) ? 'text-yellow-600 font-semibold' : 'text-muted-foreground'}`}>
                                {formatNumber(transaction.tare_ton)} ton
                                {(transaction.tare_ton < 9 || transaction.tare_ton > 15) && (
                                  <AlertTriangle className="inline h-4 w-4 ml-1" />
                                )}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Netto:</span>
                              <p className="text-green-600 font-semibold">{formatNumber(transaction.netto_ton)} ton</p>
                            </div>
                          </div>

                          {transaction.notes && (
                            <div className="mb-4 p-2 bg-gray-50 rounded text-sm">
                              <span className="font-medium">Catatan:</span> {transaction.notes}
                            </div>
                          )}

                          <div className="flex gap-2 pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="period" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Periode & Pengaturan Harga
              </CardTitle>
              <CardDescription>
                Kelola periode produksi, harga per ton, dan penyesuaian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Periode Produksi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bulan</Label>
                        <Input value={currentPeriod.bulan} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Tahun</Label>
                        <Input value={currentPeriod.tahun} readOnly />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tanggal Mulai</Label>
                        <Input
                          type="date"
                          value={currentPeriod.start_date}
                          onChange={(e) => setCurrentPeriod(prev => ({ ...prev, start_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tanggal Selesai</Label>
                        <Input
                          type="date"
                          value={currentPeriod.end_date}
                          onChange={(e) => setCurrentPeriod(prev => ({ ...prev, end_date: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Harga & Penyesuaian</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Harga per Ton Default (Rp)</Label>
                      <Input
                        type="number"
                        value={currentPeriod.harga_per_ton_default}
                        onChange={(e) => setCurrentPeriod(prev => ({ 
                          ...prev, 
                          harga_per_ton_default: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deposit/Opening Stock (Ton)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={currentPeriod.deposit_opening_ton}
                        onChange={(e) => setCurrentPeriod(prev => ({ 
                          ...prev, 
                          deposit_opening_ton: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Penyesuaian Plus (Ton)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={currentPeriod.adj_plus_ton}
                          onChange={(e) => setCurrentPeriod(prev => ({ 
                            ...prev, 
                            adj_plus_ton: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Penyesuaian Minus (Ton)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={currentPeriod.adj_minus_ton}
                          onChange={(e) => setCurrentPeriod(prev => ({ 
                            ...prev, 
                            adj_minus_ton: parseFloat(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Calculation */}
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">Ringkasan Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-green-600">Total Penjualan</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatNumber(totalPenjualan)} ton
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-green-600">Harga per Ton</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(currentPeriod.harga_per_ton_default)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-green-600">Total Harga Penjualan</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(totalHargaPenjualan)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ringkasan Harian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailySummaries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Belum ada data</p>
                  ) : (
                    dailySummaries.map((summary) => (
                      <div key={summary.tanggal} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div>
                          <p className="font-medium">
                            {new Date(summary.tanggal).toLocaleDateString('id-ID')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {summary.transaksi_count} transaksi
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatNumber(summary.netto_total_ton)} ton
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Buyers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Pembeli
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topBuyers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Belum ada data</p>
                  ) : (
                    topBuyers.map((buyer, index) => (
                      <div key={buyer.nama} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <div>
                          <p className="font-medium">#{index + 1} {buyer.nama}</p>
                          <p className="text-sm text-muted-foreground">
                            {buyer.transaksi_count} transaksi
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">
                            {formatNumber(buyer.total_ton)} ton
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quality Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Peringatan Kualitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {outliers.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Semua data dalam batas normal</span>
                    </div>
                  ) : (
                    outliers.map((transaction) => (
                      <div key={transaction.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="font-medium text-yellow-800">
                          {transaction.nopol} - Tare tidak normal
                        </p>
                        <p className="text-sm text-yellow-600">
                          Tare: {formatNumber(transaction.tare_ton)} ton (normal: 9-15 ton)
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Production Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Statistik Produksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Transaksi:</span>
                    <span className="font-semibold">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rata-rata Netto per Transaksi:</span>
                    <span className="font-semibold">
                      {transactions.length > 0 
                        ? formatNumber(transactions.reduce((sum, t) => sum + t.netto_ton, 0) / transactions.length)
                        : '0'} ton
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rata-rata Gross:</span>
                    <span className="font-semibold">
                      {transactions.length > 0 
                        ? formatNumber(transactions.reduce((sum, t) => sum + t.gross_ton, 0) / transactions.length)
                        : '0'} ton
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rata-rata Tare:</span>
                    <span className="font-semibold">
                      {transactions.length > 0 
                        ? formatNumber(transactions.reduce((sum, t) => sum + t.tare_ton, 0) / transactions.length)
                        : '0'} ton
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Unduh laporan dalam berbagai format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Detail ke Excel
                </Button>
                <Button className="w-full" variant="outline" onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export Rekap ke PDF
                </Button>
                <Button className="w-full" variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export ke CSV
                </Button>
                <Button className="w-full" variant="outline" onClick={() => generateProductionTemplate()}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Template Import Excel
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Periode</CardTitle>
                <CardDescription>
                  {currentPeriod.bulan} {currentPeriod.tahun}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Transaksi:</span>
                    <span className="font-semibold">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Produksi:</span>
                    <span className="font-semibold">
                      {formatNumber(transactions.reduce((sum, t) => sum + t.netto_ton, 0))} ton
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Penjualan:</span>
                    <span className="font-semibold text-green-600">
                      {formatNumber(totalPenjualan)} ton
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Nilai:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(totalHargaPenjualan)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Pembeli:</span>
                    <span className="font-semibold">{topBuyers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Outlier:</span>
                    <span className={`font-semibold ${outliers.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {outliers.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
