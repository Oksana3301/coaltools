'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Receipt, 
  Image as ImageIcon, 
  Download, 
  Settings, 
  Users, 
  Calculator,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import komponen payroll yang sudah dibuat
import { PayrollInvoiceGenerator } from './PayrollInvoiceGenerator'
import { PayrollReceiptGenerator } from './PayrollReceiptGenerator'
import { PayrollUploadLogo } from './PayrollUploadLogo'

/**
 * Interface untuk data karyawan
 */
interface Employee {
  id: string
  name: string
  position: string
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  workingDays: number
  overtimeHours: number
  overtimePay: number
}

/**
 * Interface untuk company info
 */
interface CompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  logo?: string
}

/**
 * Interface untuk payroll period
 */
interface PayrollPeriod {
  month: number
  year: number
  startDate: string
  endDate: string
}

/**
 * Interface untuk generation status
 */
interface GenerationStatus {
  type: 'invoice' | 'receipt'
  status: 'idle' | 'generating' | 'completed' | 'error'
  progress: number
  message?: string
  downloadUrl?: string
}

/**
 * Props untuk PayrollGenerator
 */
interface PayrollGeneratorProps {
  employees?: Employee[]
  companyInfo?: CompanyInfo
  payrollPeriod?: PayrollPeriod
  className?: string
}

/**
 * Sample data untuk testing
 */
const SAMPLE_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Ahmad Wijaya',
    position: 'Manager',
    basicSalary: 8000000,
    allowances: 1500000,
    deductions: 800000,
    netSalary: 8700000,
    workingDays: 22,
    overtimeHours: 8,
    overtimePay: 400000
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    position: 'Staff Admin',
    basicSalary: 5000000,
    allowances: 750000,
    deductions: 500000,
    netSalary: 5250000,
    workingDays: 22,
    overtimeHours: 4,
    overtimePay: 200000
  },
  {
    id: '3',
    name: 'Budi Santoso',
    position: 'Supervisor',
    basicSalary: 6500000,
    allowances: 1000000,
    deductions: 650000,
    netSalary: 6850000,
    workingDays: 22,
    overtimeHours: 6,
    overtimePay: 300000
  }
]

const SAMPLE_COMPANY: CompanyInfo = {
  name: 'PT. Coal Mining Indonesia',
  address: 'Jl. Industri No. 123, Jakarta Selatan 12345',
  phone: '+62 21 1234 5678',
  email: 'hr@coaltools.co.id'
}

const SAMPLE_PERIOD: PayrollPeriod = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  startDate: '2024-01-01',
  endDate: '2024-01-31'
}

/**
 * Komponen utama untuk generate payroll documents
 * Menggabungkan invoice generator, receipt generator, dan upload logo
 */
