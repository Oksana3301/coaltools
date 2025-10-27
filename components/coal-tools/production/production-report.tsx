'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
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
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Buyer, ProductionReport } from '@/lib/api';
import {
  ProductionTransaction,
  ProductionPeriod,
  ProductionAnalytics,
  ProductionFilters,
  ProductionFormData,
} from '../types/production-types';
import { getCurrentUser } from '@/lib/auth';

// Lazy load components for better performance
const ProductionForm = React.lazy(() => 
  import('./production-form').then(module => ({ default: module.ProductionForm }))
);

const ProductionTable = React.lazy(() => 
  import('./production-table').then(module => ({ default: module.ProductionTable }))
);

const ProductionSummary = React.lazy(() => 
  import('./production-summary').then(module => ({ default: module.ProductionSummary }))
);

const ProductionSummaryCompact = React.lazy(() => 
  import('./production-summary').then(module => ({ default: module.ProductionSummaryCompact }))
);

const ProductionFiltersComponent = React.lazy(() => 
  import('./production-filters').then(module => ({ default: module.ProductionFiltersComponent }))
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

interface ProductionReportProps {
  initialData?: ProductionTransaction[];
  buyers?: Buyer[];
  currentPeriod?: ProductionPeriod;
}

export function ProductionReport({ 
  initialData = [], 
  buyers = [],
  currentPeriod
}: ProductionReportProps) {
  const { toast } = useToast();
  
  // State management
  const [transactions, setTransactions] = useState<ProductionTransaction[]>(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<ProductionTransaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Period and analytics state
  const [period, setPeriod] = useState<ProductionPeriod>(currentPeriod || {
    id: `period-${Date.now()}`,
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    target: 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  const [analytics, setAnalytics] = useState<ProductionAnalytics>({
    totalTransactions: 0,
    totalNetto: 0,
    totalTarget: 0,
    achievementPercentage: 0,
    averageDaily: 0,
    topBuyers: [],
    dailySummary: [],
    recentActivity: [],
  });
  
  // Filters state
  const [filters, setFilters] = useState<ProductionFilters>({
    search: '',
    tanggalDari: '',
    tanggalSampai: '',
    pembeli: '',
    status: '',
  });

  // Sort configuration
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ProductionTransaction | null;
    direction: 'asc' | 'desc';
  }>({ key: 'tanggal', direction: 'desc' });

  // Filter transactions based on current filters
  const getFilteredTransactions = useCallback((): ProductionTransaction[] => {
    let filtered = [...transactions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.pembeli.toLowerCase().includes(searchLower) ||
        transaction.kapal?.toLowerCase().includes(searchLower) ||
        transaction.tujuan?.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (filters.tanggalDari) {
      filtered = filtered.filter(transaction => transaction.tanggal >= filters.tanggalDari!);
    }
    if (filters.tanggalSampai) {
      filtered = filtered.filter(transaction => transaction.tanggal <= filters.tanggalSampai!);
    }

    // Buyer filter
    if (filters.pembeli) {
      filtered = filtered.filter(transaction => 
        transaction.pembeli.toLowerCase().includes(filters.pembeli!.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(transaction => transaction.status === filters.status);
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
  }, [transactions, filters, sortConfig]);

  // Calculate analytics when transactions change
  useEffect(() => {
    const calculateAnalytics = () => {
      const filteredTransactions = getFilteredTransactions();
      
      const totalNetto = filteredTransactions.reduce((sum, t) => sum + (t.netto || 0), 0);
      const totalTransactions = filteredTransactions.length;
      const achievementPercentage = period.target > 0 ? (totalNetto / period.target) * 100 : 0;
      
      // Calculate daily summary
      const dailyMap = new Map<string, number>();
      filteredTransactions.forEach(t => {
        const date = t.tanggal;
        dailyMap.set(date, (dailyMap.get(date) || 0) + (t.netto || 0));
      });
      
      const dailySummary = Array.from(dailyMap.entries())
        .map(([date, netto]) => ({ date, netto }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      const averageDaily = dailySummary.length > 0 
        ? totalNetto / dailySummary.length 
        : 0;
      
      // Calculate top buyers
      const buyerMap = new Map<string, { buyerName: string; netto: number; transactions: number }>();
      filteredTransactions.forEach(t => {
        const existing = buyerMap.get(t.pembeli) || { buyerName: t.pembeli, netto: 0, transactions: 0 };
        existing.netto += t.netto || 0;
        existing.transactions += 1;
        buyerMap.set(t.pembeli, existing);
      });
      
      const topBuyers = Array.from(buyerMap.values())
        .sort((a, b) => b.netto - a.netto)
        .slice(0, 5);
      
      // Recent activity (last 10 transactions)
      const recentActivity = filteredTransactions
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime())
        .slice(0, 10)
        .map(t => ({
          id: t.id || '',
          type: 'transaction' as const,
          description: `Transaksi ${t.pembeli} - ${t.netto?.toLocaleString('id-ID')} ton`,
          timestamp: t.updatedAt || t.createdAt || new Date().toISOString(),
          user: t.createdBy || 'System',
        }));
      
      setAnalytics({
        totalTransactions,
        totalNetto,
        totalTarget: period.target,
        achievementPercentage,
        averageDaily,
        topBuyers,
        dailySummary,
        recentActivity,
      });
    };
    
    calculateAnalytics();
  }, [transactions, filters, period, getFilteredTransactions]);

  // Handle sorting
  const handleSort = (key: keyof ProductionTransaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle form submission
  const handleSubmit = async (data: Omit<ProductionReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    try {
      const newTransaction: ProductionTransaction = {
        id: editingTransaction?.id || `transaction-${Date.now()}`,
        tanggal: data.tanggal,
        nopol: data.nopol,
        pembeli: data.pembeliNama, // Map pembeliNama to pembeli
        tujuan: data.tujuan,
        gross: data.grossTon,
        tare: data.tareTon,
        netto: data.nettoTon,
        notes: data.notes,
        status: data.status === 'REVIEWED' ? 'APPROVED' : (data.status as 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED') || 'DRAFT',
        createdAt: editingTransaction?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: data.createdBy,
      };

      if (editingTransaction) {
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? newTransaction : t));
        toast({
          title: "Transaksi diperbarui",
          description: "Data transaksi berhasil diperbarui"
        });
      } else {
        setTransactions(prev => [newTransaction, ...prev]);
        toast({
          title: "Transaksi ditambahkan",
          description: "Data transaksi baru berhasil ditambahkan"
        });
      }

      setIsFormOpen(false);
      setEditingTransaction(null);
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
  const handleEdit = (transaction: ProductionTransaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!id) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setSelectedTransactions(prev => prev.filter(tId => tId !== id));
        toast({
          title: "Transaksi dihapus",
          description: "Data transaksi berhasil dihapus"
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
    if (selectedTransactions.length === 0) {
      toast({
        title: "Tidak ada data dipilih",
        description: "Pilih minimal satu transaksi untuk melakukan aksi",
        variant: "destructive"
      });
      return;
    }

    try {
      switch (action) {
        case 'approve':
          setTransactions(prev => prev.map(t => 
            selectedTransactions.includes(t.id || '') 
              ? { ...t, status: 'APPROVED' as const, updatedAt: new Date().toISOString() }
              : t
          ));
          toast({
            title: "Transaksi disetujui",
            description: `${selectedTransactions.length} transaksi berhasil disetujui`
          });
          break;
        case 'reject':
          setTransactions(prev => prev.map(t => 
            selectedTransactions.includes(t.id || '') 
              ? { ...t, status: 'REJECTED' as const, updatedAt: new Date().toISOString() }
              : t
          ));
          toast({
            title: "Transaksi ditolak",
            description: `${selectedTransactions.length} transaksi berhasil ditolak`
          });
          break;
        case 'delete':
          if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedTransactions.length} transaksi?`)) {
            setTransactions(prev => prev.filter(t => !selectedTransactions.includes(t.id || '')));
            toast({
              title: "Transaksi dihapus",
              description: `${selectedTransactions.length} transaksi berhasil dihapus`
            });
          }
          break;
      }
      setSelectedTransactions([]);
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
      const filteredData = getFilteredTransactions();
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

  // Handle view transaction
  const handleView = (transaction: ProductionTransaction) => {
    // Implementation for viewing transaction details
    toast({
      title: "Detail Transaksi",
      description: `Melihat detail transaksi ${transaction.pembeli}`
    });
  };

  // Handle monthly target update
  const handleTargetUpdate = async (newTarget: number) => {
    try {
      const updatedPeriod = {
        ...period,
        target: newTarget,
        updatedAt: new Date().toISOString(),
      };
      setPeriod(updatedPeriod);
      toast({
        title: "Target diperbarui",
        description: `Target bulanan berhasil diubah menjadi ${newTarget.toLocaleString('id-ID')} ton`
      });
    } catch (error) {
      toast({
        title: "Gagal memperbarui target",
        description: "Terjadi kesalahan saat memperbarui target",
        variant: "destructive"
      });
    }
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Report</h1>
          <p className="text-muted-foreground">
            Laporan produksi periode {period.bulan}/{period.tahun}
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
          <Button
            variant="outline"
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {isSummaryExpanded ? 'Sembunyikan' : 'Tampilkan'} Summary
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Summary Section */}
      {isSummaryExpanded ? (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<ComponentLoader message="Memuat ringkasan produksi..." />}>
            <ProductionSummary
              transactions={transactions}
              analytics={analytics}
              buyerAnalytics={analytics.topBuyers}
              dailySummary={analytics.dailySummary}
              currentPeriod={`${period?.bulan}/${period?.tahun}` || ''}
              monthlyTarget={period?.target}
            />
          </Suspense>
        </LazyComponentErrorBoundary>
      ) : (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<ComponentLoader message="Memuat ringkasan kompak..." />}>
            <ProductionSummaryCompact
              analytics={analytics}
              monthlyTarget={period?.target}
            />
          </Suspense>
        </LazyComponentErrorBoundary>
      )}

      {/* Filters */}
      {isFiltersOpen && (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<ComponentLoader message="Memuat filter..." />}>
            <ProductionFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              buyers={buyers}
              isCollapsed={false}
              onToggleCollapse={() => setIsFiltersOpen(false)}
            />
          </Suspense>
        </LazyComponentErrorBoundary>
      )}

      {/* Data Table */}
      <LazyComponentErrorBoundary>
        <Suspense fallback={<ComponentLoader message="Memuat tabel data..." />}>
          <ProductionTable
            transactions={filteredTransactions}
            filters={filters}
            sortConfig={sortConfig}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onExport={handleExport}
            isLoading={isLoading}
          />
        </Suspense>
      </LazyComponentErrorBoundary>

      {/* Form Modal */}
      {isFormOpen && (
        <LazyComponentErrorBoundary>
          <Suspense fallback={<ComponentLoader message="Memuat form..." />}>
            <ProductionForm
              isOpen={isFormOpen}
              onClose={() => {
                setIsFormOpen(false);
                setEditingTransaction(null);
              }}
              formData={{
                tanggal: editingTransaction?.tanggal || '',
                nopol: editingTransaction?.nopol || '',
                pembeli_nama: editingTransaction?.pembeli || '',
                tujuan: editingTransaction?.tujuan || '',
                gross_ton: editingTransaction?.gross || 0,
                tare_ton: editingTransaction?.tare || 0,
                notes: editingTransaction?.notes || ''
              }}
              onFormDataChange={(field, value) => {
                // Handle form data changes if needed
              }}
              onSubmit={handleSubmit}
              editingTransaction={editingTransaction ? {
                id: editingTransaction.id,
                tanggal: editingTransaction.tanggal,
                nopol: editingTransaction.nopol,
                pembeliNama: editingTransaction.pembeli || '',
                tujuan: editingTransaction.tujuan || '',
                grossTon: editingTransaction.gross || 0,
                tareTon: editingTransaction.tare || 0,
                nettoTon: editingTransaction.netto || 0,
                notes: editingTransaction.notes,
                status: editingTransaction.status === 'REJECTED' ? 'REVIEWED' : (editingTransaction.status as 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'ARCHIVED') || 'DRAFT',
                createdBy: editingTransaction.createdBy || '',
                createdAt: editingTransaction.createdAt,
                updatedAt: editingTransaction.updatedAt
              } : null}
              buyers={buyers}
              isSubmitting={isSubmitting}
            />
          </Suspense>
        </LazyComponentErrorBoundary>
      )}
    </div>
  );
}

export default ProductionReport;