"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Save, 
  Users,
  Download,
  Edit,
  CheckCircle,
  X,
  Search,
  Filter,
  Trash2,
  UserPlus,
  FileText,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { 
  exportToExcel, 
  exportToCSV, 
  generatePDF
} from "@/lib/file-utils"
import { 
  apiService, 
  Employee, 
  formatCurrency 
} from "@/lib/api"

const getCurrentUserId = () => {
  const currentUser = getCurrentUser()
  return currentUser?.id || "cmemokbd20000ols63e1xr3f6"
}

const CURRENT_USER_ID = getCurrentUserId()

interface EmployeeForm {
  nama: string
  nik: string
  jabatan: string
  site: string
  tempatLahir: string
  tanggalLahir: string
  alamat: string
  kontrakUpahHarian: number
  defaultUangMakan: number
  defaultUangBbm: number
  bankName: string
  bankAccount: string
  npwp: string
  startDate: string
  aktif: boolean
}

const defaultEmployeeForm: EmployeeForm = {
  nama: '',
  nik: '',
  jabatan: 'Operator',
  site: 'Sawahlunto',
  tempatLahir: '',
  tanggalLahir: '',
  alamat: '',
  kontrakUpahHarian: 0,
  defaultUangMakan: 0,
  defaultUangBbm: 0,
  bankName: 'BRI',
  bankAccount: '',
  npwp: '',
  startDate: '',
  aktif: true
}

const JABATAN_OPTIONS = [
  'Manager', 'Supervisor', 'Operator', 'Driver', 'Security', 
  'Admin', 'Accounting', 'HR', 'IT Support', 'Maintenance', 
  'Quality Control', 'Warehouse', 'Sales', 'Marketing', 'Other'
]

const SITE_OPTIONS = [
  'Sawahlunto', 'Padang', 'Jakarta', 'Bandung', 'Surabaya', 
  'Medan', 'Palembang', 'Makassar', 'Other'
]

const BANK_OPTIONS = [
  'BRI', 'BCA', 'Mandiri', 'BNI', 'CIMB Niaga', 
  'Danamon', 'Panin', 'Permata', 'Other'
]

