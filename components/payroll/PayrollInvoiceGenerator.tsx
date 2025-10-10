'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  FileText, 
  Download, 
  Eye, 
  Building2, 
  Calendar, 
  User, 
  DollarSign,
  Printer,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PayrollCalculationResult } from './PayrollCalculationForm'

/**
 * Interface untuk konfigurasi perusahaan
 */
interface CompanyConfig {
  name: string
  address: string
  phone: string
  email: string
  logo?: string
  taxId?: string
}

/**
 * Interface untuk konfigurasi invoice
 */
interface InvoiceConfig {
  title: string
  subtitle: string
  periode: {
    awal: string
    akhir: string
  }
  notes: string
  showTax: boolean
  showComponents: boolean
  showSignature: boolean
}

/**
 * Props untuk komponen PayrollInvoiceGenerator
 */
interface PayrollInvoiceGeneratorProps {
  results: PayrollCalculationResult[]
  companyConfig?: CompanyConfig
  className?: string
  onConfigChange?: (config: CompanyConfig) => void
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}

/**
 * Komponen untuk generate invoice slip gaji dalam format PDF
 * Mendukung kustomisasi company info, format, dan styling
 */
export function PayrollInvoiceGenerator({
  results = [],
  companyConfig,
  className = '',
  onConfigChange,
  onError,
  onSuccess
}: PayrollInvoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 })
  const [showPreview, setShowPreview] = useState(false)
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig>({
    title: 'SLIP GAJI KARYAWAN',
    subtitle: 'Periode Penggajian',
    periode: {
      awal: new Date().toISOString().split('T')[0],
      akhir: new Date().toISOString().split('T')[0]
    },
    notes: 'Terima kasih atas dedikasi dan kerja keras Anda.',
    showTax: true,
    showComponents: true,
    showSignature: true
  })
  
  // Memoize expensive calculations
  const memoizedResults = useMemo(() => results, [results])
  const hasResults = memoizedResults.length > 0
  
  const [company, setCompany] = useState<CompanyConfig>({
    name: companyConfig?.name || 'PT. Coal Tools Indonesia',
    address: companyConfig?.address || 'Jl. Industri No. 123, Jakarta Selatan',
    phone: companyConfig?.phone || '+62 21 1234 5678',
    email: companyConfig?.email || 'hr@coaltools.co.id',
    logo: companyConfig?.logo,
    taxId: companyConfig?.taxId || '01.234.567.8-901.000'
  })
  
  const invoiceRef = useRef<HTMLDivElement>(null)

  /**
   * Format currency ke Rupiah
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Format tanggal ke format Indonesia
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  /**
   * Generate PDF untuk semua karyawan dengan proper error handling dan memory management
   */
  const generateAllPDF = async () => {
    if (results.length === 0) {
      const message = 'Tidak ada data payroll untuk diproses'
      if (onError) {
        onError(message)
      } else {
        alert(message)
      }
      return
    }
    
    setIsGenerating(true)
    setGeneratingProgress({ current: 0, total: results.length })
    const tempDivs: HTMLDivElement[] = []
    
    try {
      // Import jsPDF dinamically untuk menghindari SSR issues
      const { default: jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        setGeneratingProgress({ current: i + 1, total: results.length })
        
        try {
          // Create temporary div untuk setiap slip gaji
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = generateInvoiceHTML(result)
          tempDiv.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            width: 210mm;
            background-color: white;
            font-family: Arial, sans-serif;
            visibility: hidden;
            pointer-events: none;
          `
          
          document.body.appendChild(tempDiv)
          tempDivs.push(tempDiv)
          
          // Wait for fonts and images to load
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Convert to canvas with better error handling
           const canvas = await html2canvas(tempDiv, {
              width: tempDiv.scrollWidth * 1.5,
              height: tempDiv.scrollHeight * 1.5,
              useCORS: true,
              allowTaint: true,
              background: '#ffffff',
              logging: false
            })
          
          // Add to PDF
          if (i > 0) pdf.addPage()
          
          const imgData = canvas.toDataURL('image/png', 0.8) // Reduced quality for smaller file size
          const imgWidth = 210
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 297) // Limit height to A4
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
          
        } catch (individualError) {
          console.error(`Error processing employee ${result.employeeName}:`, individualError)
          // Continue with other employees instead of failing completely
        }
      }
      
      // Download PDF
      const fileName = `Slip_Gaji_${invoiceConfig.periode.awal}_${invoiceConfig.periode.akhir}.pdf`
      pdf.save(fileName)
      
      const successMessage = `PDF berhasil diunduh: ${fileName}`
      if (onSuccess) {
        onSuccess(successMessage)
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal'
      const message = `Gagal generate PDF: ${errorMessage}. Silakan coba lagi.`
      if (onError) {
        onError(message)
      } else {
        alert(message)
      }
    } finally {
      // Cleanup all temporary divs
      tempDivs.forEach(div => {
        try {
          if (div.parentNode) {
            document.body.removeChild(div)
          }
        } catch (cleanupError) {
          console.warn('Error cleaning up temp div:', cleanupError)
        }
      })
      setIsGenerating(false)
      setGeneratingProgress({ current: 0, total: 0 })
    }
  }

  /**
   * Generate PDF untuk karyawan individual dengan proper error handling
   */
  const generateIndividualPDF = async (result: PayrollCalculationResult) => {
    setIsGenerating(true)
    let tempDiv: HTMLDivElement | null = null
    
    try {
      const { default: jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      
      // Create temporary div
      tempDiv = document.createElement('div')
      tempDiv.innerHTML = generateInvoiceHTML(result)
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 210mm;
        background-color: white;
        font-family: Arial, sans-serif;
        visibility: hidden;
        pointer-events: none;
      `
      
      document.body.appendChild(tempDiv)
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Convert to canvas with better settings
       const canvas = await html2canvas(tempDiv, {
          width: tempDiv.scrollWidth * 1.5,
          height: tempDiv.scrollHeight * 1.5,
          useCORS: true,
          allowTaint: true,
          background: '#ffffff',
          logging: false
        })
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png', 0.8)
      const imgWidth = 210
      const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 297)
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      
      // Download with sanitized filename
      const sanitizedName = result.employeeName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
      const fileName = `Slip_Gaji_${sanitizedName}_${invoiceConfig.periode.awal}.pdf`
      pdf.save(fileName)
      
      const successMessage = `PDF berhasil diunduh: ${fileName}`
      if (onSuccess) {
        onSuccess(successMessage)
      }
      
    } catch (error) {
      console.error('Error generating individual PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal'
      const message = `Gagal generate PDF untuk ${result.employeeName}: ${errorMessage}`
      if (onError) {
        onError(message)
      } else {
        alert(message)
      }
    } finally {
      // Cleanup
      if (tempDiv && tempDiv.parentNode) {
        try {
          document.body.removeChild(tempDiv)
        } catch (cleanupError) {
          console.warn('Error cleaning up temp div:', cleanupError)
        }
      }
      setIsGenerating(false)
    }
  }

  /**
   * Generate HTML untuk slip gaji
   */
  const generateInvoiceHTML = (result: PayrollCalculationResult): string => {
    return `
      <div style="width: 210mm; min-height: 297mm; padding: 20mm; font-family: Arial, sans-serif; background: white; box-sizing: border-box;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          ${company.logo ? `<img src="${company.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
          <h1 style="margin: 0; font-size: 24px; color: #333; font-weight: bold;">${company.name}</h1>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">${company.address}</p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">Telp: ${company.phone} | Email: ${company.email}</p>
          ${company.taxId ? `<p style="margin: 5px 0; color: #666; font-size: 12px;">NPWP: ${company.taxId}</p>` : ''}
        </div>

        <!-- Title -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 20px; color: #333; font-weight: bold;">${invoiceConfig.title}</h2>
          <p style="margin: 10px 0; color: #666; font-size: 14px;">${invoiceConfig.subtitle}</p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">
            Periode: ${formatDate(invoiceConfig.periode.awal)} - ${formatDate(invoiceConfig.periode.akhir)}
          </p>
        </div>

        <!-- Employee Info -->
        <div style="margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Informasi Karyawan</h3>
          <table style="width: 100%; font-size: 12px;">
            <tr>
              <td style="padding: 3px 0; width: 120px; color: #666;">Nama Karyawan</td>
              <td style="padding: 3px 0; color: #333; font-weight: bold;">: ${result.employeeName}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #666;">Hari Kerja</td>
              <td style="padding: 3px 0; color: #333;">: ${result.hariKerja} hari</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #666;">Upah Harian</td>
              <td style="padding: 3px 0; color: #333;">${formatCurrency(result.upahHarian)}</td>
            </tr>
          </table>
        </div>

        <!-- Earnings -->
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #22c55e; border-bottom: 1px solid #22c55e; padding-bottom: 5px;">PENDAPATAN</h3>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr style="background: #f0f9ff;">
              <th style="text-align: left; padding: 8px; border: 1px solid #e5e7eb; color: #374151;">Komponen</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #e5e7eb; color: #374151;">Jumlah</th>
            </tr>
            ${result.earnings.map(earning => `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb; color: #374151;">${earning.name}</td>
                <td style="text-align: right; padding: 6px 8px; border: 1px solid #e5e7eb; color: #374151;">${formatCurrency(earning.amount)}</td>
              </tr>
            `).join('')}
            <tr style="background: #ecfdf5; font-weight: bold;">
              <td style="padding: 8px; border: 1px solid #e5e7eb; color: #22c55e;">TOTAL PENDAPATAN</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #e5e7eb; color: #22c55e;">${formatCurrency(result.bruto)}</td>
            </tr>
          </table>
        </div>

        <!-- Deductions -->
        ${result.deductions.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #ef4444; border-bottom: 1px solid #ef4444; padding-bottom: 5px;">POTONGAN</h3>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr style="background: #fef2f2;">
              <th style="text-align: left; padding: 8px; border: 1px solid #e5e7eb; color: #374151;">Komponen</th>
              <th style="text-align: right; padding: 8px; border: 1px solid #e5e7eb; color: #374151;">Jumlah</th>
            </tr>
            ${result.deductions.map(deduction => `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb; color: #374151;">${deduction.name}</td>
                <td style="text-align: right; padding: 6px 8px; border: 1px solid #e5e7eb; color: #374151;">${formatCurrency(deduction.amount)}</td>
              </tr>
            `).join('')}
            ${invoiceConfig.showTax && result.pajak > 0 ? `
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #e5e7eb; color: #374151;">Pajak PPh 21</td>
              <td style="text-align: right; padding: 6px 8px; border: 1px solid #e5e7eb; color: #374151;">${formatCurrency(result.pajak)}</td>
            </tr>
            ` : ''}
            <tr style="background: #fef2f2; font-weight: bold;">
              <td style="padding: 8px; border: 1px solid #e5e7eb; color: #ef4444;">TOTAL POTONGAN</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #e5e7eb; color: #ef4444;">${formatCurrency(result.deductions.reduce((sum, d) => sum + d.amount, 0) + (invoiceConfig.showTax ? result.pajak : 0))}</td>
            </tr>
          </table>
        </div>
        ` : ''}

        <!-- Net Salary -->
        <div style="margin-bottom: 30px; background: #1e40af; color: white; padding: 15px; border-radius: 8px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">GAJI BERSIH</h3>
          <p style="margin: 0; font-size: 24px; font-weight: bold;">${formatCurrency(result.neto)}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Terbilang: ${numberToWords(result.neto)} Rupiah</p>
        </div>

        <!-- Notes -->
        ${invoiceConfig.notes ? `
        <div style="margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 12px; color: #374151; font-style: italic;">${invoiceConfig.notes}</p>
        </div>
        ` : ''}

        <!-- Signature -->
        ${invoiceConfig.showSignature ? `
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 45%;">
            <p style="margin: 0 0 60px 0; font-size: 12px; color: #666;">Karyawan</p>
            <div style="border-top: 1px solid #333; padding-top: 5px;">
              <p style="margin: 0; font-size: 12px; color: #333; font-weight: bold;">${result.employeeName}</p>
            </div>
          </div>
          <div style="text-align: center; width: 45%;">
            <p style="margin: 0 0 60px 0; font-size: 12px; color: #666;">HRD</p>
            <div style="border-top: 1px solid #333; padding-top: 5px;">
              <p style="margin: 0; font-size: 12px; color: #333;">(............................)</p>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          <p style="margin: 0;">Dokumen ini digenerate secara otomatis pada ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${company.name}. All rights reserved.</p>
        </div>
      </div>
    `
  }

  /**
   * Convert number to words (simplified version)
   */
  const numberToWords = (num: number): string => {
    // Simplified implementation - in production, use a proper library
    if (num === 0) return 'Nol'
    
    const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
    const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas']
    const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh']
    
    if (num < 10) return ones[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Ratus' + (num % 100 ? ' ' + numberToWords(num % 100) : '')
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '')
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 ? ' ' + numberToWords(num % 1000000) : '')
    
    return 'Angka terlalu besar'
  }

  /**
   * Update company config with memoization
   */
  const updateCompanyConfig = useCallback((updates: Partial<CompanyConfig>) => {
     const currentCompany = company || {
       name: 'PT. Coal Tools Indonesia',
       address: 'Jl. Industri No. 123, Jakarta',
       phone: '(021) 1234-5678',
       email: 'info@coaltools.com'
     }
     const newConfig = { ...currentCompany, ...updates }
     setCompany(newConfig)
     onConfigChange?.(newConfig)
   }, [company, onConfigChange])
  
  /**
    * Update invoice configuration with memoization
    */
   const updateInvoiceConfig = useCallback((field: string, value: any) => {
     setInvoiceConfig(prev => {
       const keys = field.split('.')
       if (keys.length === 1) {
         return { ...prev, [field]: value }
       } else {
         const parentKey = keys[0] as keyof InvoiceConfig
         const childKey = keys[1]
         const parentValue = prev[parentKey]
         
         if (typeof parentValue === 'object' && parentValue !== null) {
           return {
             ...prev,
             [parentKey]: {
               ...parentValue,
               [childKey]: value
             }
           }
         }
         return prev
       }
     })
   }, [])

  if (results.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Belum Ada Data Payroll</h3>
            <p className="text-muted-foreground">
              Silakan lakukan perhitungan payroll terlebih dahulu untuk generate invoice.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Invoice Slip Gaji
          </CardTitle>
          <CardDescription>
            Generate slip gaji dalam format PDF untuk {results.length} karyawan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={generateAllPDF}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? (
                generatingProgress.total > 0 ? 
                  `Generating... (${generatingProgress.current}/${generatingProgress.total})` : 
                  'Generating...'
              ) : `Download Semua (${results.length} PDF)`}
            </Button>
            
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Preview Slip Gaji</DialogTitle>
                  <DialogDescription>
                    Preview format slip gaji yang akan di-generate
                  </DialogDescription>
                </DialogHeader>
                {results.length > 0 && (
                  <div 
                    ref={invoiceRef}
                    dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(results[0]) }}
                    className="border rounded-lg overflow-hidden"
                    style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informasi Perusahaan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company-name">Nama Perusahaan</Label>
              <Input
                id="company-name"
                value={company.name}
                onChange={(e) => updateCompanyConfig({ name: e.target.value })}
                placeholder="Nama perusahaan"
              />
            </div>
            
            <div>
              <Label htmlFor="company-address">Alamat</Label>
              <Textarea
                id="company-address"
                value={company.address}
                onChange={(e) => updateCompanyConfig({ address: e.target.value })}
                placeholder="Alamat lengkap perusahaan"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="company-phone">Telepon</Label>
                <Input
                  id="company-phone"
                  value={company.phone}
                  onChange={(e) => updateCompanyConfig({ phone: e.target.value })}
                  placeholder="Nomor telepon"
                />
              </div>
              
              <div>
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={company.email}
                  onChange={(e) => updateCompanyConfig({ email: e.target.value })}
                  placeholder="Email perusahaan"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="company-tax-id">NPWP</Label>
              <Input
                id="company-tax-id"
                value={company.taxId || ''}
                onChange={(e) => updateCompanyConfig({ taxId: e.target.value })}
                placeholder="Nomor NPWP (opsional)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Konfigurasi Invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoice-title">Judul Invoice</Label>
              <Input
                id="invoice-title"
                value={invoiceConfig.title}
                onChange={(e) => updateInvoiceConfig('title', e.target.value)}
                placeholder="Judul slip gaji"
              />
            </div>
            
            <div>
              <Label htmlFor="invoice-subtitle">Subtitle</Label>
              <Input
                id="invoice-subtitle"
                value={invoiceConfig.subtitle}
                onChange={(e) => updateInvoiceConfig('subtitle', e.target.value)}
                placeholder="Subtitle periode"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="periode-awal">Periode Awal</Label>
                <Input
                  id="periode-awal"
                  type="date"
                  value={invoiceConfig.periode.awal}
                  onChange={(e) => updateInvoiceConfig('periode.awal', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="periode-akhir">Periode Akhir</Label>
                <Input
                  id="periode-akhir"
                  type="date"
                  value={invoiceConfig.periode.akhir}
                  onChange={(e) => updateInvoiceConfig('periode.akhir', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="invoice-notes">Catatan</Label>
              <Textarea
                id="invoice-notes"
                value={invoiceConfig.notes}
                onChange={(e) => updateInvoiceConfig('notes', e.target.value)}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Karyawan ({results.length})</CardTitle>
          <CardDescription>
            Klik "Download" untuk generate slip gaji individual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{result.employeeName}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {result.hariKerja} hari
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(result.neto)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {result.earnings.length} earnings
                    </Badge>
                    <Badge variant="outline">
                      {result.deductions.length} deductions
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateIndividualPDF(result)}
                      disabled={isGenerating}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default PayrollInvoiceGenerator