-- ===================================================
-- SAFE FIX FOR ALL COALTOOLS TABLES - V3
-- This version drops and recreates everything cleanly
-- ===================================================
-- IMPORTANT: This will drop existing tables!
-- Backup data first if needed!

-- ===================================================
-- 1. DROP EXISTING TABLES (in correct order due to foreign keys)
-- ===================================================
DROP TABLE IF EXISTS payroll_line_components CASCADE;
DROP TABLE IF EXISTS payroll_lines CASCADE;
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS pay_components CASCADE;
DROP TABLE IF EXISTS kas_besar_transactions CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Note: Keep kas_kecil_expenses as it's already working

-- ===================================================
-- 2. CREATE EMPLOYEES TABLE
-- ===================================================
CREATE TABLE employees (
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

CREATE INDEX idx_employees_aktif ON employees(aktif);
CREATE INDEX idx_employees_site ON employees(site);
CREATE INDEX idx_employees_nama ON employees(nama);

-- ===================================================
-- 3. CREATE BUYERS TABLE
-- ===================================================
CREATE TABLE buyers (
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

CREATE INDEX idx_buyers_aktif ON buyers(aktif);
CREATE INDEX idx_buyers_nama ON buyers(nama);

-- ===================================================
-- 4. CREATE KAS BESAR TRANSACTIONS TABLE
-- ===================================================
CREATE TABLE kas_besar_transactions (
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

CREATE INDEX idx_kas_besar_status ON kas_besar_transactions(status);
CREATE INDEX idx_kas_besar_created ON kas_besar_transactions("createdAt");
CREATE INDEX idx_kas_besar_deleted ON kas_besar_transactions("deletedAt");

-- ===================================================
-- 5. CREATE PAY COMPONENTS TABLE
-- ===================================================
CREATE TABLE pay_components (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nama TEXT NOT NULL,
    tipe TEXT NOT NULL,
    taxable BOOLEAN NOT NULL DEFAULT true,
    metode TEXT NOT NULL,
    basis TEXT,
    nominal DOUBLE PRECISION DEFAULT 0,
    rate DOUBLE PRECISION DEFAULT 0,
    formula TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    aktif BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pay_components_aktif ON pay_components(aktif);
CREATE INDEX idx_pay_components_tipe ON pay_components(tipe);
CREATE INDEX idx_pay_components_order ON pay_components("order");

-- ===================================================
-- 6. CREATE PAYROLL RUNS TABLE
-- ===================================================
CREATE TABLE payroll_runs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "periodeAwal" TEXT NOT NULL,
    "periodeAkhir" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    "customFileName" TEXT,
    notes TEXT,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3)
);

CREATE INDEX idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX idx_payroll_runs_created ON payroll_runs("createdAt");
CREATE INDEX idx_payroll_runs_deleted ON payroll_runs("deletedAt");

-- ===================================================
-- 7. CREATE PAYROLL LINES TABLE
-- ===================================================
CREATE TABLE payroll_lines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "payrollRunId" TEXT NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    "employeeId" TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_lines_run ON payroll_lines("payrollRunId");
CREATE INDEX idx_payroll_lines_employee ON payroll_lines("employeeId");
CREATE INDEX idx_payroll_lines_status ON payroll_lines(status);

-- ===================================================
-- 8. CREATE PAYROLL LINE COMPONENTS TABLE
-- ===================================================
CREATE TABLE payroll_line_components (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "payrollLineId" TEXT NOT NULL REFERENCES payroll_lines(id) ON DELETE CASCADE,
    "componentId" TEXT NOT NULL REFERENCES pay_components(id) ON DELETE CASCADE,
    "componentName" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    qty DOUBLE PRECISION NOT NULL DEFAULT 1,
    rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    nominal DOUBLE PRECISION NOT NULL DEFAULT 0,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    taxable BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_line_comp_line ON payroll_line_components("payrollLineId");
CREATE INDEX idx_payroll_line_comp_comp ON payroll_line_components("componentId");

-- ===================================================
-- 9. VERIFY TABLES
-- ===================================================
SELECT 
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size
FROM pg_tables
WHERE tablename IN (
    'employees', 
    'buyers', 
    'kas_besar_transactions', 
    'pay_components',
    'payroll_runs',
    'payroll_lines',
    'payroll_line_components',
    'kas_kecil_expenses'
)
AND schemaname = 'public'
ORDER BY tablename;

-- ===================================================
-- 10. INSERT SAMPLE DATA (Optional - for testing)
-- ===================================================
-- Uncomment if you want sample data

-- INSERT INTO employees (nama, nik, jabatan, site, "kontrakUpahHarian", "defaultUangMakan", "defaultUangBbm", aktif)
-- VALUES 
--     ('John Doe', 'EMP001', 'Operator', 'Site A', 150000, 25000, 30000, true),
--     ('Jane Smith', 'EMP002', 'Supervisor', 'Site A', 200000, 30000, 35000, true);

-- INSERT INTO buyers (nama, "hargaPerTonDefault", aktif)
-- VALUES 
--     ('PT Buyer A', 850000, true),
--     ('PT Buyer B', 900000, true);

-- INSERT INTO pay_components (nama, tipe, metode, basis, nominal, aktif, "order")
-- VALUES 
--     ('Tunjangan Makan', 'EARNING', 'PER_HARI', 'UPAH_HARIAN', 25000, true, 1),
--     ('Tunjangan BBM', 'EARNING', 'PER_HARI', 'UPAH_HARIAN', 30000, true, 2),
--     ('Potongan BPJS', 'DEDUCTION', 'PERSENTASE', 'UPAH_BRUTO', 0.01, true, 3);

SELECT '🎉 All tables created successfully! Ready to use.' as result;
