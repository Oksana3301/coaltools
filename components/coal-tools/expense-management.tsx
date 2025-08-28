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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Save, 
  FileText, 
  Upload,
  Eye,
  CheckCircle,
  Trash2,
  Edit,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Search,
  X,
  Copy,
  Clock,
  History,
  Settings,
  RefreshCw,
  Zap,
  CheckSquare,
  MoreHorizontal,
  RotateCcw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useKasKecil } from "@/hooks/use-kas-kecil"
import { apiService, KasKecilExpense } from "@/lib/api"
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

// Types - Using KasKecilExpense from API
type Expense = KasKecilExpense

// Reference data
const JENIS_OPTIONS = [
  { value: "kas_kecil", label: "Kas Kecil" },
  { value: "kas_besar", label: "Kas Besar" }
]

const SUB_JENIS_OPTIONS = [
  { value: "alat_lapangan", label: "Alat Lapangan" },
  { value: "logistik", label: "Logistik" },
  { value: "alat_berat", label: "Alat Berat" },
  { value: "alat_tulis", label: "Alat Tulis" },
  { value: "sewa", label: "Sewa" },
  { value: "bbm_solar", label: "BBM Solar" },
  { value: "perawatan", label: "Perawatan" },
  { value: "administrasi", label: "Kwitansi/Administrasi" },
  { value: "gaji_insentif", label: "Gaji/Insentif" },
  { value: "lain_lain", label: "Lain-lain" }
]

const SATUAN_OPTIONS = [
  { value: "buah", label: "Buah" },
  { value: "unit", label: "Unit" },
  { value: "pax", label: "Pax" },
  { value: "kotak", label: "Kotak" },
  { value: "box", label: "Box" },
  { value: "galon", label: "Galon" },
  { value: "liter", label: "Liter" },
  { value: "meter", label: "Meter" },
  { value: "kg", label: "Kilogram" },
  { value: "ton", label: "Ton" }
]

const TIPE_AKTIVITAS_OPTIONS = [
  { value: "beli", label: "Beli" },
  { value: "sewa", label: "Sewa" },
  { value: "perbaikan", label: "Perbaikan" },
  { value: "transport", label: "Transport" },
  { value: "administrasi", label: "Administrasi" }
]

