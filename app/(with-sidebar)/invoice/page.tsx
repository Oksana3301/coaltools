'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Receipt, Download, Save, Plus, Trash2, FileText, Eye, Image } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function InvoicePage() {
  const { toast } = useToast()
  const [headerImage, setHeaderImage] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState([{ id: '1', description: '', quantity: 1, price: 0 }])

  const handleHeaderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setHeaderImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, price: 0 }])
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const getGeneratedFilename = () => {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const cleanInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')
    const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')
    return `Invoice_${cleanInvoiceNumber}_${cleanCustomerName}_${date}.pdf`
  }

  const generatePDF = () => {
    // Generate filename based on form data
    const generateFilename = () => {
      const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const cleanInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')
      const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')
      return `Invoice_${cleanInvoiceNumber}_${cleanCustomerName}_${date}.pdf`
    }

    const filename = generateFilename()
    
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
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <!-- Header Image Section -->
        ${headerImage ? `
        <div class="header-image">
          <img src="${headerImage}" alt="Custom Header" />
        </div>
        ` : ''}
        
        <!-- Header separator lines -->
        <div class="header-separator">
          <hr class="separator-line">
          <hr class="separator-line">
        </div>
        
        <div class="content">
          <div class="title">INVOICE</div>
          
          <div class="invoice-info">
            <div>
              <p><strong>Invoice No:</strong> ${invoiceNumber || 'INV-001'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Customer:</strong> ${customerName || 'Customer Name'}</p>
            </div>
          </div>
          
          ${items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.description || 'Item description'}</td>
                    <td>${item.quantity}</td>
                    <td>Rp ${item.price.toLocaleString()}</td>
                    <td>Rp ${(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-amount">
                Total: Rp ${items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}
              </div>
            </div>
          ` : `
            <div style="text-align: center; padding: 40px; color: #666;">
              <p>No items added to invoice</p>
            </div>
          `}
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Set the document title for better file naming
      printWindow.document.title = filename
      
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
      
      toast({
        title: "Invoice berhasil dibuat",
        description: `Invoice telah di-generate dengan nama: ${filename}`
      })
    }
  }

  const openFullScreenPreview = () => {
    // Generate filename based on form data
    const generateFilename = () => {
      const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const cleanInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')
      const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')
      return `Invoice_${cleanInvoiceNumber}_${cleanCustomerName}_${date}`
    }

    const filename = generateFilename()
    
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
          <!-- Header Image Section -->
          ${headerImage ? `
          <div class="header-image">
            <img src="${headerImage}" alt="Custom Header" />
          </div>
          ` : ''}
          
          <!-- Header separator lines -->
          <div class="header-separator">
            <hr class="separator-line">
            <hr class="separator-line">
          </div>
          
          <div class="title">INVOICE</div>
          
          <div class="invoice-info">
            <div>
              <p><strong>Invoice No:</strong> ${invoiceNumber || 'INV-001'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Customer:</strong> ${customerName || 'Customer Name'}</p>
            </div>
          </div>
          
          ${items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.description || 'Item description'}</td>
                    <td>${item.quantity}</td>
                    <td>Rp ${item.price.toLocaleString()}</td>
                    <td>Rp ${(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-amount">
                Total: Rp ${items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}
              </div>
            </div>
          ` : `
            <div style="text-align: center; padding: 40px; color: #666;">
              <p>No items added to invoice</p>
            </div>
          `}
        </div>
      </body>
      </html>
    `

    previewWindow.document.write(htmlContent)
    previewWindow.document.close()
    
    // Set the document title for better file naming
    previewWindow.document.title = filename
    
    toast({
      title: "Preview Dibuka",
      description: `Preview invoice telah dibuka di tab baru dengan nama: ${filename}`
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Invoice Generator</h1>
          <p className="text-gray-600">Create professional invoices with custom headers</p>
        </div>

        {/* Header Generator */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Header Generator
            </CardTitle>
            <CardDescription>Upload your custom header image for A4 portrait layout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="header-upload">Upload Header Image</Label>
                <Input
                  id="header-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderUpload}
                  className="mt-1"
                />
              </div>
              
              {headerImage && (
                <div>
                  <Label>Preview (A4 Portrait - 120px height):</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden" style={{ height: '120px' }}>
                    <img
                      src={headerImage}
                      alt="Header Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label>Price</Label>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total: Rp {(item.quantity * item.price).toLocaleString()}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filename Preview */}
            <Card className="mt-6 border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <CardTitle className="flex items-center gap-3 text-lg text-green-800">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  Generated Filename Preview
                </CardTitle>
                <CardDescription className="text-green-600">
                  This is the filename that will be used when you download the invoice
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
              <Button onClick={openFullScreenPreview} variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Full Screen Preview
              </Button>
              <Button onClick={generatePDF} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Generate PDF
              </Button>
              <Button className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Invoice
              </Button>
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
                      <p><strong>Invoice No:</strong> {invoiceNumber || 'INV-001'}</p>
                      <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p><strong>Customer:</strong> {customerName || 'Customer Name'}</p>
                    </div>
                  </div>
                  
                  {items.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 text-sm font-semibold border-b pb-1">
                        <div>Description</div>
                        <div className="text-right">Qty</div>
                        <div className="text-right">Price</div>
                        <div className="text-right">Total</div>
                      </div>
                      
                      {items.map(item => (
                        <div key={item.id} className="grid grid-cols-4 gap-2 text-sm">
                          <div>{item.description || 'Item description'}</div>
                          <div className="text-right">{item.quantity}</div>
                          <div className="text-right">Rp {item.price.toLocaleString()}</div>
                          <div className="text-right">Rp {(item.quantity * item.price).toLocaleString()}</div>
                        </div>
                      ))}
                      
                      <hr />
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          Total: Rp {items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Add items to see preview</p>
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
