'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Interface untuk data payroll yang akan di-export
 */
export interface PayrollExportData {
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
 * Props untuk komponen PayrollPDFExport
 */
interface PayrollPDFExportProps {
  data: PayrollExportData
  onExportComplete?: (success: boolean, message: string) => void
  className?: string
}

/**
 * Komponen untuk export payroll ke PDF
 * Mendukung export individual slip gaji dan summary payroll
 */
export function PayrollPDFExport({ 
  data, 
  onExportComplete,
  className 
}: PayrollPDFExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle')
  const [exportMessage, setExportMessage] = useState('')

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
   * Format tanggal
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  /**
   * Generate PDF untuk individual slip gaji
   */
  const generateIndividualPDF = useCallback(async (employee: PayrollExportData['employees'][0]) => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Header dengan logo perusahaan
    pdf.setFillColor(59, 130, 246) // Blue background
    pdf.rect(0, 0, pageWidth, 30, 'F')
    
    // Logo perusahaan (jika ada)
    if (data.companyInfo.logo) {
      try {
        const logoImg = new Image()
        logoImg.src = data.companyInfo.logo
        await new Promise((resolve) => {
          logoImg.onload = () => {
            pdf.addImage(logoImg, 'PNG', 15, 5, 20, 20)
            resolve(true)
          }
        })
      } catch (error) {
        console.warn('Error loading logo:', error)
      }
    }
    
    // Nama perusahaan
    pdf.setFontSize(16)
    pdf.setTextColor(255, 255, 255)
    pdf.text(data.companyInfo.name, 40, 15)
    
    // Alamat perusahaan
    pdf.setFontSize(10)
    pdf.text(data.companyInfo.address, 40, 22)
    pdf.text(`${data.companyInfo.phone} | ${data.companyInfo.email}`, 40, 27)
    
    // Judul slip gaji
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 30, pageWidth, 15, 'F')
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text('SLIP GAJI KARYAWAN', pageWidth / 2, 40, { align: 'center' })
    
    // Periode gaji
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const periodText = `${monthNames[data.payrollPeriod.month - 1]} ${data.payrollPeriod.year}`
    pdf.setFontSize(10)
    pdf.text(`Periode: ${periodText}`, pageWidth / 2, 45, { align: 'center' })
    
    // Informasi karyawan
    let yPosition = 60
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('INFORMASI KARYAWAN', 15, yPosition)
    
    yPosition += 10
    pdf.setFontSize(10)
    pdf.text(`Nama        : ${employee.name}`, 15, yPosition)
    yPosition += 6
    pdf.text(`Posisi      : ${employee.position}`, 15, yPosition)
    yPosition += 6
    pdf.text(`Hari Kerja  : ${employee.workingDays} hari`, 15, yPosition)
    yPosition += 6
    pdf.text(`Lembur      : ${employee.overtimeHours} jam`, 15, yPosition)
    
    // Detail gaji
    yPosition += 15
    pdf.setFontSize(12)
    pdf.text('RINCIAN GAJI', 15, yPosition)
    
    yPosition += 10
    pdf.setFontSize(10)
    
    // Pendapatan
    pdf.text('PENDAPATAN:', 15, yPosition)
    yPosition += 6
    pdf.text(`  Upah Pokok        ${formatCurrency(employee.basicSalary)}`, 15, yPosition)
    yPosition += 5
    pdf.text(`  Tunjangan         ${formatCurrency(employee.allowances)}`, 15, yPosition)
    yPosition += 5
    pdf.text(`  Lembur            ${formatCurrency(employee.overtimePay)}`, 15, yPosition)
    
    const totalEarnings = employee.basicSalary + employee.allowances + employee.overtimePay
    yPosition += 8
    pdf.setFont('helvetica', 'bold')
    pdf.text(`  TOTAL PENDAPATAN  ${formatCurrency(totalEarnings)}`, 15, yPosition)
    pdf.setFont('helvetica', 'normal')
    
    // Potongan
    yPosition += 10
    pdf.text('POTONGAN:', 15, yPosition)
    yPosition += 6
    pdf.text(`  Potongan Lain     ${formatCurrency(employee.deductions)}`, 15, yPosition)
    
    yPosition += 8
    pdf.setFont('helvetica', 'bold')
    pdf.text(`  TOTAL POTONGAN    ${formatCurrency(employee.deductions)}`, 15, yPosition)
    pdf.setFont('helvetica', 'normal')
    
    // Gaji bersih
    yPosition += 10
    pdf.setFillColor(240, 240, 240)
    pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text(`GAJI BERSIH: ${formatCurrency(employee.netSalary)}`, 15, yPosition)
    
    // Footer
    yPosition = pageHeight - 20
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Dicetak pada: ' + new Date().toLocaleString('id-ID'), 15, yPosition)
    pdf.text('Halaman 1 dari 1', pageWidth - 50, yPosition)
    
    return pdf
  }, [data])

  /**
   * Generate PDF summary payroll
   */
  const generateSummaryPDF = useCallback(async () => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Header
    pdf.setFillColor(59, 130, 246)
    pdf.rect(0, 0, pageWidth, 30, 'F')
    
    // Logo perusahaan
    if (data.companyInfo.logo) {
      try {
        const logoImg = new Image()
        logoImg.src = data.companyInfo.logo
        await new Promise((resolve) => {
          logoImg.onload = () => {
            pdf.addImage(logoImg, 'PNG', 15, 5, 20, 20)
            resolve(true)
          }
        })
      } catch (error) {
        console.warn('Error loading logo:', error)
      }
    }
    
    // Nama perusahaan
    pdf.setFontSize(16)
    pdf.setTextColor(255, 255, 255)
    pdf.text(data.companyInfo.name, 40, 15)
    
    // Alamat perusahaan
    pdf.setFontSize(10)
    pdf.text(data.companyInfo.address, 40, 22)
    pdf.text(`${data.companyInfo.phone} | ${data.companyInfo.email}`, 40, 27)
    
    // Judul summary
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 30, pageWidth, 15, 'F')
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text('RINGKASAN PAYROLL', pageWidth / 2, 40, { align: 'center' })
    
    // Periode
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const periodText = `${monthNames[data.payrollPeriod.month - 1]} ${data.payrollPeriod.year}`
    pdf.setFontSize(10)
    pdf.text(`Periode: ${periodText}`, pageWidth / 2, 45, { align: 'center' })
    
    // Summary statistics
    let yPosition = 60
    pdf.setFontSize(12)
    pdf.text('RINGKASAN STATISTIK', 15, yPosition)
    
    yPosition += 15
    pdf.setFontSize(10)
    
    // Box untuk summary
    pdf.setFillColor(248, 250, 252)
    pdf.rect(15, yPosition - 5, pageWidth - 30, 40, 'F')
    pdf.setDrawColor(226, 232, 240)
    pdf.rect(15, yPosition - 5, pageWidth - 30, 40, 'S')
    
    pdf.text(`Total Karyawan     : ${data.summary.totalEmployees} orang`, 20, yPosition + 5)
    pdf.text(`Total Bruto        : ${formatCurrency(data.summary.totalBruto)}`, 20, yPosition + 12)
    pdf.text(`Total Pajak        : ${formatCurrency(data.summary.totalPajak)}`, 20, yPosition + 19)
    pdf.text(`Total Neto         : ${formatCurrency(data.summary.totalNeto)}`, 20, yPosition + 26)
    
    // Detail karyawan
    yPosition += 50
    pdf.setFontSize(12)
    pdf.text('DETAIL KARYAWAN', 15, yPosition)
    
    yPosition += 10
    pdf.setFontSize(8)
    
    // Header tabel
    pdf.setFillColor(59, 130, 246)
    pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.text('No', 18, yPosition)
    pdf.text('Nama', 25, yPosition)
    pdf.text('Posisi', 80, yPosition)
    pdf.text('Hari Kerja', 120, yPosition)
    pdf.text('Gaji Bersih', 150, yPosition)
    
    yPosition += 8
    pdf.setTextColor(0, 0, 0)
    
    // Data karyawan
    data.employees.forEach((employee, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage()
        yPosition = 20
      }
      
      pdf.text((index + 1).toString(), 18, yPosition)
      pdf.text(employee.name, 25, yPosition)
      pdf.text(employee.position, 80, yPosition)
      pdf.text(employee.workingDays.toString(), 120, yPosition)
      pdf.text(formatCurrency(employee.netSalary), 150, yPosition)
      
      yPosition += 6
    })
    
    // Footer
    yPosition = pageHeight - 20
    pdf.setFontSize(8)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Dicetak pada: ' + new Date().toLocaleString('id-ID'), 15, yPosition)
    pdf.text('Halaman 1 dari 1', pageWidth - 50, yPosition)
    
    return pdf
  }, [data])

  /**
   * Export individual slip gaji
   */
  const handleExportIndividual = useCallback(async () => {
    if (!data.employees.length) {
      setExportStatus('error')
      setExportMessage('Tidak ada data karyawan untuk di-export')
      onExportComplete?.(false, 'Tidak ada data karyawan untuk di-export')
      return
    }

    setIsExporting(true)
    setExportStatus('exporting')
    setExportProgress(0)
    setExportMessage('Mempersiapkan export...')

    try {
      // Export semua slip gaji individual
      for (let i = 0; i < data.employees.length; i++) {
        const employee = data.employees[i]
        setExportMessage(`Menggenerate slip gaji untuk ${employee.name}...`)
        setExportProgress((i / data.employees.length) * 100)
        
        const pdf = await generateIndividualPDF(employee)
        
        // Download PDF
        const fileName = `Slip_Gaji_${employee.name.replace(/\s+/g, '_')}_${data.payrollPeriod.year}_${data.payrollPeriod.month.toString().padStart(2, '0')}.pdf`
        pdf.save(fileName)
        
        // Delay untuk UI feedback
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setExportProgress(100)
      setExportStatus('success')
      setExportMessage(`Berhasil export ${data.employees.length} slip gaji individual`)
      onExportComplete?.(true, `Berhasil export ${data.employees.length} slip gaji individual`)
      
    } catch (error) {
      console.error('Error exporting individual PDFs:', error)
      setExportStatus('error')
      setExportMessage('Gagal export slip gaji individual')
      onExportComplete?.(false, 'Gagal export slip gaji individual')
    } finally {
      setIsExporting(false)
    }
  }, [data, generateIndividualPDF, onExportComplete])

  /**
   * Export summary payroll
   */
  const handleExportSummary = useCallback(async () => {
    setIsExporting(true)
    setExportStatus('exporting')
    setExportProgress(0)
    setExportMessage('Menggenerate summary payroll...')

    try {
      setExportProgress(50)
      const pdf = await generateSummaryPDF()
      
      setExportProgress(100)
      
      // Download PDF
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      const periodText = `${monthNames[data.payrollPeriod.month - 1]}_${data.payrollPeriod.year}`
      const fileName = `Summary_Payroll_${periodText}.pdf`
      pdf.save(fileName)
      
      setExportStatus('success')
      setExportMessage('Berhasil export summary payroll')
      onExportComplete?.(true, 'Berhasil export summary payroll')
      
    } catch (error) {
      console.error('Error exporting summary PDF:', error)
      setExportStatus('error')
      setExportMessage('Gagal export summary payroll')
      onExportComplete?.(false, 'Gagal export summary payroll')
    } finally {
      setIsExporting(false)
    }
  }, [data, generateSummaryPDF, onExportComplete])

  /**
   * Export semua (individual + summary)
   */
  const handleExportAll = useCallback(async () => {
    setIsExporting(true)
    setExportStatus('exporting')
    setExportProgress(0)
    setExportMessage('Menggenerate semua dokumen...')

    try {
      // Export individual slip gaji
      await handleExportIndividual()
      
      // Delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Export summary
      await handleExportSummary()
      
      setExportStatus('success')
      setExportMessage('Berhasil export semua dokumen payroll')
      onExportComplete?.(true, 'Berhasil export semua dokumen payroll')
      
    } catch (error) {
      console.error('Error exporting all PDFs:', error)
      setExportStatus('error')
      setExportMessage('Gagal export dokumen payroll')
      onExportComplete?.(false, 'Gagal export dokumen payroll')
    } finally {
      setIsExporting(false)
    }
  }, [handleExportIndividual, handleExportSummary, onExportComplete])

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Payroll ke PDF
        </CardTitle>
        <CardDescription>
          Export slip gaji individual dan summary payroll dalam format PDF
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Export */}
        {exportStatus !== 'idle' && (
          <Alert className={cn(
            exportStatus === 'success' ? 'border-green-200 bg-green-50' :
            exportStatus === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          )}>
            {exportStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : exportStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            )}
            <AlertDescription className={cn(
              exportStatus === 'success' ? 'text-green-800' :
              exportStatus === 'error' ? 'text-red-800' :
              'text-blue-800'
            )}>
              {exportMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress Export</span>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <Progress value={exportProgress} className="w-full" />
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

        {/* Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleExportIndividual}
            disabled={isExporting || data.employees.length === 0}
            className="w-full"
            variant="outline"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Export Individual
          </Button>
          
          <Button
            onClick={handleExportSummary}
            disabled={isExporting}
            className="w-full"
            variant="outline"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Export Summary
          </Button>
          
          <Button
            onClick={handleExportAll}
            disabled={isExporting || data.employees.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export Semua
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Export Individual: Generate slip gaji terpisah untuk setiap karyawan</p>
          <p>• Export Summary: Generate ringkasan payroll dalam satu dokumen</p>
          <p>• Export Semua: Generate kedua jenis dokumen sekaligus</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PayrollPDFExport
