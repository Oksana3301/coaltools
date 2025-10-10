-- Row Level Security (RLS) Policies for Coal Tools Application
-- This script sets up RLS policies for all tables to ensure proper access control

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kas_besar_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE kas_kecil_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE kwitansi ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- Allow all authenticated users to read user list (for dropdowns, etc.)
CREATE POLICY "Authenticated users can read user list" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- EMPLOYEES TABLE POLICIES
-- ============================================================================

-- Allow all authenticated users to read employees
CREATE POLICY "Authenticated users can read employees" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to create employees
CREATE POLICY "Authenticated users can create employees" ON employees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update employees
CREATE POLICY "Authenticated users can update employees" ON employees
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow all authenticated users to delete employees (soft delete)
CREATE POLICY "Authenticated users can delete employees" ON employees
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- KAS BESAR EXPENSES TABLE POLICIES
-- ============================================================================

-- Allow users to read all kas besar expenses
CREATE POLICY "Authenticated users can read kas besar expenses" ON kas_besar_expenses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to create kas besar expenses
CREATE POLICY "Authenticated users can create kas besar expenses" ON kas_besar_expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update kas besar expenses they created or are approved by them
CREATE POLICY "Users can update kas besar expenses" ON kas_besar_expenses
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            auth.uid()::text = created_by OR 
            auth.uid()::text = approved_by
        )
    );

-- Allow users to delete kas besar expenses (soft delete)
CREATE POLICY "Authenticated users can delete kas besar expenses" ON kas_besar_expenses
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- KAS KECIL EXPENSES TABLE POLICIES
-- ============================================================================

-- Allow users to read all kas kecil expenses
CREATE POLICY "Authenticated users can read kas kecil expenses" ON kas_kecil_expenses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to create kas kecil expenses
CREATE POLICY "Authenticated users can create kas kecil expenses" ON kas_kecil_expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update kas kecil expenses they created
CREATE POLICY "Users can update kas kecil expenses they created" ON kas_kecil_expenses
    FOR UPDATE USING (auth.uid()::text = created_by);

-- Allow users to delete kas kecil expenses (soft delete)
CREATE POLICY "Authenticated users can delete kas kecil expenses" ON kas_kecil_expenses
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- PAYROLL RUNS TABLE POLICIES
-- ============================================================================

-- Allow users to read all payroll runs
CREATE POLICY "Authenticated users can read payroll runs" ON payroll_runs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to create payroll runs
CREATE POLICY "Authenticated users can create payroll runs" ON payroll_runs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update payroll runs they created or are approved by them
CREATE POLICY "Users can update payroll runs" ON payroll_runs
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            auth.uid()::text = created_by OR 
            auth.uid()::text = approved_by
        )
    );

-- Allow users to delete payroll runs (soft delete)
CREATE POLICY "Authenticated users can delete payroll runs" ON payroll_runs
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- PAYROLL LINES TABLE POLICIES
-- ============================================================================

-- Allow users to read all payroll lines
CREATE POLICY "Authenticated users can read payroll lines" ON payroll_lines
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to create payroll lines
CREATE POLICY "Authenticated users can create payroll lines" ON payroll_lines
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update payroll lines
CREATE POLICY "Authenticated users can update payroll lines" ON payroll_lines
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow users to delete payroll lines (soft delete)
CREATE POLICY "Authenticated users can delete payroll lines" ON payroll_lines
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- PAY COMPONENTS TABLE POLICIES
-- ============================================================================

-- Allow users to read all pay components
CREATE POLICY "Authenticated users can read pay components" ON pay_components
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to create pay components
CREATE POLICY "Authenticated users can create pay components" ON pay_components
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update pay components
CREATE POLICY "Authenticated users can update pay components" ON pay_components
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow users to delete pay components
CREATE POLICY "Authenticated users can delete pay components" ON pay_components
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- PRODUCTION REPORTS TABLE POLICIES
-- ============================================================================

-- Allow users to read all production reports
CREATE POLICY "Authenticated users can read production reports" ON production_reports
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to create production reports
CREATE POLICY "Authenticated users can create production reports" ON production_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update production reports they created or are approved by them
CREATE POLICY "Users can update production reports" ON production_reports
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            auth.uid()::text = created_by OR 
            auth.uid()::text = approved_by
        )
    );

-- Allow users to delete production reports (soft delete)
CREATE POLICY "Authenticated users can delete production reports" ON production_reports
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- KWITANSI TABLE POLICIES
-- ============================================================================

-- Allow users to read all kwitansi
CREATE POLICY "Authenticated users can read kwitansi" ON kwitansi
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to create kwitansi
CREATE POLICY "Authenticated users can create kwitansi" ON kwitansi
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update kwitansi
CREATE POLICY "Authenticated users can update kwitansi" ON kwitansi
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow users to delete kwitansi (soft delete)
CREATE POLICY "Authenticated users can delete kwitansi" ON kwitansi
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- BUYERS TABLE POLICIES
-- ============================================================================

-- Allow users to read all buyers
CREATE POLICY "Authenticated users can read buyers" ON buyers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to create buyers
CREATE POLICY "Authenticated users can create buyers" ON buyers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update buyers
CREATE POLICY "Authenticated users can update buyers" ON buyers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow users to delete buyers (soft delete)
CREATE POLICY "Authenticated users can delete buyers" ON buyers
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- CREATE AUTHENTICATED ROLE FUNCTION (if not exists)
-- ============================================================================

-- Create a function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text AS $$
BEGIN
  RETURN 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on all tables to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select permissions to anonymous users (for public data if needed)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
