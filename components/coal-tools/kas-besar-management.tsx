"use client"

import { useState, useEffect, useRef } from "react"
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
  Plus, 
  Save, 
  FileText, 
  Upload,
  CheckCircle,
  Trash2,
  Edit,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  DollarSign,
  Search
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
  generateExpenseTemplate,
  importExcelFile
} from "@/lib/file-utils"

// Types (sama dengan kas kecil tapi dengan kategori kas besar)
interface KasBesarExpense {
  id: string
  hari: string
  tanggal: string
  bulan: string
  tipe_aktivitas: string
  barang: string
  banyak: number
  satuan: string
  harga_satuan: number
  total: number
  vendor_nama: string
  vendor_telp: string
  vendor_email: string
  jenis: string
  sub_jenis: string
  bukti_url?: string
  kontrak_url?: string // Wajib untuk kas besar
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'archived'
  notes?: string
  created_by: string
  created_at: string
  approval_notes?: string
}

// Reference data khusus kas besar
const JENIS_OPTIONS = [
  { value: "kas_besar", label: "Kas Besar" }
]

const SUB_JENIS_OPTIONS = [
  { value: "alat_berat", label: "Alat Berat" },
  { value: "sewa_alat", label: "Sewa Alat" },
  { value: "kontrak_besar", label: "Kontrak Besar" },
  { value: "investasi_infrastruktur", label: "Investasi Infrastruktur" },
  { value: "pembelian_aset", label: "Pembelian Aset" },
  { value: "kontrak_vendor", label: "Kontrak Vendor" },
  { value: "pembayaran_kredit", label: "Pembayaran Kredit" },
  { value: "pajak_besar", label: "Pajak & Retribusi Besar" },
  { value: "lain_lain", label: "Lain-lain" }
]

const SATUAN_OPTIONS = [
  { value: "unit", label: "Unit" },
  { value: "bulan", label: "Bulan" },
  { value: "tahun", label: "Tahun" },
  { value: "paket", label: "Paket" },
  { value: "kontrak", label: "Kontrak" },
  { value: "meter", label: "Meter" },
  { value: "m2", label: "Meter Persegi" },
  { value: "lot", label: "Lot" },
  { value: "set", label: "Set" }
]

const TIPE_AKTIVITAS_OPTIONS = [
  { value: "pembelian_aset", label: "Pembelian Aset" },
  { value: "sewa_kontrak", label: "Sewa/Kontrak" },
  { value: "investasi", label: "Investasi" },
  { value: "pembayaran_kredit", label: "Pembayaran Kredit" },
  { value: "pajak_retribusi", label: "Pajak & Retribusi" },
  { value: "kontrak_jasa", label: "Kontrak Jasa" }
]

