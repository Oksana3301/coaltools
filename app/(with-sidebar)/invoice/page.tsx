'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Receipt, Download, Save, Edit, Plus, Trash2, FileText, Eye, Image, Building2, Calendar, User, DollarSign, CreditCard, MapPin, Phone, Mail, X, Maximize, Upload, ImageIcon } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth"

export default function InvoicePage() {
  const { toast } = useToast()
  const [headerImage, setHeaderImage] = useState<string>('')
  const [headerImageName, setHeaderImageName] = useState<string>('')
  
  // Data management state
  const [savedInvoices, setSavedInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showDataManagement, setShowDataManagement] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001/2025')
  const [createdDate, setCreatedDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [applicantName, setApplicantName] = useState('PT. GLOBAL LESTARI ALAM')
  const [recipientName, setRecipientName] = useState('')
  const [notes, setNotes] = useState('')
  const [termsAndConditions, setTermsAndConditions] = useState('')
  const [transferProofs, setTransferProofs] = useState<Array<{ file: File; keterangan: string; title: string }>>([])
  const [buktiNotaImages, setBuktiNotaImages] = useState<Array<{ file: File; name: string; preview: string }>>([])
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
  const [items, setItems] = useState<any[]>([])
  
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')



  // Load saved invoices data
  const loadSavedInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = getCurrentUser()
      if (!currentUser?.id) {
        // Don't block the page if no user - just set empty data
        setSavedInvoices([])
        return
      }

      const response = await apiService.getInvoices({
        limit: 100,
        createdBy: currentUser.id,
        search: searchTerm || undefined,
        dateFrom: dateFilter || undefined,
        dateTo: dateFilter || undefined
      })

      if (response.success) {
        setSavedInvoices(response.data || [])
      } else {
        // Don't block the page on API error - just show empty state
        setSavedInvoices([])
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      // Don't block the page on error - just show empty state
      setSavedInvoices([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, dateFilter])

  // Load saved invoices data on component mount and when search/filter changes
  useEffect(() => {
    try {
      loadSavedInvoices()
    } catch (error) {
      console.error('Error in useEffect:', error)
      setLoading(false) // Ensure loading state is cleared even on error
    }
  }, [searchTerm, dateFilter]) // Only depend on search and filter, not the function itself

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

  const handleBuktiNotaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp']
      return validTypes.includes(file.type)
    })
    
    if (buktiNotaImages.length + validFiles.length > 4) {
      toast({
        title: "Error",
        description: "Maksimal 4 gambar per halaman",
        variant: "destructive"
      })
      return
    }
    
    validFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File terlalu besar",
          description: `File ${file.name} melebihi batas 5MB`,
          variant: "destructive"
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setBuktiNotaImages(prev => [...prev, {
          file: file,
          name: file.name,
          preview: e.target?.result as string
        }])
      }
      reader.readAsDataURL(file)
    })

    event.target.value = ''
  }

  const removeBuktiNotaImage = (index: number) => {
    setBuktiNotaImages(prev => prev.filter((_, i) => i !== index))
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

  const generateInvoiceHTML = async () => {
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
            margin: 10mm;
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            font-size: 10px;
            line-height: 1.3;
            width: 210mm;
            max-width: 210mm;
            height: 148.5mm;
            max-height: 148.5mm;
            overflow: hidden;
          }
          .header-image { 
            width: 100%; 
            height: 60px; 
            background-color: #f9fafb; 
            border-bottom: 1px solid #e5e7eb; 
            margin-bottom: 10px; 
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
            margin-bottom: 10px;
          }
          .separator-line {
            border: none;
            height: 1px;
            background-color: #000;
            margin: 0 15px 2px 15px;
          }
          .page-container {
            width: 210mm;
            height: 148.5mm;
            max-height: 148.5mm;
            overflow: hidden;
            box-sizing: border-box;
          }
          .content {
            padding: 0 10px;
            max-height: calc(148.5mm - 20mm);
            overflow: hidden;
          }
          .title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 8px;
            color: black;
          }
          .invoice-info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 12px;
            padding: 8px;
            background-color: #f9f9f9;
            border-radius: 3px;
            font-size: 9px;
          }
          .parties-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px;
            background-color: #f0f8ff;
            border-radius: 3px;
            font-size: 9px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 10px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 4px; 
            text-align: left; 
            font-size: 8px;
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .total-section {
            text-align: right;
            margin-top: 10px;
            padding: 8px;
            background-color: #f9f9f9;
            border-radius: 3px;
            font-size: 9px;
          }
          .total-amount {
            font-size: 11px;
            font-weight: bold;
            color: #000;
          }
          .notes-section {
            margin-top: 10px;
            padding: 8px;
            background-color: #fff8dc;
            border-radius: 3px;
            font-size: 8px;
          }
          .terms-section {
            margin-top: 10px;
            padding: 8px;
            background-color: #f0f0f0;
            border-radius: 3px;
            font-size: 8px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
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
            <div class="title">INVOICE</div>
          
          <div class="invoice-info">
            <div>
              <p><strong>Nomor Invoice:</strong> ${invoiceNumber || 'INV-001'}</p>
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
        </div>
        
        ${base64Files.length > 0 ? `
          <div style="page-break-before: always; page-break-after: always;">
            <div style="padding: 15mm;">
              <div style="text-align: center; font-size: 24px; font-weight: bold; text-decoration: underline; margin-bottom: 30px; color: black;">
                BUKTI TRANSFER & NOTA
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; margin-top: 20px;">
                ${base64Files.slice(0, 4).map((proof, index) => `
                  <div style="border: 2px solid #333; padding: 15px; text-align: center; background-color: #fafafa; border-radius: 8px; min-height: 350px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-weight: bold; margin-bottom: 15px; color: #333; font-size: 16px; text-transform: uppercase;">
                      ${proof.title || `Bukti Transfer ${index + 1}`}
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                      <img src="${proof.base64}" alt="Bukti Transfer ${index + 1}" style="max-width: 100%; max-height: 280px; object-fit: contain; border: 1px solid #ccc; background-color: white; border-radius: 4px;" />
                    </div>
                    ${proof.keterangan ? `<div style="margin-top: 12px; font-size: 14px; color: #555; font-style: italic;">${proof.keterangan}</div>` : ''}
                  </div>
                `).join('')}
              </div>
              ${base64Files.length > 4 ? `
                <div style="page-break-before: always; padding-top: 30px;">
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;">
                    ${base64Files.slice(4, 8).map((proof, index) => `
                      <div style="border: 2px solid #333; padding: 15px; text-align: center; background-color: #fafafa; border-radius: 8px; min-height: 350px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="font-weight: bold; margin-bottom: 15px; color: #333; font-size: 16px; text-transform: uppercase;">
                          ${proof.title || `Bukti Transfer ${index + 5}`}
                        </div>
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                          <img src="${proof.base64}" alt="Bukti Transfer ${index + 5}" style="max-width: 100%; max-height: 280px; object-fit: contain; border: 1px solid #ccc; background-color: white; border-radius: 4px;" />
                        </div>
                        ${proof.keterangan ? `<div style="margin-top: 12px; font-size: 14px; color: #555; font-style: italic;">${proof.keterangan}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              ${base64Files.length > 8 ? `
                <div style="page-break-before: always; padding-top: 30px;">
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;">
                    ${base64Files.slice(8, 10).map((proof, index) => `
                      <div style="border: 2px solid #333; padding: 15px; text-align: center; background-color: #fafafa; border-radius: 8px; min-height: 350px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="font-weight: bold; margin-bottom: 15px; color: #333; font-size: 16px; text-transform: uppercase;">
                          ${proof.title || `Bukti Transfer ${index + 9}`}
                        </div>
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
                          <img src="${proof.base64}" alt="Bukti Transfer ${index + 9}" style="max-width: 100%; max-height: 280px; object-fit: contain; border: 1px solid #ccc; background-color: white; border-radius: 4px;" />
                        </div>
                        ${proof.keterangan ? `<div style="margin-top: 12px; font-size: 14px; color: #555; font-style: italic;">${proof.keterangan}</div>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `
    
    return htmlContent
  }

  const showPreviewModal = async () => {
    try {
      const html = await generateInvoiceHTML()
      setPreviewHtml(html)
      setShowPreview(true)
    } catch (error) {
      console.error('Error generating preview:', error)
      toast({
        title: "Error",
        description: "Gagal membuat preview invoice",
        variant: "destructive"
      })
    }
  }

  const printFromPreview = () => {
    const filename = getGeneratedFilename()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(previewHtml)
      printWindow.document.close()
      printWindow.document.title = filename
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
      
      toast({
        title: "Invoice berhasil dibuat",
        description: `Invoice telah di-generate dengan nama: ${filename}`
      })
      setShowPreview(false)
    }
  }

  const generatePDF = async () => {
    // Legacy function for direct print (keeping for backward compatibility)
    await showPreviewModal()
  }

  const saveInvoice = async () => {
    // Saving invoice with validation
    
    // Validate required fields
    if (!invoiceNumber || !applicantName || !recipientName || items.length === 0) {
      // Validation failed - missing required fields
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi dan tambahkan minimal satu item",
        variant: "destructive"
      })
      return
    }

    try {
      const currentUser = getCurrentUser()
      // Checking current user
      
      if (!currentUser?.id) {
        // No user logged in
        toast({
          title: "Info",
          description: "Fitur simpan data memerlukan login. Anda masih bisa menggunakan generator untuk membuat PDF.",
          variant: "default"
        })
        return
      }
      
      // User authenticated

      const invoiceData = {
        invoiceNumber,
        createdDate,
        dueDate: dueDate || undefined,
        applicantName,
        recipientName,
        notes: notes || undefined,
        termsConditions: termsAndConditions || undefined,
        headerImage: headerImage || undefined,
        showBankDetails,
        bankName: showBankDetails ? bankDetails.bankName : undefined,
        accountNumber: showBankDetails ? bankDetails.accountNumber : undefined,
        accountHolder: showBankDetails ? bankDetails.accountHolder : undefined,
        transferMethod: showBankDetails ? bankDetails.transferMethod : undefined,
        signatureName: signatureInfo?.name || undefined,
        signaturePosition: signatureInfo?.position || undefined,
        signatureLocation: signatureInfo?.place || undefined,
        items: items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: calculateItemTotal(item)
        })),
        subtotal: calculateSubtotal(),
        discount: calculateTotalDiscount(),
        tax: calculateTotalTax(),
        total: calculateGrandTotal(),
        createdBy: currentUser.id
      }

      // Sending invoice data to API
      
      const response = await apiService.createInvoice(invoiceData)
      
      // API response received

      if (response.success) {
        // Invoice saved successfully
        toast({
          title: "Berhasil",
          description: "Invoice berhasil disimpan"
        })
        // Refresh the data list
        loadSavedInvoices()
      } else {
        // Save failed
        toast({
          title: "Error",
          description: response.error || "Gagal menyimpan invoice",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan invoice",
        variant: "destructive"
      })
    }
  }

  // Edit invoice
  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice)
    // Populate form with existing data
    setInvoiceNumber(invoice.invoiceNumber)
    setCreatedDate(invoice.createdDate)
    setDueDate(invoice.dueDate || '')
    setApplicantName(invoice.applicantName)
    setRecipientName(invoice.recipientName)
    setNotes(invoice.notes || '')
    setTermsAndConditions(invoice.termsConditions || '')
    setShowBankDetails(invoice.showBankDetails)
    if (invoice.headerImage) {
      setHeaderImage(invoice.headerImage)
    }
    if (invoice.bankName) {
      setBankDetails({
        bankName: invoice.bankName,
        accountNumber: invoice.accountNumber || '',
        accountHolder: invoice.accountHolder || '',
        transferMethod: invoice.transferMethod || 'Transfer ke rekening'
      })
    }
    if (invoice.signatureName) {
      setSignatureInfo({
        name: invoice.signatureName,
        position: invoice.signaturePosition || '',
        place: invoice.signatureLocation || '',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      })
    }
    setItems(invoice.items || [])
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Update invoice
  const updateInvoice = async () => {
    if (!editingInvoice) return

    try {
      const invoiceData = {
        id: editingInvoice.id,
        invoiceNumber,
        createdDate,
        dueDate: dueDate || undefined,
        applicantName,
        recipientName,
        notes: notes || undefined,
        termsConditions: termsAndConditions || undefined,
        headerImage: headerImage || undefined,
        showBankDetails,
        bankName: showBankDetails ? bankDetails.bankName : undefined,
        accountNumber: showBankDetails ? bankDetails.accountNumber : undefined,
        accountHolder: showBankDetails ? bankDetails.accountHolder : undefined,
        transferMethod: showBankDetails ? bankDetails.transferMethod : undefined,
        signatureName: signatureInfo?.name || undefined,
        signaturePosition: signatureInfo?.position || undefined,
        signatureLocation: signatureInfo?.place || undefined,
        items: items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: calculateItemTotal(item)
        })),
        subtotal: calculateSubtotal(),
        discount: calculateTotalDiscount(),
        tax: calculateTotalTax(),
        total: calculateGrandTotal()
      }

      const response = await apiService.updateInvoice(invoiceData)

      if (response.success) {
        toast({
          title: "Berhasil",
          description: "Invoice berhasil diupdate"
        })
        setEditingInvoice(null)
        loadSavedInvoices()
        
        // Clear form
        clearForm()
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal mengupdate invoice",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengupdate invoice",
        variant: "destructive"
      })
    }
  }

  // Delete invoice
  const deleteInvoice = async (id: string, hardDelete: boolean = false) => {
    try {
      const response = await apiService.deleteInvoice(id, hardDelete)

      if (response.success) {
        toast({
          title: "Berhasil",
          description: hardDelete ? "Invoice berhasil dihapus permanen" : "Invoice berhasil dihapus"
        })
        loadSavedInvoices()
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal menghapus invoice",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus invoice",
        variant: "destructive"
      })
    }
  }

  // Clear form
  const clearForm = () => {
    setInvoiceNumber('INV-001/2025')
    setCreatedDate(new Date().toISOString().split('T')[0])
    setDueDate('')
    setApplicantName('PT. GLOBAL LESTARI ALAM')
    setRecipientName('')
    setNotes('')
    setTermsAndConditions('')
    setHeaderImage('')
    setItems([])
    setEditingInvoice(null)
  }









  // Generate Invoice PDF
  const generateInvoice = async () => {
    // Validate required fields
    if (!invoiceNumber || !applicantName || !recipientName) {
      toast({
        title: "Error",
        description: "Mohon lengkapi field Invoice Number, Pemohon, dan Penerima",
        variant: "destructive"
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Error", 
        description: "Mohon tambahkan minimal satu item",
        variant: "destructive"
      })
      return
    }

    // Validate only items that have some content
    const invalidItems = items.filter(item => 
      (item.description && (!item.description.trim() || item.quantity <= 0 || item.price <= 0)) ||
      (!item.description && (item.quantity > 0 || item.price > 0))
    )
    
    if (invalidItems.length > 0) {
      toast({
        title: "Error", 
        description: "Mohon pastikan semua item yang diisi memiliki deskripsi, quantity > 0, dan harga > 0",
        variant: "destructive"
      })
      return
    }

    // Generate the invoice PDF
    await openFullScreenPreview()
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
      description: `Preview invoice telah dibuka di tab baru dengan nama: ${filename}`
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

        <Tabs defaultValue="invoice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoice Generator
            </TabsTrigger>
            <TabsTrigger value="bukti-nota" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              BUKTI NOTA DAN TRANSAKSI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-8">
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
              <Button onClick={() => editingInvoice ? updateInvoice() : saveInvoice()} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Save className="h-4 w-4 mr-2" />
                {editingInvoice ? 'Update Data' : 'Simpan Data'}
              </Button>
              {editingInvoice && (
                <Button onClick={() => clearForm()} variant="outline" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Batal Edit
                </Button>
              )}
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
          </TabsContent>

          <TabsContent value="bukti-nota" className="space-y-8">
            <div className="max-w-6xl mx-auto">
              {/* BUKTI NOTA DAN TRANSAKSI Header */}
              <Card className="border-2 border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b-2 border-purple-200">
                  <CardTitle className="flex items-center gap-3 text-xl text-purple-800">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    BUKTI NOTA DAN TRANSAKSI
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    Upload bukti nota dan transaksi (maksimal 4 gambar per halaman)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* Upload Section */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bukti-nota-upload" className="text-base font-medium">
                        Upload Gambar Bukti Nota dan Transaksi
                      </Label>
                      <Input
                        id="bukti-nota-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleBuktiNotaUpload}
                        className="mt-2"
                        disabled={buktiNotaImages.length >= 4}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Format yang didukung: JPG, JPEG, PNG, SVG, GIF, WEBP (maksimal 4 gambar, 5MB per file)
                      </p>
                      <p className="text-sm text-purple-600 mt-1">
                        {buktiNotaImages.length}/4 gambar terupload
                      </p>
                    </div>

                    {buktiNotaImages.length < 4 && (
                      <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-purple-50">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                            <Upload className="h-8 w-8 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-purple-800 mb-2">
                              Upload Bukti Nota dan Transaksi
                            </h3>
                            <p className="text-purple-600 mb-4">
                              Klik tombol di atas untuk mengunggah gambar atau seret file ke sini
                            </p>
                            <p className="text-sm text-purple-500">
                              Gambar akan ditampilkan dalam format grid 2x2
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Images Display Grid */}
                  {buktiNotaImages.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Gambar Terupload ({buktiNotaImages.length}/4)
                        </h3>
                        {buktiNotaImages.length === 4 && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Halaman Penuh
                          </Badge>
                        )}
                      </div>
                      
                      {/* Grid Display (2x2) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {buktiNotaImages.map((image, index) => (
                          <Card key={index} className="border-2 border-gray-200 hover:border-purple-300 transition-colors">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Image Preview */}
                                <div className="relative group">
                                  <div className="aspect-square w-full border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                    <img
                                      src={image.preview}
                                      alt={`Bukti Nota ${index + 1}`}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                      onClick={() => {
                                        // Open image in fullscreen
                                        const newWindow = window.open('', '_blank')
                                        if (newWindow) {
                                          newWindow.document.write(`
                                            <html>
                                              <head><title>${image.name}</title></head>
                                              <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                                                <img src="${image.preview}" style="max-width:100%; max-height:100%; object-fit:contain;" />
                                              </body>
                                            </html>
                                          `)
                                        }
                                      }}
                                    />
                                  </div>
                                  {/* Remove Button */}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeBuktiNotaImage(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                {/* File Name */}
                                <div className="space-y-1">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Nama File:
                                  </Label>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border break-all">
                                    {image.name}
                                  </p>
                                </div>
                                
                                {/* Image Info */}
                                <div className="text-xs text-gray-500 flex justify-between">
                                  <span>Gambar {index + 1}</span>
                                  <span>{(image.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-4 border-t">
                        <Button 
                          onClick={() => setBuktiNotaImages([])}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus Semua
                        </Button>
                        <Button 
                          onClick={() => {
                            // Generate PDF or print view
                            const printContent = `
                              <div style="text-align: center; margin-bottom: 30px;">
                                <h2 style="font-size: 24px; font-weight: bold; text-decoration: underline;">
                                  BUKTI NOTA DAN TRANSAKSI
                                </h2>
                              </div>
                              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                                ${buktiNotaImages.map((image, index) => `
                                  <div style="border: 1px solid #ddd; padding: 15px; text-align: center;">
                                    <img src="${image.preview}" style="max-width: 100%; height: 300px; object-fit: contain; margin-bottom: 10px;" />
                                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                                      Gambar ${index + 1}
                                    </div>
                                    <div style="font-size: 12px; color: #666; word-break: break-all;">
                                      ${image.name}
                                    </div>
                                  </div>
                                `).join('')}
                              </div>
                            `
                            
                            const printWindow = window.open('', '_blank')
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>BUKTI NOTA DAN TRANSAKSI</title>
                                    <style>
                                      @page { size: A4; margin: 20mm; }
                                      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                                    </style>
                                  </head>
                                  <body>
                                    ${printContent}
                                  </body>
                                </html>
                              `)
                              printWindow.document.close()
                              setTimeout(() => printWindow.print(), 500)
                            }
                          }}
                          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                          disabled={buktiNotaImages.length === 0}
                        >
                          <Download className="h-4 w-4" />
                          Cetak / Download PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={generateInvoice}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            disabled={!invoiceNumber || !applicantName || !recipientName || items.length === 0}
          >
            <Download className="h-5 w-5" />
            Generate PDF Invoice
          </Button>
          
          <Button
            onClick={editingInvoice ? updateInvoice : saveInvoice}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3"
            disabled={!invoiceNumber || !applicantName || !recipientName || items.length === 0}
          >
            <Save className="h-5 w-5" />
            {editingInvoice ? 'Update Data' : 'Simpan Data'}
          </Button>
          
          <Button
            onClick={clearForm}
            variant="outline"
            className="flex items-center gap-2 px-6 py-3"
          >
            <X className="h-5 w-5" />
            Clear Form
          </Button>
        </div>

        {/* Data Management Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Data Invoice Tersimpan</h2>
            <Button
              onClick={() => setShowDataManagement(!showDataManagement)}
              variant="outline"
            >
              {showDataManagement ? 'Sembunyikan' : 'Tampilkan'} Data ({savedInvoices.length}/100)
            </Button>
          </div>

          {showDataManagement && (
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <CardTitle>Manajemen Data Invoice</CardTitle>
                    <CardDescription>
                      Kelola semua invoice yang telah dibuat. Maksimal 100 data.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cari invoice..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Memuat data...</p>
                  </div>
                ) : savedInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada invoice tersimpan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedInvoices.map((invoice, index) => (
                      <Card key={invoice.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                                <Badge variant="outline">
                                  Rp {new Intl.NumberFormat('id-ID').format(invoice.total)}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-1">
                                <strong>Pemohon:</strong> {invoice.applicantName}
                              </p>
                              <p className="text-gray-600 mb-1">
                                <strong>Penerima:</strong> {invoice.recipientName}
                              </p>
                              <p className="text-gray-600 mb-1">
                                <strong>Tanggal:</strong> {new Date(invoice.createdDate).toLocaleDateString('id-ID')}
                              </p>
                              {invoice.dueDate && (
                                <p className="text-gray-600 mb-1">
                                  <strong>Jatuh Tempo:</strong> {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                                </p>
                              )}
                              <p className="text-sm text-gray-500">
                                Dibuat: {new Date(invoice.createdAt).toLocaleDateString('id-ID')} 
                                {new Date(invoice.createdAt).toLocaleTimeString('id-ID')}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setViewingInvoice(invoice)}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditInvoice(invoice)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => deleteInvoice(invoice.id, false)}
                                title="Hapus (Soft Delete)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* View Modal */}
        {viewingInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">Detail Invoice</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingInvoice(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div><strong>Nomor Invoice:</strong> {viewingInvoice.invoiceNumber}</div>
                  <div><strong>Tanggal Dibuat:</strong> {new Date(viewingInvoice.createdDate).toLocaleDateString('id-ID')}</div>
                  {viewingInvoice.dueDate && (
                    <div><strong>Jatuh Tempo:</strong> {new Date(viewingInvoice.dueDate).toLocaleDateString('id-ID')}</div>
                  )}
                  <div><strong>Pemohon:</strong> {viewingInvoice.applicantName}</div>
                  <div><strong>Penerima:</strong> {viewingInvoice.recipientName}</div>
                  {viewingInvoice.notes && (
                    <div><strong>Catatan:</strong> {viewingInvoice.notes}</div>
                  )}
                  {viewingInvoice.termsConditions && (
                    <div><strong>Syarat & Ketentuan:</strong> {viewingInvoice.termsConditions}</div>
                  )}
                  <div className="mt-4">
                    <strong>Item:</strong>
                    <div className="mt-2 space-y-2">
                      {Array.isArray(viewingInvoice.items) ? viewingInvoice.items.map((item: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded">
                          <div>{item.description}</div>
                          <div className="text-sm text-gray-600">
                            Qty: {item.quantity} × Rp {new Intl.NumberFormat('id-ID').format(item.price)} = 
                            Rp {new Intl.NumberFormat('id-ID').format(item.total)}
                          </div>
                        </div>
                      )) : (
                        <div className="text-gray-500">Data item tidak tersedia</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <div><strong>Subtotal:</strong> Rp {new Intl.NumberFormat('id-ID').format(viewingInvoice.subtotal)}</div>
                    <div><strong>Diskon:</strong> Rp {new Intl.NumberFormat('id-ID').format(viewingInvoice.discount)}</div>
                    <div><strong>Pajak:</strong> Rp {new Intl.NumberFormat('id-ID').format(viewingInvoice.tax)}</div>
                    <div className="text-lg font-bold"><strong>Total:</strong> Rp {new Intl.NumberFormat('id-ID').format(viewingInvoice.total)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => {
                      handleEditInvoice(viewingInvoice)
                      setViewingInvoice(null)
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => setViewingInvoice(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Preview Invoice (Half A4 Portrait)</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-gray-100">
                <div className="mx-auto bg-white shadow-lg border-2 border-gray-300" style={{ width: '210mm', height: '148.5mm' }}>
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    style={{ width: '210mm', height: '148.5mm' }}
                    title="Invoice Preview"
                  />
                </div>
              </div>
              <div className="p-4 border-t flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button
                  onClick={printFromPreview}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print/Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
