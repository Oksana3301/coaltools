import { useMemo, useCallback } from 'react'
import { Employee, PayComponent } from '@/lib/api'

interface EmployeeOverride {
  employeeId: string
  hariKerja?: number
  overtimeHours?: number
  overtimeRate?: number
  overtimeAmount?: number
  normalHours?: number
  holidayHours?: number
  nightFirstHour?: number
  nightAdditionalHours?: number
  customHourlyRate?: number
  cashbon?: number
  selectedStandardComponents?: string[]
  selectedAdditionalComponents?: string[]
  customComponents?: any[]
}

interface PayrollCalculationResult {
  employeeId: string
  employee: Employee
  hariKerja: number
  normalHours: number
  overtimeHours: number
  overtimeAmount: number
  grossEarnings: number
  totalDeductions: number
  netPay: number
  components: {
    id: string
    nama: string
    tipe: 'EARNING' | 'DEDUCTION'
    amount: number
    isCustom: boolean
  }[]
}

interface PayrollSummary {
  totalEmployees: number
  totalGrossEarnings: number
  totalDeductions: number
  totalNetPay: number
  averageNetPay: number
}

interface ComponentSummary {
  componentId: string
  componentName: string
  tipe: 'EARNING' | 'DEDUCTION'
  totalAmount: number
  employeeCount: number
  averageAmount: number
}

