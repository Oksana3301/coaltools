'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Receipt, 
  Download, 
  Eye, 
  Building2, 
  Calendar, 
  User, 
  DollarSign,
  FileText,
  Settings,
  Stamp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PayrollCalculationResult } from './PayrollCalculationForm'

/**
 * Interface untuk konfigurasi kwitansi
 */
interface ReceiptConfig {
  title: string
  subtitle: string
  receiptNumber: string
  receiptDate: string
  paymentMethod: 'cash' | 'transfer' | 'check'
  customMessage: string
  showStamp: boolean
  showWatermark: boolean
  currency: 'IDR' | 'USD'
}

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
 * Props untuk komponen PayrollReceiptGenerator
 */
interface PayrollReceiptGeneratorProps {
  results: PayrollCalculationResult[]
  companyConfig?: CompanyConfig
  className?: string
  onConfigChange?: (config: CompanyConfig) => void
}

/**
 * Komponen untuk generate kwitansi pembayaran gaji dalam format PDF
 * Mendukung kustomisasi format, metode pembayaran, dan pesan custom
 */
export function PayrollReceiptGenerator({
  results,
  companyConfig,
  className,
  onConfigChange
}: PayrollReceiptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>({
    title: 'KWITANSI PEMBAYARAN GAJI',
    subtitle: 'Tanda Terima Pembayaran',
    receiptNumber: `KWT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-001`,
    receiptDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'transfer',
    customMessage: 'Telah diterima dengan baik dan benar pembayaran gaji karyawan untuk periode yang bersangkutan.',
    showStamp: true,
    showWatermark: false,
    currency: 'IDR'
  })
  
  const [company, setCompany] = useState<CompanyConfig>({
    name: companyConfig?.name || 'PT. Coal Tools Indonesia',
    address: companyConfig?.address || 'Jl. Industri No. 123, Jakarta Selatan',
    phone: companyConfig?.phone || '+62 21 1234 5678',
    email: companyConfig?.email || 'hr@coaltools.co.id',
    logo: companyConfig?.logo,
    taxId: companyConfig?.taxId || '01.234.567.8-901.000'
  })
  
  const receiptRef = useRef<HTMLDivElement>(null)

  /**
   * Format currency berdasarkan konfigurasi
   */
  const formatCurrency = (amount: number): string => {
    if (receiptConfig.currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount / 15000) // Simplified conversion rate
    }
    
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
   * Generate nomor kwitansi otomatis
   */
  const generateReceiptNumber = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `KWT-${year}${month}${day}-${random}`
  }

  /**
   * Calculate total net salary untuk semua karyawan
   */
  const calculateTotalNetSalary = (): number => {
    return results.reduce((total, result) => total + result.neto, 0)
  }

  /**
   * Generate PDF kwitansi untuk semua karyawan (summary)
   */
  const generateSummaryReceiptPDF = async () => {
    if (results.length === 0) return
    
    setIsGenerating(true)
    
    try {
      const { default: jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      
      // Create temporary div
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = generateSummaryReceiptHTML()
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.backgroundColor = 'white'
      document.body.appendChild(tempDiv)
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff'
      })
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      
      // Download
      const fileName = `Kwitansi_Gaji_Summary_${receiptConfig.receiptDate}.pdf`
      pdf.save(fileName)
      
      // Cleanup
      document.body.removeChild(tempDiv)
      
    } catch (error) {
      console.error('Error generating summary receipt PDF:', error)
      alert('Terjadi kesalahan saat generate kwitansi. Silakan coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Generate PDF kwitansi individual
   */
  const generateIndividualReceiptPDF = async (result: PayrollCalculationResult) => {
    setIsGenerating(true)
    
    try {
      const { default: jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      
      // Create temporary div
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = generateIndividualReceiptHTML(result)
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '210mm'
      tempDiv.style.backgroundColor = 'white'
      document.body.appendChild(tempDiv)
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff'
      })
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      
      // Download
      const fileName = `Kwitansi_${result.employeeName.replace(/\s+/g, '_')}_${receiptConfig.receiptDate}.pdf`
      pdf.save(fileName)
      
      // Cleanup
      document.body.removeChild(tempDiv)
      
    } catch (error) {
      console.error('Error generating individual receipt PDF:', error)
      alert('Terjadi kesalahan saat generate kwitansi. Silakan coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Generate HTML untuk kwitansi summary (semua karyawan)
   */
  const generateSummaryReceiptHTML = (): string => {
    const totalAmount = calculateTotalNetSalary()
    
    return `
      <div style="width: 210mm; min-height: 297mm; padding: 20mm; font-family: Arial, sans-serif; background: white; box-sizing: border-box; position: relative;">
        ${receiptConfig.showWatermark ? `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72px; color: rgba(0,0,0,0.05); font-weight: bold; z-index: 0; pointer-events: none;">
          KWITANSI
        </div>
        ` : ''}
        
        <div style="position: relative; z-index: 1;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
            ${company.logo ? `<img src="${company.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
            <h1 style="margin: 0; font-size: 28px; color: #1e40af; font-weight: bold;">${receiptConfig.title}</h1>
            <p style="margin: 5px 0; color: #666; font-size: 14px; font-style: italic;">${receiptConfig.subtitle}</p>
          </div>

          <!-- Receipt Info -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #1e40af;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #666;">No. Kwitansi:</p>
              <p style="margin: 5px 0 15px 0; font-size: 16px; font-weight: bold; color: #1e40af;">${receiptConfig.receiptNumber}</p>
              
              <p style="margin: 0; font-size: 12px; color: #666;">Tanggal:</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;">${formatDate(receiptConfig.receiptDate)}</p>
            </div>
            
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #666;">Metode Pembayaran:</p>
              <p style="margin: 5px 0 15px 0; font-size: 14px; font-weight: bold; color: #333; text-transform: uppercase;">${receiptConfig.paymentMethod}</p>
              
              <p style="margin: 0; font-size: 12px; color: #666;">Mata Uang:</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;">${receiptConfig.currency}</p>
            </div>
          </div>

          <!-- Company Info -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Informasi Perusahaan</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; font-size: 18px; color: #1e40af; font-weight: bold;">${company.name}</h4>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${company.address}</p>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Telp: ${company.phone} | Email: ${company.email}</p>
              ${company.taxId ? `<p style="margin: 0; font-size: 12px; color: #666;">NPWP: ${company.taxId}</p>` : ''}
            </div>
          </div>

          <!-- Payment Details -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Rincian Pembayaran</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #1e40af; color: white;">
                  <th style="text-align: left; padding: 12px; font-size: 12px; border: 1px solid #1e40af;">Keterangan</th>
                  <th style="text-align: center; padding: 12px; font-size: 12px; border: 1px solid #1e40af;">Jumlah Karyawan</th>
                  <th style="text-align: right; padding: 12px; font-size: 12px; border: 1px solid #1e40af;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151;">Pembayaran Gaji Karyawan</td>
                  <td style="text-align: center; padding: 12px; border: 1px solid #e5e7eb; color: #374151; font-weight: bold;">${results.length}</td>
                  <td style="text-align: right; padding: 12px; border: 1px solid #e5e7eb; color: #374151; font-weight: bold;">${formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
            
            <!-- Employee List -->
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #374151;">Daftar Karyawan:</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                ${results.map((result, index) => `
                  <div style="font-size: 11px; color: #666; padding: 5px; background: white; border-radius: 4px;">
                    ${index + 1}. ${result.employeeName} - ${formatCurrency(result.neto)}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Total Amount Box -->
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 10px 0; font-size: 18px; opacity: 0.9;">TOTAL PEMBAYARAN</h3>
            <p style="margin: 0 0 10px 0; font-size: 32px; font-weight: bold;">${formatCurrency(totalAmount)}</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">Terbilang: ${numberToWords(totalAmount)} Rupiah</p>
          </div>

          <!-- Custom Message -->
          ${receiptConfig.customMessage ? `
          <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 13px; color: #065f46; font-style: italic; text-align: center;">
              ${receiptConfig.customMessage}
            </p>
          </div>
          ` : ''}

          <!-- Signature Section -->
          <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <div style="text-align: center; width: 45%;">
              <p style="margin: 0 0 60px 0; font-size: 12px; color: #666;">Yang Menerima</p>
              ${receiptConfig.showStamp ? `
              <div style="width: 80px; height: 80px; border: 2px dashed #666; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666;">
                MATERAI<br/>10.000
              </div>
              ` : ''}
              <div style="border-top: 1px solid #333; padding-top: 5px; margin-top: 10px;">
                <p style="margin: 0; font-size: 12px; color: #333;">(............................)</p>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #666;">Penerima</p>
              </div>
            </div>
            
            <div style="text-align: center; width: 45%;">
              <p style="margin: 0 0 60px 0; font-size: 12px; color: #666;">Yang Menyerahkan</p>
              <div style="border-top: 1px solid #333; padding-top: 5px; margin-top: 70px;">
                <p style="margin: 0; font-size: 12px; color: #333; font-weight: bold;">${company.name}</p>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #666;">Finance Department</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <p style="margin: 0;">Kwitansi ini digenerate secara otomatis pada ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${company.name}. All rights reserved.</p>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Generate HTML untuk kwitansi individual
   */
  const generateIndividualReceiptHTML = (result: PayrollCalculationResult): string => {
    return `
      <div style="width: 210mm; min-height: 297mm; padding: 20mm; font-family: Arial, sans-serif; background: white; box-sizing: border-box; position: relative;">
        ${receiptConfig.showWatermark ? `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72px; color: rgba(0,0,0,0.05); font-weight: bold; z-index: 0; pointer-events: none;">
          KWITANSI
        </div>
        ` : ''}
        
        <div style="position: relative; z-index: 1;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
            ${company.logo ? `<img src="${company.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
            <h1 style="margin: 0; font-size: 28px; color: #1e40af; font-weight: bold;">${receiptConfig.title}</h1>
            <p style="margin: 5px 0; color: #666; font-size: 14px; font-style: italic;">${receiptConfig.subtitle}</p>
          </div>

          <!-- Receipt Info -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #1e40af;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #666;">No. Kwitansi:</p>
              <p style="margin: 5px 0 15px 0; font-size: 16px; font-weight: bold; color: #1e40af;">${receiptConfig.receiptNumber}-${result.employeeName.replace(/\s+/g, '').substring(0, 3).toUpperCase()}</p>
              
              <p style="margin: 0; font-size: 12px; color: #666;">Tanggal:</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;">${formatDate(receiptConfig.receiptDate)}</p>
            </div>
            
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #666;">Metode Pembayaran:</p>
              <p style="margin: 5px 0 15px 0; font-size: 14px; font-weight: bold; color: #333; text-transform: uppercase;">${receiptConfig.paymentMethod}</p>
              
              <p style="margin: 0; font-size: 12px; color: #666;">Mata Uang:</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;">${receiptConfig.currency}</p>
            </div>
          </div>

          <!-- Employee Info -->
          <div style="margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Informasi Karyawan</h3>
            <table style="width: 100%; font-size: 12px;">
              <tr>
                <td style="padding: 5px 0; width: 120px; color: #666;">Nama Karyawan</td>
                <td style="padding: 5px 0; color: #333; font-weight: bold;">: ${result.employeeName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;">Hari Kerja</td>
                <td style="padding: 5px 0; color: #333;">: ${result.hariKerja} hari</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;">Upah Harian</td>
                <td style="padding: 5px 0; color: #333;">: ${formatCurrency(result.upahHarian)}</td>
              </tr>
            </table>
          </div>

          <!-- Payment Details -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Rincian Pembayaran</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #1e40af; color: white;">
                  <th style="text-align: left; padding: 12px; font-size: 12px; border: 1px solid #1e40af;">Keterangan</th>
                  <th style="text-align: right; padding: 12px; font-size: 12px; border: 1px solid #1e40af;">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151;">Gaji Bruto</td>
                  <td style="text-align: right; padding: 12px; border: 1px solid #e5e7eb; color: #374151;">${formatCurrency(result.bruto)}</td>
                </tr>
                ${result.deductions.length > 0 ? `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #ef4444;">Total Potongan</td>
                  <td style="text-align: right; padding: 12px; border: 1px solid #e5e7eb; color: #ef4444;">-${formatCurrency(result.deductions.reduce((sum, d) => sum + d.amount, 0))}</td>
                </tr>
                ` : ''}
                ${result.pajak > 0 ? `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #ef4444;">Pajak PPh 21</td>
                  <td style="text-align: right; padding: 12px; border: 1px solid #e5e7eb; color: #ef4444;">-${formatCurrency(result.pajak)}</td>
                </tr>
                ` : ''}
                <tr style="background: #ecfdf5; font-weight: bold;">
                  <td style="padding: 12px; border: 1px solid #10b981; color: #065f46;">GAJI BERSIH</td>
                  <td style="text-align: right; padding: 12px; border: 1px solid #10b981; color: #065f46;">${formatCurrency(result.neto)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Total Amount Box -->
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 10px 0; font-size: 18px; opacity: 0.9;">JUMLAH DITERIMA</h3>
            <p style="margin: 0 0 10px 0; font-size: 32px; font-weight: bold;">${formatCurrency(result.neto)}</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">Terbilang: ${numberToWords(result.neto)} Rupiah</p>
          </div>

          <!-- Custom Message -->
          ${receiptConfig.customMessage ? `
          <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 13px; color: #065f46; font-style: italic; text-align: center;">
              ${receiptConfig.customMessage}
            </p>
          </div>
          ` : ''}

          <!-- Signature Section -->
          <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <div style="text-align: center; width: 45%;">
              <p style="margin: 0 0 60px 0; font-size: 12px; color: #666;">Yang Menerima</p>
              ${receiptConfig.showStamp ? `
              <div style="width: 80px; height: 80px; border: 2px dashed #666; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666;">
                MATERAI<br/>10.000
              </div>
              ` : ''}
              <div style="border-top: 1px solid #333; padding-top: 5px; margin-top: 10px;">
                <p style="margin: 0; font-size: 12px; color: #333; font-weight: bold;">${result.employeeName}</p>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #666;">Karyawan</p>
              </div>
            </div>
            
            <div style="text-align: center; width: 45%;">
              <p style="margin: 0 0 60px 0; font-size: 12px; color: #666;">Yang Menyerahkan</p>
              <div style="border-top: 1px solid #333; padding-top: 5px; margin-top: 70px;">
                <p style="margin: 0; font-size: 12px; color: #333; font-weight: bold;">${company.name}</p>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #666;">Finance Department</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <p style="margin: 0;">Kwitansi ini digenerate secara otomatis pada ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${company.name}. All rights reserved.</p>
          </div>
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
   * Update company config
   */
  const updateCompanyConfig = (updates: Partial<CompanyConfig>) => {
    const newConfig = { ...company, ...updates }
    setCompany(newConfig)
    onConfigChange?.(newConfig)
  }

  if (results.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Belum Ada Data Payroll</h3>
            <p className="text-muted-foreground">
              Silakan lakukan perhitungan payroll terlebih dahulu untuk generate kwitansi.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalNetSalary = calculateTotalNetSalary()

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Generate Kwitansi Pembayaran Gaji
          </CardTitle>
          <CardDescription>
            Generate kwitansi pembayaran untuk {results.length} karyawan dengan total {formatCurrency(totalNetSalary)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={generateSummaryReceiptPDF}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download Kwitansi Summary'}
            </Button>
            
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview Kwitansi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Preview Kwitansi</DialogTitle>
                  <DialogDescription>
                    Preview format kwitansi yang akan di-generate
                  </DialogDescription>
                </DialogHeader>
                <div 
                  ref={receiptRef}
                  dangerouslySetInnerHTML={{ __html: generateSummaryReceiptHTML() }}
                  className="border rounded-lg overflow-hidden"
                  style={{ transform: 'scale(0.4)', transformOrigin: 'top left', width: '250%' }}
                />
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline"
              onClick={() => setReceiptConfig(prev => ({ ...prev, receiptNumber: generateReceiptNumber() }))}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate No. Baru
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Konfigurasi Kwitansi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receipt-title">Judul Kwitansi</Label>
              <Input
                id="receipt-title"
                value={receiptConfig.title}
                onChange={(e) => setReceiptConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Judul kwitansi"
              />
            </div>
            
            <div>
              <Label htmlFor="receipt-subtitle">Subtitle</Label>
              <Input
                id="receipt-subtitle"
                value={receiptConfig.subtitle}
                onChange={(e) => setReceiptConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Subtitle kwitansi"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="receipt-number">No. Kwitansi</Label>
                <Input
                  id="receipt-number"
                  value={receiptConfig.receiptNumber}
                  onChange={(e) => setReceiptConfig(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder="Nomor kwitansi"
                />
              </div>
              
              <div>
                <Label htmlFor="receipt-date">Tanggal</Label>
                <Input
                  id="receipt-date"
                  type="date"
                  value={receiptConfig.receiptDate}
                  onChange={(e) => setReceiptConfig(prev => ({ ...prev, receiptDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payment-method">Metode Pembayaran</Label>
                <Select 
                  value={receiptConfig.paymentMethod} 
                  onValueChange={(value: 'cash' | 'transfer' | 'check') => 
                    setReceiptConfig(prev => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="currency">Mata Uang</Label>
                <Select 
                  value={receiptConfig.currency} 
                  onValueChange={(value: 'IDR' | 'USD') => 
                    setReceiptConfig(prev => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata uang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="custom-message">Pesan Custom</Label>
              <Textarea
                id="custom-message"
                value={receiptConfig.customMessage}
                onChange={(e) => setReceiptConfig(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Pesan atau catatan tambahan"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{results.length}</p>
              <p className="text-sm text-blue-600">Karyawan</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalNetSalary)}</p>
              <p className="text-sm text-green-600">Total Gaji Bersih</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-lg font-bold text-purple-600">{formatDate(receiptConfig.receiptDate)}</p>
              <p className="text-sm text-purple-600">Tanggal Pembayaran</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-lg font-bold text-orange-600">{receiptConfig.receiptNumber}</p>
              <p className="text-sm text-orange-600">No. Kwitansi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Karyawan ({results.length})</CardTitle>
          <CardDescription>
            Klik "Kwitansi" untuk generate kwitansi individual
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
                    <Badge variant="outline" className="text-green-600">
                      {formatCurrency(result.neto)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateIndividualReceiptPDF(result)}
                      disabled={isGenerating}
                      className="flex items-center gap-1"
                    >
                      <Receipt className="w-3 h-3" />
                      Kwitansi
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

export default PayrollReceiptGenerator