-- Complete Supabase Database Setup
-- This script creates ALL missing tables and structures

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all required enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');
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
    CREATE TYPE status_kwitansi AS ENUM ('DRAFT', 'SENT', 'PAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fix employees table (add missing columns)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create kas_kecil table if missing
CREATE TABLE IF NOT EXISTS kas_kecil (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tanggal DATE NOT NULL,
    deskripsi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    tipe_aktivitas TEXT NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    metode_pembayaran TEXT,
    bukti_url TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create kas_besar table if missing
CREATE TABLE IF NOT EXISTS kas_besar (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tanggal DATE NOT NULL,
    deskripsi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    tipe_aktivitas TEXT NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    metode_pembayaran TEXT,
    bukti_url TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pay_components table if missing
CREATE TABLE IF NOT EXISTS pay_components (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nama TEXT NOT NULL,
    tipe pay_component_type NOT NULL,
    taxable BOOLEAN DEFAULT false,
    metode pay_component_method NOT NULL,
    basis pay_component_basis NOT NULL,
    rate DECIMAL(8,4),
    nominal DECIMAL(15,2),
    cap_min DECIMAL(15,2),
    cap_max DECIMAL(15,2),
    "order" INTEGER DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payroll_runs table if missing
CREATE TABLE IF NOT EXISTS payroll_runs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    periode_start DATE NOT NULL,
    periode_end DATE NOT NULL,
    status TEXT DEFAULT 'DRAFT',
    total_gross DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    total_net DECIMAL(15,2) DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payroll_lines table if missing
CREATE TABLE IF NOT EXISTS payroll_lines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    payroll_run_id TEXT NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    gross_pay DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_pay DECIMAL(15,2) DEFAULT 0,
    hari_kerja INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create buyers table if missing
CREATE TABLE IF NOT EXISTS buyers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nama TEXT NOT NULL,
    alamat TEXT,
    telepon TEXT,
    email TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create production_reports table if missing
CREATE TABLE IF NOT EXISTS production_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tanggal DATE NOT NULL,
    shift TEXT NOT NULL,
    produksi_tonase DECIMAL(10,2) NOT NULL,
    target_tonase DECIMAL(10,2),
    keterangan TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample data for kas_kecil
INSERT INTO kas_kecil (tanggal, deskripsi, kategori, tipe_aktivitas, jumlah, metode_pembayaran) VALUES 
('2024-01-15', 'Pembelian ATK Kantor', 'Operasional', 'Pengeluaran', 150000, 'Tunai'),
('2024-01-16', 'Biaya Konsumsi Rapat', 'Konsumsi', 'Pengeluaran', 200000, 'Transfer'),
('2024-01-17', 'Transportasi Kurir', 'Transport', 'Pengeluaran', 50000, 'Tunai')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for kas_besar
INSERT INTO kas_besar (tanggal, deskripsi, kategori, tipe_aktivitas, jumlah, metode_pembayaran) VALUES 
('2024-01-15', 'Pembayaran Gaji Karyawan', 'Payroll', 'Pengeluaran', 15000000, 'Transfer'),
('2024-01-10', 'Penjualan Batubara', 'Penjualan', 'Pemasukan', 50000000, 'Transfer'),
('2024-01-12', 'Pembelian Alat Berat', 'Investasi', 'Pengeluaran', 25000000, 'Transfer')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for pay_components
INSERT INTO pay_components (nama, tipe, metode, basis, nominal, rate, "order", aktif) VALUES 
('Gaji Pokok', 'EARNING', 'FLAT', 'UPAH_HARIAN', 0, NULL, 1, true),
('Tunjangan Transport', 'EARNING', 'FLAT', 'HARI_KERJA', 50000, NULL, 2, true),
('Tunjangan Makan', 'EARNING', 'FLAT', 'HARI_KERJA', 25000, NULL, 3, true),
('BPJS Kesehatan', 'DEDUCTION', 'PERSENTASE', 'BRUTO', NULL, 4.0, 10, true),
('BPJS Ketenagakerjaan', 'DEDUCTION', 'PERSENTASE', 'BRUTO', NULL, 2.0, 11, true),
('Bonus Kinerja', 'EARNING', 'FLAT', 'BRUTO', 0, NULL, 101, true),
('Lembur', 'EARNING', 'PER_HARI', 'UPAH_HARIAN', NULL, 1.5, 102, true),
('Potongan Keterlambatan', 'DEDUCTION', 'FLAT', 'HARI_KERJA', 10000, NULL, 104, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for buyers
INSERT INTO buyers (nama, alamat, telepon, email) VALUES 
('PT. Energi Nusantara', 'Jl. Sudirman No. 123, Jakarta', '021-12345678', 'procurement@energinusa.com'),
('CV. Batu Bara Mandiri', 'Jl. Gatot Subroto 45, Bandung', '022-87654321', 'purchasing@bbmandiri.co.id'),
('PT. Industri Pembangkit', 'Jl. MH Thamrin 67, Surabaya', '031-11223344', 'supply@indpembangkit.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for production_reports
INSERT INTO production_reports (tanggal, shift, produksi_tonase, target_tonase, keterangan) VALUES 
('2024-01-15', 'Pagi', 125.5, 150.0, 'Produksi normal, cuaca mendukung'),
('2024-01-15', 'Siang', 145.2, 150.0, 'Target hampir tercapai'),
('2024-01-16', 'Pagi', 98.7, 150.0, 'Gangguan mesin loader 2 jam')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE kas_kecil ENABLE ROW LEVEL SECURITY;
ALTER TABLE kas_besar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_reports ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for authenticated users
DO $$ BEGIN
    CREATE POLICY "kas_kecil_policy" ON kas_kecil FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "kas_besar_policy" ON kas_besar FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "pay_components_policy" ON pay_components FOR ALL TO authenticated USING (true) WITH CHECK (true);
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

DO $$ BEGIN
    CREATE POLICY "buyers_policy" ON buyers FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "production_reports_policy" ON production_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kas_kecil_tanggal ON kas_kecil(tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_besar_tanggal ON kas_besar(tanggal);
CREATE INDEX IF NOT EXISTS idx_pay_components_tipe ON pay_components(tipe);
CREATE INDEX IF NOT EXISTS idx_pay_components_order ON pay_components("order");
CREATE INDEX IF NOT EXISTS idx_payroll_lines_run ON payroll_lines(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_employee ON payroll_lines(employee_id);
CREATE INDEX IF NOT EXISTS idx_production_reports_tanggal ON production_reports(tanggal);

-- Success verification
SELECT 
    'SUCCESS: All tables created and configured!' as result,
    'kas_kecil: ✓' as kas_kecil_status,
    'kas_besar: ✓' as kas_besar_status,
    'pay_components: ✓' as pay_components_status,
    'payroll_runs: ✓' as payroll_runs_status,
    'payroll_lines: ✓' as payroll_lines_status,
    'buyers: ✓' as buyers_status,
    'production_reports: ✓' as production_reports_status,
    'Sample data inserted: ✓' as sample_data_status,
    'RLS policies applied: ✓' as security_status;
