"use client"

import { useState, useEffect } from "react"
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

  const [showBankDetails, setShowBankDetails] = useState(false)
  
  // Load auto-kwitansi data from localStorage if available
  useEffect(() => {
    const autoKwitansiData = localStorage.getItem('autoKwitansiData')
    if (autoKwitansiData) {
      try {
        const data = JSON.parse(autoKwitansiData)
        setFormData(prev => ({
          ...prev,
          ...data
        }))
        
        // Clear the data from localStorage after loading
        localStorage.removeItem('autoKwitansiData')
        
        toast({
          title: "Data Kwitansi Dimuat",
          description: "Data kwitansi dari payroll telah dimuat otomatis"
        })
      } catch (error) {
        console.error('Error parsing auto kwitansi data:', error)
      }
    }
  }, [])
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
    transferMethod: "Di Transfer ke rekening",
    signatureName: "ATIKA DEWI SURYANI",
    signaturePosition: "Accounting",
    materai: ""
  })

  const [headerImage, setHeaderImage] = useState<string | null>(null)
  const [headerImageName, setHeaderImageName] = useState<string>("")
  const [transferProofs, setTransferProofs] = useState<Array<{ file: File; keterangan: string; title: string }>>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleHeaderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setHeaderImage(e.target?.result as string)
        setHeaderImageName(file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeHeader = () => {
    setHeaderImage(null)
    setHeaderImageName("")
  }

  const handleTransferProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp']
      return validTypes.includes(file.type)
    })
    
    if (transferProofs.length + validFiles.length > 10) {
      toast({
        title: "Error",
        description: "Maksimal 10 file yang dapat diupload",
        variant: "destructive"
      })
      return
    }
    
    const newTransferProofs = [...transferProofs, ...validFiles.map(file => ({ file, keterangan: '', title: '' }))]
    setTransferProofs(newTransferProofs)
    
    // Convert files to base64 and save to localStorage
    const saveFilesToStorage = async () => {
      const base64Files: Array<{ base64: string; keterangan: string; title: string }> = []
      for (const proof of newTransferProofs) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(proof.file)
        })
        base64Files.push({ base64, keterangan: proof.keterangan, title: proof.title })
      }
      localStorage.setItem('kwitansiTransferProofs', JSON.stringify(base64Files))
      localStorage.setItem('kwitansiHeaderImage', headerImage || '')
    }
    
    saveFilesToStorage()
  }

  const removeTransferProof = (index: number) => {
    const newTransferProofs = transferProofs.filter((_, i) => i !== index)
    setTransferProofs(newTransferProofs)
    
    // Update localStorage
    const saveFilesToStorage = async () => {
      const base64Files: Array<{ base64: string; keterangan: string }> = []
      for (const proof of newTransferProofs) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(proof.file)
        })
        base64Files.push({ base64, keterangan: proof.keterangan })
      }
      localStorage.setItem('kwitansiTransferProofs', JSON.stringify(base64Files))
    }
    
    saveFilesToStorage()
  }

  const formatCurrency = (amount: string) => {
    const num = parseInt(amount.replace(/\D/g, ''))
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const getAmountInWords = () => {
    const num = parseInt(formData.jumlahUang.replace(/\D/g, ''))
    return numberToWords(num) + ' rupiah'
  }

  const getGeneratedFilename = () => {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const cleanNomor = formData.nomorKwitansi.replace(/[^a-zA-Z0-9]/g, '_')
    const cleanPenerima = formData.namaPenerima.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')
    const amount = formatCurrency(formData.jumlahUang).replace(/[^a-zA-Z0-9]/g, '_')
    return `Kwitansi_${cleanNomor}_${cleanPenerima}_Rp${amount}_${date}.pdf`
  }

  const generateKwitansi = async () => {
    // Generate filename based on form data
    const generateFilename = () => {
      const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const cleanNomor = formData.nomorKwitansi.replace(/[^a-zA-Z0-9]/g, '_')
      const cleanPenerima = formData.namaPenerima.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')
      const amount = formatCurrency(formData.jumlahUang).replace(/[^a-zA-Z0-9]/g, '_')
      return `Kwitansi_${cleanNomor}_${cleanPenerima}_Rp${amount}_${date}.pdf`
    }

    const filename = generateFilename()
    
    // Convert transfer proofs to base64 for PDF
    const base64Files: Array<{ base64: string; keterangan: string; title: string }> = []
    for (const proof of transferProofs) {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(proof.file)
      })
      base64Files.push({ base64, keterangan: proof.keterangan, title: proof.title })
    }
    
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
            font-size: 13px;
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
            font-size: 13px;
            color: #000;
            margin: 0 0 3px 0;
            line-height: 1.4;
          }
          .company-contact {
            font-size: 13px;
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
            font-size: 13px;
            color: #374151;
          }
          .field-value {
            font-size: 13px;
            text-decoration: underline;
            padding: 0 3px;
            color: black;
            font-weight: 500;
          }
          .amount-words-value {
            font-size: 13px;
            text-decoration: underline;
            padding: 0 3px;
            color: black;
            font-weight: bold;
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
            font-size: 13px;
            margin-bottom: 20px;
            color: #374151;
          }
          .materai-section {
            font-size: 12px;
            margin-bottom: 60px;
            color: #374151;
            min-height: 50px;
          }
          .signature-name {
            font-size: 13px;
            font-weight: bold;
            color: black;
          }
          .signature-title {
            font-size: 12px;
            color: #374151;
            margin-top: 2px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .header-image { 
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 20px;
            }
            .header-image img { 
              width: 100%; 
              height: 103px; 
              object-fit: cover;
              display: block;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header Image Section -->
        ${headerImage ? `
        <div class="header-image" style="width: 100%; height: 103px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; page-break-inside: avoid;">
          <img src="${headerImage}" alt="Custom Header" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        ` : ''}
        
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
            <span class="amount-words-value"># ${getAmountInWords()}</span>
          </div>
          
          <div class="payment-purpose">
            <span class="field-label">Untuk Pembayaran: </span>
            <span>${formData.untukPembayaran}</span>
          </div>
          
          <div class="bank-details">
            <span class="field-label">${formData.transferMethod} Bank ${formData.bankName}_Nomor Rekening : </span>
            <span class="field-value">${formData.nomorRekening} A/n ${formData.namaRekening}</span>
          </div>
          
          <div class="recipient-name">
            <span class="field-value">${formData.namaPenerima}</span>
          </div>
          
          <div class="bottom-section">
            <div class="amount-box">
              Rp. ${formatCurrency(formData.jumlahUang)}
            </div>
            
                          <div class="signature-section">
                <div class="place-date">${formData.tempat}, ${formData.tanggalKwitansi}</div>
                ${formData.materai ? `<div class="materai-section">Materai: ${formData.materai}</div>` : '<div class="materai-section"></div>'}
                <div class="signature-line"></div>
                <div class="signature-name">${formData.signatureName}</div>
                <div class="signature-title">${formData.signaturePosition}</div>
              </div>
          </div>
        </div>
        
        ${base64Files.length > 0 ? `
          <div style="margin-top: 30px; page-break-before: always;">
            <div style="padding: 0 20px;">
              <div style="text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; color: black;">
                BUKTI TRANSFER & NOTA
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                ${base64Files.map((proof, index) => `
                  <div style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 10px; color: #333;">
                      ${proof.title || `Bukti Transfer ${index + 1}`}
                    </div>
                    <img src="${proof.base64}" alt="Bukti Transfer ${index + 1}" style="max-width: 100%; height: auto; max-height: 250px; object-fit: contain;" />
                    ${proof.keterangan ? `<div style="margin-top: 10px; font-size: 12px; color: #666;">${proof.keterangan}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Set the document title for better file naming
    printWindow.document.title = filename
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print()
      printWindow.close()
    }

    toast({
      title: "Kwitansi berhasil dibuat",
      description: `Kwitansi telah dibuat dengan nama: ${filename}`
    })
  }



  const openFullScreenPreview = async () => {
    // Generate filename based on form data
    const generateFilename = () => {
      const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const cleanNomor = formData.nomorKwitansi.replace(/[^a-zA-Z0-9]/g, '_')
      const cleanPenerima = formData.namaPenerima.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')
      const amount = formatCurrency(formData.jumlahUang).replace(/[^a-zA-Z0-9]/g, '_')
      return `Kwitansi_${cleanNomor}_${cleanPenerima}_Rp${amount}_${date}`
    }

    const filename = generateFilename()
    
    // Convert transfer proofs to base64 for preview
    const base64Files: Array<{ base64: string; keterangan: string; title: string }> = []
    for (const proof of transferProofs) {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(proof.file)
      })
      base64Files.push({ base64, keterangan: proof.keterangan, title: proof.title })
    }
    
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
            font-size: 13px;
            color: #374151;
          }
          
          .field-value {
            font-size: 13px;
            text-decoration: underline;
            padding: 0 3px;
            color: black;
            font-weight: 500;
          }
          
          .amount-words-value {
            font-size: 13px;
            text-decoration: underline;
            padding: 0 3px;
            color: black;
            font-weight: bold;
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
            min-width: 150px;
            text-align: center;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
            color: black;
            background: white;
          }
          
          .signature-section {
            text-align: center;
            min-width: 180px;
          }
          
          .place-date {
            font-size: 13px;
            margin-bottom: 20px;
            color: #374151;
          }
          
          .materai-section {
            font-size: 12px;
            margin-bottom: 60px;
            color: #374151;
            min-height: 50px;
          }
          
          .signature-name {
            font-size: 13px;
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
            .header-image { 
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 20px;
            }
            .header-image img { 
              width: 100%; 
              height: 103px; 
              object-fit: cover;
              display: block;
            }
          }
        </style>
      </head>
      <body>
        <div class="controls">
          <button class="btn btn-close" onclick="window.close()">✕ Tutup</button>
          <button class="btn btn-print" onclick="window.print()">🖨️ Cetak</button>
        </div>
        
        <div class="kwitansi-container">
          ${headerImage ? `
          <!-- Header Image Section -->
          <div class="header-image" style="width: 100%; height: 103px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; page-break-inside: avoid;">
            <img src="${headerImage}" alt="Custom Header" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
          
          <!-- Header separator lines -->
          <div class="header-separator">
            <hr class="separator-line">
            <hr class="separator-line">
          </div>
          ` : ''}
          
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
              <span class="amount-words-value"># ${getAmountInWords()}</span>
            </div>
            
            <div class="payment-purpose">
              <span class="field-label">Untuk Pembayaran: </span>
              <span>${formData.untukPembayaran}</span>
            </div>
            
            <div class="bank-details">
              <span class="field-label">${formData.transferMethod} Bank ${formData.bankName}_Nomor Rekening : </span>
              <span class="field-value">${formData.nomorRekening} A/n ${formData.namaRekening}</span>
            </div>
            
            <div class="recipient-name">
              <span class="field-value">${formData.namaPenerima}</span>
            </div>
            
            <div class="bottom-section">
              <div class="amount-box">
                Rp. ${formatCurrency(formData.jumlahUang)}
              </div>
              
              <div class="signature-section">
                <div class="place-date">${formData.tempat}, ${formData.tanggalKwitansi}</div>
                ${formData.materai ? `<div class="materai-section">Materai: ${formData.materai}</div>` : '<div class="materai-section"></div>'}
                <div class="signature-line"></div>
                <div class="signature-name">${formData.signatureName}</div>
                <div class="signature-title">${formData.signaturePosition}</div>
              </div>
            </div>
          </div>
        </div>
        
        ${base64Files.length > 0 ? `
          <div style="margin-top: 30px; page-break-before: always;">
            <div style="padding: 0 20px;">
              <div style="text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; color: black;">
                BUKTI TRANSFER & NOTA
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                ${base64Files.map((proof, index) => `
                  <div style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 10px; color: #333;">
                      ${proof.title || `Bukti Transfer ${index + 1}`}
                    </div>
                    <img src="${proof.base64}" alt="Bukti Transfer ${index + 1}" style="max-width: 100%; height: auto; max-height: 250px; object-fit: contain;" />
                    ${proof.keterangan ? `<div style="margin-top: 10px; font-size: 12px; color: #666;">${proof.keterangan}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `

    previewWindow.document.write(htmlContent)
    previewWindow.document.close()
    
    // Set the document title for better file naming
    previewWindow.document.title = filename
    
    toast({
      title: "Pratinjau Dibuka",
      description: `Pratinjau kwitansi telah dibuka di tab baru dengan nama: ${filename}`
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <a href="/business-tools" className="hover:text-primary">Alat Bisnis</a>
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
            {/* Header Upload Card */}
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  Header Generator
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Unggah gambar header untuk kwitansi Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!headerImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">Unggah Gambar Header</p>
                        <p className="text-sm text-gray-500">PNG, JPG, SVG maksimal 2MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeaderUpload}
                        className="hidden"
                        id="header-upload"
                      />
                      <label
                        htmlFor="header-upload"
                        className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Pilih File
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Pratinjau Header:</span>
                        <Button
                          onClick={removeHeader}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      </div>
                      <div className="w-full bg-white border rounded overflow-hidden" style={{ height: '103px' }}>
                        <img
                          src={headerImage}
                          alt="Header Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{headerImageName}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <Label htmlFor="namaPenerima">Nama Penerima</Label>
                  <Input
                    id="namaPenerima"
                    value={formData.namaPenerima}
                    onChange={(e) => handleInputChange('namaPenerima', e.target.value)}
                    placeholder="Azhar Latif"
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

                {/* Bank Transfer Details Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold text-blue-800">Bank Transfer Details</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBankDetails(!showBankDetails)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {showBankDetails ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
                    </Button>
                  </div>
                  
                  {showBankDetails && (
                    <Card className="border-2 border-blue-200 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
                          <CreditCard className="h-4 w-4" />
                          Informasi Transfer Bank
                        </CardTitle>
                        <CardDescription className="text-blue-600 text-xs">
                          Format: "[METODE TRANSFER] Bank [BANK]_Nomor Rekening : [NOMOR] A/n [NAMA]"
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="transferMethod" className="text-sm font-medium">Metode Transfer / Kata-kata</Label>
                          <Input
                            id="transferMethod"
                            value={formData.transferMethod}
                            onChange={(e) => handleInputChange('transferMethod', e.target.value)}
                            placeholder="Di Transfer ke rekening"
                            className="mt-1"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Contoh: "Di Transfer ke rekening", "Dibayar melalui transfer", "Dikirim ke rekening", "Disetor ke"
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="bankName" className="text-sm font-medium">Nama Bank</Label>
                          <Input
                            id="bankName"
                            value={formData.bankName}
                            onChange={(e) => handleInputChange('bankName', e.target.value)}
                            placeholder="BRI"
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nomorRekening" className="text-sm font-medium">Nomor Rekening</Label>
                            <Input
                              id="nomorRekening"
                              value={formData.nomorRekening}
                              onChange={(e) => handleInputChange('nomorRekening', e.target.value)}
                              placeholder="0058-0100-4963-562"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="namaRekening" className="text-sm font-medium">A/n (Nama Pemilik)</Label>
                            <Input
                              id="namaRekening"
                              value={formData.namaRekening}
                              onChange={(e) => handleInputChange('namaRekening', e.target.value)}
                              placeholder="AZHAR LATIF"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        {/* Preview of how it will appear */}
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <Label className="text-xs font-medium text-gray-700 mb-2">Pratinjau:</Label>
                          <div className="text-sm text-gray-800">
                            {formData.transferMethod || 'Di Transfer ke rekening'} Bank {formData.bankName || 'BRI'}_Nomor Rekening : {formData.nomorRekening || '0058-0100-4963-562'} A/n {formData.namaRekening || 'AZHAR LATIF'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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

                 {/* Signature Information */}
                 <div className="space-y-2">
                   <Label className="text-sm font-medium">Informasi Tanda Tangan</Label>
                   <div className="p-3 bg-gray-50 rounded-lg border">
                     <div className="text-xs text-gray-600 mb-2">
                       Isi detail tanda tangan yang akan muncul di bagian bawah kwitansi
                     </div>
                     <div className="grid grid-cols-1 gap-2">
                       <div>
                         <Label htmlFor="signatureName" className="text-xs">Nama Tanda Tangan</Label>
                         <Input
                           id="signatureName"
                           value={formData.signatureName}
                           onChange={(e) => handleInputChange('signatureName', e.target.value)}
                           placeholder="ATIKA DEWI SURYANI"
                           className="h-8 text-xs"
                         />
                         <div className="text-xs text-gray-500 mt-1">
                           Saat ini: Atika Dewi Suryani
                         </div>
                       </div>
                       <div>
                         <Label htmlFor="signaturePosition" className="text-xs">Jabatan Orang</Label>
                         <Input
                           id="signaturePosition"
                           value={formData.signaturePosition}
                           onChange={(e) => handleInputChange('signaturePosition', e.target.value)}
                           placeholder="Accounting"
                           className="h-8 text-xs"
                         />
                         <div className="text-xs text-gray-500 mt-1">
                           Saat ini: Accounting
                         </div>
                       </div>
                       <div>
                         <Label htmlFor="materai" className="text-xs">Materai (Opsional)</Label>
                         <Input
                           id="materai"
                           value={formData.materai}
                           onChange={(e) => handleInputChange('materai', e.target.value)}
                           placeholder="Rp 10.000"
                           className="h-8 text-xs"
                         />
                         <div className="text-xs text-gray-500 mt-1">
                           Kosongkan jika tidak diperlukan materai
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Transfer Proof Section */}
                 <div className="space-y-2">
                   <Label className="text-sm font-medium">Bukti Transfer & Nota</Label>
                   <div className="p-3 bg-gray-50 rounded-lg border">
                     <div className="text-xs text-gray-600 mb-2">
                       Unggah bukti transfer dan nota (maksimal 10 file)
                     </div>
                     <div className="space-y-3">
                       <div>
                         <Label htmlFor="transfer-proofs" className="text-xs">Unggah Bukti Transfer/Nota</Label>
                         <Input
                           id="transfer-proofs"
                           type="file"
                           accept="image/*"
                           multiple
                           onChange={handleTransferProofUpload}
                           className="h-8 text-xs"
                         />
                         <div className="text-xs text-gray-500 mt-1">
                           Format yang didukung: JPG, JPEG, PNG, SVG, GIF, WEBP (maksimal 10 file)
                         </div>
                       </div>
                       
                       {transferProofs.length > 0 && (
                         <div className="space-y-2">
                           <Label className="text-xs">File yang diunggah ({transferProofs.length}/10):</Label>
                           <div className="grid grid-cols-2 gap-2">
                             {transferProofs.map((proof, index) => (
                               <div key={index} className="relative border rounded p-2">
                                 <img
                                   src={URL.createObjectURL(proof.file)}
                                   alt={`Bukti ${index + 1}`}
                                   className="w-full h-16 object-cover rounded"
                                 />
                                 <button
                                   onClick={() => removeTransferProof(index)}
                                   className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                 >
                                   ×
                                 </button>
                                 <p className="text-xs text-gray-600 mt-1 truncate">{proof.file.name}</p>
                                 <Input
                                   placeholder="Judul Bukti Transfer"
                                   value={proof.title}
                                   onChange={(e) => {
                                     const newProofs = [...transferProofs]
                                     newProofs[index].title = e.target.value
                                     setTransferProofs(newProofs)
                                   }}
                                   className="mt-1 text-xs h-6"
                                 />
                                 <Input
                                   placeholder="Keterangan (opsional)"
                                   value={proof.keterangan}
                                   onChange={(e) => {
                                     const newProofs = [...transferProofs]
                                     newProofs[index].keterangan = e.target.value
                                     setTransferProofs(newProofs)
                                   }}
                                   className="mt-1 text-xs h-6"
                                 />
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
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
                  Tampilan kwitansi yang akan dibuat
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border-2 border-gray-200 rounded-lg bg-white" style={{ aspectRatio: '1.414', maxHeight: '600px', overflow: 'auto' }}>
                  {/* Header Image Section */}
                  {headerImage && (
                    <>
                      <div className="w-full h-20 bg-gray-50 border-b border-gray-200" style={{ height: '103px' }}>
                        <img 
                          src={headerImage} 
                          alt="Custom Header" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      {/* Header separator lines */}
                      <div className="px-6">
                        <hr className="border-t border-black mb-1" />
                        <hr className="border-t border-black" />
                      </div>
                    </>
                  )}

                  {/* Kwitansi Content */}
                  <div className="p-6">
                    {/* Title */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold underline">KWITANSI</h2>
                    </div>

                    {/* Receipt Number */}
                    <div className="mb-4">
                      <span className="text-base">NO. </span>
                      <span className="text-base underline px-2">{formData.nomorKwitansi}</span>
                    </div>

                    {/* Recipient Info */}
                    <div className="mb-4">
                      <span className="text-base">Telah terima dari </span>
                      <span className="text-base underline px-2">PT. GLOBAL LESTARI ALAM</span>
                    </div>

                    {/* Amount in Words */}
                    <div className="mb-4">
                      <span className="text-base">Uang sejumlah </span>
                      <span className="text-base underline px-2 font-bold text-black">#{getAmountInWords()}</span>
                    </div>

                    {/* Payment Purpose */}
                    <div className="mb-4">
                      <span className="text-base">Untuk Pembayaran: </span>
                      <span className="text-base">{formData.untukPembayaran}</span>
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="mb-4">
                      <span className="text-base">{formData.transferMethod} Bank {formData.bankName}_Nomor Rekening : </span>
                      <span className="text-base underline px-2">{formData.nomorRekening} A/n {formData.namaRekening}</span>
                    </div>

                    {/* Recipient Name */}
                    <div className="mb-6">
                      <span className="text-base font-semibold">{formData.namaPenerima}</span>
                    </div>

                    {/* Amount Box and Signature */}
                    <div className="flex justify-between items-end">
                      {/* Amount Box */}
                      <div className="border-4 border-black p-3 bg-white text-black">
                        <span className="font-bold text-lg">Rp. {formatCurrency(formData.jumlahUang)}</span>
                      </div>

                      {/* Place, Date, and Signature */}
                                             <div className="text-right">
                         <p className="text-sm mb-2">{formData.tempat}, {formData.tanggalKwitansi}</p>
                         {formData.materai && <p className="text-xs mb-6">Materai: {formData.materai}</p>}
                         {!formData.materai && <div className="mb-6"></div>}
                         <div className="border-b border-black w-32 mb-1"></div>
                         <p className="text-sm font-semibold">{formData.signatureName}</p>
                         <p className="text-xs">{formData.signaturePosition}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filename Preview */}
        <Card className="mt-8 border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
            <CardTitle className="flex items-center gap-3 text-lg text-green-800">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              Pratinjau Nama File
            </CardTitle>
            <CardDescription className="text-green-600">
              Ini adalah nama file yang akan digunakan saat Anda mengunduh kwitansi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <code className="text-sm text-green-800 font-mono break-all">
                {getGeneratedFilename()}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          {transferProofs.length > 0 && (
            <Button 
              onClick={() => window.open('/kwitansi/proofs', '_blank')} 
              variant="outline" 
              className="flex-1 h-12"
            >
              <FileText className="h-4 w-4 mr-2" />
              Lihat Bukti Transfer
            </Button>
          )}
          <Button onClick={() => generateKwitansi()} className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Download className="h-4 w-4 mr-2" />
            Buat PDF
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


      </div>
    </div>
  )
}
