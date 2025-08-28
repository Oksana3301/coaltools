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
  ArrowLeft
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

const CURRENT_USER_ID = getCurrentUserId()

// Form interfaces
interface PayrollPeriodForm {
  periodeAwal: string
  periodeAkhir: string
  notes: string
}

interface EmployeePayrollForm {
  employeeId: string
  hariKerja: number
  overtimeHours: number
  overtimeRate: number
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
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriodForm>({
    periodeAwal: '',
    periodeAkhir: '',
    notes: ''
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
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ type: string; id: string; name: string } | null>(null)
  const [deletingPayrollRun, setDeletingPayrollRun] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [employeesRes, payComponentsRes, payrollRunsRes] = await Promise.all([
        apiService.getEmployees(),
        apiService.getPayComponents(),
        apiService.getPayrollRuns({ userId: CURRENT_USER_ID, limit: 10 })
      ])

      if (employeesRes.success) setEmployees(employeesRes.data || [])
      if (payComponentsRes.success) {
        const allComponents = payComponentsRes.data || []
        setPayComponents(allComponents)
        
        // Pisahkan komponen berdasarkan order (0-99 = standard, 100+ = additional)
        const standard = allComponents.filter(comp => comp.order < 100)
        const additional = allComponents.filter(comp => comp.order >= 100)
        
        setStandardComponents(standard)
        setAdditionalComponents(additional)
      }
      if (payrollRunsRes.success) setPayrollRuns(payrollRunsRes.data || [])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Step navigation
  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1)
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

  const handleDeleteComponent = async (componentId: string) => {
    try {
      setLoading(true)
      
      const response = await apiService.deletePayComponent(componentId)

      if (response.success) {
        toast({
          title: "Berhasil",
          description: "Komponen berhasil dihapus"
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
    const employee = employees.find(emp => emp.id === employeePayroll.employeeId)
    if (!employee) return null

    const hariKerja = employeePayroll.hariKerja
    const baseUpah = employee.kontrakUpahHarian * hariKerja
    const uangMakan = employee.defaultUangMakan * hariKerja
    const uangBbm = employee.defaultUangBbm * hariKerja
    
    let bruto = baseUpah + uangMakan + uangBbm
    let totalEarnings = 0
    let totalDeductions = 0
    let taxableAmount = baseUpah // Base taxable amount

    // Calculate earnings from selected components
    const selectedComponents = [
      ...standardComponents.filter(comp => 
        employeePayroll.selectedStandardComponents.includes(comp.id)
      ),
      ...additionalComponents.filter(comp => 
        employeePayroll.selectedAdditionalComponents.includes(comp.id)
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

    // Add overtime if any
    const overtimeAmount = employeePayroll.overtimeHours * employeePayroll.overtimeRate
    totalEarnings += overtimeAmount
    taxableAmount += overtimeAmount

    // Update bruto with earnings
    bruto += totalEarnings

    // Calculate tax (2% of taxable amount)
    const pajakRate = 2
    const pajakNominal = taxableAmount * (pajakRate / 100)
    totalDeductions += pajakNominal

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
      totalEarnings,
      bruto,
      totalDeductions,
      pajakNominal,
      taxableAmount,
      cashbon: employeePayroll.cashbon,
      neto,
      components: selectedComponents.map(comp => ({
        ...comp,
        amount: calculateComponentAmount(comp, employee, hariKerja, bruto)
      }))
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

  // Step 6: Generate Payroll
  const generatePayroll = async () => {
    setLoading(true)
    try {
      const response = await apiService.createPayrollRun({
        periodeAwal: payrollPeriod.periodeAwal,
        periodeAkhir: payrollPeriod.periodeAkhir,
        createdBy: CURRENT_USER_ID,
        employeeOverrides: selectedEmployees.map(emp => ({
          employeeId: emp.employeeId,
          hariKerja: emp.hariKerja
        }))
      })

      if (response.success) {
        setCurrentPayrollRun(response.data!)
        toast({
          title: "Payroll berhasil dibuat",
          description: "Payroll telah dibuat dan siap untuk disetujui"
        })
        
        // Reload payroll runs
        const payrollRunsRes = await apiService.getPayrollRuns({ userId: CURRENT_USER_ID, limit: 10 })
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

  // Approve payroll and generate kwitansi
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
        await generatePDF(laporanContent, `Laporan_Payroll_${currentPayrollRun.periodeAwal}_${currentPayrollRun.periodeAkhir}.pdf`)
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
      await generatePDF(kwitansiContent, `Kwitansi_${calc!.employee.nama.replace(/\s+/g, '_')}_${payrollRun.periodeAwal}.pdf`)
    }
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
                <td>Lembur</td>
                <td>-</td>
                <td style="text-align: right">${formatCurrency(calculation.overtimeAmount)}</td>
              </tr>
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
              <td>Pajak (2%)</td>
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
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 5 && (
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
                                onClick={() => handleDeleteComponent(component.id)}
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
                                onClick={() => handleDeleteComponent(component.id)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employees.filter(emp => emp.aktif).map((employee) => {
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
                                <Label className="text-xs">Overtime (Jam)</Label>
                                <Input
                                  type="number"
                                  value={selectedData.overtimeHours}
                                  onChange={(e) => employee.id && updateEmployeePayroll(employee.id, 'overtimeHours', parseInt(e.target.value) || 0)}
                                  className="h-8 text-sm"
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
                                    <div>
                                      <span className="text-gray-600">Overtime:</span>
                                      <span className="ml-2 font-semibold">{formatCurrency(calculation.overtimeAmount)}</span>
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
                                      <div className="flex justify-between text-red-600">
                                        <span>Pajak (2%):</span>
                                        <span className="font-semibold">-{formatCurrency(calculation.pajakNominal)}</span>
                                      </div>
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
                                  <div className="flex justify-between">
                                    <span>Overtime:</span>
                                    <span>{formatCurrency(calc!.overtimeAmount)}</span>
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
                                <div className="flex justify-between">
                                  <span>Pajak (2%):</span>
                                  <span>{formatCurrency(calc!.pajakNominal)}</span>
                                </div>
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
                  <Button onClick={generatePayroll} disabled={loading}>
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
                    <h4 className="font-medium">{line.employeeName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {line.hariKerja} hari • Bruto: {formatCurrency(line.bruto)} • Neto: {formatCurrency(line.neto)}
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

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
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
                    {run.payrollLines?.length || 0} karyawan • 
                    Total: {formatCurrency(run.payrollLines?.reduce((sum, line) => sum + line.neto, 0) || 0)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(run.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPayrollRun(run)}
                  >
                    Lihat
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteDialog({
                      type: 'payrollRun',
                      id: run.id!,
                      name: `Payroll ${run.periodeAwal} - ${run.periodeAkhir}`
                    })}
                    disabled={deletingPayrollRun === run.id}
                    className="text-red-600 hover:text-red-700"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {showDeleteDialog?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Batal
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (showDeleteDialog) {
                  handleDeletePayrollRun(showDeleteDialog.id, false) // Soft delete
                }
              }}
            >
              Soft Delete
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (showDeleteDialog) {
                  handleDeletePayrollRun(showDeleteDialog.id, true) // Hard delete
                }
              }}
            >
              Hard Delete
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
      return
    }

    // Validation based on method
    if (formData.metode === 'FLAT' && !formData.nominal) {
      return
    }

    if (['PER_HARI', 'PERSENTASE'].includes(formData.metode) && !formData.rate) {
      return
    }

    onSave(formData)
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
