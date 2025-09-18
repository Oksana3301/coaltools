# Panduan Testing PDF Generation Payroll

## 📋 Overview
Dokumen ini berisi panduan lengkap untuk melakukan testing PDF generation pada sistem payroll dengan menggunakan data mockup yang telah disiapkan.

## 🎯 Data Mockup yang Tersedia

### 👥 Karyawan Dummy
1. **Budi Santoso** (Supervisor Produksi)
   - NIK: 3201012345678901
   - Site: Site A - Tambang Utama
   - Upah Harian: Rp 350,000
   - Bank: Mandiri - 1234567890
   - NPWP: 12.345.678.9-012.000
   - Hari Kerja: 22 hari
   - Lembur: 15 jam
   - Bruto: Rp 12,204,375
   - Neto: Rp 10,646,331

2. **Siti Nurhaliza** (Operator Alat Berat)
   - NIK: 3201012345678902
   - Site: Site B - Tambang Eksplorasi
   - Upah Harian: Rp 280,000
   - Bank: BCA - 0987654321
   - NPWP: 98.765.432.1-098.000
   - Hari Kerja: 20 hari
   - Lembur: 8 jam
   - Bruto: Rp 9,170,000
   - Neto: Rp 8,100,155

### 💰 Komponen Payroll Lengkap

#### 📈 Pendapatan (Earnings)
- **Gaji Pokok**: Berdasarkan upah harian × hari kerja
- **Tunjangan Transport**: Rp 25,000/hari
- **Tunjangan Makan**: Rp 35,000/hari
- **Tunjangan Kesehatan**: Rp 500,000/bulan (non-taxable)
- **Tunjangan Keluarga**: Rp 300,000/bulan
- **Bonus Kinerja**: Variable (Budi: Rp 1,000,000, Siti: Rp 750,000)
- **Lembur**: 1.5x rate normal per jam
- **Tunjangan BBM**: Rp 400,000/bulan

#### 📉 Potongan (Deductions)
- **BPJS Kesehatan**: 1% dari bruto
- **BPJS Ketenagakerjaan**: 2% dari bruto
- **PPh 21**: 5% dari penghasilan kena pajak
- **Potongan Kasbon**: Variable (Budi: Rp 500,000, Siti: Rp 300,000)
- **Potongan Keterlambatan**: Variable (Budi: Rp 50,000, Siti: Rp 0)
- **Iuran Koperasi**: Rp 50,000/bulan

## 🆔 Informasi Testing

### Payroll Run ID
```
cmfo7uu8o000uay358gsk70oi
```

### Periode Payroll
- **Periode Awal**: 2025-09-01
- **Periode Akhir**: 2025-09-30
- **Status**: APPROVED

### Total Summary
- **Jumlah Karyawan**: 2 orang
- **Total Bruto**: Rp 21,374,375
- **Total Neto**: Rp 18,746,486

## 🔗 API Endpoints untuk Testing

### 1. Get Payroll Details
```http
GET /api/payroll/cmfo7uu8o000uay358gsk70oi
```

### 2. Generate PDF
```http
POST /api/payroll/cmfo7uu8o000uay358gsk70oi/pdf
```

### 3. Export Data
```http
GET /api/payroll/cmfo7uu8o000uay358gsk70oi/export
```

## 📋 Skenario Testing

### ✅ Test Case 1: Basic PDF Generation
- **Tujuan**: Memastikan PDF dapat di-generate dengan data standar
- **Expected**: PDF berisi slip gaji untuk 2 karyawan dengan semua komponen
- **Validasi**: 
  - Header perusahaan
  - Informasi karyawan lengkap
  - Breakdown earnings dan deductions
  - Total bruto dan neto

### ✅ Test Case 2: Overtime Calculation
- **Tujuan**: Validasi perhitungan lembur
- **Data**: Budi (15 jam), Siti (8 jam)
- **Expected**: Perhitungan lembur 1.5x rate normal
- **Validasi**: 
  - Jam lembur tercantum
  - Rate lembur benar (1.5x)
  - Total lembur sesuai perhitungan

### ✅ Test Case 3: Deduction Scenarios
- **Tujuan**: Validasi semua jenis potongan
- **Expected**: BPJS, Pajak, Kasbon, Koperasi terhitung benar
- **Validasi**:
  - BPJS Kesehatan: 1% dari bruto
  - BPJS Ketenagakerjaan: 2% dari bruto
  - PPh 21: 5% dari taxable income
  - Potongan lain sesuai data

### ✅ Test Case 4: Different Employee Types
- **Tujuan**: Memastikan PDF handle berbeda jenis karyawan
- **Data**: Supervisor vs Operator dengan gaji berbeda
- **Expected**: Format konsisten untuk kedua tipe

