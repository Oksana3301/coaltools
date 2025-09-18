'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Download,
  Upload,
  Filter,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { KasBesarExpense, Buyer } from '@/lib/api';
import { KasBesarFilters, KasBesarSummary } from '../types/kas-besar-types';
import { getCurrentUser } from '@/lib/auth';

// Lazy load components for better performance
const KasBesarForm = React.lazy(() => 
  import('./kas-besar-form').then(module => ({ default: module.KasBesarForm }))
);

const KasBesarTable = React.lazy(() => 
  import('./kas-besar-table').then(module => ({ default: module.KasBesarTable }))
);

const KasBesarFiltersComponent = React.lazy(() => 
  import('./kas-besar-filters').then(module => ({ default: module.KasBesarFilters }))
);

const KasBesarActions = React.lazy(() => 
  import('./kas-besar-actions').then(module => ({ default: module.KasBesarActions }))
);

// Loading component for Suspense fallback
const ComponentLoader = ({ message = 'Memuat komponen...' }: { message?: string }) => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin mr-2" />
    <span className="text-sm text-gray-600">{message}</span>
  </div>
);

// Error boundary for lazy loaded components
class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Terjadi kesalahan saat memuat komponen.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => this.setState({ hasError: false })}
              >
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

interface KasBesarManagementProps {
  initialData?: KasBesarExpense[];
  buyers?: Buyer[];
}

