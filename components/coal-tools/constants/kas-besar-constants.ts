export const KAS_BESAR_TIPE_AKTIVITAS = [
  "pembelian_aset",
  "kontrak_jasa",
  "pembelian_material",
  "maintenance_equipment",
  "pembayaran_vendor",
  "investasi_proyek",
  "pembelian_kendaraan",
  "renovasi_fasilitas",
  "pembelian_software",
  "pelatihan_karyawan"
]

export const KAS_BESAR_SUB_JENIS = [
  "alat_berat",
  "kontrak_vendor",
  "material_bangunan",
  "peralatan_office",
  "kendaraan_operasional",
  "software_license",
  "pelatihan_teknis",
  "maintenance_rutin",
  "investasi_tambang",
  "fasilitas_produksi"
]

export const SATUAN_OPTIONS = [
  { value: "unit", label: "Unit" },
  { value: "bulan", label: "Bulan" },
  { value: "tahun", label: "Tahun" },
  { value: "paket", label: "Paket" },
  { value: "kontrak", label: "Kontrak" },
  { value: "meter", label: "Meter" },
  { value: "m2", label: "Meter Persegi" },
  { value: "lot", label: "Lot" },
  { value: "set", label: "Set" }
] as const

export const TIPE_AKTIVITAS_OPTIONS = [
  { value: "pembelian_aset", label: "Pembelian Aset" },
  { value: "sewa_kontrak", label: "Sewa/Kontrak" },
  { value: "investasi", label: "Investasi" },
  { value: "pembayaran_kredit", label: "Pembayaran Kredit" },
  { value: "pajak_retribusi", label: "Pajak & Retribusi" },
  { value: "kontrak_jasa", label: "Kontrak Jasa" }
] as const

export const SUB_JENIS_OPTIONS = [
  { value: "alat_berat", label: "Alat Berat" },
  { value: "sewa_alat", label: "Sewa Alat" },
  { value: "kontrak_besar", label: "Kontrak Besar" },
  { value: "investasi_infrastruktur", label: "Investasi Infrastruktur" },
  { value: "pembelian_aset", label: "Pembelian Aset" },
  { value: "kontrak_vendor", label: "Kontrak Vendor" },
  { value: "pembayaran_kredit", label: "Pembayaran Kredit" },
  { value: "pajak_besar", label: "Pajak & Retribusi Besar" },
  { value: "lain_lain", label: "Lain-lain" }
] as const

export const KAS_BESAR_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", color: "gray" },
  { value: "SUBMITTED", label: "Diajukan", color: "blue" },
  { value: "REVIEWED", label: "Direview", color: "yellow" },
  { value: "APPROVED", label: "Disetujui", color: "green" },
  { value: "REJECTED", label: "Ditolak", color: "red" },
  { value: "ARCHIVED", label: "Diarsipkan", color: "gray" }
] as const

export const KAS_BESAR_MINIMUM_AMOUNT = 10000000 // 10 juta rupiah

export type KasBesarStatus = typeof KAS_BESAR_STATUS_OPTIONS[number]['value']
export type TipeAktivitas = typeof TIPE_AKTIVITAS_OPTIONS[number]['value']
export type SubJenis = typeof SUB_JENIS_OPTIONS[number]['value']
export type Satuan = typeof SATUAN_OPTIONS[number]['value']