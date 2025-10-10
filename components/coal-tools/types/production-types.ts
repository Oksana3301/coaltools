export interface ProductionPeriod {
  id: string;
  bulan: number;
  tahun: number;
  target: number;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  start_date?: string;
  end_date?: string;
  harga_per_ton_default?: number;
  deposit_opening_ton?: number;
  adj_plus_ton?: number;
  adj_minus_ton?: number;
  total_penjualan_ton?: number;
  total_harga_penjualan?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  date: string;
  netto: number;
  totalNetto?: number;
  transactionCount?: number;
  averageNetto?: number;
}

export interface ProductionFormData {
  tanggal: string;
  nopol: string;
  pembeli_nama: string;
  tujuan: string;
  gross_ton: number;
  tare_ton: number;
  notes: string;
}

export interface ProductionAnalytics {
  totalTransactions: number;
  totalNetto: number;
  totalTarget: number;
  achievementPercentage: number;
  averageDaily: number;
  topBuyers: BuyerAnalytics[];
  dailySummary: DailySummary[];
  recentActivity: RecentActivity[];
}

export interface ProductionFilters {
  search: string;
  status: string;
  tanggalDari: string;
  tanggalSampai: string;
  pembeli: string;
}

export interface BuyerAnalytics {
  buyerName: string;
  netto: number;
  transactions: number;
  totalNetto?: number;
  transactionCount?: number;
  averagePerTransaction?: number;
}

export interface DeleteDialogState {
  type: 'transaction' | 'buyer';
  id: string;
  name: string;
}

export interface RecentActivity {
  id: string;
  type: 'transaction' | 'update' | 'delete';
  description: string;
  timestamp: string;
  user: string;
}

// Production Transaction interface (matching existing API structure)
export interface ProductionTransaction {
  id?: string;
  tanggal: string;
  nopol: string;
  pembeli: string;
  tujuan?: string;
  kapal?: string;
  gross?: number;
  tare?: number;
  netto?: number;
  notes?: string;
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}