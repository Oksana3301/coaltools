'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, Clock, Plus, Minus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Employee, PayComponent } from '@/lib/api'

/**
 * Interface untuk override data karyawan
 */
export interface EmployeeOverride {
  employeeId: string
  hariKerja: number
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
  customComponents?: Array<{
    nama: string
    tipe: 'EARNING' | 'DEDUCTION'
    amount: number
    taxable: boolean
  }>
}

/**
 * Interface untuk hasil perhitungan
 */
export interface PayrollCalculationResult {
  employeeId: string
  employeeName: string
  hariKerja: number
  upahHarian: number
  upahPokok: number
  overtimeAmount: number
  earnings: Array<{ name: string; amount: number; taxable: boolean }>
  deductions: Array<{ name: string; amount: number }>
  bruto: number
  pajak: number
  neto: number
}

/**
 * Props untuk komponen PayrollCalculationForm
 */
interface PayrollCalculationFormProps {
  employees: Employee[]
  selectedEmployees: string[]
  payComponents: PayComponent[]
  onCalculationChange: (results: PayrollCalculationResult[]) => void
  className?: string
  defaultWorkingDays?: number
  overtimeRates?: {
    normal: number
    holiday: number
    night: number
  }
}

/**
 * Komponen untuk form perhitungan payroll
 * Menangani input hari kerja, overtime, dan komponen gaji untuk setiap karyawan
 */
