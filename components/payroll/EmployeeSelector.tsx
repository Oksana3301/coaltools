'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Users, UserCheck, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Employee } from '@/lib/api'

/**
 * Props untuk komponen EmployeeSelector
 */
interface EmployeeSelectorProps {
  employees: Employee[]
  selectedEmployees: string[]
  onSelectionChange: (selectedIds: string[]) => void
  className?: string
  showInactiveEmployees?: boolean
  maxSelection?: number
}

/**
 * Interface untuk filter karyawan
 */
interface EmployeeFilter {
  search: string
  department: string
  position: string
  status: 'all' | 'active' | 'inactive'
}

/**
 * Komponen IndeterminateCheckbox untuk menangani state indeterminate
 */
function IndeterminateCheckbox({ checked, indeterminate, onCheckedChange, disabled }: {
  checked: boolean
  indeterminate: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (ref.current && 'indeterminate' in ref.current) {
      (ref.current as any).indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <Checkbox
      ref={ref}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  )
}

/**
 * Komponen untuk memilih karyawan dalam proses payroll
 * Menyediakan pencarian, filter, dan bulk selection
 */
export function EmployeeSelector({
  employees,
  selectedEmployees,
  onSelectionChange,
  className,
  showInactiveEmployees = false,
  maxSelection
}: EmployeeSelectorProps) {
  const [filter, setFilter] = useState<EmployeeFilter>({
    search: '',
    department: '',
    position: '',
    status: 'active'
  })

  // Filter dan search karyawan
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Filter berdasarkan status aktif
      if (!showInactiveEmployees && !employee.aktif) return false
      if (filter.status === 'active' && !employee.aktif) return false
      if (filter.status === 'inactive' && employee.aktif) return false

      // Filter berdasarkan pencarian nama
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const nameMatch = employee.nama?.toLowerCase().includes(searchLower)
        const nikMatch = employee.nik?.toLowerCase().includes(searchLower)
        const jabatanMatch = employee.jabatan?.toLowerCase().includes(searchLower)
        if (!nameMatch && !nikMatch && !jabatanMatch) return false
      }

      // Filter berdasarkan site (sebagai pengganti departemen)
      if (filter.department && employee.site !== filter.department) {
        return false
      }

      // Filter berdasarkan jabatan (sebagai pengganti posisi)
      if (filter.position && employee.jabatan !== filter.position) {
        return false
      }

      return true
    })
  }, [employees, filter, showInactiveEmployees])

  // Mendapatkan daftar site dan jabatan unik
  const departments = useMemo(() => {
    const sites = [...new Set(employees.map(emp => emp.site).filter(Boolean))]
    return sites.sort()
  }, [employees])

  const positions = useMemo(() => {
    const jabatan = [...new Set(employees.map(emp => emp.jabatan).filter(Boolean))]
    return jabatan.sort()
  }, [employees])

  // Handler untuk toggle selection karyawan
  const handleEmployeeToggle = (employeeId: string) => {
    if (!employeeId) return
    
    const isSelected = selectedEmployees.includes(employeeId)
    let newSelection: string[]

    if (isSelected) {
      newSelection = selectedEmployees.filter(id => id !== employeeId)
    } else {
      if (maxSelection && selectedEmployees.length >= maxSelection) {
        return // Tidak bisa menambah lagi jika sudah mencapai batas
      }
      newSelection = [...selectedEmployees, employeeId]
    }

    onSelectionChange(newSelection)
  }

  // Handler untuk select all
  const handleSelectAll = () => {
    const allIds = filteredEmployees.map(emp => emp.id).filter(Boolean) as string[]
    const limitedIds = maxSelection ? allIds.slice(0, maxSelection) : allIds
    onSelectionChange(limitedIds)
  }

  // Handler untuk clear selection
  const handleClearSelection = () => {
    onSelectionChange([])
  }

  // Statistik selection
  const selectedCount = selectedEmployees.length
  const totalCount = filteredEmployees.length
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>Pilih Karyawan</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            {selectedCount} dari {totalCount}
          </Badge>
        </CardTitle>
        <CardDescription>
          Pilih karyawan yang akan diproses dalam perhitungan payroll ini
          {maxSelection && ` (maksimal ${maxSelection} karyawan)`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search dan Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, atau telepon..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          <select
            value={filter.department}
            onChange={(e) => setFilter(prev => ({ ...prev, department: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="">Semua Site</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filter.position}
            onChange={(e) => setFilter(prev => ({ ...prev, position: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="">Semua Jabatan</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as 'all' | 'active' | 'inactive' }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndeterminateCheckbox
              checked={isAllSelected}
              indeterminate={isSomeSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleSelectAll()
                } else {
                  handleClearSelection()
                }
              }}
            />
            <span className="text-sm font-medium">
              {isAllSelected ? 'Batalkan Semua' : 'Pilih Semua'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              disabled={selectedCount === 0}
            >
              Bersihkan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={totalCount === 0 || Boolean(maxSelection && totalCount > maxSelection)}
            >
              Pilih Semua
            </Button>
          </div>
        </div>

        {/* Daftar Karyawan */}
        <ScrollArea className="h-96 w-full border rounded-md">
          <div className="p-4 space-y-2">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada karyawan yang sesuai dengan filter</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const isSelected = employee.id ? selectedEmployees.includes(employee.id) : false
                const isDisabled = !employee.id || (!employee.aktif && !showInactiveEmployees)

                return (
                  <div
                    key={employee.id || employee.nama}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                      {
                        'bg-primary/5 border-primary': isSelected,
                        'hover:bg-muted/50': !isDisabled,
                        'opacity-50 cursor-not-allowed': isDisabled
                      }
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled || Boolean(maxSelection && !isSelected && selectedCount >= maxSelection)}
                      onCheckedChange={() => employee.id && handleEmployeeToggle(employee.id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{employee.nama}</h4>
                        {!employee.aktif && (
                          <Badge variant="secondary" className="text-xs">
                            Tidak Aktif
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{employee.jabatan} • {employee.site}</p>
                        <p>NIK: {employee.nik || '-'}</p>
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      <p className="font-medium">
                        Rp {employee.kontrakUpahHarian?.toLocaleString('id-ID') || '0'}
                      </p>
                      <p className="text-muted-foreground">Upah Harian</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Summary */}
        {selectedCount > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Ringkasan Seleksi</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Karyawan</p>
                <p className="font-medium">{selectedCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Upah Harian</p>
                <p className="font-medium">
                  Rp {employees
                    .filter(emp => emp.id && selectedEmployees.includes(emp.id))
                    .reduce((sum, emp) => sum + (emp.kontrakUpahHarian || 0), 0)
                    .toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Karyawan Aktif</p>
                <p className="font-medium">
                  {employees
                    .filter(emp => emp.id && selectedEmployees.includes(emp.id) && emp.aktif)
                    .length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Site</p>
                <p className="font-medium">
                  {[...new Set(
                    employees
                      .filter(emp => emp.id && selectedEmployees.includes(emp.id))
                      .map(emp => emp.site)
                      .filter(Boolean)
                  )].length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}