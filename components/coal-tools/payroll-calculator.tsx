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
}

export function PayrollCalculator() {
  const { toast } = useToast()
  
  // State management
  const [currentStep, setCurrentStep] = useState(1)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payComponents, setPayComponents] = useState<PayComponent[]>([])
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
      if (payComponentsRes.success) setPayComponents(payComponentsRes.data || [])
      if (payrollRunsRes.success) setPayrollRuns(payrollRunsRes.data || [])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Step navigation
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // Step 1: Payroll Period
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

  // Step 2: Select Employees
  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      // Check if we're already at the limit of 100 employees
      if (selectedEmployees.length >= 100) {
        toast({
          title: "Batas maksimum tercapai",
          description: "Maksimal 100 karyawan per periode payroll",
          variant: "destructive"
        })
        return
      }
      
      const employee = employees.find(emp => emp.id === employeeId)
      if (employee) {
        setSelectedEmployees(prev => [...prev, {
          employeeId,
          hariKerja: 22,
          overtimeHours: 0,
          overtimeRate: employee.kontrakUpahHarian * 1.5,
          cashbon: 0,
          notes: ''
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

  // Step 3: Pay Components
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

  // Step 4: Calculate Payroll
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

  // Step 5: Generate Payroll
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
  const generatePDFReport = () => {
    if (!currentPayrollRun) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Payroll - ${currentPayrollRun.periodeAwal} - ${currentPayrollRun.periodeAkhir}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #666; }
          .period-info { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f2f2f2; font-weight: bold; }
          .total-row { font-weight: bold; background: #f9f9f9; }
          .kwitansi-section { page-break-before: always; margin-top: 30px; }
          .kwitansi-title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">LAPORAN PAYROLL</div>
          <div class="subtitle">PT. GLOBAL LESTARI ALAM</div>
        </div>
        
        <div class="period-info">
          <strong>Periode:</strong> ${currentPayrollRun.periodeAwal} - ${currentPayrollRun.periodeAkhir}<br>
          <strong>Status:</strong> ${currentPayrollRun.status}<br>
          <strong>Total Karyawan:</strong> ${currentPayrollRun.payrollLines?.length || 0}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Karyawan</th>
              <th>Jabatan</th>
              <th>Hari Kerja</th>
              <th>Bruto</th>
              <th>Pajak</th>
              <th>Neto</th>
            </tr>
          </thead>
          <tbody>
            ${currentPayrollRun.payrollLines?.map((line, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${line.employeeName}</td>
                <td>${line.employee?.jabatan || '-'}</td>
                <td>${line.hariKerja}</td>
                <td>Rp ${line.bruto.toLocaleString()}</td>
                <td>Rp ${(line.pajakNominal || 0).toLocaleString()}</td>
                <td>Rp ${line.neto.toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4">TOTAL</td>
              <td>Rp ${(currentPayrollRun.payrollLines?.reduce((sum, line) => sum + line.bruto, 0) || 0).toLocaleString()}</td>
              <td>Rp ${(currentPayrollRun.payrollLines?.reduce((sum, line) => sum + (line.pajakNominal || 0), 0) || 0).toLocaleString()}</td>
              <td>Rp ${(currentPayrollRun.payrollLines?.reduce((sum, line) => sum + line.neto, 0) || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        
        ${currentPayrollRun.status === 'APPROVED' ? `
          <div class="kwitansi-section">
            <div class="kwitansi-title">KWITANSI OTOMATIS</div>
            <p>Kwitansi telah dibuat otomatis untuk setiap karyawan dengan detail sebagai berikut:</p>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Karyawan</th>
                  <th>Nomor Kwitansi</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                ${currentPayrollRun.payrollLines?.map((line, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${line.employeeName}</td>
                    <td>KW-${currentPayrollRun.id?.slice(-6)}-${line.employeeId?.slice(-4)}-${String(index + 1).padStart(3, '0')}</td>
                    <td>Rp ${line.neto.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </body>
      </html>
    `

    generatePDF(htmlContent, `Laporan_Payroll_${currentPayrollRun.periodeAwal}_${currentPayrollRun.periodeAkhir}.pdf`)
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
        {/* Step 1: Payroll Period */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Langkah 1: Periode Payroll
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

        {/* Step 2: Select Employees */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Langkah 2: Pilih Karyawan
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

        {/* Step 3: Pay Components */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Langkah 3: Komponen Gaji
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

        {/* Step 4: Calculate Payroll */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Langkah 4: Hitung Payroll
              </CardTitle>
              <CardDescription>
                Review data dan hitung payroll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Ringkasan Periode</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Periode:</strong> {payrollPeriod.periodeAwal} - {payrollPeriod.periodeAkhir}</div>
                    <div><strong>Karyawan:</strong> {selectedEmployees.length} orang</div>
                    <div><strong>Komponen Tambahan:</strong> {customPayComponents.length} item</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Daftar Karyawan</h4>
                  <div className="space-y-2">
                    {selectedEmployees.map((emp) => {
                      const employee = employees.find(e => e.id === emp.employeeId)
                      return (
                        <div key={emp.employeeId} className="flex justify-between text-sm">
                          <span>{employee?.nama}</span>
                          <span>{emp.hariKerja} hari</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              
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

        {/* Step 5: Generate Payroll */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Langkah 5: Generate Payroll
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
                <Button variant="outline" onClick={generatePDFReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
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
    </div>
  )
}