export function ExpenseManagement() {
  const { toast } = useToast()
  const {
    expenses,
    loading,
    error,
    pagination,
    loadExpenses,
    createExpense,
    updateExpense,
    softDeleteExpense,
    hardDeleteExpense,
    restoreExpense,
    updateExpenseStatus
  } = useKasKecil()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterJenis, setFilterJenis] = useState<string>('all')
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Enhanced edit states
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [quickEditMode, setQuickEditMode] = useState(false)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [expenseVersions, setExpenseVersions] = useState<Map<string, Expense[]>>(new Map())
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{id: string, field: string} | null>(null)
  const [inlineEditValues, setInlineEditValues] = useState<Record<string, any>>({})
  
  // Approved transaction editing states for kas kecil
  const [allowApprovedEdit, setAllowApprovedEdit] = useState(false)
  const [showApprovalOverride, setShowApprovalOverride] = useState<string | null>(null)
  const [approvalReason, setApprovalReason] = useState('')
  const [supervisorPassword, setSupervisorPassword] = useState('')
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
    jenis: "",
    sub_jenis: "",
    notes: "",
    bukti_url: ""
  })

  // Load data from database on mount
  useEffect(() => {
    loadExpenses()
  }, [])

  // Load expenses when filters change
  useEffect(() => {
    loadExpenses({
      status: filterStatus === 'all' ? undefined : filterStatus as any,
      includeDeleted: showDeleted
    })
  }, [filterStatus, showDeleted])

  // Auto calculate total when banyak or harga_satuan changes
  const calculatedTotal = formData.banyak * formData.harga_satuan

  // Auto derive month from date
  useEffect(() => {
    if (formData.tanggal) {
      const date = new Date(formData.tanggal)
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ]
      const bulan = monthNames[date.getMonth()]
      setFormData(prev => ({ ...prev, bulan }))
    }
  }, [formData.tanggal])

  // Auto derive day from date
  useEffect(() => {
    if (formData.tanggal) {
      const date = new Date(formData.tanggal)
      const dayNames = [
        "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
      ]
      const hari = dayNames[date.getDay()]
      setFormData(prev => ({ ...prev, hari }))
    }
  }, [formData.tanggal])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (file: File) => {
    if (!validateFileType(file, ['image/', 'application/pdf'])) {
      toast({
        title: "Format file tidak valid",
        description: "Hanya file gambar (JPG, PNG) atau PDF yang diizinkan",
        variant: "destructive"
      })
      return
    }

    if (!validateFileSize(file, 5)) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      const fileUrl = await uploadFile(file)
      setFormData(prev => ({ ...prev, bukti_url: fileUrl }))
      
      toast({
        title: "File berhasil diupload",
        description: "Bukti transaksi berhasil diupload"
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
      const importedExpenses: Expense[] = data.slice(1).map((row: unknown[], index: number) => {
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
          jenis: rowData[12] || '',
          sub_jenis: rowData[13] || '',
          notes: rowData[14] || '',
          bukti_url: '',
          status: 'draft' as const,
          created_by: 'imported',
          created_at: new Date().toISOString()
        }
      })

      // Import expenses using the API
      for (const expense of importedExpenses) {
        await createExpense(expense)
      }
      
      toast({
        title: "Import berhasil",
        description: `Berhasil mengimpor ${importedExpenses.length} transaksi`
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
    const requiredFields = ['tanggal', 'tipe_aktivitas', 'barang', 'satuan', 'jenis', 'sub_jenis']
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

    // Validate BBM Solar must use Galon or Liter
    if (formData.sub_jenis === 'bbm_solar' && !['galon', 'liter'].includes(formData.satuan)) {
      toast({
        title: "Satuan BBM Solar tidak valid",
        description: "BBM Solar harus menggunakan satuan Galon atau Liter",
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

  const handleSubmit = async () => {
    if (!validateForm()) return

    const expenseData = {
      ...formData,
      bulan: formData.bulan || "",
      total: calculatedTotal,
      status: 'DRAFT' as const,
      createdBy: 'current_user' // This should come from auth context
    }

    if (editingExpense) {
      const result = await updateExpense({
        id: editingExpense.id!,
        ...expenseData
      })
      if (result) {
        setEditingExpense(null)
        resetForm()
      }
    } else {
      const result = await createExpense(expenseData)
      if (result) {
        resetForm()
      }
    }
  }

  // Filtering and search functions
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.tipe_aktivitas.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus
    const matchesJenis = filterJenis === 'all' || expense.jenis === filterJenis

    return matchesSearch && matchesStatus && matchesJenis
  })

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0) {
      setSelectedExpenses(new Set())
    } else {
      setSelectedExpenses(new Set(filteredExpenses.map(exp => exp.id)))
    }
    // Force show bulk actions if items are selected
    if (filteredExpenses.length > 0) {
      setShowBulkActions(selectedExpenses.size === 0)
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
    // Update bulk actions visibility
    setShowBulkActions(newSelected.size > 0)
  }

  const handleBulkStatusUpdate = async (newStatus: Expense['status']) => {
    const selectedIds = Array.from(selectedExpenses)
    let successCount = 0
    
    for (const id of selectedIds) {
      const result = await updateExpenseStatus(id, newStatus)
      if (result) {
        successCount++
      }
    }
    
    if (successCount > 0) {
      setSelectedExpenses(new Set())
      setShowBulkActions(false)
      toast({
        title: "Status updated",
        description: `${successCount} expenses updated to ${newStatus}`
      })
    } else {
      toast({
        title: "Update failed",
        description: "Failed to update expense status",
        variant: "destructive"
      })
    }
  }

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedExpenses)
    let successCount = 0
    
    for (const id of selectedIds) {
      const result = await softDeleteExpense(id)
      if (result) {
        successCount++
      }
    }
    
    if (successCount > 0) {
      setSelectedExpenses(new Set())
      setShowBulkActions(false)
      setIsDeleteDialogOpen(false)
      toast({
        title: "Expenses deleted",
        description: `${successCount} expenses have been deleted`
      })
    } else {
      toast({
        title: "Delete failed",
        description: "Failed to delete expenses",
        variant: "destructive"
      })
    }
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
      jenis: "",
      sub_jenis: "",
      notes: "",
      bukti_url: ""
    })
    setEditingExpense(null)
    setIsFormOpen(false)
  }

  const handleEdit = (expense: Expense) => {
    // Save current version to history before editing
    saveExpenseVersion(expense)
    
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
      bukti_url: expense.bukti_url || ""
    })
    setEditingExpense(expense)
    setIsFormOpen(true)
    setActiveTab('form')
  }

  // Enhanced edit functions
  const saveExpenseVersion = (expense: Expense) => {
    const versions = expenseVersions.get(expense.id) || []
    versions.push({...expense, created_at: new Date().toISOString()})
    setExpenseVersions(new Map(expenseVersions.set(expense.id, versions)))
  }

  const handleInlineEdit = (expense: Expense, field: string) => {
    setInlineEditId(expense.id)
    setEditingField({id: expense.id, field})
    setInlineEditValues({
      ...inlineEditValues,
      [expense.id]: {
        ...inlineEditValues[expense.id],
        [field]: expense[field as keyof Expense]
      }
    })
  }

  const saveInlineEdit = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId)
    if (expense && editingField && inlineEditValues[expenseId]) {
      // Save version before updating
      saveExpenseVersion(expense)
      
      // Update via API
      const updatedExpense = { 
        ...expense, 
        [editingField.field]: inlineEditValues[expenseId][editingField.field] 
      }
      const result = await updateExpense(updatedExpense)
      
      if (result) {
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

  const handleQuickEdit = (expense: Expense) => {
    // Check if this is an approved transaction and needs authorization
    if (expense.status === 'approved' && !allowApprovedEdit) {
      setShowApprovalOverride(expense.id)
      return
    }
    
    setQuickEditMode(true)
    setInlineEditId(expense.id)
    setInlineEditValues({
      ...inlineEditValues,
      [expense.id]: {
        barang: expense.barang,
        harga_satuan: expense.harga_satuan,
        banyak: expense.banyak,
        vendor_nama: expense.vendor_nama
      }
    })
  }

  // Handle approved transaction editing with authorization for kas kecil
  const handleApprovedExpenseEdit = (expense: Expense) => {
    if (expense.status === 'approved' && !allowApprovedEdit) {
      setShowApprovalOverride(expense.id)
      return
    }
    
    // Save version before editing approved transaction
    saveExpenseVersion(expense)
    
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
      bukti_url: expense.bukti_url || ""
    })
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const requestApprovalOverride = async () => {
    // Simple password check - same as kas besar
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
        description: "Please provide a reason for editing approved expense",
        variant: "destructive"
      })
      return
    }

    // Enable approved editing for this session
    setAllowApprovedEdit(true)
    
    // Log the override attempt
    console.log('Kas Kecil Approval Override:', {
      expenseId: showApprovalOverride,
      reason: approvalReason,
      timestamp: new Date().toISOString(),
      user: 'current_user'
    })

    toast({
      title: "Authorization Granted",
      description: "You can now edit approved expenses this session",
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

  const handleDuplicateExpense = async (expense: Expense) => {
    const duplicatedExpense = {
      ...expense,
      status: 'DRAFT' as const,
      bukti_url: '', // Clear file attachment for new entry
      notes: expense.notes ? `Copy of: ${expense.notes}` : 'Duplicated entry'
    }
    
    const result = await createExpense(duplicatedExpense)
    if (result) {
      toast({
        title: "Expense duplicated",
        description: "A copy of the expense has been created"
      })
    }
  }

  const handleBulkEdit = () => {
    setBulkEditMode(!bulkEditMode)
    if (!bulkEditMode) {
      setSelectedExpenses(new Set())
    }
  }

  const applyBulkEdit = async (field: string, value: any) => {
    const selectedIds = Array.from(selectedExpenses)
    let successCount = 0
    
    for (const id of selectedIds) {
      const expense = expenses.find(e => e.id === id)
      if (expense) {
        saveExpenseVersion(expense)
        const updatedExpense = { ...expense, [field]: value }
        const result = await updateExpense(updatedExpense)
        if (result) {
          successCount++
        }
      }
    }
    
    if (successCount > 0) {
      setSelectedExpenses(new Set())
      setBulkEditMode(false)
      setShowBulkActions(false)
      
      toast({
        title: "Bulk edit applied",
        description: `${successCount} expenses updated`
      })
    }
  }

  const handleDelete = async (id: string) => {
    const success = await softDeleteExpense(id)
    if (success) {
      // The hook will handle the state update and toast
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: Expense['status']) => {
    const result = await updateExpenseStatus(id, newStatus)
    if (result) {
      // The hook will handle the state update and toast
    }
  }

  const getStatusBadge = (status: Expense['status']) => {
    const badges = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      submitted: { label: 'Disubmit', color: 'bg-blue-100 text-blue-800' },
      reviewed: { label: 'Direview', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      archived: { label: 'Diarsip', color: 'bg-purple-100 text-purple-800' },
      rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
      // Support uppercase status values from database
      DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      SUBMITTED: { label: 'Disubmit', color: 'bg-blue-100 text-blue-800' },
      REVIEWED: { label: 'Direview', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      ARCHIVED: { label: 'Diarsip', color: 'bg-purple-100 text-purple-800' },
      REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800' }
    }
    
    const badge = badges[status]
    
    // Handle undefined status
    if (!badge) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status || 'Unknown'}
        </span>
      )
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
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

    if (exportToExcel(exportData, `Kas_Kecil_${new Date().getTime()}.xlsx`, 'Kas Kecil')) {
      toast({
        title: "Export berhasil",
        description: "Data kas kecil berhasil diekspor ke Excel"
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

    if (exportToCSV(exportData, `Kas_Kecil_${new Date().getTime()}.csv`)) {
      toast({
        title: "Export berhasil",
        description: "Data kas kecil berhasil diekspor ke CSV"
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
      <h2>Laporan Kas Kecil</h2>
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

    generatePDF(htmlContent, `Laporan_Kas_Kecil_${new Date().getTime()}.pdf`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pengeluaran Kas Kecil</h2>
          <p className="text-muted-foreground">
            Kelola input pengeluaran kas kecil dengan validasi dan approval workflow
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
            onClick={() => {
              setIsFormOpen(true)
              setActiveTab('form')
              setEditingExpense(null)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengeluaran
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
                <p className="text-sm text-blue-700 mt-1">Connecting to database and loading expenses...</p>
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
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => loadExpenses()}
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

      {/* Enhanced Search and Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pencarian & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Cari Pengeluaran</Label>
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
            <div>
              <Label htmlFor="filter-jenis">Filter Jenis</Label>
              <Select value={filterJenis} onValueChange={setFilterJenis}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="operasional">Operasional</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="konsumsi">Konsumsi</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="administrasi">Administrasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-deleted"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="show-deleted" className="text-sm">
                Tampilkan Data Terhapus
              </Label>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterJenis('all')
                }}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
          
          {selectedExpenses.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedExpenses.size} item terpilih
                </span>
                <div className="flex gap-2">
                  <Select onValueChange={handleBulkStatusUpdate}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submit</SelectItem>
                      <SelectItem value="reviewed">Review</SelectItem>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="archived">Archive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <FileText className="h-5 w-5" />
                  {editingExpense ? 'Edit Pengeluaran' : 'Form Input Pengeluaran'}
                </CardTitle>
                <CardDescription>
                  Lengkapi semua field yang diperlukan. Total akan dihitung otomatis.
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
                    <Label htmlFor="hari">Hari</Label>
                    <Input
                      id="hari"
                      value={formData.hari}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Otomatis dari tanggal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bulan">Bulan</Label>
                    <Input
                      id="bulan"
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
                    <Label htmlFor="barang">Barang/Keterangan *</Label>
                    <Input
                      id="barang"
                      value={formData.barang}
                      onChange={(e) => handleInputChange('barang', e.target.value)}
                      placeholder="Deskripsi barang atau layanan"
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
                    <Label htmlFor="total">Total Pengeluaran</Label>
                    <Input
                      id="total"
                      value={formatCurrency(calculatedTotal)}
                      readOnly
                      className="bg-gray-50 font-semibold"
                    />
                  </div>

                  {/* Vendor Information */}
                  <div className="space-y-2">
                    <Label htmlFor="vendor_nama">Nama Vendor</Label>
                    <Input
                      id="vendor_nama"
                      value={formData.vendor_nama}
                      onChange={(e) => handleInputChange('vendor_nama', e.target.value)}
                      placeholder="Nama vendor/supplier"
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
                    <Label htmlFor="jenis">Jenis *</Label>
                    <Select 
                      value={formData.jenis} 
                      onValueChange={(value) => handleInputChange('jenis', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        {JENIS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                {/* Bukti Upload */}
                <div className="space-y-2">
                  <Label>Bukti Transaksi</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.bukti_url ? (
                      <div className="space-y-2">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                        <p className="text-sm text-green-600 mb-2">Bukti sudah diupload</p>
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
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                              handleFileUpload(file)
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
                      Format: JPG, PNG, PDF. Maksimal 5MB
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    {editingExpense ? 'Perbarui' : 'Simpan'} Pengeluaran
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
              <CardTitle>Daftar Transaksi Pengeluaran</CardTitle>
              <CardDescription>
                Kelola dan review semua transaksi pengeluaran kas kecil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Daftar Pengeluaran ({filteredExpenses.length} dari {expenses.length})
                </h3>
                {filteredExpenses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                    <Label>Pilih Semua</Label>
                  </div>
                )}
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {expenses.length === 0 ? "Belum ada data transaksi" : "Tidak ada data yang cocok dengan filter"}
                  </p>
                  {expenses.length === 0 && (
                    <Button onClick={() => {
                      setIsFormOpen(true)
                      setActiveTab('form')
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Transaksi Pertama
                    </Button>
                  )}
                  {filteredExpenses.length === 0 && expenses.length > 0 && (
                    <Button onClick={() => {
                      setIsFormOpen(true)
                      setActiveTab('form')
                    }} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Transaksi Baru
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExpenses.map((expense) => (
                    <Card key={expense.id} className={`border ${expense.deletedAt ? 'border-red-300 bg-red-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedExpenses.has(expense.id)}
                              onChange={() => handleSelectExpense(expense.id)}
                              className="rounded"
                            />
                            <div className="flex-1">
                              {/* Inline Editable Title */}
                              {inlineEditId === expense.id && editingField?.field === 'barang' ? (
                                <div className="flex gap-2 items-center">
                                  <Input
                                    value={inlineEditValues[expense.id]?.barang || expense.barang}
                                    onChange={(e) => setInlineEditValues({
                                      ...inlineEditValues,
                                      [expense.id]: {
                                        ...inlineEditValues[expense.id],
                                        barang: e.target.value
                                      }
                                    })}
                                    className="h-8 text-base font-semibold"
                                    autoFocus
                                  />
                                  <Button size="sm" onClick={() => saveInlineEdit(expense.id)}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelInlineEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <h3 
                                  className="font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                                  onClick={() => handleInlineEdit(expense, 'barang')}
                                  title="Click to edit"
                                >
                                  {expense.barang}
                                </h3>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {expense.hari}, {expense.tanggal} • {expense.tipe_aktivitas}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(expense.status)}
                            {expense.deletedAt && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Deleted
                              </span>
                            )}
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                {formatCurrency(expense.total)}
                              </p>
                              {/* Inline Editable Price */}
                              {inlineEditId === expense.id && editingField?.field === 'harga_satuan' ? (
                                <div className="flex gap-1 items-center justify-end">
                                  <span className="text-sm text-muted-foreground">{expense.banyak} {expense.satuan} ×</span>
                                  <Input
                                    type="number"
                                    value={inlineEditValues[expense.id]?.harga_satuan || expense.harga_satuan}
                                    onChange={(e) => setInlineEditValues({
                                      ...inlineEditValues,
                                      [expense.id]: {
                                        ...inlineEditValues[expense.id],
                                        harga_satuan: parseFloat(e.target.value) || 0
                                      }
                                    })}
                                    className="h-6 w-24 text-xs text-right"
                                    autoFocus
                                  />
                                  <Button size="sm" onClick={() => saveInlineEdit(expense.id)}>
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelInlineEdit}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <p 
                                  className="text-sm text-muted-foreground cursor-pointer hover:bg-gray-100 px-1 rounded"
                                  onClick={() => handleInlineEdit(expense, 'harga_satuan')}
                                  title="Click to edit price"
                                >
                                  {expense.banyak} {expense.satuan} × {formatCurrency(expense.harga_satuan)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Jenis:</span>
                            <p className="text-muted-foreground">{expense.jenis}</p>
                          </div>
                          <div>
                            <span className="font-medium">Sub Jenis:</span>
                            <p className="text-muted-foreground">{expense.sub_jenis}</p>
                          </div>
                          <div>
                            <span className="font-medium">Vendor:</span>
                            {/* Inline Editable Vendor */}
                            {inlineEditId === expense.id && editingField?.field === 'vendor_nama' ? (
                              <div className="flex gap-1 items-center mt-1">
                                <Input
                                  value={inlineEditValues[expense.id]?.vendor_nama || expense.vendor_nama}
                                  onChange={(e) => setInlineEditValues({
                                    ...inlineEditValues,
                                    [expense.id]: {
                                      ...inlineEditValues[expense.id],
                                      vendor_nama: e.target.value
                                    }
                                  })}
                                  className="h-6 text-xs"
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => saveInlineEdit(expense.id)}>
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelInlineEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <p 
                                className="text-muted-foreground cursor-pointer hover:bg-gray-100 px-1 rounded"
                                onClick={() => handleInlineEdit(expense, 'vendor_nama')}
                                title="Click to edit vendor"
                              >
                                {expense.vendor_nama || '-'}
                              </p>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Contact:</span>
                            <p className="text-muted-foreground">{expense.vendor_telp || expense.vendor_email || '-'}</p>
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
                                      handleApprovedExpenseEdit(expense)
                                    } else {
                                      toast({
                                        title: "Cannot Edit",
                                        description: `${expense.status} expenses cannot be edited`,
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
                                  expense.status === 'APPROVED' ? "Edit Approved Expense (Requires Authorization)" :
                                  expense.status === 'SUBMITTED' ? "Submitted expenses cannot be edited" :
                                  expense.status === 'ARCHIVED' ? "Archived expenses cannot be edited" :
                                  "Edit Expense"
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
                                        description: `${expense.status} expenses cannot be edited`,
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
                                  expense.status === 'SUBMITTED' ? "Submitted expenses cannot be edited" :
                                  expense.status === 'ARCHIVED' ? "Archived expenses cannot be edited" :
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
                                title="Duplicate this expense"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              
                              {expenseVersions.get(expense.id)?.length && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowVersionHistory(expense.id)}
                                  className="hover:bg-yellow-50"
                                  title="View edit history"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger 
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:not([class*='size-']):size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 disabled:opacity-50"
                                disabled={expense.status === 'archived'}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (expense.status === 'approved' && !allowApprovedEdit) {
                                      setShowApprovalOverride(expense.id)
                                      return
                                    }
                                    handleDelete(expense.id)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Soft Delete (Hide)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    if (expense.status === 'approved' && !allowApprovedEdit) {
                                      setShowApprovalOverride(expense.id)
                                      return
                                    }
                                    const success = await hardDeleteExpense(expense.id!)
                                    if (success) {
                                      // The hook will handle the state update and toast
                                    }
                                  }}
                                  className="text-red-800 font-semibold"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hard Delete (Permanent)
                                </DropdownMenuItem>
                                {expense.deletedAt && (
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const result = await restoreExpense(expense.id!)
                                      if (result) {
                                        // The hook will handle the state update and toast
                                      }
                                    }}
                                    className="text-green-600"
                                  >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Restore
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                                <Eye className="h-4 w-4 mr-1" />
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
                <CardTitle>Ringkasan Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Transaksi:</span>
                    <span className="font-semibold">{expenses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Pengeluaran:</span>
                    <span className="font-semibold">
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
                    <span>Soft Deleted:</span>
                    <span className="text-red-600">{expenses.filter(exp => exp.deletedAt).length}</span>
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
                  <Button className="w-full" variant="outline" onClick={generateReport}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Laporan PDF
                  </Button>
                  <Button className="w-full" variant="outline" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export ke CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Edit Toolbar */}
      {bulkEditMode && selectedExpenses.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{selectedExpenses.size} items selected</span>
            
            <Select onValueChange={(value) => applyBulkEdit('vendor_nama', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Set vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PT ABC">PT ABC</SelectItem>
                <SelectItem value="PT XYZ">PT XYZ</SelectItem>
                <SelectItem value="Supplier Lokal">Supplier Lokal</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => applyBulkEdit('status', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setBulkEditMode(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
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
                Edit History
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
                        {new Date(version.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Item:</strong> {version.barang}</p>
                      <p><strong>Price:</strong> {formatCurrency(version.harga_satuan)}</p>
                      <p><strong>Vendor:</strong> {version.vendor_nama}</p>
                      <p><strong>Status:</strong> {version.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approval Override Modal for Kas Kecil */}
      {showApprovalOverride && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Authorization Required - Kas Kecil
              </CardTitle>
              <CardDescription>
                This expense is approved and requires supervisor authorization to modify.
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
                  placeholder="Please provide a detailed reason for editing this approved expense..."
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
            onClick={handleBulkEdit}
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
              title="Disable approved expense editing"
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

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirm Bulk Delete
              </CardTitle>
              <CardDescription>
                Are you sure you want to delete {selectedExpenses.size} selected expenses? This action can be undone later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedExpenses.size} Items
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
