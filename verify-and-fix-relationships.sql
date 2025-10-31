-- Verify and Fix Foreign Key Relationships
-- Run this in Supabase SQL Editor if you still have issues

-- =====================================================
-- 1. Check all foreign key constraints
-- =====================================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 2. Fix Payroll Lines Foreign Keys (if needed)
-- =====================================================

-- Drop existing foreign keys if they cause issues
ALTER TABLE payroll_lines DROP CONSTRAINT IF EXISTS payroll_lines_payroll_run_id_fkey CASCADE;
ALTER TABLE payroll_lines DROP CONSTRAINT IF EXISTS payroll_lines_employee_id_fkey CASCADE;

-- Recreate them with proper cascade
ALTER TABLE payroll_lines
    ADD CONSTRAINT payroll_lines_payroll_run_id_fkey
    FOREIGN KEY (payroll_run_id)
    REFERENCES payroll_runs(id)
    ON DELETE CASCADE;

ALTER TABLE payroll_lines
    ADD CONSTRAINT payroll_lines_employee_id_fkey
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE RESTRICT;

-- =====================================================
-- 3. Fix Employee Component Selections Foreign Keys
-- =====================================================

ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_payroll_run_id_fkey CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_employee_id_fkey CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_component_id_fkey CASCADE;

ALTER TABLE employee_component_selections
    ADD CONSTRAINT employee_component_selections_payroll_run_id_fkey
    FOREIGN KEY (payroll_run_id)
    REFERENCES payroll_runs(id)
    ON DELETE CASCADE;

ALTER TABLE employee_component_selections
    ADD CONSTRAINT employee_component_selections_employee_id_fkey
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE RESTRICT;

ALTER TABLE employee_component_selections
    ADD CONSTRAINT employee_component_selections_component_id_fkey
    FOREIGN KEY (component_id)
    REFERENCES pay_components(id)
    ON DELETE RESTRICT;

-- =====================================================
-- 4. Fix Payroll Line Components Foreign Keys
-- =====================================================

ALTER TABLE payroll_line_components DROP CONSTRAINT IF EXISTS payroll_line_components_payroll_line_id_fkey CASCADE;
ALTER TABLE payroll_line_components DROP CONSTRAINT IF EXISTS payroll_line_components_component_id_fkey CASCADE;

ALTER TABLE payroll_line_components
    ADD CONSTRAINT payroll_line_components_payroll_line_id_fkey
    FOREIGN KEY (payroll_line_id)
    REFERENCES payroll_lines(id)
    ON DELETE CASCADE;

ALTER TABLE payroll_line_components
    ADD CONSTRAINT payroll_line_components_component_id_fkey
    FOREIGN KEY (component_id)
    REFERENCES pay_components(id)
    ON DELETE RESTRICT;

-- =====================================================
-- 5. Verify all tables can be queried
-- =====================================================

-- Test simple queries on all tables
SELECT 'Testing users...' as status, COUNT(*) as count FROM users;
SELECT 'Testing employees...' as status, COUNT(*) as count FROM employees;
SELECT 'Testing buyers...' as status, COUNT(*) as count FROM buyers;
SELECT 'Testing pay_components...' as status, COUNT(*) as count FROM pay_components;
SELECT 'Testing payroll_runs...' as status, COUNT(*) as count FROM payroll_runs;
SELECT 'Testing payroll_lines...' as status, COUNT(*) as count FROM payroll_lines;
SELECT 'Testing kas_kecil_expenses...' as status, COUNT(*) as count FROM kas_kecil_expenses;
SELECT 'Testing kas_besar_transactions...' as status, COUNT(*) as count FROM kas_besar_transactions;

-- =====================================================
-- DONE!
-- =====================================================
