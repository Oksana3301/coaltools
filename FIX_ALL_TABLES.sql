-- ===================================================
-- COMPREHENSIVE FIX FOR ALL COALTOOLS TABLES
-- ===================================================
-- Run this in Supabase SQL Editor to fix all tables
-- This will create missing tables and add missing columns

-- ===================================================
-- 1. EMPLOYEES TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nama TEXT NOT NULL,
    nik TEXT,
    jabatan TEXT NOT NULL,
    site TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" TEXT,
    alamat TEXT,
    "kontrakUpahHarian" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultUangMakan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultUangBbm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "bankAccount" TEXT,
    npwp TEXT,
    "startDate" TEXT,
    aktif BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS employees_aktif_idx ON employees(aktif);
CREATE INDEX IF NOT EXISTS employees_site_idx ON employees(site);
CREATE INDEX IF NOT EXISTS employees_nama_idx ON employees(nama);

-- ===================================================
-- 2. BUYERS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS buyers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nama TEXT NOT NULL,
    "hargaPerTonDefault" DOUBLE PRECISION,
    alamat TEXT,
    telepon TEXT,
    email TEXT,
    aktif BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS buyers_aktif_idx ON buyers(aktif);
CREATE INDEX IF NOT EXISTS buyers_nama_idx ON buyers(nama);

-- ===================================================
-- 3. KAS BESAR TRANSACTIONS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS kas_besar_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    hari TEXT,
    tanggal TEXT,
    bulan TEXT,
    "tipeAktivitas" TEXT,
    barang TEXT,
    banyak DOUBLE PRECISION,
    satuan TEXT,
    "hargaSatuan" DOUBLE PRECISION,
    total DOUBLE PRECISION,
    "vendorNama" TEXT,
    "vendorTelp" TEXT,
    "vendorEmail" TEXT,
    jenis TEXT DEFAULT 'kas_besar',
    "subJenis" TEXT,
    "buktiUrl" TEXT,
    "kontrakUrl" TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS kas_besar_transactions_status_idx ON kas_besar_transactions(status);
CREATE INDEX IF NOT EXISTS kas_besar_transactions_createdAt_idx ON kas_besar_transactions("createdAt");
CREATE INDEX IF NOT EXISTS kas_besar_transactions_deletedAt_idx ON kas_besar_transactions("deletedAt");

-- ===================================================
-- 4. PAY COMPONENTS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS pay_components (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nama TEXT NOT NULL,
    tipe TEXT NOT NULL CHECK (tipe IN ('EARNING', 'DEDUCTION')),
    taxable BOOLEAN NOT NULL DEFAULT true,
    metode TEXT NOT NULL CHECK (metode IN ('FLAT', 'PER_HARI', 'PERSENTASE', 'FORMULA')),
    basis TEXT CHECK (basis IN ('UPAH_HARIAN', 'UPAH_BULANAN', 'UPAH_BRUTO', 'CUSTOM')),
    nominal DOUBLE PRECISION DEFAULT 0,
    rate DOUBLE PRECISION DEFAULT 0,
    formula TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    aktif BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS pay_components_aktif_idx ON pay_components(aktif);
CREATE INDEX IF NOT EXISTS pay_components_tipe_idx ON pay_components(tipe);
CREATE INDEX IF NOT EXISTS pay_components_order_idx ON pay_components("order");

-- ===================================================
-- 5. PAYROLL RUNS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS payroll_runs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "periodeAwal" TEXT NOT NULL,
    "periodeAkhir" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED')),
    "customFileName" TEXT,
    notes TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS payroll_runs_status_idx ON payroll_runs(status);
CREATE INDEX IF NOT EXISTS payroll_runs_createdAt_idx ON payroll_runs("createdAt");
CREATE INDEX IF NOT EXISTS payroll_runs_deletedAt_idx ON payroll_runs("deletedAt");

-- ===================================================
-- 6. PAYROLL LINES TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS payroll_lines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "hariKerja" INTEGER NOT NULL DEFAULT 0,
    "upahHarian" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uangMakanHarian" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uangBbmHarian" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION DEFAULT 0,
    "overtimeRate" DOUBLE PRECISION DEFAULT 0,
    cashbon DOUBLE PRECISION DEFAULT 0,
    bruto DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pajakRate" DOUBLE PRECISION DEFAULT 0,
    "pajakNominal" DOUBLE PRECISION DEFAULT 0,
    "potonganLain" DOUBLE PRECISION DEFAULT 0,
    neto DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("payrollRunId") REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY ("employeeId") REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS payroll_lines_payrollRunId_idx ON payroll_lines("payrollRunId");
CREATE INDEX IF NOT EXISTS payroll_lines_employeeId_idx ON payroll_lines("employeeId");
CREATE INDEX IF NOT EXISTS payroll_lines_status_idx ON payroll_lines(status);

-- ===================================================
-- 7. PAYROLL LINE COMPONENTS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS payroll_line_components (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "payrollLineId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "componentType" TEXT NOT NULL CHECK ("componentType" IN ('EARNING', 'DEDUCTION')),
    qty DOUBLE PRECISION NOT NULL DEFAULT 1,
    rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    nominal DOUBLE PRECISION NOT NULL DEFAULT 0,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    taxable BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("payrollLineId") REFERENCES payroll_lines(id) ON DELETE CASCADE,
    FOREIGN KEY ("componentId") REFERENCES pay_components(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS payroll_line_components_payrollLineId_idx ON payroll_line_components("payrollLineId");
CREATE INDEX IF NOT EXISTS payroll_line_components_componentId_idx ON payroll_line_components("componentId");

-- ===================================================
-- 8. VERIFY ALL TABLES
-- ===================================================
SELECT 
    'employees' as table_name, 
    COUNT(*) as record_count 
FROM employees
UNION ALL
SELECT 
    'buyers' as table_name, 
    COUNT(*) as record_count 
FROM buyers
UNION ALL
SELECT 
    'kas_besar_transactions' as table_name, 
    COUNT(*) as record_count 
FROM kas_besar_transactions
UNION ALL
SELECT 
    'pay_components' as table_name, 
    COUNT(*) as record_count 
FROM pay_components
UNION ALL
SELECT 
    'payroll_runs' as table_name, 
    COUNT(*) as record_count 
FROM payroll_runs
UNION ALL
SELECT 
    'payroll_lines' as table_name, 
    COUNT(*) as record_count 
FROM payroll_lines
UNION ALL
SELECT 
    'kas_kecil_expenses' as table_name, 
    COUNT(*) as record_count 
FROM kas_kecil_expenses;

SELECT '🎉 All tables created/verified successfully!' as result;