export function KasBesarManagement({ 
  initialData = [], 
  buyers = [] 
}: KasBesarManagementProps) {
  const { toast } = useToast();
  
  // State management
  const [expenses, setExpenses] = useState<KasBesarExpense[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<KasBesarExpense | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<KasBesarFilters>({
    search: '',
    tanggalDari: '',
    tanggalSampai: '',
    tipeAktivitas: '',
    status: '',
    vendor: '',
  });

  // Sort configuration
  const [sortConfig, setSortConfig] = useState<{
    key: keyof KasBesarExpense | null;
    direction: 'asc' | 'desc';
  }>({ key: 'tanggal', direction: 'desc' });

  // Calculate summary data
  const summary: KasBesarSummary = React.useMemo(() => {
    const filteredExpenses = getFilteredExpenses();
    return {
      totalTransactions: filteredExpenses.length,
      totalAmount: filteredExpenses.reduce((sum, expense) => sum + expense.total, 0),
      pendingApproval: filteredExpenses.filter(e => e.status === 'SUBMITTED').length,
      approved: filteredExpenses.filter(e => e.status === 'APPROVED').length,
      rejected: filteredExpenses.filter(e => e.status === 'REJECTED').length,
    };
  }, [expenses, filters]);

  // Filter expenses based on current filters
  function getFilteredExpenses(): KasBesarExpense[] {
    let filtered = [...expenses];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.barang.toLowerCase().includes(searchLower) ||
        expense.vendorNama.toLowerCase().includes(searchLower) ||
        expense.tipeAktivitas.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (filters.tanggalDari) {
      filtered = filtered.filter(expense => expense.tanggal >= filters.tanggalDari!);
    }
    if (filters.tanggalSampai) {
      filtered = filtered.filter(expense => expense.tanggal <= filters.tanggalSampai!);
    }

    // Activity type filter
    if (filters.tipeAktivitas) {
      filtered = filtered.filter(expense => expense.tipeAktivitas === filters.tipeAktivitas);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(expense => expense.status === filters.status);
    }

    // Vendor filter
    if (filters.vendor) {
      filtered = filtered.filter(expense => 
        expense.vendorNama.toLowerCase().includes(filters.vendor!.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }

  // Handle sorting
  const handleSort = (key: keyof KasBesarExpense) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle form submission
  const handleSubmit = async (data: Omit<KasBesarExpense, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    try {
      const newExpense: KasBesarExpense = {
        ...data,
        id: editingExpense?.id || `expense-${Date.now()}`,
        createdAt: editingExpense?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingExpense) {
        setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? newExpense : exp));
        toast({
          title: "Pengeluaran diperbarui",
          description: "Data pengeluaran berhasil diperbarui"
        });
      } else {
        setExpenses(prev => [newExpense, ...prev]);
        toast({
          title: "Pengeluaran ditambahkan",
          description: "Data pengeluaran baru berhasil ditambahkan"
        });
      }

      setIsFormOpen(false);
      setEditingExpense(null);
    } catch (error) {
      toast({
        title: "Gagal menyimpan",
        description: "Terjadi kesalahan saat menyimpan data",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (expense: KasBesarExpense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!id) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
      try {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
        setSelectedExpenses(prev => prev.filter(expId => expId !== id));
        toast({
          title: "Pengeluaran dihapus",
          description: "Data pengeluaran berhasil dihapus"
        });
      } catch (error) {
        toast({
          title: "Gagal menghapus",
          description: "Terjadi kesalahan saat menghapus data",
          variant: "destructive"
        });
      }
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedExpenses.length === 0) {
      toast({
        title: "Tidak ada data dipilih",
        description: "Pilih minimal satu pengeluaran untuk melakukan aksi",
        variant: "destructive"
      });
      return;
    }

    try {
      switch (action) {
        case 'approve':
          setExpenses(prev => prev.map(exp => 
            exp.id && selectedExpenses.includes(exp.id) 
              ? { ...exp, status: 'APPROVED' as const, updatedAt: new Date().toISOString() }
              : exp
          ));
          toast({
            title: "Pengeluaran disetujui",
            description: `${selectedExpenses.length} pengeluaran berhasil disetujui`
          });
          break;
        case 'reject':
          setExpenses(prev => prev.map(exp => 
            exp.id && selectedExpenses.includes(exp.id) 
              ? { ...exp, status: 'REJECTED' as const, updatedAt: new Date().toISOString() }
              : exp
          ));
          toast({
            title: "Pengeluaran ditolak",
            description: `${selectedExpenses.length} pengeluaran berhasil ditolak`
          });
          break;
        case 'delete':
          if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedExpenses.length} pengeluaran?`)) {
            setExpenses(prev => prev.filter(exp => !exp.id || !selectedExpenses.includes(exp.id)));
            toast({
              title: "Pengeluaran dihapus",
              description: `${selectedExpenses.length} pengeluaran berhasil dihapus`
            });
          }
          break;
      }
      setSelectedExpenses([]);
    } catch (error) {
      toast({
        title: "Gagal melakukan aksi",
        description: "Terjadi kesalahan saat melakukan aksi bulk",
        variant: "destructive"
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const filteredData = getFilteredExpenses();
      // Implementation for export functionality
      toast({
        title: "Export berhasil",
        description: `${filteredData.length} data berhasil diekspor`
      });
    } catch (error) {
      toast({
        title: "Export gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive"
      });
    }
  };

  const filteredExpenses = getFilteredExpenses();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kas Besar Management</h1>
          <p className="text-muted-foreground">
            Kelola pengeluaran kas besar perusahaan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {Object.values(filters).some(Boolean) && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(Boolean).length}
              </Badge>
            )}
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengeluaran
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Total transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nominal</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(summary.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Jumlah keseluruhan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge variant="secondary">{summary.pendingApproval}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.pendingApproval}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu persetujuan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Badge variant="default">{summary.approved}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.approved}</div>
            <p className="text-xs text-muted-foreground">
              Telah disetujui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <Badge variant="destructive">{summary.rejected}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Ditolak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {isFiltersOpen && (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<ComponentLoader message="Memuat filter..." />}>
            <KasBesarFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters({
                search: '',
                tanggalDari: '',
                tanggalSampai: '',
                tipeAktivitas: '',
                status: '',
                vendor: '',
              })}
              isCollapsed={false}
              onToggleCollapse={() => setIsFiltersOpen(false)}
            />
          </Suspense>
        </LazyComponentErrorBoundary>
      )}

      {/* Bulk Actions */}
      {selectedExpenses.length > 0 && (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<ComponentLoader message="Memuat aksi..." />}>
            <KasBesarActions
              bulkEditMode={false}
              selectedExpenses={new Set(selectedExpenses)}
              onToggleBulkEdit={() => {}}
              onBulkDelete={() => handleBulkAction('delete')}
              onBulkApprove={() => handleBulkAction('approve')}
              onBulkReject={() => handleBulkAction('reject')}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedExpenses(filteredExpenses.map(exp => exp.id).filter((id): id is string => id !== undefined));
                } else {
                  setSelectedExpenses([]);
                }
              }}
              onAdd={() => setIsFormOpen(true)}
              onRefresh={() => window.location.reload()}
              onExport={handleExport}
              onImport={() => {}}
              expenses={filteredExpenses}
              isLoading={isLoading}
            />
          </Suspense>
        </LazyComponentErrorBoundary>
      )}

      {/* Data Table */}
      <LazyComponentErrorBoundary>
        <Suspense fallback={<ComponentLoader message="Memuat tabel data..." />}>
          <KasBesarTable
            expenses={filteredExpenses}
            selectedExpenses={new Set(selectedExpenses)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={(id, status) => {
              setExpenses(prev => prev.map(exp => 
                exp.id === id ? { ...exp, status: status as any } : exp
              ));
            }}
            onView={(expense) => setEditingExpense(expense)}
            onSelectionChange={(selected) => setSelectedExpenses(Array.from(selected))}
            loading={isLoading}
          />
        </Suspense>
      </LazyComponentErrorBoundary>

      {/* Form Modal */}
      {isFormOpen && (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<ComponentLoader message="Memuat form..." />}>
            <KasBesarForm
              formData={editingExpense || {
                hari: '',
                tanggal: '',
                bulan: '',
                tipeAktivitas: '',
                barang: '',
                banyak: 0,
                satuan: '',
                hargaSatuan: 0,
                total: 0,
                vendorNama: '',
                vendorTelp: '',
                vendorEmail: '',
                jenis: '',
                subJenis: '',
                buktiUrl: '',
                kontrakUrl: '',
                status: 'DRAFT',
                notes: '',
                createdBy: ''
              }}
              setFormData={(data) => setEditingExpense(data)}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingExpense(null);
              }}
              isEditing={!!editingExpense}
              loading={isSubmitting}
            />
          </Suspense>
        </LazyComponentErrorBoundary>
      )}
    </div>
  );
}

export default KasBesarManagement;