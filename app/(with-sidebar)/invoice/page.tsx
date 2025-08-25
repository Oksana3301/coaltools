"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Truck,
  TrendingUp,
  Plus,
  Save,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  FileText,
  Users,
  X,
  Copy,
  History,
  RefreshCw,
  Settings,
  Zap,
  Clock,
  Loader2,
  Receipt,
  Building2,
  Image,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  total: number
}

interface Customer {
  name: string
  email: string
  phone: string
  address: string
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  customer: Customer
  items: InvoiceItem[]
  subtotal: number
  totalDiscount: number
  totalTax: number
  grandTotal: number
  notes: string
  terms: string
  transferProof?: string
}

export default function CreateInvoicePage() {
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: "",
    date: "",
    dueDate: "",
    customer: {
      name: "",
      email: "",
      phone: "",
      address: ""
    },
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0,
    notes: "",
    terms: "",
    transferProof: ""
  })

  const { toast } = useToast()

  // Load saved data from localStorage and set defaults
  useEffect(() => {
    const savedInvoice = localStorage.getItem('draft-invoice')
    if (savedInvoice) {
      try {
        const parsedInvoice = JSON.parse(savedInvoice)
        setInvoice(parsedInvoice)
        toast({
          title: "Draft Dipulihkan",
          description: "Draft invoice sebelumnya telah dipulihkan.",
        })
      } catch (error) {
        console.error('Error parsing saved invoice:', error)
      }
    } else {
      // Set defaults for new invoice
      const today = new Date().toISOString().split('T')[0]
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)
      const dueDateStr = dueDate.toISOString().split('T')[0]
      
      setInvoice(prev => ({
        ...prev,
        date: today,
        dueDate: dueDateStr,
        invoiceNumber: `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/001`
      }))
    }
  }, [])

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('draft-invoice', JSON.stringify(invoice))
    }, 1000) // Save after 1 second of inactivity

    return () => clearTimeout(timer)
  }, [invoice])

  // Calculate totals when items change
  useEffect(() => {
    let subtotal = 0
    let totalDiscount = 0
    let totalTax = 0

    invoice.items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice
      const discountAmount = lineTotal * (item.discount / 100)
      const afterDiscount = lineTotal - discountAmount
      const taxAmount = afterDiscount * (item.tax / 100)
      
      subtotal += lineTotal
      totalDiscount += discountAmount
      totalTax += taxAmount
    })

    const grandTotal = subtotal - totalDiscount + totalTax

    setInvoice(prev => ({
      ...prev,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal
    }))
  }, [invoice.items])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 10,
      total: 0
    }
    
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          
          // Recalculate total for this item
          const lineTotal = updatedItem.quantity * updatedItem.unitPrice
          const discountAmount = lineTotal * (updatedItem.discount / 100)
          const afterDiscount = lineTotal - discountAmount
          const taxAmount = afterDiscount * (updatedItem.tax / 100)
          updatedItem.total = afterDiscount + taxAmount
          
          return updatedItem
        }
        return item
      })
    }))
  }

  const removeItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  const generateInvoiceNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
    
    const newInvoiceNumber = `INV/${year}${month}${day}/${time}`
    setInvoice(prev => ({ ...prev, invoiceNumber: newInvoiceNumber }))
    
    toast({
      title: "Nomor Invoice Baru",
      description: `Nomor invoice diubah menjadi: ${newInvoiceNumber}`,
    })
  }

  const clearForm = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data dan memulai dari awal?')) {
      localStorage.removeItem('draft-invoice')
      setInvoice({
        invoiceNumber: "",
        date: "",
        dueDate: "",
        customer: { name: "", email: "", phone: "", address: "" },
        items: [],
        subtotal: 0,
        totalDiscount: 0,
        totalTax: 0,
        grandTotal: 0,
        notes: "",
        terms: "",
        transferProof: ""
      })
      
      // Reset to defaults
      const today = new Date().toISOString().split('T')[0]
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)
      const dueDateStr = dueDate.toISOString().split('T')[0]
      
      setInvoice(prev => ({
        ...prev,
        date: today,
        dueDate: dueDateStr,
        invoiceNumber: `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/001`
      }))
      
      toast({
        title: "Form Dibersihkan",
        description: "Semua data telah dihapus dan form direset.",
      })
    }
  }

  // Image upload functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "File harus berupa gambar (JPG, PNG, GIF, dll).",
          variant: "destructive"
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran file maksimal 5MB.",
          variant: "destructive"
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setInvoice(prev => ({ ...prev, transferProof: result }))
        toast({
          title: "Bukti Transfer Diunggah",
          description: "Gambar bukti transfer berhasil diunggah.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setInvoice(prev => ({ ...prev, transferProof: "" }))
    toast({
      title: "Bukti Transfer Dihapus",
      description: "Gambar bukti transfer telah dihapus.",
    })
  }

  const generatePDFWithTransferProof = async () => {
    if (!validateForm()) return

    try {
      const invoiceContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice - ${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: A4;
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
              color: #000;
              line-height: 1.4;
              font-size: 11px;
            }
            .invoice-container {
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid black;
              padding: 20px 25px;
              margin-bottom: 25px;
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 25px;
            }
            .logo {
              width: 85px;
              height: 85px;
              flex-shrink: 0;
              background: #fbbf24;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 4px;
            }
            .company-info {
              flex: 1;
              min-width: 0;
            }
            .company-name {
              font-size: 22px;
              font-weight: bold;
              margin: 0 0 6px 0;
              color: #dc2626;
              line-height: 1.2;
              text-transform: uppercase;
            }
            .company-type {
              font-size: 14px;
              color: #059669;
              margin: 0 0 12px 0;
              font-weight: 500;
              text-transform: uppercase;
            }
            .company-address {
              font-size: 12px;
              color: #000;
              margin: 0 0 4px 0;
              line-height: 1.5;
            }
            .company-contact {
              font-size: 12px;
              color: #000;
              margin: 0;
              line-height: 1.5;
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
            .invoice-title {
              text-align: right;
              min-width: 200px;
            }
            .invoice-title h1 {
              font-size: 20px;
              margin: 0 0 15px 0;
              color: #000;
              font-weight: bold;
            }
            .invoice-details {
              background: #F9FAFB;
              padding: 10px;
              border-radius: 5px;
              font-size: 10px;
              border: 1px solid #E5E7EB;
            }
            .invoice-details div {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .customer-info {
              margin: 20px 0;
              padding: 15px;
              background: #F9FAFB;
              border-radius: 5px;
              border-left: 4px solid #EA580C;
            }
            .customer-info h3 {
              color: #EA580C;
              font-size: 14px;
              margin: 0 0 10px 0;
              font-weight: bold;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              border: 1px solid #E5E7EB;
            }
            .items-table th {
              background: #EA580C;
              color: white;
              padding: 12px 8px;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              border: 1px solid #E5E7EB;
            }
            .items-table td {
              padding: 10px 8px;
              border: 1px solid #E5E7EB;
              font-size: 10px;
              vertical-align: top;
            }
            .items-table .description {
              text-align: left;
              width: 35%;
            }
            .items-table .number {
              text-align: center;
              width: 10%;
            }
            .items-table .price {
              text-align: right;
              width: 15%;
            }
            .items-table .discount {
              text-align: center;
              width: 10%;
            }
            .items-table .tax {
              text-align: center;
              width: 10%;
            }
            .items-table .total {
              text-align: right;
              width: 15%;
              font-weight: bold;
            }
            .totals {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
              gap: 20px;
            }
            .totals-left {
              width: 50%;
            }
            .totals-right {
              width: 40%;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 11px;
              padding: 5px 0;
            }
            .grand-total {
              background: #EA580C;
              color: white;
              padding: 15px;
              border-radius: 5px;
              font-weight: bold;
              font-size: 14px;
              margin-top: 10px;
            }
            .notes {
              margin-top: 20px;
              font-size: 10px;
              padding: 15px;
              background: #F9FAFB;
              border-radius: 5px;
              border: 1px solid #E5E7EB;
            }
            .notes h4 {
              color: #EA580C;
              margin: 0 0 8px 0;
              font-weight: bold;
            }
            .notes p {
              line-height: 1.4;
              color: #374151;
            }
            .transfer-proof {
              margin-top: 30px;
              padding: 20px;
              border: 2px solid #EA580C;
              border-radius: 8px;
              background: #FEF3C7;
            }
            .transfer-proof h3 {
              color: #EA580C;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
              text-align: center;
            }
            .transfer-proof img {
              max-width: 100%;
              max-height: 300px;
              display: block;
              margin: 0 auto;
              border: 1px solid #E5E7EB;
              border-radius: 4px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div style="display: flex; align-items: flex-end; gap: 15px;">
                <div class="logo">
                  <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                    <!-- Yellow background -->
                    <rect x="5" y="5" width="90" height="90" fill="#fbbf24" rx="8"/>
                    <!-- Red triangle -->
                    <polygon points="50,20 80,70 20,70" fill="#dc2626"/>
                    <!-- Green palm tree/leaf -->
                    <path d="M35 65 Q50 45 65 65" stroke="white" stroke-width="2" fill="none"/>
                    <path d="M35 65 Q45 50 50 55 Q55 50 65 65" fill="#22c55e"/>
                    <path d="M40 60 Q50 40 60 60" stroke="white" stroke-width="2" fill="none"/>
                    <path d="M40 60 Q47 45 50 50 Q53 45 60 60" fill="#22c55e"/>
                    <path d="M45 55 Q50 35 55 55" stroke="white" stroke-width="2" fill="none"/>
                    <path d="M45 55 Q48 40 50 45 Q52 40 55 55" fill="#22c55e"/>
                    <!-- Tree trunk -->
                    <rect x="47" y="65" width="6" height="15" fill="white"/>
                  </svg>
                </div>
                <div class="company-info">
                  <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
                  <div class="company-type">(GENERAL SUPPLIERS & CONTRACTORS)</div>
                  <div class="company-address">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</div>
                  <div class="company-contact">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</div>
                </div>
              </div>
              <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-details">
                  <div><strong>Invoice:</strong> <span>${invoice.invoiceNumber}</span></div>
                  <div><strong>Tanggal:</strong> <span>${new Date(invoice.date).toLocaleDateString('id-ID')}</span></div>
                  <div><strong>Jatuh Tempo:</strong> <span>${new Date(invoice.dueDate).toLocaleDateString('id-ID')}</span></div>
                </div>
              </div>
            </div>
            
            <!-- Header separator lines -->
            <div class="header-separator">
              <hr class="separator-line">
              <hr class="separator-line">
            </div>

            <div class="customer-info">
              <h3>Tagihan Kepada:</h3>
              <div style="color: #374151; font-size: 11px;">
                <div style="font-weight: bold; margin-bottom: 5px;">${invoice.customer.name}</div>
                ${invoice.customer.email ? `<div>Email: ${invoice.customer.email}</div>` : ''}
                ${invoice.customer.phone ? `<div>Telp: ${invoice.customer.phone}</div>` : ''}
                ${invoice.customer.address ? `<div>${invoice.customer.address}</div>` : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th class="description">Deskripsi</th>
                  <th class="number">Qty</th>
                  <th class="price">Harga Satuan</th>
                  <th class="discount">Diskon</th>
                  <th class="tax">Pajak</th>
                  <th class="total">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td class="description">${item.description}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="price">Rp ${item.unitPrice.toLocaleString('id-ID')}</td>
                    <td class="discount">${item.discount}%</td>
                    <td class="tax">${item.tax}%</td>
                    <td class="total">Rp ${item.total.toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-left">
                ${invoice.notes ? `
                  <div class="notes">
                    <h4>Catatan:</h4>
                    <p>${invoice.notes}</p>
                  </div>
                ` : ''}
                ${invoice.terms ? `
                  <div class="notes">
                    <h4>Syarat & Ketentuan:</h4>
                    <p>${invoice.terms}</p>
                  </div>
                ` : ''}
              </div>
              <div class="totals-right">
                <div class="total-line">
                  <span>Subtotal:</span>
                  <span>Rp ${invoice.subtotal.toLocaleString('id-ID')}</span>
                </div>
                ${invoice.totalDiscount > 0 ? `
                  <div class="total-line">
                    <span>Total Diskon:</span>
                    <span>(Rp ${invoice.totalDiscount.toLocaleString('id-ID')})</span>
                  </div>
                ` : ''}
                ${invoice.totalTax > 0 ? `
                  <div class="total-line">
                    <span>Total Pajak:</span>
                    <span>Rp ${invoice.totalTax.toLocaleString('id-ID')}</span>
                  </div>
                ` : ''}
                <div class="grand-total">
                  <div style="display: flex; justify-content: space-between;">
                    <span>TOTAL:</span>
                    <span>Rp ${invoice.grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            ${invoice.transferProof ? `
              <div class="transfer-proof">
                <h3>Bukti Transfer Pembayaran</h3>
                <img src="${invoice.transferProof}" alt="Bukti Transfer" />
                <div style="margin-top: 15px; text-align: center; font-size: 10px; color: #374151;">
                  <strong>Catatan:</strong> Dokumen ini merupakan bukti transfer pembayaran untuk invoice ${invoice.invoiceNumber}.
                </div>
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `

      // Open PDF in new window for printing/saving
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(invoiceContent)
        printWindow.document.close()
        printWindow.focus()
        
        // Trigger print dialog
        setTimeout(() => {
          printWindow.print()
        }, 500)

        toast({
          title: "Berhasil!",
          description: "Invoice PDF dengan bukti transfer berhasil dibuat!",
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

  const validateForm = () => {
    if (!invoice.invoiceNumber.trim()) {
      toast({
        title: "Kesalahan Validasi",
        description: "Nomor invoice harus diisi",
        variant: "destructive",
      })
      return false
    }

    if (!invoice.customer.name.trim()) {
      toast({
        title: "Kesalahan Validasi", 
        description: "Nama pelanggan harus diisi",
        variant: "destructive",
      })
      return false
    }

    if (invoice.items.length === 0) {
      toast({
        title: "Kesalahan Validasi",
        description: "Minimal harus ada satu item dalam invoice",
        variant: "destructive",
      })
      return false
    }

    for (let item of invoice.items) {
      if (!item.description.trim()) {
        toast({
          title: "Kesalahan Validasi",
          description: "Semua item harus memiliki deskripsi",
          variant: "destructive",
        })
        return false
      }
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        toast({
          title: "Kesalahan Validasi",
          description: "Kuantitas dan harga harus lebih dari 0",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const generatePDF = async () => {
    if (!validateForm()) return

    try {
      const invoiceContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice - ${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: A4;
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
              color: #000;
              line-height: 1.4;
              font-size: 11px;
            }
            .invoice-container {
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 2px solid black;
              padding: 15px 20px;
              margin-bottom: 20px;
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 15px;
            }
                      .logo {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
            background: #fbbf24;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
          }
            .company-info {
              flex: 1;
              min-width: 0;
            }
            .company-name {
              font-size: 22px;
              font-weight: bold;
              margin: 0 0 6px 0;
              color: #374151;
              line-height: 1.2;
            }
            .company-type {
              font-size: 14px;
              color: #059669;
              margin: 0 0 12px 0;
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
            .invoice-title {
              text-align: right;
              min-width: 200px;
            }
            .invoice-title h1 {
              font-size: 20px;
              margin: 0 0 15px 0;
              color: #000;
              font-weight: bold;
            }
            .invoice-details {
              background: #F9FAFB;
              padding: 10px;
              border-radius: 5px;
              font-size: 10px;
              border: 1px solid #E5E7EB;
            }
            .invoice-details div {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .customer-info {
              margin: 20px 0;
              padding: 15px;
              background: #F9FAFB;
              border-radius: 5px;
              border-left: 4px solid #EA580C;
            }
            .customer-info h3 {
              color: #EA580C;
              font-size: 14px;
              margin: 0 0 10px 0;
              font-weight: bold;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              border: 1px solid #E5E7EB;
            }
            .items-table th {
              background: #EA580C;
              color: white;
              padding: 12px 8px;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              border: 1px solid #E5E7EB;
            }
            .items-table td {
              padding: 10px 8px;
              border: 1px solid #E5E7EB;
              font-size: 10px;
              vertical-align: top;
            }
            .items-table .description {
              text-align: left;
              width: 35%;
            }
            .items-table .number {
              text-align: center;
              width: 10%;
            }
            .items-table .price {
              text-align: right;
              width: 15%;
            }
            .items-table .discount {
              text-align: center;
              width: 10%;
            }
            .items-table .tax {
              text-align: center;
              width: 10%;
            }
            .items-table .total {
              text-align: right;
              width: 15%;
              font-weight: bold;
            }
            .totals {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
              gap: 20px;
            }
            .totals-left {
              width: 50%;
            }
            .totals-right {
              width: 40%;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 11px;
              padding: 5px 0;
            }
            .grand-total {
              background: #EA580C;
              color: white;
              padding: 15px;
              border-radius: 5px;
              font-weight: bold;
              font-size: 14px;
              margin-top: 10px;
            }
            .notes {
              margin-top: 20px;
              font-size: 10px;
              padding: 15px;
              background: #F9FAFB;
              border-radius: 5px;
              border: 1px solid #E5E7EB;
            }
            .notes h4 {
              color: #EA580C;
              margin: 0 0 8px 0;
              font-weight: bold;
            }
            .notes p {
              line-height: 1.4;
              color: #374151;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="header">
              <div style="display: flex; align-items: flex-end; gap: 15px;">
                <div class="logo">
                  <img src="/gla-logo.svg" alt="PT. GLOBAL LESTARI ALAM Logo" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="company-info">
                  <div class="company-name">PT. GLOBAL LESTARI ALAM</div>
                  <div class="company-type">(GENERAL SUPPLIERS & CONTRACTORS)</div>
                  <div class="company-address">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</div>
                  <div class="company-contact">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</div>
                </div>
              </div>
              <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-details">
                  <div>
                    <strong>Invoice:</strong> <span>${invoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <strong>Tanggal:</strong> <span>${new Date(invoice.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div>
                    <strong>Jatuh Tempo:</strong> <span>${new Date(invoice.dueDate).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="customer-info">
              <h3>Tagihan Kepada:</h3>
              <div>
                <strong>${invoice.customer.name}</strong><br>
                ${invoice.customer.email ? `Email: ${invoice.customer.email}<br>` : ''}
                ${invoice.customer.phone ? `Telp: ${invoice.customer.phone}<br>` : ''}
                ${invoice.customer.address ? `${invoice.customer.address}` : ''}
              </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th class="description">Deskripsi</th>
                  <th class="number">Qty</th>
                  <th class="price">Harga Satuan</th>
                  <th class="discount">Diskon</th>
                  <th class="tax">Pajak</th>
                  <th class="total">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td class="description">${item.description}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="price">Rp ${item.unitPrice.toLocaleString('id-ID')}</td>
                    <td class="discount">${item.discount}%</td>
                    <td class="tax">${item.tax}%</td>
                    <td class="total">Rp ${item.total.toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals">
              <div class="totals-left">
                ${invoice.notes ? `
                  <div class="notes">
                    <h4>Catatan:</h4>
                    <p>${invoice.notes}</p>
                  </div>
                ` : ''}
                ${invoice.terms ? `
                  <div class="notes">
                    <h4>Syarat & Ketentuan:</h4>
                    <p>${invoice.terms}</p>
                  </div>
                ` : ''}
              </div>
              <div class="totals-right">
                <div class="total-line">
                  <span>Subtotal:</span>
                  <span>Rp ${invoice.subtotal.toLocaleString('id-ID')}</span>
                </div>
                ${invoice.totalDiscount > 0 ? `
                  <div class="total-line">
                    <span>Total Diskon:</span>
                    <span>(Rp ${invoice.totalDiscount.toLocaleString('id-ID')})</span>
                  </div>
                ` : ''}
                ${invoice.totalTax > 0 ? `
                  <div class="total-line">
                    <span>Total Pajak:</span>
                    <span>Rp ${invoice.totalTax.toLocaleString('id-ID')}</span>
                  </div>
                ` : ''}
                <div class="grand-total">
                  <div style="display: flex; justify-content: space-between;">
                    <span>TOTAL:</span>
                    <span>Rp ${invoice.grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          ${invoice.transferProof ? `
            <!-- Transfer Proof Page -->
            <div style="page-break-before: always; padding: 20px; max-width: 800px; margin: 0 auto;">
              <div style="border-bottom: 2px solid black; padding: 15px 20px; margin-bottom: 20px; display: flex; align-items: flex-end; justify-content: space-between; gap: 15px;">
                <div style="display: flex; align-items: flex-end; gap: 15px;">
                  <div style="width: 65px; height: 65px; flex-shrink: 0;">
                    <img src="/gla-logo.svg" alt="PT. GLOBAL LESTARI ALAM Logo" style="width: 100%; height: 100%; object-fit: contain;">
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <h1 style="font-size: 16px; font-weight: bold; margin: 0 0 3px 0; color: #d13237; line-height: 1.2;">PT. GLOBAL LESTARI ALAM</h1>
                    <p style="font-size: 11px; color: #398e63; margin: 0 0 8px 0; font-weight: 500;">(GENERAL SUPPLIERS & CONTRACTORS)</p>
                    <p style="font-size: 9px; color: #374151; margin: 0 0 2px 0; line-height: 1.3;">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</p>
                    <p style="font-size: 9px; color: #374151; margin: 0; line-height: 1.3;">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</p>
                  </div>
                </div>
                <div style="text-align: right; min-width: 200px;">
                  <h1 style="font-size: 20px; margin: 0 0 15px 0; color: #000; font-weight: bold;">BUKTI TRANSFER</h1>
                  <div style="background: #F9FAFB; padding: 10px; border-radius: 5px; font-size: 10px; border: 1px solid #E5E7EB;">
                    <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                      <span style="font-weight: bold;">Invoice:</span>
                      <span>${invoice.invoiceNumber}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                      <span style="font-weight: bold;">Tanggal:</span>
                      <span>${new Date(invoice.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                      <span style="font-weight: bold;">Pelanggan:</span>
                      <span>${invoice.customer.name}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #000;">Bukti Transfer Pembayaran</h2>
                <div style="margin: 20px 0;">
                  <img src="${invoice.transferProof}" alt="Bukti Transfer" style="max-width: 100%; max-height: 500px; border: 2px solid #E5E7EB; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />
                </div>
                <div style="margin-top: 30px; padding: 15px; background: #F9FAFB; border-radius: 5px; border: 1px solid #E5E7EB;">
                  <p style="font-size: 12px; color: #374151; margin: 0;">
                    <strong>Catatan:</strong> Dokumen ini merupakan bukti transfer pembayaran untuk invoice ${invoice.invoiceNumber}. 
                    Simpan dokumen ini sebagai bukti transaksi yang sah.
                  </p>
                </div>
              </div>
            </div>
          ` : ''}
        </body>
        </html>
      `

      // Open PDF in new window for printing/saving
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(invoiceContent)
        printWindow.document.close()
        printWindow.focus()
        
        // Trigger print dialog
        setTimeout(() => {
          printWindow.print()
        }, 500)

        toast({
          title: "Berhasil!",
          description: "Invoice PDF berhasil dibuat! Gunakan fungsi cetak browser untuk menyimpan.",
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
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <a href="/business-tools" className="hover:text-primary">Business Tools</a>
          <span>/</span>
          <a href="/invoice-overview" className="hover:text-primary">Overview Invoice</a>
          <span>/</span>
          <span className="text-primary">Buat Invoice Baru</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Receipt className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Buat Invoice Baru
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lengkapi informasi invoice dan lihat preview secara real-time dengan format profesional
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Form */}
          <div className="space-y-6">
            
            {/* Invoice Information */}
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
                  <Receipt className="h-5 w-5" />
                  Informasi Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice-number">Nomor Invoice</Label>
                    <div className="flex gap-2">
                      <Input
                        id="invoice-number"
                        value={invoice.invoiceNumber}
                        onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        className="font-mono flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={generateInvoiceNumber}
                        className="whitespace-nowrap"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoice.date}
                      onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Jatuh Tempo</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2 text-xl text-green-800">
                  <Users className="h-5 w-5" />
                  Informasi Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Nama</Label>
                    <Input
                      id="customer-name"
                      value={invoice.customer.name}
                      onChange={(e) => setInvoice(prev => ({ 
                        ...prev, 
                        customer: { ...prev.customer, name: e.target.value }
                      }))}
                      placeholder="Nama pelanggan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={invoice.customer.email}
                      onChange={(e) => setInvoice(prev => ({ 
                        ...prev, 
                        customer: { ...prev.customer, email: e.target.value }
                      }))}
                      placeholder="email@contoh.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Telepon</Label>
                    <Input
                      id="customer-phone"
                      value={invoice.customer.phone}
                      onChange={(e) => setInvoice(prev => ({ 
                        ...prev, 
                        customer: { ...prev.customer, phone: e.target.value }
                      }))}
                      placeholder="+62 xxx xxx xxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-address">Alamat</Label>
                    <Textarea
                      id="customer-address"
                      value={invoice.customer.address}
                      onChange={(e) => setInvoice(prev => ({ 
                        ...prev, 
                        customer: { ...prev.customer, address: e.target.value }
                      }))}
                      placeholder="Alamat lengkap pelanggan"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="border-2 border-orange-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <CardTitle className="flex items-center gap-2 text-xl text-orange-800">
                  <Building2 className="h-5 w-5" />
                  Item Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {invoice.items.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Deskripsi</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Deskripsi produk/jasa"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kuantitas</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Harga Satuan</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Diskon (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pajak (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Total: </span>
                      <span className="font-bold">Rp {item.total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
                
                <Button onClick={addItem} className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Item
                </Button>
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            <Card className="border-2 border-purple-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
                <CardTitle className="text-xl text-purple-800">Catatan & Syarat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={invoice.notes}
                    onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Catatan tambahan untuk invoice ini..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Syarat & Ketentuan</Label>
                  <Textarea
                    id="terms"
                    value={invoice.terms}
                    onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                    placeholder="Syarat pembayaran dan ketentuan lainnya..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bukti Transfer Upload */}
            <Card className="border-2 border-orange-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="text-xl text-orange-800 flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Bukti Transfer
                </CardTitle>
                <CardDescription>
                  Upload bukti transfer pembayaran (opsional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {!invoice.transferProof ? (
                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                    <Upload className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Klik untuk upload bukti transfer
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Format: JPG, PNG, GIF (Maks. 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="transfer-proof-upload"
                    />
                    <Button
                      asChild
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <label htmlFor="transfer-proof-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Pilih File
                      </label>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={invoice.transferProof}
                        alt="Bukti Transfer"
                        className="w-full max-w-md mx-auto rounded-lg border-2 border-orange-200 shadow-sm"
                      />
                      <Button
                        onClick={removeImage}
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">
                        ✓ Bukti transfer berhasil diunggah
                      </p>
                      <p className="text-xs text-gray-500">
                        Gambar akan ditampilkan di halaman terpisah pada PDF
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={clearForm} 
                variant="outline" 
                size="lg"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Bersihkan Form
              </Button>
              
              <Button 
                onClick={() => {
                  toast({
                    title: "Draft Disimpan",
                    description: "Data invoice telah disimpan secara otomatis.",
                  })
                }} 
                variant="outline" 
                size="lg"
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                <Receipt className="h-5 w-5 mr-2" />
                Simpan Draft
              </Button>
              
              <Button 
                onClick={generatePDF} 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Download className="h-5 w-5 mr-2" />
                Generate PDF
              </Button>

              {invoice.transferProof && (
                <Button 
                  onClick={generatePDFWithTransferProof} 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <Image className="h-5 w-5 mr-2" />
                  PDF + Bukti Transfer
                </Button>
              )}
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <Card className="border-2 border-gray-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Preview Invoice
                </CardTitle>
                <CardDescription>
                  Pratinjau real-time invoice Anda
                </CardDescription>
                {invoice.transferProof && (
                  <div className="mt-2">
                    <Button
                      onClick={() => {
                        const printWindow = window.open('', '_blank')
                        if (printWindow) {
                          const previewContent = document.querySelector('.bg-white.border-2.border-gray-200.rounded-lg')
                          if (previewContent) {
                            printWindow.document.write(`
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>Invoice Preview - ${invoice.invoiceNumber}</title>
                                <style>
                                  @media print {
                                    body { margin: 0; padding: 20px; }
                                    .no-print { display: none; }
                                  }
                                  * { box-sizing: border-box; }
                                  body { font-family: Arial, sans-serif; }
                                  img { max-width: 100%; height: auto; }
                                </style>
                              </head>
                              <body>
                                ${previewContent.outerHTML}
                              </body>
                              </html>
                            `)
                            printWindow.document.close()
                            printWindow.focus()
                            setTimeout(() => {
                              printWindow.print()
                            }, 500)
                          }
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Print Preview
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                
                {/* Invoice Preview */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-6 text-sm print:border-0 print:p-0">
                  
                  {/* Header with Company Info and Invoice Details */}
                  <div className="p-4">
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex items-end gap-4">
                        {/* Logo */}
                        <div className="w-28 h-28 flex-shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Yellow background */}
                            <rect x="5" y="5" width="90" height="90" fill="#fbbf24" rx="8"/>
                            {/* Red triangle */}
                            <polygon points="50,20 80,70 20,70" fill="#dc2626"/>
                            {/* Green palm tree/leaf */}
                            <path d="M35 65 Q50 45 65 65" stroke="white" strokeWidth="2" fill="none"/>
                            <path d="M35 65 Q45 50 50 55 Q55 50 65 65" fill="#22c55e"/>
                            <path d="M40 60 Q50 40 60 60" stroke="white" strokeWidth="2" fill="none"/>
                            <path d="M40 60 Q47 45 50 50 Q53 45 60 60" fill="#22c55e"/>
                            <path d="M45 55 Q50 35 55 55" stroke="white" strokeWidth="2" fill="none"/>
                            <path d="M45 55 Q48 40 50 45 Q52 40 55 55" fill="#22c55e"/>
                            {/* Tree trunk */}
                            <rect x="47" y="65" width="6" height="15" fill="white"/>
                          </svg>
                        </div>
                        
                        {/* Company Info */}
                        <div className="flex-1 min-w-0">
                          <h1 className="text-lg font-bold mb-2 text-red-600 uppercase">PT. GLOBAL LESTARI ALAM</h1>
                          <p className="text-xs mb-3 text-green-600 uppercase">(GENERAL SUPPLIERS & CONTRACTORS)</p>
                          <p className="text-xs text-black mb-1 leading-tight">Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangerang Tengah, Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</p>
                          <p className="text-xs text-black leading-tight">Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</p>
                        </div>
                      </div>

                      {/* Invoice Title and Details */}
                      <div className="text-right">
                        <h1 className="text-xl font-bold text-gray-800 mb-2">INVOICE</h1>
                        <div className="bg-gray-50 p-3 rounded border text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">Invoice:</span>
                              <span>{invoice.invoiceNumber || "INV/YYYY/MM/DD/001"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Tanggal:</span>
                              <span>{invoice.date ? new Date(invoice.date).toLocaleDateString('id-ID') : "-"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Jatuh Tempo:</span>
                              <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('id-ID') : "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Header separator lines */}
                  <div className="px-4">
                    <hr className="border-t border-black mb-1" />
                    <hr className="border-t border-black" />
                  </div>

                  <Separator />

                  {/* Customer Info */}
                  {invoice.customer.name && (
                    <div>
                      <h3 className="font-bold text-orange-600 mb-2">Tagihan Kepada:</h3>
                      <div className="text-gray-700 text-xs space-y-1">
                        <p className="font-medium">{invoice.customer.name}</p>
                        {invoice.customer.email && <p>Email: {invoice.customer.email}</p>}
                        {invoice.customer.phone && <p>Telp: {invoice.customer.phone}</p>}
                        {invoice.customer.address && <p>{invoice.customer.address}</p>}
                      </div>
                    </div>
                  )}

                  {/* Items Table */}
                  {invoice.items.length > 0 && (
                    <div>
                      <div className="bg-orange-400 text-white rounded-t-lg p-2 text-xs font-medium">
                        <div className="grid grid-cols-6 gap-2">
                          <div className="col-span-2">Deskripsi</div>
                          <div className="text-center">Qty</div>
                          <div className="text-center">Harga</div>
                          <div className="text-center">Diskon</div>
                          <div className="text-center">Total</div>
                        </div>
                      </div>
                      
                      <div className="border-l border-r border-b border-gray-300">
                        {invoice.items.map((item) => (
                          <div key={item.id} className="grid grid-cols-6 gap-2 p-2 border-b border-gray-200 text-xs">
                            <div className="col-span-2">
                              <div className="font-medium">{item.description || "Item"}</div>
                            </div>
                            <div className="text-center">{item.quantity}</div>
                            <div className="text-center">{item.unitPrice.toLocaleString('id-ID')}</div>
                            <div className="text-center">{item.discount}%</div>
                            <div className="text-center font-medium">{item.total.toLocaleString('id-ID')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  {invoice.items.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Rp {invoice.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      {invoice.totalDiscount > 0 && (
                        <div className="flex justify-between">
                          <span>Total Diskon:</span>
                          <span>(Rp {invoice.totalDiscount.toLocaleString('id-ID')})</span>
                        </div>
                      )}
                      {invoice.totalTax > 0 && (
                        <div className="flex justify-between">
                          <span>Total Pajak:</span>
                          <span>Rp {invoice.totalTax.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="bg-orange-400 text-white p-2 rounded font-bold flex justify-between">
                        <span>TOTAL:</span>
                        <span>Rp {invoice.grandTotal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {(invoice.notes || invoice.terms) && (
                    <div className="space-y-2 text-xs">
                      {invoice.notes && (
                        <div>
                          <h4 className="font-bold text-orange-600">Catatan:</h4>
                          <p className="text-gray-700">{invoice.notes}</p>
                        </div>
                      )}
                      {invoice.terms && (
                        <div>
                          <h4 className="font-bold text-orange-600">Syarat & Ketentuan:</h4>
                          <p className="text-gray-700">{invoice.terms}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transfer Proof Preview */}
                  {invoice.transferProof && (
                    <div className="space-y-2 text-xs">
                      <div className="border-t-2 border-orange-200 pt-4">
                        <h4 className="font-bold text-orange-600 mb-2">Bukti Transfer:</h4>
                        <div className="relative">
                          <img
                            src={invoice.transferProof}
                            alt="Bukti Transfer Preview"
                            className="w-full max-w-xs mx-auto rounded border-2 border-orange-200 shadow-sm print:max-w-md print:border-4 print:border-orange-300"
                            style={{ 
                              printColorAdjust: 'exact',
                              WebkitPrintColorAdjust: 'exact'
                            }}
                          />
                          <div className="text-center mt-2">
                            <p className="text-green-600 font-medium text-xs print:text-black">
                              ✓ Bukti transfer akan ditampilkan di halaman terpisah pada PDF
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {invoice.items.length === 0 && !invoice.customer.name && (
                    <div className="text-center text-gray-400 py-8">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Mulai isi informasi invoice untuk melihat preview</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button onClick={generatePDF} variant="outline" className="flex-1 h-12">
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
          <Button variant="outline" className="flex-1 h-12">
            <Copy className="h-4 w-4 mr-2" />
            Copy Data
          </Button>
          <Button className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Save className="h-4 w-4 mr-2" />
            Simpan Invoice
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
                Invoice dengan format standar Indonesia yang profesional dan lengkap sesuai standar akuntansi
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
                Generate invoice langsung ke format PDF yang siap dicetak dengan kualitas tinggi
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
                Lihat preview invoice secara real-time sebelum di-generate untuk memastikan akurasi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
