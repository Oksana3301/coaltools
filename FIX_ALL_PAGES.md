# 🔧 Fix Semua Halaman Coaltools - Step by Step

## 📊 Status Current Production:

| Page/Feature | API Endpoint | Status | Issue |
|-------------|--------------|--------|-------|
| ✅ Kas Kecil | `/api/kas-kecil` | **WORKING** | Fixed! |
| ❌ Kas Besar | `/api/kas-besar` | **ERROR** | Table schema issue |
| ❌ Karyawan | `/api/employees` | **ERROR** | Table schema issue |
| ❌ Payroll | `/api/payroll` | **ERROR** | Table schema issue |
| ❌ Pay Components | `/api/pay-components` | **ERROR** | Table schema issue |
| ❌ Buyers | `/api/buyers` | **ERROR** | Table schema issue |

---

## ✅ SOLUSI - Jalankan SQL Ini:

### ⚠️ PENTING: Gunakan File V2!

### File: `FIX_ALL_TABLES_V2.sql` (UPDATED - Fixed casing issue)

Script SQL ini akan:
1. ✅ **Create** semua table yang belum ada
2. ✅ **Add missing columns** ke table yang sudah ada
3. ✅ **Create indexes** untuk performance
4. ✅ **Verify** semua table dengan count records

### Tables yang akan di-fix:

1. **employees** - Untuk halaman Karyawan
2. **buyers** - Untuk halaman Buyers/Pembeli
3. **kas_besar_transactions** - Untuk halaman Kas Besar
4. **pay_components** - Untuk komponen gaji
5. **payroll_runs** - Untuk halaman Payroll
6. **payroll_lines** - Detail payroll per karyawan
7. **payroll_line_components** - Komponen detail payroll

---

## 🚀 CARA JALANKAN:

### Step 1: Buka Supabase
1. Login: https://app.supabase.com
2. Pilih project: **coaltools**
3. Klik: **SQL Editor**

### Step 2: Run SQL
1. Buka file: `FIX_ALL_TABLES_V2.sql` ⚠️ **GUNAKAN V2!**
2. Copy **SEMUA** isi file
3. Paste ke Supabase SQL Editor
4. Klik: **RUN** ▶️
5. Tunggu selesai (3-5 detik)

### Step 3: Verify Results
Setelah SQL selesai, Anda akan lihat hasil seperti ini:

```
table_name                 | record_count
---------------------------+-------------
employees                  | 0
buyers                     | 0
kas_besar_transactions     | 0
pay_components             | 0
payroll_runs               | 0
payroll_lines              | 0
kas_kecil_expenses         | 2

🎉 All tables created/verified successfully!
```

### Step 4: Trigger Redeploy
Saya akan trigger redeploy untuk clear Prisma cache.

---

## 📋 Setelah SQL Berhasil:

### Yang Harus Bekerja:

1. ✅ **Halaman Karyawan**
   - URL: `/coal-tools-karyawan`
   - Bisa lihat daftar karyawan
   - Bisa tambah/edit/hapus karyawan

2. ✅ **Halaman Kas Besar**
   - URL: `/coal-tools-kasbesar`
   - Bisa lihat transaksi kas besar
   - Bisa input transaksi baru

3. ✅ **Halaman Payroll**
   - URL: `/payroll-integrated`
   - Bisa buat payroll run
   - Bisa lihat daftar payroll

4. ✅ **Halaman Kalkulator Gaji**
   - URL: `/coal-tools-kalkulatorgaji`
   - Bisa hitung gaji karyawan

---

## 🔍 Verifikasi Production:

Setelah SQL dijalankan dan redeploy selesai:

### Test Endpoints:
```bash
# 1. Employees
curl https://coaltools.vercel.app/api/employees?page=1&limit=5

# 2. Buyers
curl https://coaltools.vercel.app/api/buyers

# 3. Kas Besar
curl https://coaltools.vercel.app/api/kas-besar?page=1&limit=5

# 4. Payroll
curl https://coaltools.vercel.app/api/payroll?page=1&limit=5

# 5. Pay Components
curl https://coaltools.vercel.app/api/pay-components
```

Semua harus return: `{"success": true, "data": [...]}`

---

## 📝 Detail Tables:

### 1. EMPLOYEES (Karyawan)
**Fields:**
- nama, nik, jabatan, site
- kontrakUpahHarian, defaultUangMakan, defaultUangBbm
- bankName, bankAccount, npwp
- aktif, createdAt, updatedAt

**Used by:**
- `/coal-tools-karyawan` - Halaman daftar karyawan
- `/coal-tools-kalkulatorgaji` - Pilih karyawan untuk hitung gaji
- `/payroll-integrated` - Pilih karyawan untuk payroll

### 2. BUYERS (Pembeli)
**Fields:**
- nama, hargaPerTonDefault
- alamat, telepon, email
- aktif, createdAt, updatedAt

**Used by:**
- Invoices
- Production reports
- Sales tracking

### 3. KAS_BESAR_TRANSACTIONS
**Fields:**
- tanggal, bulan, tipeAktivitas
- barang, banyak, satuan, hargaSatuan, total
- vendorNama, vendorTelp, vendorEmail
- status, notes, createdBy

**Used by:**
- `/coal-tools-kasbesar` - Halaman kas besar

### 4. PAY_COMPONENTS
**Fields:**
- nama, tipe (EARNING/DEDUCTION)
- metode (FLAT/PER_HARI/PERSENTASE/FORMULA)
- nominal, rate, formula
- aktif, taxable

**Used by:**
- `/payroll-integrated` - Komponen gaji (tunjangan, potongan)
- `/coal-tools-kalkulatorgaji` - Pilih komponen gaji

### 5. PAYROLL_RUNS
**Fields:**
- periodeAwal, periodeAkhir
- status (DRAFT/SUBMITTED/APPROVED/PAID)
- customFileName, notes
- createdBy, approvedBy

**Used by:**
- `/payroll-integrated` - Create payroll run
- `/payroll` - Lihat daftar payroll

### 6. PAYROLL_LINES
**Fields:**
- payrollRunId, employeeId, employeeName
- hariKerja, upahHarian, uangMakanHarian, uangBbmHarian
- overtimeHours, overtimeRate, cashbon
- bruto, pajakNominal, potonganLain, neto
- status, notes

**Used by:**
- Payroll detail per karyawan
- Export payroll PDF

---

## ⚠️ Important Notes:

1. **Safe untuk dijalankan berulang kali**
   - Pakai `CREATE TABLE IF NOT EXISTS`
   - Tidak hapus data existing

2. **Foreign Keys**
   - payroll_lines → payroll_runs (CASCADE DELETE)
   - payroll_lines → employees (CASCADE DELETE)
   - payroll_line_components → payroll_lines (CASCADE DELETE)

3. **Indexes dibuat untuk performance**
   - Searching by name
   - Filtering by status
   - Sorting by date

---

## 🆘 Troubleshooting:

### Error: "relation already exists"
✅ **Aman diabaikan** - Table sudah ada

### Error: "column already exists"
✅ **Aman diabaikan** - Column sudah ada

### Error: "foreign key constraint"
❌ **Perlu fix** - Delete dulu data yang referensinya error

---

**Status:** ⚠️ Menunggu user jalankan SQL di Supabase
**Next Step:** Trigger redeploy setelah SQL selesai
**Estimated Time:** 5 menit total
