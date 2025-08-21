"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Receipt, Download, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KwitansiData {
  receiptNumber: string
  receivedFrom: string
  amountInWords: string
  paymentFor: string
  totalAmount: number
  location: string
  date: string
  receiverName: string
  bankDetails?: {
    bankName: string
    accountNumber: string
    accountName: string
  }
}

export default function KwitansiGenerator() {
  const [kwitansi, setKwitansi] = useState<KwitansiData>({
    receiptNumber: "",
    receivedFrom: "",
    amountInWords: "",
    paymentFor: "",
    totalAmount: 0,
    location: "Sawahlunto",
    date: "",
    receiverName: "Azhar Latif",
    bankDetails: {
      bankName: "Bank BRI",
      accountNumber: "0058-0100-4963-562",
      accountName: "AZHAR LATIF"
    }
  })
  const { toast } = useToast()

  // Set current date on mount
  useEffect(() => {
    setKwitansi(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0]
    }))
  }, [])

  // Convert number to Indonesian words
  const numberToWords = (num: number): string => {
    if (num === 0) return "nol"
    
    const ones = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"]
    const teens = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas"]
    const tens = ["", "", "dua puluh", "tiga puluh", "empat puluh", "lima puluh", "enam puluh", "tujuh puluh", "delapan puluh", "sembilan puluh"]
    const scales = ["", "ribu", "juta", "miliar", "triliun"]
    
    const convertHundreds = (n: number): string => {
      let result = ""
      
      if (n >= 100) {
        if (Math.floor(n / 100) === 1) {
          result += "seratus "
        } else {
          result += ones[Math.floor(n / 100)] + " ratus "
        }
        n %= 100
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " "
        n %= 10
      } else if (n >= 10) {
        result += teens[n - 10] + " "
        return result.trim()
      }
      
      if (n > 0) {
        result += ones[n] + " "
      }
      
      return result.trim()
    }
    
    const convertGroup = (n: number, scaleIndex: number): string => {
      if (n === 0) return ""
      
      let result = convertHundreds(n)
      if (scaleIndex > 0) {
        if (scaleIndex === 1 && n === 1) {
          result = "seribu"
        } else {
          result += " " + scales[scaleIndex]
        }
      }
      return result
    }
    
    const groups = []
    let scaleIndex = 0
    
    while (num > 0) {
      const group = num % 1000
      if (group !== 0) {
        groups.unshift(convertGroup(group, scaleIndex))
      }
      num = Math.floor(num / 1000)
      scaleIndex++
    }
    
    return groups.join(" ").trim()
  }

  // Update amount in words when total amount changes
  useEffect(() => {
    if (kwitansi.totalAmount > 0) {
      const words = numberToWords(kwitansi.totalAmount)
      setKwitansi(prev => ({
        ...prev,
        amountInWords: `#${words.charAt(0).toUpperCase() + words.slice(1)} rupiah`
      }))
    }
  }, [kwitansi.totalAmount])

  // Validate form
  const validateForm = () => {
    if (!kwitansi.receiptNumber.trim()) {
      toast({
        title: "Kesalahan Validasi",
        description: "Harap isi nomor kwitansi",
        variant: "destructive",
      })
      return false
    }

    if (!kwitansi.receivedFrom) {
      toast({
        title: "Kesalahan Validasi",
        description: "Harap isi field 'Telah terima dari'",
        variant: "destructive",
      })
      return false
    }

    if (!kwitansi.paymentFor) {
      toast({
        title: "Kesalahan Validasi",
        description: "Harap isi field 'Untuk Pembayaran'",
        variant: "destructive",
      })
      return false
    }

    if (kwitansi.totalAmount <= 0) {
      toast({
        title: "Kesalahan Validasi",
        description: "Harap masukkan jumlah yang valid",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Generate PDF (client-side implementation)
  const generatePDF = async () => {
    if (!validateForm()) return

    try {
      const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Kwitansi - ${kwitansi.receiptNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              color: #000;
              line-height: 1.4;
              font-size: 14px;
            }
            .kwitansi-container {
              border: 2px solid #000;
              padding: 20px;
              min-height: 500px;
              position: relative;
            }
            .kwitansi-title {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 8px;
              margin-bottom: 30px;
              text-decoration: underline;
            }
            .receipt-number {
              margin-bottom: 20px;
            }
            .receipt-line {
              margin: 15px 0;
              display: flex;
              align-items: baseline;
            }
            .receipt-line label {
              display: inline-block;
              width: 140px;
              margin-right: 10px;
            }
            .receipt-line .underline {
              border-bottom: 1px solid #000;
              flex: 1;
              min-height: 20px;
              padding-bottom: 2px;
            }
            .amount-box {
              border: 3px solid #000;
              padding: 10px;
              width: 150px;
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .date-signature {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            .signature-section {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              margin-top: 80px;
              margin-bottom: 5px;
            }
            .pdf-header {
              background: white;
              padding: 20px;
              border-bottom: 3px solid #000;
              margin-bottom: 20px;
            }
            .pdf-header-content {
              display: flex;
              align-items: flex-start;
              gap: 20px;
            }
            .pdf-logo {
              width: 80px;
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              background: #fbbf24;
              border-radius: 10px;
              padding: 8px;
            }
            .pdf-company-info {
              flex: 1;
            }
            .pdf-company-info h1 {
              margin: 0 0 5px 0;
              font-size: 28px;
              color: #dc2626;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .pdf-subtitle {
              margin: 0 0 15px 0;
              font-size: 14px;
              color: #16a34a;
              font-weight: 600;
            }
            .pdf-contact {
              font-size: 12px;
              color: #374151;
              line-height: 1.4;
            }
            .pdf-contact p {
              margin: 3px 0;
            }
          </style>
        </head>
        <body>
          <!-- Company Header -->
          <div class="pdf-header">
            <div class="pdf-header-content">
              <div class="pdf-logo">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="50,10 90,85 10,85" fill="#fbbf24"/>
                  <polygon points="50,20 75,70 25,70" fill="#dc2626"/>
                  <g stroke="#16a34a" stroke-width="2" fill="none">
                    <line x1="50" y1="70" x2="50" y2="35"/>
                    <path d="M45,45 Q35,40 30,35" stroke-width="1.5"/>
                    <path d="M45,50 Q30,45 25,40" stroke-width="1.5"/>
                    <path d="M45,55 Q28,50 22,45" stroke-width="1.5"/>
                    <path d="M45,60 Q25,55 18,50" stroke-width="1.5"/>
                    <path d="M55,45 Q65,40 70,35" stroke-width="1.5"/>
                    <path d="M55,50 Q70,45 75,40" stroke-width="1.5"/>
                    <path d="M55,55 Q72,50 78,45" stroke-width="1.5"/>
                    <path d="M55,60 Q75,55 82,50" stroke-width="1.5"/>
                  </g>
                </svg>
              </div>
              <div class="pdf-company-info">
                <h1>PT. GLOBAL LESTARI ALAM</h1>
                <p class="pdf-subtitle">(GENERAL SUPPLIERS & CONTRACTORS)</p>
                <div class="pdf-contact">
                  <p>Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah, Kec. Marpoyan Damai,</p>
                  <p>Kota Pekanbaru, 28282 Riau Indonesia</p>
                  <p>Telp. +62761 40288, Fax. +62761 35923, Email : gla.padang15@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="kwitansi-container">
            <div class="kwitansi-title">K W I T A N S I</div>
            
            <div class="receipt-number">
              NO. <span class="underline">${kwitansi.receiptNumber || "________"}</span>
            </div>
            
            <div class="receipt-line">
              <label>Telah terima dari</label>
              <span>:</span>
              <span class="underline">${kwitansi.receivedFrom}</span>
            </div>
            
            <div class="receipt-line">
              <label>Uang sejumlah</label>
              <span>:</span>
              <span class="underline">${kwitansi.amountInWords}</span>
            </div>
            
            <div class="receipt-line">
              <label>Untuk Pembayaran:</label>
              <span class="underline">${kwitansi.paymentFor}</span>
            </div>
            
            ${kwitansi.bankDetails ? `
            <div class="receipt-line">
              <label>Di Transfer ke rekening</label>
              <span class="underline">${kwitansi.bankDetails.bankName} Nomor Rekening : ${kwitansi.bankDetails.accountNumber} A/n ${kwitansi.bankDetails.accountName}</span>
            </div>
            ` : ''}
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 40px;">
              <div class="amount-box">
                Rp. ${kwitansi.totalAmount.toLocaleString('id-ID')}
              </div>
              
              <div class="date-signature">
                <div class="signature-section">
                  <div>${kwitansi.location}, ${new Date(kwitansi.date).toLocaleDateString('id-ID', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                  <div class="signature-line"></div>
                  <div>${kwitansi.receiverName}</div>
                </div>
              </div>
            </div>

          </div>
        </body>
        </html>
      `

      // Open the receipt in a new window for printing/saving as PDF
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(receiptContent)
        printWindow.document.close()
        printWindow.focus()
        
        // Trigger print dialog
        setTimeout(() => {
          printWindow.print()
        }, 500)

        toast({
          title: "Berhasil!",
          description: "Kwitansi berhasil dibuat! Gunakan fungsi cetak browser untuk menyimpan sebagai PDF.",
        })
      }
    } catch (error) {
      toast({
        title: "Kesalahan",
        description: "Gagal membuat PDF. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            {/* Company Logo and Info */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 w-full max-w-4xl">
              <div className="flex items-center justify-start gap-4 mb-4">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center shadow-md p-2 border-2 border-gray-200">
                  <img 
                    src="/gla-logo.svg" 
                    alt="PT Global Lestari Alam Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 via-red-500 to-green-600 rounded flex items-center justify-center text-white font-bold text-lg hidden">
                    GLA
                  </div>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-red-600 mb-1">
                    PT. GLOBAL LESTARI ALAM
                  </h2>
                  <p className="text-green-600 font-semibold text-sm">
                    (GENERAL SUPPLIERS & CONTRACTORS)
                  </p>
                </div>
              </div>
              <div className="text-left text-sm text-gray-700 space-y-1">
                <p>Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah, Kec. Marpoyan Damai,</p>
                <p>Kota Pekanbaru, 28282 Riau Indonesia</p>
                <p>Telp. +62761 40288, Fax. +62761 35923, Email : gla.padang15@gmail.com</p>
              </div>
            </div>
            
            {/* Title */}
            <div className="flex items-center justify-center gap-3">
              <Receipt className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Generator Kwitansi
              </h1>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Buat kwitansi profesional dalam format PDF dengan perhitungan otomatis dan desain modern
          </p>
        </div>

        {/* Kwitansi Form */}
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-2xl text-blue-800">
              <Receipt className="h-6 w-6" />
              Informasi Kwitansi
            </CardTitle>
            <CardDescription className="text-base">
              Isi detail kwitansi dalam format tradisional Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="receipt-number" className="text-lg font-semibold">Nomor Kwitansi *</Label>
                <Input
                  id="receipt-number"
                  value={kwitansi.receiptNumber}
                  onChange={(e) => setKwitansi(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder="Masukkan nomor kwitansi"
                  className="font-mono text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-lg font-semibold">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={kwitansi.date}
                  onChange={(e) => setKwitansi(prev => ({ ...prev, date: e.target.value }))}
                  className="text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="received-from" className="text-lg font-semibold">Telah terima dari *</Label>
              <Input
                id="received-from"
                value={kwitansi.receivedFrom}
                onChange={(e) => setKwitansi(prev => ({ ...prev, receivedFrom: e.target.value }))}
                placeholder="PT. GLOBAL LESTARI ALAM"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-amount" className="text-lg font-semibold">Uang sejumlah (IDR) *</Label>
              <Input
                id="total-amount"
                type="number"
                min="0"
                value={kwitansi.totalAmount}
                onChange={(e) => setKwitansi(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                placeholder="200000000"
                className="text-lg"
              />
              {kwitansi.amountInWords && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                  <span className="font-semibold">Terbilang:</span> {kwitansi.amountInWords}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-for" className="text-lg font-semibold">Untuk Pembayaran *</Label>
              <Input
                id="payment-for"
                value={kwitansi.paymentFor}
                onChange={(e) => setKwitansi(prev => ({ ...prev, paymentFor: e.target.value }))}
                placeholder="Pengembalian Uang Bapak Azhar Latif yang sudah terpakai untuk (Biaya Produksi Batubara berdasarkan Laporan Biaya Produksi Batubara Tahap 1) Bulan Juli 2025"
                className="text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-lg font-semibold">Lokasi</Label>
                <Input
                  id="location"
                  value={kwitansi.location}
                  onChange={(e) => setKwitansi(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Sawahlunto"
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiver-name" className="text-lg font-semibold">Nama Penerima</Label>
                <Input
                  id="receiver-name"
                  value={kwitansi.receiverName}
                  onChange={(e) => setKwitansi(prev => ({ ...prev, receiverName: e.target.value }))}
                  placeholder="Azhar Latif"
                  className="text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-2xl text-green-800">Detail Transfer Bank (Opsional)</CardTitle>
            <CardDescription className="text-base">
              Tambahkan informasi transfer bank jika diperlukan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="bank-name" className="text-lg font-semibold">Nama Bank</Label>
                <Input
                  id="bank-name"
                  value={kwitansi.bankDetails?.bankName || ""}
                  onChange={(e) => setKwitansi(prev => ({ 
                    ...prev, 
                    bankDetails: { ...prev.bankDetails!, bankName: e.target.value }
                  }))}
                  placeholder="Bank BRI"
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-number" className="text-lg font-semibold">Nomor Rekening</Label>
                <Input
                  id="account-number"
                  value={kwitansi.bankDetails?.accountNumber || ""}
                  onChange={(e) => setKwitansi(prev => ({ 
                    ...prev, 
                    bankDetails: { ...prev.bankDetails!, accountNumber: e.target.value }
                  }))}
                  placeholder="0058-0100-4963-562"
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-name" className="text-lg font-semibold">Nama Rekening</Label>
                <Input
                  id="account-name"
                  value={kwitansi.bankDetails?.accountName || ""}
                  onChange={(e) => setKwitansi(prev => ({ 
                    ...prev, 
                    bankDetails: { ...prev.bankDetails!, accountName: e.target.value }
                  }))}
                  placeholder="AZHAR LATIF"
                  className="text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amount Preview */}
        <Card className="border-2 border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-2xl text-indigo-800">
              <Calculator className="h-6 w-6" />
              Ringkasan Jumlah
            </CardTitle>
            <CardDescription className="text-base">
              Pratinjau jumlah dalam format yang berbeda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border-2 border-indigo-200">
                <div className="text-center">
                  <span className="text-sm text-gray-600">Jumlah (Angka)</span>
                  <div className="text-3xl font-bold font-mono text-indigo-800 border-4 border-indigo-800 p-4 mt-2 bg-white rounded">
                    Rp. {kwitansi.totalAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                <div className="text-center">
                  <span className="text-sm text-gray-600">Jumlah (Huruf)</span>
                  <div className="text-lg text-green-800 p-4 mt-2 bg-white rounded border min-h-[80px] flex items-center justify-center">
                    {kwitansi.amountInWords || "Masukkan jumlah untuk melihat terbilang"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate PDF Button */}
        <div className="text-center">
          <Button
            onClick={generatePDF}
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Download className="h-6 w-6 mr-3" />
            Buat PDF Kwitansi
          </Button>
        </div>
      </div>
    </div>
  )
}