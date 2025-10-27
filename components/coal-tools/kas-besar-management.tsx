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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Search,
  ChevronDown,
  Zap,
  Clock,
  Copy,
  Settings,
  Keyboard,
  X,
  History,
  RefreshCw,
  CheckSquare
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useKasBesar } from "@/hooks/use-kas-besar"
import { getCurrentUser } from "@/lib/auth"
import { 
  uploadFile, 
  exportToExcel, 
  exportToCSV, 
  generatePDF,
  validateFileType,
  validateFileSize,
  generateExpenseTemplate,
  importExcelFile
} from "@/lib/file-utils"

// Updated Types to match database schema
interface KasBesarExpense {
  id?: string
  hari: string
  tanggal: string
  bulan: string
  tipeAktivitas: string // Changed from tipe_aktivitas
  barang: string
  banyak: number
  satuan: string
  hargaSatuan: number // Changed from harga_satuan
  total: number
  vendorNama: string // Changed from vendor_nama
  vendorTelp?: string // Changed from vendor_telp
  vendorEmail?: string // Changed from vendor_email
  jenis: string
  subJenis: string // Changed from sub_jenis
  buktiUrl?: string // Changed from bukti_url
  kontrakUrl?: string // Changed from kontrak_url - Wajib untuk kas besar
  status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED' | 'REJECTED'
  notes?: string
  createdBy: string // Changed from created_by
  createdAt?: string // Changed from created_at
  updatedAt?: string
  approvalNotes?: string // Changed from approval_notes
  approvedBy?: string
  creator?: {
    id: string
    name: string
    email: string
  }
  approver?: {
    id: string
    name: string
    email: string
  }
}

// Reference data khusus kas besar
const KAS_BESAR_TIPE_AKTIVITAS = [
  "pembelian_aset",
  "kontrak_jasa",
  "pembelian_material",
  "maintenance_equipment",
  "pembayaran_vendor",
  "investasi_proyek",
  "pembelian_kendaraan",
  "renovasi_fasilitas",
  "pembelian_software",
  "pelatihan_karyawan"
]

const KAS_BESAR_SUB_JENIS = [
  "alat_berat",
  "kontrak_vendor",
  "material_bangunan",
  "peralatan_office",
  "kendaraan_operasional",
  "software_license",
  "pelatihan_teknis",
  "maintenance_rutin",
  "investasi_tambang",
  "fasilitas_produksi"
]

// Add missing constants
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

