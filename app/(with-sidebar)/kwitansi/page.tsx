"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Maximize
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
            border-bottom: 2px solid black;
            padding: 15px 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .logo {
            width: 50px;
            height: 50px;
            flex-shrink: 0;
          }
          .company-info {
            flex: 1;
            min-width: 0;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 3px 0;
            color: #d13237;
            line-height: 1.2;
          }
          .company-type {
            font-size: 11px;
            color: #398e63;
            margin: 0 0 8px 0;
            font-weight: 500;
          }
          .company-address {
            font-size: 9px;
            color: #374151;
            margin: 0 0 2px 0;
            line-height: 1.3;
          }
          .company-contact {
            font-size: 9px;
            color: #374151;
            margin: 0;
            line-height: 1.3;
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
            color: black;
            background: white;
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
              <!-- Yellow background triangle -->
              <polygon points="50,5 95,85 5,85" fill="#fbbf24"/>
              <!-- Red triangle -->
              <polygon points="50,15 85,75 15,75" fill="#dc2626"/>
              <!-- Tree trunk -->
              <rect x="47" y="60" width="6" height="15" fill="white"/>
              <!-- Tree leaves - layered curves -->
              <path d="M25 65 Q50 50 75 65" stroke="white" stroke-width="2" fill="none"/>
              <path d="M25 65 Q35 55 50 60 Q65 55 75 65" fill="#22c55e"/>
              <path d="M30 60 Q50 45 70 60" stroke="white" stroke-width="2" fill="none"/>
              <path d="M30 60 Q40 50 50 55 Q60 50 70 60" fill="#22c55e"/>
              <path d="M35 55 Q50 40 65 55" stroke="white" stroke-width="2" fill="none"/>
              <path d="M35 55 Q45 45 50 50 Q55 45 65 55" fill="#22c55e"/>
              <path d="M40 50 Q50 35 60 50" stroke="white" stroke-width="2" fill="none"/>
              <path d="M40 50 Q47 40 50 45 Q53 40 60 50" fill="#22c55e"/>
            </svg>
          </div>
          <div class="company-info">
            <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
            <div class="company-type">(GENERAL SUPPLIERS & CONTRACTORS)</div>
            <div class="company-address">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</div>
            <div class="company-contact">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</div>
          </div>
        </div>
        
        <div class="content">
          <div class="title">KWITANSI</div>
          
          <div class="receipt-number">
            <span class="field-label">NO. </span>
            <span class="field-value">${formData.nomorKwitansi}</span>
          </div>
          
          <div class="recipient-info">
            <span class="field-label">Telah terima dari </span>
            <span class="field-value">${formData.namaPembayar}</span>
          </div>
          
          <div class="amount-words">
            <span class="field-label">Uang sejumlah </span>
            <span class="field-value">#${getAmountInWords()}</span>
          </div>
          
          <div class="payment-purpose">
            <span class="field-label">Untuk Pembayaran: </span>
            <span>${formData.untukPembayaran}</span>
          </div>
          
          <div class="bank-details">
            <span class="field-label">${formData.transferMethod} Bank ${formData.bankName}_Nomor Rekening : </span>
            <span>${formData.nomorRekening} A/n ${formData.namaRekening}</span>
          </div>
          
          <div class="bottom-section">
            <div class="amount-box">
              Rp. ${formatCurrency(formData.jumlahUang)}
            </div>
            
            <div class="signature-section">
              <div class="place-date">${formData.tempat}, ${formData.tanggalKwitansi}</div>
              <div class="signature-line"></div>
              <div class="signature-name">${formData.namaRekening}</div>
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
            border-bottom: 2px solid black;
            padding: 15px 20px;
            background: white;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          
          .logo {
            width: 50px;
            height: 50px;
            flex-shrink: 0;
          }
          
          .company-info {
            flex: 1;
            min-width: 0;
          }
          
          .company-name {
            font-size: 16px;
            font-weight: bold;
            color: black;
            margin-bottom: 3px;
            line-height: 1.2;
          }
          
          .company-type {
            font-size: 11px;
            color: #059669;
            margin-bottom: 8px;
            font-weight: 500;
          }
          
          .company-address {
            font-size: 9px;
            color: #374151;
            margin-bottom: 2px;
            line-height: 1.3;
          }
          
          .company-contact {
            font-size: 9px;
            color: #374151;
            line-height: 1.3;
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
            color: black;
            background: white;
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
                <!-- Yellow background triangle -->
                <polygon points="50,5 95,85 5,85" fill="#fbbf24"/>
                <!-- Red triangle -->
                <polygon points="50,15 85,75 15,75" fill="#dc2626"/>
                <!-- Tree trunk -->
                <rect x="47" y="60" width="6" height="15" fill="white"/>
                <!-- Tree leaves - layered curves -->
                <path d="M25 65 Q50 50 75 65" stroke="white" stroke-width="2" fill="none"/>
                <path d="M25 65 Q35 55 50 60 Q65 55 75 65" fill="#22c55e"/>
                <path d="M30 60 Q50 45 70 60" stroke="white" stroke-width="2" fill="none"/>
                <path d="M30 60 Q40 50 50 55 Q60 50 70 60" fill="#22c55e"/>
                <path d="M35 55 Q50 40 65 55" stroke="white" stroke-width="2" fill="none"/>
                <path d="M35 55 Q45 45 50 50 Q55 45 65 55" fill="#22c55e"/>
                <path d="M40 50 Q50 35 60 50" stroke="white" stroke-width="2" fill="none"/>
                <path d="M40 50 Q47 40 50 45 Q53 40 60 50" fill="#22c55e"/>
              </svg>
            </div>
            <div class="company-info">
              <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
              <div class="company-type">(GENERAL SUPPLIERS & CONTRACTORS)</div>
              <div class="company-address">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</div>
              <div class="company-contact">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</div>
            </div>
          </div>
          
          <div class="content">
            <div class="title">KWITANSI</div>
            
            <div class="receipt-number">
              <span class="field-label">NO. </span>
              <span class="field-value">${formData.nomorKwitansi}</span>
            </div>
            
            <div class="recipient-info">
              <span class="field-label">Telah terima dari </span>
              <span class="field-value">${formData.namaPembayar}</span>
            </div>
            
            <div class="amount-words">
              <span class="field-label">Uang sejumlah </span>
              <span class="field-value">#${getAmountInWords()}</span>
            </div>
            
            <div class="payment-purpose">
              <span class="field-label">Untuk Pembayaran: </span>
              <span>${formData.untukPembayaran}</span>
            </div>
            
            <div class="bank-details">
              <span class="field-label">${formData.transferMethod} Bank ${formData.bankName}_Nomor Rekening : </span>
              <span>${formData.nomorRekening} A/n ${formData.namaRekening}</span>
            </div>
            
            <div class="bottom-section">
              <div class="amount-box">
                Rp. ${formatCurrency(formData.jumlahUang)}
              </div>
              
              <div class="signature-section">
                <div class="place-date">${formData.tempat}, ${formData.tanggalKwitansi}</div>
                <div class="signature-line"></div>
                <div class="signature-name">${formData.namaRekening}</div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Receipt className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Generator Kwitansi</h1>
          <p className="text-gray-600">Buat kwitansi profesional dengan format Indonesia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Kwitansi
            </CardTitle>
            <CardDescription>
              Isi data untuk membuat kwitansi
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
                      Examples: &quot;Di Transfer ke rekening&quot;, &quot;Dibayar melalui transfer&quot;, &quot;Dikirim ke rekening&quot;, &quot;Disetor ke&quot;
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bankName" className="text-xs">Nama Bank</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName || "BRI"}
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

            <div className="flex gap-2 pt-4">
              <Button onClick={previewKwitansi} className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Preview Modal
              </Button>
              <Button onClick={openFullScreenPreview} className="flex-1" variant="outline">
                <Maximize className="h-4 w-4 mr-2" />
                Full Screen
              </Button>
              <Button onClick={generateKwitansi} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Kwitansi
            </CardTitle>
            <CardDescription>
              Tampilan kwitansi yang akan di-generate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-gray-200 rounded-lg bg-white" style={{ aspectRatio: '1.414', maxHeight: '600px', overflow: 'auto' }}>
              {/* Company Header */}
              <div className="p-6 border-b-2 border-black">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-600 rounded-full"></div>
                  </div>
                  
                  {/* Company Info */}
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-black mb-1">PT. GLOBAL LESTARI ALAM</h1>
                    <p className="text-sm text-green-600 mb-2">(GENERAL SUPPLIERS & CONTRACTORS)</p>
                    <p className="text-xs text-gray-700 mb-1">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</p>
                    <p className="text-xs text-gray-700">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</p>
                  </div>
                </div>
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
                  <span className="text-sm underline px-2">{formData.namaPembayar}</span>
                </div>

                {/* Amount in Words */}
                <div className="mb-4">
                  <span className="text-sm">Uang sejumlah </span>
                  <span className="text-sm underline px-2">#{getAmountInWords()}</span>
                </div>

                {/* Payment Purpose */}
                <div className="mb-4">
                  <span className="text-sm">Untuk Pembayaran: </span>
                  <span className="text-sm">{formData.untukPembayaran}</span>
                </div>

                {/* Bank Transfer Details */}
                <div className="mb-6">
                  <span className="text-sm">Di Transfer ke rekening Bank BRI<br />
                  Nomor Rekening : 0058-0100-4963-562<br />
                  A/n AZHAR LATIF</span>
                </div>

                {/* Amount Box and Signature */}
                <div className="flex justify-between items-end">
                  {/* Amount Box */}
                  <div className="border-4 border-black p-3">
                    <span className="font-bold text-lg">Rp. {formatCurrency(formData.jumlahUang)}</span>
                  </div>

                  {/* Place, Date, and Signature */}
                  <div className="text-right">
                    <p className="text-sm mb-2">{formData.tempat}, {formData.tanggalKwitansi}</p>
                    <div className="border-b border-black w-32 mb-1"></div>
                    <p className="text-sm font-semibold">{formData.namaRekening}</p>
                  </div>
                </div>
              </div>
            </div>
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
                <div className="w-12 h-12 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Yellow background triangle */}
                    <polygon points="50,5 95,85 5,85" fill="#fbbf24"/>
                    {/* Red triangle */}
                    <polygon points="50,15 85,75 15,75" fill="#dc2626"/>
                    {/* Tree trunk */}
                    <rect x="47" y="60" width="6" height="15" fill="white"/>
                    {/* Tree leaves - layered curves */}
                    <path d="M25 65 Q50 50 75 65" stroke="white" strokeWidth="2" fill="none"/>
                    <path d="M25 65 Q35 55 50 60 Q65 55 75 65" fill="#22c55e"/>
                    <path d="M30 60 Q50 45 70 60" stroke="white" strokeWidth="2" fill="none"/>
                    <path d="M30 60 Q40 50 50 55 Q60 50 70 60" fill="#22c55e"/>
                    <path d="M35 55 Q50 40 65 55" stroke="white" strokeWidth="2" fill="none"/>
                    <path d="M35 55 Q45 45 50 50 Q55 45 65 55" fill="#22c55e"/>
                    <path d="M40 50 Q50 35 60 50" stroke="white" strokeWidth="2" fill="none"/>
                    <path d="M40 50 Q47 40 50 45 Q53 40 60 50" fill="#22c55e"/>
                  </svg>
                </div>
                
                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold mb-1" style={{ color: '#d13237' }}>PT. GLOBAL LESTARI ALAM</h1>
                  <p className="text-xs mb-2" style={{ color: '#398e63' }}>(GENERAL SUPPLIERS & CONTRACTORS)</p>
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

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">Format Profesional</h3>
            </div>
            <p className="text-sm text-gray-600">
              Kwitansi dengan format standar Indonesia yang profesional dan lengkap
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold">Export PDF</h3>
            </div>
            <p className="text-sm text-gray-600">
              Generate kwitansi langsung ke format PDF yang siap dicetak
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">Preview Real-time</h3>
            </div>
            <p className="text-sm text-gray-600">
              Lihat preview kwitansi secara real-time sebelum di-generate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
