// API service untuk handle komunikasi dengan backend

export interface KasBesarExpense {
  id?: string
  hari: string
  tanggal: string
  bulan: string
  tipeAktivitas: string
  barang: string
  banyak: number
  satuan: string
  hargaSatuan: number
  total: number
  vendorNama: string
  vendorTelp?: string
  vendorEmail?: string
  jenis: string
  subJenis: string
  buktiUrl?: string
  kontrakUrl?: string
  status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED' | 'REJECTED'
  notes?: string
  approvalNotes?: string
  createdBy: string
  approvedBy?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  creator?: {
    id: string
    name: string
    email: string
  }
  approver?: {
    id: string
    name: string
    email: string
  }
}

export interface Kwitansi {
  id?: string
  nomorKwitansi: string
  tanggal: string
  namaPenerima: string
  jumlahUang: number
  untukPembayaran: string
  namaPembayar: string
  nomorRekening?: string
  namaRekening?: string
  bankName?: string
  transferMethod?: string
  tempat: string
  tanggalKwitansi: string
  signatureName: string
  signaturePosition: string
  materai?: string
  headerImage?: string
  payrollRunId?: string
  payrollLineId?: string
  employeeId?: string
  createdBy: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string

  creator?: {
    id: string
    name: string
    email: string
  }
  payrollRun?: {
    id: string
    periodeAwal: string
    periodeAkhir: string
    status: string
  }
  payrollLine?: {
    id: string
    employeeName: string
    neto: number
  }
  employee?: {
    id: string
    nama: string
    jabatan: string
    site: string
  }
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
  total: number
}

export interface Invoice {
  id?: string
  invoiceNumber: string
  createdDate: string
  dueDate?: string
  applicantName: string
  recipientName: string
  notes?: string
  termsConditions?: string
  headerImage?: string
  showBankDetails: boolean
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  transferMethod?: string
  signatureName?: string
  signaturePosition?: string
  signatureLocation?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  createdBy: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string

  creator?: {
    id: string
    name: string
    email: string
  }
}

