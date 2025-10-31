# 🚀 Quick Fix - Database Policy Error

## Error yang Anda Alami:
```
ERROR: cannot alter type of a column used in a policy definition
DETAIL: policy login_activity_select_policy on table login_activity depends on column "role"
```

## ✅ SOLUSI CEPAT (1 File SQL Saja!)

### File: `fix-all-policies-and-enum.sql`

### Langkah Mudah:

1️⃣ **Buka Supabase**
   - https://supabase.com/dashboard
   - Pilih project Coaltools
   - Klik **SQL Editor**

2️⃣ **Run SQL**
   - Klik **New Query**
   - Copy SEMUA isi `fix-all-policies-and-enum.sql`
   - Paste ke editor
   - Klik **Run** (atau Ctrl+Enter)

3️⃣ **Tunggu Selesai**
   - Akan muncul banyak NOTICE (ini normal)
   - Tunggu sampai keluar hasil query di bawah

4️⃣ **Verify**
   - Scroll ke hasil paling bawah
   - Pastikan ada table dengan count records
   - Pastikan ada list policies baru

### Yang Akan Terjadi:

✅ Semua policies di SEMUA tables akan di-drop
✅ Kolom `role` diubah dari enum ke VARCHAR(50)
✅ Enum type `user_role` dihapus
✅ RLS di-enable kembali dengan policy sederhana
✅ Semua table bisa di-query tanpa error

### Hasil Akhir:

Setelah SQL berhasil, **SEMUA endpoint akan berfungsi:**

```bash
./test-all-crud.sh
```

Output:
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

## 🆘 Masih Error?

Jika masih error setelah run SQL:

1. Screenshot error message
2. Screenshot hasil query SQL
3. Check apakah semua NOTICE muncul
4. Pastikan tidak ada ERROR selain yang expected

---
**File SQL Location:** `/Users/atikadewisuryani/Desktop/coaltools/fix-all-policies-and-enum.sql`
