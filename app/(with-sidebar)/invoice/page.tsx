'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Receipt, Download, Save, Plus, Trash2, FileText, Eye, Image } from 'lucide-react'

export default function InvoicePage() {
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

  const generatePDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          ${headerImage ? `<img src="${headerImage}" style="max-width: 300px; height: auto;" />` : ''}
        </div>
        
        <div class="invoice-info">
          <div>
            <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p><strong>Customer:</strong> ${customerName}</p>
          </div>
        </div>
        
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
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>Rp ${item.price.toLocaleString()}</td>
                <td>Rp ${(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
    }
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
            <CardDescription>Upload your custom header image</CardDescription>
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
                  <Label>Preview:</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden" style={{ height: '103px' }}>
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

            <div className="flex gap-4">
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
                      <img
                        src={headerImage}
                        alt="Header"
                        className="w-full h-20 object-cover rounded"
                      />
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