export interface KasKecilExpense {
  id?: string
  hari: string
  tanggal: string
  bulan: string
  tipeAktivitas: string
  barang: string
  banyak: number
  satuan: string
  hargaSatuan: number
  total: number
  vendorNama: string
  vendorTelp?: string
  vendorEmail?: string
  jenis: string
  subJenis: string
  buktiUrl?: string
  status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED' | 'REJECTED'
  notes?: string
  approvalNotes?: string
  createdBy: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  creator?: {
    id: string
    name: string
    email: string
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface KasBesarStats {
  totalTransactions: number
  totalAmount: number
  statusBreakdown: Record<string, number>
  monthlyData: Array<{
    month: string
    count: number
    amount: number
  }>
  topVendors: Array<{
    name: string
    totalAmount: number
    transactionCount: number
  }>
  recentTransactions: Array<{
    id: string
    barang: string
    total: number
    status: string
    createdAt: string
    creatorName: string
  }>
}

// Payroll-related interfaces
export interface Employee {
  id?: string
  nama: string
  nik?: string
  jabatan: string
  site: string
  tempatLahir?: string
  tanggalLahir?: string
  alamat?: string
  kontrakUpahHarian: number
  defaultUangMakan: number
  defaultUangBbm: number
  bankName?: string
  bankAccount?: string
  npwp?: string
  startDate?: string
  aktif: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PayComponent {
  id?: string
  nama: string
  tipe: 'EARNING' | 'DEDUCTION'
  taxable: boolean
  metode: 'FLAT' | 'PER_HARI' | 'PERSENTASE'
  basis: 'UPAH_HARIAN' | 'BRUTO' | 'HARI_KERJA'
  rate?: number
  nominal?: number
  capMin?: number
  capMax?: number
  order: number
  aktif: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PayrollRun {
  id?: string
  periodeAwal: string
  periodeAkhir: string
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PAID' | 'ARCHIVED'
  createdBy: string
  approvedBy?: string
  createdAt?: string
  updatedAt?: string
  customFileName?: string // Custom filename max 1000 characters
  notes?: string
  creator?: {
    id: string
    name: string
    email: string
  }
  approver?: {
    id: string
    name: string
    email: string
  }
  payrollLines?: PayrollLine[]
}

export interface PayrollLine {
  id?: string
  payrollRunId: string
  employeeId: string
  employeeName: string
  hariKerja: number
  upahHarian: number
  uangMakanHarian: number
  uangBbmHarian: number
  bruto: number
  pajakRate?: number
  pajakNominal?: number
  potonganLain?: number
  neto: number
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PAID' | 'ARCHIVED'
  notes?: string
  createdAt?: string
  updatedAt?: string
  employee?: Employee
  components?: PayrollLineComponent[]
}

export interface PayrollLineComponent {
  id?: string
  payrollLineId: string
  componentId: string
  componentName: string
  qty?: number
  rate?: number
  nominal?: number
  amount: number
  taxable: boolean
  createdAt?: string
}

export interface ProductionReport {
  id?: string
  tanggal: string
  nopol: string
  pembeliId?: string
  pembeliNama: string
  tujuan: string
  grossTon: number
  tareTon: number
  nettoTon: number
  sourceFile?: string
  notes?: string
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED'
  createdBy: string
  approvedBy?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  creator?: {
    id: string
    name: string
    email: string
  }
  approver?: {
    id: string
    name: string
    email: string
  }
  buyer?: {
    id: string
    nama: string
    hargaPerTonDefault?: number
  }
}

export interface Buyer {
  id?: string
  nama: string
  hargaPerTonDefault?: number
  alamat?: string
  telepon?: string
  email?: string
  npwp?: string
  createdAt?: string
  updatedAt?: string
  aktif?: boolean
}

class ApiService {
  private baseUrl = '/api'

  // Helper method untuk handle fetch
  private async fetchApi<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()
      
      if (!response.ok) {
        // Handle database connection errors specifically
        if (data.code === 'DB_CONNECTION_ERROR') {
          throw new Error('Database connection failed. Please check your internet connection and try again.')
        }
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // KAS BESAR METHODS
  
  // Get all kas besar with filters
  async getKasBesar(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    userId?: string
  }): Promise<ApiResponse<KasBesarExpense[]>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.userId) searchParams.append('userId', params.userId)

    const query = searchParams.toString()
    return this.fetchApi<KasBesarExpense[]>(`/kas-besar${query ? `?${query}` : ''}`)
  }

  // Get kas besar by ID
  async getKasBesarById(id: string): Promise<ApiResponse<KasBesarExpense>> {
    return this.fetchApi<KasBesarExpense>(`/kas-besar/${id}`)
  }

  // Create new kas besar
  async createKasBesar(data: Omit<KasBesarExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<KasBesarExpense>> {
    return this.fetchApi<KasBesarExpense>('/kas-besar', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update kas besar
  async updateKasBesar(data: Partial<KasBesarExpense> & { id: string }): Promise<ApiResponse<KasBesarExpense>> {
    return this.fetchApi<KasBesarExpense>('/kas-besar', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Update kas besar status
  async updateKasBesarStatus(
    id: string, 
    status: KasBesarExpense['status'],
    approvalNotes?: string,
    approvedBy?: string
  ): Promise<ApiResponse<KasBesarExpense>> {
    return this.fetchApi<KasBesarExpense>(`/kas-besar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approvalNotes, approvedBy })
    })
  }

  // Delete kas besar
  async deleteKasBesar(id: string, userId: string): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/kas-besar?id=${id}&userId=${userId}`, {
      method: 'DELETE'
    })
  }

  // Get kas besar statistics
  async getKasBesarStats(params?: {
    userId?: string
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<KasBesarStats>> {
    const searchParams = new URLSearchParams()
    
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)

    const query = searchParams.toString()
    return this.fetchApi<KasBesarStats>(`/kas-besar/stats${query ? `?${query}` : ''}`)
  }

  // EMPLOYEE METHODS

  // Get all employees
  async getEmployees(params?: {
    page?: number
    limit?: number
    search?: string
    aktif?: boolean
  }): Promise<ApiResponse<Employee[]>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.aktif !== undefined) searchParams.append('aktif', params.aktif.toString())

    const query = searchParams.toString()
    return this.fetchApi<Employee[]>(`/employees${query ? `?${query}` : ''}`)
  }

  // Get employee by ID
  async getEmployeeById(id: string): Promise<ApiResponse<Employee>> {
    return this.fetchApi<Employee>(`/employees/${id}`)
  }

  // Create new employee
  async createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Employee>> {
    return this.fetchApi<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update employee
  async updateEmployee(data: Partial<Employee> & { id: string }): Promise<ApiResponse<Employee>> {
    return this.fetchApi<Employee>('/employees', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Delete employee (soft delete)
  async deleteEmployee(id: string, hardDelete: boolean = false): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/employees/${id}?hardDelete=${hardDelete}`, {
      method: 'DELETE'
    })
  }

  // PAY COMPONENT METHODS

  // Get all pay components
  async getPayComponents(params?: {
    tipe?: 'EARNING' | 'DEDUCTION'
    aktif?: boolean
  }): Promise<ApiResponse<PayComponent[]>> {
    const searchParams = new URLSearchParams()
    
    if (params?.tipe) searchParams.append('tipe', params.tipe)
    if (params?.aktif !== undefined) searchParams.append('aktif', params.aktif.toString())

    const query = searchParams.toString()
    return this.fetchApi<PayComponent[]>(`/pay-components${query ? `?${query}` : ''}`)
  }

  // Create new pay component
  async createPayComponent(data: Omit<PayComponent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PayComponent>> {
    return this.fetchApi<PayComponent>('/pay-components', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update pay component
  async updatePayComponent(data: Partial<PayComponent> & { id: string }): Promise<ApiResponse<PayComponent>> {
    return this.fetchApi<PayComponent>('/pay-components', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Delete pay component (soft delete by default, hard delete with force=true)
  async deletePayComponent(id: string, hardDelete: boolean = false): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/pay-components?id=${id}&force=${hardDelete}`, {
      method: 'DELETE'
    })
  }

  // PAYROLL METHODS

  // Get all payroll runs
  async getPayrollRuns(params?: {
    page?: number
    limit?: number
    status?: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PAID'
    userId?: string
  }): Promise<ApiResponse<PayrollRun[]>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.userId) searchParams.append('userId', params.userId)

    const query = searchParams.toString()
    return this.fetchApi<PayrollRun[]>(`/payroll${query ? `?${query}` : ''}`)
  }

  // Get payroll run by ID
  async getPayrollRunById(id: string): Promise<ApiResponse<PayrollRun>> {
    return this.fetchApi<PayrollRun>(`/payroll/${id}`)
  }

  // Alias for getPayrollRunById for compatibility
  async getPayrollRun(id: string): Promise<ApiResponse<PayrollRun>> {
    return this.getPayrollRunById(id)
  }

  // Dashboard summary endpoint
  async getDashboardSummary(filters: { period: string; site?: string; currency?: string }): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams({
        period: filters.period,
        site: filters.site || 'ALL',
        currency: filters.currency || 'IDR'
      })
      
      const response = await fetch(`${this.baseUrl}/api/dashboard/summary?${queryParams}`)
      return await response.json()
    } catch (error) {
      console.error('Dashboard summary API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary'
      }
    }
  }

  // Create new payroll run
  async createPayrollRun(data: {
    periodeAwal: string
    periodeAkhir: string
    createdBy: string
    employeeOverrides?: Array<{
      employeeId: string
      hariKerja: number
    }>
  }): Promise<ApiResponse<PayrollRun>> {
    return this.fetchApi<PayrollRun>('/payroll', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update payroll run
  async updatePayrollRun(data: Partial<PayrollRun> & { id: string }): Promise<ApiResponse<PayrollRun>> {
    return this.fetchApi<PayrollRun>('/payroll', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Update payroll run status
  async updatePayrollRunStatus(
    id: string, 
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED',
    approvedBy?: string,
    notes?: string
  ): Promise<ApiResponse<PayrollRun>> {
    return this.fetchApi<PayrollRun>(`/payroll/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approvedBy, notes })
    })
  }

  // Delete payroll run
  async deletePayrollRun(id: string): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/payroll?id=${id}`, {
      method: 'DELETE'
    })
  }

  // KAS KECIL METHODS

  // Get kas kecil expenses
  async getKasKecil(params?: {
    page?: number
    limit?: number
    status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED' | 'REJECTED'
    includeDeleted?: boolean
  }): Promise<ApiResponse<KasKecilExpense[]>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.includeDeleted) searchParams.append('includeDeleted', 'true')

    const query = searchParams.toString()
    return this.fetchApi<KasKecilExpense[]>(`/kas-kecil${query ? `?${query}` : ''}`)
  }

  // Get kas kecil expense by ID
  async getKasKecilById(id: string): Promise<ApiResponse<KasKecilExpense>> {
    return this.fetchApi<KasKecilExpense>(`/kas-kecil/${id}`)
  }

  // Create kas kecil expense
  async createKasKecil(data: Omit<KasKecilExpense, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'creator'>): Promise<ApiResponse<KasKecilExpense>> {
    return this.fetchApi<KasKecilExpense>('/kas-kecil', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update kas kecil expense
  async updateKasKecil(data: Partial<KasKecilExpense> & { id: string }): Promise<ApiResponse<KasKecilExpense>> {
    return this.fetchApi<KasKecilExpense>(`/kas-kecil/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Soft delete kas kecil expense
  async softDeleteKasKecil(id: string): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/kas-kecil/${id}`, {
      method: 'DELETE'
    })
  }

  // Hard delete kas kecil expense
  async hardDeleteKasKecil(id: string): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/kas-kecil/${id}?hardDelete=true`, {
      method: 'DELETE'
    })
  }

  // Restore soft deleted kas kecil expense
  async restoreKasKecil(id: string): Promise<ApiResponse<KasKecilExpense>> {
    return this.fetchApi<KasKecilExpense>(`/kas-kecil/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'restore' })
    })
  }

  // PRODUCTION REPORT METHODS

  // Get production reports
  async getProductionReports(params?: {
    page?: number
    limit?: number
    status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED'
    includeDeleted?: boolean
  }): Promise<ApiResponse<ProductionReport[]>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    if (params?.includeDeleted) searchParams.append('includeDeleted', 'true')

    const query = searchParams.toString()
    return this.fetchApi<ProductionReport[]>(`/production-reports${query ? `?${query}` : ''}`)
  }

  // Get production report by ID
  async getProductionReportById(id: string): Promise<ApiResponse<ProductionReport>> {
    return this.fetchApi<ProductionReport>(`/production-reports/${id}`)
  }

  // Create production report
  async createProductionReport(data: Omit<ProductionReport, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'creator' | 'approver' | 'buyer'>): Promise<ApiResponse<ProductionReport>> {
    return this.fetchApi<ProductionReport>('/production-reports', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update production report
  async updateProductionReport(data: Partial<ProductionReport> & { id: string }): Promise<ApiResponse<ProductionReport>> {
    return this.fetchApi<ProductionReport>(`/production-reports/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Update production report status
  async updateProductionReportStatus(
    id: string, 
    status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED',
    approvedBy?: string,
    notes?: string
  ): Promise<ApiResponse<ProductionReport>> {
    return this.fetchApi<ProductionReport>(`/production-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approvedBy, notes })
    })
  }

