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
  createdBy: string
  createdAt?: string
  updatedAt?: string
  approvalNotes?: string
  approvedBy?: string
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

export interface KasBesarFilters {
  search?: string
  tipeAktivitas?: string
  status?: string
  vendor?: string
  tanggalDari?: string
  tanggalSampai?: string
  minTotal?: number
  maxTotal?: number
}

export interface KasBesarSummary {
  totalTransactions: number
  totalAmount: number
  pendingApproval: number
  approved: number
  rejected: number
}