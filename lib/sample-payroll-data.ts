/**
 * Sample data untuk testing sistem payroll terintegrasi
 * Berisi data lengkap untuk 2 karyawan dengan semua komponen payroll
 */

/**
 * Interface untuk sample employee data
 */
export interface SampleEmployee {
  id: string
  nama: string
  posisi: string
  departemen: string
  tanggalMasuk: string
  upahHarian: number
  hariKerja: number
  overtimeHours: number
  overtimeRate: number
  cashbon: number
  components: SamplePayComponent[]
}

/**
 * Interface untuk sample pay component
 */
export interface SamplePayComponent {
  id: string
  nama: string
  tipe: 'EARNING' | 'DEDUCTION'
  metode: 'FLAT' | 'PER_HARI' | 'PERSENTASE'
  basis: 'UPAH_HARIAN' | 'BRUTO' | 'HARI_KERJA'
  rate?: number
  nominal?: number
  taxable: boolean
  aktif: boolean
}

/**
 * Interface untuk company info sample
 */
export interface SampleCompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  taxId: string
  logo?: string
}

/**
 * Interface untuk payroll period sample
 */
export interface SamplePayrollPeriod {
  periodeAwal: string
  periodeAkhir: string
  month: number
  year: number
  description: string
}

/**
 * Sample Pay Components - Komponen gaji standar
 */
export const SAMPLE_PAY_COMPONENTS: SamplePayComponent[] = [
  // EARNINGS - Pendapatan
  {
    id: 'comp-001',
    nama: 'Uang Makan Harian',
    tipe: 'EARNING',
    metode: 'PER_HARI',
    basis: 'HARI_KERJA',
    rate: 25000,
    taxable: false,
    aktif: true
  },
  {
    id: 'comp-002',
    nama: 'Uang BBM Harian',
    tipe: 'EARNING',
    metode: 'PER_HARI',
    basis: 'HARI_KERJA',
    rate: 15000,
    taxable: false,
    aktif: true
  },
  {
    id: 'comp-003',
    nama: 'Tunjangan Jabatan',
    tipe: 'EARNING',
    metode: 'PERSENTASE',
    basis: 'UPAH_HARIAN',
    rate: 20, // 20% dari upah harian
    taxable: true,
    aktif: true
  },
  {
    id: 'comp-004',
    nama: 'Tunjangan Kehadiran',
    tipe: 'EARNING',
    metode: 'FLAT',
    basis: 'UPAH_HARIAN',
    nominal: 200000,
    taxable: true,
    aktif: true
  },
  {
    id: 'comp-005',
    nama: 'Bonus Produktivitas',
    tipe: 'EARNING',
    metode: 'PERSENTASE',
    basis: 'BRUTO',
    rate: 5, // 5% dari bruto
    taxable: true,
    aktif: true
  },
  
  // DEDUCTIONS - Potongan
  {
    id: 'comp-006',
    nama: 'BPJS Kesehatan',
    tipe: 'DEDUCTION',
    metode: 'PERSENTASE',
    basis: 'UPAH_HARIAN',
    rate: 1, // 1% dari upah harian
    taxable: false,
    aktif: true
  },
  {
    id: 'comp-007',
    nama: 'BPJS Ketenagakerjaan',
    tipe: 'DEDUCTION',
    metode: 'PERSENTASE',
    basis: 'UPAH_HARIAN',
    rate: 2, // 2% dari upah harian
    taxable: false,
    aktif: true
  },
  {
    id: 'comp-008',
    nama: 'Iuran Koperasi',
    tipe: 'DEDUCTION',
    metode: 'FLAT',
    basis: 'UPAH_HARIAN',
    nominal: 50000,
    taxable: false,
    aktif: true
  }
]

/**
 * Sample Employees - 2 karyawan lengkap untuk testing
 */
export const SAMPLE_EMPLOYEES: SampleEmployee[] = [
  {
    id: 'emp-001',
    nama: 'Ahmad Wijaya',
    posisi: 'Manager Operasional',
    departemen: 'Operasional',
    tanggalMasuk: '2022-01-15',
    upahHarian: 500000,
    hariKerja: 26,
    overtimeHours: 12,
    overtimeRate: 1.5,
    cashbon: 1000000,
    components: [
      SAMPLE_PAY_COMPONENTS[0], // Uang Makan
      SAMPLE_PAY_COMPONENTS[1], // Uang BBM
      SAMPLE_PAY_COMPONENTS[2], // Tunjangan Jabatan
      SAMPLE_PAY_COMPONENTS[3], // Tunjangan Kehadiran
      SAMPLE_PAY_COMPONENTS[4], // Bonus Produktivitas
      SAMPLE_PAY_COMPONENTS[5], // BPJS Kesehatan
      SAMPLE_PAY_COMPONENTS[6], // BPJS Ketenagakerjaan
      SAMPLE_PAY_COMPONENTS[7]  // Iuran Koperasi
    ]
  },
  {
    id: 'emp-002',
    nama: 'Siti Nurhaliza',
    posisi: 'Staff Administrasi',
    departemen: 'HRD',
    tanggalMasuk: '2023-03-10',
    upahHarian: 300000,
    hariKerja: 24,
    overtimeHours: 8,
    overtimeRate: 1.5,
    cashbon: 500000,
    components: [
      SAMPLE_PAY_COMPONENTS[0], // Uang Makan
      SAMPLE_PAY_COMPONENTS[1], // Uang BBM
      SAMPLE_PAY_COMPONENTS[3], // Tunjangan Kehadiran
      SAMPLE_PAY_COMPONENTS[5], // BPJS Kesehatan
      SAMPLE_PAY_COMPONENTS[6], // BPJS Ketenagakerjaan
      SAMPLE_PAY_COMPONENTS[7]  // Iuran Koperasi
    ]
  }
]