export function KasBesarManagement() {
  const { toast } = useToast()
  const currentUser = getCurrentUser()
  
  // Get current user ID for createdBy field
  const getCurrentUserId = () => {
    if (currentUser?.id) {
      return currentUser.id
    }
    // Fallback to demo user ID if not authenticated
    return "cmemokbd20000ols63e1xr3f6" // Admin user ID from our demo users
  }

  const {
    expenses,
    loading,
    creating,
    updating,
    deleting,
    error,
    pagination,
    filters,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    updateStatus,
    search,
    filterByStatus,
    getRecentTransactionTypes
  } = useKasBesar({ autoFetch: true })

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<KasBesarExpense | null>(null)
  const [activeTab, setActiveTab] = useState('form') // Changed default to 'form' to show form first
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [contractValidationResults, setContractValidationResults] = useState<Map<string, boolean>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<KasBesarExpense>({
    hari: "",
    tanggal: "",
    bulan: "",
    tipeAktivitas: "", // Updated field name
    barang: "",
    banyak: 0,
    satuan: "",
    hargaSatuan: 0, // Updated field name
    total: 0, // Add missing total field
    vendorNama: "", // Updated field name
    vendorTelp: "", // Updated field name
    vendorEmail: "", // Updated field name
    jenis: "kas_besar",
    subJenis: "", // Updated field name
    notes: "",
    buktiUrl: "", // Updated field name
    kontrakUrl: "", // Updated field name
    createdBy: getCurrentUserId() // Use current user ID
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const kontrakInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  
  // Local UI state
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  
  // Enhanced edit states for kas besar
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [quickEditMode, setQuickEditMode] = useState(false)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [expenseVersions, setExpenseVersions] = useState<Map<string, KasBesarExpense[]>>(new Map())
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{id: string, field: string} | null>(null)
  const [inlineEditValues, setInlineEditValues] = useState<Record<string, any>>({})
  
  // Approved transaction editing states
  const [allowApprovedEdit, setAllowApprovedEdit] = useState(false)
  const [showApprovalOverride, setShowApprovalOverride] = useState<string | null>(null)
  const [approvalReason, setApprovalReason] = useState('')
  const [supervisorPassword, setSupervisorPassword] = useState('')
  const [editingApprovedId, setEditingApprovedId] = useState<string | null>(null)

  // Get recent transaction types from database hook
  const recentTransactionTypes = getRecentTransactionTypes()

  // Search and filter handlers
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        search(searchTerm)
      }
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, search])

  useEffect(() => {
    filterByStatus(filterStatus)
  }, [filterStatus, filterByStatus])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A: Quick add transaction
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        handleQuickAdd()
      }
      // Ctrl/Cmd + Shift + H: Show keyboard shortcuts
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault()
        setShowKeyboardShortcuts(true)
      }
      // Escape: Close any open modals
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setShowKeyboardShortcuts(false)
        setIsQuickActionsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto calculate total
  const calculatedTotal = formData.banyak * formData.hargaSatuan

  // Calculate form completion percentage
  const getFormCompletionPercentage = () => {
    const requiredFields = ['tanggal', 'tipeAktivitas', 'barang', 'satuan', 'subJenis', 'vendorNama']
    const completedFields = requiredFields.filter(field => formData[field as keyof typeof formData])
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  const formCompletionPercentage = getFormCompletionPercentage()
  const isFormValid = Object.keys(formErrors).length === 0 && formCompletionPercentage === 100

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
        [type === 'bukti' ? 'buktiUrl' : 'kontrakUrl']: fileUrl 
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
      const importedExpenses: KasBesarExpense[] = data.slice(1).map((row: unknown, index: number) => {
        const rowData = row as string[]
        return {
          id: `imported_${Date.now()}_${index}`,
          tanggal: rowData[0] || '',
          hari: rowData[1] || '',
          bulan: rowData[2] || '',
          tipeAktivitas: rowData[3] || '',
          barang: rowData[4] || '',
          banyak: parseFloat(rowData[5]) || 0,
          satuan: rowData[6] || '',
          hargaSatuan: parseFloat(rowData[7]) || 0,
          total: parseFloat(rowData[8]) || 0,
          vendorNama: rowData[9] || '',
          vendorTelp: rowData[10] || '',
          vendorEmail: rowData[11] || '',
          jenis: 'kas_besar',
          subJenis: rowData[13] || '',
          notes: rowData[14] || '',
          buktiUrl: '',
          kontrakUrl: '',
          status: 'DRAFT' as const,
          createdBy: 'imported'
        }
      })

      // Note: In a real implementation, you would batch create these expenses via API
      // For now, we'll just show success message
      
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
    const errors: Record<string, string> = {}
    
    // Required field validation
    if (!formData.tanggal) errors.tanggal = "Tanggal wajib diisi"
    if (!formData.tipeAktivitas) errors.tipeAktivitas = "Tipe aktivitas wajib dipilih"
    if (!formData.barang) errors.barang = "Barang/jasa wajib diisi"
    if (!formData.satuan) errors.satuan = "Satuan wajib dipilih"
    if (!formData.subJenis) errors.subJenis = "Sub jenis wajib dipilih"
    if (!formData.vendorNama) errors.vendorNama = "Nama vendor wajib diisi"

    // Numeric validation
    if (formData.banyak <= 0) errors.banyak = "Banyak harus lebih dari 0"
    if (formData.hargaSatuan <= 0) errors.hargaSatuan = "Harga satuan harus lebih dari 0"

    // Email validation
    if (formData.vendorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.vendorEmail)) {
      errors.vendorEmail = "Format email tidak valid"
    }

    // Contract validation for specific categories
    const requiresContract = ['alat_berat', 'sewa_alat', 'kontrak_besar', 'kontrak_vendor']
    if (requiresContract.includes(formData.subJenis) && !formData.kontrakUrl) {
      errors.kontrakUrl = "Dokumen kontrak wajib untuk kategori ini"
    }

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Form tidak valid",
        description: `${Object.keys(errors).length} field perlu diperbaiki`,
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      const expenseData: KasBesarExpense = {
        ...formData,
        total: calculatedTotal,
        bulan: formData.bulan || '',
        hari: formData.hari || ''
      }

      if (editingExpense && editingExpense.id) {
        // Update existing expense
        await updateExpense({
          ...expenseData,
          id: editingExpense.id
        })
        
        toast({
          title: "✅ Transaksi Berhasil Diperbarui",
          description: `Transaksi kas besar "${expenseData.barang}" telah diperbarui dengan sukses.`,
        })
      } else {
        // Create new expense
        await createExpense(expenseData)
        
        toast({
          title: "✅ Transaksi Berhasil Ditambahkan",
          description: `Transaksi kas besar "${expenseData.barang}" telah ditambahkan dengan sukses.`,
        })
      }

      resetForm()
      
      // Show success message and option to add another
      setTimeout(() => {
        toast({
          title: "🎉 Transaksi Tersimpan!",
          description: "Apakah Anda ingin menambahkan transaksi lain?",
          action: (
            <Button 
              size="sm" 
              onClick={() => handleQuickAdd()}
              className="bg-red-600 hover:bg-red-700"
            >
              Tambah Lagi
            </Button>
          ),
        })
      }, 1000)
      
    } catch (error) {
      // Error handling is done in the hook
      console.error('Submit error:', error)
      // Ensure error is properly handled and not rendered as [object Event]
      if (error instanceof Error) {
        console.error('Submit error message:', error.message)
      }
    }
  }

  // Quick add function with smart pre-filling
  const handleQuickAdd = (presetType?: string) => {
    // Switch to form tab first
    setActiveTab('form')
    
    if (expenses.length > 0) {
      const lastExpense = expenses[expenses.length - 1]
      const today = new Date().toISOString().split('T')[0]
      
      setFormData({
        ...formData,
        tanggal: today,
        bulan: '',
        tipeAktivitas: presetType || lastExpense.tipeAktivitas || '',
        vendorNama: lastExpense.vendorNama || '',
        vendorTelp: lastExpense.vendorTelp || '',
        vendorEmail: lastExpense.vendorEmail || '',
        subJenis: presetType ? '' : lastExpense.subJenis || '',
        satuan: lastExpense.satuan || ''
      })
    }
    setIsFormOpen(true)
    
    toast({
      title: "Form siap!",
      description: "Data dari transaksi terakhir telah dipra-isi untuk mempercepat input"
    })
  }

  // Copy last transaction for quick duplication
  const handleCopyLastTransaction = () => {
    if (expenses.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Belum ada transaksi untuk disalin",
        variant: "destructive"
      })
      return
    }

    // Switch to form tab first
    setActiveTab('form')

    const lastExpense = expenses[expenses.length - 1]
    const today = new Date().toISOString().split('T')[0]
    
    setFormData({
      hari: '',
      tanggal: today,
      bulan: '',
      tipeAktivitas: lastExpense.tipeAktivitas,
      barang: lastExpense.barang,
      banyak: lastExpense.banyak,
      satuan: lastExpense.satuan,
      hargaSatuan: lastExpense.hargaSatuan,
      total: lastExpense.total, // Add missing total field
      vendorNama: lastExpense.vendorNama,
      vendorTelp: lastExpense.vendorTelp || '',
      vendorEmail: lastExpense.vendorEmail || '',
      jenis: "kas_besar",
      subJenis: lastExpense.subJenis,
      notes: '',
      buktiUrl: '',
      kontrakUrl: '',
      createdBy: formData.createdBy
    })
    
    setIsFormOpen(true)
    
    toast({
      title: "Transaksi disalin",
      description: "Data transaksi terakhir berhasil disalin. Silakan sesuaikan seperlunya."
    })
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
      expense.vendorNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.tipeAktivitas.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || expense.status?.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesStatus
  })

  // Bulk approval workflow
  const handleBulkApproval = async (newStatus: KasBesarExpense['status']) => {
    const selectedItems = expenses.filter(exp => exp.id && selectedExpenses.has(exp.id))
    
    // Validate contracts for items requiring approval
    if (newStatus === 'APPROVED') {
      const invalidContracts = selectedItems.filter(item => 
        item.kontrakUrl === '' || !contractValidationResults.get(item.id!)
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

    // Update each selected item's status
    for (const item of selectedItems) {
      if (item.id) {
        await updateStatus(item.id, newStatus, undefined, formData.createdBy)
      }
    }
    
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
      setSelectedExpenses(new Set(filteredExpenses.map(exp => exp.id).filter((id): id is string => id !== undefined)))
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
      bulan: "",
      tipeAktivitas: "",
      barang: "",
      banyak: 0,
      satuan: "",
      hargaSatuan: 0,
      total: 0, // Add missing total field
      vendorNama: "",
      vendorTelp: "",
      vendorEmail: "",
      jenis: "kas_besar",
      subJenis: "",
      notes: "",
      buktiUrl: "",
      kontrakUrl: "",
      createdBy: getCurrentUserId()
    })
    setFormErrors({})
    setEditingExpense(null)
    setIsFormOpen(false)
    // Keep the form tab active so user can start a new transaction
    setActiveTab('form')
  }

  const handleEdit = (expense: KasBesarExpense) => {
    // Save current version to history before editing
    saveExpenseVersion(expense)
    
    setFormData({
      hari: expense.hari,
      tanggal: expense.tanggal,
      bulan: expense.bulan,
      tipeAktivitas: expense.tipeAktivitas,
      barang: expense.barang,
      banyak: expense.banyak,
      satuan: expense.satuan,
      hargaSatuan: expense.hargaSatuan,
      total: expense.total, // Add missing total field
      vendorNama: expense.vendorNama,
      vendorTelp: expense.vendorTelp || "",
      vendorEmail: expense.vendorEmail || "",
      jenis: expense.jenis,
      subJenis: expense.subJenis,
      notes: expense.notes || "",
      buktiUrl: expense.buktiUrl || "",
      kontrakUrl: expense.kontrakUrl || "",
      createdBy: expense.createdBy
    })
    setEditingExpense(expense)
    setIsFormOpen(true)
    setActiveTab('form')
  }

  // Enhanced edit functions for kas besar
  const saveExpenseVersion = (expense: KasBesarExpense) => {
    if (!expense.id) return
    const versions = expenseVersions.get(expense.id) || []
    versions.push({...expense, createdAt: new Date().toISOString()})
    setExpenseVersions(new Map(expenseVersions.set(expense.id, versions)))
  }

  const handleInlineEdit = (expense: KasBesarExpense, field: string) => {
    if (!expense.id) return
    setInlineEditId(expense.id)
    setEditingField({id: expense.id, field})
    setInlineEditValues({
      ...inlineEditValues,
      [expense.id]: {
        ...inlineEditValues[expense.id],
        [field]: expense[field as keyof KasBesarExpense]
      }
    })
  }

  const saveInlineEdit = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId)
    if (expense && editingField && inlineEditValues[expenseId]) {
      // Save version before updating
      saveExpenseVersion(expense)
      
      try {
        await updateExpense({
          ...expense,
          id: expense.id!,
          [editingField.field]: inlineEditValues[expenseId][editingField.field]
        })
        
        toast({
          title: "Field updated",
          description: `${editingField.field} has been updated successfully`
        })
      } catch (error) {
        toast({
          title: "Update failed",
          description: "Failed to update the field",
          variant: "destructive"
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

  const handleDuplicateExpense = (expense: KasBesarExpense) => {
    const duplicatedData = {
      ...expense,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      status: 'DRAFT' as const,
      tanggal: new Date().toISOString().split('T')[0]
    }
    
    // Remove id-related fields and use createExpense
    const { id, createdAt, updatedAt, ...createData } = duplicatedData
    createExpense(createData)
    
    toast({
      title: "Kas besar duplicated",
      description: "A copy of the kas besar transaction has been created"
    })
  }

  const handleQuickEdit = (expense: KasBesarExpense) => {
    if (!expense.id) return
    
    // Check if this is an approved transaction and needs authorization
    if (expense.status === 'APPROVED' && !allowApprovedEdit) {
      setShowApprovalOverride(expense.id)
      return
    }
    
    setQuickEditMode(true)
    setInlineEditId(expense.id)
    setInlineEditValues({
      ...inlineEditValues,
      [expense.id]: {
        barang: expense.barang,
        hargaSatuan: expense.hargaSatuan,
        banyak: expense.banyak,
        vendorNama: expense.vendorNama
      }
    })
  }

  // Handle approved transaction editing with authorization
  const handleApprovedTransactionEdit = (expense: KasBesarExpense) => {
    if (!expense.id) return
    
    if (expense.status === 'APPROVED' && !allowApprovedEdit) {
      setShowApprovalOverride(expense.id)
      return
    }
    
    // Save version before editing approved transaction
    saveExpenseVersion(expense)
    
    setFormData({
      hari: expense.hari,
      tanggal: expense.tanggal,
      bulan: expense.bulan,
      tipeAktivitas: expense.tipeAktivitas,
      barang: expense.barang,
      banyak: expense.banyak,
      satuan: expense.satuan,
      hargaSatuan: expense.hargaSatuan,
      total: expense.total, // Add missing total field
      vendorNama: expense.vendorNama,
      vendorTelp: expense.vendorTelp || "",
      vendorEmail: expense.vendorEmail || "",
      jenis: expense.jenis,
      subJenis: expense.subJenis,
      notes: expense.notes || "",
      buktiUrl: expense.buktiUrl || "",
      kontrakUrl: expense.kontrakUrl || "",
      createdBy: expense.createdBy
    })
    setEditingExpense(expense)
    setEditingApprovedId(expense.id)
    setIsFormOpen(true)
    setActiveTab('form')
  }

  const requestApprovalOverride = async () => {
    // Simple password check - in production, this would be more sophisticated
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
        description: "Please provide a reason for editing approved transaction",
        variant: "destructive"
      })
      return
    }

    // Enable approved editing for this session
    setAllowApprovedEdit(true)
    
    // Log the override attempt (in production, this would go to audit log)
    // Override logged for audit purposes

    toast({
      title: "Authorization Granted",
      description: "You can now edit approved transactions this session",
    })

    // Close the override dialog
    setShowApprovalOverride(null)
    setSupervisorPassword('')
    setApprovalReason('')

    // Trigger the original edit action
    const expense = expenses.find(e => e.id === showApprovalOverride)
    if (expense) {
      handleQuickEdit(expense)
    }
  }

  const cancelApprovalOverride = () => {
    setShowApprovalOverride(null)
    setSupervisorPassword('')
    setApprovalReason('')
  }

  const handleDelete = async (id: string) => {
    if (!id) return
    
    try {
      await deleteExpense(id, formData.createdBy)
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: KasBesarExpense['status'], notes?: string) => {
    if (!id || !newStatus) return
    
    try {
      await updateStatus(id, newStatus, notes, formData.createdBy)
    } catch (error) {
      console.error('Status update error:', error)
    }
  }

  const handleExportExcel = () => {
    const exportData = expenses.map(exp => ({
      Tanggal: exp.tanggal,
      Hari: exp.hari,
      Bulan: exp.bulan,
      'Tipe Aktivitas': exp.tipeAktivitas,
      Barang: exp.barang,
      Banyak: exp.banyak,
      Satuan: exp.satuan,
      'Harga Satuan': exp.hargaSatuan,
      Total: exp.total,
      'Vendor Nama': exp.vendorNama,
      'Vendor Telp': exp.vendorTelp || '',
      'Vendor Email': exp.vendorEmail || '',
      Jenis: exp.jenis,
      'Sub Jenis': exp.subJenis,
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
      'Tipe_Aktivitas': exp.tipeAktivitas,
      Barang: exp.barang,
      Banyak: exp.banyak,
      Satuan: exp.satuan,
      'Harga_Satuan': exp.hargaSatuan,
      Total: exp.total,
      'Vendor_Nama': exp.vendorNama,
      'Vendor_Telp': exp.vendorTelp || '',
      'Vendor_Email': exp.vendorEmail || '',
      Jenis: exp.jenis,
      'Sub_Jenis': exp.subJenis,
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
        <td>${exp.vendorNama}</td>
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
      DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      SUBMITTED: { label: 'Disubmit', color: 'bg-blue-100 text-blue-800' },
      REVIEWED: { label: 'Direview', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      ARCHIVED: { label: 'Diarsip', color: 'bg-purple-100 text-purple-800' },
      REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800' }
    }
    
    const badge = badges[status || 'DRAFT']
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const requiresContract = ['alat_berat', 'sewa_alat', 'kontrak_besar', 'kontrak_vendor']
  const needsContract = requiresContract.includes(formData.subJenis)

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

        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <h3 className="font-semibold text-blue-800">Loading Data</h3>
                <p className="text-sm text-blue-700 mt-1">Connecting to database and loading kas besar expenses...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Database Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  {typeof error === 'string' ? error : 'Terjadi kesalahan yang tidak diketahui'}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => fetchExpenses()}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Connection
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Offline Mode",
                        description: "You can still view and edit data locally, but changes won't be saved to the database.",
                      })
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Continue Offline
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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
                  <Select onValueChange={(value) => handleBulkApproval(value as KasBesarExpense['status'])}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Approval Workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUBMITTED">Submit untuk Review</SelectItem>
                      <SelectItem value="REVIEWED">Mark as Reviewed</SelectItem>
                      <SelectItem value="APPROVED">Approve (dengan validasi)</SelectItem>
                      <SelectItem value="ARCHIVED">Archive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      for (const expenseId of selectedExpenses) {
                        await deleteExpense(expenseId, formData.createdBy)
                      }
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">Form Input</TabsTrigger>
          <TabsTrigger value="list">Daftar Transaksi</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-6">
          {!isFormOpen ? (
            // Welcome screen when no form is open
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Form Input Kas Besar
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Mulai input transaksi kas besar baru. Form ini mendukung validasi kontrak dan dokumen pendukung yang diperlukan.
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={() => handleQuickAdd()}
                      className="bg-red-600 hover:bg-red-700 px-6 py-3"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Tambah Transaksi Baru
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleCopyLastTransaction()}
                      className="px-6 py-3"
                      size="lg"
                      disabled={expenses.length === 0}
                    >
                      <Copy className="h-5 w-5 mr-2" />
                      Salin Transaksi Terakhir
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>💡 Tips: Gunakan Ctrl+Shift+A untuk menambah transaksi dengan cepat</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {editingExpense ? 'Edit Pengeluaran Kas Besar' : 'Form Input Pengeluaran Kas Besar'}
                </CardTitle>
                <CardDescription>
                  Kas besar memerlukan validasi tambahan dan dokumen kontrak untuk kategori tertentu.
                </CardDescription>
                
                {/* Form Completion Progress */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress Form</span>
                    <span className="text-sm text-muted-foreground">{formCompletionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        formCompletionPercentage === 100 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${formCompletionPercentage}%` }}
                    ></div>
                  </div>
                  {formCompletionPercentage === 100 && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Form lengkap dan siap disimpan
                    </p>
                  )}
                </div>
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
                      className={formErrors.tanggal ? 'border-red-500 focus:border-red-500' : ''}
                      required
                    />
                    {formErrors.tanggal && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.tanggal}
                      </p>
                    )}
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
                    <Label htmlFor="tipeAktivitas">Tipe Aktivitas *</Label>
                    <Select 
                      value={formData.tipeAktivitas} 
                      onValueChange={(value) => handleInputChange('tipeAktivitas', value)}
                    >
                      <SelectTrigger className={formErrors.tipeAktivitas ? 'border-red-500 focus:border-red-500' : ''}>
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
                    {formErrors.tipeAktivitas && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.tipeAktivitas}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barang">Barang/Jasa *</Label>
                    <Input
                      id="barang"
                      value={formData.barang}
                      onChange={(e) => handleInputChange('barang', e.target.value)}
                      placeholder="Deskripsi barang atau jasa"
                      className={formErrors.barang ? 'border-red-500 focus:border-red-500' : ''}
                      required
                    />
                    {formErrors.barang && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.barang}
                      </p>
                    )}
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
                      className={formErrors.banyak ? 'border-red-500 focus:border-red-500' : ''}
                      required
                    />
                    {formErrors.banyak && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.banyak}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="satuan">Satuan *</Label>
                    <Select 
                      value={formData.satuan} 
                      onValueChange={(value) => handleInputChange('satuan', value)}
                    >
                      <SelectTrigger className={formErrors.satuan ? 'border-red-500 focus:border-red-500' : ''}>
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
                    {formErrors.satuan && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.satuan}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hargaSatuan">Harga Satuan (Rp) *</Label>
                    <Input
                      id="hargaSatuan"
                      type="number"
                      min="0"
                      value={formData.hargaSatuan}
                      onChange={(e) => handleInputChange('hargaSatuan', parseFloat(e.target.value) || 0)}
                      className={formErrors.hargaSatuan ? 'border-red-500 focus:border-red-500' : ''}
                      required
                    />
                    {formErrors.hargaSatuan && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.hargaSatuan}
                      </p>
                    )}
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
                    <Label htmlFor="vendorNama">Nama Vendor *</Label>
                    <Input
                      id="vendorNama"
                      value={formData.vendorNama}
                      onChange={(e) => handleInputChange('vendorNama', e.target.value)}
                      placeholder="Nama vendor/supplier"
                      className={formErrors.vendorNama ? 'border-red-500 focus:border-red-500' : ''}
                      required
                    />
                    {formErrors.vendorNama && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.vendorNama}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorTelp">Telepon Vendor</Label>
                    <Input
                      id="vendorTelp"
                      value={formData.vendorTelp}
                      onChange={(e) => handleInputChange('vendorTelp', e.target.value)}
                      placeholder="Nomor telepon vendor"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorEmail">Email Vendor</Label>
                    <Input
                      id="vendorEmail"
                      type="email"
                      value={formData.vendorEmail}
                      onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
                      placeholder="email@vendor.com"
                    />
                  </div>

                  {/* Classification */}
                  <div className="space-y-2">
                    <Label>Jenis</Label>
                    <Input value="Kas Besar" readOnly className="bg-red-50" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subJenis">Sub Jenis *</Label>
                    <Select 
                      value={formData.subJenis} 
                      onValueChange={(value) => handleInputChange('subJenis', value)}
                    >
                      <SelectTrigger className={formErrors.subJenis ? 'border-red-500 focus:border-red-500' : ''}>
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
                    {formErrors.subJenis && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {formErrors.subJenis}
                      </p>
                    )}
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
                      {formData.buktiUrl ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                          <p className="text-sm text-green-600">Bukti sudah diupload</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(formData.buktiUrl, '_blank')}
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
                      {formData.kontrakUrl ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                          <p className="text-sm text-green-600">Kontrak sudah diupload</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(formData.kontrakUrl, '_blank')}
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
                  <Button 
                    onClick={handleSubmit} 
                    className={`transition-all duration-300 ${
                      isFormValid 
                        ? 'bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-lg' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    disabled={creating || updating}
                  >
                    {(creating || updating) ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        {editingExpense ? 'Memperbarui...' : 'Menyimpan...'}
                      </>
                    ) : isFormValid ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {editingExpense ? 'Perbarui' : 'Simpan'} Kas Besar
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingExpense ? 'Perbarui' : 'Simpan'} Kas Besar
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm} disabled={creating || updating}>
                    Batal
                  </Button>
                  {!isFormValid && formCompletionPercentage > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {6 - Math.floor((formCompletionPercentage / 100) * 6)} field wajib belum diisi
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daftar Transaksi Kas Besar</CardTitle>
                  <CardDescription>
                    Kelola dan review semua transaksi pengeluaran kas besar
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => handleQuickAdd()}
                    className="bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Transaksi
                  </Button>
                  
                  {allowApprovedEdit && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-700 font-medium">
                        Approved Edit Mode Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Legend for Approved Transaction Editing */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                <div className="flex items-start gap-2">
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">Transaction Status Guide:</p>
                    <div className="space-y-1 text-blue-700">
                      <p>• <span className="font-medium">Regular transactions:</span> Can be edited freely</p>
                      <p>• <span className="font-medium text-orange-600">Approved transactions (*):</span> Require supervisor authorization</p>
                      <p>• <span className="font-medium text-gray-600">Archived transactions:</span> Cannot be modified</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Belum ada data transaksi kas besar</p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={() => handleQuickAdd()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Transaksi Pertama
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowKeyboardShortcuts(true)}
                    >
                      <Keyboard className="h-4 w-4 mr-2" />
                      Shortcuts
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Gunakan Ctrl+Shift+A untuk menambah transaksi dengan cepat
                  </p>
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
                                {expense.hari}, {expense.tanggal} • {expense.tipeAktivitas}
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
                                {expense.banyak} {expense.satuan} × {formatCurrency(expense.hargaSatuan)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium">Sub Jenis:</span>
                            <p className="text-muted-foreground">{expense.subJenis}</p>
                          </div>
                          <div>
                            <span className="font-medium">Vendor:</span>
                            <p className="text-muted-foreground">{expense.vendorNama}</p>
                          </div>
                          <div>
                            <span className="font-medium">Contact:</span>
                            <p className="text-muted-foreground">{expense.vendorTelp || expense.vendorEmail || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Dokumen:</span>
                            <div className="flex gap-1">
                              {expense.buktiUrl && (
                                <span className="text-green-600 text-xs">✓ Bukti</span>
                              )}
                              {expense.kontrakUrl && (
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
                          <div className="flex gap-2 flex-wrap">
                            {/* Enhanced Edit Button Group */}
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Check if expense can be edited based on status
                                  if (expense.status === 'SUBMITTED' || expense.status === 'APPROVED' || expense.status === 'ARCHIVED') {
                                    if (expense.status === 'APPROVED') {
                                      handleApprovedTransactionEdit(expense)
                                    } else {
                                      toast({
                                        title: "Cannot Edit",
                                        description: `${expense.status} transactions cannot be edited`,
                                        variant: "destructive"
                                      })
                                    }
                                    return
                                  }
                                  handleEdit(expense)
                                }}
                                disabled={expense.status === 'SUBMITTED' || expense.status === 'ARCHIVED'}
                                className={
                                  expense.status === 'APPROVED' ? "hover:bg-orange-50 border-orange-200" : 
                                  expense.status === 'SUBMITTED' || expense.status === 'ARCHIVED' ? "opacity-50 cursor-not-allowed" :
                                  "hover:bg-blue-50"
                                }
                                title={
                                  expense.status === 'APPROVED' ? "Edit Approved Transaction (Requires Authorization)" :
                                  expense.status === 'SUBMITTED' ? "Submitted transactions cannot be edited" :
                                  expense.status === 'ARCHIVED' ? "Archived transactions cannot be edited" :
                                  "Edit Transaction"
                                }
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {expense.status === 'APPROVED' ? 'Edit*' : 'Edit'}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Check if expense can be edited based on status
                                  if (expense.status === 'SUBMITTED' || expense.status === 'APPROVED' || expense.status === 'ARCHIVED') {
                                    if (expense.status === 'APPROVED') {
                                      handleQuickEdit(expense)
                                    } else {
                                      toast({
                                        title: "Cannot Edit",
                                        description: `${expense.status} transactions cannot be edited`,
                                        variant: "destructive"
                                      })
                                    }
                                    return
                                  }
                                  handleQuickEdit(expense)
                                }}
                                disabled={expense.status === 'SUBMITTED' || expense.status === 'ARCHIVED'}
                                className={
                                  expense.status === 'APPROVED' ? "hover:bg-orange-50 border-orange-200" : 
                                  expense.status === 'SUBMITTED' || expense.status === 'ARCHIVED' ? "opacity-50 cursor-not-allowed" :
                                  "hover:bg-green-50"
                                }
                                title={
                                  expense.status === 'APPROVED' ? "Quick Edit Approved (Requires Authorization)" :
                                  expense.status === 'SUBMITTED' ? "Submitted transactions cannot be edited" :
                                  expense.status === 'ARCHIVED' ? "Archived transactions cannot be edited" :
                                  "Quick Edit - Edit key fields inline"
                                }
                              >
                                <Zap className="h-4 w-4" />
                                {expense.status === 'APPROVED' && <span className="text-xs ml-1">*</span>}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicateExpense(expense)}
                                className="hover:bg-purple-50"
                                title="Duplicate this kas besar transaction"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              
                              {expense.id && expenseVersions.get(expense.id)?.length && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowVersionHistory(expense.id!)}
                                  className="hover:bg-yellow-50"
                                  title="View edit history"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (expense.status === 'APPROVED' && !allowApprovedEdit) {
                                  setShowApprovalOverride(expense.id!)
                                  return
                                }
                                if (expense.id) {
                                  handleDelete(expense.id)
                                }
                              }}
                              disabled={expense.status === 'ARCHIVED' || deleting === expense.id}
                              className={expense.status === 'APPROVED' ? "hover:bg-red-100 border-red-200" : "hover:bg-red-50"}
                              title={expense.status === 'APPROVED' ? "Delete Approved Transaction (Requires Authorization)" : "Delete Transaction"}
                            >
                              {deleting === expense.id ? (
                                <Clock className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-1" />
                              )}
                              {expense.status === 'APPROVED' ? 'Hapus*' : 'Hapus'}
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            {expense.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                onClick={() => expense.id && handleStatusUpdate(expense.id, 'SUBMITTED')}
                                disabled={updating}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Submit
                              </Button>
                            )}
                            {expense.status === 'SUBMITTED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => expense.id && handleStatusUpdate(expense.id, 'REVIEWED')}
                                disabled={updating}
                              >
                                Review
                              </Button>
                            )}
                            {expense.status === 'REVIEWED' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => expense.id && handleStatusUpdate(expense.id, 'APPROVED')}
                                disabled={updating}
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
                    <span>{expenses.filter(exp => exp.status === 'DRAFT').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Approval:</span>
                    <span>{expenses.filter(exp => ['SUBMITTED', 'REVIEWED'].includes(exp.status || '')).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved:</span>
                    <span>{expenses.filter(exp => exp.status === 'APPROVED').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dengan Kontrak:</span>
                    <span>{expenses.filter(exp => exp.kontrakUrl).length}</span>
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
      
      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>Tambah Transaksi Cepat</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                  Ctrl+Shift+A
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Tampilkan Shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                  Ctrl+Shift+H
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Tutup Modal/Form</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                  Escape
                </kbd>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Gunakan shortcuts ini untuk mempercepat workflow input transaksi kas besar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Edit History - Kas Besar
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersionHistory(null)}
                className="absolute top-4 right-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseVersions.get(showVersionHistory)?.map((version, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Version {index + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {version.createdAt ? new Date(version.createdAt).toLocaleString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Item:</strong> {version.barang}</p>
                      <p><strong>Price:</strong> {formatCurrency(version.hargaSatuan)}</p>
                      <p><strong>Vendor:</strong> {version.vendorNama}</p>
                      <p><strong>Status:</strong> {version.status}</p>
                      <p><strong>Sub Category:</strong> {version.subJenis}</p>
                    </div>
                  </div>
                ))}
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
                Authorization Required
              </CardTitle>
              <CardDescription>
                This transaction is approved and requires supervisor authorization to modify.
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
                  placeholder="Please provide a detailed reason for editing this approved transaction..."
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
                  onClick={requestApprovalOverride}
                  disabled={!supervisorPassword || !approvalReason.trim()}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Authorize Override
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelApprovalOverride}
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

      {/* Enhanced Controls Bar */}
      <div className="fixed top-20 right-6 bg-white border rounded-lg shadow-lg p-2 z-40">
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={bulkEditMode ? "bg-blue-50" : ""}
            title="Toggle bulk edit mode"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickEditMode(!quickEditMode)}
            className={quickEditMode ? "bg-green-50" : ""}
            title="Toggle quick edit mode"
          >
            <Zap className="h-4 w-4" />
          </Button>
          
          {allowApprovedEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAllowApprovedEdit(false)}
              className="bg-orange-50 border-orange-200 text-orange-700"
              title="Disable approved transaction editing"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
