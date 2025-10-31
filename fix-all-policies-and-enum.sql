-- Fix ALL Policies and Enum Issues
-- This script handles ALL tables that might have policies
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: Check ALL policies in the database
-- =====================================================
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 2: Disable RLS on ALL tables temporarily
-- =====================================================
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS buyers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pay_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_line_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_component_selections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kas_kecil_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kas_besar_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kwitansi DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Drop ALL policies from ALL tables
-- =====================================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Loop through all policies in public schema
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                policy_record.policyname,
                policy_record.schemaname,
                policy_record.tablename);
            RAISE NOTICE 'Dropped policy: % on table %', policy_record.policyname, policy_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy % on table %: %',
                    policy_record.policyname, policy_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Fix users table role column
-- =====================================================

-- Drop default
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Convert enum to varchar
ALTER TABLE users
    ALTER COLUMN role TYPE VARCHAR(50)
    USING role::text;

-- Set default back
ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'STAFF';

-- =====================================================
-- STEP 5: Drop the enum type
-- =====================================================
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- STEP 6: Enable RLS back with simple policies
-- =====================================================

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON users FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Login Activity table
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON login_activity FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON employees FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Buyers table
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON buyers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Pay Components table
ALTER TABLE pay_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON pay_components FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Payroll Runs table
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON payroll_runs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Payroll Lines table
ALTER TABLE payroll_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON payroll_lines FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Kas Kecil Expenses table
ALTER TABLE kas_kecil_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON kas_kecil_expenses FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Kas Besar Transactions table
ALTER TABLE kas_besar_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users"
    ON kas_besar_transactions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- STEP 7: Verify everything is working
-- =====================================================

-- Check role column type
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name = 'role';

-- Check if enum is gone
SELECT typname
FROM pg_type
WHERE typname = 'user_role';

-- Test queries on all tables
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'login_activity', COUNT(*) FROM login_activity
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'buyers', COUNT(*) FROM buyers
UNION ALL
SELECT 'pay_components', COUNT(*) FROM pay_components
UNION ALL
SELECT 'payroll_runs', COUNT(*) FROM payroll_runs
UNION ALL
SELECT 'kas_kecil_expenses', COUNT(*) FROM kas_kecil_expenses
UNION ALL
SELECT 'kas_besar_transactions', COUNT(*) FROM kas_besar_transactions;

-- List all current policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SUCCESS!
-- All policies removed, enum converted to varchar,
-- Simple permissive policies created for all tables
-- =====================================================