export function usePayrollCalculations(
  employees: Employee[],
  components: PayComponent[],
  overrides: Record<string, EmployeeOverride> = {},
  overtimeEnabled: boolean = false
) {
  // Calculate component amount based on PayComponent structure
  const calculateComponentAmount = useCallback((
    component: PayComponent,
    employee: Employee,
    hariKerja: number,
    upahHarian: number,
    bruto: number
  ): number => {
    if (!component.aktif) return 0

    let amount = 0
    
    switch (component.metode) {
      case 'FLAT':
        amount = component.nominal || 0
        break
      case 'PER_HARI':
        const rate = component.rate || 0
        switch (component.basis) {
          case 'HARI_KERJA':
            amount = rate * hariKerja
            break
          case 'UPAH_HARIAN':
            amount = rate * upahHarian
            break
          default:
            amount = rate
        }
        break
      case 'PERSENTASE':
        const percentage = component.rate || 0
        switch (component.basis) {
          case 'UPAH_HARIAN':
            amount = (percentage / 100) * upahHarian
            break
          case 'BRUTO':
            amount = (percentage / 100) * bruto
            break
          case 'HARI_KERJA':
            amount = (percentage / 100) * hariKerja
            break
        }
        break
    }

    // Apply caps if defined
    if (component.capMin && amount < component.capMin) {
      amount = component.capMin
    }
    if (component.capMax && amount > component.capMax) {
      amount = component.capMax
    }

    return Math.round(amount)
  }, [])

  // Calculate overtime amount
  const calculateOvertimeAmount = useCallback((
    employee: Employee,
    overtimeHours: number,
    overtimeRate?: number
  ): number => {
    if (!overtimeEnabled || overtimeHours <= 0) return 0
    
    const hourlyRate = employee.kontrakUpahHarian / 8 // Assuming 8 hours per day
    const rate = overtimeRate || (hourlyRate * 1.5) // 1.5x overtime rate
    
    return Math.round(overtimeHours * rate)
  }, [overtimeEnabled])

  // Calculate payroll for single employee
  const calculateEmployeePayroll = useCallback((
    employee: Employee,
    employeeOverrides?: EmployeeOverride
  ): PayrollCalculationResult => {
    const override = employeeOverrides || overrides[employee.id || '']
    const hariKerja = override?.hariKerja ?? 22 // Default 22 working days
    const overtimeHours = override?.overtimeHours ?? 0
    const overtimeAmount = calculateOvertimeAmount(employee, overtimeHours, override?.overtimeRate)
    const normalHours = override?.normalHours ?? (hariKerja * 8)
    
    const calculatedComponents: PayrollCalculationResult['components'] = []
    const upahHarian = employee.kontrakUpahHarian
    const bruto = upahHarian * hariKerja

    // Add basic salary
    calculatedComponents.push({
      id: 'basic-salary',
      nama: 'Gaji Pokok',
      tipe: 'EARNING',
      amount: upahHarian * hariKerja,
      isCustom: false
    })

    // Calculate all standard components
    const standardComponents = components
      .filter(comp => comp.aktif)
      .map(comp => ({
        id: comp.id || '',
        nama: comp.nama,
        tipe: comp.tipe,
        amount: calculateComponentAmount(comp, employee, hariKerja, upahHarian, bruto),
        isCustom: false
      }))

    calculatedComponents.push(...standardComponents)

    // Add overtime if enabled
    if (overtimeEnabled && overtimeAmount > 0) {
      calculatedComponents.push({
        id: 'overtime',
        nama: 'Lembur',
        tipe: 'EARNING',
        amount: overtimeAmount,
        isCustom: false
      })
    }

    // Add cashbon deduction if exists
    const cashbon = override?.cashbon ?? 0
    if (cashbon > 0) {
      calculatedComponents.push({
        id: 'cashbon',
        nama: 'Potongan Kasbon',
        tipe: 'DEDUCTION',
        amount: cashbon,
        isCustom: false
      })
    }

    // Add custom components
    const customComponents = override?.customComponents ?? []
    customComponents.forEach((customComp, index) => {
      calculatedComponents.push({
        id: `custom-${employee.id || 'unknown'}-${index}`,
        nama: customComp.nama || 'Custom Component',
        tipe: customComp.tipe || 'EARNING',
        amount: customComp.amount || 0,
        isCustom: true
      })
    })

    // Calculate totals
    const earnings = calculatedComponents
      .filter(comp => comp.tipe === 'EARNING')
      .reduce((sum, comp) => sum + comp.amount, 0)

    const deductions = calculatedComponents
      .filter(comp => comp.tipe === 'DEDUCTION')
      .reduce((sum, comp) => sum + comp.amount, 0)

    const netPay = earnings - deductions

    return {
      employeeId: employee.id || '',
      employee,
      hariKerja,
      normalHours: normalHours || 0,
      overtimeHours: overtimeHours || 0,
      overtimeAmount: overtimeAmount || 0,
      grossEarnings: earnings,
      totalDeductions: deductions,
      netPay,
      components: calculatedComponents
    }
  }, [components, calculateOvertimeAmount, calculateComponentAmount, overtimeEnabled, overrides])

  // Calculate payroll for all employees
  const payrollCalculations = useMemo(() => {
    return employees.map(employee => calculateEmployeePayroll(employee))
  }, [employees, calculateEmployeePayroll])

  // Calculate payroll summary
  const payrollSummary = useMemo((): PayrollSummary => {
    const totalEmployees = payrollCalculations.length
    const totalGross = payrollCalculations.reduce((sum, calc) => sum + calc.grossEarnings, 0)
    const totalDed = payrollCalculations.reduce((sum, calc) => sum + calc.totalDeductions, 0)
    const totalNet = payrollCalculations.reduce((sum, calc) => sum + calc.netPay, 0)
    
    return {
      totalEmployees,
      totalGrossEarnings: totalGross,
      totalDeductions: totalDed,
      totalNetPay: totalNet,
      averageNetPay: totalEmployees > 0 ? totalNet / totalEmployees : 0
    }
  }, [payrollCalculations])

  // Calculate component summary
  const componentSummary = useMemo((): ComponentSummary[] => {
    const componentMap = new Map<string, {
      name: string
      tipe: 'EARNING' | 'DEDUCTION'
      totalAmount: number
      employeeCount: number
    }>()

    payrollCalculations.forEach(calc => {
      calc.components.forEach(comp => {
        const existing = componentMap.get(comp.id)
        if (existing) {
          existing.totalAmount += comp.amount
          existing.employeeCount += 1
        } else {
          componentMap.set(comp.id, {
            name: comp.nama,
            tipe: comp.tipe,
            totalAmount: comp.amount,
            employeeCount: 1
          })
        }
      })
    })

    return Array.from(componentMap.entries()).map(([id, data]) => ({
      componentId: id,
      componentName: data.name,
      tipe: data.tipe,
      totalAmount: data.totalAmount,
      employeeCount: data.employeeCount,
      averageAmount: data.employeeCount > 0 ? data.totalAmount / data.employeeCount : 0
    }))
  }, [payrollCalculations])

  // Utility functions
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }, [])

  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num)
  }, [])

  const validateEmployeeData = useCallback((employee: Employee): string[] => {
    const errors: string[] = []
    
    if (!employee.nama?.trim()) {
      errors.push('Nama karyawan harus diisi')
    }
    
    if (!employee.kontrakUpahHarian || employee.kontrakUpahHarian <= 0) {
      errors.push('Upah harian harus lebih dari 0')
    }
    
    if (!employee.jabatan?.trim()) {
      errors.push('Jabatan harus diisi')
    }
    
    if (!employee.site?.trim()) {
      errors.push('Site harus diisi')
    }
    
    return errors
  }, [])

  const validatePayrollData = useCallback((employees: Employee[], components: PayComponent[], overrides: Record<string, EmployeeOverride>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (employees.length === 0) {
      errors.push('Minimal harus ada 1 karyawan')
    }
    
    if (components.length === 0) {
      errors.push('Minimal harus ada 1 komponen gaji')
    }
    
    // Validate each employee
    employees.forEach(employee => {
      const employeeErrors = validateEmployeeData(employee)
      if (employeeErrors.length > 0) {
        errors.push(`Karyawan ${employee.nama}: ${employeeErrors.join(', ')}`)
      }
      
      // Validate overrides if exists
      const employeeId = employee.id || ''
      const override = overrides[employeeId]
      if (override) {
        if (override.hariKerja && (override.hariKerja < 0 || override.hariKerja > 31)) {
          errors.push(`Karyawan ${employee.nama}: Hari kerja harus antara 0-31`)
        }
        
        if (override.overtimeHours && override.overtimeHours < 0) {
          errors.push(`Karyawan ${employee.nama}: Jam lembur tidak boleh negatif`)
        }
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [validateEmployeeData])

  return {
    payrollCalculations,
    payrollSummary,
    componentSummary,
    calculateEmployeePayroll,
    validatePayrollData,
    formatCurrency,
    formatNumber
  }
}