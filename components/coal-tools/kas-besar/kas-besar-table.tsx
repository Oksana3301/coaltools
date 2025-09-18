"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// Using basic table elements since @/components/ui/table might not exist
// Replace with actual table component imports if available
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Eye, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { KasBesarExpense } from "../types/kas-besar-types"
import { KAS_BESAR_STATUS_OPTIONS } from "../constants/kas-besar-constants"

interface KasBesarTableProps {
  expenses: KasBesarExpense[]
  loading?: boolean
  onEdit: (expense: KasBesarExpense) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  onView: (expense: KasBesarExpense) => void
  selectedExpenses?: Set<string>
  onSelectionChange?: (selected: Set<string>) => void
  bulkEditMode?: boolean
}

export function KasBesarTable({
  expenses,
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
  selectedExpenses = new Set(),
  onSelectionChange,
  bulkEditMode = false
}: KasBesarTableProps) {
  const { toast } = useToast()
  const [sortField, setSortField] = useState<keyof KasBesarExpense>('tanggal')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const getStatusBadge = (status?: string) => {
    const statusConfig = KAS_BESAR_STATUS_OPTIONS.find(s => s.value === status)
    if (!statusConfig) return null

    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colorClasses[statusConfig.color as keyof typeof colorClasses]}>
        {statusConfig.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleSort = (field: keyof KasBesarExpense) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedExpenses = [...expenses].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue === undefined || bValue === undefined) return 0
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  const handleSelectExpense = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    
    const newSelection = new Set(selectedExpenses)
    if (checked) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    onSelectionChange(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    
    if (checked) {
      const allIds = new Set(expenses.map(e => e.id).filter(Boolean) as string[])
      onSelectionChange(allIds)
    } else {
      onSelectionChange(new Set())
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await onStatusChange(id, newStatus)
      toast({
        title: "Status berhasil diupdate",
        description: `Status transaksi telah diubah ke ${newStatus}`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengupdate status",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await onDelete(id)
        toast({
          title: "Transaksi dihapus",
          description: "Transaksi berhasil dihapus"
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal menghapus transaksi",
          variant: "destructive"
        })
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-2">Memuat data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum ada data pengeluaran kas besar
            </h3>
            <p className="text-gray-500">
              Mulai dengan menambahkan transaksi pengeluaran kas besar pertama Anda
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Daftar Pengeluaran Kas Besar</span>
          <span className="text-sm font-normal text-muted-foreground">
            {expenses.length} transaksi
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {bulkEditMode && (
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.size === expenses.length && expenses.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                <th 
                  className="p-4 cursor-pointer hover:bg-gray-50 text-left"
                  onClick={() => handleSort('tanggal')}
                >
                  Tanggal
                  {sortField === 'tanggal' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="p-4 text-left">Tipe Aktivitas</th>
                <th className="p-4 text-left">Barang/Jasa</th>
                <th className="p-4 text-left">Vendor</th>
                <th 
                  className="p-4 cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort('total')}
                >
                  Total
                  {sortField === 'total' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="p-4 text-left">Status</th>
                <th className="w-12 p-4 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.map((expense) => (
                <tr key={expense.id} className="border-b hover:bg-gray-50">
                  {bulkEditMode && (
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.has(expense.id || '')}
                        onChange={(e) => handleSelectExpense(expense.id || '', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="p-4 font-medium">
                    {new Date(expense.tanggal).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4">
                      <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {expense.tipeAktivitas.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{expense.barang}</p>
                        <p className="text-sm text-gray-500">
                          {expense.banyak} {expense.satuan}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{expense.vendorNama}</p>
                        {expense.vendorTelp && (
                          <p className="text-sm text-gray-500">{expense.vendorTelp}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {formatCurrency(expense.total)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(expense.status)}
                    </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onView(expense)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        {/* Status Actions */}
                        {expense.status === 'DRAFT' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(expense.id || '', 'SUBMITTED')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Submit untuk Review
                          </DropdownMenuItem>
                        )}
                        
                        {expense.status === 'SUBMITTED' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(expense.id || '', 'APPROVED')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Setujui
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(expense.id || '', 'REJECTED')}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Tolak
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {expense.status === 'APPROVED' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(expense.id || '', 'ARCHIVED')}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Arsipkan
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        
                        {(expense.status === 'DRAFT' || expense.status === 'REJECTED') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(expense.id || '')}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}