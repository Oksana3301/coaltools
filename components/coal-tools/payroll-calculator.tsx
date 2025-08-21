"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  exportToExcel, 
  exportToCSV, 
  generatePDF,
  saveToLocalStorage,
  loadFromLocalStorage,
  generatePayrollTemplate
} from "@/lib/file-utils"

// Types
interface Employee {
  id: string
  nama: string
  jabatan: string
  site: string
  kontrak_upah_harian: number
  default_uang_makan: number
  default_uang_bbm: number
  bank_name?: string
  bank_account?: string
  npwp?: string
  aktif: boolean
}

interface PayComponent {
  id: string
  nama: string
  tipe: 'earning' | 'deduction'
  taxable: boolean
  metode: 'flat' | 'per_hari' | 'persentase'
  basis: 'upah_harian' | 'bruto' | 'hari_kerja'
  rate?: number
  nominal?: number
  cap_min?: number
  cap_max?: number
  order: number
  aktif: boolean
}

interface AttendanceRecord {
  id: string
  employee_id: string
  tanggal: string
  clock_in?: string
  clock_out?: string
  break_start?: string
  break_end?: string
  total_hours: number
  status: 'present' | 'late' | 'absent' | 'sick' | 'leave'
  overtime_hours: number
  notes?: string
  approved_by?: string
  created_at: string
}

interface PayrollLine {
  id: string
  employee_id: string
  employee_name: string
  hari_kerja: number
  upah_harian: number
  uang_makan_harian: number
  uang_bbm_harian: number
  bruto: number
  pajak_rate?: number
  pajak_nominal?: number
  potongan_lain?: number
  neto: number
  status: 'draft' | 'reviewed' | 'approved' | 'paid'
  components: PayrollLineComponent[]
  notes?: string
}

interface PayrollLineComponent {
  id: string
  component_id: string
  component_name: string
  qty?: number
  rate?: number
  nominal?: number
  amount: number
  taxable: boolean
}

interface PayrollRun {
  id: string
  periode_awal: string
  periode_akhir: string
  status: 'draft' | 'reviewed' | 'approved' | 'paid'
  payroll_lines: PayrollLine[]
  created_at: string
}

// Sample data
const SAMPLE_EMPLOYEES: Employee[] = [
  {
    id: '1',
    nama: 'Budi Santoso',
    jabatan: 'Operator Alat Berat',
    site: 'Site A',
    kontrak_upah_harian: 120000,
    default_uang_makan: 20000,
    default_uang_bbm: 15000,
    bank_name: 'BCA',
    bank_account: '1234567890',
    aktif: true
  },
  {
    id: '2',
    nama: 'Siti Aminah',
    jabatan: 'Supervisor Lapangan',
    site: 'Site A',
    kontrak_upah_harian: 150000,
    default_uang_makan: 25000,
    default_uang_bbm: 20000,
    bank_name: 'Mandiri',
    bank_account: '0987654321',
    aktif: true
  }
]

const SAMPLE_COMPONENTS: PayComponent[] = [
  {
    id: '1',
    nama: 'Tunjangan Lapangan',
    tipe: 'earning',
    taxable: true,
    metode: 'per_hari',
    basis: 'hari_kerja',
    rate: 25000,
    order: 1,
    aktif: true
  },
  {
    id: '2',
    nama: 'Transport Tambahan',
    tipe: 'earning',
    taxable: false,
    metode: 'flat',
    basis: 'upah_harian',
    nominal: 150000,
    order: 2,
    aktif: true
  },
  {
    id: '3',
    nama: 'Potongan Kasbon',
    tipe: 'deduction',
    taxable: false,
    metode: 'flat',
    basis: 'upah_harian',
    nominal: 300000,
    cap_max: 300000,
    order: 3,
    aktif: true
  }
]

