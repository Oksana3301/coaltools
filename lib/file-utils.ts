import * as XLSX from 'xlsx'

// File upload utilities
export const uploadFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      // Simulate file upload to server
      // In real implementation, this would upload to cloud storage
      const base64 = reader.result as string
      const fileUrl = `data:${file.type};base64,${base64.split(',')[1]}`
      
      // Simulate upload delay
      setTimeout(() => {
        resolve(fileUrl)
      }, 1000)
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

// Excel/CSV import utilities
export const importExcelFile = (file: File): Promise<unknown[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get first worksheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        resolve(jsonData)
      } catch (error) {
        reject(new Error('Failed to parse Excel file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

// Excel export utilities
export const exportToExcel = (data: Record<string, unknown>[], filename: string, sheetName: string = 'Sheet1') => {
  try {
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Auto-fit column widths
    const colWidths = data.length > 0 ? Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
    })) : []
    
    worksheet['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, filename)
    
    return true
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}

// CSV export utilities
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  try {
    if (data.length === 0) return false
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    return true
  } catch (error) {
    console.error('CSV export failed:', error)
    return false
  }
}

// PDF generation utilities
export const generatePDF = async (content: string, filename: string) => {
  try {
    // Using html2pdf library (would need to install)
    // For now, we'll create a simple HTML version
    const printWindow = window.open('', '_blank')
    if (!printWindow) return false
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${filename.replace('.pdf', '')}</h1>
            <p>Generated on ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="no-print" style="margin-top: 30px;">
            <button onclick="window.print()">Print PDF</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    return true
  } catch (error) {
    console.error('PDF generation failed:', error)
    return false
  }
}

// Local storage utilities for data persistence
export const saveToLocalStorage = (key: string, data: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
    return false
  }
}

export const loadFromLocalStorage = (key: string, defaultValue: unknown = null) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return defaultValue
  }
}

// File validation utilities
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => file.type.includes(type) || file.name.endsWith(type))
}

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024
}

// Excel template generators
export const generateExpenseTemplate = () => {
  const template = [
    {
      'Tanggal': '2024-01-15',
      'Hari': 'Senin',
      'Bulan': 'Januari',
      'Tipe_Aktivitas': 'Beli',
      'Barang': 'Contoh barang',
      'Banyak': 1,
      'Satuan': 'Buah',
      'Harga_Satuan': 50000,
      'Total': 50000,
      'Vendor_Nama': 'PT. Contoh',
      'Vendor_Telp': '081234567890',
      'Vendor_Email': 'vendor@contoh.com',
      'Jenis': 'Kas Kecil',
      'Sub_Jenis': 'Alat Tulis',
      'Catatan': 'Contoh catatan'
    }
  ]
  
  return exportToExcel(template, 'Template_Pengeluaran.xlsx', 'Template')
}

export const generatePayrollTemplate = () => {
  const template = [
    {
      'Nama_Karyawan': 'Budi Santoso',
      'Jabatan': 'Operator',
      'Site': 'Site A',
      'Hari_Kerja': 22,
      'Upah_Harian': 120000,
      'Uang_Makan': 20000,
      'Uang_BBM': 15000,
      'Tunjangan_Lapangan': 25000,
      'Transport_Tambahan': 150000,
      'Potongan_Kasbon': 300000,
      'Catatan': 'Contoh catatan'
    }
  ]
  
  return exportToExcel(template, 'Template_Payroll.xlsx', 'Template')
}

export const generateProductionTemplate = () => {
  const template = [
    {
      'Tanggal': '2024-01-15',
      'No_Polisi': 'B 1234 XYZ',
      'Pembeli': 'PT. Sumber Energi',
      'Tujuan': 'Stockpile A',
      'Gross_Ton': 35.680,
      'Tare_Ton': 11.000,
      'Netto_Ton': 24.680,
      'Catatan': 'Contoh catatan'
    }
  ]
  
  return exportToExcel(template, 'Template_Produksi.xlsx', 'Template')
}