export function EmployeeManagement() {
  const { toast } = useToast()
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSite, setFilterSite] = useState('all')
  const [filterJabatan, setFilterJabatan] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(defaultEmployeeForm)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string; name: string } | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<string | null>(null)
  const [customJabatan, setCustomJabatan] = useState('')
  const [customBank, setCustomBank] = useState('')

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const response = await apiService.getEmployees({ limit: 100 })
      if (response.success) {
        setEmployees(response.data || [])
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data karyawan",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.nik && employee.nik.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSite = !filterSite || filterSite === 'all' || employee.site === filterSite
    const matchesJabatan = !filterJabatan || filterJabatan === 'all' || employee.jabatan === filterJabatan
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && employee.aktif) ||
                         (filterStatus === 'inactive' && !employee.aktif)
    
    return matchesSearch && matchesSite && matchesJabatan && matchesStatus
  })

  const openEmployeeForm = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setEmployeeForm({
        nama: employee.nama,
        nik: employee.nik || '',
        jabatan: employee.jabatan,
        site: employee.site,
        tempatLahir: employee.tempatLahir || '',
        tanggalLahir: employee.tanggalLahir || '',
        alamat: employee.alamat || '',
        kontrakUpahHarian: employee.kontrakUpahHarian,
        defaultUangMakan: employee.defaultUangMakan,
        defaultUangBbm: employee.defaultUangBbm,
        bankName: employee.bankName || 'BRI',
        bankAccount: employee.bankAccount || '',
        npwp: employee.npwp || '',
        startDate: employee.startDate || '',
        aktif: employee.aktif
      })
      // Set custom values if they're not in predefined options
      setCustomJabatan(JABATAN_OPTIONS.includes(employee.jabatan) ? '' : employee.jabatan)
      setCustomBank(BANK_OPTIONS.includes(employee.bankName || '') ? '' : employee.bankName || '')
    } else {
      setEditingEmployee(null)
      setEmployeeForm(defaultEmployeeForm)
      setCustomJabatan('')
      setCustomBank('')
    }
    setIsEmployeeFormOpen(true)
  }

  const closeEmployeeForm = () => {
    setIsEmployeeFormOpen(false)
    setEditingEmployee(null)
    setEmployeeForm(defaultEmployeeForm)
    setCustomJabatan('')
    setCustomBank('')
  }

  const updateEmployeeForm = (field: keyof EmployeeForm, value: any) => {
    setEmployeeForm(prev => ({ ...prev, [field]: value }))
  }

  const validateEmployeeForm = (): boolean => {
    if (!employeeForm.nama.trim()) {
      toast({
        title: "Nama wajib diisi",
        description: "Nama karyawan tidak boleh kosong",
        variant: "destructive"
      })
      return false
    }
    
    if (!employeeForm.jabatan.trim()) {
      toast({
        title: "Jabatan wajib diisi",
        description: "Jabatan karyawan tidak boleh kosong",
        variant: "destructive"
      })
      return false
    }
    
    if (!employeeForm.site.trim()) {
      toast({
        title: "Site wajib diisi",
        description: "Site karyawan tidak boleh kosong",
        variant: "destructive"
      })
      return false
    }
    
    if (employeeForm.kontrakUpahHarian <= 0) {
      toast({
        title: "Upah harian wajib diisi",
        description: "Upah harian harus lebih dari 0",
        variant: "destructive"
      })
      return false
    }
    
    return true
  }

  const saveEmployee = async () => {
    if (!validateEmployeeForm()) return
    
    setLoading(true)
    try {
      const employeeData = {
        ...employeeForm,
        kontrakUpahHarian: parseFloat(employeeForm.kontrakUpahHarian.toString()),
        defaultUangMakan: parseFloat(employeeForm.defaultUangMakan.toString()),
        defaultUangBbm: parseFloat(employeeForm.defaultUangBbm.toString())
      }
      
      let response
      if (editingEmployee && editingEmployee.id) {
        response = await apiService.updateEmployee({ id: editingEmployee.id, ...employeeData })
      } else {
        response = await apiService.createEmployee(employeeData)
      }
      
      if (response.success) {
        toast({
          title: editingEmployee ? "Karyawan diperbarui" : "Karyawan ditambahkan",
          description: editingEmployee 
            ? "Data karyawan berhasil diperbarui"
            : "Karyawan baru berhasil ditambahkan"
        })
        closeEmployeeForm()
        loadEmployees()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data karyawan",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteEmployee = async (id: string) => {
    setDeletingEmployee(id)
    try {
      const response = await apiService.deleteEmployee(id)
      if (response.success) {
        toast({
          title: "Karyawan dihapus",
          description: "Karyawan berhasil dihapus"
        })
        loadEmployees()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus karyawan",
        variant: "destructive"
      })
    } finally {
      setDeletingEmployee(null)
      setShowDeleteDialog(null)
    }
  }

  const exportEmployees = (format: 'excel' | 'csv' | 'pdf') => {
    const data = filteredEmployees.map(emp => ({
      'Nama': emp.nama,
      'NIK': emp.nik || '-',
      'Jabatan': emp.jabatan,
      'Site': emp.site,
      'Tempat Lahir': emp.tempatLahir || '-',
      'Tanggal Lahir': emp.tanggalLahir || '-',
      'Alamat': emp.alamat || '-',
      'Upah Harian': formatCurrency(emp.kontrakUpahHarian),
      'Uang Makan': formatCurrency(emp.defaultUangMakan),
      'Uang BBM': formatCurrency(emp.defaultUangBbm),
      'Bank': emp.bankName || '-',
      'No. Rekening': emp.bankAccount || '-',
      'NPWP': emp.npwp || '-',
      'Start Date': emp.startDate || '-',
      'Status': emp.aktif ? 'Aktif' : 'Tidak Aktif'
    }))
    
    const filename = `Data_Karyawan_${new Date().toISOString().split('T')[0]}`
    
    if (format === 'excel') {
      exportToExcel(data, filename)
    } else if (format === 'csv') {
      exportToCSV(data, filename)
    } else if (format === 'pdf') {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Data Karyawan</title>
          <style>
            @page { size: A4 portrait; margin: 20mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background: #f2f2f2; font-weight: bold; }
            .status-active { color: green; }
            .status-inactive { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DATA KARYAWAN</div>
            <div class="subtitle">PT. GLOBAL LESTARI ALAM</div>
            <div class="subtitle">Tanggal: ${new Date().toLocaleDateString('id-ID')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>NIK</th>
                <th>Jabatan</th>
                <th>Site</th>
                <th>Upah Harian</th>
                <th>Bank</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEmployees.map((emp, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${emp.nama}</td>
                  <td>${emp.nik || '-'}</td>
                  <td>${emp.jabatan}</td>
                  <td>${emp.site}</td>
                  <td>${formatCurrency(emp.kontrakUpahHarian)}</td>
                  <td>${emp.bankName || '-'}</td>
                  <td class="${emp.aktif ? 'status-active' : 'status-inactive'}">
                    ${emp.aktif ? 'Aktif' : 'Tidak Aktif'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 20px;">
            <p><strong>Total Karyawan:</strong> ${filteredEmployees.length}</p>
            <p><strong>Karyawan Aktif:</strong> ${filteredEmployees.filter(emp => emp.aktif).length}</p>
            <p><strong>Karyawan Tidak Aktif:</strong> ${filteredEmployees.filter(emp => !emp.aktif).length}</p>
          </div>
        </body>
        </html>
      `
      generatePDF(htmlContent, `${filename}.pdf`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Karyawan</h2>
          <p className="text-muted-foreground">
            Kelola data karyawan dengan informasi lengkap (Max. 100 karyawan per periode)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportEmployees('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => exportEmployees('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => openEmployeeForm()}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Karyawan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Cari Karyawan</Label>
              <Input
                id="search"
                placeholder="Nama atau NIK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filterSite">Site</Label>
              <Select value={filterSite} onValueChange={setFilterSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Site</SelectItem>
                  {SITE_OPTIONS.map(site => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterJabatan">Jabatan</Label>
              <Select value={filterJabatan} onValueChange={setFilterJabatan}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jabatan</SelectItem>
                  {JABATAN_OPTIONS.map(jabatan => (
                    <SelectItem key={jabatan} value={jabatan}>{jabatan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatus">Status</Label>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Karyawan ({filteredEmployees.length})
          </CardTitle>
          <CardDescription>
            Total {employees.length} karyawan • {employees.filter(emp => emp.aktif).length} aktif
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada karyawan ditemukan
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className={`border-2 ${employee.aktif ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{employee.nama}</h3>
                        <p className="text-sm text-muted-foreground">{employee.jabatan}</p>
                        <p className="text-xs text-muted-foreground">{employee.site}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {employee.aktif ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {employee.nik && (
                        <div><strong>NIK:</strong> {employee.nik}</div>
                      )}
                      <div><strong>Upah Harian:</strong> {formatCurrency(employee.kontrakUpahHarian)}</div>
                      {employee.bankAccount && (
                        <div><strong>Bank:</strong> {employee.bankName} - {employee.bankAccount}</div>
                      )}
                      {employee.startDate && (
                        <div><strong>Start Date:</strong> {employee.startDate}</div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEmployeeForm(employee)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => employee.id && setShowDeleteDialog({
                          id: employee.id,
                          name: employee.nama
                        })}
                        disabled={deletingEmployee === employee.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingEmployee === employee.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Form Dialog */}
      <Dialog open={isEmployeeFormOpen} onOpenChange={setIsEmployeeFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee 
                ? 'Perbarui informasi karyawan'
                : 'Masukkan informasi lengkap karyawan baru'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informasi Pribadi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    value={employeeForm.nama}
                    onChange={(e) => updateEmployeeForm('nama', e.target.value)}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <Label htmlFor="nik">NIK</Label>
                  <Input
                    id="nik"
                    value={employeeForm.nik}
                    onChange={(e) => updateEmployeeForm('nik', e.target.value)}
                    placeholder="Nomor Induk Kependudukan"
                  />
                </div>
                <div>
                  <Label htmlFor="jabatan">Jabatan *</Label>
                  <div className="space-y-2">
                    <Select 
                      value={JABATAN_OPTIONS.includes(employeeForm.jabatan) ? employeeForm.jabatan : 'custom'} 
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          setCustomJabatan(employeeForm.jabatan)
                          updateEmployeeForm('jabatan', '')
                        } else {
                          setCustomJabatan('')
                          updateEmployeeForm('jabatan', value)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jabatan atau pilih 'Custom'" />
                      </SelectTrigger>
                      <SelectContent>
                        {JABATAN_OPTIONS.map(jabatan => (
                          <SelectItem key={jabatan} value={jabatan}>{jabatan}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom (Jabatan Lain)</SelectItem>
                      </SelectContent>
                    </Select>
                    {(customJabatan || (!JABATAN_OPTIONS.includes(employeeForm.jabatan) && employeeForm.jabatan)) && (
                      <Input
                        placeholder="Masukkan jabatan custom"
                        value={customJabatan || employeeForm.jabatan}
                        onChange={(e) => {
                          const value = e.target.value
                          if (customJabatan !== '') {
                            setCustomJabatan(value)
                          }
                          updateEmployeeForm('jabatan', value)
                        }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="site">Site *</Label>
                  <Select value={employeeForm.site} onValueChange={(value) => updateEmployeeForm('site', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih site" />
                    </SelectTrigger>
                    <SelectContent>
                      {SITE_OPTIONS.map(site => (
                        <SelectItem key={site} value={site}>{site}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                  <Input
                    id="tempatLahir"
                    value={employeeForm.tempatLahir}
                    onChange={(e) => updateEmployeeForm('tempatLahir', e.target.value)}
                    placeholder="Tempat lahir"
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                  <Input
                    id="tanggalLahir"
                    type="date"
                    value={employeeForm.tanggalLahir}
                    onChange={(e) => updateEmployeeForm('tanggalLahir', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Textarea
                    id="alamat"
                    value={employeeForm.alamat}
                    onChange={(e) => updateEmployeeForm('alamat', e.target.value)}
                    placeholder="Alamat lengkap"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informasi Gaji</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="kontrakUpahHarian">Upah Harian *</Label>
                  <Input
                    id="kontrakUpahHarian"
                    type="number"
                    value={employeeForm.kontrakUpahHarian}
                    onChange={(e) => updateEmployeeForm('kontrakUpahHarian', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultUangMakan">Uang Makan Harian</Label>
                  <Input
                    id="defaultUangMakan"
                    type="number"
                    value={employeeForm.defaultUangMakan}
                    onChange={(e) => updateEmployeeForm('defaultUangMakan', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultUangBbm">Uang BBM Harian</Label>
                  <Input
                    id="defaultUangBbm"
                    type="number"
                    value={employeeForm.defaultUangBbm}
                    onChange={(e) => updateEmployeeForm('defaultUangBbm', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informasi Bank</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank</Label>
                  <div className="space-y-2">
                    <Select 
                      value={BANK_OPTIONS.includes(employeeForm.bankName) ? employeeForm.bankName : 'custom'} 
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          setCustomBank(employeeForm.bankName)
                          updateEmployeeForm('bankName', '')
                        } else {
                          setCustomBank('')
                          updateEmployeeForm('bankName', value)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bank atau pilih 'Custom'" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_OPTIONS.map(bank => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom (Bank Lain)</SelectItem>
                      </SelectContent>
                    </Select>
                    {(customBank || (!BANK_OPTIONS.includes(employeeForm.bankName) && employeeForm.bankName)) && (
                      <Input
                        placeholder="Masukkan nama bank custom"
                        value={customBank || employeeForm.bankName}
                        onChange={(e) => {
                          const value = e.target.value
                          if (customBank !== '') {
                            setCustomBank(value)
                          }
                          updateEmployeeForm('bankName', value)
                        }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="bankAccount">Nomor Rekening</Label>
                  <Input
                    id="bankAccount"
                    value={employeeForm.bankAccount}
                    onChange={(e) => updateEmployeeForm('bankAccount', e.target.value)}
                    placeholder="Nomor rekening"
                  />
                </div>
                <div>
                  <Label htmlFor="npwp">NPWP</Label>
                  <Input
                    id="npwp"
                    value={employeeForm.npwp}
                    onChange={(e) => updateEmployeeForm('npwp', e.target.value)}
                    placeholder="Nomor NPWP"
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informasi Kepegawaian</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={employeeForm.startDate}
                    onChange={(e) => updateEmployeeForm('startDate', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="aktif"
                    checked={employeeForm.aktif}
                    onChange={(e) => updateEmployeeForm('aktif', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="aktif">Karyawan Aktif</Label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={closeEmployeeForm}>
              Batal
            </Button>
            <Button onClick={saveEmployee} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingEmployee ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus karyawan <strong>{showDeleteDialog?.name}</strong>?
              <br />
              <span className="text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (showDeleteDialog) {
                  deleteEmployee(showDeleteDialog.id)
                }
              }}
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