export function PayrollCalculator() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES)
  const [payComponents, setPayComponents] = useState<PayComponent[]>(SAMPLE_COMPONENTS)
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord[]>>(new Map())
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false)
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPayroll = loadFromLocalStorage('payroll_run', null)
    if (savedPayroll) {
      setPayrollRun(savedPayroll)
    }
  }, [])

  // Save to localStorage whenever payroll changes
  useEffect(() => {
    if (payrollRun) {
      saveToLocalStorage('payroll_run', payrollRun)
    }
  }, [payrollRun])

  // Load employee data
  useEffect(() => {
    const savedEmployees = loadFromLocalStorage('employees', SAMPLE_EMPLOYEES)
    const savedAttendance = loadFromLocalStorage('attendance_records', new Map())
    setEmployees(savedEmployees)
    setAttendanceRecords(new Map(savedAttendance))
  }, [])

  // Save employee and attendance data
  useEffect(() => {
    saveToLocalStorage('employees', employees)
  }, [employees])

  useEffect(() => {
    saveToLocalStorage('attendance_records', Array.from(attendanceRecords.entries()))
  }, [attendanceRecords])
  
  const [selectedPeriod, setSelectedPeriod] = useState({
    periode_awal: '',
    periode_akhir: ''
  })
  const [isEditingLine, setIsEditingLine] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Employee Management Functions
  const addEmployee = (employeeData: Omit<Employee, 'id' | 'created_at'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    setEmployees(prev => [...prev, newEmployee])
    toast({
      title: "Karyawan ditambahkan",
      description: `${newEmployee.nama} berhasil ditambahkan`
    })
  }

  // Enhanced attendance tracking
  const addAttendanceRecord = (employeeId: string, record: Omit<AttendanceRecord, 'id' | 'employee_id' | 'created_at'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: Date.now().toString(),
      employee_id: employeeId,
      created_at: new Date().toISOString()
    }
    
    const currentRecords = attendanceRecords.get(employeeId) || []
    setAttendanceRecords(prev => new Map(prev.set(employeeId, [...currentRecords, newRecord])))
    
    toast({
      title: "Absensi dicatat",
      description: "Record absensi berhasil ditambahkan"
    })
  }

  const getEmployeeAttendanceSummary = (employeeId: string, startDate: string, endDate: string) => {
    const records = attendanceRecords.get(employeeId) || []
    const filteredRecords = records.filter(record => 
      record.tanggal >= startDate && record.tanggal <= endDate
    )
    
    return {
      totalDays: filteredRecords.length,
      presentDays: filteredRecords.filter(r => r.status === 'present').length,
      lateDays: filteredRecords.filter(r => r.status === 'late').length,
      absentDays: filteredRecords.filter(r => r.status === 'absent').length,
      totalHours: filteredRecords.reduce((sum, r) => sum + r.total_hours, 0),
      overtimeHours: filteredRecords.reduce((sum, r) => sum + r.overtime_hours, 0)
    }
  }

  const calculatePayrollLine = (
    employee: Employee, 
    hari_kerja: number
  ): PayrollLine => {
    // Base calculation
    const upah_harian = employee.kontrak_upah_harian
    const uang_makan_harian = employee.default_uang_makan
    const uang_bbm_harian = employee.default_uang_bbm
    
    let bruto = (upah_harian * hari_kerja) + (uang_makan_harian * hari_kerja) + (uang_bbm_harian * hari_kerja)
    
    // Add earning components
    const components: PayrollLineComponent[] = []
    let totalEarnings = 0
    let totalDeductions = 0
    let taxableAmount = bruto
    
    payComponents
      .filter(comp => comp.aktif && comp.tipe === 'earning')
      .sort((a, b) => a.order - b.order)
      .forEach(comp => {
        let amount = 0
        
        switch (comp.metode) {
          case 'flat':
            amount = comp.nominal || 0
            break
          case 'per_hari':
            amount = (comp.rate || 0) * hari_kerja
            break
          case 'persentase':
            const basis = comp.basis === 'upah_harian' ? upah_harian * hari_kerja : bruto
            amount = basis * ((comp.rate || 0) / 100)
            break
        }
        
        // Apply caps
        if (comp.cap_min && amount < comp.cap_min) amount = comp.cap_min
        if (comp.cap_max && amount > comp.cap_max) amount = comp.cap_max
        
        components.push({
          id: `${comp.id}_${employee.id}`,
          component_id: comp.id,
          component_name: comp.nama,
          amount,
          taxable: comp.taxable
        })
        
        totalEarnings += amount
        if (comp.taxable) {
          taxableAmount += amount
        }
      })
    
    bruto += totalEarnings
    
    // Calculate tax (simplified 2% for demonstration)
    const pajak_rate = 2
    const pajak_nominal = taxableAmount * (pajak_rate / 100)
    
    // Add deduction components
    payComponents
      .filter(comp => comp.aktif && comp.tipe === 'deduction')
      .sort((a, b) => a.order - b.order)
      .forEach(comp => {
        let amount = 0
        
        switch (comp.metode) {
          case 'flat':
            amount = comp.nominal || 0
            break
          case 'per_hari':
            amount = (comp.rate || 0) * hari_kerja
            break
          case 'persentase':
            const basis = comp.basis === 'bruto' ? bruto : upah_harian * hari_kerja
            amount = basis * ((comp.rate || 0) / 100)
            break
        }
        
        // Apply caps
        if (comp.cap_min && amount < comp.cap_min) amount = comp.cap_min
        if (comp.cap_max && amount > comp.cap_max) amount = comp.cap_max
        
        components.push({
          id: `${comp.id}_${employee.id}`,
          component_id: comp.id,
          component_name: comp.nama,
          amount,
          taxable: comp.taxable
        })
        
        totalDeductions += amount
      })
    
    const neto = bruto - pajak_nominal - totalDeductions
    
    return {
      id: employee.id,
      employee_id: employee.id,
      employee_name: employee.nama,
      hari_kerja,
      upah_harian,
      uang_makan_harian,
      uang_bbm_harian,
      bruto,
      pajak_rate,
      pajak_nominal,
      neto,
      status: 'draft',
      components
    }
  }

  const createPayrollRun = () => {
    if (!selectedPeriod.periode_awal || !selectedPeriod.periode_akhir) {
      toast({
        title: "Periode tidak lengkap",
        description: "Mohon pilih periode awal dan akhir",
        variant: "destructive"
      })
      return
    }
    
    const payroll_lines = employees
      .filter(emp => emp.aktif)
      .map(employee => calculatePayrollLine(employee, 22)) // Default 22 hari kerja
    
    const newPayrollRun: PayrollRun = {
      id: Date.now().toString(),
      periode_awal: selectedPeriod.periode_awal,
      periode_akhir: selectedPeriod.periode_akhir,
      status: 'draft',
      payroll_lines,
      created_at: new Date().toISOString()
    }
    
    setPayrollRun(newPayrollRun)
    
    toast({
      title: "Payroll berhasil dibuat",
      description: `Payroll untuk periode ${selectedPeriod.periode_awal} - ${selectedPeriod.periode_akhir}`
    })
  }

  const updatePayrollLine = (lineId: string, field: string, value: string | number) => {
    if (!payrollRun) return
    
    setPayrollRun(prev => {
      if (!prev) return prev
      
      const updatedLines = prev.payroll_lines.map(line => {
        if (line.id === lineId) {
          const updatedLine = { ...line, [field]: value }
          
          // Recalculate if hari_kerja changed
          if (field === 'hari_kerja') {
            const employee = employees.find(emp => emp.id === line.employee_id)
            if (employee) {
              const recalculated = calculatePayrollLine(employee, value)
              return { ...updatedLine, ...recalculated, id: lineId }
            }
          }
          
          return updatedLine
        }
        return line
      })
      
      return { ...prev, payroll_lines: updatedLines }
    })
  }

  const approvePayroll = () => {
    if (!payrollRun) return
    
    setPayrollRun(prev => prev ? { ...prev, status: 'approved' } : prev)
    
    toast({
      title: "Payroll disetujui",
      description: "Payroll berhasil disetujui dan siap untuk dibayar"
    })
  }

  const generateSlipGaji = (line: PayrollLine) => {
    const employee = employees.find(emp => emp.id === line.employee_id)
    
    const componentDetails = line.components.map(comp => `
      <tr>
        <td>${comp.component_name}</td>
        <td style="text-align: right;">${comp.amount >= 0 ? formatCurrency(comp.amount) : ''}</td>
        <td style="text-align: right;">${comp.amount < 0 ? formatCurrency(Math.abs(comp.amount)) : ''}</td>
      </tr>
    `).join('')

    const htmlContent = `
      <h2 style="text-align: center;">SLIP GAJI KARYAWAN</h2>
      <p style="text-align: center;">Periode: ${payrollRun?.periode_awal} - ${payrollRun?.periode_akhir}</p>
      
      <table style="width: 100%; margin: 20px 0;">
        <tr>
          <td><strong>Nama Karyawan:</strong></td>
          <td>${line.employee_name}</td>
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
          <td>${line.hari_kerja} hari</td>
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
            <td style="border: 1px solid #ddd; padding: 8px;">Upah Harian (${line.hari_kerja} hari)</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(line.upah_harian * line.hari_kerja)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Uang Makan (${line.hari_kerja} hari)</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(line.uang_makan_harian * line.hari_kerja)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Uang BBM (${line.hari_kerja} hari)</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(line.uang_bbm_harian * line.hari_kerja)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
          ${componentDetails}
          <tr style="background-color: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Total Bruto</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>${formatCurrency(line.bruto)}</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Pajak (${line.pajak_rate}%)</td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(line.pajak_nominal || 0)}</td>
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
              <p>( ${line.employee_name} )</p>
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

    generatePDF(htmlContent, `Slip_Gaji_${line.employee_name}_${payrollRun?.periode_awal}.pdf`)
    
    toast({
      title: "Slip gaji berhasil dibuat",
      description: `Slip gaji ${line.employee_name} berhasil di-generate ke PDF`
    })
  }

  const exportPayrollToExcel = () => {
    if (!payrollRun) {
      toast({
        title: "Tidak ada data",
        description: "Belum ada payroll run untuk diekspor",
        variant: "destructive"
      })
      return
    }

    const exportData = payrollRun.payroll_lines.map(line => {
      const employee = employees.find(emp => emp.id === line.employee_id)
      return {
        'Nama Karyawan': line.employee_name,
        'Jabatan': employee?.jabatan || '-',
        'Site': employee?.site || '-',
        'Hari Kerja': line.hari_kerja,
        'Upah Harian': line.upah_harian,
        'Uang Makan/Hari': line.uang_makan_harian,
        'Uang BBM/Hari': line.uang_bbm_harian,
        'Total Bruto': line.bruto,
        'Pajak': line.pajak_nominal || 0,
        'Total Neto': line.neto,
        'Status': line.status
      }
    })

    if (exportToExcel(exportData, `Payroll_${payrollRun.periode_awal}_${payrollRun.periode_akhir}.xlsx`, 'Payroll')) {
      toast({
        title: "Export berhasil",
        description: "Data payroll berhasil diekspor ke Excel"
      })
    }
  }

  const getStatusBadge = (status: PayrollRun['status']) => {
    const badges = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      reviewed: { label: 'Direview', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
      paid: { label: 'Dibayar', color: 'bg-blue-100 text-blue-800' }
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
            {/* Period Selection */}
            {!payrollRun && (
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
                        value={selectedPeriod.periode_awal}
                        onChange={(e) => setSelectedPeriod(prev => ({ 
                          ...prev, 
                          periode_awal: e.target.value 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periode_akhir">Periode Akhir</Label>
                      <Input
                        id="periode_akhir"
                        type="date"
                        value={selectedPeriod.periode_akhir}
                        onChange={(e) => setSelectedPeriod(prev => ({ 
                          ...prev, 
                          periode_akhir: e.target.value 
                        }))}
                      />
                    </div>
                  </div>
                  <Button onClick={createPayrollRun} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Payroll
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payroll Run Details */}
            {payrollRun && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Payroll Run - {payrollRun.periode_awal} sampai {payrollRun.periode_akhir}
                        </CardTitle>
                        <CardDescription>
                          {payrollRun.payroll_lines.length} karyawan • 
                          Total: {formatCurrency(payrollRun.payroll_lines.reduce((sum, line) => sum + line.neto, 0))}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payrollRun.status)}
                        {payrollRun.status === 'draft' && (
                          <Button 
                            onClick={approvePayroll}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        <Button variant="outline" onClick={exportPayrollToExcel}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Excel
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {payrollRun.payroll_lines.map((line) => (
                        <Card key={line.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{line.employee_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {employees.find(emp => emp.id === line.employee_id)?.jabatan} • 
                                  {employees.find(emp => emp.id === line.employee_id)?.site}
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
                                {isEditingLine === line.id ? (
                                  <Input
                                    type="number"
                                    value={line.hari_kerja}
                                    onChange={(e) => updatePayrollLine(line.id, 'hari_kerja', parseInt(e.target.value))}
                                    className="mt-1"
                                    min="0"
                                    max="31"
                                  />
                                ) : (
                                  <p className="text-muted-foreground">{line.hari_kerja} hari</p>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">Upah Harian:</span>
                                <p className="text-muted-foreground">{formatCurrency(line.upah_harian)}</p>
                              </div>
                              <div>
                                <span className="font-medium">Uang Makan:</span>
                                <p className="text-muted-foreground">{formatCurrency(line.uang_makan_harian)}/hari</p>
                              </div>
                              <div>
                                <span className="font-medium">Uang BBM:</span>
                                <p className="text-muted-foreground">{formatCurrency(line.uang_bbm_harian)}/hari</p>
                              </div>
                              <div>
                                <span className="font-medium">Bruto:</span>
                                <p className="text-muted-foreground">{formatCurrency(line.bruto)}</p>
                              </div>
                            </div>

                            {/* Component Details */}
                            {line.components.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium mb-2">Komponen Tambahan:</h4>
                                <div className="space-y-1">
                                  {line.components.map((comp) => (
                                    <div key={comp.id} className="flex justify-between text-sm">
                                      <span className={comp.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                        {comp.component_name}
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
                              <span className="font-medium">Pajak ({line.pajak_rate}%):</span>
                              <span className="text-red-600">{formatCurrency(line.pajak_nominal || 0)}</span>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t">
                              <div className="flex gap-2">
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditingLine(line.id)}
                                    disabled={payrollRun.status === 'approved'}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
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
                                {payrollRun.status === 'approved' && (
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Karyawan
              </CardTitle>
              <CardDescription>
                Kelola data karyawan dan kontrak upah harian
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                              <p className="text-muted-foreground">{formatCurrency(employee.kontrak_upah_harian)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Uang Makan:</span>
                              <p className="text-muted-foreground">{formatCurrency(employee.default_uang_makan)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Uang BBM:</span>
                              <p className="text-muted-foreground">{formatCurrency(employee.default_uang_bbm)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Komponen Gaji
              </CardTitle>
              <CardDescription>
                Kelola komponen gaji dinamis (tunjangan, potongan, dll)
              </CardDescription>
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
                              component.tipe === 'earning' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {component.tipe === 'earning' ? 'Tambahan' : 'Potongan'}
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
                                {component.metode === 'persentase' ? 'Rate:' : 'Nominal:'}
                              </span>
                              <p className="text-muted-foreground">
                                {component.metode === 'persentase' 
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
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button className="w-full" variant="outline">
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
                  {payrollRun && (
                    <>
                      <div className="flex justify-between">
                        <span>Total Bruto:</span>
                        <span className="font-semibold">
                          {formatCurrency(payrollRun.payroll_lines.reduce((sum, line) => sum + line.bruto, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Pajak:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(payrollRun.payroll_lines.reduce((sum, line) => sum + (line.pajak_nominal || 0), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Neto:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(payrollRun.payroll_lines.reduce((sum, line) => sum + line.neto, 0))}
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
                  <Button className="w-full" variant="outline" disabled={!payrollRun}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Slip Gaji (PDF)
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
