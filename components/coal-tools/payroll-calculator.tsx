"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Save, 
  Calculator, 
  Users,
  Download,
  Edit,
  CheckCircle,
  X,
  Settings,
  PlusCircle,
  FileText,
  Loader2,
  Copy,
  History,
  RefreshCw,
  Zap,
  Clock,
  AlertTriangle,
  Trash2,
  Receipt,
  Calendar,
  DollarSign,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  HelpCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { 
  exportToExcel, 
  exportToCSV, 
  generatePDF,
  generatePayrollTemplate
} from "@/lib/file-utils"
import { 
  apiService, 
  Employee, 
  PayComponent, 
  PayrollRun, 
  PayrollLine,
  formatCurrency 
} from "@/lib/api"

// Get current user ID for payroll operations
const getCurrentUserId = () => {
  const currentUser = getCurrentUser()
  if (currentUser?.id) {
    return currentUser.id
  }
  // Fallback to demo user ID if not authenticated
  return "cmemokbd20000ols63e1xr3f6" // Admin user ID from our demo users
}

// Save Dialog Form Component
interface SaveDialogFormProps {
  currentFileName?: string
  currentNotes?: string
  employeeCount: number
  totalAmount: number
  onSave: (settings: { fileName: string; notes: string }) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

function SaveDialogForm({ 
  currentFileName, 
  currentNotes, 
  employeeCount, 
  totalAmount, 
  onSave, 
  onCancel, 
  isLoading 
}: SaveDialogFormProps) {
  const { toast } = useToast()
  const [fileName, setFileName] = useState(currentFileName || '')
  const [notes, setNotes] = useState(currentNotes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!fileName.trim()) {
      toast({
        title: "Error",
        description: "Nama file tidak boleh kosong",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      await onSave({ fileName: fileName.trim(), notes: notes.trim() })
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Data Summary */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="font-medium text-gray-700 mb-2">Data Summary:</div>
        <div className="space-y-1 text-gray-600">
          <div>• {employeeCount} karyawan terpilih</div>
          <div>• Total: {formatCurrency(totalAmount)}</div>
          <div>• Akan disimpan: {new Date().toLocaleString('id-ID')}</div>
        </div>
      </div>

      {/* File Name Input */}
      <div className="space-y-2">
        <Label htmlFor="fileName">Nama File *</Label>
        <Input
          id="fileName"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Masukkan nama file (max 1000 karakter)"
          maxLength={1000}
          disabled={saving || isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Format: .pdf akan ditambahkan otomatis saat export</span>
          <span>{fileName.length}/1000</span>
        </div>
      </div>

      {/* Notes Input */}
      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (Opsional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tambahkan catatan untuk payroll ini..."
          rows={3}
          disabled={saving || isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={saving || isLoading}
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1"
          disabled={saving || isLoading || !fileName.trim()}
        >
          {saving || isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Rename Dialog Form Component
interface RenameDialogFormProps {
  payrollRun: PayrollRun
  currentFileName: string
  onRename: (payrollRunId: string, newFileName: string, notes?: string) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

function RenameDialogForm({ 
  payrollRun, 
  currentFileName, 
  onRename, 
  onCancel, 
  isLoading 
}: RenameDialogFormProps) {
  const { toast } = useToast()
  const [fileName, setFileName] = useState(currentFileName)
  const [notes, setNotes] = useState(payrollRun.notes || '')
  const [renaming, setRenaming] = useState(false)

  const handleRename = async () => {
    if (!fileName.trim()) {
      toast({
        title: "Error",
        description: "Nama file tidak boleh kosong",
        variant: "destructive"
      })
      return
    }

    setRenaming(true)
    try {
      await onRename(payrollRun.id!, fileName.trim(), notes.trim())
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setRenaming(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Data Summary */}
      <div className="bg-blue-50 rounded-lg p-3 text-sm">
        <div className="font-medium text-blue-700 mb-2">File Payroll:</div>
        <div className="space-y-1 text-blue-600">
          <div>• Periode: {payrollRun.periodeAwal} - {payrollRun.periodeAkhir}</div>
          <div>• {payrollRun.payrollLines?.length || 0} karyawan</div>
          <div>• Status: {payrollRun.status}</div>
          <div>• Dibuat: {payrollRun.createdAt ? new Date(payrollRun.createdAt).toLocaleString('id-ID') : '-'}</div>
        </div>
      </div>

      {/* File Name Input */}
      <div className="space-y-2">
        <Label htmlFor="newFileName">Nama File Baru *</Label>
        <Input
          id="newFileName"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Masukkan nama file baru (max 1000 karakter)"
          maxLength={1000}
          disabled={renaming || isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Format: .pdf akan ditambahkan otomatis saat export</span>
          <span>{fileName.length}/1000</span>
        </div>
      </div>

      {/* Notes Input */}
      <div className="space-y-2">
        <Label htmlFor="newNotes">Catatan (Opsional)</Label>
        <Textarea
          id="newNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tambahkan atau ubah catatan untuk payroll ini..."
          rows={3}
          disabled={renaming || isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={renaming || isLoading}
        >
          Batal
        </Button>
        <Button
          onClick={handleRename}
          className="flex-1"
          disabled={renaming || isLoading || !fileName.trim()}
        >
          {renaming || isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Merename...
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Form interfaces
interface PayrollPeriodForm {
  periodeAwal: string
  periodeAkhir: string
  notes: string
  customFileName: string
}

// Interface untuk detail lembur
interface OvertimeDetail {
  // Lembur normal (hari kerja biasa)
  normalHours: number
  // Lembur hari libur/minggu/tanggal merah
  holidayHours: number
  // Lembur malam (jam pertama 1.5x, selebihnya 2x)
  nightFirstHour: number
  nightAdditionalHours: number
  // Custom overtime rate per hour (basis gaji pokok / 173)
  customHourlyRate?: number
}

interface EmployeePayrollForm {
  employeeId: string
  hariKerja: number
  // Legacy overtime fields (masih dipertahankan untuk kompatibilitas)
  overtimeHours: number
  overtimeRate: number
  // New detailed overtime
  overtimeDetail: OvertimeDetail
  cashbon: number
  notes: string
  selectedStandardComponents: string[]
  selectedAdditionalComponents: string[]
}

interface PayComponentForm {
  nama: string
  tipe: 'EARNING' | 'DEDUCTION'
  taxable: boolean
  metode: 'FLAT' | 'PER_HARI' | 'PERSENTASE'
  basis: 'UPAH_HARIAN' | 'BRUTO' | 'HARI_KERJA'
  rate?: number
  nominal?: number
  capMin?: number
  capMax?: number
  order: number
  isStandard?: boolean
}

interface ComponentSelection {
  standard: PayComponent[]
  additional: PayComponent[]
}

export function PayrollCalculator() {
  const { toast } = useToast()
  
  // State management
  const [currentStep, setCurrentStep] = useState(1)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payComponents, setPayComponents] = useState<PayComponent[]>([])
  const [standardComponents, setStandardComponents] = useState<PayComponent[]>([])
  const [additionalComponents, setAdditionalComponents] = useState<PayComponent[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true) // Start with loading true
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Form states
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriodForm>({
    periodeAwal: '',
    periodeAkhir: '',
    notes: '',
    customFileName: ''
  })
  
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeePayrollForm[]>([])
  const [customPayComponents, setCustomPayComponents] = useState<PayComponentForm[]>([])
  const [currentPayrollRun, setCurrentPayrollRun] = useState<PayrollRun | null>(null)
  
  // Component management states
  const [componentType, setComponentType] = useState<'standard' | 'additional'>('standard')
  const [showComponentDialog, setShowComponentDialog] = useState(false)
  const [editingComponent, setEditingComponent] = useState<PayComponent | null>(null)
  
  // UI states
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false)
  const [isPayComponentFormOpen, setIsPayComponentFormOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ type: string; id: string; name: string; status?: string } | null>(null)
  const [deletingPayrollRun, setDeletingPayrollRun] = useState<string | null>(null)
  const [showQuickSetupDialog, setShowQuickSetupDialog] = useState<'tax' | 'overtime' | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  
  // Save data states
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [savingData, setSavingData] = useState(false)
  const [lastSavedData, setLastSavedData] = useState<{ 
    timestamp: string; 
    fileName: string; 
    employeeCount: number;
    totalAmount: number;
  } | null>(null)
  
  // Rename file states
  const [showRenameDialog, setShowRenameDialog] = useState<{ payrollRun: PayrollRun; currentName: string } | null>(null)
  const [renamingFile, setRenamingFile] = useState(false)
  
  // Quick actions dialog states
  const [showPDFConfigDialog, setShowPDFConfigDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [selectedPayrollForPDF, setSelectedPayrollForPDF] = useState<PayrollRun | null>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Auto-save when data changes (debounced)
  useEffect(() => {
    if (selectedEmployees.length === 0) return
    
    const autoSaveTimer = setTimeout(() => {
      // Only auto-save if we have existing payroll run (in edit mode)
      if (currentPayrollRun && currentPayrollRun.id) {
        try {
          quickSaveData()
        } catch (error) {
          console.error('Auto-save error:', error)
        }
      }
    }, 10000) // Auto-save after 10 seconds of no changes

    return () => clearTimeout(autoSaveTimer)
  }, [selectedEmployees, payrollPeriod, customPayComponents])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for quick save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (selectedEmployees.length > 0) {
          quickSaveData()
        }
      }
      
      // Ctrl+Shift+S or Cmd+Shift+S for save as
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        if (selectedEmployees.length > 0) {
          setShowSaveDialog(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEmployees])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Loading initial data...')
      
      const [employeesRes, payComponentsRes, payrollRunsRes] = await Promise.all([
        apiService.getEmployees({ aktif: 'true', limit: 200 }).catch(err => {
          console.error('❌ Employee API error:', err)
          return { success: false, error: err.message, data: [] }
        }),
        apiService.getPayComponents().catch(err => {
          console.error('❌ Pay components API error:', err)
          return { success: false, error: err.message, data: [] }
        }),
        apiService.getPayrollRuns({ userId: getCurrentUserId(), limit: 10 }).catch(err => {
          console.error('❌ Payroll runs API error:', err)
          return { success: false, error: err.message, data: [] }
        })
      ])
      
      console.log('📊 API responses:', { employeesRes, payComponentsRes, payrollRunsRes })

      console.log('Employees response:', employeesRes) // Debug log
      
      if (employeesRes.success) {
        const activeEmployees = (employeesRes.data || []).filter(emp => emp.aktif !== false)
        setEmployees(activeEmployees)
        console.log('Active employees loaded:', activeEmployees.length) // Debug log
      } else {
        console.error('Failed to load employees:', employeesRes.error)
        toast({
          title: "Error",
          description: `Gagal memuat data karyawan: ${employeesRes.error}`,
          variant: "destructive"
        })
      }
      
      if (payComponentsRes.success) {
        const allComponents = payComponentsRes.data || []
        setPayComponents(allComponents)
        
        // Pisahkan komponen berdasarkan order (0-99 = standard, 100+ = additional)
        const standard = allComponents.filter(comp => comp.order < 100)
        const additional = allComponents.filter(comp => comp.order >= 100)
        
        setStandardComponents(standard)
        setAdditionalComponents(additional)
      } else {
        console.error('Failed to load pay components:', payComponentsRes.error)
        toast({
          title: "Warning",
          description: "Gagal memuat komponen gaji",
          variant: "destructive"
        })
      }
      
      if (payrollRunsRes.success) {
        setPayrollRuns(payrollRunsRes.data || [])
      } else {
        console.error('Failed to load payroll runs:', payrollRunsRes.error)
      }
    } catch (error: any) {
      console.error('❌ Error loading initial data:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // Set default values to prevent component crashes
      setEmployees([])
      setPayComponents([])
      setStandardComponents([])
      setAdditionalComponents([])
      setPayrollRuns([])
      
      toast({
        title: "Error Loading Data",
        description: `Gagal memuat data awal: ${error.message || 'Unknown error'}. Silakan refresh halaman.`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setIsInitialized(true)
      console.log('✅ Initial data loading completed')
    }
  }

  // Step navigation
  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
      console.log('🔄 Navigating to step:', currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // Component management functions
  const handleCreateComponent = async (componentData: PayComponentForm) => {
    try {
      setLoading(true)
      
      // Set order based on component type (standard: 0-99, additional: 100+)
      const order = componentType === 'standard' 
        ? Math.max(...standardComponents.map(c => c.order), -1) + 1
        : Math.max(...additionalComponents.map(c => c.order), 99) + 1

      const response = await apiService.createPayComponent({
        ...componentData,
        order
      })

      if (response.success) {
        toast({
          title: "Berhasil",
          description: `Komponen ${componentType === 'standard' ? 'standar' : 'tambahan'} berhasil ditambahkan`
        })
        
        // Refresh data
        await loadInitialData()
        setShowComponentDialog(false)
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal menambahkan komponen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating component:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menambahkan komponen",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateComponent = async (componentId: string, componentData: Partial<PayComponentForm>) => {
    try {
      setLoading(true)
      
      const response = await apiService.updatePayComponent(componentId, componentData)

      if (response.success) {
        toast({
          title: "Berhasil",
          description: "Komponen berhasil diupdate"
        })
        
        // Refresh data
        await loadInitialData()
        setShowComponentDialog(false)
        setEditingComponent(null)
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal mengupdate komponen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating component:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengupdate komponen",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

    const handleDeleteComponent = async (componentId: string, hardDelete: boolean = false) => {
    try {
      setLoading(true)
      
      const response = await apiService.deletePayComponent(componentId, hardDelete)
      
      if (response.success) {
        toast({
          title: "Berhasil",
          description: hardDelete 
            ? "Komponen berhasil dihapus permanen"
            : "Komponen berhasil dinonaktifkan"
        })
        
        // Refresh data
        await loadInitialData()
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal menghapus komponen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting component:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus komponen",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Component Management - handled by dialog
  
  // Step 2: Payroll Period
  const handlePeriodSubmit = () => {
    if (!payrollPeriod.periodeAwal || !payrollPeriod.periodeAkhir) {
      toast({
        title: "Periode tidak lengkap",
        description: "Mohon isi periode awal dan akhir",
        variant: "destructive"
      })
      return
    }
    nextStep()
  }

  // Step 3: Select Employees
  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      // Check if we're already at the limit of 100 employees
      // Removed employee limit - no maximum restriction
      
      const employee = employees.find(emp => emp.id === employeeId)
      if (employee) {
        setSelectedEmployees(prev => [...prev, {
          employeeId,
          hariKerja: 22,
          overtimeHours: 0,
          overtimeRate: employee.kontrakUpahHarian * 1.5,
          overtimeDetail: {
            normalHours: 0,
            holidayHours: 0,
            nightFirstHour: 0,
            nightAdditionalHours: 0,
            customHourlyRate: Math.round(employee.kontrakUpahHarian * 22 / 173) // Gaji pokok/173
          },
          cashbon: 0,
          notes: '',
          selectedStandardComponents: [],
          selectedAdditionalComponents: []
        }])
      }
    } else {
      setSelectedEmployees(prev => prev.filter(emp => emp.employeeId !== employeeId))
    }
  }

  const updateEmployeePayroll = (employeeId: string, field: string, value: any) => {
    setSelectedEmployees(prev => 
      prev.map(emp => 
        emp.employeeId === employeeId 
          ? { ...emp, [field]: value }
          : emp
      )
    )
  }

  // Helper function untuk update overtime detail
  const updateEmployeeOvertimeDetail = (employeeId: string, field: keyof OvertimeDetail, value: number) => {
    setSelectedEmployees(prev => 
      prev.map(emp => 
        emp.employeeId === employeeId 
          ? { 
              ...emp, 
              overtimeDetail: {
                ...emp.overtimeDetail,
                [field]: value
              }
            }
          : emp
      )
    )
  }

  // Menghitung total overtime amount berdasarkan ketentuan baru
  const calculateOvertimeAmount = (employee: Employee, overtimeDetail?: OvertimeDetail) => {
    if (!overtimeDetail) return 0
    
    let total = 0
    
    // Menghitung hourly rate: Gaji pokok / 173 (sesuai peraturan)
    const gajiPokok = employee.kontrakUpahHarian * 22 // Gaji pokok per bulan
    const hourlyRate = overtimeDetail.customHourlyRate || Math.round(gajiPokok / 173)
    
    // 1. Lembur normal (hari kerja biasa): 1.5x hourly rate
    total += (overtimeDetail.normalHours || 0) * hourlyRate * 1.5
    
    // 2. Lembur hari libur/minggu/tanggal merah: 2x hourly rate
    total += (overtimeDetail.holidayHours || 0) * hourlyRate * 2
    
    // 3. Lembur malam: jam pertama 1.5x, jam berikutnya 2x
    total += (overtimeDetail.nightFirstHour || 0) * hourlyRate * 1.5
    total += (overtimeDetail.nightAdditionalHours || 0) * hourlyRate * 2
    
    return Math.round(total)
  }

  // Step 4: Pay Components
  const addCustomPayComponent = () => {
    setCustomPayComponents(prev => [...prev, {
      nama: '',
      tipe: 'EARNING',
      taxable: false,
      metode: 'FLAT',
      basis: 'UPAH_HARIAN',
      rate: 0,
      nominal: 0,
      capMin: 0,
      capMax: 0,
      order: prev.length + 1
    }])
  }

  const updatePayComponent = (index: number, field: string, value: any) => {
    setCustomPayComponents(prev => 
      prev.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    )
  }

  const removePayComponent = (index: number) => {
    setCustomPayComponents(prev => prev.filter((_, i) => i !== index))
  }

  // Payroll History CRUD Functions
  const editPayrollRun = (payrollRun: PayrollRun) => {
    // Load payroll data back to form for editing
    setPayrollPeriod({
      periodeAwal: payrollRun.periodeAwal,
      periodeAkhir: payrollRun.periodeAkhir,
      notes: payrollRun.notes || '',
      customFileName: payrollRun.customFileName || ''
    })
    
    // Load payroll lines back to selected employees dengan data lengkap
    const employeeData = payrollRun.payrollLines?.map(line => ({
      employeeId: line.employeeId,
      hariKerja: line.hariKerja,
      // Restore overtime data
      overtimeHours: line.overtimeHours || 0,
      overtimeRate: line.overtimeRate || 0,
      overtimeDetail: {
        normalHours: line.normalHours || 0,
        holidayHours: line.holidayHours || 0,
        nightFirstHour: line.nightFirstHour || 0,
        nightAdditionalHours: line.nightAdditionalHours || 0,
        customHourlyRate: line.customHourlyRate
      },
      cashbon: line.cashbon || 0,
      notes: line.notes || '',
      // Restore components - extract from PayrollLineComponent
      selectedStandardComponents: line.components?.filter(comp => 
        standardComponents.some(sc => sc.id === comp.componentId)
      ).map(comp => comp.componentId) || [],
      selectedAdditionalComponents: line.components?.filter(comp => 
        additionalComponents.some(ac => ac.id === comp.componentId)
      ).map(comp => comp.componentId) || []
    })) || []
    
    // Restore custom components dari payroll line components yang tidak ada di standard/additional
    const usedComponentIds = [
      ...standardComponents.map(c => c.id),
      ...additionalComponents.map(c => c.id)
    ].filter(id => id)
    
    const customComponents = payrollRun.payrollLines?.reduce((acc, line) => {
      const lineCustomComps = line.components?.filter(comp => 
        !usedComponentIds.includes(comp.componentId)
      ).map(comp => ({
        nama: comp.componentName,
        tipe: comp.amount > 0 ? 'EARNING' : 'DEDUCTION' as const,
        taxable: comp.taxable,
        metode: 'FLAT' as const,
        basis: 'UPAH_HARIAN' as const,
        nominal: Math.abs(comp.amount),
        order: 0
      })) || []
      
      return [...acc, ...lineCustomComps]
    }, [] as any[]) || []
    
    // Remove duplicates by name
    const uniqueCustomComponents = customComponents.filter((comp, index, self) =>
      index === self.findIndex(c => c.nama === comp.nama)
    )
    
    setSelectedEmployees(employeeData)
    setCustomPayComponents(uniqueCustomComponents)
    setCurrentPayrollRun(payrollRun) // Keep reference for updating
    setCurrentStep(2) // Go back to edit mode
    
    toast({
      title: "Mode Edit Aktif",
      description: "Data payroll telah dimuat. Anda dapat mengedit dan simpan perubahan."
    })
  }

  const viewPayrollRun = (payrollRun: PayrollRun) => {
    setCurrentPayrollRun(payrollRun)
    setCurrentStep(6) // Navigate to Step 6 to show detailed view
    toast({
      title: "Menampilkan Detail Payroll",
      description: `Payroll periode ${payrollRun.periodeAwal} - ${payrollRun.periodeAkhir}`
    })
  }

  // Helper function to calculate payroll run total correctly
  const calculatePayrollRunTotal = (payrollRun: PayrollRun): number => {
    if (!payrollRun.payrollLines || payrollRun.payrollLines.length === 0) {
      return 0
    }

    return payrollRun.payrollLines.reduce((total, line) => {
      // Recalculate neto from stored data if neto is 0 or missing
      let neto = line.neto || 0
      
      if (neto === 0) {
        // Recalculate from stored fields
        const employee = employees.find(emp => emp.id === line.employeeId)
        if (employee) {
          // Calculate bruto
          const baseUpah = line.upahHarian * line.hariKerja
          const uangMakan = line.uangMakanHarian * line.hariKerja
          const uangBbm = line.uangBbmHarian * line.hariKerja
          const overtimeAmount = line.overtimeAmount || 0
          
          let totalEarnings = baseUpah + uangMakan + uangBbm + overtimeAmount
          
          // Add component earnings
          if (line.components) {
            line.components.forEach(comp => {
              if (comp.amount > 0) {
                totalEarnings += comp.amount
              }
            })
          }
          
          const bruto = totalEarnings
          
          // Calculate deductions
          let totalDeductions = line.pajakNominal || 0
          totalDeductions += line.potonganLain || 0
          totalDeductions += line.cashbon || 0
          
          // Add component deductions
          if (line.components) {
            line.components.forEach(comp => {
              if (comp.amount < 0) {
                totalDeductions += Math.abs(comp.amount)
              }
            })
          }
          
          neto = bruto - totalDeductions
        }
      }
      
      return total + neto
    }, 0)
  }

  // Helper functions to calculate individual line values correctly
  const calculateLineBruto = (line: PayrollLine): number => {
    const baseUpah = line.upahHarian * line.hariKerja
    const uangMakan = line.uangMakanHarian * line.hariKerja
    const uangBbm = line.uangBbmHarian * line.hariKerja
    const overtimeAmount = line.overtimeAmount || 0
    
    let totalEarnings = baseUpah + uangMakan + uangBbm + overtimeAmount
    
    // Add component earnings
    if (line.components) {
      line.components.forEach(comp => {
        if (comp.amount > 0) {
          totalEarnings += comp.amount
        }
      })
    }
    
    return line.bruto || totalEarnings
  }

  const calculateLineNeto = (line: PayrollLine): number => {
    // Return stored neto if available and non-zero
    if (line.neto && line.neto > 0) {
      return line.neto
    }
    
    // Otherwise recalculate
    const bruto = calculateLineBruto(line)
    
    let totalDeductions = line.pajakNominal || 0
    totalDeductions += line.potonganLain || 0
    totalDeductions += line.cashbon || 0
    
    // Add component deductions
    if (line.components) {
      line.components.forEach(comp => {
        if (comp.amount < 0) {
          totalDeductions += Math.abs(comp.amount)
        }
      })
    }
    
    return bruto - totalDeductions
  }

  // Function to refresh payroll data
  const refreshPayrollData = async () => {
    setLoading(true)
    try {
      const payrollRunsRes = await apiService.getPayrollRuns({ userId: getCurrentUserId(), limit: 10 })
      if (payrollRunsRes.success) {
        setPayrollRuns(payrollRunsRes.data || [])
        toast({
          title: "Data Berhasil Direfresh",
          description: "Riwayat payroll telah diperbarui dengan data terbaru"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal merefresh data payroll",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Quick save function for current data
  const quickSaveData = async () => {
    console.log('🚀 quickSaveData called with:', {
      selectedEmployees: selectedEmployees.length,
      payrollPeriod,
      currentPayrollRun: currentPayrollRun?.id
    })

    if (selectedEmployees.length === 0) {
      toast({
        title: "Tidak Ada Data",
        description: "Pilih karyawan terlebih dahulu sebelum menyimpan",
        variant: "destructive"
      })
      return
    }

    // Validate basic payroll period data
    if (!payrollPeriod.periodeAwal || !payrollPeriod.periodeAkhir) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Periode awal dan akhir payroll harus diisi",
        variant: "destructive"
      })
      return
    }

    setSavingData(true)
    try {
      let response
      const fileName = payrollPeriod.customFileName || `Payroll_${payrollPeriod.periodeAwal}_${payrollPeriod.periodeAkhir}`
      
      // Calculate current total
      const calculations = selectedEmployees.map(emp => calculateEmployeePayroll(emp))
      const totalAmount = calculations.reduce((sum, calc) => sum + calc.neto, 0)
      
      if (currentPayrollRun && currentPayrollRun.id) {
        console.log('🔄 Quick save - attempting to update existing payroll:', currentPayrollRun.id)
        try {
          // Verify payroll exists before attempting update
          const verifyResponse = await apiService.getPayrollRun(currentPayrollRun.id)
          if (!verifyResponse.success) {
            console.log('⚠️ Quick save - payroll not found, creating new instead:', currentPayrollRun.id)
            setCurrentPayrollRun(null)
            throw new Error('PAYROLL_NOT_FOUND')
          }
          
          // Update existing
          const updateData = {
            id: currentPayrollRun.id,
            periodeAwal: payrollPeriod.periodeAwal,
            periodeAkhir: payrollPeriod.periodeAkhir,
            customFileName: fileName,
            notes: payrollPeriod.notes || '',
            employeeOverrides: selectedEmployees.map(emp => {
              const calculation = calculateEmployeePayroll(emp)
              return {
                employeeId: emp.employeeId,
                hariKerja: emp.hariKerja,
                overtimeHours: emp.overtimeHours,
                overtimeRate: emp.overtimeRate,
                overtimeAmount: calculation?.overtimeAmount || 0,
                normalHours: emp.overtimeDetail.normalHours,
                holidayHours: emp.overtimeDetail.holidayHours,
                nightFirstHour: emp.overtimeDetail.nightFirstHour,
                nightAdditionalHours: emp.overtimeDetail.nightAdditionalHours,
                customHourlyRate: emp.overtimeDetail.customHourlyRate,
                cashbon: emp.cashbon,
                selectedStandardComponents: emp.selectedStandardComponents,
                selectedAdditionalComponents: emp.selectedAdditionalComponents,
                customComponents: customPayComponents.filter(comp => comp.nama)
              }
            })
          };
          
          console.log('📝 Update payload:', JSON.stringify(updateData, null, 2));
          response = await apiService.updatePayrollRun(updateData);
          console.log('✅ Update response:', response);
        } catch (verifyError: any) {
          if (verifyError.message === 'PAYROLL_NOT_FOUND' || verifyError.message?.includes('not found')) {
            console.log('🆕 Quick save - payroll not found, creating new payroll instead')
            // Fall through to create new payroll
          } else {
            throw verifyError
          }
        }
      }
      
      // Create new payroll if no valid existing payroll
      if (!response) {
        // Create new
        response = await apiService.createPayrollRun({
          periodeAwal: payrollPeriod.periodeAwal,
          periodeAkhir: payrollPeriod.periodeAkhir,
          createdBy: getCurrentUserId(),
          customFileName: fileName,
          notes: payrollPeriod.notes || '',
          employeeOverrides: selectedEmployees.map(emp => {
            const calculation = calculateEmployeePayroll(emp)
            return {
              employeeId: emp.employeeId,
              hariKerja: emp.hariKerja,
              overtimeHours: emp.overtimeHours,
              overtimeRate: emp.overtimeRate,
              overtimeAmount: calculation?.overtimeAmount || 0,
              normalHours: emp.overtimeDetail.normalHours,
              holidayHours: emp.overtimeDetail.holidayHours,
              nightFirstHour: emp.overtimeDetail.nightFirstHour,
              nightAdditionalHours: emp.overtimeDetail.nightAdditionalHours,
              customHourlyRate: emp.overtimeDetail.customHourlyRate,
              cashbon: emp.cashbon,
              selectedStandardComponents: emp.selectedStandardComponents,
              selectedAdditionalComponents: emp.selectedAdditionalComponents,
              customComponents: customPayComponents.filter(comp => comp.nama)
            }
          })
        })
      }

      console.log('📊 API Response:', response)
      
      if (response.success && response.data) {
        console.log('✅ Save successful:', response.data)
        setCurrentPayrollRun(response.data)
        setLastSavedData({
          timestamp: new Date().toISOString(),
          fileName: fileName,
          employeeCount: selectedEmployees.length,
          totalAmount: totalAmount
        })
        
        // Refresh payroll list
        await refreshPayrollData()
        
        toast({
          title: "Data Berhasil Disimpan",
          description: `${fileName} - ${selectedEmployees.length} karyawan - ${formatCurrency(totalAmount)}`
        })
      } else {
        console.error('❌ Save failed - response not successful:', response)
        toast({
          title: "Error Response",
          description: response.error || "API response tidak berhasil",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('❌ Quick save error:', error)
      console.error('Error stack:', error.stack)
      toast({
        title: "Error Menyimpan Data",
        description: error.message || "Gagal menyimpan data payroll. Coba lagi.",
        variant: "destructive"
      })
    } finally {
      setSavingData(false)
    }
  }

  // Save with custom settings
  const saveWithSettings = async (customSettings: { fileName: string; notes: string }) => {
    if (!customSettings.fileName.trim()) {
      toast({
        title: "Nama File Kosong",
        description: "Silakan masukkan nama file",
        variant: "destructive"
      })
      return
    }

    const originalFileName = payrollPeriod.customFileName
    const originalNotes = payrollPeriod.notes
    
    // Temporarily update settings
    setPayrollPeriod(prev => ({
      ...prev,
      customFileName: customSettings.fileName.trim(),
      notes: customSettings.notes.trim()
    }))
    
    try {
      await quickSaveData()
      setShowSaveDialog(false)
      toast({
        title: "Berhasil Disimpan",
        description: `File "${customSettings.fileName}" berhasil disimpan`,
        variant: "default"
      })
    } catch (error: any) {
      console.error('Save with settings error:', error)
      // Restore original values if save failed
      setPayrollPeriod(prev => ({
        ...prev,
        customFileName: originalFileName,
        notes: originalNotes
      }))
      toast({
        title: "Error Save As",
        description: error.message || "Gagal menyimpan dengan pengaturan custom",
        variant: "destructive"
      })
    }
  }

  // Rename file function
  const renamePayrollFile = async (payrollRunId: string, newFileName: string, notes?: string) => {
    setRenamingFile(true)
    try {
      console.log('🏷️ Renaming payroll file:', payrollRunId, 'to:', newFileName)
      
      // Verify payroll exists before attempting update
      const verifyResponse = await apiService.getPayrollRun(payrollRunId)
      if (!verifyResponse.success) {
        throw new Error('Payroll tidak ditemukan atau telah dihapus')
      }
      
      const response = await apiService.updatePayrollRun({
        id: payrollRunId,
        customFileName: newFileName.trim(),
        notes: notes || ''
      })
      
      if (response.success) {
        // Update local state
        setPayrollRuns(prev => prev.map(run => 
          run.id === payrollRunId 
            ? { ...run, customFileName: newFileName.trim(), notes: notes || '', updatedAt: new Date().toISOString() }
            : run
        ))
        
        // Update current payroll run if it's the same
        if (currentPayrollRun && currentPayrollRun.id === payrollRunId) {
          setCurrentPayrollRun(prev => prev ? { ...prev, customFileName: newFileName.trim(), notes: notes || '', updatedAt: new Date().toISOString() } : prev)
        }
        
        setShowRenameDialog(null)
        toast({
          title: "File Berhasil Direname",
          description: `Nama file berubah menjadi: ${newFileName}`
        })
        
        // Refresh payroll data
        await refreshPayrollData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah nama file",
        variant: "destructive"
      })
    } finally {
      setRenamingFile(false)
    }
  }

  // Quick setup functions for tax and overtime
  const addQuickTaxComponent = () => {
    setShowQuickSetupDialog('tax')
  }

  const addQuickOvertimeComponent = () => {
    setShowQuickSetupDialog('overtime')
  }

  const handleQuickSetup = (type: 'tax' | 'overtime', config: any) => {
    if (type === 'tax') {
      setCustomPayComponents(prev => [...prev, {
        nama: config.name || 'Pajak Penghasilan',
        tipe: 'DEDUCTION',
        taxable: false,
        metode: 'PERSENTASE',
        basis: config.basis || 'BRUTO',
        rate: config.rate || 2,
        nominal: undefined,
        capMin: config.minAmount || undefined,
        capMax: config.maxAmount || undefined,
        order: prev.length + 1
      }])
      
      toast({
        title: "Komponen Pajak Ditambahkan",
        description: `Komponen ${config.name || 'Pajak Penghasilan'} ${config.rate || 2}% telah ditambahkan.`,
      })
    } else if (type === 'overtime') {
      setCustomPayComponents(prev => [...prev, {
        nama: config.name || 'Lembur/Overtime',
        tipe: 'EARNING',
        taxable: config.taxable !== false,
        metode: config.method || 'PERSENTASE',
        basis: config.basis || 'UPAH_HARIAN',
        rate: config.rate || 150,
        nominal: config.method === 'FLAT' ? config.amount : undefined,
        capMin: config.minAmount || undefined,
        capMax: config.maxAmount || undefined,
        order: prev.length + 1
      }])
      
      toast({
        title: "Komponen Lembur Ditambahkan",
        description: `Komponen ${config.name || 'Lembur/Overtime'} telah ditambahkan.`,
      })
    }
    
    setShowQuickSetupDialog(null)
  }

  // Real-time calculation functions
  const calculateComponentAmount = (
    component: PayComponent | PayComponentForm, 
    employee: Employee, 
    hariKerja: number,
    bruto: number = 0
  ): number => {
    let amount = 0
    
    switch (component.metode) {
      case 'FLAT':
        amount = Number(component.nominal) || 0
        break
      case 'PER_HARI':
        amount = (Number(component.rate) || 0) * hariKerja
        break
      case 'PERSENTASE':
        const basis = component.basis === 'UPAH_HARIAN' 
          ? employee.kontrakUpahHarian * hariKerja
          : component.basis === 'HARI_KERJA'
          ? hariKerja
          : bruto
        amount = basis * ((Number(component.rate) || 0) / 100)
        break
    }
    
    // Apply caps
    if (component.capMin && amount < Number(component.capMin)) {
      amount = Number(component.capMin)
    }
    if (component.capMax && amount > Number(component.capMax)) {
      amount = Number(component.capMax)
    }
    
    return Math.round(amount)
  }

  const calculateEmployeePayroll = (employeePayroll: EmployeePayrollForm) => {
    try {
    const employee = employees.find(emp => emp.id === employeePayroll.employeeId)
      if (!employee) {
        console.warn('Employee not found:', employeePayroll.employeeId)
        return null
      }

      const hariKerja = employeePayroll.hariKerja || 0
      const baseUpah = (employee.kontrakUpahHarian || 0) * hariKerja
      const uangMakan = (employee.defaultUangMakan || 0) * hariKerja
      const uangBbm = (employee.defaultUangBbm || 0) * hariKerja
    
    let bruto = baseUpah + uangMakan + uangBbm
    let totalEarnings = 0
    let totalDeductions = 0
    let taxableAmount = baseUpah // Base taxable amount

    // Calculate earnings from selected components
    const selectedComponents = [
      ...standardComponents.filter(comp => 
        (employeePayroll.selectedStandardComponents || []).includes(comp.id)
      ),
      ...additionalComponents.filter(comp => 
        (employeePayroll.selectedAdditionalComponents || []).includes(comp.id)
      ),
      ...customPayComponents.filter(comp => comp.nama) // Only custom components with names
    ]

    selectedComponents.forEach(comp => {
      const amount = calculateComponentAmount(comp, employee, hariKerja, bruto)
      
      if (comp.tipe === 'EARNING') {
        totalEarnings += amount
        if (comp.taxable) {
          taxableAmount += amount
        }
      } else {
        totalDeductions += amount
      }
    })

    // Add overtime if any - menggunakan sistem overtime baru
    const newOvertimeAmount = calculateOvertimeAmount(employee, employeePayroll.overtimeDetail)
    const legacyOvertimeAmount = (employeePayroll.overtimeHours || 0) * (employeePayroll.overtimeRate || 1.5)
    
    // Prioritas: gunakan new overtime jika ada data, fallback ke legacy
    const hasNewOvertimeData = (employeePayroll.overtimeDetail?.normalHours || 0) > 0 || 
                              (employeePayroll.overtimeDetail?.holidayHours || 0) > 0 ||
                              (employeePayroll.overtimeDetail?.nightFirstHour || 0) > 0 ||
                              (employeePayroll.overtimeDetail?.nightAdditionalHours || 0) > 0
    
    const overtimeAmount = hasNewOvertimeData ? newOvertimeAmount : legacyOvertimeAmount
    totalEarnings += overtimeAmount
    taxableAmount += overtimeAmount

    // Update bruto with earnings
    bruto += totalEarnings

    // Tax calculation removed - users must configure tax manually via pay components
    // const pajakRate = 2
    // const pajakNominal = taxableAmount * (pajakRate / 100)
    const pajakNominal = 0  // No automatic tax - use pay components for tax configuration

    // Add cashbon to deductions
    totalDeductions += employeePayroll.cashbon

    // Calculate net
    const neto = bruto - totalDeductions

    return {
      employee,
      hariKerja,
      baseUpah,
      uangMakan,
      uangBbm,
      overtimeAmount,
      overtimeDetail: {
        ...(employeePayroll.overtimeDetail || {}),
        hourlyRate: (() => {
          const hourlyRate = employeePayroll.overtimeDetail?.customHourlyRate || 
                           Math.round(((employee?.kontrakUpahHarian || 0) * 22) / 173)
          return hourlyRate
        })(),
        normalAmount: (() => {
          const hourlyRate = employeePayroll.overtimeDetail?.customHourlyRate || 
                           Math.round(((employee?.kontrakUpahHarian || 0) * 22) / 173)
          return hourlyRate * (employeePayroll.overtimeDetail?.normalHours || 0) * 1.5
        })(),
        holidayAmount: (() => {
          const hourlyRate = employeePayroll.overtimeDetail?.customHourlyRate || 
                           Math.round(((employee?.kontrakUpahHarian || 0) * 22) / 173)
          return hourlyRate * (employeePayroll.overtimeDetail?.holidayHours || 0) * 2
        })(),
        nightFirstAmount: (() => {
          const hourlyRate = employeePayroll.overtimeDetail?.customHourlyRate || 
                           Math.round(((employee?.kontrakUpahHarian || 0) * 22) / 173)
          return hourlyRate * (employeePayroll.overtimeDetail?.nightFirstHour || 0) * 1.5
        })(),
        nightAdditionalAmount: (() => {
          const hourlyRate = employeePayroll.overtimeDetail?.customHourlyRate || 
                           Math.round(((employee?.kontrakUpahHarian || 0) * 22) / 173)
          return hourlyRate * (employeePayroll.overtimeDetail?.nightAdditionalHours || 0) * 2
        })()
      },
      totalEarnings,
      bruto,
      totalDeductions,
      pajakNominal,
      taxableAmount,
      cashbon: employeePayroll.cashbon || 0,
      neto,
      components: selectedComponents.map(comp => ({
        ...comp,
        amount: calculateComponentAmount(comp, employee, hariKerja, bruto)
      }))
    }
    } catch (error: any) {
      console.error('❌ Error calculating employee payroll:', error)
      console.error('Employee data:', employeePayroll)
      return null
    }
  }

  const getPayrollSummary = () => {
    const calculations = selectedEmployees
      .map(emp => calculateEmployeePayroll(emp))
      .filter(calc => calc !== null)

    const totalBruto = calculations.reduce((sum, calc) => sum + calc!.bruto, 0)
    const totalDeductions = calculations.reduce((sum, calc) => sum + calc!.totalDeductions, 0)
    const totalNeto = calculations.reduce((sum, calc) => sum + calc!.neto, 0)
    const totalTax = calculations.reduce((sum, calc) => sum + calc!.pajakNominal, 0)

    return {
      employeeCount: calculations.length,
      totalBruto,
      totalDeductions,
      totalNeto,
      totalTax,
      calculations
    }
  }

  // Step 5: Calculate Payroll
  const calculatePayroll = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Tidak ada karyawan dipilih",
        description: "Pilih minimal satu karyawan",
        variant: "destructive"
      })
      return
    }
    nextStep()
  }

  // Utility function to ensure data is ready
  const ensureDataReady = async () => {
    console.log('🔄 Ensuring data is ready...')
    
    // Check if employees are loaded
    if (employees.length === 0) {
      console.log('📥 Loading employees...')
      await loadInitialData()
    }
    
    // Check if pay components are loaded
    if (payComponents.length === 0) {
      console.log('📥 Loading pay components...')
      await loadInitialData()
    }
    
    console.log('✅ Data ready check complete')
  }

  // Step 6: Generate Payroll
  const generatePayroll = async () => {
    console.log('🚀 generatePayroll called')
    console.log('Current state:', {
      selectedEmployees: selectedEmployees.length,
      payrollPeriod,
      currentPayrollRun: currentPayrollRun?.id,
      customPayComponents: customPayComponents.length,
      employees: employees.length,
      payComponents: payComponents.length
    })
    
    // Ensure all required data is loaded
    try {
      await ensureDataReady()
    } catch (dataError) {
      console.error('❌ Failed to ensure data ready:', dataError)
      toast({
        title: "Error Loading Data",
        description: "Gagal memuat data yang diperlukan. Silakan refresh halaman.",
        variant: "destructive"
      })
      return
    }
    
    // Enhanced validation
    if (!payrollPeriod.periodeAwal || !payrollPeriod.periodeAkhir) {
      toast({
        title: "Error Validation",
        description: "Periode awal dan akhir harus diisi",
        variant: "destructive"
      })
      return
    }
    
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error Validation", 
        description: "Minimal pilih satu karyawan",
        variant: "destructive"
      })
      return
    }
    
    // Validate employees have required data
    const invalidEmployees = selectedEmployees.filter(emp => !emp.employeeId)
    if (invalidEmployees.length > 0) {
      toast({
        title: "Error Validation",
        description: "Beberapa karyawan tidak memiliki ID yang valid",
        variant: "destructive"
      })
      return
    }
    
    // Validate current user ID
    if (!getCurrentUserId()) {
      toast({
        title: "Error Validation",
        description: "User ID tidak valid. Silakan login ulang.",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    try {
      let response
      
      // Check if we're editing an existing payroll and verify it exists
      if (currentPayrollRun && currentPayrollRun.id) {
        console.log('🔄 Attempting to update existing payroll:', currentPayrollRun.id)
        try {
          // Verify payroll exists before attempting update
          const verifyResponse = await apiService.getPayrollRun(currentPayrollRun.id)
          if (!verifyResponse.success) {
            console.log('⚠️ Payroll not found, creating new instead:', currentPayrollRun.id)
            // Clear invalid currentPayrollRun and create new
            setCurrentPayrollRun(null)
            throw new Error('PAYROLL_NOT_FOUND')
          }
          
          // Update existing payroll
          response = await apiService.updatePayrollRun({
            id: currentPayrollRun.id,
            periodeAwal: payrollPeriod.periodeAwal,
            periodeAkhir: payrollPeriod.periodeAkhir,
            customFileName: payrollPeriod.customFileName || '',
            notes: payrollPeriod.notes || '',
            employeeOverrides: selectedEmployees.map(emp => {
              const calculation = calculateEmployeePayroll(emp)
              return {
                employeeId: emp.employeeId,
                hariKerja: emp.hariKerja,
                // Overtime details with null safety
                overtimeHours: emp.overtimeHours || 0,
                overtimeRate: emp.overtimeRate || 1.5,
                overtimeAmount: calculation?.overtimeAmount || 0,
                normalHours: emp.overtimeDetail?.normalHours || 0,
                holidayHours: emp.overtimeDetail?.holidayHours || 0,
                nightFirstHour: emp.overtimeDetail?.nightFirstHour || 0,
                nightAdditionalHours: emp.overtimeDetail?.nightAdditionalHours || 0,
                customHourlyRate: emp.overtimeDetail?.customHourlyRate || 0,
                cashbon: emp.cashbon || 0,
                // Components with null safety
                selectedStandardComponents: emp.selectedStandardComponents || [],
                selectedAdditionalComponents: emp.selectedAdditionalComponents || [],
                customComponents: customPayComponents.filter(comp => comp.nama)
              }
            })
          })
        } catch (verifyError: any) {
          if (verifyError.message === 'PAYROLL_NOT_FOUND' || verifyError.message?.includes('not found')) {
            console.log('🆕 Payroll not found, creating new payroll instead')
            // Fall through to create new payroll
          } else {
            throw verifyError
          }
        }
      }
      
      // Create new payroll if no valid existing payroll
      if (!response) {
        console.log('🆕 Creating new payroll with data:')
        console.log('- periodeAwal:', payrollPeriod.periodeAwal)
        console.log('- periodeAkhir:', payrollPeriod.periodeAkhir) 
        console.log('- createdBy:', getCurrentUserId())
        console.log('- customFileName:', payrollPeriod.customFileName)
        console.log('- notes:', payrollPeriod.notes)
        console.log('- selectedEmployees count:', selectedEmployees.length)
        
        const createPayload = {
        periodeAwal: payrollPeriod.periodeAwal,
        periodeAkhir: payrollPeriod.periodeAkhir,
        createdBy: getCurrentUserId(),
          customFileName: payrollPeriod.customFileName || '',
          notes: payrollPeriod.notes || '',
          employeeOverrides: selectedEmployees.map((emp, index) => {
            console.log(`📋 Processing employee ${index + 1}:`, {
          employeeId: emp.employeeId,
              hariKerja: emp.hariKerja,
              overtimeHours: emp.overtimeHours,
              overtimeDetail: emp.overtimeDetail
            })
            
            const calculation = calculateEmployeePayroll(emp)
            const employeeOverride = {
              employeeId: emp.employeeId,
              hariKerja: emp.hariKerja || 0,
              // Overtime details
              overtimeHours: emp.overtimeHours || 0,
              overtimeRate: emp.overtimeRate || 1.5,
              overtimeAmount: calculation?.overtimeAmount || 0,
              normalHours: emp.overtimeDetail?.normalHours || 0,
              holidayHours: emp.overtimeDetail?.holidayHours || 0,
              nightFirstHour: emp.overtimeDetail?.nightFirstHour || 0,
              nightAdditionalHours: emp.overtimeDetail?.nightAdditionalHours || 0,
              customHourlyRate: emp.overtimeDetail?.customHourlyRate || 0,
              cashbon: emp.cashbon || 0,
              // Components
              selectedStandardComponents: emp.selectedStandardComponents || [],
              selectedAdditionalComponents: emp.selectedAdditionalComponents || [],
              customComponents: customPayComponents.filter(comp => comp.nama) || []
            }
            
            console.log(`✅ Employee ${index + 1} override:`, employeeOverride)
            return employeeOverride
          })
        }
        
        console.log('📤 Final create payload:', JSON.stringify(createPayload, null, 2))
        
        // Create new payroll
        response = await apiService.createPayrollRun(createPayload)
      }

      if (response.success) {
        console.log('✅ Payroll generation successful:', response.data)
        setCurrentPayrollRun(response.data!)
        
        // Update success message
        const isUpdate = currentPayrollRun?.id
        toast({
          title: isUpdate ? "Payroll berhasil diupdate" : "Payroll berhasil dibuat",
          description: isUpdate 
            ? "Perubahan payroll telah disimpan" 
            : "Payroll telah dibuat dan siap untuk disetujui"
        })
        
        // Reload payroll runs
        try {
        const payrollRunsRes = await apiService.getPayrollRuns({ userId: getCurrentUserId(), limit: 10 })
        if (payrollRunsRes.success) {
          setPayrollRuns(payrollRunsRes.data || [])
            console.log('✅ Payroll runs refreshed')
          }
        } catch (refreshError) {
          console.warn('⚠️ Failed to refresh payroll runs:', refreshError)
          // Don't fail the whole operation if refresh fails
        }
        
        // Show next steps
        setTimeout(() => {
          toast({
            title: "Langkah Selanjutnya",
            description: "Payroll siap untuk direview dan disetujui. Periksa tab 'Riwayat Payroll' untuk detailnya."
          })
        }, 2000)
      } else {
        console.error('❌ API returned success=false:', response)
        throw new Error(response.error || 'Respon API tidak valid')
      }
    } catch (error: any) {
      console.error('❌ generatePayroll final error:', error)
      console.error('❌ Error stack:', error.stack)
      
      // More user-friendly error messages
      let errorMessage = "Gagal membuat payroll"
      if (error.message) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Koneksi internet bermasalah. Silakan periksa koneksi dan coba lagi."
        } else if (error.message.includes('validation')) {
          errorMessage = "Data tidak valid. Silakan periksa input data."
        } else if (error.message.includes('Database')) {
          errorMessage = "Masalah database. Silakan coba lagi dalam beberapa saat."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Generate Payroll Gagal",
        description: errorMessage,
        variant: "destructive"
      })
      
      // Reset state on error to allow retry
      if (error.message?.includes('not found') || error.message?.includes('PAYROLL_NOT_FOUND')) {
        setCurrentPayrollRun(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // Approve payroll and generate kwitansi
  const approvePayroll = async () => {
    if (!currentPayrollRun) return
    
    setLoading(true)
    try {
      const response = await apiService.updatePayrollRunStatus(
        currentPayrollRun.id!,
        'APPROVED',
        getCurrentUserId()
      )

      if (response.success) {
        setCurrentPayrollRun(response.data!)
        toast({
          title: "Payroll disetujui",
          description: "Kwitansi telah dibuat otomatis untuk setiap karyawan"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyetujui payroll",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate PDF Recap for Payroll
  const generatePayrollRecap = async (payrollRun: PayrollRun) => {
    setLoading(true)
    try {
      console.log('🔵 generatePayrollRecap called for payroll:', payrollRun.id)
      
      // Get detailed payroll data from API
      const response = await apiService.getPayrollRun(payrollRun.id!)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch payroll data')
      }

      const payrollData = response.data
      console.log('🔵 Fetched payroll data:', payrollData)

      if (!payrollData.payrollLines || payrollData.payrollLines.length === 0) {
        toast({
          title: "Info", 
          description: "Tidak ada data karyawan untuk dibuat PDF",
          variant: "destructive"
        })
        return
      }

      // Calculate totals from actual payroll lines
      const totalBruto = payrollData.payrollLines.reduce((sum: number, line: any) => sum + (parseFloat(line.bruto) || 0), 0)
      const totalNeto = payrollData.payrollLines.reduce((sum: number, line: any) => sum + (parseFloat(line.neto) || 0), 0)
      const totalDeductions = totalBruto - totalNeto

      const recapContent = generateSimplePayrollRecapHTML(payrollData, totalBruto, totalNeto, totalDeductions)
      const fileName = payrollRun.customFileName 
        ? `${payrollRun.customFileName}_Recap.pdf`
        : `Payroll_Recap_${payrollRun.periodeAwal}_${payrollRun.periodeAkhir}.pdf`
      
      await generatePDF(recapContent, fileName)
      
      toast({
        title: "Success",
        description: "PDF Recap berhasil diunduh"
      })
    } catch (error: any) {
      console.error('❌ generatePayrollRecap error:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal membuat PDF Recap",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate Individual Kwitansi for Employee
  const generateEmployeeKwitansi = async (payrollRun: PayrollRun, employeeId: string) => {
    setLoading(true)
    try {
      console.log('🟢 generateEmployeeKwitansi called for employee:', employeeId)
      
      // Get detailed payroll data from API
      const response = await apiService.getPayrollRun(payrollRun.id!)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch payroll data')
      }

      const payrollData = response.data
      const employeeLine = payrollData.payrollLines?.find((line: any) => line.employeeId === employeeId)
      
      if (!employeeLine) {
        toast({
          title: "Error",
          description: "Data karyawan tidak ditemukan dalam payroll ini",
          variant: "destructive"
        })
        return
      }

      const kwitansiContent = generateSimpleKwitansiHTML(payrollData, employeeLine)
      const fileName = `Kwitansi_${employeeLine.employeeName?.replace(/\s+/g, '_') || 'Unknown'}_${payrollRun.periodeAwal}.pdf`
      
      await generatePDF(kwitansiContent, fileName)
      
      toast({
        title: "Success", 
        description: `Kwitansi ${employeeLine.employeeName || 'Karyawan'} berhasil diunduh`
      })
    } catch (error: any) {
      console.error('❌ generateEmployeeKwitansi error:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal membuat kwitansi",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate Complete Payroll PDF Package (Summary + All Kwitansi)
  const generateCompletePayrollPDF = async (payrollRun: PayrollRun) => {
    setLoading(true)
    try {
      console.log('🔴 generateCompletePayrollPDF called for payroll:', payrollRun.id)
      
      // Get detailed payroll data from API
      const response = await apiService.getPayrollRun(payrollRun.id!)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch payroll data')
      }

      const payrollData = response.data
      console.log('🔴 Fetched payroll data:', payrollData)

      if (!payrollData.payrollLines || payrollData.payrollLines.length === 0) {
        toast({
          title: "Info", 
          description: "Tidak ada data karyawan untuk dibuat PDF",
          variant: "destructive"
        })
        return
      }

      // Calculate totals
      const totalBruto = payrollData.payrollLines.reduce((sum: number, line: any) => sum + (parseFloat(line.bruto) || 0), 0)
      const totalNeto = payrollData.payrollLines.reduce((sum: number, line: any) => sum + (parseFloat(line.neto) || 0), 0)
      const totalDeductions = totalBruto - totalNeto

      // Generate comprehensive PDF with summary and all kwitansi
      const completeContent = generateCompletePayrollHTML(payrollData, totalBruto, totalNeto, totalDeductions)
      const fileName = payrollRun.customFileName 
        ? `${payrollRun.customFileName}_Complete.pdf`
        : `Payroll_Complete_${payrollRun.periodeAwal}_${payrollRun.periodeAkhir}.pdf`
      
      await generatePDF(completeContent, fileName)
      
      toast({
        title: "Success",
        description: "PDF lengkap payroll dengan kwitansi berhasil diunduh"
      })
    } catch (error: any) {
      console.error('❌ generateCompletePayrollPDF error:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal membuat PDF lengkap",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Export payroll to PDF
  const exportToPDF = async (payrollRun: PayrollRun) => {
    setLoading(true)
    try {
      // Get detailed payroll data
      const response = await apiService.getPayrollRun(payrollRun.id!)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch payroll data')
      }

      const payrollData = response.data
      const currentDate = new Date().toLocaleDateString('id-ID')
      
      // Create PDF content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Payroll ${payrollData.periodeAwal} - ${payrollData.periodeAkhir}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 20px; font-weight: bold; color: #2563eb; }
            .report-title { font-size: 16px; margin: 10px 0; }
            .period { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .currency { text-align: right; }
            .summary { margin-top: 30px; background: #f9f9f9; padding: 15px; }
            .summary-item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; border-top: 2px solid #333; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
            <div class="report-title">LAPORAN PAYROLL KARYAWAN</div>
            <div class="period">Periode: ${payrollData.periodeAwal} - ${payrollData.periodeAkhir}</div>
            <div class="period">Tanggal Cetak: ${currentDate}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Karyawan</th>
                <th>Jabatan</th>
                <th>Hari Kerja</th>
                <th>Gaji Bruto</th>
                <th>Potongan</th>
                <th>Gaji Neto</th>
              </tr>
            </thead>
            <tbody>
              ${payrollData.payrollLines?.map((line: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${line.employee?.nama || line.employeeName}</td>
                  <td>${line.employee?.jabatan || '-'}</td>
                  <td>${line.hariKerja}</td>
                  <td class="currency">Rp ${Number(line.bruto).toLocaleString('id-ID')}</td>
                  <td class="currency">Rp ${Number(line.pajakNominal || 0).toLocaleString('id-ID')}</td>
                  <td class="currency">Rp ${Number(line.neto).toLocaleString('id-ID')}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="summary">
            <h3>Ringkasan</h3>
            <div class="summary-item">
              <span>Total Karyawan:</span>
              <span>${payrollData.payrollLines?.length || 0} orang</span>
            </div>
            <div class="summary-item">
              <span>Total Gaji Bruto:</span>
              <span>Rp ${payrollData.payrollLines?.reduce((sum: number, line: any) => sum + Number(line.bruto), 0).toLocaleString('id-ID') || '0'}</span>
            </div>
            <div class="summary-item">
              <span>Total Potongan:</span>
              <span>Rp ${payrollData.payrollLines?.reduce((sum: number, line: any) => sum + Number(line.pajakNominal || 0), 0).toLocaleString('id-ID') || '0'}</span>
            </div>
            <div class="summary-item total">
              <span>Total Gaji Neto:</span>
              <span>Rp ${payrollData.payrollLines?.reduce((sum: number, line: any) => sum + Number(line.neto), 0).toLocaleString('id-ID') || '0'}</span>
            </div>
          </div>
        </body>
        </html>
      `

      // Use browser's print functionality to generate PDF
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
        newWindow.print()
      }

      toast({
        title: "PDF Dibuat",
        description: "Laporan payroll telah dibuka di tab baru"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat PDF",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Export payroll to Excel
  const exportToExcel = async (payrollRun: PayrollRun) => {
    setLoading(true)
    try {
      // Get detailed payroll data
      const response = await apiService.getPayrollRun(payrollRun.id!)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch payroll data')
      }

      const payrollData = response.data
      
      // Create CSV content for Excel compatibility
      const headers = [
        'No',
        'Nama Karyawan',
        'Jabatan',
        'Site',
        'Hari Kerja',
        'Upah Harian',
        'Uang Makan',
        'Uang BBM',
        'Gaji Bruto',
        'Pajak',
        'Potongan Lain',
        'Gaji Neto'
      ]
      
      const csvContent = [
        headers.join(','),
        ...payrollData.payrollLines?.map((line: any, index: number) => [
          index + 1,
          `"${line.employee?.nama || line.employeeName}"`,
          `"${line.employee?.jabatan || '-'}"`,
          `"${line.employee?.site || '-'}"`,
          line.hariKerja,
          Number(line.upahHarian).toFixed(0),
          Number(line.uangMakanHarian).toFixed(0),
          Number(line.uangBbmHarian).toFixed(0),
          Number(line.bruto).toFixed(0),
          Number(line.pajakNominal || 0).toFixed(0),
          Number(line.potonganLain || 0).toFixed(0),
          Number(line.neto).toFixed(0)
        ].join(',')) || []
      ].join('\n')

      // Create and download Excel file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `Payroll_${payrollData.periodeAwal}_${payrollData.periodeAkhir}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Excel Dibuat",
        description: "File Excel payroll berhasil diunduh"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat Excel",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate kwitansi for all employees
  const generateKwitansiForAll = async (payrollRun: PayrollRun) => {
    setLoading(true)
    try {
      const response = await apiService.updatePayrollRunStatus(
        payrollRun.id!,
        'APPROVED',
        getCurrentUserId()
      )

      if (response.success) {
        toast({
          title: "Kwitansi Dibuat",
          description: "Kwitansi telah dibuat otomatis untuk semua karyawan"
        })
        
        // Reload payroll runs
        const payrollRunsRes = await apiService.getPayrollRuns({ userId: getCurrentUserId(), limit: 10 })
        if (payrollRunsRes.success) {
          setPayrollRuns(payrollRunsRes.data || [])
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat kwitansi",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete payroll (soft/hard)
  const handleDeletePayrollRun = async (id: string, hardDelete: boolean = false) => {
    setDeletingPayrollRun(id)
    try {
      const url = hardDelete 
        ? `/api/payroll?id=${id}&force=true`
        : `/api/payroll?id=${id}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Payroll dihapus",
          description: hardDelete 
            ? "Payroll berhasil dihapus permanen"
            : "Payroll berhasil dihapus (soft delete)"
        })
        
        // Reload payroll runs
        const payrollRes = await apiService.getPayrollRuns()
        if (payrollRes.success) {
          setPayrollRuns(payrollRes.data || [])
        }
        
        if (currentPayrollRun?.id === id) {
          setCurrentPayrollRun(null)
        }
      } else {
        throw new Error(result.error || 'Gagal menghapus payroll')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus payroll",
        variant: "destructive"
      })
    } finally {
      setDeletingPayrollRun(null)
      setShowDeleteDialog(null)
    }
  }

  // Generate PDF report
  // Generate comprehensive PDF reports with both laporan and kwitansi
  const generatePayrollReports = async (type: 'both' | 'laporan' | 'kwitansi' = 'both') => {
    if (!currentPayrollRun || selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data payroll untuk digenerate",
        variant: "destructive"
      })
      return
    }

    try {
      const summary = getPayrollSummary()
      const calculations = summary.calculations

      // Generate Laporan Payroll
      if (type === 'both' || type === 'laporan') {
        const laporanContent = generateLaporanHTML(currentPayrollRun, calculations, summary)
        const laporanFileName = currentPayrollRun.customFileName 
          ? `${currentPayrollRun.customFileName}_Laporan.pdf`
          : `Laporan_Payroll_${currentPayrollRun.periodeAwal}_${currentPayrollRun.periodeAkhir}.pdf`
        await generatePDF(laporanContent, laporanFileName)
      }

      // Generate Kwitansi for each employee
      if (type === 'both' || type === 'kwitansi') {
        await generateKwitansiPDFs(currentPayrollRun, calculations)
      }

      toast({
        title: "Success",
        description: `${type === 'both' ? 'Laporan dan Kwitansi' : type === 'laporan' ? 'Laporan' : 'Kwitansi'} berhasil digenerate`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error", 
        description: "Gagal generate PDF",
        variant: "destructive"
      })
    }
  }

  // Generate Simple HTML for Payroll Recap PDF
  const generateSimplePayrollRecapHTML = (payrollData: any, totalBruto: number, totalNeto: number, totalDeductions: number) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payroll Recap - ${payrollData.periodeAwal} to ${payrollData.periodeAkhir}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .company-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 20px; }
          .summary-item { text-align: center; padding: 10px; border: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; }
          .amount { text-align: right; }
          .total-row { background: #e0e0e0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
          <div class="title">PAYROLL RECAP</div>
          <div>Periode: ${payrollData.periodeAwal} s/d ${payrollData.periodeAkhir}</div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div>Total Karyawan</div>
            <div><strong>${payrollData.payrollLines?.length || 0}</strong></div>
          </div>
          <div class="summary-item">
            <div>Total Bruto</div>
            <div><strong>${formatCurrency(totalBruto)}</strong></div>
          </div>
          <div class="summary-item">
            <div>Total Potongan</div>
            <div><strong>${formatCurrency(totalDeductions)}</strong></div>
          </div>
          <div class="summary-item">
            <div>Total Neto</div>
            <div><strong>${formatCurrency(totalNeto)}</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Karyawan</th>
              <th>Jabatan</th>
              <th>Hari Kerja</th>
              <th>Bruto</th>
              <th>Neto</th>
              <th>Bank</th>
            </tr>
          </thead>
          <tbody>
            ${payrollData.payrollLines?.map((line: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${line.employeeName || '-'}</td>
                <td>${line.employee?.jabatan || '-'}</td>
                <td class="amount">${line.hariKerja || '-'}</td>
                <td class="amount">${formatCurrency(parseFloat(line.bruto) || 0)}</td>
                <td class="amount">${formatCurrency(parseFloat(line.neto) || 0)}</td>
                <td>${line.employee?.bankName || '-'}<br/>${line.employee?.bankAccount || '-'}</td>
              </tr>
            `).join('') || '<tr><td colspan="7">Tidak ada data</td></tr>'}
            <tr class="total-row">
              <td colspan="4">TOTAL</td>
              <td class="amount">${formatCurrency(totalBruto)}</td>
              <td class="amount">${formatCurrency(totalNeto)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 10px; color: #666;">
          Dibuat pada: ${new Date().toLocaleString('id-ID')}<br/>
          ${payrollData.notes ? `Catatan: ${payrollData.notes}` : ''}
        </div>
      </body>
      </html>
    `
  }

  // Generate Simple Kwitansi HTML
  const generateSimpleKwitansiHTML = (payrollData: any, employeeLine: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kwitansi Gaji - ${employeeLine.employeeName || 'Karyawan'}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .company-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .employee-info { margin-bottom: 20px; padding: 15px; background: #f5f5f5; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #333; padding: 8px; }
          th { background: #f0f0f0; font-weight: bold; }
          .amount { text-align: right; }
          .total-row { background: #e0e0e0; font-weight: bold; }
          .bank-info { margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; }
          .signature { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { width: 200px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
          <div class="title">KWITANSI PEMBAYARAN GAJI</div>
          <div>Periode: ${payrollData.periodeAwal} s/d ${payrollData.periodeAkhir}</div>
        </div>

        <div class="employee-info">
          <strong>Informasi Karyawan:</strong><br/>
          Nama: ${employeeLine.employeeName || '-'}<br/>
          Jabatan: ${employeeLine.employee?.jabatan || '-'}<br/>
          Site: ${employeeLine.employee?.site || '-'}<br/>
          Hari Kerja: ${employeeLine.hariKerja || '-'} hari
        </div>

        <table>
          <thead>
            <tr>
              <th>Komponen</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gaji Pokok</td>
              <td class="amount">${formatCurrency(parseFloat(employeeLine.upahHarian) * parseFloat(employeeLine.hariKerja) || 0)}</td>
            </tr>
            ${employeeLine.components?.map((comp: any) => `
              <tr>
                <td>${comp.componentName}</td>
                <td class="amount">${formatCurrency(parseFloat(comp.amount) || 0)}</td>
              </tr>
            `).join('') || ''}
            <tr class="total-row">
              <td><strong>TOTAL BRUTO</strong></td>
              <td class="amount"><strong>${formatCurrency(parseFloat(employeeLine.bruto) || 0)}</strong></td>
            </tr>
            ${parseFloat(employeeLine.cashbon) > 0 ? `
              <tr>
                <td>Cashbon</td>
                <td class="amount">(${formatCurrency(parseFloat(employeeLine.cashbon) || 0)})</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td><strong>TOTAL YANG DITERIMA</strong></td>
              <td class="amount"><strong>${formatCurrency(parseFloat(employeeLine.neto) || 0)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="bank-info">
          <strong>Informasi Transfer Bank:</strong><br/>
          Bank: ${employeeLine.employee?.bankName || 'Belum diisi'}<br/>
          No. Rekening: ${employeeLine.employee?.bankAccount || 'Belum diisi'}<br/>
          Atas Nama: ${employeeLine.employeeName || '-'}<br/>
          <strong>Jumlah Transfer: ${formatCurrency(parseFloat(employeeLine.neto) || 0)}</strong>
        </div>

        <div class="signature">
          <div class="signature-box">
            <div style="margin-bottom: 60px;"><strong>Yang Menerima</strong></div>
            <div style="border-top: 1px solid #333; padding-top: 10px;">${employeeLine.employeeName || '-'}</div>
          </div>
          <div class="signature-box">
            <div style="margin-bottom: 60px;"><strong>Hormat Kami</strong></div>
            <div style="border-top: 1px solid #333; padding-top: 10px;">PT. Global Lestari Alam</div>
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
          Dokumen ini dibuat pada: ${new Date().toLocaleString('id-ID')}<br/>
          Kwitansi ini merupakan bukti pembayaran yang sah.
        </div>
      </body>
      </html>
    `
  }

  // Generate HTML for Payroll Recap PDF
  const generatePayrollRecapHTML = (payrollRun: PayrollRun, calculations: any[]) => {
    const totalBruto = calculations.reduce((sum, calc) => sum + calc.bruto, 0)
    const totalNeto = calculations.reduce((sum, calc) => sum + calc.neto, 0)
    const totalDeductions = calculations.reduce((sum, calc) => sum + calc.totalDeductions + calc.cashbon, 0)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payroll Recap - ${payrollRun.periodeAwal} to ${payrollRun.periodeAkhir}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; font-size: 11px; color: #333; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #2563eb; padding-bottom: 15px; }
          .company-name { font-size: 22px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .period { font-size: 14px; color: #666; margin-bottom: 10px; }
          .summary-cards { display: flex; justify-content: space-around; margin-bottom: 20px; gap: 15px; }
          .summary-card { flex: 1; padding: 15px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 8px; text-align: center; border: 1px solid #cbd5e1; }
          .summary-card .label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
          .summary-card .value { font-size: 16px; font-weight: bold; color: #1e293b; margin-top: 5px; }
          .summary-card.total { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-color: #60a5fa; }
          .summary-card.total .value { color: #1d4ed8; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          th, td { border: 1px solid #d1d5db; padding: 8px 6px; text-align: left; }
          th { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; font-weight: 600; font-size: 9px; text-transform: uppercase; }
          .employee-row:nth-child(even) { background: #f8fafc; }
          .employee-row:hover { background: #e0f2fe; }
          .amount { text-align: right; font-family: 'Courier New', monospace; font-weight: 500; }
          .total-row { background: linear-gradient(135deg, #065f46 0%, #059669 100%); color: white; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 9px; }
          .generated-info { margin-top: 15px; padding: 10px; background: #f1f5f9; border-radius: 6px; font-size: 9px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
          <div class="title">PAYROLL RECAP</div>
          <div class="period">Periode: ${payrollRun.periodeAwal} s/d ${payrollRun.periodeAkhir}</div>
          ${payrollRun.customFileName ? `<div style="font-size: 12px; color: #059669; font-weight: 500;">${payrollRun.customFileName}</div>` : ''}
        </div>

        <div class="summary-cards">
          <div class="summary-card">
            <div class="label">Total Karyawan</div>
            <div class="value">${calculations.length}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Bruto</div>
            <div class="value">${formatCurrency(totalBruto)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Potongan</div>
            <div class="value">${formatCurrency(totalDeductions)}</div>
          </div>
          <div class="summary-card total">
            <div class="label">Total Neto</div>
            <div class="value">${formatCurrency(totalNeto)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 20%;">Nama Karyawan</th>
              <th style="width: 12%;">Jabatan</th>
              <th style="width: 8%;">Hari Kerja</th>
              <th style="width: 12%;">Gaji Pokok</th>
              <th style="width: 10%;">Tunjangan</th>
              <th style="width: 10%;">Lembur</th>
              <th style="width: 10%;">Bruto</th>
              <th style="width: 8%;">Potongan</th>
              <th style="width: 12%;">Neto</th>
              <th style="width: 15%;">Bank Transfer</th>
            </tr>
          </thead>
          <tbody>
            ${calculations.map((calc, index) => `
              <tr class="employee-row">
                <td style="text-align: center;">${index + 1}</td>
                <td style="font-weight: 500;">${calc.employee.nama}</td>
                <td>${calc.employee.jabatan}</td>
                <td style="text-align: center;">${calc.hariKerja}</td>
                <td class="amount">${formatCurrency(calc.baseUpah)}</td>
                <td class="amount">${formatCurrency(calc.totalEarnings - calc.baseUpah)}</td>
                <td class="amount">${formatCurrency(calc.overtimeAmount)}</td>
                <td class="amount" style="font-weight: 600; color: #059669;">${formatCurrency(calc.bruto)}</td>
                <td class="amount" style="color: #dc2626;">${formatCurrency(calc.totalDeductions + calc.cashbon)}</td>
                <td class="amount" style="font-weight: bold; color: #1d4ed8;">${formatCurrency(calc.neto)}</td>
                <td style="font-size: 9px;">
                  ${calc.employee.bankName}<br/>
                  ${calc.employee.bankAccount}
                </td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="7" style="text-align: center; font-weight: bold;">TOTAL</td>
              <td class="amount">${formatCurrency(totalBruto)}</td>
              <td class="amount">${formatCurrency(totalDeductions)}</td>
              <td class="amount">${formatCurrency(totalNeto)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="generated-info">
          <strong>Informasi Dokumen:</strong><br/>
          Dibuat pada: ${new Date().toLocaleString('id-ID')}<br/>
          ${payrollRun.notes ? `Catatan: ${payrollRun.notes}<br/>` : ''}
          Status: ${payrollRun.status}<br/>
          Dibuat oleh: ${payrollRun.createdBy}
        </div>

        <div class="footer">
          <p>Dokumen ini dibuat secara otomatis oleh sistem payroll PT. Global Lestari Alam</p>
        </div>
      </body>
      </html>
    `
  }

  const generateLaporanHTML = (payrollRun: PayrollRun, calculations: any[], summary: any) => {
    const totalBruto = calculations.reduce((sum, calc) => sum + calc!.bruto, 0)
    const totalDeductions = calculations.reduce((sum, calc) => sum + calc!.totalDeductions, 0)
    const totalNeto = calculations.reduce((sum, calc) => sum + calc!.neto, 0)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Payroll - ${payrollRun.periodeAwal} s/d ${payrollRun.periodeAkhir}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 14px; color: #666; margin-bottom: 10px; }
          .period-info { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
          .summary-cards { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .summary-card { flex: 1; margin: 0 5px; padding: 10px; border: 1px solid #ddd; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
          th { background: #f2f2f2; font-weight: bold; font-size: 9px; }
          .total-row { font-weight: bold; background: #e8f5e8; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .footer { margin-top: 30px; text-align: right; }
          .signature-area { margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">LAPORAN PAYROLL KARYAWAN</div>
          <div class="subtitle">PT. GLOBAL LESTARI ALAM</div>
          <div style="font-size: 12px;">Periode: ${payrollRun.periodeAwal} s/d ${payrollRun.periodeAkhir}</div>
        </div>
        
        <div class="period-info">
          <strong>Status:</strong> ${payrollRun.status} | 
          <strong>Total Karyawan:</strong> ${calculations.length} orang | 
          <strong>Dibuat:</strong> ${new Date().toLocaleDateString('id-ID')}
        </div>

        <div class="summary-cards">
          <div class="summary-card">
            <div style="font-weight: bold; color: #4CAF50;">TOTAL BRUTO</div>
            <div style="font-size: 14px; font-weight: bold;">${formatCurrency(totalBruto)}</div>
          </div>
          <div class="summary-card">
            <div style="font-weight: bold; color: #F44336;">TOTAL POTONGAN</div>
            <div style="font-size: 14px; font-weight: bold;">${formatCurrency(totalDeductions)}</div>
          </div>
          <div class="summary-card">
            <div style="font-weight: bold; color: #2196F3;">TOTAL NETO</div>
            <div style="font-size: 14px; font-weight: bold;">${formatCurrency(totalNeto)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th width="5%">No</th>
              <th width="25%">Nama Karyawan</th>
              <th width="8%">Hari Kerja</th>
              <th width="12%">Upah Dasar</th>
              <th width="10%">Tunjangan</th>
              <th width="10%">Lembur</th>
              <th width="12%">Total Bruto</th>
              <th width="8%">Pajak</th>
              <th width="10%">Total Neto</th>
            </tr>
          </thead>
          <tbody>
            ${calculations.map((calc, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${calc!.employee.nama}</td>
                <td class="text-center">${calc!.hariKerja}</td>
                <td class="text-right">${formatCurrency(calc!.baseUpah)}</td>
                <td class="text-right">${formatCurrency(calc!.uangMakan + calc!.uangBbm)}</td>
                <td class="text-right">${formatCurrency(calc!.overtimeAmount)}</td>
                <td class="text-right">${formatCurrency(calc!.bruto)}</td>
                <td class="text-right">${formatCurrency(calc!.pajakNominal)}</td>
                <td class="text-right"><strong>${formatCurrency(calc!.neto)}</strong></td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="6" class="text-center"><strong>TOTAL KESELURUHAN</strong></td>
              <td class="text-right"><strong>${formatCurrency(totalBruto)}</strong></td>
              <td class="text-right"><strong>${formatCurrency(totalDeductions)}</strong></td>
              <td class="text-right"><strong>${formatCurrency(totalNeto)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <div class="signature-area">
            <p>Sawahlunto, ${new Date().toLocaleDateString('id-ID')}</p>
            <br><br><br>
            <p><strong>ATIKA DEWI SURYANI</strong><br>Manager Keuangan</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const generateKwitansiPDFs = async (payrollRun: PayrollRun, calculations: any[]) => {
    for (const calc of calculations) {
      const kwitansiContent = generateKwitansiHTML(payrollRun, calc!)
      const kwitansiFileName = payrollRun.customFileName 
        ? `${payrollRun.customFileName}_Kwitansi_${calc!.employee.nama.replace(/\s+/g, '_')}.pdf`
        : `Kwitansi_${calc!.employee.nama.replace(/\s+/g, '_')}_${payrollRun.periodeAwal}.pdf`
      await generatePDF(kwitansiContent, kwitansiFileName)
    }
  }

  // Generate Complete Payroll HTML (Summary + All Individual Kwitansi)
  const generateCompletePayrollHTML = (payrollData: any, totalBruto: number, totalNeto: number, totalDeductions: number) => {
    const summaryHTML = generateSimplePayrollRecapHTML(payrollData, totalBruto, totalNeto, totalDeductions)
    
    // Extract just the content part from summary (removing html/head/body tags)
    const summaryContent = summaryHTML.match(/<body[^>]*>(.*?)<\/body>/s)?.[1] || summaryHTML
    
    // Generate individual kwitansi for each employee
    const kwitansiPages = payrollData.payrollLines.map((line: any) => {
      const kwitansiHTML = generateSimpleKwitansiHTML(payrollData, line)
      // Extract just the content part (removing html/head/body tags)
      return kwitansiHTML.match(/<body[^>]*>(.*?)<\/body>/s)?.[1] || kwitansiHTML
    }).join('<div style="page-break-before: always;"></div>')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payroll Complete - ${payrollData.periodeAwal} to ${payrollData.periodeAkhir}</title>
        <style>
          @page { 
            size: A4 portrait; 
            margin: 15mm; 
          }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            font-size: 12px; 
            background: #fff; 
            line-height: 1.4;
          }
          
          /* Summary Page Styles */
          .payroll-header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
          }
          .company-logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 10px; 
          }
          .report-title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 8px; 
            color: #1e293b; 
          }
          .period-info { 
            font-size: 14px; 
            color: #64748b; 
            margin-bottom: 5px; 
          }
          
          .summary-card { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
            padding: 25px; 
            border-radius: 12px; 
            margin: 20px 0; 
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .summary-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 15px; 
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
          }
          .summary-item { 
            background: white; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .summary-label { 
            font-size: 12px; 
            color: #64748b; 
            margin-bottom: 5px; 
          }
          .summary-value { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1e293b; 
          }
          .summary-value.total { color: #059669; }
          .summary-value.deduction { color: #dc2626; }
          
          .employee-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .employee-table th { 
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
            color: white; 
            padding: 12px 8px; 
            font-weight: 600;
            text-align: left;
            font-size: 11px;
          }
          .employee-table td { 
            border: 1px solid #e2e8f0; 
            padding: 10px 8px; 
            background: #fff;
            font-size: 11px;
          }
          .employee-table tr:nth-child(even) td { background: #f8fafc; }
          .amount-cell { 
            text-align: right; 
            font-family: 'Courier New', monospace; 
            font-weight: 600;
          }
          
          /* Kwitansi Page Styles */
          .kwitansi-header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
          }
          .kwitansi-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            color: #1e293b; 
          }
          .doc-number { 
            font-size: 12px; 
            color: #64748b; 
          }
          
          .employee-info { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 25px; 
            border: 1px solid #cbd5e1;
          }
          .employee-info h3 { 
            margin: 0 0 15px 0; 
            color: #1e40af; 
            font-size: 16px; 
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
          }
          .info-item { 
            display: flex; 
          }
          .info-label { 
            font-weight: 600; 
            color: #475569; 
            min-width: 120px; 
          }
          .info-value { 
            color: #1e293b; 
            font-weight: 500; 
          }
          
          .payment-details { 
            margin-bottom: 25px; 
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 15px; 
            padding-bottom: 8px; 
            border-bottom: 2px solid #e2e8f0; 
          }
          
          .kwitansi-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .kwitansi-table th { 
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
            color: white; 
            padding: 12px; 
            font-weight: 600;
            text-align: left;
          }
          .kwitansi-table td { 
            border: 1px solid #e2e8f0; 
            padding: 10px 12px; 
            background: #fff;
          }
          .kwitansi-table tr:nth-child(even) td { 
            background: #f8fafc; 
          }
          
          .earnings { 
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important; 
          }
          .deductions { 
            background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important; 
          }
          .total-section { 
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important; 
            font-weight: bold; 
            font-size: 14px;
          }
          .total-neto { 
            background: linear-gradient(135deg, #065f46 0%, #059669 100%) !important; 
            color: white !important; 
            font-size: 16px !important; 
            font-weight: bold !important; 
          }
          
          .bank-transfer { 
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
            padding: 20px; 
            border-radius: 12px; 
            margin: 25px 0; 
            border: 1px solid #f59e0b;
          }
          .bank-transfer h3 { 
            margin: 0 0 15px 0; 
            color: #92400e; 
            font-size: 16px; 
          }
          .bank-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
          }
          
          .signature-section { 
            margin-top: 40px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 50px; 
          }
          .signature-box { 
            text-align: center; 
            padding: 20px; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            background: #f8fafc;
          }
          .signature-title { 
            font-weight: bold; 
            margin-bottom: 60px; 
            color: #475569; 
          }
          .signature-line { 
            border-top: 1px solid #64748b; 
            padding-top: 10px; 
            font-weight: 500; 
          }
          
          .footer-note { 
            margin-top: 30px; 
            padding: 15px; 
            background: #f1f5f9; 
            border-radius: 8px; 
            font-size: 10px; 
            color: #64748b; 
            text-align: center; 
          }
          
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <!-- Summary Page -->
        ${summaryContent}
        
        <!-- Individual Kwitansi Pages -->
        <div style="page-break-before: always;"></div>
        ${kwitansiPages}
      </body>
      </html>
    `
  }

  // Generate Enhanced Kwitansi HTML for Individual Employee
  const generateEmployeeKwitansiHTML = (payrollRun: PayrollRun, calculation: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kwitansi Gaji - ${calculation.employee.nama}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; font-size: 12px; background: #fff; }
          .kwitansi-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 8px; }
          .kwitansi-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #1e293b; }
          .doc-number { font-size: 12px; color: #64748b; }
          
          .employee-info { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 25px; 
            border: 1px solid #cbd5e1;
          }
          .employee-info h3 { margin: 0 0 15px 0; color: #1e40af; font-size: 16px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { display: flex; }
          .info-label { font-weight: 600; color: #475569; min-width: 120px; }
          .info-value { color: #1e293b; font-weight: 500; }
          
          .payment-details { margin-bottom: 25px; }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-bottom: 15px; 
            padding-bottom: 8px; 
            border-bottom: 2px solid #e2e8f0; 
          }
          
          .kwitansi-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .kwitansi-table th { 
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
            color: white; 
            padding: 12px; 
            font-weight: 600;
            text-align: left;
          }
          .kwitansi-table td { 
            border: 1px solid #e2e8f0; 
            padding: 10px 12px; 
            background: #fff;
          }
          .kwitansi-table tr:nth-child(even) td { background: #f8fafc; }
          
          .earnings { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important; }
          .deductions { background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important; }
          .total-section { 
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important; 
            font-weight: bold; 
            font-size: 14px;
          }
          
          .amount-cell { 
            text-align: right; 
            font-family: 'Courier New', monospace; 
            font-weight: 600;
          }
          
          .bank-transfer { 
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
            padding: 20px; 
            border-radius: 12px; 
            margin: 25px 0; 
            border: 1px solid #f59e0b;
          }
          .bank-transfer h3 { margin: 0 0 15px 0; color: #92400e; font-size: 16px; }
          .bank-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          
          .signature-section { 
            margin-top: 40px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 50px; 
          }
          .signature-box { 
            text-align: center; 
            padding: 20px; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            background: #f8fafc;
          }
          .signature-title { font-weight: bold; margin-bottom: 60px; color: #475569; }
          .signature-line { border-top: 1px solid #64748b; padding-top: 10px; font-weight: 500; }
          
          .total-neto { 
            background: linear-gradient(135deg, #065f46 0%, #059669 100%) !important; 
            color: white !important; 
            font-size: 16px !important; 
            font-weight: bold !important; 
          }
          
          .footer-note { 
            margin-top: 30px; 
            padding: 15px; 
            background: #f1f5f9; 
            border-radius: 8px; 
            font-size: 10px; 
            color: #64748b; 
            text-align: center; 
          }
        </style>
      </head>
      <body>
        <div class="kwitansi-header">
          <div class="company-logo">PT. GLOBAL LESTARI ALAM</div>
          <div class="kwitansi-title">KWITANSI PEMBAYARAN GAJI</div>
          <div class="doc-number">No. KWT/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}</div>
        </div>

        <div class="employee-info">
          <h3>Informasi Karyawan</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Nama:</span>
              <span class="info-value">${calculation.employee.nama}</span>
            </div>
            <div class="info-item">
              <span class="info-label">NIK:</span>
              <span class="info-value">${calculation.employee.nik || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Jabatan:</span>
              <span class="info-value">${calculation.employee.jabatan}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Site:</span>
              <span class="info-value">${calculation.employee.site}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Periode:</span>
              <span class="info-value">${payrollRun.periodeAwal} s/d ${payrollRun.periodeAkhir}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Hari Kerja:</span>
              <span class="info-value">${calculation.hariKerja} hari</span>
            </div>
          </div>
        </div>

        <div class="payment-details">
          <div class="section-title">Rincian Pembayaran</div>
          
          <table class="kwitansi-table">
            <thead>
              <tr>
                <th style="width: 50%;">Komponen</th>
                <th style="width: 20%;">Kategori</th>
                <th style="width: 30%;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr class="earnings">
                <td>Gaji Pokok (${calculation.hariKerja} hari)</td>
                <td>Pendapatan</td>
                <td class="amount-cell">${formatCurrency(calculation.baseUpah)}</td>
              </tr>
              
              ${calculation.components?.filter(comp => comp.tipe === 'EARNING').map(comp => `
                <tr class="earnings">
                  <td>${comp.nama}</td>
                  <td>Tunjangan</td>
                  <td class="amount-cell">${formatCurrency(comp.amount)}</td>
                </tr>
              `).join('') || ''}
              
              ${calculation.overtimeAmount > 0 ? `
                <tr class="earnings">
                  <td>Lembur</td>
                  <td>Tunjangan</td>
                  <td class="amount-cell">${formatCurrency(calculation.overtimeAmount)}</td>
                </tr>
              ` : ''}
              
              <tr class="total-section">
                <td><strong>TOTAL PENDAPATAN</strong></td>
                <td></td>
                <td class="amount-cell"><strong>${formatCurrency(calculation.bruto)}</strong></td>
              </tr>
              
              ${calculation.components?.filter(comp => comp.tipe === 'DEDUCTION').map(comp => `
                <tr class="deductions">
                  <td>${comp.nama}</td>
                  <td>Potongan</td>
                  <td class="amount-cell">${formatCurrency(comp.amount)}</td>
                </tr>
              `).join('') || ''}
              
              ${calculation.cashbon > 0 ? `
                <tr class="deductions">
                  <td>Cashbon</td>
                  <td>Potongan</td>
                  <td class="amount-cell">${formatCurrency(calculation.cashbon)}</td>
                </tr>
              ` : ''}
              
              ${calculation.totalDeductions > 0 ? `
                <tr class="total-section">
                  <td><strong>TOTAL POTONGAN</strong></td>
                  <td></td>
                  <td class="amount-cell"><strong>${formatCurrency(calculation.totalDeductions + calculation.cashbon)}</strong></td>
                </tr>
              ` : ''}
              
              <tr class="total-neto">
                <td><strong>TOTAL YANG DITERIMA</strong></td>
                <td></td>
                <td class="amount-cell"><strong>${formatCurrency(calculation.neto)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bank-transfer">
          <h3>Informasi Transfer Bank</h3>
          <div class="bank-info">
            <div class="info-item">
              <span class="info-label">Bank:</span>
              <span class="info-value">${calculation.employee.bankName || 'Belum diisi'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">No. Rekening:</span>
              <span class="info-value">${calculation.employee.bankAccount || 'Belum diisi'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Atas Nama:</span>
              <span class="info-value">${calculation.employee.nama}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Jumlah Transfer:</span>
              <span class="info-value" style="font-weight: bold; color: #059669;">${formatCurrency(calculation.neto)}</span>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-title">Yang Menerima</div>
            <div class="signature-line">${calculation.employee.nama}</div>
          </div>
          <div class="signature-box">
            <div class="signature-title">Hormat Kami</div>
            <div class="signature-line">PT. Global Lestari Alam</div>
          </div>
        </div>

        <div class="footer-note">
          Dokumen ini dibuat pada: ${new Date().toLocaleString('id-ID')}<br/>
          Kwitansi ini merupakan bukti pembayaran yang sah.
        </div>
      </body>
      </html>
    `
  }

  const generateKwitansiHTML = (payrollRun: PayrollRun, calculation: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kwitansi Gaji - ${calculation.employee.nama}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 12px; }
          .kwitansi-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .kwitansi-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          .kwitansi-info { margin-bottom: 20px; }
          .kwitansi-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .kwitansi-table th, .kwitansi-table td { border: 1px solid #333; padding: 8px; }
          .kwitansi-table th { background: #f0f0f0; font-weight: bold; }
          .earnings { background: #e8f5e8; }
          .deductions { background: #ffe8e8; }
          .total-section { background: #e8e8e8; font-weight: bold; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { width: 200px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="kwitansi-header">
          <div class="kwitansi-title">KWITANSI PEMBAYARAN GAJI</div>
          <div style="font-size: 14px;">PT. GLOBAL LESTARI ALAM</div>
        </div>

        <div class="kwitansi-info">
          <table style="width: 100%; margin-bottom: 15px;">
            <tr>
              <td width="20%"><strong>Nama Karyawan</strong></td>
              <td width="30%">: ${calculation.employee.nama}</td>
              <td width="20%"><strong>Periode</strong></td>
              <td width="30%">: ${payrollRun.periodeAwal} s/d ${payrollRun.periodeAkhir}</td>
            </tr>
            <tr>
              <td><strong>Jabatan</strong></td>
              <td>: ${calculation.employee.jabatan || '-'}</td>
              <td><strong>Hari Kerja</strong></td>
              <td>: ${calculation.hariKerja} hari</td>
            </tr>
            <tr>
              <td><strong>Site</strong></td>
              <td>: ${calculation.employee.site || '-'}</td>
              <td><strong>Tanggal</strong></td>
              <td>: ${new Date().toLocaleDateString('id-ID')}</td>
            </tr>
          </table>
        </div>

        <table class="kwitansi-table">
              <thead>
                <tr>
              <th width="60%">KETERANGAN</th>
              <th width="20%">JUMLAH</th>
              <th width="20%">TOTAL</th>
                </tr>
              </thead>
              <tbody>
            <!-- PENDAPATAN -->
            <tr class="earnings">
              <td colspan="3"><strong>PENDAPATAN</strong></td>
            </tr>
            <tr>
              <td>Upah Dasar (${calculation.employee.kontrakUpahHarian ? formatCurrency(calculation.employee.kontrakUpahHarian) : 'N/A'} x ${calculation.hariKerja} hari)</td>
              <td>${calculation.hariKerja}</td>
              <td style="text-align: right">${formatCurrency(calculation.baseUpah)}</td>
                  </tr>
            <tr>
              <td>Uang Makan</td>
              <td>${calculation.hariKerja}</td>
              <td style="text-align: right">${formatCurrency(calculation.uangMakan)}</td>
            </tr>
            <tr>
              <td>Uang BBM</td>
              <td>${calculation.hariKerja}</td>
              <td style="text-align: right">${formatCurrency(calculation.uangBbm)}</td>
            </tr>
            ${calculation.overtimeAmount > 0 ? `
              <tr>
                <td>Lembur Total</td>
                <td>-</td>
                <td style="text-align: right">${formatCurrency(calculation.overtimeAmount)}</td>
              </tr>
              ${calculation.overtimeDetail && (calculation.overtimeDetail.normalHours > 0 || calculation.overtimeDetail.holidayHours > 0 || calculation.overtimeDetail.nightFirstHour > 0 || calculation.overtimeDetail.nightAdditionalHours > 0) ? `
                ${calculation.overtimeDetail.normalHours > 0 ? `
                  <tr style="font-size: 11px; color: #666;">
                    <td style="padding-left: 20px;">• Normal ${calculation.overtimeDetail.normalHours}h × ${formatCurrency(calculation.overtimeDetail.hourlyRate)} × 1.5</td>
                    <td>-</td>
                    <td style="text-align: right">${formatCurrency(calculation.overtimeDetail.normalAmount)}</td>
              </tr>
                ` : ''}
                ${calculation.overtimeDetail.holidayHours > 0 ? `
                  <tr style="font-size: 11px; color: #666;">
                    <td style="padding-left: 20px;">• Libur ${calculation.overtimeDetail.holidayHours}h × ${formatCurrency(calculation.overtimeDetail.hourlyRate)} × 2</td>
                    <td>-</td>
                    <td style="text-align: right">${formatCurrency(calculation.overtimeDetail.holidayAmount)}</td>
                  </tr>
                ` : ''}
                ${calculation.overtimeDetail.nightFirstHour > 0 ? `
                  <tr style="font-size: 11px; color: #666;">
                    <td style="padding-left: 20px;">• Malam 1 ${calculation.overtimeDetail.nightFirstHour}h × ${formatCurrency(calculation.overtimeDetail.hourlyRate)} × 1.5</td>
                    <td>-</td>
                    <td style="text-align: right">${formatCurrency(calculation.overtimeDetail.nightFirstAmount)}</td>
                  </tr>
                ` : ''}
                ${calculation.overtimeDetail.nightAdditionalHours > 0 ? `
                  <tr style="font-size: 11px; color: #666;">
                    <td style="padding-left: 20px;">• Malam + ${calculation.overtimeDetail.nightAdditionalHours}h × ${formatCurrency(calculation.overtimeDetail.hourlyRate)} × 2</td>
                    <td>-</td>
                    <td style="text-align: right">${formatCurrency(calculation.overtimeDetail.nightAdditionalAmount)}</td>
                  </tr>
                ` : ''}
              ` : ''}
            ` : ''}
            ${calculation.components
              .filter((comp: any) => comp.tipe === 'EARNING' && comp.amount > 0)
              .map((comp: any) => `
                <tr>
                  <td>${comp.nama}</td>
                  <td>-</td>
                  <td style="text-align: right">${formatCurrency(comp.amount)}</td>
                </tr>
              `).join('')
            }
            
            <!-- POTONGAN -->
            <tr class="deductions">
              <td colspan="3"><strong>POTONGAN</strong></td>
            </tr>
            <tr>
              <td>Pajak</td>
              <td>-</td>
              <td style="text-align: right">${formatCurrency(calculation.pajakNominal)}</td>
            </tr>
            ${calculation.cashbon > 0 ? `
              <tr>
                <td>Cashbon</td>
                <td>-</td>
                <td style="text-align: right">${formatCurrency(calculation.cashbon)}</td>
              </tr>
            ` : ''}
            ${calculation.components
              .filter((comp: any) => comp.tipe === 'DEDUCTION' && comp.amount > 0)
              .map((comp: any) => `
                <tr>
                  <td>${comp.nama}</td>
                  <td>-</td>
                  <td style="text-align: right">${formatCurrency(comp.amount)}</td>
                </tr>
              `).join('')
            }

            <!-- TOTAL -->
            <tr class="total-section">
              <td><strong>TOTAL BRUTO</strong></td>
              <td>-</td>
              <td style="text-align: right"><strong>${formatCurrency(calculation.bruto)}</strong></td>
            </tr>
            <tr class="total-section">
              <td><strong>TOTAL POTONGAN</strong></td>
              <td>-</td>
              <td style="text-align: right"><strong>${formatCurrency(calculation.totalDeductions)}</strong></td>
            </tr>
            <tr class="total-section" style="font-size: 14px;">
              <td><strong>GAJI BERSIH</strong></td>
              <td>-</td>
              <td style="text-align: right"><strong>${formatCurrency(calculation.neto)}</strong></td>
            </tr>
              </tbody>
            </table>

        ${calculation.employee.bankName && calculation.employee.bankAccount ? `
          <div style="margin: 30px 0; padding: 15px; border: 2px solid #333; background: #f9f9f9;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">INFORMASI TRANSFER BANK</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr>
                <td width="30%"><strong>Nama Bank</strong></td>
                <td width="70%">: ${calculation.employee.bankName}</td>
              </tr>
              <tr>
                <td><strong>Nomor Rekening</strong></td>
                <td>: ${calculation.employee.bankAccount}</td>
              </tr>
              <tr>
                <td><strong>Atas Nama</strong></td>
                <td>: ${calculation.employee.nama}</td>
              </tr>
              <tr>
                <td><strong>Jumlah Transfer</strong></td>
                <td>: <strong>${formatCurrency(calculation.neto)}</strong></td>
              </tr>
            </table>
            <div style="margin-top: 10px; padding: 8px; background: #e8f5e8; border-left: 4px solid #4CAF50; font-size: 11px;">
              <strong>Catatan:</strong> Transfer akan dilakukan setelah payroll disetujui. Pastikan nomor rekening benar.
            </div>
          </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <p>Yang Menerima,</p>
            <br><br><br>
            <p><strong>${calculation.employee.nama}</strong></p>
          </div>
          <div class="signature-box">
            <p>Sawahlunto, ${new Date().toLocaleDateString('id-ID')}</p>
            <p>Yang Memberikan,</p>
            <br><br>
            <p><strong>ATIKA DEWI SURYANI</strong><br>Manager Keuangan</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const getStatusBadge = (status: PayrollRun['status']) => {
    const badges = {
      DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      REVIEWED: { label: 'Direview', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      PAID: { label: 'Dibayar', color: 'bg-blue-100 text-blue-800' },
      ARCHIVED: { label: 'Diarsipkan', color: 'bg-gray-100 text-gray-600' }
    }
    
    const badge = badges[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-600' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <div>
            <h3 className="text-lg font-medium">Memuat Kalkulator Gaji</h3>
            <p className="text-muted-foreground">Sedang memuat data karyawan dan komponen gaji...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kalkulator Gaji Karyawan</h2>
          <p className="text-muted-foreground">
            Proses penggajian sederhana dalam satu alur kerja
          </p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 6 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {/* Step 1: Component Management */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manajemen Komponen Gaji
              </CardTitle>
              <CardDescription>
                Kelola komponen gaji standar dan tambahan sebelum membuat payroll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={componentType} onValueChange={(value) => setComponentType(value as 'standard' | 'additional')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="standard">Komponen Standar</TabsTrigger>
                  <TabsTrigger value="additional">Komponen Tambahan</TabsTrigger>
                </TabsList>
                
                {/* Standard Components Tab */}
                <TabsContent value="standard" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Komponen Gaji Standar</h3>
                    <Button 
                      onClick={() => {
                        setComponentType('standard')
                        setEditingComponent(null)
                        setShowComponentDialog(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Komponen Standar
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {standardComponents.map((component) => (
                      <Card key={component.id} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{component.nama}</CardTitle>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={component.tipe === 'EARNING' ? 'default' : 'destructive'}>
                                  {component.tipe === 'EARNING' ? 'Pendapatan' : 'Potongan'}
                                </Badge>
                                <Badge variant="outline">{component.metode}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingComponent(component)
                                  setComponentType('standard')
                                  setShowComponentDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowDeleteDialog({
                                  type: 'payComponent',
                                  id: component.id!,
                                  name: component.nama
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-sm text-gray-600">
                            {component.rate && <p>Rate: {component.rate}%</p>}
                            {component.nominal && <p>Nominal: {formatCurrency(component.nominal)}</p>}
                            <p>Basis: {component.basis}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                {/* Additional Components Tab */}
                <TabsContent value="additional" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Komponen Gaji Tambahan</h3>
                    <Button 
                      onClick={() => {
                        setComponentType('additional')
                        setEditingComponent(null)
                        setShowComponentDialog(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Komponen Tambahan
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {additionalComponents.map((component) => (
                      <Card key={component.id} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{component.nama}</CardTitle>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={component.tipe === 'EARNING' ? 'default' : 'destructive'}>
                                  {component.tipe === 'EARNING' ? 'Pendapatan' : 'Potongan'}
                                </Badge>
                                <Badge variant="outline">{component.metode}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingComponent(component)
                                  setComponentType('additional')
                                  setShowComponentDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowDeleteDialog({
                                  type: 'payComponent',
                                  id: component.id!,
                                  name: component.nama
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-sm text-gray-600">
                            {component.rate && <p>Rate: {component.rate}%</p>}
                            {component.nominal && <p>Nominal: {formatCurrency(component.nominal)}</p>}
                            <p>Basis: {component.basis}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between">
                <div></div>
                <Button onClick={nextStep} className="flex items-center gap-2">
                  Lanjut ke Periode Payroll
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payroll Period */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Langkah 2: Periode Payroll
              </CardTitle>
              <CardDescription>
                Tentukan periode payroll yang akan dibuat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodeAwal">Periode Awal</Label>
                  <Input
                    id="periodeAwal"
                    type="date"
                    value={payrollPeriod.periodeAwal}
                    onChange={(e) => setPayrollPeriod(prev => ({ ...prev, periodeAwal: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="periodeAkhir">Periode Akhir</Label>
                  <Input
                    id="periodeAkhir"
                    type="date"
                    value={payrollPeriod.periodeAkhir}
                    onChange={(e) => setPayrollPeriod(prev => ({ ...prev, periodeAkhir: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={payrollPeriod.notes}
                  onChange={(e) => setPayrollPeriod(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Catatan tambahan untuk periode ini..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="customFileName">Nama File Custom (Opsional)</Label>
                <Input
                  id="customFileName"
                  value={payrollPeriod.customFileName}
                  onChange={(e) => setPayrollPeriod(prev => ({ ...prev, customFileName: e.target.value.slice(0, 1000) }))}
                  placeholder="Nama custom untuk file payroll (max 1000 karakter)"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {payrollPeriod.customFileName.length}/1000 karakter. Kosongkan untuk menggunakan nama default.
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePeriodSubmit} disabled={!payrollPeriod.periodeAwal || !payrollPeriod.periodeAkhir}>
                  Lanjutkan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Employees */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Langkah 3: Pilih Karyawan
              </CardTitle>
              <CardDescription>
                Pilih karyawan dan atur detail penggajian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Memuat data karyawan...
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <Users className="h-12 w-12 mx-auto text-gray-400" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Data Karyawan</h3>
                    <p className="text-gray-500">
                      Belum ada karyawan yang terdaftar dalam sistem. 
                      Silakan tambahkan karyawan terlebih dahulu.
                    </p>
                    <Button
                      onClick={() => window.open('/coal-tools-karyawan', '_blank')}
                      className="mt-4"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Kelola Karyawan
                    </Button>
                    <Button
                      onClick={loadInitialData}
                      variant="outline"
                      className="ml-2"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Data
                    </Button>
                  </div>
                </div>
              ) : employees.filter(emp => emp.aktif !== false).length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <AlertTriangle className="h-12 w-12 mx-auto text-orange-400" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Karyawan Aktif</h3>
                    <p className="text-gray-500">
                      Semua karyawan dalam status tidak aktif. 
                      Aktifkan karyawan untuk memulai perhitungan payroll.
                    </p>
                    <Button
                      onClick={() => window.open('/coal-tools-karyawan', '_blank')}
                      className="mt-4"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Kelola Status Karyawan
                    </Button>
                  </div>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employees.filter(emp => emp.aktif !== false).map((employee) => {
                  const isSelected = selectedEmployees.some(emp => emp.employeeId === employee.id)
                  const selectedData = selectedEmployees.find(emp => emp.employeeId === employee.id)
                  
                  return (
                    <Card key={employee.id} className={`border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{employee.nama}</h3>
                            <p className="text-sm text-muted-foreground">{employee.jabatan} • {employee.site}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => employee.id && handleEmployeeSelection(employee.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </div>
                        
                        {isSelected && selectedData && (
                          <div className="space-y-3 pt-3 border-t">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Hari Kerja</Label>
                                <Input
                                  type="number"
                                  value={selectedData.hariKerja}
                                  onChange={(e) => employee.id && updateEmployeePayroll(employee.id, 'hariKerja', parseInt(e.target.value) || 0)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Overtime Legacy (Jam)</Label>
                                <Input
                                  type="number"
                                  value={selectedData.overtimeHours}
                                  onChange={(e) => employee.id && updateEmployeePayroll(employee.id, 'overtimeHours', parseInt(e.target.value) || 0)}
                                  className="h-8 text-sm"
                                  placeholder="Kosongkan untuk pakai sistem baru"
                                />
                              </div>
                            </div>
                            
                            {/* New Detailed Overtime System */}
                            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <Label className="text-sm font-semibold text-blue-800">
                                  Perhitungan Lembur Detail
                                </Label>
                              </div>
                              
                              {/* Display Hourly Rate */}
                              <div className="p-2 bg-white rounded border text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Rate per jam (Gaji pokok/173):</span>
                                  <span className="font-semibold text-blue-700">
                                    Rp {formatCurrency(selectedData.overtimeDetail.customHourlyRate || Math.round((employee.kontrakUpahHarian * 22) / 173))}
                                  </span>
                                </div>
                              </div>
                              
                              <Tabs defaultValue="normal" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 h-8">
                                  <TabsTrigger value="normal" className="text-xs">Normal</TabsTrigger>
                                  <TabsTrigger value="holiday" className="text-xs">Libur</TabsTrigger>
                                  <TabsTrigger value="night" className="text-xs">Malam</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="normal" className="space-y-2 mt-2">
                                  <div>
                                    <Label className="text-xs text-green-700">Lembur Normal (1.5x)</Label>
                                    <div className="text-xs text-gray-600 mb-1">Hari kerja biasa</div>
                                    <Input
                                      type="number"
                                      value={selectedData.overtimeDetail.normalHours}
                                      onChange={(e) => employee.id && updateEmployeeOvertimeDetail(employee.id, 'normalHours', parseInt(e.target.value) || 0)}
                                      className="h-8 text-sm"
                                      placeholder="Jam lembur normal"
                                    />
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="holiday" className="space-y-2 mt-2">
                                  <div>
                                    <Label className="text-xs text-red-700">Lembur Hari Libur (2x)</Label>
                                    <div className="text-xs text-gray-600 mb-1">Minggu/tanggal merah/libur nasional</div>
                                    <Input
                                      type="number"
                                      value={selectedData.overtimeDetail.holidayHours}
                                      onChange={(e) => employee.id && updateEmployeeOvertimeDetail(employee.id, 'holidayHours', parseInt(e.target.value) || 0)}
                                      className="h-8 text-sm"
                                      placeholder="Jam lembur hari libur"
                                    />
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="night" className="space-y-2 mt-2">
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-xs text-purple-700">Lembur Malam - Jam Pertama (1.5x)</Label>
                                      <div className="text-xs text-gray-600 mb-1">Maksimal 1 jam</div>
                                      <Input
                                        type="number"
                                        max="1"
                                        value={selectedData.overtimeDetail.nightFirstHour}
                                        onChange={(e) => employee.id && updateEmployeeOvertimeDetail(employee.id, 'nightFirstHour', Math.min(parseInt(e.target.value) || 0, 1))}
                                        className="h-8 text-sm"
                                        placeholder="0 atau 1 jam"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-purple-700">Lembur Malam - Jam Berikutnya (2x)</Label>
                                      <div className="text-xs text-gray-600 mb-1">Setelah jam pertama</div>
                                      <Input
                                        type="number"
                                        value={selectedData.overtimeDetail.nightAdditionalHours}
                                        onChange={(e) => employee.id && updateEmployeeOvertimeDetail(employee.id, 'nightAdditionalHours', parseInt(e.target.value) || 0)}
                                        className="h-8 text-sm"
                                        placeholder="Jam tambahan malam"
                                      />
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                              
                              {/* Custom Hourly Rate */}
                              <div>
                                <Label className="text-xs text-orange-700">Custom Rate per Jam (Opsional)</Label>
                                <div className="text-xs text-gray-600 mb-1">Kosongkan untuk menggunakan rate otomatis</div>
                                <Input
                                  type="number"
                                  value={selectedData.overtimeDetail.customHourlyRate || ''}
                                  onChange={(e) => employee.id && updateEmployeeOvertimeDetail(employee.id, 'customHourlyRate', parseInt(e.target.value) || 0)}
                                  className="h-8 text-sm"
                                  placeholder={`Default: ${formatCurrency(Math.round((employee.kontrakUpahHarian * 22) / 173))}`}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Cashbon</Label>
                              <Input
                                type="number"
                                value={selectedData.cashbon}
                                onChange={(e) => employee.id && updateEmployeePayroll(employee.id, 'cashbon', parseInt(e.target.value) || 0)}
                                className="h-8 text-sm"
                                placeholder="0"
                              />
                            </div>
                            
                            {/* Component Selection */}
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold">Komponen Gaji</Label>
                              
                              {/* Standard Components */}
                              {standardComponents.length > 0 && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-blue-600">Komponen Standar</Label>
                                  <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {standardComponents.map((comp) => (
                                      <div key={comp.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`std-${employee.id}-${comp.id}`}
                                          checked={selectedData.selectedStandardComponents?.includes(comp.id) || false}
                                          onChange={(e) => {
                                            const currentSelected = selectedData.selectedStandardComponents || []
                                            const newSelected = e.target.checked
                                              ? [...currentSelected, comp.id]
                                              : currentSelected.filter(id => id !== comp.id)
                                            employee.id && updateEmployeePayroll(employee.id, 'selectedStandardComponents', newSelected)
                                          }}
                                          className="h-3 w-3 text-blue-600 rounded"
                                        />
                                        <Label htmlFor={`std-${employee.id}-${comp.id}`} className="text-xs cursor-pointer">
                                          {comp.nama}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Additional Components */}
                              {additionalComponents.length > 0 && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-orange-600">Komponen Tambahan</Label>
                                  <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {additionalComponents.map((comp) => (
                                      <div key={comp.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`add-${employee.id}-${comp.id}`}
                                          checked={selectedData.selectedAdditionalComponents?.includes(comp.id) || false}
                                          onChange={(e) => {
                                            const currentSelected = selectedData.selectedAdditionalComponents || []
                                            const newSelected = e.target.checked
                                              ? [...currentSelected, comp.id]
                                              : currentSelected.filter(id => id !== comp.id)
                                            employee.id && updateEmployeePayroll(employee.id, 'selectedAdditionalComponents', newSelected)
                                          }}
                                          className="h-3 w-3 text-orange-600 rounded"
                                        />
                                        <Label htmlFor={`add-${employee.id}-${comp.id}`} className="text-xs cursor-pointer">
                                          {comp.nama}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Real-time Calculation Preview */}
                            {selectedData && (() => {
                              const calculation = calculateEmployeePayroll(selectedData)
                              return calculation ? (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                                  <Label className="text-xs font-semibold text-green-700">Kalkulasi Real-time</Label>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-600">Upah Dasar:</span>
                                      <span className="ml-2 font-semibold">{formatCurrency(calculation.baseUpah)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Uang Makan:</span>
                                      <span className="ml-2 font-semibold">{formatCurrency(calculation.uangMakan)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Uang BBM:</span>
                                      <span className="ml-2 font-semibold">{formatCurrency(calculation.uangBbm)}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-gray-600">Overtime Total:</span>
                                      <span className="ml-2 font-semibold">{formatCurrency(calculation.overtimeAmount)}</span>
                                      {calculation.overtimeDetail && (calculation.overtimeDetail.normalHours > 0 || calculation.overtimeDetail.holidayHours > 0 || calculation.overtimeDetail.nightFirstHour > 0 || calculation.overtimeDetail.nightAdditionalHours > 0) && (
                                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                                          {calculation.overtimeDetail.normalHours > 0 && (
                                            <div>• Normal {calculation.overtimeDetail.normalHours}h × {formatCurrency(calculation.overtimeDetail.hourlyRate)} × 1.5 = {formatCurrency(calculation.overtimeDetail.normalAmount)}</div>
                                          )}
                                          {calculation.overtimeDetail.holidayHours > 0 && (
                                            <div>• Libur {calculation.overtimeDetail.holidayHours}h × {formatCurrency(calculation.overtimeDetail.hourlyRate)} × 2 = {formatCurrency(calculation.overtimeDetail.holidayAmount)}</div>
                                          )}
                                          {calculation.overtimeDetail.nightFirstHour > 0 && (
                                            <div>• Malam 1 {calculation.overtimeDetail.nightFirstHour}h × {formatCurrency(calculation.overtimeDetail.hourlyRate)} × 1.5 = {formatCurrency(calculation.overtimeDetail.nightFirstAmount)}</div>
                                          )}
                                          {calculation.overtimeDetail.nightAdditionalHours > 0 && (
                                            <div>• Malam + {calculation.overtimeDetail.nightAdditionalHours}h × {formatCurrency(calculation.overtimeDetail.hourlyRate)} × 2 = {formatCurrency(calculation.overtimeDetail.nightAdditionalAmount)}</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {calculation.components
                                      .filter(comp => comp.amount > 0)
                                      .map((comp, idx) => (
                                        <div key={idx}>
                                          <span className={`text-${comp.tipe === 'EARNING' ? 'green' : 'red'}-600`}>
                                            {comp.nama}:
                                          </span>
                                          <span className="ml-2 font-semibold">
                                            {comp.tipe === 'DEDUCTION' ? '-' : ''}{formatCurrency(comp.amount)}
                                          </span>
                                        </div>
                                      ))
                                    }
                                    <div className="col-span-2 border-t pt-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Bruto:</span>
                                        <span className="font-semibold">{formatCurrency(calculation.bruto)}</span>
                                      </div>
                                      {calculation.pajakNominal > 0 && (
                                        <div className="flex justify-between text-red-600">
                                          <span>Pajak:</span>
                                          <span className="font-semibold">-{formatCurrency(calculation.pajakNominal)}</span>
                                        </div>
                                      )}
                                      {calculation.cashbon > 0 && (
                                        <div className="flex justify-between text-red-600">
                                          <span>Cashbon:</span>
                                          <span className="font-semibold">-{formatCurrency(calculation.cashbon)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-lg font-bold text-green-700 border-t pt-1">
                                        <span>NETO:</span>
                                        <span>{formatCurrency(calculation.neto)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            })()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              )}
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <Button onClick={nextStep} disabled={selectedEmployees.length === 0}>
                  Lanjutkan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Pay Components */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Langkah 4: Komponen Gaji
              </CardTitle>
              <CardDescription>
                Atur komponen tambahan untuk perhitungan gaji
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tax and Overtime Configuration */}
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Konfigurasi Pajak & Lembur</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTutorial(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tutorial
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Tax Configuration */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-800">Konfigurasi Pajak</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Setup komponen pajak untuk perhitungan gaji
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => addQuickTaxComponent()}
                      >
                        + Setup Pajak Cepat
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Overtime Configuration */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-800">Konfigurasi Lembur</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Setup komponen lembur/overtime untuk perhitungan
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-green-600 hover:bg-green-700"
                        onClick={() => addQuickOvertimeComponent()}
                      >
                        + Setup Lembur Cepat
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Existing Pay Components */}
              <div>
                <h4 className="font-medium mb-3">Komponen Gaji Standar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payComponents.filter(comp => comp.aktif).map((component) => (
                    <div key={component.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{component.nama}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          component.tipe === 'EARNING' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {component.tipe === 'EARNING' ? 'Pendapatan' : 'Potongan'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {component.metode} • {component.basis}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Pay Components */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Komponen Tambahan</h4>
                  <Button size="sm" onClick={addCustomPayComponent}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {customPayComponents.map((component, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Nama</Label>
                          <Input
                            value={component.nama}
                            onChange={(e) => updatePayComponent(index, 'nama', e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Nama komponen"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tipe</Label>
                          <Select value={component.tipe} onValueChange={(value) => updatePayComponent(index, 'tipe', value)}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EARNING">Pendapatan</SelectItem>
                              <SelectItem value="DEDUCTION">Potongan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Metode</Label>
                          <Select value={component.metode} onValueChange={(value) => updatePayComponent(index, 'metode', value)}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FLAT">Flat</SelectItem>
                              <SelectItem value="PER_HARI">Per Hari</SelectItem>
                              <SelectItem value="PERSENTASE">Persentase</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Nominal/Rate</Label>
                          <Input
                            type="number"
                            value={component.nominal || component.rate || 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              if (component.metode === 'FLAT') {
                                updatePayComponent(index, 'nominal', value)
                              } else {
                                updatePayComponent(index, 'rate', value)
                              }
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePayComponent(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <Button onClick={nextStep}>
                  Lanjutkan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Calculate Payroll */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Langkah 5: Hitung Payroll
              </CardTitle>
              <CardDescription>
                Review data dan hitung payroll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payroll Summary */}
              {(() => {
                const summary = getPayrollSummary()
                return (
                  <div className="space-y-6">
                    {/* Overall Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-700">{summary.employeeCount}</div>
                        <div className="text-sm text-blue-600">Karyawan</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-green-700">{formatCurrency(summary.totalBruto)}</div>
                        <div className="text-sm text-green-600">Total Bruto</div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-red-700">{formatCurrency(summary.totalDeductions)}</div>
                        <div className="text-sm text-red-600">Total Potongan</div>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-emerald-700">{formatCurrency(summary.totalNeto)}</div>
                        <div className="text-sm text-emerald-600">Total Neto</div>
                      </div>
                    </div>

                    {/* Detailed Employee Calculations */}
                    <div>
                      <h4 className="font-medium mb-3">Detail Perhitungan Per Karyawan</h4>
                      <div className="space-y-4">
                        {summary.calculations.map((calc, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="font-semibold">{calc!.employee.nama}</h5>
                              <Badge variant="outline">{calc!.hariKerja} hari kerja</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {/* Earnings */}
                              <div className="space-y-1">
                                <div className="font-medium text-green-700">PENDAPATAN</div>
                                <div className="flex justify-between">
                                  <span>Upah Dasar:</span>
                                  <span>{formatCurrency(calc!.baseUpah)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Uang Makan:</span>
                                  <span>{formatCurrency(calc!.uangMakan)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Uang BBM:</span>
                                  <span>{formatCurrency(calc!.uangBbm)}</span>
                                </div>
                                {calc!.overtimeAmount > 0 && (
                                  <div className="space-y-1">
                                  <div className="flex justify-between">
                                      <span>Overtime Total:</span>
                                    <span>{formatCurrency(calc!.overtimeAmount)}</span>
                                    </div>
                                    {calc!.overtimeDetail && (calc!.overtimeDetail.normalHours > 0 || calc!.overtimeDetail.holidayHours > 0 || calc!.overtimeDetail.nightFirstHour > 0 || calc!.overtimeDetail.nightAdditionalHours > 0) && (
                                      <div className="text-xs text-gray-500 space-y-1 ml-4">
                                        {calc!.overtimeDetail.normalHours > 0 && (
                                          <div>• Normal: {calc!.overtimeDetail.normalHours}h × {formatCurrency(calc!.overtimeDetail.hourlyRate)} × 1.5 = {formatCurrency(calc!.overtimeDetail.normalAmount)}</div>
                                        )}
                                        {calc!.overtimeDetail.holidayHours > 0 && (
                                          <div>• Libur: {calc!.overtimeDetail.holidayHours}h × {formatCurrency(calc!.overtimeDetail.hourlyRate)} × 2 = {formatCurrency(calc!.overtimeDetail.holidayAmount)}</div>
                                        )}
                                        {calc!.overtimeDetail.nightFirstHour > 0 && (
                                          <div>• Malam 1: {calc!.overtimeDetail.nightFirstHour}h × {formatCurrency(calc!.overtimeDetail.hourlyRate)} × 1.5 = {formatCurrency(calc!.overtimeDetail.nightFirstAmount)}</div>
                                        )}
                                        {calc!.overtimeDetail.nightAdditionalHours > 0 && (
                                          <div>• Malam +: {calc!.overtimeDetail.nightAdditionalHours}h × {formatCurrency(calc!.overtimeDetail.hourlyRate)} × 2 = {formatCurrency(calc!.overtimeDetail.nightAdditionalAmount)}</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {calc!.components
                                  .filter(comp => comp.tipe === 'EARNING' && comp.amount > 0)
                                  .map((comp, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{comp.nama}:</span>
                                      <span>{formatCurrency(comp.amount)}</span>
                                    </div>
                                  ))
                                }
                              </div>

                              {/* Deductions */}
                              <div className="space-y-1">
                                <div className="font-medium text-red-700">POTONGAN</div>
                                {calc!.pajakNominal > 0 && (
                                  <div className="flex justify-between">
                                    <span>Pajak:</span>
                                    <span>{formatCurrency(calc!.pajakNominal)}</span>
                                  </div>
                                )}
                                {calc!.cashbon > 0 && (
                                  <div className="flex justify-between">
                                    <span>Cashbon:</span>
                                    <span>{formatCurrency(calc!.cashbon)}</span>
                                  </div>
                                )}
                                {calc!.components
                                  .filter(comp => comp.tipe === 'DEDUCTION' && comp.amount > 0)
                                  .map((comp, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{comp.nama}:</span>
                                      <span>{formatCurrency(comp.amount)}</span>
                                    </div>
                                  ))
                                }
                              </div>

                              {/* Summary */}
                              <div className="md:col-span-2 space-y-1">
                                <div className="font-medium text-gray-700">RINGKASAN</div>
                                <div className="flex justify-between">
                                  <span>Total Bruto:</span>
                                  <span className="font-semibold">{formatCurrency(calc!.bruto)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Potongan:</span>
                                  <span className="font-semibold text-red-600">-{formatCurrency(calc!.totalDeductions)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                  <span>GAJI BERSIH:</span>
                                  <span className="text-green-700">{formatCurrency(calc!.neto)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Period Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Ringkasan Periode</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Periode:</strong> {payrollPeriod.periodeAwal} - {payrollPeriod.periodeAkhir}</div>
                    <div><strong>Karyawan:</strong> {selectedEmployees.length} orang</div>
                          <div><strong>Komponen Standar:</strong> {standardComponents.length} item</div>
                          <div><strong>Komponen Tambahan:</strong> {additionalComponents.length} item</div>
                          <div><strong>Komponen Custom:</strong> {customPayComponents.filter(c => c.nama).length} item</div>
                  </div>
                </div>
                
                <div>
                        <h4 className="font-medium mb-3">Komponen yang Digunakan</h4>
                        <div className="space-y-2 text-sm">
                          {[...standardComponents, ...additionalComponents, ...customPayComponents.filter(c => c.nama)]
                            .filter(comp => selectedEmployees.some(emp => 
                              emp.selectedStandardComponents.includes(comp.id!) || 
                              emp.selectedAdditionalComponents.includes(comp.id!) || 
                              customPayComponents.includes(comp as PayComponentForm)
                            ))
                            .map((comp, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{comp.nama}</span>
                                <Badge variant={comp.tipe === 'EARNING' ? 'default' : 'destructive'}>
                                  {comp.tipe === 'EARNING' ? 'Pendapatan' : 'Potongan'}
                                </Badge>
                        </div>
                            ))
                          }
                  </div>
                </div>
              </div>
                  </div>
                )
              })()}
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <Button onClick={calculatePayroll}>
                  Hitung Payroll
                  <Calculator className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Generate Payroll */}
        {currentStep === 6 && (
          console.log('🎯 Step 6: Generate Payroll is being rendered'),
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Langkah 6: Generate Payroll
              </CardTitle>
              <CardDescription>
                Buat payroll dan laporan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Calculator className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-medium mb-2">Siap untuk Generate Payroll</h3>
                <p className="text-muted-foreground mb-6">
                  Payroll akan dibuat dengan data yang telah diinput dan kwitansi akan dibuat otomatis setelah disetujui
                </p>
                
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log('🎯 Generate Payroll button clicked')
                      generatePayroll()
                    }} 
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Generate Payroll
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payroll Results */}
      {currentPayrollRun && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Hasil Payroll - {currentPayrollRun.periodeAwal} sampai {currentPayrollRun.periodeAkhir}
                </CardTitle>
                <CardDescription>
                  {currentPayrollRun.payrollLines?.length || 0} karyawan • 
                  Total: {formatCurrency(calculatePayrollRunTotal(currentPayrollRun))}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(currentPayrollRun.status)}
                {currentPayrollRun.status === 'DRAFT' && (
                  <Button 
                    onClick={approvePayroll}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Setujui & Buat Kwitansi
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => generatePayrollReports('laporan')}>
                  <Download className="h-4 w-4 mr-2" />
                    Laporan PDF
                  </Button>
                  <Button variant="outline" onClick={() => generatePayrollReports('kwitansi')}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Kwitansi PDF
                </Button>
                  <Button 
                    variant="default" 
                    onClick={() => generatePayrollReports('both')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Laporan + Kwitansi
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPayrollRun(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Tutup
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPayrollRun.payrollLines?.map((line) => (
                <div key={line.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{line.employeeName || line.employee?.nama || 'Unknown Employee'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {line.hariKerja} hari • Bruto: {formatCurrency(calculateLineBruto(line))} • Neto: {formatCurrency(calculateLineNeto(line))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {currentPayrollRun.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Navigate to kwitansi page with pre-filled data
                          const kwitansiData = {
                            nomorKwitansi: `KW-${currentPayrollRun.id?.slice(-6)}-${line.employeeId?.slice(-4)}-001`,
                            tanggal: new Date().toISOString().split('T')[0],
                            namaPenerima: line.employeeName,
                            jumlahUang: line.neto.toString(),
                            untukPembayaran: `Gaji Karyawan ${line.employeeName} untuk periode ${currentPayrollRun.periodeAwal} - ${currentPayrollRun.periodeAkhir}`,
                            namaPembayar: 'PT. GLOBAL LESTARI ALAM',
                            nomorRekening: line.employee?.bankAccount || '',
                            namaRekening: line.employeeName,
                            bankName: line.employee?.bankName || 'BRI',
                            transferMethod: 'Transfer ke rekening',
                            tempat: 'Sawahlunto',
                            tanggalKwitansi: new Date().toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            }),
                            signatureName: 'ATIKA DEWI SURYANI',
                            signaturePosition: 'Accounting',
                            materai: ''
                          }
                          
                          localStorage.setItem('autoKwitansiData', JSON.stringify(kwitansiData))
                          window.open('/kwitansi', '_blank')
                        }}
                      >
                        <Receipt className="h-4 w-4 mr-1" />
                        Lihat Kwitansi
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Save Button - Show when there's data to save */}
      {selectedEmployees.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {/* Last saved indicator */}
          {lastSavedData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs max-w-xs">
              <div className="flex items-center gap-1 text-green-700 font-medium mb-1">
                <CheckCircle className="h-3 w-3" />
                Tersimpan
              </div>
              <div className="text-green-600">
                <div className="truncate">{lastSavedData.fileName}</div>
                <div>{lastSavedData.employeeCount} karyawan • {formatCurrency(lastSavedData.totalAmount)}</div>
                <div className="text-green-500">
                  {new Date(lastSavedData.timestamp).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {/* Floating action buttons section - buttons removed per user request */}
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Save Payroll Data
              </DialogTitle>
              <DialogDescription>
                Simpan data payroll dengan nama file dan catatan custom
              </DialogDescription>
            </DialogHeader>
            
            <SaveDialogForm 
              currentFileName={payrollPeriod.customFileName}
              currentNotes={payrollPeriod.notes}
              employeeCount={selectedEmployees.length}
              totalAmount={selectedEmployees.length > 0 ? selectedEmployees.map(emp => calculateEmployeePayroll(emp)).reduce((sum, calc) => sum + calc.neto, 0) : 0}
              onSave={saveWithSettings}
              onCancel={() => setShowSaveDialog(false)}
              isLoading={savingData}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Rename File Dialog */}
      {showRenameDialog && (
        <Dialog open={!!showRenameDialog} onOpenChange={() => setShowRenameDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Rename Payroll File
              </DialogTitle>
              <DialogDescription>
                Ubah nama file dan catatan untuk payroll ini
              </DialogDescription>
            </DialogHeader>
            
            <RenameDialogForm 
              payrollRun={showRenameDialog.payrollRun}
              currentFileName={showRenameDialog.currentName}
              onRename={renamePayrollFile}
              onCancel={() => setShowRenameDialog(null)}
              isLoading={renamingFile}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Payroll
          </CardTitle>
          <CardDescription>
            Daftar payroll yang pernah dibuat
          </CardDescription>
            </div>
            <Button
              variant="outline" 
              size="sm"
              onClick={refreshPayrollData}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payrollRuns.length === 0 ? (
              <div className="space-y-6">
                {/* Empty State Message */}
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-4">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada Payroll Run</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Buat payroll run pertama Anda untuk melihat menu actions dan fitur PDF
                  </p>
                  <Button 
                    onClick={() => setCurrentStep(1)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Payroll Baru
                  </Button>
                </div>

                {/* Quick Actions Panel - Menu Actions yang Selalu Tersedia */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">🚀 Quick Actions</h4>
                    <p className="text-sm text-blue-700">
                      Akses cepat ke fitur-fitur penting meskipun belum ada payroll
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Create New Payroll */}
                    <div className="bg-white p-4 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Plus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Buat Payroll Baru</h5>
                          <p className="text-xs text-gray-600">Mulai dari awal</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => setCurrentStep(1)}
                      >
                        Mulai
                      </Button>
                    </div>

                    {/* Employee Management */}
                    <div className="bg-white p-4 rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Kelola Karyawan</h5>
                          <p className="text-xs text-gray-600">Tambah/edit data</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => setCurrentStep(2)}
                      >
                        Kelola
                      </Button>
                    </div>

                    {/* Pay Components */}
                    <div className="bg-white p-4 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Settings className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Komponen Gaji</h5>
                          <p className="text-xs text-gray-600">Setup komponen</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                        onClick={() => setShowComponentDialog(true)}
                      >
                        Setup
                      </Button>
                    </div>

                    {/* PDF Templates */}
                    <div className="bg-white p-4 rounded-lg border border-orange-200 hover:border-orange-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Template PDF</h5>
                          <p className="text-xs text-gray-600">Preview format</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          setShowPDFConfigDialog(true)
                          setSelectedPayrollForPDF(null) // No specific payroll
                        }}
                      >
                        Preview
                      </Button>
                    </div>

                    {/* Import Data */}
                    <div className="bg-white p-4 rounded-lg border border-teal-200 hover:border-teal-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Download className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Import Data</h5>
                          <p className="text-xs text-gray-600">Excel/CSV</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full border-teal-300 text-teal-700 hover:bg-teal-50"
                        onClick={() => setShowImportDialog(true)}
                      >
                        Import
                      </Button>
                    </div>

                    {/* Help & Tutorial */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <HelpCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Bantuan</h5>
                          <p className="text-xs text-gray-600">Tutorial & FAQ</p>
                        </div>
                        </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowHelpDialog(true)}
                      >
                        Bantuan
                      </Button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 p-4 bg-blue-100 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">💡 Tips untuk Memulai:</p>
                        <ul className="space-y-1 text-blue-700">
                          <li>• Pastikan data karyawan sudah lengkap dan aktif</li>
                          <li>• Setup komponen gaji sesuai kebijakan perusahaan</li>
                          <li>• Test generate PDF untuk memastikan format sesuai</li>
                          <li>• Simpan payroll run untuk akses menu actions lengkap</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              payrollRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">
                    {run.customFileName || `Payroll ${run.periodeAwal} - ${run.periodeAkhir}`}
                  </span>
                  <div className="text-sm text-muted-foreground">
                    Periode: {run.periodeAwal} - {run.periodeAkhir} • 
                    {run.payrollLines?.length || 0} karyawan • 
                    Total: {formatCurrency(calculatePayrollRunTotal(run))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 space-y-1">
                    <div>Dibuat: {run.createdAt ? new Date(run.createdAt).toLocaleString('id-ID') : '-'}</div>
                    {run.updatedAt && run.updatedAt !== run.createdAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Terakhir diubah: {new Date(run.updatedAt).toLocaleString('id-ID')}
                </div>
                    )}
                  </div>
                  {run.notes && (
                    <div className="text-xs text-gray-500 mt-1">
                      📝 {run.notes}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(run.status)}
                  
                  {/* Primary Actions - Clean Icons */}
                  <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                      onClick={() => viewPayrollRun(run)}
                      title="Lihat Detail"
                  >
                      <FileText className="h-4 w-4" />
                  </Button>
                  
                    {run.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editPayrollRun(run)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit Payroll"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" title="More Actions">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setShowRenameDialog({
                        payrollRun: run,
                        currentName: run.customFileName || `Payroll ${run.periodeAwal} - ${run.periodeAkhir}`
                      })}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename File
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => generatePayrollRecap(run)}>
                        <FileText className="h-4 w-4 mr-2" />
                        PDF Recap
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => exportToExcel(run)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => exportToPDF(run)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF Detail
                        </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => generateCompletePayrollPDF(run)}>
                        <Receipt className="h-4 w-4 mr-2" />
                        PDF Lengkap + Kwitansi
                        </DropdownMenuItem>
                  
                                            <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog({
                      type: 'payrollRun',
                      id: run.id!,
                          name: run.customFileName || `Payroll ${run.periodeAwal} - ${run.periodeAkhir}`,
                          status: run.status
                        })}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      
                      {/* Individual Kwitansi untuk 5 karyawan pertama */}
                      {run.payrollLines && run.payrollLines.length > 0 && (
                        <>
                          <div className="border-t my-1"></div>
                          <div className="px-2 py-1 text-xs font-medium text-gray-500">Kwitansi Individual:</div>
                          {run.payrollLines.slice(0, 5).map((line: any) => (
                            <DropdownMenuItem 
                              key={line.id}
                              onClick={() => generateEmployeeKwitansi(run, line.employeeId)}
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              {line.employeeName || 'Unknown'}
                            </DropdownMenuItem>
                          ))}
                          {run.payrollLines.length > 5 && (
                            <div className="px-2 py-1 text-xs text-gray-500">
                              +{run.payrollLines.length - 5} lainnya
                            </div>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {showDeleteDialog?.name}?
              {showDeleteDialog?.type === 'payComponent' && (
                <div className="mt-2 text-sm">
                  <p><strong>Soft Delete:</strong> Komponen akan dinonaktifkan (masih dapat diaktifkan kembali)</p>
                  <p><strong>Hard Delete:</strong> Komponen akan dihapus permanen (tidak dapat dikembalikan)</p>
                </div>
              )}
              {showDeleteDialog?.type === 'payrollRun' && showDeleteDialog?.status !== 'DRAFT' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">⚠️ PERINGATAN PENTING!</p>
                  <p className="text-sm text-red-700 mt-1">
                    Payroll ini berstatus <strong>{showDeleteDialog.status}</strong>. 
                    Menghapus payroll yang sudah disetujui dapat mempengaruhi laporan keuangan dan audit.
                  </p>
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    Tindakan ini TIDAK DAPAT DIBATALKAN!
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Batal
            </Button>
            {showDeleteDialog?.type === 'payComponent' && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (showDeleteDialog) {
                    handleDeleteComponent(showDeleteDialog.id, false) // Soft delete
                }
              }}
            >
                Nonaktifkan
            </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={() => {
                if (showDeleteDialog) {
                  if (showDeleteDialog.type === 'payComponent') {
                    handleDeleteComponent(showDeleteDialog.id, true) // Hard delete
                  } else {
                    handleDeletePayrollRun(showDeleteDialog.id, true) // Hard delete
                  }
                }
              }}
            >
              {showDeleteDialog?.type === 'payComponent' 
                ? 'Hapus Permanen' 
                : showDeleteDialog?.status === 'DRAFT' 
                  ? 'Hapus Payroll' 
                  : 'HAPUS PERMANEN (BERBAHAYA)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Component Management Dialog */}
      <ComponentDialog 
        open={showComponentDialog}
        onOpenChange={setShowComponentDialog}
        componentType={componentType}
        editingComponent={editingComponent}
        onSave={editingComponent ? 
          (data) => handleUpdateComponent(editingComponent.id, data) : 
          handleCreateComponent
        }
        onCancel={() => {
          setShowComponentDialog(false)
          setEditingComponent(null)
        }}
      />

      {/* Quick Setup Dialog */}
      {showQuickSetupDialog && (
        <QuickSetupDialog
          type={showQuickSetupDialog}
          open={!!showQuickSetupDialog}
          onOpenChange={() => setShowQuickSetupDialog(null)}
          onSetup={handleQuickSetup}
        />
      )}

      {/* Tutorial Dialog */}
      {showTutorial && (
        <TutorialDialog
          open={showTutorial}
          onOpenChange={setShowTutorial}
        />
      )}

      {/* PDF Config Dialog */}
      {showPDFConfigDialog && (
        <Dialog open={showPDFConfigDialog} onOpenChange={setShowPDFConfigDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Konfigurasi PDF</DialogTitle>
              <DialogDescription>
                Preview dan konfigurasi template PDF untuk payroll
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Fitur PDF configuration akan segera tersedia. 
                Untuk sementara, Anda dapat menggunakan fitur export PDF yang sudah ada.
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowPDFConfigDialog(false)}>
                Tutup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Data</DialogTitle>
              <DialogDescription>
                Import data karyawan atau payroll dari file Excel/CSV
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Fitur import data akan segera tersedia. 
                Untuk sementara, Anda dapat menambahkan data karyawan secara manual.
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowImportDialog(false)}>
                Tutup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Help Dialog */}
      {showHelpDialog && (
        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bantuan & Tutorial</DialogTitle>
              <DialogDescription>
                Panduan penggunaan sistem payroll calculator
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🚀 Quick Start</h4>
                <p className="text-sm text-blue-700">
                  1. Buat payroll baru dengan mengklik "Buat Payroll Baru"<br/>
                  2. Kelola data karyawan di tab "Kelola Karyawan"<br/>
                  3. Setup komponen gaji sesuai kebutuhan<br/>
                  4. Hitung dan simpan payroll
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">💡 Tips</h4>
                <p className="text-sm text-green-700">
                  • Gunakan fitur auto-save untuk menyimpan perubahan otomatis<br/>
                  • Export ke PDF untuk laporan yang profesional<br/>
                  • Backup data secara berkala
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowHelpDialog(false)}>
                Tutup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Component Dialog for creating/editing pay components
interface ComponentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentType: 'standard' | 'additional'
  editingComponent: PayComponent | null
  onSave: (data: PayComponentForm) => void
  onCancel: () => void
}

function ComponentDialog({ 
  open, 
  onOpenChange, 
  componentType, 
  editingComponent, 
  onSave, 
  onCancel 
}: ComponentDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<PayComponentForm>({
    nama: '',
    tipe: 'EARNING',
    taxable: false,
    metode: 'FLAT',
    basis: 'UPAH_HARIAN',
    rate: undefined,
    nominal: undefined,
    capMin: undefined,
    capMax: undefined,
    order: 0
  })

  useEffect(() => {
    if (editingComponent) {
      setFormData({
        nama: editingComponent.nama,
        tipe: editingComponent.tipe as 'EARNING' | 'DEDUCTION',
        taxable: editingComponent.taxable,
        metode: editingComponent.metode as 'FLAT' | 'PER_HARI' | 'PERSENTASE',
        basis: editingComponent.basis as 'UPAH_HARIAN' | 'BRUTO' | 'HARI_KERJA',
        rate: editingComponent.rate || undefined,
        nominal: editingComponent.nominal || undefined,
        capMin: editingComponent.capMin || undefined,
        capMax: editingComponent.capMax || undefined,
        order: editingComponent.order
      })
    } else {
      setFormData({
        nama: '',
        tipe: 'EARNING',
        taxable: false,
        metode: 'FLAT',
        basis: 'UPAH_HARIAN',
        rate: undefined,
        nominal: undefined,
        capMin: undefined,
        capMax: undefined,
        order: 0
      })
    }
  }, [editingComponent, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nama.trim()) {
      toast({
        title: "Error",
        description: "Nama komponen wajib diisi",
        variant: "destructive"
      })
      return
    }

    // Validation based on method
    if (formData.metode === 'FLAT' && (formData.nominal === undefined || formData.nominal <= 0)) {
      toast({
        title: "Error", 
        description: "Nominal wajib diisi dan harus lebih dari 0 untuk metode FLAT",
        variant: "destructive"
      })
      return
    }

    if (['PER_HARI', 'PERSENTASE'].includes(formData.metode) && (formData.rate === undefined || formData.rate <= 0)) {
      toast({
        title: "Error",
        description: "Rate wajib diisi dan harus lebih dari 0 untuk metode PER_HARI atau PERSENTASE", 
        variant: "destructive"
      })
      return
    }

    // Clean the data - ensure numbers are properly set
    const cleanData = {
      ...formData,
      ...(formData.metode === 'FLAT' ? { rate: undefined } : { nominal: undefined })
    }

    onSave(cleanData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingComponent ? 'Edit' : 'Tambah'} Komponen {componentType === 'standard' ? 'Standar' : 'Tambahan'}
          </DialogTitle>
          <DialogDescription>
            {editingComponent ? 'Update' : 'Buat'} komponen gaji {componentType === 'standard' ? 'standar' : 'tambahan'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nama">Nama Komponen</Label>
            <Input
              id="nama"
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              placeholder="Contoh: Tunjangan Transport"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipe">Tipe</Label>
              <Select 
                value={formData.tipe} 
                onValueChange={(value: 'EARNING' | 'DEDUCTION') => 
                  setFormData(prev => ({ ...prev, tipe: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EARNING">Pendapatan</SelectItem>
                  <SelectItem value="DEDUCTION">Potongan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="metode">Metode</Label>
              <Select 
                value={formData.metode} 
                onValueChange={(value: 'FLAT' | 'PER_HARI' | 'PERSENTASE') => 
                  setFormData(prev => ({ ...prev, metode: value, rate: undefined, nominal: undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLAT">Nominal Tetap</SelectItem>
                  <SelectItem value="PER_HARI">Per Hari</SelectItem>
                  <SelectItem value="PERSENTASE">Persentase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="basis">Basis Perhitungan</Label>
            <Select 
              value={formData.basis} 
              onValueChange={(value: 'UPAH_HARIAN' | 'BRUTO' | 'HARI_KERJA') => 
                setFormData(prev => ({ ...prev, basis: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPAH_HARIAN">Upah Harian</SelectItem>
                <SelectItem value="BRUTO">Gaji Bruto</SelectItem>
                <SelectItem value="HARI_KERJA">Hari Kerja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.metode === 'FLAT' && (
            <div>
              <Label htmlFor="nominal">Nominal (Rp)</Label>
              <Input
                id="nominal"
                type="number"
                value={formData.nominal || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nominal: parseFloat(e.target.value) || undefined }))}
                placeholder="50000"
                required
              />
            </div>
          )}

          {['PER_HARI', 'PERSENTASE'].includes(formData.metode) && (
            <div>
              <Label htmlFor="rate">Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || undefined }))}
                placeholder="10"
                required
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="taxable"
              checked={formData.taxable}
              onChange={(e) => setFormData(prev => ({ ...prev, taxable: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="taxable">Kena Pajak</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit">
              {editingComponent ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Quick Setup Dialog Component
interface QuickSetupDialogProps {
  type: 'tax' | 'overtime'
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetup: (type: 'tax' | 'overtime', config: any) => void
}

function QuickSetupDialog({ type, open, onOpenChange, onSetup }: QuickSetupDialogProps) {
  const [config, setConfig] = useState<any>({
    name: type === 'tax' ? 'Pajak Penghasilan' : 'Lembur/Overtime',
    rate: type === 'tax' ? 2 : 150,
    basis: type === 'tax' ? 'BRUTO' : 'UPAH_HARIAN',
    method: 'PERSENTASE',
    taxable: type === 'overtime',
    minAmount: '',
    maxAmount: '',
    amount: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSetup(type, {
      ...config,
      rate: config.method === 'PERSENTASE' ? Number(config.rate) : undefined,
      amount: config.method === 'FLAT' ? Number(config.amount) : undefined,
      minAmount: config.minAmount ? Number(config.minAmount) : undefined,
      maxAmount: config.maxAmount ? Number(config.maxAmount) : undefined
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'tax' ? 'Setup Komponen Pajak' : 'Setup Komponen Lembur'}
          </DialogTitle>
          <DialogDescription>
            {type === 'tax' 
              ? 'Konfigurasi komponen pajak untuk perhitungan gaji karyawan'
              : 'Konfigurasi komponen lembur/overtime untuk perhitungan gaji karyawan'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nama Komponen</Label>
            <Input
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder={type === 'tax' ? 'Pajak Penghasilan' : 'Lembur/Overtime'}
            />
          </div>

          <div>
            <Label>Metode Perhitungan</Label>
            <Select 
              value={config.method} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, method: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSENTASE">Persentase</SelectItem>
                <SelectItem value="FLAT">Nominal Tetap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.method === 'PERSENTASE' ? (
            <>
              <div>
                <Label>Persentase (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.rate}
                  onChange={(e) => setConfig(prev => ({ ...prev, rate: e.target.value }))}
                  placeholder={type === 'tax' ? '2' : '150'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {type === 'tax' 
                    ? 'Contoh: 2 untuk pajak 2%'
                    : 'Contoh: 150 untuk lembur 150% (1.5x)'
                  }
                </p>
              </div>

              <div>
                <Label>Basis Perhitungan</Label>
                <Select 
                  value={config.basis} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, basis: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPAH_HARIAN">Upah Harian</SelectItem>
                    <SelectItem value="BRUTO">Gaji Bruto</SelectItem>
                    <SelectItem value="HARI_KERJA">Hari Kerja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div>
              <Label>Nominal Tetap (Rp)</Label>
              <Input
                type="number"
                value={config.amount}
                onChange={(e) => setConfig(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="50000"
              />
            </div>
          )}

          {type === 'overtime' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="taxable"
                checked={config.taxable}
                onChange={(e) => setConfig(prev => ({ ...prev, taxable: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="taxable">Kena Pajak</Label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Minimal (Opsional)</Label>
              <Input
                type="number"
                value={config.minAmount}
                onChange={(e) => setConfig(prev => ({ ...prev, minAmount: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Maksimal (Opsional)</Label>
              <Input
                type="number"
                value={config.maxAmount}
                onChange={(e) => setConfig(prev => ({ ...prev, maxAmount: e.target.value }))}
                placeholder="Tanpa batas"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">
              Tambah Komponen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Tutorial Dialog Component
interface TutorialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function TutorialDialog({ open, onOpenChange }: TutorialDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-800">Selamat Datang di Tutorial Pajak & Lembur</h3>
            <p className="text-gray-700">
              Tutorial ini akan memandu Anda untuk mengatur komponen pajak dan lembur dalam sistem payroll. 
              Dengan pengaturan yang tepat, Anda dapat menghitung gaji karyawan secara akurat sesuai kebijakan perusahaan.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Yang akan Anda pelajari:</h4>
              <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
                <li>Cara mengatur komponen pajak dengan persentase atau nominal tetap</li>
                <li>Konfigurasi lembur/overtime dengan berbagai metode perhitungan</li>
                <li>Pengaturan basis perhitungan (upah harian, bruto, hari kerja)</li>
                <li>Tips dan best practices untuk payroll yang akurat</li>
              </ul>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-800">1. Pengaturan Komponen Pajak</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Jenis Pajak yang Umum:</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-400 pl-3">
                  <p className="font-medium">PPh 21 (Pajak Penghasilan)</p>
                  <p className="text-sm text-gray-600">Biasanya 5% dari penghasilan bruto karyawan</p>
                </div>
                <div className="border-l-4 border-green-400 pl-3">
                  <p className="font-medium">BPJS Kesehatan</p>
                  <p className="text-sm text-gray-600">1% dari gaji (ditanggung karyawan)</p>
                </div>
                <div className="border-l-4 border-orange-400 pl-3">
                  <p className="font-medium">BPJS Ketenagakerjaan</p>
                  <p className="text-sm text-gray-600">2% dari gaji (ditanggung karyawan)</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tips:</strong> Selalu sesuaikan persentase pajak dengan regulasi terbaru dari pemerintah
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-800">2. Metode Perhitungan Pajak</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Metode Persentase</h4>
                <p className="text-sm text-gray-700 mb-2">Pajak dihitung berdasarkan persentase dari basis perhitungan</p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-600">Contoh:</p>
                  <p className="text-sm">Gaji Bruto: Rp 5,000,000</p>
                  <p className="text-sm">PPh 21 (5%): Rp 250,000</p>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Metode Nominal Tetap</h4>
                <p className="text-sm text-gray-700 mb-2">Pajak dengan nominal yang sama untuk semua karyawan</p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-600">Contoh:</p>
                  <p className="text-sm">Iuran Koperasi: Rp 50,000</p>
                  <p className="text-sm">Asuransi Tambahan: Rp 25,000</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Basis Perhitungan</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li><strong>Upah Harian:</strong> Berdasarkan upah harian × hari kerja</li>
                <li><strong>Gaji Bruto:</strong> Berdasarkan total pendapatan (upah + tunjangan)</li>
                <li><strong>Hari Kerja:</strong> Berdasarkan jumlah hari kerja dalam periode</li>
              </ul>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-800">3. Pengaturan Lembur/Overtime</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Regulasi Lembur di Indonesia:</h4>
              <div className="space-y-2 text-sm text-green-700">
                <p>• <strong>Jam Kerja Normal:</strong> 8 jam/hari atau 40 jam/minggu</p>
                <p>• <strong>Lembur 1 jam pertama:</strong> 1.5x upah normal</p>
                <p>• <strong>Lembur jam kedua dan seterusnya:</strong> 2x upah normal</p>
                <p>• <strong>Lembur hari libur:</strong> 2x upah normal (8 jam pertama), 3x upah normal (jam berikutnya)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Contoh Perhitungan</h4>
                <div className="text-sm space-y-1">
                  <p>Upah Harian: Rp 200,000</p>
                  <p>Upah per Jam: Rp 25,000</p>
                  <p>Lembur 2 jam:</p>
                  <p className="ml-2">• 1 jam × 1.5 = Rp 37,500</p>
                  <p className="ml-2">• 1 jam × 2.0 = Rp 50,000</p>
                  <p className="font-medium">Total Lembur: Rp 87,500</p>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Pengaturan Sistem</h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p>• <strong>Rate 150%:</strong> Untuk jam lembur standar</p>
                  <p>• <strong>Rate 200%:</strong> Untuk jam lembur tambahan</p>
                  <p>• <strong>Basis:</strong> Gunakan "Upah Harian" untuk perhitungan per jam</p>
                  <p>• <strong>Taxable:</strong> Centang jika lembur kena pajak</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-800">4. Setup Praktis dengan Quick Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Setup Pajak Cepat
                </h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>1. Klik tombol "Setup Pajak Cepat"</p>
                  <p>2. Isi nama komponen (misal: "PPh 21")</p>
                  <p>3. Pilih metode: Persentase atau Nominal</p>
                  <p>4. Set rate (misal: 5 untuk 5%)</p>
                  <p>5. Pilih basis perhitungan</p>
                  <p>6. Klik "Tambah Komponen"</p>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Setup Lembur Cepat
                </h4>
                <div className="space-y-2 text-sm text-green-700">
                  <p>1. Klik tombol "Setup Lembur Cepat"</p>
                  <p>2. Isi nama (misal: "Lembur Weekday")</p>
                  <p>3. Pilih metode perhitungan</p>
                  <p>4. Set rate (misal: 150 untuk 1.5x)</p>
                  <p>5. Tentukan apakah kena pajak</p>
                  <p>6. Set batas minimal/maksimal (opsional)</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">💡 Tips Pro:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Buat komponen terpisah untuk berbagai jenis lembur (weekday, weekend, holiday)</li>
                <li>• Gunakan batas maksimal untuk mengontrol budget lembur</li>
                <li>• Set komponen pajak dengan basis "BRUTO" untuk perhitungan yang komprehensif</li>
                <li>• Selalu test dengan data sampel sebelum payroll sesungguhnya</li>
              </ul>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-800">5. Selesai! 🎉</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Anda telah menyelesaikan tutorial!</h4>
              <p className="text-green-700 mb-3">
                Sekarang Anda dapat mengatur komponen pajak dan lembur dengan mudah menggunakan sistem payroll.
              </p>
              <div className="bg-white p-3 rounded border border-green-200">
                <h5 className="font-medium text-green-800 mb-2">Langkah Selanjutnya:</h5>
                <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                  <li>Setup komponen pajak sesuai kebijakan perusahaan</li>
                  <li>Konfigurasi komponen lembur untuk berbagai skenario</li>
                  <li>Test perhitungan dengan data karyawan sampel</li>
                  <li>Jalankan payroll dengan komponen yang sudah dikonfigurasi</li>
                </ol>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Butuh Bantuan Lebih Lanjut?</h4>
              <p className="text-sm text-blue-700">
                Anda dapat mengakses tutorial ini kapan saja dengan mengklik tombol "Tutorial" 
                di bagian Konfigurasi Pajak & Lembur.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Tutorial: Pengaturan Pajak & Lembur
          </DialogTitle>
          <DialogDescription>
            Pelajari cara mengonfigurasi komponen pajak dan lembur untuk perhitungan payroll yang akurat
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {currentStep} dari {totalSteps}
          </span>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            ← Sebelumnya
          </Button>
          
          <div className="flex gap-2">
            {currentStep === totalSteps ? (
              <Button onClick={() => onOpenChange(false)} className="bg-green-600 hover:bg-green-700">
                Selesai Tutorial
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Selanjutnya →
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Import Data Dialog Component
function ImportDataDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [importType, setImportType] = useState<'employees' | 'payComponents' | 'payrollData'>('employees')
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'text/csv') {
        setFile(selectedFile)
        toast({
          title: "File Selected",
          description: `${selectedFile.name} berhasil dipilih untuk import`,
          variant: "default"
        })
      } else {
        toast({
          title: "File Type Error",
          description: "Hanya file Excel (.xlsx) atau CSV yang didukung",
          variant: "destructive"
        })
      }
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Pilih file terlebih dahulu",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Import Berhasil",
        description: `Data ${importType} berhasil diimport dari ${file.name}`,
        variant: "default"
      })
      
      onOpenChange(false)
      setFile(null)
    } catch (error) {
      toast({
        title: "Import Gagal",
        description: "Terjadi kesalahan saat import data",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Import data dari file Excel atau CSV ke sistem
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Import Type Selection */}
          <div className="space-y-2">
            <Label>Jenis Data</Label>
            <Select value={importType} onValueChange={(value: any) => setImportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employees">Data Karyawan</SelectItem>
                <SelectItem value="payComponents">Komponen Gaji</SelectItem>
                <SelectItem value="payrollData">Data Payroll</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>File Excel/CSV</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="cursor-pointer">
                <Download className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : "Klik untuk pilih file atau drag & drop"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Support: .xlsx, .csv (Max 5MB)
                </p>
              </label>
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Download Template</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Download template Excel untuk format data yang benar
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                toast({
                  title: "Template Downloaded",
                  description: "Template Excel berhasil diunduh",
                  variant: "default"
                })
              }}
            >
              Download Template
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || isImporting}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import Data
              </>
              )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Help & Tutorial Dialog Component
function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<'tutorial' | 'faq' | 'contact'>('tutorial')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bantuan & Tutorial</DialogTitle>
          <DialogDescription>
            Panduan lengkap penggunaan sistem payroll calculator
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="contact">Kontak</TabsTrigger>
            </TabsList>

            {/* Tutorial Tab */}
            <TabsContent value="tutorial" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">🚀 Memulai Payroll Baru</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                    <li>Pilih periode payroll (tanggal awal dan akhir)</li>
                    <li>Pilih karyawan yang akan dihitung gajinya</li>
                    <li>Input hari kerja untuk setiap karyawan</li>
                    <li>Setup komponen gaji (standar dan tambahan)</li>
                    <li>Hitung payroll dan review hasil</li>
                    <li>Simpan payroll run</li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">📊 Generate PDF</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                    <li>Buka payroll run yang sudah disimpan</li>
                    <li>Klik menu actions (ikon Settings)</li>
                    <li>Pilih "PDF Lengkap + Slip Gaji"</li>
                    <li>Konfigurasi kop surat dan header image</li>
                    <li>Generate PDF</li>
                  </ol>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">👥 Kelola Karyawan</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-purple-700">
                    <li>Tambahkan data karyawan baru</li>
                    <li>Input informasi lengkap (NIK, bank, dll)</li>
                    <li>Set status aktif/nonaktif</li>
                    <li>Update data sesuai kebutuhan</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">❓ Bagaimana cara reset password?</h4>
                  <p className="text-sm text-gray-600">Hubungi admin sistem untuk reset password akun Anda.</p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">❓ Apakah data payroll bisa diedit setelah disimpan?</h4>
                  <p className="text-sm text-gray-600">Ya, data payroll dengan status DRAFT bisa diedit. Setelah REVIEWED atau APPROVED tidak bisa diedit.</p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">❓ Format file apa yang didukung untuk import?</h4>
                  <p className="text-sm text-gray-600">Sistem mendukung file Excel (.xlsx) dan CSV dengan ukuran maksimal 5MB.</p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">❓ Bagaimana cara generate slip gaji individual?</h4>
                  <p className="text-sm text-gray-600">Buka payroll run, klik menu actions, pilih "Generate Kwitansi" untuk karyawan tertentu.</p>
                </div>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">📞 Kontak Support</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span>📧 Email:</span>
                    <span className="font-medium">support@glacoal.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📱 WhatsApp:</span>
                    <span className="font-medium">+62 812-3456-7890</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🏢 Office:</span>
                    <span className="font-medium">PT. GLA COAL, Samarinda</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">🕒 Jam Kerja Support</h4>
                <p className="text-sm text-blue-700">
                  Senin - Jumat: 08:00 - 17:00 WITA<br/>
                  Sabtu: 08:00 - 12:00 WITA<br/>
                  Minggu & Hari Libur: Tutup
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