export function PayrollCalculationForm({
  employees,
  selectedEmployees,
  payComponents,
  onCalculationChange,
  className,
  defaultWorkingDays = 26,
  overtimeRates = { normal: 1.5, holiday: 2.0, night: 1.25 }
}: PayrollCalculationFormProps) {
  const [overrides, setOverrides] = useState<Record<string, EmployeeOverride>>({})
  const [globalSettings, setGlobalSettings] = useState({
    workingDays: defaultWorkingDays,
    applyToAll: false,
    taxRate: 0.05 // 5% default tax rate
  })

  // Filter karyawan yang dipilih
  const selectedEmployeeData = useMemo(() => {
    return employees.filter(emp => emp.id && selectedEmployees.includes(emp.id))
  }, [employees, selectedEmployees])

  // Filter komponen gaji aktif
  const activeComponents = useMemo(() => {
    return payComponents.filter(comp => comp.aktif)
  }, [payComponents])

  const earningComponents = activeComponents.filter(comp => comp.tipe === 'EARNING')
  const deductionComponents = activeComponents.filter(comp => comp.tipe === 'DEDUCTION')

  // Inisialisasi override untuk karyawan baru
  useEffect(() => {
    const newOverrides = { ...overrides }
    let hasChanges = false

    selectedEmployeeData.forEach(employee => {
      if (employee.id && !newOverrides[employee.id]) {
        newOverrides[employee.id] = {
          employeeId: employee.id,
          hariKerja: globalSettings.workingDays,
          overtimeHours: 0,
          overtimeRate: overtimeRates.normal,
          overtimeAmount: 0,
          normalHours: 0,
          holidayHours: 0,
          nightFirstHour: 0,
          nightAdditionalHours: 0,
          customHourlyRate: employee.kontrakUpahHarian,
          cashbon: 0,
          selectedStandardComponents: earningComponents.map(comp => comp.id || '').filter(Boolean),
          selectedAdditionalComponents: [],
          customComponents: []
        }
        hasChanges = true
      }
    })

    if (hasChanges) {
      setOverrides(newOverrides)
    }
  }, [selectedEmployeeData, globalSettings.workingDays, overtimeRates.normal, earningComponents, overrides])

  // Fungsi perhitungan komponen gaji
  const calculateComponentAmount = (component: PayComponent, employee: Employee, override: EmployeeOverride) => {
    if (!component.aktif) return 0

    const upahHarian = override.customHourlyRate || employee.kontrakUpahHarian || 0
    const hariKerja = override.hariKerja
    const upahPokok = upahHarian * hariKerja

    switch (component.metode) {
      case 'FLAT':
        return component.nominal || 0
      
      case 'PER_HARI':
        return (component.rate || 0) * hariKerja
      
      case 'PERSENTASE':
        const rate = (component.rate || 0) / 100
        switch (component.basis) {
          case 'UPAH_HARIAN':
            return upahHarian * rate
          case 'BRUTO':
            return upahPokok * rate
          case 'HARI_KERJA':
            return hariKerja * rate
          default:
            return 0
        }
      
      default:
        return 0
    }
  }

  // Fungsi perhitungan overtime
  const calculateOvertimeAmount = useCallback((override: EmployeeOverride, employee: Employee) => {
    const baseRate = override.customHourlyRate || employee.kontrakUpahHarian || 0
    const hourlyRate = baseRate / 8 // Asumsi 8 jam kerja per hari
    
    let totalOvertime = 0
    
    // Normal overtime
    if (override.normalHours) {
      totalOvertime += override.normalHours * hourlyRate * overtimeRates.normal
    }
    
    // Holiday overtime
    if (override.holidayHours) {
      totalOvertime += override.holidayHours * hourlyRate * overtimeRates.holiday
    }
    
    // Night shift overtime
    if (override.nightFirstHour) {
      totalOvertime += override.nightFirstHour * hourlyRate * overtimeRates.night
    }
    
    if (override.nightAdditionalHours) {
      totalOvertime += override.nightAdditionalHours * hourlyRate * (overtimeRates.night + 0.25)
    }
    
    // Manual overtime amount
    if (override.overtimeAmount) {
      totalOvertime += override.overtimeAmount
    }
    
    return totalOvertime
  }, [overtimeRates])

  // Perhitungan hasil payroll
  const calculationResults = useMemo(() => {
    return selectedEmployeeData.map(employee => {
      if (!employee.id) return null
      
      const override = overrides[employee.id]
      if (!override) return null

      const upahHarian = override.customHourlyRate || employee.kontrakUpahHarian || 0
      const upahPokok = upahHarian * override.hariKerja
      const overtimeAmount = calculateOvertimeAmount(override, employee)

      // Hitung earnings
      const earnings: Array<{ name: string; amount: number; taxable: boolean }> = []
      
      // Upah pokok
      earnings.push({
        name: 'Upah Pokok',
        amount: upahPokok,
        taxable: true
      })

      // Overtime
      if (overtimeAmount > 0) {
        earnings.push({
          name: 'Lembur',
          amount: overtimeAmount,
          taxable: true
        })
      }

      // Standard components
      override.selectedStandardComponents?.forEach(componentId => {
        const component = earningComponents.find(comp => comp.id === componentId)
        if (component) {
          const amount = calculateComponentAmount(component, employee, override)
          if (amount > 0) {
            earnings.push({
              name: component.nama,
              amount,
              taxable: component.taxable
            })
          }
        }
      })

      // Custom components (earnings)
      override.customComponents?.forEach(customComp => {
        if (customComp.tipe === 'EARNING' && customComp.amount > 0) {
          earnings.push({
            name: customComp.nama,
            amount: customComp.amount,
            taxable: customComp.taxable
          })
        }
      })

      // Hitung deductions
      const deductions: Array<{ name: string; amount: number }> = []

      // Cashbon
      if (override.cashbon && override.cashbon > 0) {
        deductions.push({
          name: 'Cashbon',
          amount: override.cashbon
        })
      }

      // Standard deduction components
      override.selectedAdditionalComponents?.forEach(componentId => {
        const component = deductionComponents.find(comp => comp.id === componentId)
        if (component) {
          const amount = calculateComponentAmount(component, employee, override)
          if (amount > 0) {
            deductions.push({
              name: component.nama,
              amount
            })
          }
        }
      })

      // Custom components (deductions)
      override.customComponents?.forEach(customComp => {
        if (customComp.tipe === 'DEDUCTION' && customComp.amount > 0) {
          deductions.push({
            name: customComp.nama,
            amount: customComp.amount
          })
        }
      })

      // Hitung bruto, pajak, dan neto
      const bruto = earnings.reduce((sum, earning) => sum + earning.amount, 0)
      const taxableAmount = earnings
        .filter(earning => earning.taxable)
        .reduce((sum, earning) => sum + earning.amount, 0)
      const pajak = taxableAmount * globalSettings.taxRate
      const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0) + pajak
      const neto = bruto - totalDeductions

      return {
        employeeId: employee.id,
        employeeName: employee.nama,
        hariKerja: override.hariKerja,
        upahHarian,
        upahPokok,
        overtimeAmount,
        earnings,
        deductions,
        bruto,
        pajak,
        neto
      }
    }).filter(Boolean) as PayrollCalculationResult[]
  }, [selectedEmployeeData, overrides, earningComponents, deductionComponents, globalSettings.taxRate, calculateOvertimeAmount])

  // Update parent component ketika hasil berubah
  useEffect(() => {
    onCalculationChange(calculationResults)
  }, [calculationResults, onCalculationChange])

  // Handler untuk update override
  const updateOverride = (employeeId: string, updates: Partial<EmployeeOverride>) => {
    setOverrides(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        ...updates
      }
    }))
  }

  // Handler untuk apply global settings
  const applyGlobalSettings = () => {
    const updates: Record<string, EmployeeOverride> = {}
    selectedEmployeeData.forEach(employee => {
      if (employee.id) {
        updates[employee.id] = {
          ...overrides[employee.id],
          hariKerja: globalSettings.workingDays
        }
      }
    })
    setOverrides(prev => ({ ...prev, ...updates }))
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          <span>Perhitungan Payroll</span>
        </CardTitle>
        <CardDescription>
          Atur hari kerja, overtime, dan komponen gaji untuk setiap karyawan
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Global Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Pengaturan Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="globalWorkingDays">Hari Kerja Default</Label>
                <Input
                  id="globalWorkingDays"
                  type="number"
                  min="1"
                  max="31"
                  value={globalSettings.workingDays}
                  onChange={(e) => setGlobalSettings(prev => ({
                    ...prev,
                    workingDays: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="taxRate">Tarif Pajak (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={globalSettings.taxRate * 100}
                  onChange={(e) => setGlobalSettings(prev => ({
                    ...prev,
                    taxRate: (parseFloat(e.target.value) || 0) / 100
                  }))}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={applyGlobalSettings} className="w-full">
                  Terapkan ke Semua
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Calculations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Perhitungan per Karyawan</h3>
          
          {selectedEmployeeData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Pilih karyawan terlebih dahulu untuk melakukan perhitungan</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {selectedEmployeeData.map((employee) => {
                  if (!employee.id) return null
                  
                  const override = overrides[employee.id]
                  const result = calculationResults.find(r => r.employeeId === employee.id)
                  
                  if (!override) return null

                  return (
                    <Card key={employee.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{employee.nama}</span>
                          <Badge variant="outline">
                            {employee.jabatan} • {employee.site}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <Tabs defaultValue="basic" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Dasar</TabsTrigger>
                            <TabsTrigger value="overtime">Lembur</TabsTrigger>
                            <TabsTrigger value="components">Komponen</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <Label>Hari Kerja</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="31"
                                  value={override.hariKerja}
                                  onChange={(e) => updateOverride(employee.id!, {
                                    hariKerja: parseInt(e.target.value) || 0
                                  })}
                                />
                              </div>
                              <div>
                                <Label>Upah Harian</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={override.customHourlyRate || employee.kontrakUpahHarian}
                                  onChange={(e) => updateOverride(employee.id!, {
                                    customHourlyRate: parseInt(e.target.value) || 0
                                  })}
                                />
                              </div>
                              <div>
                                <Label>Cashbon</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={override.cashbon || 0}
                                  onChange={(e) => updateOverride(employee.id!, {
                                    cashbon: parseInt(e.target.value) || 0
                                  })}
                                />
                              </div>
                              <div>
                                <Label>Upah Pokok</Label>
                                <div className="text-sm font-medium p-2 bg-muted rounded">
                                  Rp {result?.upahPokok.toLocaleString('id-ID') || '0'}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="overtime" className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <Label>Jam Normal</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={override.normalHours || 0}
                                  onChange={(e) => updateOverride(employee.id!, {
                                    normalHours: parseFloat(e.target.value) || 0
                                  })}
                                />
                              </div>
                              <div>
                                <Label>Jam Libur</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={override.holidayHours || 0}
                                  onChange={(e) => updateOverride(employee.id!, {
                                    holidayHours: parseFloat(e.target.value) || 0
                                  })}
                                />
                              </div>
                              <div>
                                <Label>Jam Malam (1)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={override.nightFirstHour || 0}
                                  onChange={(e) => updateOverride(employee.id!, {
                                    nightFirstHour: parseFloat(e.target.value) || 0
                                  })}
                                />
                              </div>
                              <div>
                                <Label>Jam Malam (2+)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={override.nightAdditionalHours || 0}
                                  onChange={(e) => updateOverride(employee.id!, {
                                    nightAdditionalHours: parseFloat(e.target.value) || 0
                                  })}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Total Lembur</Label>
                              <div className="text-sm font-medium p-2 bg-muted rounded">
                                Rp {result?.overtimeAmount.toLocaleString('id-ID') || '0'}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="components" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Earnings */}
                              <div>
                                <h4 className="font-medium mb-3 text-green-700">Pendapatan</h4>
                                <div className="space-y-2">
                                  {earningComponents.map(component => (
                                    <div key={component.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={override.selectedStandardComponents?.includes(component.id || '') || false}
                                        onCheckedChange={(checked) => {
                                          const current = override.selectedStandardComponents || []
                                          const updated = checked
                                            ? [...current, component.id || '']
                                            : current.filter(id => id !== component.id)
                                          updateOverride(employee.id!, {
                                            selectedStandardComponents: updated
                                          })
                                        }}
                                      />
                                      <span className="text-sm">{component.nama}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {component.metode}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Deductions */}
                              <div>
                                <h4 className="font-medium mb-3 text-red-700">Potongan</h4>
                                <div className="space-y-2">
                                  {deductionComponents.map(component => (
                                    <div key={component.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={override.selectedAdditionalComponents?.includes(component.id || '') || false}
                                        onCheckedChange={(checked) => {
                                          const current = override.selectedAdditionalComponents || []
                                          const updated = checked
                                            ? [...current, component.id || '']
                                            : current.filter(id => id !== component.id)
                                          updateOverride(employee.id!, {
                                            selectedAdditionalComponents: updated
                                          })
                                        }}
                                      />
                                      <span className="text-sm">{component.nama}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {component.metode}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                        
                        {/* Summary */}
                        {result && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Bruto</p>
                                <p className="font-medium text-green-600">
                                  Rp {result.bruto.toLocaleString('id-ID')}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Pajak</p>
                                <p className="font-medium text-orange-600">
                                  Rp {result.pajak.toLocaleString('id-ID')}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Potongan</p>
                                <p className="font-medium text-red-600">
                                  Rp {result.deductions.reduce((sum, d) => sum + d.amount, 0).toLocaleString('id-ID')}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Neto</p>
                                <p className="font-bold text-blue-600">
                                  Rp {result.neto.toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Summary Total */}
        {calculationResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-muted-foreground">Total Karyawan</p>
                  <p className="text-2xl font-bold">{calculationResults.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Bruto</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp {calculationResults.reduce((sum, r) => sum + r.bruto, 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Pajak</p>
                  <p className="text-2xl font-bold text-orange-600">
                    Rp {calculationResults.reduce((sum, r) => sum + r.pajak, 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Neto</p>
                  <p className="text-2xl font-bold text-blue-600">
                    Rp {calculationResults.reduce((sum, r) => sum + r.neto, 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}