'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Calculator, 
  FileText, 
  Receipt, 
  Settings, 
  Users, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  generateSamplePayrollData, 
  SAMPLE_COMPANY_LOGO,
  type SampleEmployee 
} from '@/lib/sample-payroll-data'

// Import komponen yang sudah ada
import { OfflinePayrollCalculator } from '@/components/payroll/OfflinePayrollCalculator'
import { PayrollCalculator } from '@/components/coal-tools/payroll-calculator'
import { PayrollGenerator } from '@/components/payroll/PayrollGenerator'
import { PayrollUploadLogo } from '@/components/payroll/PayrollUploadLogo'
import { PayrollPDFExport, type PayrollExportData } from '@/components/payroll/PayrollPDFExport'
import { PayrollPDFImport, type PayrollImportData } from '@/components/payroll/PayrollPDFImport'
import { PayrollSaveToDatabase, type PayrollSaveData } from '@/components/payroll/PayrollSaveToDatabase'
import { SupabaseCompatibilityTest } from '@/components/payroll/SupabaseCompatibilityTest'

/**
 * Interface untuk data karyawan yang terintegrasi
 */
interface IntegratedEmployee {
  id: string
  nama: string
  posisi: string
  upahHarian: number
  uangMakanHarian: number
  uangBbmHarian: number
  hariKerja: number
  overtimeHours: number
  overtimeRate: number
  overtimeAmount: number
  cashbon: number
  bruto: number
  pajakNominal: number
  neto: number
  components: PayrollComponent[]
}

/**
 * Interface untuk komponen payroll
 */
interface PayrollComponent {
  componentId: string
  componentName: string
  amount: number
  taxable: boolean
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
  periodeAwal: string
  periodeAkhir: string
  month: number
  year: number
}

/**
 * Interface untuk workflow status
 */
interface WorkflowStatus {
  step: 'calculator' | 'review' | 'generator' | 'completed'
  calculatorCompleted: boolean
  reviewCompleted: boolean
  generatorCompleted: boolean
  hasData: boolean
}

/**
 * Props untuk IntegratedPayrollSystem
 */
interface IntegratedPayrollSystemProps {
  className?: string
}

/**
 * Sample data untuk testing
 */
const SAMPLE_COMPANY: CompanyInfo = {
  name: 'PT. Coal Mining Indonesia',
  address: 'Jl. Industri No. 123, Jakarta Selatan 12345',
  phone: '+62 21 1234 5678',
  email: 'hr@coaltools.co.id'
}

const SAMPLE_PERIOD: PayrollPeriod = {
  periodeAwal: '2024-01-01',
  periodeAkhir: '2024-01-31',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear()
}

/**
 * Komponen utama sistem payroll terintegrasi
 * Menggabungkan PayrollCalculator dan PayrollGenerator dalam satu workflow
 */