/**
 * Sample Company Info
 */
export const SAMPLE_COMPANY_INFO: SampleCompanyInfo = {
  name: 'PT. Coal Mining Indonesia',
  address: 'Jl. Industri Pertambangan No. 123, Jakarta Selatan 12345',
  phone: '+62 21 1234 5678',
  email: 'hr@coaltools.co.id',
  taxId: '01.234.567.8-901.000'
}

/**
 * Sample Payroll Period
 */
export const SAMPLE_PAYROLL_PERIOD: SamplePayrollPeriod = {
  periodeAwal: '2024-01-01',
  periodeAkhir: '2024-01-31',
  month: 1,
  year: 2024,
  description: 'Periode Januari 2024'
}

/**
 * Function untuk menghitung gaji karyawan berdasarkan sample data
 */
export function calculateSamplePayroll(employee: SampleEmployee) {
  const upahPokok = employee.upahHarian * employee.hariKerja
  
  // Hitung overtime
  const overtimeAmount = (employee.upahHarian / 8) * employee.overtimeHours * employee.overtimeRate
  
  // Hitung earnings dari components
  let totalEarnings = upahPokok + overtimeAmount
  let totalDeductions = employee.cashbon
  
  const earningsBreakdown: Array<{ name: string; amount: number; taxable: boolean }> = [
    { name: 'Upah Pokok', amount: upahPokok, taxable: true },
    { name: 'Lembur', amount: overtimeAmount, taxable: true }
  ]
  
  const deductionsBreakdown: Array<{ name: string; amount: number }> = [
    { name: 'Cashbon', amount: employee.cashbon }
  ]
  
  // Process components
  employee.components.forEach(component => {
    if (!component.aktif) return
    
    let amount = 0
    
    switch (component.metode) {
      case 'FLAT':
        amount = component.nominal || 0
        break
      case 'PER_HARI':
        const rate = component.rate || 0
        switch (component.basis) {
          case 'HARI_KERJA':
            amount = rate * employee.hariKerja
            break
          case 'UPAH_HARIAN':
            amount = rate * employee.upahHarian
            break
          default:
            amount = rate
        }
        break
      case 'PERSENTASE':
        const percentage = component.rate || 0
        switch (component.basis) {
          case 'UPAH_HARIAN':
            amount = (percentage / 100) * employee.upahHarian
            break
          case 'BRUTO':
            amount = (percentage / 100) * totalEarnings
            break
          case 'HARI_KERJA':
            amount = (percentage / 100) * employee.hariKerja
            break
        }
        break
    }
    
    if (component.tipe === 'EARNING') {
      totalEarnings += amount
      earningsBreakdown.push({
        name: component.nama,
        amount,
        taxable: component.taxable
      })
    } else {
      totalDeductions += amount
      deductionsBreakdown.push({
        name: component.nama,
        amount
      })
    }
  })
  
  // Hitung pajak (5% dari taxable earnings)
  const taxableEarnings = earningsBreakdown
    .filter(item => item.taxable)
    .reduce((sum, item) => sum + item.amount, 0)
  
  const pajak = taxableEarnings * 0.05
  totalDeductions += pajak
  
  deductionsBreakdown.push({
    name: 'Pajak PPh 21',
    amount: pajak
  })
  
  const neto = totalEarnings - totalDeductions
  
  return {
    employeeId: employee.id,
    employeeName: employee.nama,
    hariKerja: employee.hariKerja,
    upahHarian: employee.upahHarian,
    upahPokok,
    overtimeAmount,
    earnings: earningsBreakdown,
    deductions: deductionsBreakdown,
    bruto: totalEarnings,
    pajak,
    neto
  }
}

/**
 * Function untuk generate sample payroll data lengkap
 */
export function generateSamplePayrollData() {
  const results = SAMPLE_EMPLOYEES.map(calculateSamplePayroll)
  
  return {
    employees: SAMPLE_EMPLOYEES,
    payComponents: SAMPLE_PAY_COMPONENTS,
    companyInfo: SAMPLE_COMPANY_INFO,
    payrollPeriod: SAMPLE_PAYROLL_PERIOD,
    calculationResults: results,
    summary: {
      totalEmployees: results.length,
      totalBruto: results.reduce((sum, r) => sum + r.bruto, 0),
      totalPajak: results.reduce((sum, r) => sum + r.pajak, 0),
      totalNeto: results.reduce((sum, r) => sum + r.neto, 0),
      totalOvertime: results.reduce((sum, r) => sum + r.overtimeAmount, 0)
    }
  }
}

/**
 * Sample company logo (base64 encoded SVG)
 */
export const SAMPLE_COMPANY_LOGO = `data:image/svg+xml;base64,${btoa(`
<svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="80" fill="#1e40af" rx="8"/>
  <text x="60" y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">COAL</text>
  <text x="60" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">TOOLS</text>
  <text x="60" y="65" text-anchor="middle" fill="#93c5fd" font-family="Arial, sans-serif" font-size="8">INDONESIA</text>
</svg>
`)}`

export default {
  SAMPLE_EMPLOYEES,
  SAMPLE_PAY_COMPONENTS,
  SAMPLE_COMPANY_INFO,
  SAMPLE_PAYROLL_PERIOD,
  SAMPLE_COMPANY_LOGO,
  calculateSamplePayroll,
  generateSamplePayrollData
}