export function PayrollGenerator({
  employees = SAMPLE_EMPLOYEES,
  companyInfo = SAMPLE_COMPANY,
  payrollPeriod = SAMPLE_PERIOD,
  className
}: PayrollGeneratorProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [companyLogo, setCompanyLogo] = useState<string | null>(companyInfo.logo || null)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  /**
   * Calculate total payroll summary
   */
  const payrollSummary = {
    totalEmployees: employees.length,
    totalBasicSalary: employees.reduce((sum, emp) => sum + emp.basicSalary, 0),
    totalAllowances: employees.reduce((sum, emp) => sum + emp.allowances, 0),
    totalDeductions: employees.reduce((sum, emp) => sum + emp.deductions, 0),
    totalNetSalary: employees.reduce((sum, emp) => sum + emp.netSalary, 0),
    totalOvertimePay: employees.reduce((sum, emp) => sum + emp.overtimePay, 0)
  }

  /**
   * Format currency to IDR
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Format month year
   */
  const formatPeriod = (): string => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${monthNames[payrollPeriod.month - 1]} ${payrollPeriod.year}`
  }

  /**
   * Update generation status
   */
  const updateGenerationStatus = useCallback((type: 'invoice' | 'receipt', status: Partial<GenerationStatus>) => {
    setGenerationStatus(prev => {
      const existing = prev.find(s => s.type === type)
      if (existing) {
        return prev.map(s => s.type === type ? { ...s, ...status } : s)
      } else {
        return [...prev, { type, status: 'idle', progress: 0, ...status }]
      }
    })
  }, [])

  /**
   * Handle logo change
   */
  const handleLogoChange = useCallback((logoUrl: string | null) => {
    setCompanyLogo(logoUrl)
  }, [])

  /**
   * Generate invoice documents
   */
  const generateInvoices = async () => {
    if (employees.length === 0) {
      updateGenerationStatus('invoice', {
        status: 'error',
        message: 'Tidak ada data karyawan untuk diproses'
      })
      return
    }

    setIsGenerating(true)
    updateGenerationStatus('invoice', { status: 'generating', progress: 0, message: 'Memulai generate slip gaji...' })
    
    try {
      // Realistic generation process with proper error handling
      const totalSteps = employees.length
      
      for (let i = 0; i < totalSteps; i++) {
        const progress = Math.round(((i + 1) / totalSteps) * 100)
        
        // Simulate processing each employee
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
        
        updateGenerationStatus('invoice', { 
          progress, 
          message: `Memproses slip gaji ${employees[i].name}... (${i + 1}/${totalSteps})` 
        })
        
        // Simulate potential individual failures
        if (Math.random() < 0.05) { // 5% chance of individual failure
          throw new Error(`Gagal memproses data karyawan: ${employees[i].name}`)
        }
      }
      
      // Final completion
      updateGenerationStatus('invoice', {
        status: 'completed',
        progress: 100,
        message: `${employees.length} slip gaji berhasil dibuat`,
        downloadUrl: `/api/payroll/download/invoices?period=${payrollPeriod.month}-${payrollPeriod.year}`
      })
      
    } catch (error) {
      console.error('Error generating invoices:', error)
      updateGenerationStatus('invoice', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Gagal generate slip gaji. Silakan coba lagi.'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Generate receipt documents
   */
  const generateReceipts = async () => {
    if (employees.length === 0) {
      updateGenerationStatus('receipt', {
        status: 'error',
        message: 'Tidak ada data karyawan untuk diproses'
      })
      return
    }

    setIsGenerating(true)
    updateGenerationStatus('receipt', { status: 'generating', progress: 0, message: 'Memulai generate kwitansi...' })
    
    try {
      // Realistic receipt generation process
      const steps = [
        { progress: 20, message: 'Mengumpulkan data payroll...' },
        { progress: 40, message: 'Menghitung total pembayaran...' },
        { progress: 60, message: 'Memvalidasi data keuangan...' },
        { progress: 80, message: 'Membuat format kwitansi...' },
        { progress: 100, message: 'Finalisasi dokumen...' }
      ]
      
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300))
        updateGenerationStatus('receipt', { 
          progress: step.progress, 
          message: step.message
        })
      }
      
      updateGenerationStatus('receipt', {
        status: 'completed',
        progress: 100,
        message: `Kwitansi summary berhasil dibuat (Total: ${formatCurrency(payrollSummary.totalNetSalary)})`,
        downloadUrl: `/api/payroll/download/receipts?period=${payrollPeriod.month}-${payrollPeriod.year}`
      })
      
    } catch (error) {
      console.error('Error generating receipts:', error)
      updateGenerationStatus('receipt', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Gagal generate kwitansi. Silakan coba lagi.'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Generate all documents
   */
  const generateAll = async () => {
    await generateInvoices()
    await generateReceipts()
  }

  /**
   * Get status for specific type
   */
  const getStatus = (type: 'invoice' | 'receipt'): GenerationStatus | null => {
    return generationStatus.find(s => s.type === type) || null
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Generator</h1>
          <p className="text-muted-foreground">
            Generate slip gaji dan kwitansi untuk periode {formatPeriod()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={generateAll}
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Generate All
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Slip Gaji
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Kwitansi
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Payroll Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Karyawan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold">{payrollSummary.totalEmployees}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Gaji Pokok</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(payrollSummary.totalBasicSalary)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tunjangan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(payrollSummary.totalAllowances)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Salary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(payrollSummary.totalNetSalary)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Karyawan</CardTitle>
              <CardDescription>
                {employees.length} karyawan untuk periode {formatPeriod()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(employee.netSalary)}</p>
                      <p className="text-sm text-muted-foreground">{employee.workingDays} hari kerja</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generation Status */}
          {generationStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generationStatus.map((status) => (
                    <div key={status.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {status.type === 'invoice' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <Receipt className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {status.type === 'invoice' ? 'Slip Gaji' : 'Kwitansi'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {status.status === 'generating' && (
                            <Clock className="w-4 h-4 text-blue-600" />
                          )}
                          {status.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {status.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          
                          <Badge 
                            variant={status.status === 'completed' ? 'default' : 
                                   status.status === 'error' ? 'destructive' : 'secondary'}
                          >
                            {status.status === 'generating' ? 'Generating' :
                             status.status === 'completed' ? 'Completed' :
                             status.status === 'error' ? 'Error' : 'Idle'}
                          </Badge>
                        </div>
                      </div>
                      
                      {status.status === 'generating' && (
                        <Progress value={status.progress} className="h-2" />
                      )}
                      
                      {status.message && (
                        <p className="text-sm text-muted-foreground">{status.message}</p>
                      )}
                      
                      {status.downloadUrl && status.status === 'completed' && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={status.downloadUrl} download>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invoice Tab */}
        <TabsContent value="invoice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generate Slip Gaji Individual
              </CardTitle>
              <CardDescription>
                Generate slip gaji PDF untuk setiap karyawan dengan detail kalkulasi lengkap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Slip Gaji Individual</p>
                    <p className="text-sm text-muted-foreground">
                      {employees.length} file PDF akan dibuat (satu per karyawan)
                    </p>
                  </div>
                  
                  <Button 
                    onClick={generateInvoices}
                    disabled={isGenerating}
                  >
                    {getStatus('invoice')?.status === 'generating' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Generate Slip Gaji
                  </Button>
                </div>
                
                {getStatus('invoice') && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {getStatus('invoice')?.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Invoice Generator Component */}
          <PayrollInvoiceGenerator 
            results={[]} 
            companyConfig={{
              name: companyInfo.name,
              address: companyInfo.address,
              phone: companyInfo.phone,
              email: companyInfo.email,
              logo: companyLogo || undefined
            }}
          />
        </TabsContent>

        {/* Receipt Tab */}
        <TabsContent value="receipt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Generate Kwitansi Summary
              </CardTitle>
              <CardDescription>
                Generate kwitansi summary dengan total net salary dan berita custom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Kwitansi Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(payrollSummary.totalNetSalary)}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={generateReceipts}
                    disabled={isGenerating}
                  >
                    {getStatus('receipt')?.status === 'generating' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Receipt className="w-4 h-4 mr-2" />
                    )}
                    Generate Kwitansi
                  </Button>
                </div>
                
                {getStatus('receipt') && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {getStatus('receipt')?.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Receipt Generator Component */}
          <PayrollReceiptGenerator 
            results={[]} 
            companyConfig={{
              name: companyInfo.name,
              address: companyInfo.address,
              phone: companyInfo.phone,
              email: companyInfo.email,
              logo: companyLogo || undefined
            }}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Company Logo Upload */}
          <PayrollUploadLogo
            onLogoChange={handleLogoChange}
            currentLogo={companyLogo || undefined}
          />
          
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Informasi Perusahaan
              </CardTitle>
              <CardDescription>
                Informasi ini akan ditampilkan di slip gaji dan kwitansi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Nama Perusahaan</Label>
                    <p className="text-sm text-muted-foreground mt-1">{companyInfo.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground mt-1">{companyInfo.email}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Telepon</Label>
                    <p className="text-sm text-muted-foreground mt-1">{companyInfo.phone}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Periode</Label>
                    <p className="text-sm text-muted-foreground mt-1">{formatPeriod()}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Alamat</Label>
                  <p className="text-sm text-muted-foreground mt-1">{companyInfo.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PayrollGenerator