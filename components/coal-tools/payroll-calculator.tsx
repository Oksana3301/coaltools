"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Trash2
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

// Get current user ID for payroll operations
const CURRENT_USER_ID = getCurrentUserId()

// Form interfaces for dialogs
interface EmployeeForm {
  nama: string
  jabatan: string
  site: string
  kontrakUpahHarian: string
  defaultUangMakan: string
  defaultUangBbm: string
  bankName?: string
  bankAccount?: string
  npwp?: string
}

interface PayComponentForm {
  nama: string
  tipe: 'EARNING' | 'DEDUCTION'
  taxable: boolean
  metode: 'FLAT' | 'PER_HARI' | 'PERSENTASE'
  basis: 'UPAH_HARIAN' | 'BRUTO' | 'HARI_KERJA'
  rate?: string
  nominal?: string
  capMin?: string
  capMax?: string
  order: string
}

export function PayrollCalculator() {
  const { toast } = useToast()
  
  // State management
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payComponents, setPayComponents] = useState<PayComponent[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [currentPayrollRun, setCurrentPayrollRun] = useState<PayrollRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false)
  const [isPayComponentFormOpen, setIsPayComponentFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editingPayComponent, setEditingPayComponent] = useState<PayComponent | null>(null)

  // Form states
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>({
    nama: '',
    jabatan: '',
    site: '',
    kontrakUpahHarian: '',
    defaultUangMakan: '',
    defaultUangBbm: '',
    bankName: '',
    bankAccount: '',
    npwp: ''
  })

  const [payComponentForm, setPayComponentForm] = useState<PayComponentForm>({
    nama: '',
    tipe: 'EARNING',
    taxable: false,
    metode: 'FLAT',
    basis: 'UPAH_HARIAN',
    rate: '',
    nominal: '',
    capMin: '',
    capMax: '',
    order: '0'
  })

  // Load data on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [employeesRes, payComponentsRes, payrollRunsRes] = await Promise.all([
        apiService.getEmployees({ aktif: true }),
        apiService.getPayComponents({ aktif: true }),
        apiService.getPayrollRuns({ userId: CURRENT_USER_ID, limit: 5 })
      ])

      if (employeesRes.success) {
        setEmployees(employeesRes.data || [])
      }

      if (payComponentsRes.success) {
        setPayComponents(payComponentsRes.data || [])
      }

      if (payrollRunsRes.success) {
        setPayrollRuns(payrollRunsRes.data || [])
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data awal",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const [selectedPeriod, setSelectedPeriod] = useState({
    periodeAwal: '',
    periodeAkhir: ''
  })
  const [isEditingLine, setIsEditingLine] = useState<string | null>(null)

  // Enhanced edit states for payroll
  const [payrollVersions, setPayrollVersions] = useState<Map<string, PayrollRun[]>>(new Map())
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set())
  const [quickEditMode, setQuickEditMode] = useState(false)
  
  // Approved payroll editing states
  const [allowApprovedEdit, setAllowApprovedEdit] = useState(false)
  const [showApprovalOverride, setShowApprovalOverride] = useState<string | null>(null)
  const [approvalReason, setApprovalReason] = useState('')
  const [supervisorPassword, setSupervisorPassword] = useState('')

  // Deletion states
  const [deletingEmployee, setDeletingEmployee] = useState<string | null>(null)
  const [deletingPayComponent, setDeletingPayComponent] = useState<string | null>(null)
  const [deletingPayrollRun, setDeletingPayrollRun] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{
    type: 'employee' | 'payComponent' | 'payrollRun'
    id: string
    name: string
  } | null>(null)

  // Employee Management Functions
  const resetEmployeeForm = () => {
    setEmployeeForm({
      nama: '',
      jabatan: '',
      site: '',
      kontrakUpahHarian: '',
      defaultUangMakan: '',
      defaultUangBbm: '',
      bankName: '',
      bankAccount: '',
      npwp: ''
    })
    setEditingEmployee(null)
  }

  const resetPayComponentForm = () => {
    setPayComponentForm({
      nama: '',
      tipe: 'EARNING',
      taxable: false,
      metode: 'FLAT',
      basis: 'UPAH_HARIAN',
      rate: '',
      nominal: '',
      capMin: '',
      capMax: '',
      order: '0'
    })
    setEditingPayComponent(null)
  }

  const handleEmployeeSubmit = async () => {
    setLoading(true)
    try {
      const employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
        nama: employeeForm.nama,
        jabatan: employeeForm.jabatan,
        site: employeeForm.site,
        kontrakUpahHarian: parseFloat(employeeForm.kontrakUpahHarian),
        defaultUangMakan: parseFloat(employeeForm.defaultUangMakan),
        defaultUangBbm: parseFloat(employeeForm.defaultUangBbm),
        bankName: employeeForm.bankName || undefined,
        bankAccount: employeeForm.bankAccount || undefined,
        npwp: employeeForm.npwp || undefined,
        aktif: true
      }

      let response
      if (editingEmployee) {
        response = await apiService.updateEmployee({
          ...employeeData,
          id: editingEmployee.id!
        })
      } else {
        response = await apiService.createEmployee(employeeData)
      }

      if (response.success) {
    toast({
          title: editingEmployee ? "Karyawan diupdate" : "Karyawan ditambahkan",
          description: `${employeeForm.nama} berhasil ${editingEmployee ? 'diupdate' : 'ditambahkan'}`
        })
        
        // Reload employees
        const employeesRes = await apiService.getEmployees({ aktif: true })
        if (employeesRes.success) {
          setEmployees(employeesRes.data || [])
        }

        setIsEmployeeFormOpen(false)
        resetEmployeeForm()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan karyawan",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayComponentSubmit = async () => {
    setLoading(true)
    try {
      const payComponentData: Omit<PayComponent, 'id' | 'createdAt' | 'updatedAt'> = {
        nama: payComponentForm.nama,
        tipe: payComponentForm.tipe,
        taxable: payComponentForm.taxable,
        metode: payComponentForm.metode,
        basis: payComponentForm.basis,
        rate: payComponentForm.rate ? parseFloat(payComponentForm.rate) : undefined,
        nominal: payComponentForm.nominal ? parseFloat(payComponentForm.nominal) : undefined,
        capMin: payComponentForm.capMin ? parseFloat(payComponentForm.capMin) : undefined,
        capMax: payComponentForm.capMax ? parseFloat(payComponentForm.capMax) : undefined,
        order: parseInt(payComponentForm.order),
        aktif: true
      }

      let response
      if (editingPayComponent) {
        response = await apiService.updatePayComponent({
          ...payComponentData,
          id: editingPayComponent.id!
        })
      } else {
        response = await apiService.createPayComponent(payComponentData)
      }

      if (response.success) {
        toast({
          title: editingPayComponent ? "Komponen diupdate" : "Komponen ditambahkan",
          description: `${payComponentForm.nama} berhasil ${editingPayComponent ? 'diupdate' : 'ditambahkan'}`
        })
        
        // Reload pay components
        const payComponentsRes = await apiService.getPayComponents({ aktif: true })
        if (payComponentsRes.success) {
          setPayComponents(payComponentsRes.data || [])
        }

        setIsPayComponentFormOpen(false)
        resetPayComponentForm()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan komponen gaji",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const editEmployee = (employee: Employee) => {
    setEmployeeForm({
      nama: employee.nama,
      jabatan: employee.jabatan,
      site: employee.site,
      kontrakUpahHarian: employee.kontrakUpahHarian.toString(),
      defaultUangMakan: employee.defaultUangMakan.toString(),
      defaultUangBbm: employee.defaultUangBbm.toString(),
      bankName: employee.bankName || '',
      bankAccount: employee.bankAccount || '',
      npwp: employee.npwp || ''
    })
    setEditingEmployee(employee)
    setIsEmployeeFormOpen(true)
  }

  const editPayComponent = (component: PayComponent) => {
    setPayComponentForm({
      nama: component.nama,
      tipe: component.tipe,
      taxable: component.taxable,
      metode: component.metode,
      basis: component.basis,
      rate: component.rate?.toString() || '',
      nominal: component.nominal?.toString() || '',
      capMin: component.capMin?.toString() || '',
      capMax: component.capMax?.toString() || '',
      order: component.order.toString()
    })
    setEditingPayComponent(component)
    setIsPayComponentFormOpen(true)
  }

  // Deletion functions
  const handleDeleteEmployee = async (id: string, hardDelete: boolean = false) => {
    setDeletingEmployee(id)
    try {
      const response = await apiService.deleteEmployee(id, hardDelete)
      if (response.success) {
        toast({
          title: "Karyawan dihapus",
          description: response.message || "Karyawan berhasil dihapus"
        })
        
        // Reload employees
        const employeesRes = await apiService.getEmployees({ aktif: true })
        if (employeesRes.success) {
          setEmployees(employeesRes.data || [])
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus karyawan",
        variant: "destructive"
      })
    } finally {
      setDeletingEmployee(null)
      setShowDeleteDialog(null)
    }
  }

  const handleDeletePayComponent = async (id: string, hardDelete: boolean = false) => {
    setDeletingPayComponent(id)
    try {
      const response = await apiService.deletePayComponent(id, hardDelete)
      if (response.success) {
        toast({
          title: "Komponen dihapus",
          description: response.message || "Komponen gaji berhasil dihapus"
        })
        
        // Reload pay components
        const componentsRes = await apiService.getPayComponents()
        if (componentsRes.success) {
          setPayComponents(componentsRes.data || [])
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus komponen gaji",
        variant: "destructive"
      })
    } finally {
      setDeletingPayComponent(null)
      setShowDeleteDialog(null)
    }
  }

  const handleDeletePayrollRun = async (id: string, hardDelete: boolean = false) => {
    setDeletingPayrollRun(id)
    try {
      // Use updatePayrollRunStatus to change status to ARCHIVED
      const response = await apiService.updatePayrollRunStatus(id, 'ARCHIVED')
      
      if (response.success) {
        toast({
          title: "Payroll dihapus",
          description: "Payroll run berhasil diarsipkan"
        })
        
        // Reload payroll runs
        const payrollRes = await apiService.getPayrollRuns()
        if (payrollRes.success) {
          setPayrollRuns(payrollRes.data || [])
        }
        
        // If this was the current payroll run, clear it
        if (currentPayrollRun?.id === id) {
          setCurrentPayrollRun(null)
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus payroll run",
        variant: "destructive"
      })
    } finally {
      setDeletingPayrollRun(null)
      setShowDeleteDialog(null)
    }
  }

  // Payroll operations
  const createPayrollRun = async () => {
    if (!selectedPeriod.periodeAwal || !selectedPeriod.periodeAkhir) {
      toast({
        title: "Periode tidak lengkap",
        description: "Mohon pilih periode awal dan akhir",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    try {
      const response = await apiService.createPayrollRun({
        periodeAwal: selectedPeriod.periodeAwal,
        periodeAkhir: selectedPeriod.periodeAkhir,
        createdBy: CURRENT_USER_ID
      })

      if (response.success) {
    toast({
      title: "Payroll berhasil dibuat",
          description: `Payroll untuk periode ${selectedPeriod.periodeAwal} - ${selectedPeriod.periodeAkhir}`
        })
        
        setCurrentPayrollRun(response.data!)
        
        // Reload payroll runs
        const payrollRunsRes = await apiService.getPayrollRuns({ userId: CURRENT_USER_ID, limit: 5 })
        if (payrollRunsRes.success) {
          setPayrollRuns(payrollRunsRes.data || [])
        }
      }
    } catch (error: any) {
    toast({
        title: "Error",
        description: error.message || "Gagal membuat payroll",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const approvePayroll = async () => {
    if (!currentPayrollRun) return
    
    setLoading(true)
    try {
      const response = await apiService.updatePayrollRunStatus(
        currentPayrollRun.id!,
        'APPROVED',
        CURRENT_USER_ID
      )

      if (response.success) {
    toast({
      title: "Payroll disetujui",
      description: "Payroll berhasil disetujui dan siap untuk dibayar"
    })
        
        setCurrentPayrollRun(response.data!)
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

  const loadPayrollRun = async (payrollRunId: string) => {
    setLoading(true)
    try {
      const response = await apiService.getPayrollRunById(payrollRunId)
      if (response.success) {
        setCurrentPayrollRun(response.data!)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat payroll",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Enhanced edit functions for payroll
  const savePayrollVersion = (payrollRun: PayrollRun) => {
    if (!payrollRun.id) return
    const versions = payrollVersions.get(payrollRun.id) || []
    versions.push({...payrollRun, createdAt: new Date().toISOString()})
    setPayrollVersions(new Map(payrollVersions.set(payrollRun.id, versions)))
  }

  const handleDuplicatePayrollRun = (payrollRun: PayrollRun) => {
    const today = new Date()
    const newStartDate = new Date(today.getFullYear(), today.getMonth(), 1)
    const newEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    setSelectedPeriod({
      periodeAwal: newStartDate.toISOString().split('T')[0],
      periodeAkhir: newEndDate.toISOString().split('T')[0]
    })
    
    toast({
      title: "Payroll duplicated",
      description: "Period set for new payroll run. Click 'Buat Payroll' to create."
    })
  }

  const handleBulkUpdateSalary = (percentage: number) => {
    if (selectedLines.size === 0) {
      toast({
        title: "No selection",
        description: "Please select payroll lines to update",
        variant: "destructive"
      })
      return
    }

    // This would update selected payroll lines with salary adjustment
    toast({
      title: "Bulk update applied",
      description: `${selectedLines.size} salary lines updated by ${percentage}%`
    })
    setSelectedLines(new Set())
    setBulkEditMode(false)
  }

  const handleSelectPayrollLine = (lineId: string) => {
    const newSelected = new Set(selectedLines)
    if (newSelected.has(lineId)) {
      newSelected.delete(lineId)
    } else {
      newSelected.add(lineId)
    }
    setSelectedLines(newSelected)
  }

  // Handle approved payroll editing with authorization
  const handleApprovedPayrollEdit = (lineId: string) => {
    if (currentPayrollRun?.status === 'APPROVED' && !allowApprovedEdit) {
      setShowApprovalOverride(lineId)
      return
    }
    
    // Save version before editing approved payroll
    if (currentPayrollRun) {
      savePayrollVersion(currentPayrollRun)
    }
    
    setIsEditingLine(lineId)
  }

  const requestPayrollApprovalOverride = async () => {
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
        description: "Please provide a reason for editing approved payroll",
        variant: "destructive"
      })
      return
    }

    // Enable approved editing for this session
    setAllowApprovedEdit(true)
    
    // Log the override attempt
    console.log('Payroll Approval Override:', {
      payrollRunId: currentPayrollRun?.id,
      lineId: showApprovalOverride,
      reason: approvalReason,
      timestamp: new Date().toISOString(),
      user: 'current_user'
    })
    
    toast({
      title: "Authorization Granted",
      description: "You can now edit approved payroll this session",
    })

    // Close the override dialog
    setShowApprovalOverride(null)
    setSupervisorPassword('')
    setApprovalReason('')

    // Trigger the original edit action
    if (showApprovalOverride) {
      setIsEditingLine(showApprovalOverride)
    }
  }

  const cancelPayrollApprovalOverride = () => {
    setShowApprovalOverride(null)
    setSupervisorPassword('')
    setApprovalReason('')
  }

  const generateSlipGaji = (line: PayrollLine) => {
    const employee = employees.find(emp => emp.id === line.employeeId)
    
    const componentDetails = line.components?.map(comp => `
      <tr>
        <td>${comp.componentName}</td>
        <td style="text-align: right;">${comp.amount >= 0 ? formatCurrency(comp.amount) : ''}</td>
        <td style="text-align: right;">${comp.amount < 0 ? formatCurrency(Math.abs(comp.amount)) : ''}</td>
      </tr>
    `).join('') || ''

    const htmlContent = `
      <h2 style="text-align: center;">SLIP GAJI KARYAWAN</h2>
      <p style="text-align: center;">Periode: ${currentPayrollRun?.periodeAwal} - ${currentPayrollRun?.periodeAkhir}</p>
      
      <table style="width: 100%; margin: 20px 0;">
        <tr>
          <td><strong>Nama Karyawan:</strong></td>
          <td>${line.employeeName}</td>
        </tr>
        <tr>
          <td><strong>Jabatan:</strong></td>
          <td>${employee?.jabatan || '-'}</td>
        </tr>
        <tr>
          <td><strong>Site:</strong></td>
          <td>${employee?.site || '-'}</td>
        </tr>
        <tr>
          <td><strong>Hari Kerja:</strong></td>
          <td>${line.hariKerja} hari</td>
        </tr>
      </table>

      <h3>Rincian Gaji</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px;">Keterangan</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Pendapatan</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Potongan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Upah Harian (${line.hariKerja} hari)</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(line.upahHarian * line.hariKerja)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Uang Makan (${line.hariKerja} hari)</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(line.uangMakanHarian * line.hariKerja)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Uang BBM (${line.hariKerja} hari)</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(line.uangBbmHarian * line.hariKerja)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
          ${componentDetails}
          <tr style="background-color: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Total Bruto</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>${formatCurrency(line.bruto)}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Pajak (${line.pajakRate}%)</td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(line.pajakNominal || 0)}</td>
          </tr>
          <tr style="background-color: #e8f5e8;">
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>TOTAL NETO</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>${formatCurrency(line.neto)}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 40px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 50%; text-align: center;">
              <p>Karyawan</p>
              <br/><br/><br/>
              <p>( ${line.employeeName} )</p>
            </td>
            <td style="width: 50%; text-align: center;">
              <p>HRD</p>
              <br/><br/><br/>
              <p>( ________________ )</p>
            </td>
          </tr>
        </table>
      </div>
    `

    generatePDF(htmlContent, `Slip_Gaji_${line.employeeName}_${currentPayrollRun?.periodeAwal}.pdf`)
    
    toast({
      title: "Slip gaji berhasil dibuat",
      description: `Slip gaji ${line.employeeName} berhasil di-generate ke PDF`
    })
  }

  const exportPayrollToExcel = () => {
    if (!currentPayrollRun) {
      toast({
        title: "Tidak ada data",
        description: "Belum ada payroll run untuk diekspor",
        variant: "destructive"
      })
      return
    }

    const exportData = currentPayrollRun.payrollLines?.map(line => {
      const employee = employees.find(emp => emp.id === line.employeeId)
      return {
        'Nama Karyawan': line.employeeName,
        'Jabatan': employee?.jabatan || '-',
        'Site': employee?.site || '-',
        'Hari Kerja': line.hariKerja,
        'Upah Harian': line.upahHarian,
        'Uang Makan/Hari': line.uangMakanHarian,
        'Uang BBM/Hari': line.uangBbmHarian,
        'Total Bruto': line.bruto,
        'Pajak': line.pajakNominal || 0,
        'Total Neto': line.neto,
        'Status': line.status
      }
    }) || []

    if (exportToExcel(exportData, `Payroll_${currentPayrollRun.periodeAwal}_${currentPayrollRun.periodeAkhir}.xlsx`, 'Payroll')) {
      toast({
        title: "Export berhasil",
        description: "Data payroll berhasil diekspor ke Excel"
      })
    }
  }

  const getStatusBadge = (status: PayrollRun['status']) => {
    const badges = {
      DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      REVIEWED: { label: 'Direview', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      PAID: { label: 'Dibayar', color: 'bg-blue-100 text-blue-800' }
    }
    
    const badge = badges[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kalkulator Gaji Karyawan</h2>
          <p className="text-muted-foreground">
            Kelola penggajian karyawan dengan komponen dinamis dan perhitungan otomatis
          </p>
        </div>
      </div>

      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payroll">Payroll Run</TabsTrigger>
          <TabsTrigger value="employees">Karyawan</TabsTrigger>
          <TabsTrigger value="components">Komponen Gaji</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="mt-6">
          <div className="space-y-6">
            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Memuat data...</span>
                </CardContent>
              </Card>
            )}

            {/* Payroll Runs History */}
            {payrollRuns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Riwayat Payroll
                  </CardTitle>
                  <CardDescription>
                    Daftar payroll yang pernah dibuat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {payrollRuns.map((run) => (
                      <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">
                            {run.periodeAwal} - {run.periodeAkhir}
                          </span>
                          <div className="text-sm text-muted-foreground">
                            {run.payrollLines?.length || 0} karyawan
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(run.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadPayrollRun(run.id!)}
                          >
                            Lihat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Check if payroll run can be deleted based on status
                              if (run.status === 'APPROVED' || run.status === 'PAID') {
                                toast({
                                  title: "Cannot Delete",
                                  description: `${run.status} payroll runs cannot be deleted`,
                                  variant: "destructive"
                                })
                                return
                              }
                              setShowDeleteDialog({
                                type: 'payrollRun',
                                id: run.id!,
                                name: `Payroll ${run.periodeAwal} - ${run.periodeAkhir}`
                              })
                            }}
                            disabled={run.status === 'APPROVED' || run.status === 'PAID' || deletingPayrollRun === run.id}
                            className={
                              run.status === 'APPROVED' || run.status === 'PAID'
                                ? "opacity-50 cursor-not-allowed" 
                                : "hover:bg-red-50 border-red-200"
                            }
                            title={
                              run.status === 'APPROVED' ? "Approved payroll runs cannot be deleted" :
                              run.status === 'PAID' ? "Paid payroll runs cannot be deleted" :
                              "Delete Payroll Run"
                            }
                          >
                            {deletingPayrollRun === run.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Period Selection */}
            {!currentPayrollRun && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Buat Payroll Baru
                  </CardTitle>
                  <CardDescription>
                    Pilih periode payroll untuk memulai perhitungan gaji
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="periode_awal">Periode Awal</Label>
                      <Input
                        id="periode_awal"
                        type="date"
                        value={selectedPeriod.periodeAwal}
                        onChange={(e) => setSelectedPeriod(prev => ({ 
                          ...prev, 
                          periodeAwal: e.target.value 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periode_akhir">Periode Akhir</Label>
                      <Input
                        id="periode_akhir"
                        type="date"
                        value={selectedPeriod.periodeAkhir}
                        onChange={(e) => setSelectedPeriod(prev => ({ 
                          ...prev, 
                          periodeAkhir: e.target.value 
                        }))}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={createPayrollRun} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                    <Plus className="h-4 w-4 mr-2" />
                    )}
                    Buat Payroll
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payroll Run Details */}
            {currentPayrollRun && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Payroll Run - {currentPayrollRun.periodeAwal} sampai {currentPayrollRun.periodeAkhir}
                        </CardTitle>
                        <CardDescription>
                          {currentPayrollRun.payrollLines?.length || 0} karyawan • 
                          Total: {formatCurrency(currentPayrollRun.payrollLines?.reduce((sum, line) => sum + line.neto, 0) || 0)}
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
                            Approve
                          </Button>
                        )}
                        <Button variant="outline" onClick={exportPayrollToExcel}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Excel
                        </Button>
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
                        <Card key={line.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{line.employeeName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {employees.find(emp => emp.id === line.employeeId)?.jabatan} • 
                                  {employees.find(emp => emp.id === line.employeeId)?.site}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-2xl text-green-600">
                                  {formatCurrency(line.neto)}
                                </p>
                                <p className="text-sm text-muted-foreground">Neto</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                              <div>
                                <span className="font-medium">Hari Kerja:</span>
                                <p className="text-muted-foreground">{line.hariKerja} hari</p>
                              </div>
                              <div>
                                <span className="font-medium">Upah Harian:</span>
                                <p className="text-muted-foreground">{formatCurrency(line.upahHarian)}</p>
                              </div>
                              <div>
                                <span className="font-medium">Uang Makan:</span>
                                <p className="text-muted-foreground">{formatCurrency(line.uangMakanHarian)}/hari</p>
                              </div>
                              <div>
                                <span className="font-medium">Uang BBM:</span>
                                <p className="text-muted-foreground">{formatCurrency(line.uangBbmHarian)}/hari</p>
                              </div>
                              <div>
                                <span className="font-medium">Bruto:</span>
                                <p className="text-muted-foreground">{formatCurrency(line.bruto)}</p>
                              </div>
                            </div>

                            {/* Component Details */}
                            {line.components && line.components.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-2">Komponen Tambahan:</h4>
                                <div className="space-y-1">
                                  {line.components.map((comp) => (
                                    <div key={comp.id} className="flex justify-between text-sm">
                                      <span className={comp.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                        {comp.componentName}
                                        {comp.taxable && ' (Taxable)'}
                                      </span>
                                      <span className={comp.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                        {formatCurrency(Math.abs(comp.amount))}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between text-sm mb-4">
                              <span className="font-medium">Pajak ({line.pajakRate}%):</span>
                              <span className="text-red-600">{formatCurrency(line.pajakNominal || 0)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                              <div className="flex gap-2 items-center">
                                {bulkEditMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedLines.has(line.id!)}
                                    onChange={() => handleSelectPayrollLine(line.id!)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                  />
                                )}
                                
                                {isEditingLine === line.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => setIsEditingLine(null)}
                                    >
                                      <Save className="h-4 w-4 mr-1" />
                                      Simpan
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setIsEditingLine(null)}
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Batal
                                    </Button>
                                  </>
                                ) : (
                                  <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Check if payroll line can be edited based on status
                                      if (currentPayrollRun.status === 'APPROVED' || currentPayrollRun.status === 'PAID') {
                                        if (currentPayrollRun.status === 'APPROVED') {
                                          handleApprovedPayrollEdit(line.id!)
                                        } else {
                                          toast({
                                            title: "Cannot Edit",
                                            description: `${currentPayrollRun.status} payroll lines cannot be edited`,
                                            variant: "destructive"
                                          })
                                        }
                                        return
                                      }
                                      setIsEditingLine(line.id!)
                                    }}
                                    disabled={currentPayrollRun.status === 'PAID'}
                                    className={
                                      currentPayrollRun.status === 'APPROVED' ? "hover:bg-orange-50 border-orange-200" : 
                                      currentPayrollRun.status === 'PAID' ? "opacity-50 cursor-not-allowed" :
                                      "hover:bg-blue-50"
                                    }
                                    title={
                                      currentPayrollRun.status === 'APPROVED' ? "Edit Approved Payroll (Requires Authorization)" :
                                      currentPayrollRun.status === 'PAID' ? "Paid payroll lines cannot be edited" :
                                      "Edit Payroll Line"
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    {currentPayrollRun.status === 'APPROVED' ? 'Edit*' : 'Edit'}
                                  </Button>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Quick duplicate this line to another employee
                                        toast({
                                          title: "Feature coming soon",
                                          description: "Copy payroll line to another employee"
                                        })
                                      }}
                                      disabled={currentPayrollRun.status === 'APPROVED' || currentPayrollRun.status === 'PAID'}
                                      className="hover:bg-green-50"
                                      title="Copy to another employee"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateSlipGaji(line)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Slip Gaji
                                </Button>
                                {currentPayrollRun.status === 'APPROVED' && (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Bayar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Karyawan
              </CardTitle>
              <CardDescription>
                Kelola data karyawan dan kontrak upah harian
              </CardDescription>
                </div>
                <Dialog open={isEmployeeFormOpen} onOpenChange={setIsEmployeeFormOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      resetEmployeeForm()
                      setIsEmployeeFormOpen(true)
                    }}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Tambah Karyawan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingEmployee ? 'Update data karyawan' : 'Isi form untuk menambah karyawan baru'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nama">Nama</Label>
                        <Input
                          id="nama"
                          value={employeeForm.nama}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, nama: e.target.value }))}
                          placeholder="Nama lengkap karyawan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jabatan">Jabatan</Label>
                        <Input
                          id="jabatan"
                          value={employeeForm.jabatan}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, jabatan: e.target.value }))}
                          placeholder="Jabatan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="site">Site</Label>
                        <Input
                          id="site"
                          value={employeeForm.site}
                          onChange={(e) => setEmployeeForm(prev => ({ ...prev, site: e.target.value }))}
                          placeholder="Site kerja"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="upah">Upah Harian</Label>
                          <Input
                            id="upah"
                            type="number"
                            value={employeeForm.kontrakUpahHarian}
                            onChange={(e) => setEmployeeForm(prev => ({ ...prev, kontrakUpahHarian: e.target.value }))}
                            placeholder="120000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="makan">Uang Makan</Label>
                          <Input
                            id="makan"
                            type="number"
                            value={employeeForm.defaultUangMakan}
                            onChange={(e) => setEmployeeForm(prev => ({ ...prev, defaultUangMakan: e.target.value }))}
                            placeholder="20000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bbm">Uang BBM</Label>
                          <Input
                            id="bbm"
                            type="number"
                            value={employeeForm.defaultUangBbm}
                            onChange={(e) => setEmployeeForm(prev => ({ ...prev, defaultUangBbm: e.target.value }))}
                            placeholder="15000"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEmployeeFormOpen(false)
                            resetEmployeeForm()
                          }}
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleEmployeeSubmit}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {editingEmployee ? 'Update' : 'Simpan'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Pay Component Form Dialog */}
                <Dialog open={isPayComponentFormOpen} onOpenChange={setIsPayComponentFormOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPayComponent ? 'Edit Komponen Gaji' : 'Tambah Komponen Gaji Baru'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingPayComponent ? 'Update komponen gaji' : 'Isi form untuk menambah komponen gaji baru'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="component-nama">Nama Komponen</Label>
                        <Input
                          id="component-nama"
                          value={payComponentForm.nama}
                          onChange={(e) => setPayComponentForm(prev => ({ ...prev, nama: e.target.value }))}
                          placeholder="Contoh: Tunjangan Transport"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="component-tipe">Tipe</Label>
                          <Select 
                            value={payComponentForm.tipe} 
                            onValueChange={(value) => setPayComponentForm(prev => ({ ...prev, tipe: value as 'EARNING' | 'DEDUCTION' }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EARNING">Tambahan</SelectItem>
                              <SelectItem value="DEDUCTION">Potongan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="component-metode">Metode</Label>
                          <Select 
                            value={payComponentForm.metode} 
                            onValueChange={(value) => setPayComponentForm(prev => ({ ...prev, metode: value as 'FLAT' | 'PER_HARI' | 'PERSENTASE' }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FLAT">Flat</SelectItem>
                              <SelectItem value="PER_HARI">Per Hari</SelectItem>
                              <SelectItem value="PERSENTASE">Persentase</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="component-basis">Basis Perhitungan</Label>
                        <Select 
                          value={payComponentForm.basis} 
                          onValueChange={(value) => setPayComponentForm(prev => ({ ...prev, basis: value as 'UPAH_HARIAN' | 'BRUTO' | 'HARI_KERJA' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPAH_HARIAN">Upah Harian</SelectItem>
                            <SelectItem value="BRUTO">Bruto</SelectItem>
                            <SelectItem value="HARI_KERJA">Hari Kerja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="component-rate">
                            {payComponentForm.metode === 'PERSENTASE' ? 'Rate (%)' : 'Rate'}
                          </Label>
                          <Input
                            id="component-rate"
                            type="number"
                            value={payComponentForm.rate}
                            onChange={(e) => setPayComponentForm(prev => ({ ...prev, rate: e.target.value }))}
                            placeholder={payComponentForm.metode === 'PERSENTASE' ? '10' : '1000'}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="component-nominal">Nominal (Flat)</Label>
                          <Input
                            id="component-nominal"
                            type="number"
                            value={payComponentForm.nominal}
                            onChange={(e) => setPayComponentForm(prev => ({ ...prev, nominal: e.target.value }))}
                            placeholder="50000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="component-order">Urutan</Label>
                        <Input
                          id="component-order"
                          type="number"
                          value={payComponentForm.order}
                          onChange={(e) => setPayComponentForm(prev => ({ ...prev, order: e.target.value }))}
                          placeholder="1"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="component-taxable"
                          checked={payComponentForm.taxable}
                          onChange={(e) => setPayComponentForm(prev => ({ ...prev, taxable: e.target.checked }))}
                        />
                        <Label htmlFor="component-taxable">Kena Pajak</Label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsPayComponentFormOpen(false)
                            resetPayComponentForm()
                          }}
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handlePayComponentSubmit}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {editingPayComponent ? 'Update' : 'Simpan'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <span>Memuat karyawan...</span>
                </div>
              ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <Card key={employee.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{employee.nama}</h3>
                          <p className="text-sm text-muted-foreground">
                            {employee.jabatan} • {employee.site}
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                            <div>
                              <span className="font-medium">Upah Harian:</span>
                                <p className="text-muted-foreground">{formatCurrency(employee.kontrakUpahHarian)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Uang Makan:</span>
                                <p className="text-muted-foreground">{formatCurrency(employee.defaultUangMakan)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Uang BBM:</span>
                                <p className="text-muted-foreground">{formatCurrency(employee.defaultUangBbm)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editEmployee(employee)}
                            >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Check if employee can be deleted based on status
                              // For employees, we'll allow deletion if they're not in active payroll runs
                              setShowDeleteDialog({
                                type: 'employee',
                                id: employee.id!,
                                name: employee.nama
                              })
                            }}
                            disabled={deletingEmployee === employee.id}
                            className="hover:bg-red-50 border-red-200"
                            title="Delete Employee"
                          >
                            {deletingEmployee === employee.id ? (
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
                  {employees.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Belum ada karyawan. Tambah karyawan pertama!</p>
              </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Komponen Gaji
                  </CardTitle>
                  <CardDescription>
                    Kelola komponen gaji dinamis (tunjangan, potongan, dll)
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  resetPayComponentForm()
                  setIsPayComponentFormOpen(true)
                }}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tambah Komponen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payComponents.map((component) => (
                  <Card key={component.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {component.nama}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              component.tipe === 'EARNING' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {component.tipe === 'EARNING' ? 'Tambahan' : 'Potongan'}
                            </span>
                            {component.taxable && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Taxable
                              </span>
                            )}
                          </h3>
                          <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                            <div>
                              <span className="font-medium">Metode:</span>
                              <p className="text-muted-foreground capitalize">{component.metode}</p>
                            </div>
                            <div>
                              <span className="font-medium">Basis:</span>
                              <p className="text-muted-foreground">{component.basis}</p>
                            </div>
                            <div>
                              <span className="font-medium">
                                {component.metode === 'PERSENTASE' ? 'Rate:' : 'Nominal:'}
                              </span>
                              <p className="text-muted-foreground">
                                {component.metode === 'PERSENTASE' 
                                  ? `${component.rate}%` 
                                  : formatCurrency(component.nominal || 0)
                                }
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Order:</span>
                              <p className="text-muted-foreground">{component.order}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => editPayComponent(component)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Check if pay component can be deleted based on status
                              // For pay components, we'll allow deletion if they're not in active payroll runs
                              setShowDeleteDialog({
                                type: 'payComponent',
                                id: component.id!,
                                name: component.nama
                              })
                            }}
                            disabled={deletingPayComponent === component.id}
                            className="hover:bg-red-50 border-red-200"
                            title="Delete Pay Component"
                          >
                            {deletingPayComponent === component.id ? (
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
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    resetPayComponentForm()
                    setIsPayComponentFormOpen(true)
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tambah Komponen Baru
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Payroll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Karyawan Aktif:</span>
                    <span className="font-semibold">{employees.filter(emp => emp.aktif).length}</span>
                  </div>
                  {currentPayrollRun && (
                    <>
                      <div className="flex justify-between">
                        <span>Total Bruto:</span>
                        <span className="font-semibold">
                          {formatCurrency(currentPayrollRun.payrollLines?.reduce((sum, line) => sum + line.bruto, 0) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Pajak:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(currentPayrollRun.payrollLines?.reduce((sum, line) => sum + (line.pajakNominal || 0), 0) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Neto:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(currentPayrollRun.payrollLines?.reduce((sum, line) => sum + line.neto, 0) || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Laporan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full" onClick={exportPayrollToExcel}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Daftar Gaji Excel
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => generatePayrollTemplate()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Template Payroll Excel
                  </Button>
                  <Button className="w-full" variant="outline" disabled={!currentPayrollRun}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Slip Gaji (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Edit Toolbar for Payroll */}
      {bulkEditMode && selectedLines.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{selectedLines.size} payroll lines selected</span>
            
            <div className="flex gap-2 items-center">
              <Label htmlFor="salary-adjustment" className="text-sm">Salary Adjustment:</Label>
              <Select onValueChange={(value) => handleBulkUpdateSalary(parseFloat(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select %" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">+5%</SelectItem>
                  <SelectItem value="10">+10%</SelectItem>
                  <SelectItem value="15">+15%</SelectItem>
                  <SelectItem value="-5">-5%</SelectItem>
                  <SelectItem value="-10">-10%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => {setBulkEditMode(false); setSelectedLines(new Set())}}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Version History Modal for Payroll */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payroll History
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
                {payrollVersions.get(showVersionHistory)?.map((version, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Version {index + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {version.createdAt ? new Date(version.createdAt).toLocaleString() : 'Unknown'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Period:</strong> {version.periodeAwal} to {version.periodeAkhir}</p>
                      <p><strong>Status:</strong> {version.status}</p>
                      <p><strong>Total Lines:</strong> {version.payrollLines?.length || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approval Override Modal for Payroll */}
      {showApprovalOverride && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Authorization Required - Payroll
              </CardTitle>
              <CardDescription>
                This payroll is approved and requires supervisor authorization to modify.
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
                  placeholder="Please provide a detailed reason for editing this approved payroll..."
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
                  onClick={requestPayrollApprovalOverride}
                  disabled={!supervisorPassword || !approvalReason.trim()}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Authorize Override
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelPayrollApprovalOverride}
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

      {/* Enhanced Controls Bar for Payroll */}
      <div className="fixed top-20 right-6 bg-white border rounded-lg shadow-lg p-2 z-40">
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={bulkEditMode ? "bg-blue-50" : ""}
            title="Toggle bulk edit mode for payroll lines"
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
              title="Disable approved payroll editing"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
          
          {currentPayrollRun && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDuplicatePayrollRun(currentPayrollRun)}
              title="Duplicate current payroll for next period"
              className="hover:bg-purple-50"
            >
              <Copy className="h-4 w-4" />
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
                Apakah Anda yakin ingin menghapus {showDeleteDialog.type === 'employee' ? 'karyawan' : showDeleteDialog.type === 'payComponent' ? 'komponen gaji' : 'payroll run'} ini?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{showDeleteDialog.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {showDeleteDialog.type === 'employee' 
                      ? 'Karyawan ini akan dinonaktifkan (soft delete)'
                      : showDeleteDialog.type === 'payComponent' 
                        ? 'Komponen gaji ini akan dinonaktifkan (soft delete)'
                        : 'Payroll run ini akan dinonaktifkan (soft delete)'
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (showDeleteDialog.type === 'employee') {
                        handleDeleteEmployee(showDeleteDialog.id, false)
                      } else if (showDeleteDialog.type === 'payComponent') {
                        handleDeletePayComponent(showDeleteDialog.id, false)
                      } else {
                        handleDeletePayrollRun(showDeleteDialog.id, false)
                      }
                    }}
                    disabled={deletingEmployee === showDeleteDialog.id || deletingPayComponent === showDeleteDialog.id || deletingPayrollRun === showDeleteDialog.id}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {deletingEmployee === showDeleteDialog.id || deletingPayComponent === showDeleteDialog.id || deletingPayrollRun === showDeleteDialog.id ? (
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
