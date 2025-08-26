'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Receipt, Download, Save, Plus, Trash2, FileText, Eye, Image, Building2, Calendar, User, DollarSign, CreditCard, MapPin, Phone, Mail, X, Maximize } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function InvoicePage() {
  const { toast } = useToast()
  const [headerImage, setHeaderImage] = useState<string>('')
  const [headerImageName, setHeaderImageName] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001/2025')
  const [createdDate, setCreatedDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [applicantName, setApplicantName] = useState('PT. GLOBAL LESTARI ALAM')
  const [recipientName, setRecipientName] = useState('')
  const [notes, setNotes] = useState('')
  const [termsAndConditions, setTermsAndConditions] = useState('')
  const [transferProofs, setTransferProofs] = useState<Array<{ file: File; keterangan: string; title: string }>>([])
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [bankDetails, setBankDetails] = useState({
    bankName: 'BRI',
    accountNumber: '0058-0100-4963-562',
    accountHolder: 'AZHAR LATIF',
    transferMethod: 'Transfer ke rekening'
  })
  const [signatureInfo, setSignatureInfo] = useState({
    name: 'ATIKA DEWI SURYANI',
    position: 'Accounting',
    place: 'Sawahlunto',
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  })
  const [items, setItems] = useState([{ 
    id: '1', 
    description: '', 
    quantity: 1, 
    price: 0, 
    discount: 0, 
    tax: 0 
  }])

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
    setHeaderImage('')
    setHeaderImageName('')
  }

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      description: '', 
      quantity: 1, 
      price: 0, 
      discount: 0, 
      tax: 0 
    }])
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
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
      localStorage.setItem('invoiceTransferProofs', JSON.stringify(base64Files))
      localStorage.setItem('invoiceHeaderImage', headerImage)
    }
    
    saveFilesToStorage()
  }

  const removeTransferProof = (index: number) => {
    const newTransferProofs = transferProofs.filter((_, i) => i !== index)
    setTransferProofs(newTransferProofs)
    
    // Update localStorage
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
      localStorage.setItem('invoiceTransferProofs', JSON.stringify(base64Files))
    }
    
    saveFilesToStorage()
  }

  const calculateItemTotal = (item: any) => {
    const subtotal = item.quantity * item.price
    const discountAmount = (subtotal * item.discount) / 100
    const afterDiscount = subtotal - discountAmount
    const taxAmount = (afterDiscount * item.tax) / 100
    return afterDiscount + taxAmount
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const calculateTotalDiscount = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.price
      return sum + (subtotal * item.discount) / 100
    }, 0)
  }

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.price
      const discountAmount = (subtotal * item.discount) / 100
      const afterDiscount = subtotal - discountAmount
      return sum + (afterDiscount * item.tax) / 100
    }, 0)
  }

  const calculateGrandTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount() + calculateTotalTax()
  }

  const getGeneratedFilename = () => {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const cleanInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')
    const cleanRecipientName = recipientName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')
    return `Invoice_${cleanInvoiceNumber}_${cleanRecipientName}_${date}.pdf`
  }

  const generatePDF = async () => {
    const filename = getGeneratedFilename()
    
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
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
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
            height: 120px; 
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
          .invoice-info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .parties-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f0f8ff;
            border-radius: 5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            font-size: 11px;
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .total-amount {
            font-size: 16px;
            font-weight: bold;
            color: #000;
          }
          .notes-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #fff8dc;
            border-radius: 5px;
          }
          .terms-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 5px;
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
          <img src="${headerImage}" alt="Custom Header" />
        </div>
        ` : ''}
        
        <div class="header-separator">
          <hr class="separator-line">
          <hr class="separator-line">
        </div>
        
        <div class="content">
          <div class="title">FAKTUR</div>
          
          <div class="invoice-info">
            <div>
              <p><strong>Nomor Faktur:</strong> ${invoiceNumber || 'INV-001'}</p>
              <p><strong>Tanggal Dibuat:</strong> ${createdDate || new Date().toLocaleDateString()}</p>
              <p><strong>Tanggal Jatuh Tempo:</strong> ${dueDate || 'Tidak ditentukan'}</p>
            </div>
            <div>
              <p><strong>Pemohon:</strong> ${applicantName || 'Tidak ditentukan'}</p>
              <p><strong>Penerima:</strong> ${recipientName || 'Tidak ditentukan'}</p>
            </div>
          </div>
          
          ${items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                  <th>Discount (%)</th>
                  <th>Tax (%)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => {
                  const subtotal = item.quantity * item.price
                  const discountAmount = (subtotal * item.discount) / 100
                  const afterDiscount = subtotal - discountAmount
                  const taxAmount = (afterDiscount * item.tax) / 100
                  const total = afterDiscount + taxAmount
                  return `
                    <tr>
                      <td>${item.description || 'Item description'}</td>
                      <td>${item.quantity}</td>
                      <td>Rp ${item.price.toLocaleString()}</td>
                      <td>Rp ${subtotal.toLocaleString()}</td>
                      <td>${item.discount}%</td>
                      <td>${item.tax}%</td>
                      <td>Rp ${total.toLocaleString()}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <p><strong>Subtotal:</strong> Rp ${calculateSubtotal().toLocaleString()}</p>
              <p><strong>Total Discount:</strong> Rp ${calculateTotalDiscount().toLocaleString()}</p>
              <p><strong>Total Tax:</strong> Rp ${calculateTotalTax().toLocaleString()}</p>
              <div class="total-amount">
                <strong>Grand Total: Rp ${calculateGrandTotal().toLocaleString()}</strong>
              </div>
            </div>
          ` : `
            <div style="text-align: center; padding: 40px; color: #666;">
              <p>No items added to invoice</p>
            </div>
          `}
          
          ${notes ? `
            <div class="notes-section">
              <h4><strong>Notes:</strong></h4>
              <p>${notes}</p>
            </div>
          ` : ''}
          
          ${termsAndConditions ? `
            <div class="terms-section">
              <h4><strong>Terms and Conditions:</strong></h4>
              <p>${termsAndConditions}</p>
            </div>
          ` : ''}
        </div>
        
        ${base64Files.length > 0 ? `
          <div style="margin-top: 30px; page-break-before: always;">
            <div style="padding: 0 20px;">
              <div style="text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; color: black;">
                BUKTI TRANSFER & NOTA
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
                ${base64Files.map((proof, index) => `
                  <div style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 10px; color: #333;">
                      ${proof.title || `Bukti Transfer ${index + 1}`}
                    </div>
                    <img src="${proof.base64}" alt="Bukti Transfer ${index + 1}" style="max-width: 100%; height: auto; max-height: 300px; object-fit: contain;" />
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

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.document.title = filename
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
      
      toast({
        title: "Faktur berhasil dibuat",
        description: `Faktur telah di-generate dengan nama: ${filename}`
      })
    }
  }

  const openFullScreenPreview = async () => {
    const filename = getGeneratedFilename()
    
    const previewWindow = window.open('', '_blank')
    if (!previewWindow) {
      toast({
        title: "Error",
        description: "Pop-up diblokir. Silakan izinkan pop-up untuk situs ini.",
        variant: "destructive"
      })
      return
    }

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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Preview Invoice - ${filename}</title>
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
          
          .invoice-container {
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
            width: 100%;
            max-width: 800px;
            padding: 30px;
          }
          
          .header-image { 
            width: 100%; 
            height: 120px; 
            background-color: #f9fafb; 
            border-bottom: 1px solid #e5e7eb; 
            margin-bottom: 20px; 
            border-radius: 8px;
            overflow: hidden;
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
          
          .title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 25px;
            color: black;
          }
          
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
          }
          
          .parties-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 20px;
            background-color: #f0f8ff;
            border-radius: 8px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          
          .total-section {
            text-align: right;
            margin-top: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 8px;
          }
          
          .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #000;
          }
          
          .notes-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #fff8dc;
            border-radius: 8px;
          }
          
          .terms-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 8px;
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
            .invoice-container {
              box-shadow: none;
              border-radius: 0;
              max-width: none;
              width: 100%;
            }
            .header-image { 
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="controls">
          <button class="btn btn-close" onclick="window.close()">✕ Tutup</button>
          <button class="btn btn-print" onclick="window.print()">🖨️ Print</button>
        </div>
        
        <div class="invoice-container">
          ${headerImage ? `
          <div class="header-image">
            <img src="${headerImage}" alt="Custom Header" />
          </div>
          ` : ''}
          
          <div class="header-separator">
            <hr class="separator-line">
            <hr class="separator-line">
          </div>
          
          <div class="title">INVOICE</div>
          
          <div class="invoice-info">
            <div>
              <p><strong>Invoice No:</strong> ${invoiceNumber || 'INV-001'}</p>
              <p><strong>Created Date:</strong> ${createdDate || new Date().toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${dueDate || 'Not specified'}</p>
            </div>
            <div>
              <p><strong>Applicant:</strong> ${applicantName || 'Not specified'}</p>
              <p><strong>Recipient:</strong> ${recipientName || 'Not specified'}</p>
            </div>
          </div>
          
          ${items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                  <th>Discount (%)</th>
                  <th>Tax (%)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => {
                  const subtotal = item.quantity * item.price
                  const discountAmount = (subtotal * item.discount) / 100
                  const afterDiscount = subtotal - discountAmount
                  const taxAmount = (afterDiscount * item.tax) / 100
                  const total = afterDiscount + taxAmount
                  return `
                    <tr>
                      <td>${item.description || 'Item description'}</td>
                      <td>${item.quantity}</td>
                      <td>Rp ${item.price.toLocaleString()}</td>
                      <td>Rp ${subtotal.toLocaleString()}</td>
                      <td>${item.discount}%</td>
                      <td>${item.tax}%</td>
                      <td>Rp ${total.toLocaleString()}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <p><strong>Subtotal:</strong> Rp ${calculateSubtotal().toLocaleString()}</p>
              <p><strong>Total Discount:</strong> Rp ${calculateTotalDiscount().toLocaleString()}</p>
              <p><strong>Total Tax:</strong> Rp ${calculateTotalTax().toLocaleString()}</p>
              <div class="total-amount">
                <strong>Grand Total: Rp ${calculateGrandTotal().toLocaleString()}</strong>
              </div>
            </div>
          ` : `
            <div style="text-align: center; padding: 40px; color: #666;">
              <p>No items added to invoice</p>
            </div>
          `}
          
          ${notes ? `
            <div class="notes-section">
              <h4><strong>Notes:</strong></h4>
              <p>${notes}</p>
            </div>
          ` : ''}
          
          ${termsAndConditions ? `
            <div class="terms-section">
              <h4><strong>Terms and Conditions:</strong></h4>
              <p>${termsAndConditions}</p>
            </div>
          ` : ''}
        </div>
        
        ${base64Files.length > 0 ? `
          <div style="margin-top: 30px; page-break-before: always;">
            <div style="padding: 0 20px;">
              <div style="text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; color: black;">
                BUKTI TRANSFER & NOTA
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
                ${base64Files.map((proof, index) => `
                  <div style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 10px; color: #333;">
                      ${proof.title || `Bukti Transfer ${index + 1}`}
                    </div>
                    <img src="${proof.base64}" alt="Bukti Transfer ${index + 1}" style="max-width: 100%; height: auto; max-height: 300px; object-fit: contain;" />
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
    previewWindow.document.title = filename
    
    toast({
      title: "Preview Dibuka",
      description: `Preview faktur telah dibuka di tab baru dengan nama: ${filename}`
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <a href="/business-tools" className="hover:text-primary">Alat Bisnis</a>
          <span>/</span>
          <span className="text-primary">Generator Invoice</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Receipt className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Generator Invoice
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Buat invoice profesional dengan format Indonesia yang siap untuk dicetak dan digunakan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            {/* Header Upload Card */}
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <CardTitle className="flex items-center gap-3 text-xl text-green-800">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  Generator Header
                </CardTitle>
                <CardDescription className="text-green-600">
                  Unggah gambar header untuk invoice Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!headerImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-green-600" />
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
                        className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
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
                      <div className="w-full bg-white border rounded overflow-hidden" style={{ height: '120px' }}>
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
            <Card>
              <CardHeader>
                <CardTitle>Detail Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invoice-number">Nomor Invoice</Label>
                  <Input
                    id="invoice-number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="created-date">Tanggal Dibuat</Label>
                    <Input
                      id="created-date"
                      type="date"
                      value={createdDate}
                      onChange={(e) => setCreatedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="due-date">Tanggal Jatuh Tempo</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="applicant-name">Nama Pemohon</Label>
                  <Input
                    id="applicant-name"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Nama Pemohon"
                  />
                </div>
                <div>
                  <Label htmlFor="recipient-name">Nama Penerima</Label>
                  <Input
                    id="recipient-name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nama Penerima"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Item Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div>
                        <Label>Deskripsi</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi item"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Jumlah</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label>Harga</Label>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Diskon (%)</Label>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Pajak (%)</Label>
                          <Input
                            type="number"
                            value={item.tax}
                            onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <div>Subtotal: Rp {(item.quantity * item.price).toLocaleString()}</div>
                          <div>Total: Rp {calculateItemTotal(item).toLocaleString()}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informasi Tambahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukkan catatan tambahan..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="terms">Syarat dan Ketentuan</Label>
                  <Textarea
                    id="terms"
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="Masukkan syarat dan ketentuan..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bukti Transfer & Nota</CardTitle>
                <CardDescription>Upload bukti transfer dan nota (maksimal 10 file)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="transfer-proofs">Upload Bukti Transfer/Nota</Label>
                  <Input
                    id="transfer-proofs"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleTransferProofUpload}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Format yang didukung: JPG, JPEG, PNG, SVG, GIF, WEBP (maksimal 10 file)
                  </p>
                </div>
                
                {transferProofs.length > 0 && (
                  <div className="space-y-2">
                    <Label>File yang diupload ({transferProofs.length}/10):</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {transferProofs.map((proof, index) => (
                        <div key={index} className="relative border rounded-lg p-2">
                          <img
                            src={URL.createObjectURL(proof.file)}
                            alt={`Bukti ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            onClick={() => removeTransferProof(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
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
              </CardContent>
            </Card>

            {/* Filename Preview */}
            <Card className="mt-6 border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <CardTitle className="flex items-center gap-3 text-lg text-green-800">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  Preview Nama File
                </CardTitle>
                <CardDescription className="text-green-600">
                  Ini adalah nama file yang akan digunakan saat Anda mengunduh invoice
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

                        <div className="flex gap-4">
              <Button onClick={() => openFullScreenPreview()} variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Preview Layar Penuh
              </Button>
              <Button onClick={() => generatePDF()} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Buat PDF
              </Button>
              {transferProofs.length > 0 && (
                <Button 
                  onClick={() => window.open('/invoice/proofs', '_blank')} 
                  variant="outline" 
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Lihat Bukti Transfer
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-6 space-y-4">
                  {headerImage && (
                    <div>
                      <div className="w-full h-24 object-cover rounded overflow-hidden">
                        <img
                          src={headerImage}
                          alt="Header"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <hr className="my-2" />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">INVOICE</h2>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <p><strong>Nomor Invoice:</strong> {invoiceNumber || 'INV-001'}</p>
                      <p><strong>Tanggal Dibuat:</strong> {createdDate || new Date().toLocaleDateString()}</p>
                      <p><strong>Tanggal Jatuh Tempo:</strong> {dueDate || 'Tidak ditentukan'}</p>
                    </div>
                    <div>
                      <p><strong>Pemohon:</strong> {applicantName || 'Tidak ditentukan'}</p>
                      <p><strong>Penerima:</strong> {recipientName || 'Tidak ditentukan'}</p>
                    </div>
                  </div>
                  
                  {items.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-7 gap-2 text-sm font-semibold border-b pb-1">
                        <div>Deskripsi</div>
                        <div className="text-right">Jumlah</div>
                        <div className="text-right">Harga</div>
                        <div className="text-right">Subtotal</div>
                        <div className="text-right">Diskon</div>
                        <div className="text-right">Pajak</div>
                        <div className="text-right">Total</div>
                      </div>
                      
                      {items.map(item => {
                        const subtotal = item.quantity * item.price
                        const total = calculateItemTotal(item)
                        return (
                          <div key={item.id} className="grid grid-cols-7 gap-2 text-sm">
                            <div>{item.description || 'Item description'}</div>
                            <div className="text-right">{item.quantity}</div>
                            <div className="text-right">Rp {item.price.toLocaleString()}</div>
                            <div className="text-right">Rp {subtotal.toLocaleString()}</div>
                            <div className="text-right">{item.discount}%</div>
                            <div className="text-right">{item.tax}%</div>
                            <div className="text-right">Rp {total.toLocaleString()}</div>
                          </div>
                        )
                      })}
                      
                      <hr />
                      
                      <div className="text-right space-y-1">
                        <div><strong>Subtotal:</strong> Rp {calculateSubtotal().toLocaleString()}</div>
                        <div><strong>Total Diskon:</strong> Rp {calculateTotalDiscount().toLocaleString()}</div>
                        <div><strong>Total Pajak:</strong> Rp {calculateTotalTax().toLocaleString()}</div>
                        <div className="text-lg font-bold">
                          <strong>Total Keseluruhan: Rp {calculateGrandTotal().toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Tambah item untuk melihat preview</p>
                    </div>
                  )}
                  
                  {notes && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded border">
                      <h4 className="font-semibold">Catatan:</h4>
                      <p className="text-sm">{notes}</p>
                    </div>
                  )}
                  
                  {termsAndConditions && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border">
                      <h4 className="font-semibold">Syarat dan Ketentuan:</h4>
                      <p className="text-sm">{termsAndConditions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