  // Soft delete production report
  async softDeleteProductionReport(id: string): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/production-reports/${id}`, {
      method: 'DELETE'
    })
  }

  // Hard delete production report
  async hardDeleteProductionReport(id: string): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/production-reports/${id}?hardDelete=true`, {
      method: 'DELETE'
    })
  }

  // BUYER METHODS

  // Get all buyers
  async getBuyers(): Promise<ApiResponse<Buyer[]>> {
    return this.fetchApi<Buyer[]>('/buyers')
  }

  // Create buyer
  async createBuyer(data: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Buyer>> {
    return this.fetchApi<Buyer>('/buyers', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update buyer
  async updateBuyer(data: Partial<Buyer> & { id: string }): Promise<ApiResponse<Buyer>> {
    return this.fetchApi<Buyer>(`/buyers/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Delete buyer (soft delete)
  async deleteBuyer(id: string, hardDelete: boolean = false): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/buyers/${id}?hardDelete=${hardDelete}`, {
      method: 'DELETE'
    })
  }

  // USER METHODS

  // Get all users
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.fetchApi<any[]>('/users')
  }

  // Create new user
  async createUser(data: {
    name: string
    email: string
    role?: 'admin' | 'user' | 'approver'
  }): Promise<ApiResponse<any>> {
    return this.fetchApi<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // KWITANSI METHODS

  // Get all kwitansi with search and filters
  async getKwitansi(params?: {
    page?: number
    limit?: number
    search?: string
    createdBy?: string
    dateFrom?: string
    dateTo?: string
    payrollRunId?: string
    employeeId?: string
  }): Promise<ApiResponse<Kwitansi[]>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.createdBy) searchParams.append('createdBy', params.createdBy)
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo)
    if (params?.payrollRunId) searchParams.append('payrollRunId', params.payrollRunId)
    if (params?.employeeId) searchParams.append('employeeId', params.employeeId)

    const query = searchParams.toString()
    return this.fetchApi<Kwitansi[]>(`/kwitansi${query ? `?${query}` : ''}`)
  }

  // Create new kwitansi
  async createKwitansi(data: Omit<Kwitansi, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Kwitansi>> {
    return this.fetchApi<Kwitansi>('/kwitansi', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update kwitansi
  async updateKwitansi(data: Partial<Kwitansi> & { id: string }): Promise<ApiResponse<Kwitansi>> {
    return this.fetchApi<Kwitansi>('/kwitansi', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Delete kwitansi (soft delete by default, hard delete with force=true)
  async deleteKwitansi(id: string, hardDelete: boolean = false): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/kwitansi?id=${id}&force=${hardDelete}`, {
      method: 'DELETE'
    })
  }

  // INVOICE METHODS

  // Get all invoices with search and filters
  async getInvoices(params?: {
    page?: number
    limit?: number
    search?: string
    createdBy?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ApiResponse<Invoice[]>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.createdBy) searchParams.append('createdBy', params.createdBy)
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo)

    const query = searchParams.toString()
    return this.fetchApi<Invoice[]>(`/invoices${query ? `?${query}` : ''}`)
  }

  // Create new invoice
  async createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Invoice>> {
    return this.fetchApi<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Update invoice
  async updateInvoice(data: Partial<Invoice> & { id: string }): Promise<ApiResponse<Invoice>> {
    return this.fetchApi<Invoice>('/invoices', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Delete invoice (soft delete by default, hard delete with force=true)
  async deleteInvoice(id: string, hardDelete: boolean = false): Promise<ApiResponse<null>> {
    return this.fetchApi<null>(`/invoices?id=${id}&force=${hardDelete}`, {
      method: 'DELETE'
    })
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Helper hooks untuk React Query (opsional)
export const useKasBesarQuery = (params?: Parameters<typeof apiService.getKasBesar>[0]) => {
  // Implementasi dengan React Query jika diperlukan
}

// Helper untuk format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Helper untuk format date
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

// Helper untuk status translation
export const getStatusLabel = (status: string): string => {
  const statusLabels = {
    DRAFT: 'Draft',
    SUBMITTED: 'Disubmit',
    REVIEWED: 'Direview',
    APPROVED: 'Disetujui',
    ARCHIVED: 'Diarsip',
    REJECTED: 'Ditolak',
    PAID: 'Dibayar'
  }
  return statusLabels[status as keyof typeof statusLabels] || status
}