'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Calendar,
  DollarSign,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Interface untuk data payroll yang akan disimpan
 */
export interface PayrollSaveData {
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
 * Props untuk komponen PayrollSaveToDatabase
 */
interface PayrollSaveToDatabaseProps {
  data: PayrollSaveData
  onSaveComplete?: (success: boolean, message: string, savedData?: any) => void
  className?: string
}

/**
 * Komponen untuk menyimpan data payroll ke database
 * Dengan validasi dan safety checks untuk mencegah data duplikat
 */
export function PayrollSaveToDatabase({ 
  data, 
  onSaveComplete,
  className 
}: PayrollSaveToDatabaseProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')
  const [savedData, setSavedData] = useState<any>(null)

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
   * Validasi data sebelum disimpan
   */
  const validateData = useCallback((data: PayrollSaveData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Validasi employees
    if (!data.employees || data.employees.length === 0) {
      errors.push('Tidak ada data karyawan untuk disimpan')
    }
    
    // Validasi payroll period
    if (!data.payrollPeriod || !data.payrollPeriod.startDate || !data.payrollPeriod.endDate) {
      errors.push('Periode payroll tidak valid')
    }
    
    // Validasi company info
    if (!data.companyInfo || !data.companyInfo.name) {
      errors.push('Informasi perusahaan tidak lengkap')
    }
    
    // Validasi data karyawan
    data.employees?.forEach((emp, index) => {
      if (!emp.name || !emp.id) {
        errors.push(`Karyawan ${index + 1}: Nama atau ID tidak valid`)
      }
      if (typeof emp.netSalary !== 'number' || emp.netSalary < 0) {
        errors.push(`Karyawan ${index + 1}: Gaji bersih tidak valid`)
      }
      if (typeof emp.workingDays !== 'number' || emp.workingDays < 0 || emp.workingDays > 31) {
        errors.push(`Karyawan ${index + 1}: Hari kerja tidak valid`)
      }
    })
    
    return { isValid: errors.length === 0, errors }
  }, [])

  /**
   * Simpan data ke database
   */
  const handleSaveToDatabase = useCallback(async () => {
    // Validasi data
    const validation = validateData(data)
    if (!validation.isValid) {
      setSaveStatus('error')
      setSaveMessage(`Data tidak valid: ${validation.errors.join(', ')}`)
      onSaveComplete?.(false, `Data tidak valid: ${validation.errors.join(', ')}`)
      return
    }

    setIsSaving(true)
    setSaveStatus('saving')
    setSaveProgress(0)
    setSaveMessage('Menyimpan data payroll...')

    try {
      // Step 1: Cek koneksi database
      setSaveProgress(20)
      setSaveMessage('Memeriksa koneksi database...')
      
      const healthResponse = await fetch('/api/health')
      if (!healthResponse.ok) {
        throw new Error('Database tidak tersedia')
      }

      // Step 2: Kirim data ke API
      setSaveProgress(50)
      setSaveMessage('Mengirim data ke database...')
      
      const response = await fetch('/api/payroll/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan data')
      }

      // Step 3: Success
      setSaveProgress(100)
      setSaveStatus('success')
      setSaveMessage(`Berhasil menyimpan payroll run: ${result.data.totalEmployees} karyawan`)
      setSavedData(result.data)
      onSaveComplete?.(true, `Berhasil menyimpan payroll run: ${result.data.totalEmployees} karyawan`, result.data)

    } catch (error) {
      console.error('Error saving to database:', error)
      setSaveStatus('error')
      setSaveMessage(error instanceof Error ? error.message : 'Gagal menyimpan data ke database')
      onSaveComplete?.(false, error instanceof Error ? error.message : 'Gagal menyimpan data ke database')
    } finally {
      setIsSaving(false)
    }
  }, [data, validateData, onSaveComplete])

  /**
   * Reset status
   */
  const handleReset = useCallback(() => {
    setSaveStatus('idle')
    setSaveMessage('')
    setSavedData(null)
  }, [])

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Simpan ke Database
        </CardTitle>
        <CardDescription>
          Simpan data payroll ke database dengan validasi dan safety checks
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Save */}
        {saveStatus !== 'idle' && (
          <Alert className={cn(
            saveStatus === 'success' ? 'border-green-200 bg-green-50' :
            saveStatus === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          )}>
            {saveStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            )}
            <AlertDescription className={cn(
              saveStatus === 'success' ? 'text-green-800' :
              saveStatus === 'error' ? 'text-red-800' :
              'text-blue-800'
            )}>
              {saveMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {isSaving && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress Simpan</span>
              <span>{Math.round(saveProgress)}%</span>
            </div>
            <Progress value={saveProgress} className="w-full" />
          </div>
        )}

        {/* Data Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">{data.summary.totalEmployees}</p>
              <p className="text-xs text-blue-700">Karyawan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">{formatCurrency(data.summary.totalNeto)}</p>
              <p className="text-xs text-green-700">Total Neto</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900">
                {new Date(data.payrollPeriod.year, data.payrollPeriod.month - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-purple-700">Periode</p>
            </div>
          </div>
        </div>

        {/* Safety Features */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            Fitur Keamanan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Validasi data otomatis</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Cek duplikasi periode</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Transaksi database aman</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Backup otomatis</span>
            </div>
          </div>
        </div>

        {/* Saved Data Info */}
        {savedData && (
          <div className="space-y-2">
            <h4 className="font-medium text-green-800">Data Tersimpan</h4>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Payroll Run ID:</p>
                  <p className="font-mono text-green-900">{savedData.payrollRunId}</p>
                </div>
                <div>
                  <p className="text-green-700">Total Karyawan:</p>
                  <p className="font-medium text-green-900">{savedData.totalEmployees}</p>
                </div>
                <div>
                  <p className="text-green-700">Total Amount:</p>
                  <p className="font-medium text-green-900">{formatCurrency(savedData.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-green-700">Status:</p>
                  <Badge className="bg-green-100 text-green-800">DRAFT</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSaveToDatabase}
            disabled={isSaving || data.employees.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan ke Database
          </Button>
          
          {saveStatus !== 'idle' && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="px-6"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Data akan divalidasi sebelum disimpan ke database</p>
          <p>• Sistem akan mengecek duplikasi periode payroll</p>
          <p>• Data lama tidak akan terhapus, hanya ditambahkan sebagai record baru</p>
          <p>• Transaksi database menggunakan rollback jika terjadi error</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollSaveToDatabase
