'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Printer } from 'lucide-react'

export default function KwitansiProofsPage() {
  const [transferProofs, setTransferProofs] = useState<Array<{ base64: string; keterangan: string; title: string }>>([])
  const [headerImage, setHeaderImage] = useState<string>('')

  useEffect(() => {
    // Get data from localStorage or sessionStorage
    const storedProofs = localStorage.getItem('kwitansiTransferProofs')
    const storedHeader = localStorage.getItem('kwitansiHeaderImage')
    
    if (storedProofs) {
      const parsedProofs = JSON.parse(storedProofs)
      // Handle both old format (string[]) and new format (Array<{base64, keterangan, title}>)
      if (Array.isArray(parsedProofs) && parsedProofs.length > 0 && typeof parsedProofs[0] === 'string') {
        // Convert old format to new format
        setTransferProofs(parsedProofs.map(base64 => ({ base64, keterangan: '', title: '' })))
      } else {
        setTransferProofs(parsedProofs)
      }
    }
    if (storedHeader) {
      setHeaderImage(storedHeader)
    }
  }, [])

  const generateProofsPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukti Transfer Kwitansi</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .header-image { 
            width: 100%; 
            height: 103px; 
            background-color: #f9fafb; 
            border-bottom: 1px solid #e5e7eb; 
            margin-bottom: 20px; 
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .header-image img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            display: block;
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
            font-size: 24px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 25px;
            color: black;
          }
          .proofs-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
          }
          .proof-item {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
          }
          .proof-item img {
            max-width: 100%;
            height: auto;
            max-height: 250px;
            object-fit: contain;
          }
          .proof-number {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${headerImage ? `
        <div class="header-image">
          <img src="${headerImage}" alt="Header" />
        </div>
        ` : ''}
        
        <div class="header-separator">
          <hr class="separator-line">
          <hr class="separator-line">
        </div>
        
        <div class="content">
          <div class="title">BUKTI TRANSFER & NOTA</div>
          
          <div class="proofs-grid">
            ${transferProofs.map((proof, index) => `
              <div class="proof-item">
                <div class="proof-number">${proof.title || `Bukti Transfer ${index + 1}`}</div>
                <img src="${proof.base64}" alt="Bukti Transfer ${index + 1}" />
                ${proof.keterangan ? `<div style="margin-top: 10px; font-size: 12px; color: #666;">${proof.keterangan}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.document.title = 'Bukti Transfer Kwitansi'
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
    }
  }

  if (transferProofs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Tidak Ada Bukti Transfer</h1>
            <p className="text-gray-600 mb-8">Belum ada bukti transfer yang diupload</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Kwitansi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Bukti Transfer & Nota</h1>
              <p className="text-gray-600">Dokumen bukti transfer dan nota kwitansi</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => window.history.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <Button onClick={generateProofsPDF} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Cetak PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Header Preview */}
        {headerImage && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Header Kwitansi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-32 border rounded-lg overflow-hidden">
                <img
                  src={headerImage}
                  alt="Header"
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer Proofs */}
        <Card>
          <CardHeader>
            <CardTitle>Bukti Transfer & Nota ({transferProofs.length} file)</CardTitle>
            <CardDescription>Dokumen bukti transfer dan nota yang telah diupload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transferProofs.map((proof, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">
                      {proof.title || `Bukti Transfer ${index + 1}`}
                    </h3>
                  </div>
                  <div className="border rounded overflow-hidden">
                    <img
                      src={proof.base64}
                      alt={`Bukti Transfer ${index + 1}`}
                      className="w-full h-64 object-contain bg-gray-50"
                    />
                  </div>
                  {proof.keterangan && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {proof.keterangan}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(proof.base64, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Lihat Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
