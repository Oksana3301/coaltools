'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Calendar,
  DollarSign,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Interface untuk data payroll yang di-import
 */
export interface PayrollImportData {
  employees: Array<{
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
    components: Array<{
      name: string
      amount: number
      type: 'earning' | 'deduction'
    }>
  }>
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
    logo?: string
  }
  payrollPeriod: {
    month: number
    year: number
    startDate: string
    endDate: string
  }
  summary: {
    totalEmployees: number
    totalBruto: number
    totalPajak: number
    totalNeto: number
  }
}

/**
 * Props untuk komponen PayrollPDFImport
 */
interface PayrollPDFImportProps {
  onImportComplete?: (data: PayrollImportData | null, success: boolean, message: string) => void
  onDataValidation?: (data: any) => { isValid: boolean; errors: string[] }
  className?: string
}

/**
 * Komponen untuk import payroll dari PDF
 * Mendukung validasi data dan preview sebelum import
 */
export function PayrollPDFImport({ 
  onImportComplete,
  onDataValidation,
  className 
}: PayrollPDFImportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const [importedData, setImportedData] = useState<PayrollImportData | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Format currency ke Rupiah
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Validasi data payroll
   */
  const validatePayrollData = useCallback((data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Validasi struktur data
    if (!data || typeof data !== 'object') {
      errors.push('Data tidak valid atau kosong')
      return { isValid: false, errors }
    }
    
    // Validasi employees array
    if (!Array.isArray(data.employees) || data.employees.length === 0) {
      errors.push('Data karyawan tidak ditemukan atau kosong')
    } else {
      data.employees.forEach((emp: any, index: number) => {
        if (!emp.name || typeof emp.name !== 'string') {
          errors.push(`Karyawan ${index + 1}: Nama tidak valid`)
        }
        if (typeof emp.basicSalary !== 'number' || emp.basicSalary < 0) {
          errors.push(`Karyawan ${index + 1}: Gaji pokok tidak valid`)
        }
        if (typeof emp.netSalary !== 'number' || emp.netSalary < 0) {
          errors.push(`Karyawan ${index + 1}: Gaji bersih tidak valid`)
        }
        if (typeof emp.workingDays !== 'number' || emp.workingDays < 0 || emp.workingDays > 31) {
          errors.push(`Karyawan ${index + 1}: Hari kerja tidak valid`)
        }
      })
    }
    
    // Validasi company info
    if (!data.companyInfo || typeof data.companyInfo !== 'object') {
      errors.push('Informasi perusahaan tidak ditemukan')
    } else {
      if (!data.companyInfo.name || typeof data.companyInfo.name !== 'string') {
        errors.push('Nama perusahaan tidak valid')
      }
    }
    
    // Validasi payroll period
    if (!data.payrollPeriod || typeof data.payrollPeriod !== 'object') {
      errors.push('Periode payroll tidak ditemukan')
    } else {
      if (typeof data.payrollPeriod.month !== 'number' || data.payrollPeriod.month < 1 || data.payrollPeriod.month > 12) {
        errors.push('Bulan payroll tidak valid')
      }
      if (typeof data.payrollPeriod.year !== 'number' || data.payrollPeriod.year < 2020) {
        errors.push('Tahun payroll tidak valid')
      }
    }
    
    // Validasi summary
    if (!data.summary || typeof data.summary !== 'object') {
      errors.push('Ringkasan payroll tidak ditemukan')
    } else {
      if (typeof data.summary.totalEmployees !== 'number' || data.summary.totalEmployees < 0) {
        errors.push('Total karyawan tidak valid')
      }
      if (typeof data.summary.totalNeto !== 'number' || data.summary.totalNeto < 0) {
        errors.push('Total neto tidak valid')
      }
    }
    
    return { isValid: errors.length === 0, errors }
  }, [])

  /**
   * Parse PDF content (simulasi - dalam implementasi nyata akan menggunakan PDF parser)
   */
  const parsePDFContent = useCallback(async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          // Simulasi parsing PDF - dalam implementasi nyata akan menggunakan library seperti pdf-parse
          // Untuk demo, kita akan generate sample data berdasarkan nama file
          const fileName = file.name.toLowerCase()
          
          if (fileName.includes('summary') || fileName.includes('ringkasan')) {
            // Sample summary data
            const sampleData = {
              employees: [
                {
                  id: 'emp-001',
                  name: 'Ahmad Wijaya',
                  position: 'Manager Operasional',
                  basicSalary: 13000000,
                  allowances: 2000000,
                  deductions: 1500000,
                  netSalary: 13500000,
                  workingDays: 26,
                  overtimeHours: 12,
                  overtimePay: 1500000,
                  components: [
                    { name: 'Uang Makan', amount: 650000, type: 'earning' },
                    { name: 'Uang BBM', amount: 390000, type: 'earning' },
                    { name: 'Tunjangan Jabatan', amount: 2600000, type: 'earning' },
                    { name: 'BPJS Kesehatan', amount: 130000, type: 'deduction' },
                    { name: 'BPJS Ketenagakerjaan', amount: 260000, type: 'deduction' },
                    { name: 'Pajak PPh 21', amount: 750000, type: 'deduction' }
                  ]
                },
                {
                  id: 'emp-002',
                  name: 'Siti Nurhaliza',
                  position: 'Staff Administrasi',
                  basicSalary: 7200000,
                  allowances: 1200000,
                  deductions: 800000,
                  netSalary: 7600000,
                  workingDays: 24,
                  overtimeHours: 8,
                  overtimePay: 600000,
                  components: [
                    { name: 'Uang Makan', amount: 600000, type: 'earning' },
                    { name: 'Uang BBM', amount: 360000, type: 'earning' },
                    { name: 'Tunjangan Kehadiran', amount: 200000, type: 'earning' },
                    { name: 'BPJS Kesehatan', amount: 72000, type: 'deduction' },
                    { name: 'BPJS Ketenagakerjaan', amount: 144000, type: 'deduction' },
                    { name: 'Pajak PPh 21', amount: 400000, type: 'deduction' }
                  ]
                }
              ],
              companyInfo: {
                name: 'PT. Coal Mining Indonesia',
                address: 'Jl. Industri Pertambangan No. 123, Jakarta Selatan 12345',
                phone: '+62 21 1234 5678',
                email: 'hr@coaltools.co.id'
              },
              payrollPeriod: {
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                startDate: '2024-01-01',
                endDate: '2024-01-31'
              },
              summary: {
                totalEmployees: 2,
                totalBruto: 20200000,
                totalPajak: 1150000,
                totalNeto: 21100000
              }
            }
            
            resolve(sampleData)
          } else {
            // Sample individual data
            const sampleData = {
              employees: [
                {
                  id: 'emp-001',
                  name: 'Ahmad Wijaya',
                  position: 'Manager Operasional',
                  basicSalary: 13000000,
                  allowances: 2000000,
                  deductions: 1500000,
                  netSalary: 13500000,
                  workingDays: 26,
                  overtimeHours: 12,
                  overtimePay: 1500000,
                  components: [
                    { name: 'Uang Makan', amount: 650000, type: 'earning' },
                    { name: 'Uang BBM', amount: 390000, type: 'earning' },
                    { name: 'Tunjangan Jabatan', amount: 2600000, type: 'earning' },
                    { name: 'BPJS Kesehatan', amount: 130000, type: 'deduction' },
                    { name: 'BPJS Ketenagakerjaan', amount: 260000, type: 'deduction' },
                    { name: 'Pajak PPh 21', amount: 750000, type: 'deduction' }
                  ]
                }
              ],
              companyInfo: {
                name: 'PT. Coal Mining Indonesia',
                address: 'Jl. Industri Pertambangan No. 123, Jakarta Selatan 12345',
                phone: '+62 21 1234 5678',
                email: 'hr@coaltools.co.id'
              },
              payrollPeriod: {
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                startDate: '2024-01-01',
                endDate: '2024-01-31'
              },
              summary: {
                totalEmployees: 1,
                totalBruto: 16500000,
                totalPajak: 750000,
                totalNeto: 13500000
              }
            }
            
            resolve(sampleData)
          }
        } catch (error) {
          reject(new Error('Gagal memparse file PDF'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Gagal membaca file'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }, [])

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validasi file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setImportStatus('error')
      setImportMessage('File harus berformat PDF')
      onImportComplete?.(null, false, 'File harus berformat PDF')
      return
    }

    // Validasi file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImportStatus('error')
      setImportMessage('Ukuran file terlalu besar (max 10MB)')
      onImportComplete?.(null, false, 'Ukuran file terlalu besar (max 10MB)')
      return
    }

    setIsImporting(true)
    setImportStatus('importing')
    setImportProgress(0)
    setImportMessage('Memproses file PDF...')

    try {
      // Step 1: Parse PDF content
      setImportProgress(25)
      setImportMessage('Membaca konten PDF...')
      const parsedData = await parsePDFContent(file)
      
      // Step 2: Validate data
      setImportProgress(50)
      setImportMessage('Memvalidasi data...')
      const validation = validatePayrollData(parsedData)
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setImportStatus('error')
        setImportMessage(`Data tidak valid: ${validation.errors.length} error ditemukan`)
        onImportComplete?.(null, false, `Data tidak valid: ${validation.errors.length} error ditemukan`)
        return
      }
      
      // Step 3: Additional validation (jika ada)
      if (onDataValidation) {
        setImportProgress(75)
        setImportMessage('Memvalidasi data tambahan...')
        const additionalValidation = onDataValidation(parsedData)
        
        if (!additionalValidation.isValid) {
          setValidationErrors(additionalValidation.errors)
          setImportStatus('error')
          setImportMessage(`Validasi gagal: ${additionalValidation.errors.length} error ditemukan`)
          onImportComplete?.(null, false, `Validasi gagal: ${additionalValidation.errors.length} error ditemukan`)
          return
        }
      }
      
      // Step 4: Success
      setImportProgress(100)
      setImportStatus('success')
      setImportMessage(`Berhasil import data payroll: ${parsedData.employees.length} karyawan`)
      setImportedData(parsedData)
      setValidationErrors([])
      onImportComplete?.(parsedData, true, `Berhasil import data payroll: ${parsedData.employees.length} karyawan`)
      
    } catch (error) {
      console.error('Error importing PDF:', error)
      setImportStatus('error')
      setImportMessage(error instanceof Error ? error.message : 'Gagal import file PDF')
      onImportComplete?.(null, false, error instanceof Error ? error.message : 'Gagal import file PDF')
    } finally {
      setIsImporting(false)
    }
  }, [parsePDFContent, validatePayrollData, onDataValidation, onImportComplete])

  /**
   * Clear imported data
   */
  const handleClearData = useCallback(() => {
    setImportedData(null)
    setImportStatus('idle')
    setImportMessage('')
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  /**
   * Trigger file input
   */
  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Payroll dari PDF
        </CardTitle>
        <CardDescription>
          Import data payroll dari file PDF dengan validasi otomatis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Input */}
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button
            onClick={handleSelectFile}
            disabled={isImporting}
            className="w-full"
            variant="outline"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Pilih File PDF
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Format yang didukung: PDF (max 10MB)
          </p>
        </div>

        {/* Status Import */}
        {importStatus !== 'idle' && (
          <Alert className={cn(
            importStatus === 'success' ? 'border-green-200 bg-green-50' :
            importStatus === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          )}>
            {importStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : importStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            )}
            <AlertDescription className={cn(
              importStatus === 'success' ? 'text-green-800' :
              importStatus === 'error' ? 'text-red-800' :
              'text-blue-800'
            )}>
              {importMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress Import</span>
              <span>{Math.round(importProgress)}%</span>
            </div>
            <Progress value={importProgress} className="w-full" />
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-1">
                <p className="font-medium">Error Validasi:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Imported Data Preview */}
        {importedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview Data Import</h3>
              <Button
                onClick={handleClearData}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Data
              </Button>
            </div>
            
            {/* Data Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{importedData.summary.totalEmployees}</p>
                  <p className="text-xs text-blue-700">Karyawan</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">{formatCurrency(importedData.summary.totalNeto)}</p>
                  <p className="text-xs text-green-700">Total Neto</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    {new Date(importedData.payrollPeriod.year, importedData.payrollPeriod.month - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-purple-700">Periode</p>
                </div>
              </div>
            </div>

            {/* Employee List */}
            <div className="space-y-2">
              <h4 className="font-medium">Daftar Karyawan:</h4>
              <div className="space-y-2">
                {importedData.employees.map((employee, index) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatCurrency(employee.netSalary)}</p>
                      <p className="text-sm text-muted-foreground">{employee.workingDays} hari kerja</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• File PDF akan diparse dan divalidasi sebelum import</p>
          <p>• Data yang tidak valid akan ditolak dengan pesan error</p>
          <p>• Pastikan file PDF berisi data payroll yang valid</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollPDFImport
