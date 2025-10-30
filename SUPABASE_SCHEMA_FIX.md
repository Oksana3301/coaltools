# 🔧 Fix Database Schema di Supabase

## ❌ Masalah
Halaman **Kas Kecil** di production menampilkan error:
```
Database Unavailable
Unable to connect to the database
```

Padahal database **sudah connected**, tapi ada **schema mismatch**:
```
The column `kas_kecil_expenses.tipeAktivitas` does not exist in the current database.
```

## ✅ Solusi

### Langkah 1: Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project **coaltools**
3. Klik **SQL Editor** di sidebar kiri

### Langkah 2: Jalankan SQL Script
Copy dan paste SQL script di bawah ini ke SQL Editor, lalu klik **Run**:

```sql
-- ===================================================
-- FIX KAS KECIL EXPENSES TABLE SCHEMA
-- ===================================================

DO $$
BEGIN
    -- Add missing columns to kas_kecil_expenses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'tipeAktivitas') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "tipeAktivitas" TEXT;
        RAISE NOTICE 'Added column tipeAktivitas';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'hari') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "hari" TEXT;
        RAISE NOTICE 'Added column hari';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'tanggal') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "tanggal" TEXT;
        RAISE NOTICE 'Added column tanggal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'bulan') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "bulan" TEXT;
        RAISE NOTICE 'Added column bulan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'barang') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "barang" TEXT;
        RAISE NOTICE 'Added column barang';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'banyak') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "banyak" DOUBLE PRECISION;
        RAISE NOTICE 'Added column banyak';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'satuan') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "satuan" TEXT;
        RAISE NOTICE 'Added column satuan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'hargaSatuan') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "hargaSatuan" DOUBLE PRECISION;
        RAISE NOTICE 'Added column hargaSatuan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'total') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "total" DOUBLE PRECISION;
        RAISE NOTICE 'Added column total';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'vendorNama') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "vendorNama" TEXT;
        RAISE NOTICE 'Added column vendorNama';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'vendorTelp') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "vendorTelp" TEXT;
        RAISE NOTICE 'Added column vendorTelp';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'vendorEmail') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "vendorEmail" TEXT;
        RAISE NOTICE 'Added column vendorEmail';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'jenis') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "jenis" TEXT;
        RAISE NOTICE 'Added column jenis';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'subJenis') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "subJenis" TEXT;
        RAISE NOTICE 'Added column subJenis';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'buktiUrl') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "buktiUrl" TEXT;
        RAISE NOTICE 'Added column buktiUrl';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'notes') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "notes" TEXT;
        RAISE NOTICE 'Added column notes';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'deletedAt') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "deletedAt" TIMESTAMP(3);
        RAISE NOTICE 'Added column deletedAt';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_status_idx ON kas_kecil_expenses(status);
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_createdAt_idx ON kas_kecil_expenses("createdAt");
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_deletedAt_idx ON kas_kecil_expenses("deletedAt");

-- Verify the schema is correct
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'kas_kecil_expenses'
ORDER BY ordinal_position;
```

### Langkah 3: Verifikasi
Setelah menjalankan SQL, Anda akan melihat hasil query yang menampilkan semua kolom di table `kas_kecil_expenses`.

### Langkah 4: Test Production
Buka halaman Kas Kecil di production:
```
https://coaltools.vercel.app/coal-tools-kaskecil
```

Error "Database Unavailable" seharusnya sudah hilang! ✅

## 📊 Status Sekarang

✅ **Database Connected** - PostgreSQL Supabase terhubung
✅ **API Routes Fixed** - 12 API routes sudah diperbaiki
✅ **Null Safety Added** - Semua functions punya null checks
⚠️ **Schema Mismatch** - Perlu sync kolom di Supabase (gunakan SQL di atas)

## 🔍 Penjelasan Masalah

Prisma schema di code punya field `tipeAktivitas`, tapi table di Supabase tidak punya kolom ini. Makanya muncul error:
```
The column `kas_kecil_expenses.tipeAktivitas` does not exist
```

Solusinya adalah **menambahkan kolom yang hilang** ke Supabase database menggunakan SQL ALTER TABLE.

## 📝 Catatan

- Script SQL di atas **aman dijalankan berulang kali** (idempotent)
- Menggunakan `IF NOT EXISTS` jadi tidak error kalau kolom sudah ada
- Tidak menghapus data yang sudah ada
- Menambahkan index untuk performance yang lebih baik

---

**File ini dibuat oleh:** Claude Code
**Tanggal:** 30 Oktober 2025
**Status:** Siap dijalankan di Supabase SQL Editor
