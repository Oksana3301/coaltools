'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  AlertTriangle,
  CheckCircle,
  FileText,
  Filter,
  X,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { apiService, Kwitansi } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency, formatDate } from "@/lib/api"
import Link from 'next/link'

export default function SavedKwitansiPage() {
  const { toast } = useToast()
  const [kwitansiList, setKwitansiList] = useState<Kwitansi[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [isAtLimit, setIsAtLimit] = useState(false)
  const [editingKwitansi, setEditingKwitansi] = useState<Kwitansi | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string; name: string } | null>(null)

  const loadKwitansi = async () => {
    setLoading(true)
    try {
      const currentUser = getCurrentUser()
      if (!currentUser?.id) {
        toast({
          title: "Error",
          description: "Anda harus login untuk melihat data kwitansi",
          variant: "destructive"
        })
        return
      }

      const response = await apiService.getKwitansi({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        createdBy: currentUser.id,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })

      if (response.success) {
        setKwitansiList(response.data || [])
        setTotalPages(response.pagination?.totalPages || 1)
        setTotalRecords(response.pagination?.total || 0)
        setIsAtLimit(false)
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal mengambil data kwitansi",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading kwitansi:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengambil data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKwitansi()
  }, [currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    loadKwitansi()
  }

  const handleDeleteKwitansi = async (id: string, hardDelete: boolean = false) => {
    try {
      const response = await apiService.deleteKwitansi(id, hardDelete)
      
      if (response.success) {
        toast({
          title: "Berhasil",
          description: hardDelete 
            ? "Kwitansi berhasil dihapus permanen"
            : "Kwitansi berhasil dihapus"
        })
        loadKwitansi()
      } else {
        toast({
          title: "Error",
          description: response.error || "Gagal menghapus kwitansi",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting kwitansi:', error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus kwitansi",
        variant: "destructive"
      })
    } finally {
      setShowDeleteDialog(null)
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
    loadKwitansi()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Data Kwitansi Tersimpan
            </h1>
          </div>
          <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Kelola dan lihat semua kwitansi yang telah Anda simpan
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Kwitansi</p>
                  <p className="text-2xl font-bold text-blue-600">{totalRecords}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Limit Status</p>
                  <p className="text-2xl font-bold text-green-600">{100 - totalRecords}</p>
                  <p className="text-xs text-gray-500">sisa slot</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${isAtLimit ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kapasitas</p>
                  <p className={`text-2xl font-bold ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`}>
                    {Math.round((totalRecords / 100) * 100)}%
                  </p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Cari Kwitansi</Label>
                <Input
                  id="search"
                  placeholder="Nomor, nama, atau keterangan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <Label htmlFor="dateFrom">Tanggal Dari</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Tanggal Sampai</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Cari
                </Button>
                <Button onClick={resetFilters} variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create New Button */}
        <div className="flex justify-between items-center">
          <div>
            <Link href="/kwitansi">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <FileText className="h-4 w-4 mr-2" />
                Buat Kwitansi Baru
              </Button>
            </Link>
          </div>
          {isAtLimit && (
            <Badge variant="destructive" className="text-sm">
              Batas maksimal 100 kwitansi tercapai
            </Badge>
          )}
        </div>

        {/* Kwitansi List */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle>Daftar Kwitansi</CardTitle>
            <CardDescription>
              {kwitansiList.length} dari {totalRecords} kwitansi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat data...</p>
              </div>
            ) : kwitansiList.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada kwitansi tersimpan</p>
                <Link href="/kwitansi">
                  <Button className="mt-4">Buat Kwitansi Pertama</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {kwitansiList.map((kwitansi) => (
                  <Card key={kwitansi.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{kwitansi.nomorKwitansi}</h3>
                            <Badge variant="outline">{formatCurrency(kwitansi.jumlahUang)}</Badge>
                          </div>
                          <p className="text-gray-600 mb-1">
                            <strong>Penerima:</strong> {kwitansi.namaPenerima}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <strong>Untuk:</strong> {kwitansi.untukPembayaran}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <strong>Tanggal:</strong> {formatDate(kwitansi.tanggal)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Dibuat: {formatDate(kwitansi.createdAt || '')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowDeleteDialog({
                              id: kwitansi.id!,
                              name: kwitansi.nomorKwitansi
                            })}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Konfirmasi Hapus</CardTitle>
                <CardDescription>
                  Apakah Anda yakin ingin menghapus kwitansi "{showDeleteDialog.name}"?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
                    Batal
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDeleteKwitansi(showDeleteDialog.id, false)}
                  >
                    Soft Delete
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteKwitansi(showDeleteDialog.id, true)}
                  >
                    Hard Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