export function IntegratedPayrollSystem({ className }: IntegratedPayrollSystemProps) {
  const [activeTab, setActiveTab] = useState('calculator')
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    step: 'calculator',
    calculatorCompleted: false,
    reviewCompleted: false,
    generatorCompleted: false,
    hasData: false
  })
  const [calculatedEmployees, setCalculatedEmployees] = useState<IntegratedEmployee[]>([])
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(SAMPLE_COMPANY)
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriod>(SAMPLE_PERIOD)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [sampleDataLoaded, setSampleDataLoaded] = useState(false)
  const [databaseAvailable, setDatabaseAvailable] = useState<boolean | null>(null)
  const [isCheckingDatabase, setIsCheckingDatabase] = useState(true)
  const [showPDFTools, setShowPDFTools] = useState(false)

  /**
   * Check database availability
   */
  const checkDatabaseAvailability = useCallback(async () => {
    setIsCheckingDatabase(true)
    try {
      console.log('🔍 Checking database availability...')
      
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      })
      
      console.log('📡 Health check response status:', response.status)
      
      if (!response.ok) {
        console.error('❌ Health check response not ok:', response.status, response.statusText)
        setDatabaseAvailable(false)
        return
      }
      
      const data = await response.json()
      console.log('📊 Health check data:', data)
      
      // Check if database is available and connected
      const isDatabaseConnected = data.success && 
                                 data.database && 
                                 data.database.available === true && 
                                 data.database.status === 'connected'
      
      console.log('🔌 Database connected:', isDatabaseConnected)
      
      if (isDatabaseConnected) {
        setDatabaseAvailable(true)
        console.log('✅ Database is available and connected')
      } else {
        setDatabaseAvailable(false)
        console.log('❌ Database is not available:', {
          success: data.success,
          database: data.database
        })
      }
    } catch (error) {
      console.error('💥 Database check failed with error:', error)
      setDatabaseAvailable(false)
    } finally {
      setIsCheckingDatabase(false)
      console.log('🏁 Database check completed')
    }
  }, [])

  /**
   * Check database availability on component mount
   */
  useEffect(() => {
    checkDatabaseAvailability()
  }, [checkDatabaseAvailability])

  /**
   * Handle data dari PayrollCalculator
   */
  const handleCalculatorData = useCallback((payrollData: any) => {
    console.log('Received payroll data:', payrollData)
    
    // Transform data dari PayrollCalculator ke format IntegratedEmployee
    if (payrollData && payrollData.payrollLines) {
      const transformedEmployees: IntegratedEmployee[] = payrollData.payrollLines.map((line: any) => ({
        id: line.employeeId,
        nama: line.employeeName || `Karyawan ${line.employeeId}`,
        posisi: 'Staff', // Default position
        upahHarian: line.upahHarian || 0,
        uangMakanHarian: line.uangMakanHarian || 0,
        uangBbmHarian: line.uangBbmHarian || 0,
        hariKerja: line.hariKerja || 0,
        overtimeHours: line.overtimeHours || 0,
        overtimeRate: line.overtimeRate || 1.5,
        overtimeAmount: line.overtimeAmount || 0,
        cashbon: line.cashbon || 0,
        bruto: line.bruto || 0,
        pajakNominal: line.pajakNominal || 0,
        neto: line.neto || 0,
        components: line.components || []
      }))
      
      setCalculatedEmployees(transformedEmployees)
      setWorkflowStatus(prev => ({
        ...prev,
        calculatorCompleted: true,
        hasData: true
      }))
    }
  }, [])

  /**
   * Handle transfer data ke PayrollGenerator
   */
  const handleTransferToGenerator = async () => {
    if (calculatedEmployees.length === 0) {
      return
    }

    setIsTransferring(true)
    
    try {
      // Simulate data transfer process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setWorkflowStatus(prev => ({
        ...prev,
        step: 'generator',
        reviewCompleted: true
      }))
      
      setActiveTab('generator')
    } catch (error) {
      console.error('Error transferring data:', error)
    } finally {
      setIsTransferring(false)
    }
  }

  /**
   * Handle logo upload
   */
  const handleLogoChange = useCallback((logoUrl: string | null) => {
    setCompanyLogo(logoUrl)
    setCompanyInfo(prev => ({ ...prev, logo: logoUrl || undefined }))
  }, [])

  /**
   * Load sample data untuk testing
   */
  const loadSampleData = useCallback(() => {
    const sampleData = generateSamplePayrollData()
    
    // Transform sample data ke format IntegratedEmployee
    const transformedEmployees: IntegratedEmployee[] = sampleData.calculationResults.map((result) => ({
      id: result.employeeId,
      nama: result.employeeName,
      posisi: sampleData.employees.find(emp => emp.id === result.employeeId)?.posisi || 'Staff',
      upahHarian: result.upahHarian,
      uangMakanHarian: result.earnings.find(e => e.name === 'Uang Makan Harian')?.amount || 0,
      uangBbmHarian: result.earnings.find(e => e.name === 'Uang BBM Harian')?.amount || 0,
      hariKerja: result.hariKerja,
      overtimeHours: sampleData.employees.find(emp => emp.id === result.employeeId)?.overtimeHours || 0,
      overtimeRate: sampleData.employees.find(emp => emp.id === result.employeeId)?.overtimeRate || 1.5,
      overtimeAmount: result.overtimeAmount,
      cashbon: sampleData.employees.find(emp => emp.id === result.employeeId)?.cashbon || 0,
      bruto: result.bruto,
      pajakNominal: result.pajak,
      neto: result.neto,
      components: result.earnings.map(e => ({
        componentId: `earning-${e.name}`,
        componentName: e.name,
        amount: e.amount,
        taxable: e.taxable
      })).concat(result.deductions.map(d => ({
        componentId: `deduction-${d.name}`,
        componentName: d.name,
        amount: d.amount,
        taxable: false
      })))
    }))
    
    setCalculatedEmployees(transformedEmployees)
    setCompanyInfo(sampleData.companyInfo)
    setPayrollPeriod(sampleData.payrollPeriod)
    setCompanyLogo(SAMPLE_COMPANY_LOGO)
    setSampleDataLoaded(true)
    
    setWorkflowStatus(prev => ({
      ...prev,
      calculatorCompleted: true,
      hasData: true
    }))
  }, [])

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
   * Format period
   */
  const formatPeriod = (): string => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${monthNames[payrollPeriod.month - 1]} ${payrollPeriod.year}`
  }

  /**
   * Calculate summary statistics
   */
  const payrollSummary = {
    totalEmployees: calculatedEmployees.length,
    totalBruto: calculatedEmployees.reduce((sum, emp) => sum + emp.bruto, 0),
    totalPajak: calculatedEmployees.reduce((sum, emp) => sum + emp.pajakNominal, 0),
    totalNeto: calculatedEmployees.reduce((sum, emp) => sum + emp.neto, 0),
    totalOvertime: calculatedEmployees.reduce((sum, emp) => sum + emp.overtimeAmount, 0)
  }

  /**
   * Convert data untuk export PDF
   */
  const convertToExportData = useCallback((): PayrollExportData => {
    return {
      employees: calculatedEmployees.map(emp => ({
        id: emp.id,
        name: emp.nama,
        position: emp.posisi,
        basicSalary: emp.upahHarian * emp.hariKerja,
        allowances: emp.uangMakanHarian + emp.uangBbmHarian,
        deductions: emp.cashbon + emp.pajakNominal,
        netSalary: emp.neto,
        workingDays: emp.hariKerja,
        overtimeHours: emp.overtimeHours,
        overtimePay: emp.overtimeAmount,
        components: emp.components.map(comp => ({
          name: comp.componentName,
          amount: comp.amount,
          type: comp.taxable ? 'earning' : 'deduction'
        }))
      })),
      companyInfo: {
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email,
        logo: companyLogo || undefined
      },
      payrollPeriod: {
        month: payrollPeriod.month,
        year: payrollPeriod.year,
        startDate: payrollPeriod.periodeAwal,
        endDate: payrollPeriod.periodeAkhir
      },
      summary: payrollSummary
    }
  }, [calculatedEmployees, companyInfo, companyLogo, payrollPeriod, payrollSummary])

  /**
   * Handle import data dari PDF
   */
  const handleImportData = useCallback((importedData: PayrollImportData | null, success: boolean, message: string) => {
    if (success && importedData) {
      // Convert imported data ke format IntegratedEmployee
      const convertedEmployees: IntegratedEmployee[] = importedData.employees.map(emp => ({
        id: emp.id,
        nama: emp.name,
        posisi: emp.position,
        upahHarian: emp.basicSalary / emp.workingDays,
        uangMakanHarian: emp.allowances / emp.workingDays,
        uangBbmHarian: 0, // Default value
        hariKerja: emp.workingDays,
        overtimeHours: emp.overtimeHours,
        overtimeRate: 1.5, // Default value
        overtimeAmount: emp.overtimePay,
        cashbon: emp.deductions - (emp.basicSalary + emp.allowances + emp.overtimePay - emp.netSalary),
        bruto: emp.basicSalary + emp.allowances + emp.overtimePay,
        pajakNominal: (emp.basicSalary + emp.allowances + emp.overtimePay - emp.netSalary) - emp.deductions,
        neto: emp.netSalary,
        components: emp.components.map(comp => ({
          componentId: `imported-${comp.name}`,
          componentName: comp.name,
          amount: comp.amount,
          taxable: comp.type === 'earning'
        }))
      }))

      setCalculatedEmployees(convertedEmployees)
      setWorkflowStatus(prev => ({
        ...prev,
        calculatorCompleted: true,
        hasData: true
      }))
    }
  }, [])

  /**
   * Handle export completion
   */
  const handleExportComplete = useCallback((success: boolean, message: string) => {
    console.log('Export completed:', success, message)
  }, [])

  /**
   * Convert data untuk save ke database
   */
  const convertToSaveData = useCallback((): PayrollSaveData => {
    return {
      employees: calculatedEmployees.map(emp => ({
        id: emp.id,
        name: emp.nama,
        position: emp.posisi,
        basicSalary: emp.upahHarian * emp.hariKerja,
        allowances: emp.uangMakanHarian + emp.uangBbmHarian,
        deductions: emp.cashbon + emp.pajakNominal,
        netSalary: emp.neto,
        workingDays: emp.hariKerja,
        overtimeHours: emp.overtimeHours,
        overtimePay: emp.overtimeAmount,
        components: emp.components.map(comp => ({
          name: comp.componentName,
          amount: comp.amount,
          type: comp.taxable ? 'earning' : 'deduction'
        }))
      })),
      companyInfo: {
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        email: companyInfo.email
      },
      payrollPeriod: {
        month: payrollPeriod.month,
        year: payrollPeriod.year,
        startDate: payrollPeriod.periodeAwal,
        endDate: payrollPeriod.periodeAkhir
      },
      summary: payrollSummary
    }
  }, [calculatedEmployees, companyInfo, payrollPeriod, payrollSummary])

  /**
   * Handle save to database completion
   */
  const handleSaveComplete = useCallback((success: boolean, message: string, savedData?: any) => {
    console.log('Save completed:', success, message, savedData)
    if (success) {
      setWorkflowStatus(prev => ({
        ...prev,
        generatorCompleted: true
      }))
    }
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header dengan Workflow Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Sistem Payroll Terintegrasi
            </h1>
            <p className="text-muted-foreground">
              Kalkulator gaji dan generator slip gaji dalam satu workflow yang mulus
            </p>
          </div>
          
          <div className="flex items-center gap-2">
                {workflowStatus.hasData && (
                  <>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {calculatedEmployees.length} Karyawan
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {formatCurrency(payrollSummary.totalNeto)}
                    </Badge>
                  </>
                )}
                
                {!sampleDataLoaded && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadSampleData}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Load Sample Data
                  </Button>
                )}
              </div>
        </div>

        {/* Workflow Progress */}
        <Card className="border-2 border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  workflowStatus.calculatorCompleted 
                    ? "bg-green-100 text-green-600" 
                    : workflowStatus.step === 'calculator'
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-400"
                )}>
                  {workflowStatus.calculatorCompleted ? <CheckCircle className="w-4 h-4" /> : "1"}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  workflowStatus.calculatorCompleted ? "text-green-600" : "text-gray-600"
                )}>
                  Kalkulator Gaji
                </span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-gray-400" />
              
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  workflowStatus.reviewCompleted 
                    ? "bg-green-100 text-green-600" 
                    : workflowStatus.step === 'review'
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-400"
                )}>
                  {workflowStatus.reviewCompleted ? <CheckCircle className="w-4 h-4" /> : "2"}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  workflowStatus.reviewCompleted ? "text-green-600" : "text-gray-600"
                )}>
                  Review & Transfer
                </span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-gray-400" />
              
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  workflowStatus.generatorCompleted 
                    ? "bg-green-100 text-green-600" 
                    : workflowStatus.step === 'generator'
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-400"
                )}>
                  {workflowStatus.generatorCompleted ? <CheckCircle className="w-4 h-4" /> : "3"}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  workflowStatus.generatorCompleted ? "text-green-600" : "text-gray-600"
                )}>
                  Generate PDF
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Kalkulator
          </TabsTrigger>
          <TabsTrigger 
            value="review" 
            disabled={!workflowStatus.calculatorCompleted}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Review Data
          </TabsTrigger>
          <TabsTrigger 
            value="generator" 
            disabled={!workflowStatus.reviewCompleted}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="pdf-tools" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            PDF Tools
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Kalkulator Gaji Karyawan
              </CardTitle>
              <CardDescription>
                Hitung gaji karyawan dengan komponen dinamis dan validasi otomatis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCheckingDatabase ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">Memeriksa koneksi database...</span>
                </div>
              ) : databaseAvailable ? (
                <PayrollCalculator />
              ) : (
                <OfflinePayrollCalculator />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Review Data Payroll
              </CardTitle>
              <CardDescription>
                Tinjau dan validasi data sebelum generate slip gaji
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {calculatedEmployees.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Belum ada data payroll. Silakan lengkapi kalkulator gaji terlebih dahulu.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{payrollSummary.totalEmployees}</p>
                          <p className="text-sm text-muted-foreground">Total Karyawan</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{formatCurrency(payrollSummary.totalBruto)}</p>
                          <p className="text-sm text-muted-foreground">Total Bruto</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">{formatCurrency(payrollSummary.totalPajak)}</p>
                          <p className="text-sm text-muted-foreground">Total Pajak</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-600">{formatCurrency(payrollSummary.totalNeto)}</p>
                          <p className="text-sm text-muted-foreground">Total Neto</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Employee List */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Daftar Karyawan ({calculatedEmployees.length})</h3>
                    {calculatedEmployees.map((employee) => (
                      <Card key={employee.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{employee.nama}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.hariKerja} hari kerja • {employee.overtimeHours}h lembur
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-purple-600">{formatCurrency(employee.neto)}</p>
                              <p className="text-sm text-muted-foreground">
                                Bruto: {formatCurrency(employee.bruto)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Transfer Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleTransferToGenerator}
                      disabled={isTransferring}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isTransferring ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Transfer ke Generator
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generator Slip Gaji & Kwitansi
              </CardTitle>
              <CardDescription>
                Generate PDF slip gaji dan kwitansi dengan header perusahaan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculatedEmployees.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Belum ada data untuk di-generate. Silakan lengkapi workflow dari awal.
                  </AlertDescription>
                </Alert>
              ) : (
                <PayrollGenerator 
                  employees={calculatedEmployees.map(emp => ({
                    id: emp.id,
                    name: emp.nama,
                    position: emp.posisi,
                    basicSalary: emp.upahHarian * emp.hariKerja,
                    allowances: emp.uangMakanHarian + emp.uangBbmHarian,
                    deductions: emp.cashbon + emp.pajakNominal,
                    netSalary: emp.neto,
                    workingDays: emp.hariKerja,
                    overtimeHours: emp.overtimeHours,
                    overtimePay: emp.overtimeAmount
                  }))}
                  companyInfo={companyInfo}
                  payrollPeriod={{
                    month: payrollPeriod.month,
                    year: payrollPeriod.year,
                    startDate: payrollPeriod.periodeAwal,
                    endDate: payrollPeriod.periodeAkhir
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Tools Tab */}
        <TabsContent value="pdf-tools" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export PDF */}
            <PayrollPDFExport
              data={convertToExportData()}
              onExportComplete={handleExportComplete}
            />
            
            {/* Import PDF */}
            <PayrollPDFImport
              onImportComplete={handleImportData}
            />
          </div>
          
          {/* Save to Database */}
          {calculatedEmployees.length > 0 && (
            <div className="mt-6">
              <PayrollSaveToDatabase
                data={convertToSaveData()}
                onSaveComplete={handleSaveComplete}
              />
            </div>
          )}
          
          {/* Supabase Compatibility Test */}
          <div className="mt-6">
            <SupabaseCompatibilityTest />
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Informasi Perusahaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nama Perusahaan</label>
                  <p className="text-sm text-muted-foreground">{companyInfo.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Alamat</label>
                  <p className="text-sm text-muted-foreground">{companyInfo.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telepon</label>
                  <p className="text-sm text-muted-foreground">{companyInfo.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{companyInfo.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Logo Perusahaan
                </CardTitle>
                <CardDescription>
                  Upload logo untuk ditampilkan di slip gaji dan kwitansi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PayrollUploadLogo 
                  onLogoChange={handleLogoChange}
                  currentLogo={companyLogo || undefined}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default IntegratedPayrollSystem