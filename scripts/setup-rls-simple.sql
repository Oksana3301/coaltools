-- Simple Row Level Security (RLS) Setup for Coal Tools Application
-- This version works with Prisma and doesn't require Supabase Auth

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
-- SIMPLE POLICIES - ALLOW ALL OPERATIONS FOR NOW
-- ============================================================================

-- Users table - allow all operations
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

-- Employees table - allow all operations
CREATE POLICY "Allow all operations on employees" ON employees
    FOR ALL USING (true);

-- Kas Besar Expenses table - allow all operations
CREATE POLICY "Allow all operations on kas_besar_expenses" ON kas_besar_expenses
    FOR ALL USING (true);

-- Kas Kecil Expenses table - allow all operations
CREATE POLICY "Allow all operations on kas_kecil_expenses" ON kas_kecil_expenses
    FOR ALL USING (true);

-- Payroll Runs table - allow all operations
CREATE POLICY "Allow all operations on payroll_runs" ON payroll_runs
    FOR ALL USING (true);

-- Payroll Lines table - allow all operations
CREATE POLICY "Allow all operations on payroll_lines" ON payroll_lines
    FOR ALL USING (true);

-- Pay Components table - allow all operations
CREATE POLICY "Allow all operations on pay_components" ON pay_components
    FOR ALL USING (true);

-- Production Reports table - allow all operations
CREATE POLICY "Allow all operations on production_reports" ON production_reports
    FOR ALL USING (true);

-- Kwitansi table - allow all operations
CREATE POLICY "Allow all operations on kwitansi" ON kwitansi
    FOR ALL USING (true);

-- Buyers table - allow all operations
CREATE POLICY "Allow all operations on buyers" ON buyers
    FOR ALL USING (true);

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant all permissions to the postgres user (your application user)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Grant permissions to authenticated role (if using Supabase Auth later)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon role (for public access if needed)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
