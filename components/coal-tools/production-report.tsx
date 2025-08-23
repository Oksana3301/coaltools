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
  Users,
  X,
  Copy,
  History,
  RefreshCw,
  Settings,
  Zap,
  Clock,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProductionReports } from "@/hooks/use-production-reports"
import type { ProductionReport, Buyer } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth"
import { 
  uploadFile, 
  exportToExcel, 
  exportToCSV, 
  generatePDF,
  validateFileType,
  validateFileSize,
  generateProductionTemplate,
  importExcelFile
} from "@/lib/file-utils"

// Types
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

export function ProductionReport() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Use the production reports hook
  const {
    productionReports,
    buyers,
    loading,
    error,
    createProductionReport,
    updateProductionReport,
    deleteProductionReport,
    updateProductionReportStatus,
    createBuyer,
    updateBuyer: updateBuyerFromHook,
    deleteBuyer
  } = useProductionReports()

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
  const [editingTransaction, setEditingTransaction] = useState<ProductionReport | null>(null)
  const [formData, setFormData] = useState({
    tanggal: '',
    nopol: '',
    pembeli_nama: '',
    tujuan: '',
    gross_ton: 0,
    tare_ton: 0,
    notes: ''
  })

  // Enhanced edit states for production report
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [quickEditMode, setQuickEditMode] = useState(false)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [transactionVersions, setTransactionVersions] = useState<Map<string, ProductionReport[]>>(new Map())
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{id: string, field: string} | null>(null)
  const [inlineEditValues, setInlineEditValues] = useState<Record<string, any>>({})
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  
  // Approved transaction editing states for production
  const [allowApprovedEdit, setAllowApprovedEdit] = useState(false)
  const [showApprovalOverride, setShowApprovalOverride] = useState<string | null>(null)
  const [approvalReason, setApprovalReason] = useState('')
  const [supervisorPassword, setSupervisorPassword] = useState('')

  // Deletion states
  const [deletingTransaction, setDeletingTransaction] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{
    type: 'transaction' | 'buyer'
    id: string
    name: string
  } | null>(null)

  // Calculate analytics whenever production reports change
  useEffect(() => {
    if (productionReports.length > 0) {
      // Calculate analytics based on production reports
      // This will be implemented later
    }
  }, [productionReports])

  // Get buyer analytics
  const getBuyerAnalytics = (buyerName: string) => {
    const buyerTransactions = productionReports.filter(t => t.pembeliNama === buyerName)
    const totalVolume = buyerTransactions.reduce((sum, t) => sum + t.nettoTon, 0)
    const totalValue = buyerTransactions.reduce((sum, t) => {
      const buyer = buyers.find(b => b.nama === buyerName)
      const pricePerTon = buyer?.hargaPerTonDefault || 850000
      return sum + (t.nettoTon * pricePerTon)
    }, 0)
    
    return {
      totalVolume,
      totalValue,
      transactionCount: buyerTransactions.length,
      averageVolume: buyerTransactions.length > 0 ? totalVolume / buyerTransactions.length : 0,
      lastTransaction: buyerTransactions.length > 0 ? buyerTransactions[buyerTransactions.length - 1].tanggal : null
    }
  }

  // Enhanced filtering with date range and buyer
  const getFilteredTransactions = () => {
    return productionReports.filter(transaction => {
      const matchesBuyer = selectedBuyer === 'all' || transaction.pembeliNama === selectedBuyer
      
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
      const importedTransactions = data.slice(1).map((row: unknown, index: number) => {
        const rowData = row as string[]
        return {
          tanggal: rowData[0] || '',
          nopol: rowData[1] || '',
          pembeliNama: rowData[2] || '',
          tujuan: rowData[3] || '',
          grossTon: parseFloat(rowData[4]) || 0,
          tareTon: parseFloat(rowData[5]) || 0,
          nettoTon: parseFloat(rowData[6]) || (parseFloat(rowData[4]) - parseFloat(rowData[5])),
          notes: rowData[7] || '',
          createdBy: getCurrentUser()?.id || 'demo-user',
          status: 'DRAFT' as const
        }
      })

      // Create production reports in database
      for (const transaction of importedTransactions) {
        await createProductionReport(transaction)
      }
      
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
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
    
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

  const handleSubmit = async () => {
    if (!validateForm()) return

    const transactionData = {
      tanggal: formData.tanggal,
      nopol: formData.nopol,
      pembeliNama: formData.pembeli_nama,
      tujuan: formData.tujuan,
      grossTon: formData.gross_ton,
      tareTon: formData.tare_ton,
      nettoTon: calculatedNetto,
      notes: formData.notes,
      createdBy: getCurrentUser()?.id || 'demo-user',
      status: 'DRAFT' as const
    }

    if (editingTransaction) {
      const result = await updateProductionReport({
        id: editingTransaction.id!,
        ...transactionData
      })
      
      if (result.success) {
        toast({
          title: "Berhasil diperbarui",
          description: "Data transaksi berhasil diperbarui"
        })
      }
    } else {
      const result = await createProductionReport(transactionData)
      
      if (result.success) {
        toast({
          title: "Berhasil ditambahkan",
          description: "Data transaksi berhasil ditambahkan"
        })
      }
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

  const handleEdit = (transaction: ProductionReport) => {
    setFormData({
      tanggal: transaction.tanggal,
      nopol: transaction.nopol,
      pembeli_nama: transaction.pembeliNama,
      tujuan: transaction.tujuan,
      gross_ton: transaction.grossTon,
      tare_ton: transaction.tareTon,
      notes: transaction.notes || ''
    })
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    const result = await deleteProductionReport(id, false)
    if (result.success) {
      toast({
        title: "Berhasil dihapus",
        description: "Data transaksi berhasil dihapus"
      })
    }
  }

  // Enhanced edit functions for production report
  const saveTransactionVersion = (transaction: ProductionReport) => {
    const versions = transactionVersions.get(transaction.id!) || []
    versions.push({...transaction, createdAt: new Date().toISOString()})
    setTransactionVersions(new Map(transactionVersions.set(transaction.id!, versions)))
  }

  const handleInlineEdit = (transaction: ProductionReport, field: string) => {
    setInlineEditId(transaction.id!)
    setEditingField({id: transaction.id!, field})
    setInlineEditValues({
      ...inlineEditValues,
      [transaction.id!]: {
        ...inlineEditValues[transaction.id!],
        [field]: transaction[field as keyof ProductionReport]
      }
    })
  }

  const saveInlineEdit = async (transactionId: string) => {
    const transaction = productionReports.find(t => t.id === transactionId)
    if (transaction && editingField && inlineEditValues[transactionId]) {
      // Save version before updating
      saveTransactionVersion(transaction)
      
      const result = await updateProductionReport({
        id: transactionId,
        [editingField.field]: inlineEditValues[transactionId][editingField.field]
      })
      
      if (result.success) {
        toast({
          title: "Field updated",
          description: `${editingField.field} has been updated successfully`
        })
      }
    }
    
    setInlineEditId(null)
    setEditingField(null)
  }

  const cancelInlineEdit = () => {
    setInlineEditId(null)
    setEditingField(null)
  }

  const handleDuplicateTransaction = async (transaction: ProductionReport) => {
    const duplicatedTransaction = {
      tanggal: new Date().toISOString().split('T')[0],
      nopol: transaction.nopol,
      pembeliNama: transaction.pembeliNama,
      tujuan: transaction.tujuan,
      grossTon: transaction.grossTon,
      tareTon: transaction.tareTon,
      nettoTon: transaction.nettoTon,
      notes: transaction.notes,
      createdBy: getCurrentUser()?.id || 'demo-user',
      status: 'DRAFT' as const
    }
    
    const result = await createProductionReport(duplicatedTransaction)
    if (result.success) {
      toast({
        title: "Transaction duplicated",
        description: "A copy of the transaction has been created with today's date"
      })
    }
  }

  const handleQuickEdit = (transaction: ProductionReport) => {
    // Check if this is an approved transaction and needs authorization
    if (transaction.status === 'APPROVED' && !allowApprovedEdit) {
      setShowApprovalOverride(transaction.id!)
      return
    }
    
    setQuickEditMode(true)
    setInlineEditId(transaction.id!)
    setInlineEditValues({
      ...inlineEditValues,
      [transaction.id!]: {
        grossTon: transaction.grossTon,
        tareTon: transaction.tareTon,
        pembeliNama: transaction.pembeliNama,
        nopol: transaction.nopol
      }
    })
  }

  // Handle approved transaction editing with authorization for production
  const handleApprovedTransactionEdit = (transaction: ProductionReport) => {
    if (transaction.status === 'APPROVED' && !allowApprovedEdit) {
      setShowApprovalOverride(transaction.id!)
      return
    }
    
    // Save version before editing approved transaction
    saveTransactionVersion(transaction)
    
    setFormData({
      tanggal: transaction.tanggal,
      nopol: transaction.nopol,
      pembeli_nama: transaction.pembeliNama,
      tujuan: transaction.tujuan,
      gross_ton: transaction.grossTon,
      tare_ton: transaction.tareTon,
      notes: transaction.notes || ''
    })
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  const requestProductionApprovalOverride = async () => {
    // Simple password check - same as other components
    const validPasswords = ['supervisor123', 'admin456', 'override789']
    
    if (!validPasswords.includes(supervisorPassword)) {
      toast({
        title: "Invalid Authorization",
        description: "Incorrect supervisor password",
        variant: "destructive"
      })
      return
    }

    if (!approvalReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for editing approved production data",
        variant: "destructive"
      })
      return
    }

    // Enable approved editing for this session
    setAllowApprovedEdit(true)
    
    // Log the override attempt
    console.log('Production Approval Override:', {
      transactionId: showApprovalOverride,
      reason: approvalReason,
      timestamp: new Date().toISOString(),
      user: 'current_user'
    })

    toast({
      title: "Authorization Granted",
      description: "You can now edit approved production data this session",
    })

    // Close the override dialog
    setShowApprovalOverride(null)
    setSupervisorPassword('')
    setApprovalReason('')

    // Trigger the original edit action
    const transaction = productionReports.find(t => t.id === showApprovalOverride)
    if (transaction) {
      handleQuickEdit(transaction)
    }
  }

  const cancelProductionApprovalOverride = () => {
    setShowApprovalOverride(null)
    setSupervisorPassword('')
    setApprovalReason('')
  }

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTransactions(newSelected)
  }

  const handleBulkEdit = async (field: string, value: any) => {
    // Update selected transactions in database
    for (const transactionId of selectedTransactions) {
      const transaction = productionReports.find(t => t.id === transactionId)
      if (transaction) {
        saveTransactionVersion(transaction)
        await updateProductionReport({
          id: transactionId,
          [field]: value
        })
      }
    }
    
    toast({
      title: "Bulk edit applied",
      description: `${selectedTransactions.size} transactions updated`
    })
    setSelectedTransactions(new Set())
    setBulkEditMode(false)
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

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive"
      })
      return
    }

    handleImport(file)
    event.target.value = '' // Reset input
  }

  const handleExportExcel = () => {
    const exportData = productionReports.map(t => ({
      Tanggal: t.tanggal,
      'No Polisi': t.nopol,
      'Pembeli': t.pembeliNama,
      'Tujuan': t.tujuan,
      'Gross (ton)': t.grossTon,
      'Tare (ton)': t.tareTon,
      'Netto (ton)': t.nettoTon,
      'Catatan': t.notes || ''
    }))

    exportToExcel(exportData, `laporan-produksi-${new Date().toISOString().split('T')[0]}`)
  }

  const handleExportCSV = () => {
    const exportData = productionReports.map(t => ({
      Tanggal: t.tanggal,
      'No_Polisi': t.nopol,
      'Pembeli': t.pembeliNama,
      'Tujuan': t.tujuan,
      'Gross_ton': t.grossTon,
      'Tare_ton': t.tareTon,
      'Netto_ton': t.nettoTon,
      'Catatan': t.notes || ''
    }))

    exportToCSV(exportData, `laporan-produksi-${new Date().toISOString().split('T')[0]}`)
  }

  const exportToPDF = () => {
    const reportData = productionReports.map(t => `
      <tr>
        <td>${t.tanggal}</td>
        <td>${t.nopol}</td>
        <td>${t.pembeliNama}</td>
        <td>${t.tujuan}</td>
        <td>${formatNumber(t.grossTon)}</td>
        <td>${formatNumber(t.tareTon)}</td>
        <td>${formatNumber(t.nettoTon)}</td>
        <td>${t.notes || '-'}</td>
      </tr>
    `).join('')

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
            .summary { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Laporan Produksi Batu Bara</h1>
          <div class="summary">
            <p><strong>Periode:</strong> ${currentPeriod.bulan} ${currentPeriod.tahun}</p>
            <p><strong>Total Transaksi:</strong> ${productionReports.length}</p>
            <p><strong>Total Produksi:</strong> ${formatNumber(productionReports.reduce((sum, t) => sum + t.nettoTon, 0))} ton</p>
            <p><strong>Total Penjualan:</strong> ${formatNumber(getTotalPenjualan())} ton</p>
            <p><strong>Total Nilai:</strong> ${formatCurrency(getTotalHargaPenjualan())}</p>
          </div>
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
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${reportData}
            </tbody>
          </table>
        </body>
      </html>
    `

    generatePDF(htmlContent, `laporan-produksi-${new Date().toISOString().split('T')[0]}`)
  }

  // Calculate daily summaries
  const getDailySummaries = () => {
    const summaries: { [key: string]: DailySummary } = {}
    
    productionReports.forEach(t => {
      if (!summaries[t.tanggal]) {
        summaries[t.tanggal] = {
          tanggal: t.tanggal,
          netto_total_ton: 0,
          transaksi_count: 0
        }
      }
      summaries[t.tanggal].netto_total_ton += t.nettoTon
      summaries[t.tanggal].transaksi_count += 1
    })
    
    return Object.values(summaries).sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  }

  // Calculate period summary
  const getTotalPenjualan = (): number => {
    return productionReports.reduce((sum, t) => sum + t.nettoTon, 0) + 
           currentPeriod.adj_plus_ton - 
           currentPeriod.adj_minus_ton + 
           currentPeriod.deposit_opening_ton
  }

  const getTotalHargaPenjualan = (): number => {
    return getTotalPenjualan() * currentPeriod.harga_per_ton_default
  }

  // Get buyer summary
  const getBuyerSummary = () => {
    const buyerSummary: { [key: string]: { nama: string, total_ton: number, transaksi_count: number } } = {}
    
    productionReports.forEach(t => {
      if (!buyerSummary[t.pembeliNama]) {
        buyerSummary[t.pembeliNama] = {
          nama: t.pembeliNama,
          total_ton: 0,
          transaksi_count: 0
        }
      }
      buyerSummary[t.pembeliNama].total_ton += t.nettoTon
      buyerSummary[t.pembeliNama].transaksi_count += 1
    })
    
    return Object.values(buyerSummary).sort((a, b) => b.total_ton - a.total_ton)
  }

  // Check for outliers (unusual tare weights)
  const getOutliers = () => {
    return productionReports.filter(t => t.tareTon < 9 || t.tareTon > 15)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'SUBMITTED': { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      'REVIEWED': { color: 'bg-yellow-100 text-yellow-800', label: 'Reviewed' },
      'APPROVED': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'ARCHIVED': { color: 'bg-purple-100 text-purple-800', label: 'Archived' },
      'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'submitted': { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      'reviewed': { color: 'bg-yellow-100 text-yellow-800', label: 'Reviewed' },
      'approved': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'archived': { color: 'bg-purple-100 text-purple-800', label: 'Archived' }
    }
    
    const badge = badges[status as keyof typeof badges] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  // Handle deletion with confirmation
  const handleDeleteWithConfirmation = (transaction: ProductionReport) => {
    setShowDeleteDialog({
      type: 'transaction',
      id: transaction.id!,
      name: `Transaksi ${transaction.nopol} - ${transaction.pembeliNama}`
    })
  }

  const handleDeleteConfirmed = async () => {
    if (!showDeleteDialog) return
    
    setDeletingTransaction(showDeleteDialog.id)
    const result = await deleteProductionReport(showDeleteDialog.id, false)
    setDeletingTransaction(null)
    setShowDeleteDialog(null)
    
    if (result.success) {
      toast({
        title: "Berhasil dihapus",
        description: "Data transaksi berhasil dihapus"
      })
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Database Connection Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Produksi</h1>
          <p className="text-gray-600">Kelola data produksi batu bara dan laporan timbangan</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Transaksi
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Daftar Transaksi</TabsTrigger>
          <TabsTrigger value="analytics">Analisis</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="buyer-filter">Pembeli</Label>
                  <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua pembeli" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua pembeli</SelectItem>
                      {buyers.map((buyer) => (
                        <SelectItem key={buyer.id} value={buyer.nama}>
                          {buyer.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start-date">Tanggal Mulai</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Tanggal Akhir</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Daftar Transaksi Timbangan</CardTitle>
                  <CardDescription>
                    Total {productionReports.length} transaksi • 
                    Total Netto: {formatNumber(productionReports.reduce((sum, t) => sum + t.nettoTon, 0))} ton
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button variant="outline" onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading transaksi...</p>
                </div>
              ) : productionReports.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada transaksi</h3>
                  <p className="text-gray-500 mb-4">Mulai dengan menambahkan transaksi timbangan baru</p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Transaksi
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredTransactions().map((transaction) => (
                    <Card key={transaction.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{transaction.nopol}</span>
                              {getStatusBadge(transaction.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Tanggal:</span>
                                <p>{transaction.tanggal}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Pembeli:</span>
                                <p>{transaction.pembeliNama}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Tujuan:</span>
                                <p>{transaction.tujuan}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Netto:</span>
                                <p className="font-medium">{formatNumber(transaction.nettoTon)} ton</p>
                              </div>
                            </div>
                            {transaction.notes && (
                              <div className="mt-2">
                                <span className="text-gray-500 text-sm">Catatan:</span>
                                <p className="text-sm">{transaction.notes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(transaction)}
                              disabled={transaction.status === 'SUBMITTED' || transaction.status === 'ARCHIVED'}
                              title={
                                transaction.status === 'SUBMITTED' ? "Submitted transactions cannot be edited" :
                                transaction.status === 'ARCHIVED' ? "Archived transactions cannot be edited" :
                                "Edit Transaction"
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicateTransaction(transaction)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteWithConfirmation(transaction)}
                              disabled={transaction.status === 'APPROVED' || transaction.status === 'ARCHIVED' || deletingTransaction === transaction.id}
                              className={
                                transaction.status === 'APPROVED' || transaction.status === 'ARCHIVED'
                                  ? "opacity-50 cursor-not-allowed" 
                                  : "hover:bg-red-50 border-red-200"
                              }
                              title={
                                transaction.status === 'APPROVED' ? "Approved transactions cannot be deleted" :
                                transaction.status === 'ARCHIVED' ? "Archived transactions cannot be deleted" :
                                "Delete Transaction"
                              }
                            >
                              {deletingTransaction === transaction.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Summary Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ringkasan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Transaksi:</span>
                  <span className="font-semibold">{productionReports.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Produksi:</span>
                  <span className="font-semibold">
                    {formatNumber(productionReports.reduce((sum, t) => sum + t.nettoTon, 0))} ton
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rata-rata Netto per Transaksi:</span>
                  <span className="font-semibold">
                    {productionReports.length > 0 
                      ? formatNumber(productionReports.reduce((sum, t) => sum + t.nettoTon, 0) / productionReports.length)
                      : '0'} ton
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Analisis Pembeli
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getBuyerSummary().slice(0, 5).map((buyer) => (
                    <div key={buyer.nama} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{buyer.nama}</p>
                        <p className="text-sm text-gray-500">{buyer.transaksi_count} transaksi</p>
                      </div>
                      <span className="font-semibold">{formatNumber(buyer.total_ton)} ton</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Outliers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Outliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getOutliers().slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="text-sm">
                      <p className="font-medium">{transaction.nopol}</p>
                      <p className="text-gray-500">Tare: {formatNumber(transaction.tareTon)} ton</p>
                    </div>
                  ))}
                  {getOutliers().length === 0 && (
                    <p className="text-gray-500 text-sm">Tidak ada outliers</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Periode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="period-month">Bulan</Label>
                    <Select value={currentPeriod.bulan} onValueChange={(value) => setCurrentPeriod(prev => ({ ...prev, bulan: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((month) => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="period-year">Tahun</Label>
                    <Input
                      id="period-year"
                      type="number"
                      value={currentPeriod.tahun}
                      onChange={(e) => setCurrentPeriod(prev => ({ ...prev, tahun: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="default-price">Harga Default per Ton</Label>
                    <Input
                      id="default-price"
                      type="number"
                      value={currentPeriod.harga_per_ton_default}
                      onChange={(e) => setCurrentPeriod(prev => ({ ...prev, harga_per_ton_default: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opening-deposit">Deposit Awal (ton)</Label>
                    <Input
                      id="opening-deposit"
                      type="number"
                      value={currentPeriod.deposit_opening_ton}
                      onChange={(e) => setCurrentPeriod(prev => ({ ...prev, deposit_opening_ton: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="total-production">Total Produksi (ton)</Label>
                    <Input
                      id="total-production"
                      type="number"
                      value={getTotalPenjualan()}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleExportExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Transaction Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggal">Tanggal</Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => handleInputChange('tanggal', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nopol">No Polisi</Label>
                  <Input
                    id="nopol"
                    value={formData.nopol}
                    onChange={(e) => handleInputChange('nopol', e.target.value)}
                    placeholder="B 1234 XYZ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pembeli">Pembeli</Label>
                  <Select value={formData.pembeli_nama} onValueChange={(value) => handleInputChange('pembeli_nama', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pembeli" />
                    </SelectTrigger>
                    <SelectContent>
                      {buyers.map((buyer) => (
                        <SelectItem key={buyer.id} value={buyer.nama}>
                          {buyer.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tujuan">Tujuan</Label>
                  <Input
                    id="tujuan"
                    value={formData.tujuan}
                    onChange={(e) => handleInputChange('tujuan', e.target.value)}
                    placeholder="Stockpile A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gross">Gross (ton)</Label>
                  <Input
                    id="gross"
                    type="number"
                    step="0.001"
                    value={formData.gross_ton}
                    onChange={(e) => handleInputChange('gross_ton', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="tare">Tare (ton)</Label>
                  <Input
                    id="tare"
                    type="number"
                    step="0.001"
                    value={formData.tare_ton}
                    onChange={(e) => handleInputChange('tare_ton', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="netto">Netto (ton)</Label>
                  <Input
                    id="netto"
                    type="number"
                    step="0.001"
                    value={calculatedNetto}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingTransaction ? 'Update' : 'Simpan'}
                </Button>
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approval Override Modal */}
      {showApprovalOverride && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Authorization Required - Production
              </CardTitle>
              <CardDescription>
                This production data is approved and requires supervisor authorization to modify.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supervisor-password">Supervisor Password</Label>
                <Input
                  id="supervisor-password"
                  type="password"
                  value={supervisorPassword}
                  onChange={(e) => setSupervisorPassword(e.target.value)}
                  placeholder="Enter supervisor password"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Demo passwords: supervisor123, admin456, override789
                </p>
              </div>
              
              <div>
                <Label htmlFor="approval-reason">Reason for Modification</Label>
                <Textarea
                  id="approval-reason"
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  placeholder="Please provide a detailed reason for editing this approved production data..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Audit Notice</p>
                    <p>This override will be logged for compliance purposes. Ensure you have proper authorization.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={requestProductionApprovalOverride}
                  disabled={!supervisorPassword || !approvalReason.trim()}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Authorize Override
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelProductionApprovalOverride}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deletion Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Konfirmasi Hapus
              </CardTitle>
              <CardDescription>
                Apakah Anda yakin ingin menghapus {showDeleteDialog.type === 'transaction' ? 'transaksi' : 'pembeli'} ini?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{showDeleteDialog.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {showDeleteDialog.type === 'transaction' 
                      ? 'Transaksi ini akan diarsipkan (soft delete)'
                      : 'Pembeli ini akan dinonaktifkan (soft delete)'
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteConfirmed}
                    disabled={deletingTransaction === showDeleteDialog.id}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {deletingTransaction === showDeleteDialog.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Hapus
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(null)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
