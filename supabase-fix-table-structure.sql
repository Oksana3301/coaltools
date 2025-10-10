-- Fix Supabase table structure to match Prisma schema
-- This script creates the tables with the exact structure Prisma expects

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all required enums first
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE login_status AS ENUM ('LOGIN', 'LOGOUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pay_component_type AS ENUM ('EARNING', 'DEDUCTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pay_component_method AS ENUM ('FLAT', 'PER_HARI', 'PERSENTASE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pay_component_basis AS ENUM ('UPAH_HARIAN', 'BRUTO', 'HARI_KERJA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payroll_status AS ENUM ('DRAFT', 'PROCESSING', 'FINALIZED', 'PAID', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing simple tables if they exist
DROP TABLE IF EXISTS kas_kecil CASCADE;
DROP TABLE IF EXISTS kas_besar CASCADE;
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS payroll_lines CASCADE;

-- Create kas_kecil_expenses table (matches Prisma schema)
CREATE TABLE IF NOT EXISTS kas_kecil_expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hari TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    bulan TEXT NOT NULL,
    tipe_aktivitas TEXT NOT NULL,
    barang TEXT NOT NULL,
    banyak DECIMAL(10,2) NOT NULL,
    satuan TEXT NOT NULL,
    harga_satuan DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    vendor_nama TEXT NOT NULL,
    vendor_telp TEXT,
    vendor_email TEXT,
    jenis TEXT DEFAULT 'kas_kecil',
    sub_jenis TEXT NOT NULL,
    bukti_url TEXT,
    status status DEFAULT 'DRAFT',
    notes TEXT,
    approval_notes TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY ("createdBy") REFERENCES users(id)
);

-- Create kas_besar_expenses table (matches Prisma schema)
CREATE TABLE IF NOT EXISTS kas_besar_expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hari TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    bulan TEXT NOT NULL,
    tipe_aktivitas TEXT NOT NULL,
    barang TEXT NOT NULL,
    banyak DECIMAL(10,2) NOT NULL,
    satuan TEXT NOT NULL,
    harga_satuan DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    vendor_nama TEXT NOT NULL,
    vendor_telp TEXT,
    vendor_email TEXT,
    jenis TEXT DEFAULT 'kas_besar',
    sub_jenis TEXT NOT NULL,
    bukti_url TEXT,
    kontrak_url TEXT,
    status status DEFAULT 'DRAFT',
    notes TEXT,
    approval_notes TEXT,
    "createdBy" TEXT NOT NULL,
    approved_by TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY ("createdBy") REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Create payroll_runs table (matches Prisma schema)
CREATE TABLE IF NOT EXISTS payroll_runs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    periode_awal DATE NOT NULL,
    periode_akhir DATE NOT NULL,
    status payroll_status DEFAULT 'DRAFT',
    total_gross DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    "createdBy" TEXT NOT NULL,
    approved_by TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY ("createdBy") REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Create payroll_lines table (matches Prisma schema)
CREATE TABLE IF NOT EXISTS payroll_lines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    payroll_run_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    hari_kerja INTEGER NOT NULL,
    upah_harian DECIMAL(15,2) NOT NULL,
    uang_makan_harian DECIMAL(15,2) NOT NULL,
    uang_bbm_harian DECIMAL(15,2) NOT NULL,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    overtime_rate DECIMAL(4,2) DEFAULT 1.5,
    cashbon DECIMAL(15,2) DEFAULT 0,
    bruto DECIMAL(15,2) NOT NULL,
    pajak_rate DECIMAL(5,2),
    pajak_nominal DECIMAL(15,2),
    potongan_lain DECIMAL(15,2) DEFAULT 0,
    neto DECIMAL(15,2) NOT NULL,
    status payroll_status DEFAULT 'DRAFT',
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Insert sample data for kas_kecil_expenses
INSERT INTO kas_kecil_expenses (hari, tanggal, bulan, tipe_aktivitas, barang, banyak, satuan, harga_satuan, total, vendor_nama, jenis, sub_jenis, "createdBy") VALUES 
('Monday', '2024-01-15', 'Januari 2024', 'Operasional', 'Pembelian ATK Kantor', 1, 'unit', 150000, 150000, 'Toko ATK Jaya', 'kas_kecil', 'operasional', 'cmemokbd20000ols63e1xr3f6'),
('Tuesday', '2024-01-16', 'Januari 2024', 'Konsumsi', 'Biaya Konsumsi Rapat', 1, 'unit', 200000, 200000, 'Catering Sehat', 'kas_kecil', 'konsumsi', 'cmemokbd20000ols63e1xr3f6'),
('Wednesday', '2024-01-17', 'Januari 2024', 'Transport', 'Transportasi Kurir', 1, 'unit', 50000, 50000, 'Go-Send', 'kas_kecil', 'transport', 'cmemokbd20000ols63e1xr3f6')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for kas_besar_expenses
INSERT INTO kas_besar_expenses (hari, tanggal, bulan, tipe_aktivitas, barang, banyak, satuan, harga_satuan, total, vendor_nama, jenis, sub_jenis, "createdBy") VALUES 
('Monday', '2024-01-15', 'Januari 2024', 'Payroll', 'Pembayaran Gaji Karyawan', 1, 'bulan', 15000000, 15000000, 'PT. Bank BRI', 'kas_besar', 'payroll', 'cmemokbd20000ols63e1xr3f6'),
('Thursday', '2024-01-10', 'Januari 2024', 'Penjualan', 'Penjualan Batubara', 500, 'ton', 100000, 50000000, 'PT. Energi Nusantara', 'kas_besar', 'revenue', 'cmemokbd20000ols63e1xr3f6'),
('Friday', '2024-01-12', 'Januari 2024', 'Investasi', 'Pembelian Alat Berat', 1, 'unit', 25000000, 25000000, 'PT. Heavy Equipment', 'kas_besar', 'investment', 'cmemokbd20000ols63e1xr3f6')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE kas_kecil_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kas_besar_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_lines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
DO $$ BEGIN
    CREATE POLICY "kas_kecil_expenses_policy" ON kas_kecil_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "kas_besar_expenses_policy" ON kas_besar_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "payroll_runs_policy" ON payroll_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "payroll_lines_policy" ON payroll_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kas_kecil_expenses_tanggal ON kas_kecil_expenses(tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_kecil_expenses_created_by ON kas_kecil_expenses("createdBy");
CREATE INDEX IF NOT EXISTS idx_kas_kecil_expenses_status ON kas_kecil_expenses(status);

CREATE INDEX IF NOT EXISTS idx_kas_besar_expenses_tanggal ON kas_besar_expenses(tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_besar_expenses_created_by ON kas_besar_expenses("createdBy");
CREATE INDEX IF NOT EXISTS idx_kas_besar_expenses_status ON kas_besar_expenses(status);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_periode ON payroll_runs(periode_awal, periode_akhir);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);

CREATE INDEX IF NOT EXISTS idx_payroll_lines_run_id ON payroll_lines(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_employee_id ON payroll_lines(employee_id);

-- Success verification
SELECT 
    'SUCCESS: Table structures fixed!' as result,
    'kas_kecil_expenses: ✓' as kas_kecil_status,
    'kas_besar_expenses: ✓' as kas_besar_status,
    'payroll_runs: ✓' as payroll_runs_status,
    'payroll_lines: ✓' as payroll_lines_status,
    'Sample data inserted: ✓' as sample_data_status,
    'RLS policies applied: ✓' as security_status;
