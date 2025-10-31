# 🔧 Langkah-Langkah Memperbaiki Database - IKUTI URUTAN INI!

## ⚠️ PENTING: Jalankan sesuai urutan, jangan skip!

---

## LANGKAH 1: Fix Policy dan Enum Issues

### File: `fix-all-policies-and-enum.sql`

**Apa yang dilakukan:**
- ✅ Drop semua policies yang menghalangi ALTER TABLE
- ✅ Ubah kolom `role` dari enum ke VARCHAR(50)
- ✅ Hapus enum type `user_role`
- ✅ Buat policies baru yang sederhana

**Cara menjalankan:**

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project **Coaltools**
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy-paste **SELURUH ISI** file `fix-all-policies-and-enum.sql`
6. Klik **Run** (atau Ctrl+Enter)
7. Tunggu sampai muncul hasil di bawah

**Yang harus muncul:**
- Banyak NOTICE: "Dropped policy: ..." (ini NORMAL dan BAGUS!)
- Table dengan count records
- List policies baru

**Kalau SUKSES, lanjut ke LANGKAH 2!**

---

## LANGKAH 2: Check Column Naming Convention

### File: `check-column-names.sql`

**Apa yang dilakukan:**
- 🔍 Cek apakah database pakai camelCase atau snake_case
- 🔍 Tampilkan semua foreign key yang ada

**Cara menjalankan:**

1. Di SQL Editor yang sama
2. Klik **New Query** lagi
3. Copy-paste **SELURUH ISI** file `check-column-names.sql`
4. Klik **Run**
5. **SCREENSHOT HASILNYA** atau catat:
   - Apakah ada kolom bernama `payrollRunId` atau `payroll_run_id`?
   - Apakah ada kolom bernama `employeeId` atau `employee_id`?

**Contoh hasil:**

Jika muncul kolom seperti ini = **SNAKE_CASE**:
```
payroll_run_id
employee_id
component_id
```

Jika muncul kolom seperti ini = **CAMELCASE**:
```
payrollRunId
employeeId
componentId
```

**CATAT HASILNYA untuk LANGKAH 3!**

---

## LANGKAH 3: Fix Foreign Key Relationships

### File: `verify-and-fix-relationships-v2.sql`

**Apa yang dilakukan:**
- ✅ Drop semua foreign key constraints lama
- ✅ Buat foreign key constraints baru dengan CASCADE rules

**Cara menjalankan:**

1. Buka file `verify-and-fix-relationships-v2.sql`
2. **PENTING:** Berdasarkan hasil LANGKAH 2:

   **A. Jika database pakai SNAKE_CASE (payroll_run_id):**
   - Scroll ke bagian `-- VERSION A:` (sekitar line 123)
   - **HAPUS** `/*` di line 123 dan `*/` di line 165
   - **BIARKAN** VERSION B tetap di-comment

   **B. Jika database pakai CAMELCASE (payrollRunId):**
   - Scroll ke bagian `-- VERSION B:` (sekitar line 170)
   - **HAPUS** `/*` di line 170 dan `*/` di line 212
   - **BIARKAN** VERSION A tetap di-comment

3. Setelah uncomment yang sesuai:
   - Kembali ke Supabase SQL Editor
   - Klik **New Query**
   - Copy-paste **SELURUH ISI** file `verify-and-fix-relationships-v2.sql` (yang sudah di-uncomment)
   - Klik **Run**

**Yang harus muncul:**
- List kolom di payroll_lines, employee_component_selections, payroll_line_components
- List foreign keys yang sudah diperbaiki

**Kalau SUKSES, SELESAI! Semua database sudah fixed!**

---

## ✅ VERIFIKASI: Test Semua Endpoint

Setelah ketiga langkah di atas selesai:

```bash
./test-all-crud.sh
```

**Expected Output:**
```
✅ Kas Kecil - SUCCESS
✅ Kas Besar - SUCCESS
✅ Kas Besar Stats - SUCCESS
✅ Employees - SUCCESS
✅ Buyers - SUCCESS
✅ Pay Components - SUCCESS
✅ Payroll - SUCCESS
✅ Users - SUCCESS
```

---

## 🆘 Troubleshooting

### Error saat LANGKAH 1:
**Error:** "policy ... still exists"
**Solusi:** Jalankan ulang scriptnya, kadang perlu 2x

### Error saat LANGKAH 3:
**Error:** "column ... does not exist"
**Solusi:** Berarti salah pilih VERSION! Cek lagi hasil LANGKAH 2:
- Kalau ada `payroll_run_id` → pakai VERSION A
- Kalau ada `payrollRunId` → pakai VERSION B

### Test masih gagal setelah semua langkah:
1. Screenshot error yang muncul
2. Run query ini di Supabase:
   ```sql
   SELECT * FROM users LIMIT 1;
   SELECT column_name FROM information_schema.columns WHERE table_name = 'payroll_lines';
   ```
3. Share hasilnya

---

## 📋 Checklist

- [ ] LANGKAH 1: Run `fix-all-policies-and-enum.sql` ✅
- [ ] LANGKAH 2: Run `check-column-names.sql` dan catat hasilnya ✅
- [ ] LANGKAH 3: Uncomment VERSION yang sesuai di `verify-and-fix-relationships-v2.sql` ✅
- [ ] LANGKAH 3: Run `verify-and-fix-relationships-v2.sql` ✅
- [ ] VERIFIKASI: Run `./test-all-crud.sh` dan semua SUCCESS ✅

---

**Jika ada error di langkah manapun, STOP dan screenshot errornya sebelum lanjut!**
