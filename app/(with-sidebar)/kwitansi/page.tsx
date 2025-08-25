"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Receipt, 
  Download, 
  Eye,
  FileText,
  Calendar,
  User,
  DollarSign,
  Building2,
  X,
  Maximize,
  CreditCard,
  MapPin,
  Phone,
  Mail
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Function to convert number to Indonesian words
function numberToWords(num: number): string {
  const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan']
  const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas']
  const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh']
  
  if (num === 0) return 'nol'
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) {
    const ten = Math.floor(num / 10)
    const one = num % 10
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '')
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    return (hundred === 1 ? 'seratus' : ones[hundred] + ' ratus') + (remainder > 0 ? ' ' + numberToWords(remainder) : '')
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000)
    const remainder = num % 1000
    return (thousand === 1 ? 'seribu' : numberToWords(thousand) + ' ribu') + (remainder > 0 ? ' ' + numberToWords(remainder) : '')
  }
  if (num < 1000000000) {
    const million = Math.floor(num / 1000000)
    const remainder = num % 1000000
    return numberToWords(million) + ' juta' + (remainder > 0 ? ' ' + numberToWords(remainder) : '')
  }
  return 'number too large'
}

export default function KwitansiPage() {
  const { toast } = useToast()
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    nomorKwitansi: "KW-001/2025",
    tanggal: "2025-08-07",
    namaPenerima: "Azhar Latif",
    alamat: "",
    jumlahUang: "127450000",
    untukPembayaran: "Pengembalian Uang Bapak Azhar Latif yang sudah terpakai untuk (Biaya Produksi Batubara berdasarkan Laporan Biaya Produksi Batubara Tahap 2) Bulan Juli 2025,",
    namaPembayar: "PT. GLOBAL LESTARI ALAM",
    jabatan: "",
    nomorRekening: "0058-0100-4963-562",
    namaRekening: "AZHAR LATIF",
    tempat: "Sawahlunto",
    tanggalKwitansi: "7 Agustus 2025",
    bankName: "BRI",
    transferMethod: "Di Transfer ke rekening"
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCurrency = (amount: string) => {
    const num = parseInt(amount.replace(/\D/g, ''))
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const getAmountInWords = () => {
    const num = parseInt(formData.jumlahUang.replace(/\D/g, ''))
    return numberToWords(num) + ' rupiah'
  }

  const generateKwitansi = () => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Pop-up blocked. Please allow pop-ups for this site.",
        variant: "destructive"
      })
      return
    }

    // Generate the HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kwitansi - ${formData.nomorKwitansi}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            padding: 20px 25px;
            margin-bottom: 15px;
            display: flex;
            align-items: flex-start;
            gap: 20px;
          }
          .logo {
            width: 90px;
            height: 90px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .company-info {
            flex: 1;
            min-width: 0;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 4px 0;
            color: #dc2626;
            line-height: 1.1;
            text-transform: uppercase;
          }
          .company-type {
            font-size: 13px;
            color: #059669;
            margin: 0 0 8px 0;
            font-weight: 600;
            text-transform: uppercase;
          }
          .company-address {
            font-size: 11px;
            color: #000;
            margin: 0 0 3px 0;
            line-height: 1.4;
          }
          .company-contact {
            font-size: 11px;
            color: #000;
            margin: 0;
            line-height: 1.4;
          }
          .header-separator {
            margin-bottom: 20px;
          }
          .separator-line {
            border: none;
            height: 1px;
            background-color: #000;
            margin: 0 25px 2px 25px;
          }
          .content {
            padding: 0 20px;
          }
          .title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 25px;
            color: black;
          }
          .receipt-number {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          .recipient-info {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          .amount-words {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          .payment-purpose {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          .bank-details {
            margin-bottom: 25px;
            line-height: 1.5;
          }
          .field-label {
            font-size: 11px;
            color: #374151;
          }
          .field-value {
            font-size: 11px;
            text-decoration: underline;
            padding: 0 3px;
            color: black;
            font-weight: 500;
          }
          .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 30px;
          }
          .amount-box {
            border: 2px solid black;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
            color: white;
            background: black;
            min-width: 150px;
            text-align: center;
          }
          .signature-section {
            text-align: center;
            min-width: 180px;
          }
          .place-date {
            font-size: 11px;
            margin-bottom: 50px;
            color: #374151;
          }
          .signature-name {
            font-size: 11px;
            font-weight: bold;
            color: black;
          }
          .signature-title {
            font-size: 10px;
            color: #374151;
            margin-top: 2px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
              <!-- Yellow background -->
              <rect x="5" y="5" width="90" height="90" fill="#fbbf24" rx="8"/>
              <!-- Red triangle -->
              <polygon points="50,25 75,70 25,70" fill="#dc2626"/>
              <!-- Green palm tree/leaf -->
              <path d="M30 65 Q50 50 70 65" stroke="white" stroke-width="2" fill="none"/>
              <path d="M30 65 Q45 55 50 60 Q55 55 70 65" fill="#22c55e"/>
              <path d="M35 60 Q50 45 65 60" stroke="white" stroke-width="2" fill="none"/>
              <path d="M35 60 Q47 50 50 55 Q53 50 65 60" fill="#22c55e"/>
              <path d="M40 55 Q50 40 60 55" stroke="white" stroke-width="2" fill="none"/>
              <path d="M40 55 Q48 45 50 50 Q52 45 60 55" fill="#22c55e"/>
              <!-- Tree trunk -->
              <rect x="47" y="65" width="6" height="12" fill="white"/>
            </svg>
          </div>
          <div class="company-info">
            <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
            <div class="company-type">(GENERAL SUPPLIERS & CONTRACTORS)</div>
            <div class="company-address">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</div>
            <div class="company-contact">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</div>
          </div>
        </div>
        
        <!-- Header separator lines -->
        <div class="header-separator">
          <hr class="separator-line">
          <hr class="separator-line">
        </div>
        
        <div class="content">
          <div class="title">KWITANSI</div>
          
          <div class="receipt-number">
            <span class="field-label">NO. </span>
            <span class="field-value">${formData.nomorKwitansi}</span>
          </div>
          
          <div class="recipient-info">
            <span class="field-label">Telah terima dari </span>
            <span class="field-value">PT. GLOBAL LESTARI ALAM</span>
          </div>
          
          <div class="amount-words">
            <span class="field-label">Uang sejumlah </span>
            <span class="field-value"># Tiga Juta Enam Puluh Tiga Ribu Sembilan Ratus Tiga Puluh Rupiah</span>
          </div>
          
          <div class="payment-purpose">
            <span class="field-label">Untuk Pembayaran: </span>
            <span>Gaji Bulan Juli 2025 10 hari(Rp.2.258.060) + BBM(Rp.161.290) + Uang Makan(Rp.322.580) + Lembur 8 jam (322.000) = Rp. 3.063.930.Di kirim ke Rekening BCA-3215.484.73 a/n</span>
          </div>
          
          <div class="recipient-name">
            <span class="field-value">Atika Dewi Suryani</span>
          </div>
          
          <div class="bottom-section">
            <div class="amount-box">
              Rp. 3.063.930
            </div>
            
            <div class="signature-section">
              <div class="place-date">Sawahlunto, 01-Agustus 2025</div>
              <div class="signature-line"></div>
              <div class="signature-name">ATIKA DEWI SURYANI</div>
              <div class="signature-title">Accounting</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print()
      printWindow.close()
    }

    toast({
      title: "Kwitansi berhasil dibuat",
      description: "Kwitansi telah di-generate dan siap di-download"
    })
  }

  const previewKwitansi = () => {
    setShowPreview(true)
  }

  const openFullScreenPreview = () => {
    // Create a new window for full-screen preview
    const previewWindow = window.open('', '_blank')
    if (!previewWindow) {
      toast({
        title: "Error",
        description: "Pop-up blocked. Please allow pop-ups for this site.",
        variant: "destructive"
      })
      return
    }

    // Generate the HTML content for full-screen preview
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Preview Kwitansi - ${formData.nomorKwitansi}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }
          
          .kwitansi-container {
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
            width: 100%;
            max-width: 800px;
            aspect-ratio: 1.414;
            position: relative;
          }
          
          .header {
            padding: 15px 20px;
            background: white;
            display: flex;
            align-items: flex-start;
            gap: 20px;
          }
          
          .logo {
            width: 90px;
            height: 90px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .company-info {
            flex: 1;
            min-width: 0;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 4px;
            line-height: 1.1;
            text-transform: uppercase;
          }
          
          .company-type {
            font-size: 13px;
            color: #059669;
            margin-bottom: 8px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .company-address {
            font-size: 9px;
            color: #000;
            margin-bottom: 2px;
            line-height: 1.3;
          }
          
          .company-contact {
            font-size: 9px;
            color: #000;
            line-height: 1.3;
          }
          
          .header-separator {
            margin-bottom: 15px;
          }
          
          .separator-line {
            border: none;
            height: 1px;
            background-color: #000;
            margin: 0 20px 2px 20px;
          }
          
          .content {
            padding: 20px;
            background: white;
            height: calc(100% - 82px);
            display: flex;
            flex-direction: column;
          }
          
          .title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 25px;
            color: black;
          }
          
          .receipt-number {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          
          .recipient-info {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          
          .amount-words {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          
          .payment-purpose {
            margin-bottom: 15px;
            line-height: 1.5;
          }
          
          .bank-details {
            margin-bottom: 25px;
            line-height: 1.5;
          }
          
          .field-label {
            font-size: 11px;
            color: #374151;
          }
          
          .field-value {
            font-size: 11px;
            text-decoration: underline;
            padding: 0 3px;
            color: black;
            font-weight: 500;
          }
          
          .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: auto;
            padding-top: 20px;
          }
          
          .amount-box {
            border: 2px solid black;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
            color: white;
            background: black;
            min-width: 150px;
            text-align: center;
          }
          
          .signature-section {
            text-align: center;
            min-width: 180px;
          }
          
          .place-date {
            font-size: 11px;
            margin-bottom: 50px;
            color: #374151;
          }
          
          .signature-name {
            font-size: 11px;
            font-weight: bold;
            color: black;
          }
          
          .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
          }
          
          .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            font-size: 12px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          
          .btn-close {
            background: #ef4444;
            color: white;
          }
          
          .btn-print {
            background: #3b82f6;
            color: white;
          }
          
          .btn:hover {
            opacity: 0.9;
          }
          
          @media print {
            body { 
              background: white; 
              padding: 0;
            }
            .controls { display: none; }
            .kwitansi-container {
              box-shadow: none;
              border-radius: 0;
              max-width: none;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="controls">
          <button class="btn btn-close" onclick="window.close()">✕ Tutup</button>
          <button class="btn btn-print" onclick="window.print()">🖨️ Print</button>
        </div>
        
        <div class="kwitansi-container">
          <div class="header">
            <div class="logo">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <!-- Yellow background -->
                <rect x="5" y="5" width="90" height="90" fill="#fbbf24" rx="8"/>
                <!-- Red triangle -->
                <polygon points="50,25 75,70 25,70" fill="#dc2626"/>
                <!-- Green palm tree/leaf -->
                <path d="M30 65 Q50 50 70 65" stroke="white" stroke-width="2" fill="none"/>
                <path d="M30 65 Q45 55 50 60 Q55 55 70 65" fill="#22c55e"/>
                <path d="M35 60 Q50 45 65 60" stroke="white" stroke-width="2" fill="none"/>
                <path d="M35 60 Q47 50 50 55 Q53 50 65 60" fill="#22c55e"/>
                <path d="M40 55 Q50 40 60 55" stroke="white" stroke-width="2" fill="none"/>
                <path d="M40 55 Q48 45 50 50 Q52 45 60 55" fill="#22c55e"/>
                <!-- Tree trunk -->
                <rect x="47" y="65" width="6" height="12" fill="white"/>
              </svg>
            </div>
            <div class="company-info">
              <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
              <div class="company-type">(GENERAL SUPPLIERS & CONTRACTORS)</div>
              <div class="company-address">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</div>
              <div class="company-contact">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</div>
            </div>
          </div>
          
          <!-- Header separator lines -->
          <div class="header-separator">
            <hr class="separator-line">
            <hr class="separator-line">
          </div>
          
          <div class="content">
            <div class="title">KWITANSI</div>
            
            <div class="receipt-number">
              <span class="field-label">NO. </span>
              <span class="field-value">${formData.nomorKwitansi}</span>
            </div>
            
            <div class="recipient-info">
              <span class="field-label">Telah terima dari </span>
              <span class="field-value">PT. GLOBAL LESTARI ALAM</span>
            </div>
            
            <div class="amount-words">
              <span class="field-label">Uang sejumlah </span>
              <span class="field-value"># Tiga Juta Enam Puluh Tiga Ribu Sembilan Ratus Tiga Puluh Rupiah</span>
            </div>
            
            <div class="payment-purpose">
              <span class="field-label">Untuk Pembayaran: </span>
              <span>Gaji Bulan Juli 2025 10 hari(Rp.2.258.060) + BBM(Rp.161.290) + Uang Makan(Rp.322.580) + Lembur 8 jam (322.000) = Rp. 3.063.930.Di kirim ke Rekening BCA-3215.484.73 a/n</span>
            </div>
            
            <div class="recipient-name">
              <span class="field-value">Atika Dewi Suryani</span>
            </div>
            
            <div class="bottom-section">
              <div class="amount-box">
                Rp. 3.063.930
              </div>
              
              <div class="signature-section">
                <div class="place-date">Sawahlunto, 01-Agustus 2025</div>
                <div class="signature-line"></div>
                <div class="signature-name">ATIKA DEWI SURYANI</div>
                <div class="signature-title">Accounting</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    previewWindow.document.write(htmlContent)
    previewWindow.document.close()
    
    toast({
      title: "Preview Dibuka",
      description: "Preview kwitansi telah dibuka di tab baru"
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <a href="/business-tools" className="hover:text-primary">Business Tools</a>
          <span>/</span>
          <span className="text-primary">Generator Kwitansi</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Receipt className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Generator Kwitansi
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Buat kwitansi profesional dengan format Indonesia yang siap untuk dicetak dan digunakan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  Form Kwitansi
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Isi data lengkap untuk membuat kwitansi yang profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomorKwitansi">Nomor Kwitansi</Label>
                    <Input
                      id="nomorKwitansi"
                      value={formData.nomorKwitansi}
                      onChange={(e) => handleInputChange('nomorKwitansi', e.target.value)}
                      placeholder="KW-001/2025"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggal">Tanggal</Label>
                    <Input
                      id="tanggal"
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => handleInputChange('tanggal', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="namaPembayar">Nama Pembayar</Label>
                  <Input
                    id="namaPembayar"
                    value={formData.namaPembayar}
                    onChange={(e) => handleInputChange('namaPembayar', e.target.value)}
                    placeholder="PT. GLOBAL LESTARI ALAM"
                  />
                </div>

                <div>
                  <Label htmlFor="jumlahUang">Jumlah Uang (tanpa titik/koma)</Label>
                  <Input
                    id="jumlahUang"
                    value={formData.jumlahUang}
                    onChange={(e) => handleInputChange('jumlahUang', e.target.value)}
                    placeholder="127450000"
                  />
                </div>

                <div>
                  <Label htmlFor="untukPembayaran">Untuk Pembayaran</Label>
                  <Textarea
                    id="untukPembayaran"
                    value={formData.untukPembayaran}
                    onChange={(e) => handleInputChange('untukPembayaran', e.target.value)}
                    placeholder="Keterangan pembayaran"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bank Transfer Details (Optional)</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs text-gray-600 mb-2">
                      Format: "[TRANSFER METHOD] Bank [BANK]_Nomor Rekening : [NOMOR] A/n [NAMA]"
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label htmlFor="transferMethod" className="text-xs">Transfer Method / Wording</Label>
                        <Input
                          id="transferMethod"
                          value={formData.transferMethod}
                          onChange={(e) => handleInputChange('transferMethod', e.target.value)}
                          placeholder="Di Transfer ke rekening"
                          className="h-8 text-xs"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Examples: "Di Transfer ke rekening", "Dibayar melalui transfer", "Dikirim ke rekening", "Disetor ke"
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bankName" className="text-xs">Nama Bank</Label>
                        <Input
                          id="bankName"
                          value={formData.bankName}
                          onChange={(e) => handleInputChange('bankName', e.target.value)}
                          placeholder="BRI"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="nomorRekening" className="text-xs">Nomor Rekening</Label>
                          <Input
                            id="nomorRekening"
                            value={formData.nomorRekening}
                            onChange={(e) => handleInputChange('nomorRekening', e.target.value)}
                            placeholder="0058-0100-4963-562"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label htmlFor="namaRekening" className="text-xs">A/n (Nama Pemilik)</Label>
                          <Input
                            id="namaRekening"
                            value={formData.namaRekening}
                            onChange={(e) => handleInputChange('namaRekening', e.target.value)}
                            placeholder="AZHAR LATIF"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tempat">Tempat</Label>
                    <Input
                      id="tempat"
                      value={formData.tempat}
                      onChange={(e) => handleInputChange('tempat', e.target.value)}
                      placeholder="Sawahlunto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggalKwitansi">Tanggal Kwitansi</Label>
                    <Input
                      id="tanggalKwitansi"
                      value={formData.tanggalKwitansi}
                      onChange={(e) => handleInputChange('tanggalKwitansi', e.target.value)}
                      placeholder="7 Agustus 2025"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <Card className="border-2 border-gray-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200">
                <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-gray-600" />
                  </div>
                  Preview Kwitansi
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Tampilan kwitansi yang akan di-generate
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border-2 border-gray-200 rounded-lg bg-white" style={{ aspectRatio: '1.414', maxHeight: '600px', overflow: 'auto' }}>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div className="w-28 h-28 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {/* Yellow background */}
                          <rect x="5" y="5" width="90" height="90" fill="#fbbf24" rx="8"/>
                          {/* Red triangle */}
                          <polygon points="50,25 75,70 25,70" fill="#dc2626"/>
                          {/* Green palm tree/leaf */}
                          <path d="M30 65 Q50 50 70 65" stroke="white" strokeWidth="2" fill="none"/>
                          <path d="M30 65 Q45 55 50 60 Q55 55 70 65" fill="#22c55e"/>
                          <path d="M35 60 Q50 45 65 60" stroke="white" strokeWidth="2" fill="none"/>
                          <path d="M35 60 Q47 50 50 55 Q53 50 65 60" fill="#22c55e"/>
                          <path d="M40 55 Q50 40 60 55" stroke="white" strokeWidth="2" fill="none"/>
                          <path d="M40 55 Q48 45 50 50 Q52 45 60 55" fill="#22c55e"/>
                          {/* Tree trunk */}
                          <rect x="47" y="65" width="6" height="12" fill="white"/>
                        </svg>
                      </div>
                      
                      {/* Company Info */}
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-red-600 mb-1 uppercase">PT. GLOBAL LESTARI ALAM</h1>
                        <p className="text-sm text-green-600 mb-2 uppercase font-semibold">(GENERAL SUPPLIERS & CONTRACTORS)</p>
                        <p className="text-xs text-black mb-1">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</p>
                        <p className="text-xs text-black">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Header separator lines */}
                  <div className="px-6">
                    <hr className="border-t border-black mb-1" />
                    <hr className="border-t border-black" />
                  </div>

                  {/* Kwitansi Content */}
                  <div className="p-6">
                    {/* Title */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold underline">KWITANSI</h2>
                    </div>

                    {/* Receipt Number */}
                    <div className="mb-4">
                      <span className="text-sm">NO. </span>
                      <span className="text-sm underline px-2">{formData.nomorKwitansi}</span>
                    </div>

                    {/* Recipient Info */}
                    <div className="mb-4">
                      <span className="text-sm">Telah terima dari </span>
                      <span className="text-sm underline px-2">PT. GLOBAL LESTARI ALAM</span>
                    </div>

                    {/* Amount in Words */}
                    <div className="mb-4">
                      <span className="text-sm">Uang sejumlah </span>
                      <span className="text-sm underline px-2"># Tiga Juta Enam Puluh Tiga Ribu Sembilan Ratus Tiga Puluh Rupiah</span>
                    </div>

                    {/* Payment Purpose */}
                    <div className="mb-4">
                      <span className="text-sm">Untuk Pembayaran: </span>
                      <span className="text-sm">Gaji Bulan Juli 2025 10 hari(Rp.2.258.060) + BBM(Rp.161.290) + Uang Makan(Rp.322.580) + Lembur 8 jam (322.000) = Rp. 3.063.930.Di kirim ke Rekening BCA-3215.484.73 a/n</span>
                    </div>

                    {/* Recipient Name */}
                    <div className="mb-6">
                      <span className="text-sm font-semibold">Atika Dewi Suryani</span>
                    </div>

                    {/* Amount Box and Signature */}
                    <div className="flex justify-between items-end">
                      {/* Amount Box */}
                      <div className="border-4 border-black p-3 bg-black text-white">
                        <span className="font-bold text-lg">Rp. 3.063.930</span>
                      </div>

                      {/* Place, Date, and Signature */}
                      <div className="text-right">
                        <p className="text-sm mb-2">Sawahlunto, 01-Agustus 2025</p>
                        <div className="border-b border-black w-32 mb-1"></div>
                        <p className="text-sm font-semibold">ATIKA DEWI SURYANI</p>
                        <p className="text-xs">Accounting</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button onClick={previewKwitansi} variant="outline" className="flex-1 h-12">
            <Eye className="h-4 w-4 mr-2" />
            Preview Modal
          </Button>
          <Button onClick={openFullScreenPreview} variant="outline" className="flex-1 h-12">
            <Maximize className="h-4 w-4 mr-2" />
            Full Screen
          </Button>
          <Button onClick={generateKwitansi} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg">Format Profesional</h3>
              </div>
              <p className="text-gray-600">
                Kwitansi dengan format standar Indonesia yang profesional dan lengkap sesuai standar akuntansi
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg">Export PDF</h3>
              </div>
              <p className="text-gray-600">
                Generate kwitansi langsung ke format PDF yang siap dicetak dengan kualitas tinggi
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg">Preview Real-time</h3>
              </div>
              <p className="text-gray-600">
                Lihat preview kwitansi secara real-time sebelum di-generate untuk memastikan akurasi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview Kwitansi
              </DialogTitle>
            </DialogHeader>
            <div className="bg-white border-2 border-gray-200" style={{ aspectRatio: '1.414', minHeight: '500px' }}>
              {/* Company Header */}
              <div className="p-4 border-b-2 border-black">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-20 h-20 flex-shrink-0 bg-yellow-400 rounded p-1">
                    <img src="/gla-logo.svg" alt="PT. GLOBAL LESTARI ALAM Logo" className="w-full h-full object-contain" />
                  </div>
                  
                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold mb-2" style={{ color: '#374151' }}>PT. GLOBAL LESTARI ALAM</h1>
                    <p className="text-xs mb-3" style={{ color: '#059669' }}>(GENERAL SUPPLIERS & CONTRACTORS)</p>
                    <p className="text-xs text-gray-700 mb-1 leading-tight">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</p>
                    <p className="text-xs text-gray-700 leading-tight">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</p>
                  </div>
                </div>
              </div>

              {/* Kwitansi Content */}
              <div className="p-5 flex flex-col h-full">
                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold underline">KWITANSI</h2>
                </div>

                {/* Receipt Number */}
                <div className="mb-4">
                  <span className="text-xs text-gray-600">NO. </span>
                  <span className="text-xs underline px-1">{formData.nomorKwitansi}</span>
                </div>

                {/* Recipient Info */}
                <div className="mb-4">
                  <span className="text-xs text-gray-600">Telah terima dari </span>
                  <span className="text-xs underline px-1">{formData.namaPembayar}</span>
                </div>

                {/* Amount in Words */}
                <div className="mb-4">
                  <span className="text-xs text-gray-600">Uang sejumlah </span>
                  <span className="text-xs underline px-1">#{getAmountInWords()}</span>
                </div>

                {/* Payment Purpose */}
                <div className="mb-4">
                  <span className="text-xs text-gray-600">Untuk Pembayaran: </span>
                  <span className="text-xs">{formData.untukPembayaran}</span>
                </div>

                {/* Bank Transfer Details */}
                <div className="mb-6">
                  <span className="text-xs text-gray-600">{formData.transferMethod} Bank {formData.bankName}_Nomor Rekening : </span>
                  <span className="text-xs">{formData.nomorRekening} A/n {formData.namaRekening}</span>
                </div>

                {/* Amount Box and Signature */}
                <div className="flex justify-between items-end mt-auto pt-5">
                  {/* Amount Box */}
                  <div className="border-2 border-black p-3 min-w-[120px] text-center">
                    <span className="font-bold text-sm">Rp. {formatCurrency(formData.jumlahUang)}</span>
                  </div>

                  {/* Place, Date, and Signature */}
                  <div className="text-center min-w-[160px]">
                    <p className="text-xs text-gray-600 mb-12">{formData.tempat}, {formData.tanggalKwitansi}</p>
                    <p className="text-xs font-bold">{formData.namaRekening}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowPreview(false)} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Tutup
              </Button>
              <Button onClick={openFullScreenPreview} variant="outline" className="flex-1">
                <Maximize className="h-4 w-4 mr-2" />
                Full Screen
              </Button>
              <Button onClick={generateKwitansi} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