### ✅ Test Case 5: Bank Details
- **Tujuan**: Validasi informasi transfer bank
- **Expected**: Nama bank dan nomor rekening tercantum
- **Validasi**:
  - Bank Mandiri - 1234567890 (Budi)
  - Bank BCA - 0987654321 (Siti)

### ✅ Test Case 6: Tax Calculations
- **Tujuan**: Validasi perhitungan pajak
- **Expected**: PPh 21 dihitung dari taxable income
- **Validasi**: Komponen non-taxable tidak kena pajak

## 🚀 Cara Menjalankan Testing

### 1. Persiapan Data
```bash
# Jalankan seed data (jika belum)
node scripts/seed-payroll-mockup.js

# Validasi data
node scripts/test-payroll-mockup.js
```

### 2. Testing via Browser
1. Buka aplikasi di `http://localhost:3000`
2. Login sebagai admin
3. Navigate ke halaman payroll
4. Pilih payroll run dengan ID: `cmfo7uu8o000uay358gsk70oi`
5. Klik tombol "Generate PDF" atau "Export"

### 3. Testing via API
```bash
# Test get payroll data
curl -X GET http://localhost:3000/api/payroll/cmfo7uu8o000uay358gsk70oi

# Test PDF generation
curl -X POST http://localhost:3000/api/payroll/cmfo7uu8o000uay358gsk70oi/pdf
```

## 📄 Expected PDF Content

### Header Section
- Logo perusahaan (jika ada)
- Nama perusahaan
- Periode payroll
- Tanggal generate

### Employee Section (Per Karyawan)
- **Informasi Personal**:
  - Nama lengkap
  - NIK
  - Jabatan
  - Site/Lokasi kerja
  - NPWP

- **Informasi Bank**:
  - Nama bank
  - Nomor rekening

- **Detail Payroll**:
  - Hari kerja
  - Jam lembur
  - Upah harian

- **Breakdown Earnings**:
  - Gaji pokok
  - Semua tunjangan
  - Bonus
  - Lembur
  - **Subtotal Bruto**

- **Breakdown Deductions**:
  - BPJS Kesehatan
  - BPJS Ketenagakerjaan
  - PPh 21
  - Kasbon
  - Potongan lain
  - **Subtotal Potongan**

- **Summary**:
  - **Total Bruto**: Rp xxx
  - **Total Potongan**: Rp xxx
  - **Take Home Pay (Neto)**: Rp xxx

### Footer Section
- Tanda tangan digital
- Tanggal cetak
- Disclaimer

## 🔍 Validasi Results

### ✅ PDF Quality Checks
- [ ] PDF dapat dibuka tanpa error
- [ ] Font readable dan konsisten
- [ ] Layout rapi dan professional
- [ ] Tidak ada data yang terpotong
- [ ] Perhitungan matematis benar

### ✅ Data Accuracy Checks
- [ ] Nama karyawan benar
- [ ] NIK dan NPWP sesuai
- [ ] Bank details akurat
- [ ] Semua komponen earnings tercantum
- [ ] Semua deductions terhitung benar
- [ ] Total bruto = sum of earnings
- [ ] Total neto = bruto - deductions

### ✅ Business Logic Checks
- [ ] Lembur rate 1.5x benar
- [ ] BPJS percentage benar
- [ ] Tax calculation akurat
- [ ] Non-taxable items tidak kena pajak

## 🛠️ Troubleshooting

### Error: "Payroll run not found"
```bash
# Re-run seed script
node scripts/seed-payroll-mockup.js
```

### Error: "PDF generation failed"
- Check server logs
- Verify all required fields ada
- Ensure PDF library installed

### Error: "Calculation mismatch"
```bash
# Run validation script
node scripts/test-payroll-mockup.js
```

## 📊 Performance Testing

### Load Testing
- Generate PDF untuk 2 karyawan: < 3 detik
- Memory usage: Monitor untuk memory leaks
- File size: PDF should be < 1MB

### Scalability Testing
- Test dengan data lebih banyak karyawan
- Batch PDF generation
- Concurrent requests

## 🎉 Kesimpulan

Data mockup payroll telah disiapkan dengan lengkap dan realistis untuk testing PDF generation. Semua skenario payroll umum telah dicakup:

- ✅ 2 Karyawan dengan profil berbeda
- ✅ 14 Komponen payroll lengkap
- ✅ Perhitungan lembur, BPJS, dan pajak
- ✅ Skenario kasbon dan potongan
- ✅ Data bank untuk transfer
- ✅ Validasi integritas data

**Ready untuk testing PDF generation!** 🚀

---

*Generated by PayrollMockup Seeder v1.0*  
*Payroll Run ID: `cmfo7uu8o000uay358gsk70oi`*