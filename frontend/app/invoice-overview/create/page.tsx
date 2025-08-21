"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Download, Receipt, Calculator, Users, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
    terms: ""
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
        terms: ""
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
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 0;
              color: #000;
              line-height: 1.4;
              font-size: 12px;
            }
            .invoice-container {
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
            }
            .company-info {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #FCD34D, #DC2626, #16A34A);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 10px;
            }
            .company-details h1 {
              margin: 0 0 5px 0;
              font-size: 18px;
              color: #DC2626;
              font-weight: bold;
            }
            .company-details .subtitle {
              margin: 0 0 10px 0;
              font-size: 10px;
              color: #16A34A;
              font-weight: 600;
            }
            .company-details .contact {
              font-size: 9px;
              color: #374151;
              line-height: 1.3;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h1 {
              font-size: 32px;
              margin: 0 0 15px 0;
              color: #000;
            }
            .invoice-details {
              background: #F9FAFB;
              padding: 10px;
              border-radius: 5px;
              font-size: 10px;
            }
            .customer-info {
              margin: 20px 0;
            }
            .customer-info h3 {
              color: #EA580C;
              font-size: 14px;
              margin: 0 0 10px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th {
              background: #EA580C;
              color: white;
              padding: 10px;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
            }
            .items-table td {
              padding: 8px;
              border-bottom: 1px solid #E5E7EB;
              font-size: 10px;
            }
            .items-table .description {
              text-align: left;
            }
            .items-table .number {
              text-align: center;
            }
            .totals {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
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
              margin: 5px 0;
              font-size: 11px;
            }
            .grand-total {
              background: #EA580C;
              color: white;
              padding: 10px;
              border-radius: 5px;
              font-weight: bold;
              font-size: 14px;
            }
            .notes {
              margin-top: 20px;
              font-size: 10px;
            }
            .notes h4 {
              color: #EA580C;
              margin: 0 0 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="header">
              <div class="company-info">
                <div class="logo">GLA</div>
                <div class="company-details">
                  <h1>PT. GLOBAL LESTARI ALAM</h1>
                  <p class="subtitle">(GENERAL SUPPLIERS & CONTRACTORS)</p>
                  <div class="contact">
                    <p>Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah,</p>
                    <p>Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</p>
                    <p>Telp. +62761 40288, Fax. +62761 35923, Email: gla.padang15@gmail.com</p>
                  </div>
                </div>
              </div>
              <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-details">
                  <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <strong>Invoice:</strong> <span>${invoice.invoiceNumber}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <strong>Tanggal:</strong> <span>${new Date(invoice.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin: 3px 0;">
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
                  <th style="width: 40%;">Deskripsi</th>
                  <th style="width: 10%;">Qty</th>
                  <th style="width: 15%;">Harga Satuan</th>
                  <th style="width: 10%;">Diskon</th>
                  <th style="width: 10%;">Pajak</th>
                  <th style="width: 15%;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td class="description">${item.description}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="number">Rp ${item.unitPrice.toLocaleString('id-ID')}</td>
                    <td class="number">${item.discount}%</td>
                    <td class="number">${item.tax}%</td>
                    <td class="number">Rp ${item.total.toLocaleString('id-ID')}</td>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Buat Invoice Baru
          </h1>
          <p className="text-xl text-muted-foreground">
            Lengkapi informasi invoice dan lihat preview secara real-time
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

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </CardHeader>
              <CardContent className="p-6">
                
                {/* Invoice Preview */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-6 text-sm">
                  
                  {/* Header with Company Info */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-red-500 to-green-600 rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-10 h-10 text-white">
                          <polygon points="50,10 90,85 10,85" fill="currentColor"/>
                          <path d="M45,45 Q35,40 30,35 M45,50 Q30,45 25,40 M45,55 Q28,50 22,45 M55,45 Q65,40 70,35 M55,50 Q70,45 75,40 M55,55 Q72,50 78,45" 
                                stroke="white" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-red-600">PT. GLOBAL LESTARI ALAM</h2>
                        <p className="text-green-600 font-semibold text-xs">(GENERAL SUPPLIERS & CONTRACTORS)</p>
                        <div className="text-xs text-gray-600 mt-1">
                          <p>Jl. Bandeng No. 20 RT / RW. 004 / 005, Kelurahan Tangkerang Tengah</p>
                          <p>Kec. Marpoyan Damai, Kota Pekanbaru, 28282 Riau Indonesia</p>
                          <p>Telp. +62761 40288, Email: gla.padang15@gmail.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h1>
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
      </div>
    </div>
  )
}