export function KasBesarManagement() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const kontrakInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  
  const [expenses, setExpenses] = useState<KasBesarExpense[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<KasBesarExpense | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [contractValidationResults, setContractValidationResults] = useState<Map<string, boolean>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    hari: "",
    tanggal: "",
    tipe_aktivitas: "",
    barang: "",
    banyak: 0,
    satuan: "",
    harga_satuan: 0,
    vendor_nama: "",
    vendor_telp: "",
    vendor_email: "",
    jenis: "kas_besar",
    sub_jenis: "",
    notes: "",
    bukti_url: "",
    kontrak_url: ""
  })

  // Load data from localStorage on mount
  useEffect(() => {
    const savedExpenses = loadFromLocalStorage('kas_besar_expenses', [])
    setExpenses(savedExpenses)
  }, [])

  // Save to localStorage whenever expenses change
  useEffect(() => {
    saveToLocalStorage('kas_besar_expenses', expenses)
  }, [expenses])

  // Auto calculate total
  const calculatedTotal = formData.banyak * formData.harga_satuan

  // Auto derive month and day from date
  useEffect(() => {
    if (formData.tanggal) {
      const date = new Date(formData.tanggal)
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ]
      const dayNames = [
        "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
      ]
      const bulan = monthNames[date.getMonth()]
      const hari = dayNames[date.getDay()]
      setFormData(prev => ({ ...prev, bulan, hari }))
    }
  }, [formData.tanggal])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (file: File, type: 'bukti' | 'kontrak') => {
    if (!validateFileType(file, ['image/', 'application/pdf'])) {
      toast({
        title: "Format file tidak valid",
        description: "Hanya file gambar (JPG, PNG) atau PDF yang diizinkan",
        variant: "destructive"
      })
      return
    }

    if (!validateFileSize(file, 10)) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 10MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      const fileUrl = await uploadFile(file)
      setFormData(prev => ({ 
        ...prev, 
        [type === 'bukti' ? 'bukti_url' : 'kontrak_url']: fileUrl 
      }))
      
      toast({
        title: "File berhasil diupload",
        description: `${type === 'bukti' ? 'Bukti transaksi' : 'Dokumen kontrak'} berhasil diupload`
      })
    } catch (error) {
      toast({
        title: "Upload gagal",
        description: "Terjadi kesalahan saat mengupload file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
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

      // Skip header row and convert to expenses
      const importedExpenses: KasBesarExpense[] = data.slice(1).map((row: unknown[], index: number) => {
        const rowData = row as string[]
        return {
          id: `imported_${Date.now()}_${index}`,
          tanggal: rowData[0] || '',
          hari: rowData[1] || '',
          bulan: rowData[2] || '',
          tipe_aktivitas: rowData[3] || '',
          barang: rowData[4] || '',
          banyak: parseFloat(rowData[5]) || 0,
          satuan: rowData[6] || '',
          harga_satuan: parseFloat(rowData[7]) || 0,
          total: parseFloat(rowData[8]) || 0,
          vendor_nama: rowData[9] || '',
          vendor_telp: rowData[10] || '',
          vendor_email: rowData[11] || '',
          jenis: 'kas_besar',
          sub_jenis: rowData[13] || '',
          notes: rowData[14] || '',
          bukti_url: '',
          kontrak_url: '',
          status: 'draft' as const,
          created_by: 'imported',
          created_at: new Date().toISOString()
        }
      })

      setExpenses(prev => [...prev, ...importedExpenses])
      
      toast({
        title: "Import berhasil",
        description: `Berhasil mengimpor ${importedExpenses.length} transaksi kas besar`
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
    const requiredFields = ['tanggal', 'tipe_aktivitas', 'barang', 'satuan', 'sub_jenis']
    const missingFields = requiredFields.filter(field => !formData[field])
    
    if (missingFields.length > 0) {
      toast({
        title: "Form tidak lengkap",
        description: `Mohon lengkapi field: ${missingFields.join(', ')}`,
        variant: "destructive"
      })
      return false
    }

    if (formData.banyak <= 0 || formData.harga_satuan <= 0) {
      toast({
        title: "Nilai tidak valid",
        description: "Banyak dan harga satuan harus lebih dari 0",
        variant: "destructive"
      })
      return false
    }

    // Kas besar memerlukan dokumen kontrak untuk beberapa kategori
    const requiresContract = ['alat_berat', 'sewa_alat', 'kontrak_besar', 'kontrak_vendor']
    if (requiresContract.includes(formData.sub_jenis) && !formData.kontrak_url) {
      toast({
        title: "Dokumen kontrak wajib",
        description: "Kategori ini memerlukan upload dokumen kontrak",
        variant: "destructive"
      })
      return false
    }

    // Validate email format if provided
    if (formData.vendor_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.vendor_email)) {
      toast({
        title: "Email tidak valid",
        description: "Format email vendor tidak benar",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const expense: KasBesarExpense = {
      id: editingExpense ? editingExpense.id : Date.now().toString(),
      ...formData,
      total: calculatedTotal,
      status: 'draft',
      created_by: 'current_user',
      created_at: new Date().toISOString()
    }

    if (editingExpense) {
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? expense : exp))
      toast({
        title: "Berhasil diperbarui",
        description: "Data pengeluaran kas besar berhasil diperbarui"
      })
    } else {
      setExpenses(prev => [...prev, expense])
      toast({
        title: "Berhasil ditambahkan",
        description: "Data pengeluaran kas besar berhasil ditambahkan"
      })
    }

    resetForm()
  }

  // Contract validation function
  const validateContract = async (contractUrl: string): Promise<boolean> => {
    // Simulate contract validation logic
    await new Promise(resolve => setTimeout(resolve, 1000))
    // In real implementation, this would check against contract database
    return contractUrl.includes('valid') || Math.random() > 0.3
  }

  // Enhanced filtering with contract validation
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.tipe_aktivitas.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Bulk approval workflow
  const handleBulkApproval = async (newStatus: KasBesarExpense['status']) => {
    const selectedItems = expenses.filter(exp => selectedExpenses.has(exp.id))
    
    // Validate contracts for items requiring approval
    if (newStatus === 'approved') {
      const invalidContracts = selectedItems.filter(item => 
        item.kontrak_url === '' || !contractValidationResults.get(item.id)
      )
      
      if (invalidContracts.length > 0) {
        toast({
          title: "Approval gagal",
          description: `${invalidContracts.length} item memiliki kontrak yang tidak valid`,
          variant: "destructive"
        })
        return
      }
    }

    const updatedExpenses = expenses.map(expense => 
      selectedExpenses.has(expense.id) 
        ? { ...expense, status: newStatus, updated_at: new Date().toISOString() }
        : expense
    )
    
    setExpenses(updatedExpenses)
    setSelectedExpenses(new Set())
    
    toast({
      title: "Status updated",
      description: `${selectedExpenses.size} expenses updated to ${newStatus}`
    })
  }

  // Contract validation check
  const handleContractValidation = async (expenseId: string, contractUrl: string) => {
    if (!contractUrl) return

    const isValid = await validateContract(contractUrl)
    setContractValidationResults(prev => new Map(prev.set(expenseId, isValid)))
    
    toast({
      title: isValid ? "Kontrak valid" : "Kontrak tidak valid",
      description: isValid ? "Kontrak sudah diverifikasi" : "Kontrak perlu direview ulang",
      variant: isValid ? "default" : "destructive"
    })
  }

  // Auto-submit large expenses for review
  const autoSubmitLargeExpenses = (expense: KasBesarExpense) => {
    if (expense.total >= 50000000) { // 50 million rupiah threshold
      return { ...expense, status: 'submitted' as const }
    }
    return expense
  }

  // Helper functions for selection
  const handleSelectAll = () => {
    if (selectedExpenses.size === filteredExpenses.length) {
      setSelectedExpenses(new Set())
    } else {
      setSelectedExpenses(new Set(filteredExpenses.map(exp => exp.id)))
    }
  }

  const handleSelectExpense = (id: string) => {
    const newSelected = new Set(selectedExpenses)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedExpenses(newSelected)
  }

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const resetForm = () => {
    setFormData({
      hari: "",
      tanggal: "",
      tipe_aktivitas: "",
      barang: "",
      banyak: 0,
      satuan: "",
      harga_satuan: 0,
      vendor_nama: "",
      vendor_telp: "",
      vendor_email: "",
      jenis: "kas_besar",
      sub_jenis: "",
      notes: "",
      bukti_url: "",
      kontrak_url: ""
    })
    setEditingExpense(null)
    setIsFormOpen(false)
  }

  const handleEdit = (expense: KasBesarExpense) => {
    setFormData({
      hari: expense.hari,
      tanggal: expense.tanggal,
      tipe_aktivitas: expense.tipe_aktivitas,
      barang: expense.barang,
      banyak: expense.banyak,
      satuan: expense.satuan,
      harga_satuan: expense.harga_satuan,
      vendor_nama: expense.vendor_nama,
      vendor_telp: expense.vendor_telp,
      vendor_email: expense.vendor_email,
      jenis: expense.jenis,
      sub_jenis: expense.sub_jenis,
      notes: expense.notes || "",
      bukti_url: expense.bukti_url || "",
      kontrak_url: expense.kontrak_url || ""
    })
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id))
    toast({
      title: "Berhasil dihapus",
      description: "Data pengeluaran berhasil dihapus"
    })
  }

  const handleStatusUpdate = (id: string, newStatus: KasBesarExpense['status'], notes?: string) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, status: newStatus, approval_notes: notes } : exp
    ))
    
    const statusLabels = {
      draft: 'Draft',
      submitted: 'Disubmit',
      reviewed: 'Direview',
      approved: 'Disetujui',
      archived: 'Diarsip'
    }
    
    toast({
      title: "Status diperbarui",
      description: `Status berhasil diubah menjadi ${statusLabels[newStatus]}`
    })
  }

  const handleExportExcel = () => {
    const exportData = expenses.map(exp => ({
      Tanggal: exp.tanggal,
      Hari: exp.hari,
      Bulan: exp.bulan,
      'Tipe Aktivitas': exp.tipe_aktivitas,
      Barang: exp.barang,
      Banyak: exp.banyak,
      Satuan: exp.satuan,
      'Harga Satuan': exp.harga_satuan,
      Total: exp.total,
      'Vendor Nama': exp.vendor_nama,
      'Vendor Telp': exp.vendor_telp,
      'Vendor Email': exp.vendor_email,
      Jenis: exp.jenis,
      'Sub Jenis': exp.sub_jenis,
      Status: exp.status,
      Catatan: exp.notes || ''
    }))

    if (exportToExcel(exportData, `Kas_Besar_${new Date().getTime()}.xlsx`, 'Kas Besar')) {
      toast({
        title: "Export berhasil",
        description: "Data kas besar berhasil diekspor ke Excel"
      })
    }
  }

  const handleExportCSV = () => {
    const exportData = expenses.map(exp => ({
      Tanggal: exp.tanggal,
      Hari: exp.hari,
      Bulan: exp.bulan,
      'Tipe_Aktivitas': exp.tipe_aktivitas,
      Barang: exp.barang,
      Banyak: exp.banyak,
      Satuan: exp.satuan,
      'Harga_Satuan': exp.harga_satuan,
      Total: exp.total,
      'Vendor_Nama': exp.vendor_nama,
      'Vendor_Telp': exp.vendor_telp,
      'Vendor_Email': exp.vendor_email,
      Jenis: exp.jenis,
      'Sub_Jenis': exp.sub_jenis,
      Status: exp.status,
      Catatan: exp.notes || ''
    }))

    if (exportToCSV(exportData, `Kas_Besar_${new Date().getTime()}.csv`)) {
      toast({
        title: "Export berhasil",
        description: "Data kas besar berhasil diekspor ke CSV"
      })
    }
  }

  const generateReport = () => {
    const reportData = expenses.map(exp => `
      <tr>
        <td>${exp.tanggal}</td>
        <td>${exp.barang}</td>
        <td>${exp.vendor_nama}</td>
        <td style="text-align: right;">Rp ${exp.total.toLocaleString('id-ID')}</td>
        <td>${exp.status}</td>
      </tr>
    `).join('')

    const htmlContent = `
      <h2>Laporan Kas Besar</h2>
      <p><strong>Total Transaksi:</strong> ${expenses.length}</p>
      <p><strong>Total Pengeluaran:</strong> Rp ${expenses.reduce((sum, exp) => sum + exp.total, 0).toLocaleString('id-ID')}</p>
      
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Barang/Jasa</th>
            <th>Vendor</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${reportData}
        </tbody>
      </table>
    `

    generatePDF(htmlContent, `Laporan_Kas_Besar_${new Date().getTime()}.pdf`)
  }

  const getStatusBadge = (status: KasBesarExpense['status']) => {
    const badges = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      submitted: { label: 'Disubmit', color: 'bg-blue-100 text-blue-800' },
      reviewed: { label: 'Direview', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      archived: { label: 'Diarsip', color: 'bg-purple-100 text-purple-800' }
    }
    
    const badge = badges[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const requiresContract = ['alat_berat', 'sewa_alat', 'kontrak_besar', 'kontrak_vendor']
  const needsContract = requiresContract.includes(formData.sub_jenis)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pengeluaran Kas Besar</h2>
          <p className="text-muted-foreground">
            Kelola pengeluaran kas besar dengan validasi khusus dan dokumen kontrak wajib
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
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
            onClick={() => importInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => generateExpenseTemplate()}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kas Besar
          </Button>
        </div>
      </div>

      {/* Contract Management & Advanced Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pencarian & Validasi Kontrak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Cari Kas Besar</Label>
              <Input
                id="search"
                placeholder="Cari barang, vendor, aktivitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filter-status">Filter Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                }}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
          
          {selectedExpenses.size > 0 && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-900">
                  {selectedExpenses.size} item terpilih untuk approval workflow
                </span>
                <div className="flex gap-2">
                  <Select onValueChange={handleBulkApproval}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Approval Workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submit untuk Review</SelectItem>
                      <SelectItem value="reviewed">Mark as Reviewed</SelectItem>
                      <SelectItem value="approved">Approve (dengan validasi)</SelectItem>
                      <SelectItem value="archived">Archive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      const remainingExpenses = expenses.filter(exp => !selectedExpenses.has(exp.id))
                      setExpenses(remainingExpenses)
                      setSelectedExpenses(new Set())
                      toast({
                        title: "Items deleted", 
                        description: `${selectedExpenses.size} items have been deleted`
                      })
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Contract Validation Summary */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Kontrak Valid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Array.from(contractValidationResults.values()).filter(Boolean).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Kontrak Invalid</p>
                    <p className="text-2xl font-bold text-red-600">
                      {Array.from(contractValidationResults.values()).filter(v => !v).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Kas Besar</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(filteredExpenses.reduce((sum, exp) => sum + exp.total, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">Form Input</TabsTrigger>
          <TabsTrigger value="list">Daftar Transaksi</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-6">
          {isFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {editingExpense ? 'Edit Pengeluaran Kas Besar' : 'Form Input Pengeluaran Kas Besar'}
                </CardTitle>
                <CardDescription>
                  Kas besar memerlukan validasi tambahan dan dokumen kontrak untuk kategori tertentu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date and Time */}
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
                    <Label>Hari</Label>
                    <Input
                      value={formData.hari}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Otomatis dari tanggal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bulan</Label>
                    <Input
                      value={formData.bulan}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Otomatis dari tanggal"
                    />
                  </div>

                  {/* Transaction Details */}
                  <div className="space-y-2">
                    <Label htmlFor="tipe_aktivitas">Tipe Aktivitas *</Label>
                    <Select 
                      value={formData.tipe_aktivitas} 
                      onValueChange={(value) => handleInputChange('tipe_aktivitas', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe aktivitas" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPE_AKTIVITAS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barang">Barang/Jasa *</Label>
                    <Input
                      id="barang"
                      value={formData.barang}
                      onChange={(e) => handleInputChange('barang', e.target.value)}
                      placeholder="Deskripsi barang atau jasa"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banyak">Banyak/Qty *</Label>
                    <Input
                      id="banyak"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.banyak}
                      onChange={(e) => handleInputChange('banyak', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="satuan">Satuan *</Label>
                    <Select 
                      value={formData.satuan} 
                      onValueChange={(value) => handleInputChange('satuan', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih satuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {SATUAN_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="harga_satuan">Harga Satuan (Rp) *</Label>
                    <Input
                      id="harga_satuan"
                      type="number"
                      min="0"
                      value={formData.harga_satuan}
                      onChange={(e) => handleInputChange('harga_satuan', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Pengeluaran</Label>
                    <Input
                      value={formatCurrency(calculatedTotal)}
                      readOnly
                      className="bg-green-50 font-semibold text-green-800"
                    />
                  </div>

                  {/* Vendor Information */}
                  <div className="space-y-2">
                    <Label htmlFor="vendor_nama">Nama Vendor *</Label>
                    <Input
                      id="vendor_nama"
                      value={formData.vendor_nama}
                      onChange={(e) => handleInputChange('vendor_nama', e.target.value)}
                      placeholder="Nama vendor/supplier"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor_telp">Telepon Vendor</Label>
                    <Input
                      id="vendor_telp"
                      value={formData.vendor_telp}
                      onChange={(e) => handleInputChange('vendor_telp', e.target.value)}
                      placeholder="Nomor telepon vendor"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor_email">Email Vendor</Label>
                    <Input
                      id="vendor_email"
                      type="email"
                      value={formData.vendor_email}
                      onChange={(e) => handleInputChange('vendor_email', e.target.value)}
                      placeholder="email@vendor.com"
                    />
                  </div>

                  {/* Classification */}
                  <div className="space-y-2">
                    <Label>Jenis</Label>
                    <Input value="Kas Besar" readOnly className="bg-red-50" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sub_jenis">Sub Jenis *</Label>
                    <Select 
                      value={formData.sub_jenis} 
                      onValueChange={(value) => handleInputChange('sub_jenis', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sub jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUB_JENIS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contract Requirement Alert */}
                {needsContract && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-800 text-sm">
                      Kategori ini memerlukan upload dokumen kontrak yang ditandatangani
                    </span>
                  </div>
                )}

                {/* Notes */}
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

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bukti Transaksi */}
                  <div className="space-y-2">
                    <Label>Bukti Transaksi</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {formData.bukti_url ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                          <p className="text-sm text-green-600">Bukti sudah diupload</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(formData.bukti_url, '_blank')}
                          >
                            Lihat File
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Upload bukti transaksi (foto, scan, atau dokumen)
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(file, 'bukti')
                                e.target.value = ''
                              }
                            }}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Pilih File'}
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Format: JPG, PNG, PDF. Maksimal 10MB
                      </p>
                    </div>
                  </div>

                  {/* Dokumen Kontrak */}
                  <div className="space-y-2">
                    <Label>Dokumen Kontrak {needsContract && '*'}</Label>
                    <div className="border-2 border-dashed border-red-300 rounded-lg p-4 text-center">
                      {formData.kontrak_url ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                          <p className="text-sm text-green-600">Kontrak sudah diupload</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(formData.kontrak_url, '_blank')}
                          >
                            Lihat Kontrak
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <FileText className="h-8 w-8 text-red-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Upload dokumen kontrak bertandatangan
                          </p>
                          <input
                            ref={kontrakInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(file, 'kontrak')
                                e.target.value = ''
                              }
                            }}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => kontrakInputRef.current?.click()}
                            disabled={isUploading}
                            className={needsContract ? 'border-red-300 text-red-600' : ''}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Pilih Kontrak'}
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Format: PDF, DOC, DOCX. Maksimal 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">
                    <Save className="h-4 w-4 mr-2" />
                    {editingExpense ? 'Perbarui' : 'Simpan'} Kas Besar
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Transaksi Kas Besar</CardTitle>
              <CardDescription>
                Kelola dan review semua transaksi pengeluaran kas besar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Belum ada data transaksi kas besar</p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Transaksi Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <Card key={expense.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-semibold">{expense.barang}</h3>
                              <p className="text-sm text-muted-foreground">
                                {expense.hari}, {expense.tanggal} • {expense.tipe_aktivitas}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(expense.status)}
                            <div className="text-right">
                              <p className="font-semibold text-2xl text-red-600">
                                {formatCurrency(expense.total)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {expense.banyak} {expense.satuan} × {formatCurrency(expense.harga_satuan)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium">Sub Jenis:</span>
                            <p className="text-muted-foreground">{expense.sub_jenis}</p>
                          </div>
                          <div>
                            <span className="font-medium">Vendor:</span>
                            <p className="text-muted-foreground">{expense.vendor_nama}</p>
                          </div>
                          <div>
                            <span className="font-medium">Contact:</span>
                            <p className="text-muted-foreground">{expense.vendor_telp || expense.vendor_email || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Dokumen:</span>
                            <div className="flex gap-1">
                              {expense.bukti_url && (
                                <span className="text-green-600 text-xs">✓ Bukti</span>
                              )}
                              {expense.kontrak_url && (
                                <span className="text-blue-600 text-xs">✓ Kontrak</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {expense.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium">Catatan:</span> {expense.notes}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(expense)}
                              disabled={expense.status === 'approved' || expense.status === 'archived'}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                              disabled={expense.status === 'approved' || expense.status === 'archived'}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Hapus
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            {expense.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(expense.id, 'submitted')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Submit
                              </Button>
                            )}
                            {expense.status === 'submitted' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(expense.id, 'reviewed')}
                              >
                                Review
                              </Button>
                            )}
                            {expense.status === 'reviewed' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleStatusUpdate(expense.id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
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

        <TabsContent value="reports" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Kas Besar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Transaksi:</span>
                    <span className="font-semibold">{expenses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Pengeluaran:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(expenses.reduce((sum, exp) => sum + exp.total, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Draft:</span>
                    <span>{expenses.filter(exp => exp.status === 'draft').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Approval:</span>
                    <span>{expenses.filter(exp => ['submitted', 'reviewed'].includes(exp.status)).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved:</span>
                    <span>{expenses.filter(exp => exp.status === 'approved').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dengan Kontrak:</span>
                    <span>{expenses.filter(exp => exp.kontrak_url).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Laporan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full" onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export ke Excel
                  </Button>
                  <Button className="w-full" variant="outline" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export ke CSV
                  </Button>
                  <Button className="w-full" variant="outline" onClick={generateReport}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Laporan PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
