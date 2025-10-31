-- Fix Database Type Issues for CRUD Operations
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- 1. Fix User Role Column - Convert enum to varchar
-- =====================================================

-- First, drop the default that uses the enum
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Change the column type from enum to varchar
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text;

-- Set the default value back
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'STAFF';

-- =====================================================
-- 2. Drop the enum type if it exists (optional cleanup)
-- =====================================================

-- Drop the enum type (this will work if no other tables use it)
-- Comment this out if you get an error
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- 3. Verify all tables exist and have correct structure
-- =====================================================

-- Check if tables exist
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'users',
        'employees',
        'buyers',
        'pay_components',
        'payroll_runs',
        'payroll_lines',
        'kas_kecil_expenses',
        'kas_besar_transactions'
    )
ORDER BY table_name;

-- =====================================================
-- 4. Add missing indexes for better performance
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Employees table indexes
CREATE INDEX IF NOT EXISTS idx_employees_aktif ON employees(aktif);
CREATE INDEX IF NOT EXISTS idx_employees_site ON employees(site);

-- Buyers table indexes
CREATE INDEX IF NOT EXISTS idx_buyers_aktif ON buyers(aktif);

-- Pay Components table indexes
CREATE INDEX IF NOT EXISTS idx_pay_components_aktif ON pay_components(aktif);
CREATE INDEX IF NOT EXISTS idx_pay_components_tipe ON pay_components(tipe);

-- Payroll Runs table indexes
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_created_by ON payroll_runs(created_by);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_deleted_at ON payroll_runs(deleted_at);

-- Payroll Lines table indexes
CREATE INDEX IF NOT EXISTS idx_payroll_lines_payroll_run_id ON payroll_lines(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_employee_id ON payroll_lines(employee_id);

-- Kas Kecil table indexes
CREATE INDEX IF NOT EXISTS idx_kas_kecil_status ON kas_kecil_expenses(status);
CREATE INDEX IF NOT EXISTS idx_kas_kecil_created_by ON kas_kecil_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_kas_kecil_deleted_at ON kas_kecil_expenses(deleted_at);

-- Kas Besar table indexes
CREATE INDEX IF NOT EXISTS idx_kas_besar_status ON kas_besar_transactions(status);
CREATE INDEX IF NOT EXISTS idx_kas_besar_vendor ON kas_besar_transactions(vendor_nama);
CREATE INDEX IF NOT EXISTS idx_kas_besar_created_by ON kas_besar_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_kas_besar_deleted_at ON kas_besar_transactions(deleted_at);

-- =====================================================
-- 5. Verify the changes
-- =====================================================

-- Check users table structure
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'buyers', COUNT(*) FROM buyers
UNION ALL
SELECT 'pay_components', COUNT(*) FROM pay_components
UNION ALL
SELECT 'payroll_runs', COUNT(*) FROM payroll_runs
UNION ALL
SELECT 'payroll_lines', COUNT(*) FROM payroll_lines
UNION ALL
SELECT 'kas_kecil_expenses', COUNT(*) FROM kas_kecil_expenses
UNION ALL
SELECT 'kas_besar_transactions', COUNT(*) FROM kas_besar_transactions;

-- =====================================================
-- DONE!
-- After running this SQL:
-- 1. Regenerate Prisma Client: npx prisma generate
-- 2. Redeploy to Vercel
-- 3. Test all CRUD endpoints
-- =====================================================
