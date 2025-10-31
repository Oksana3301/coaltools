-- Verify and Fix Foreign Key Relationships V2
-- This version checks actual column names first before creating constraints
-- Run this in Supabase SQL Editor ONLY if you still have FK issues

-- =====================================================
-- STEP 1: Check what columns actually exist
-- =====================================================

-- List all columns in payroll_lines
SELECT 'payroll_lines columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payroll_lines'
ORDER BY ordinal_position;

-- List all columns in employee_component_selections
SELECT 'employee_component_selections columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'employee_component_selections'
ORDER BY ordinal_position;

-- List all columns in payroll_line_components
SELECT 'payroll_line_components columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payroll_line_components'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: Check existing foreign keys
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
-- STEP 3: Drop existing foreign keys (all variations)
-- =====================================================

-- Drop payroll_lines foreign keys (try both camelCase and snake_case)
ALTER TABLE payroll_lines DROP CONSTRAINT IF EXISTS payroll_lines_payroll_run_id_fkey CASCADE;
ALTER TABLE payroll_lines DROP CONSTRAINT IF EXISTS payroll_lines_payrollRunId_fkey CASCADE;
ALTER TABLE payroll_lines DROP CONSTRAINT IF EXISTS "payroll_lines_payrollRunId_fkey" CASCADE;
ALTER TABLE payroll_lines DROP CONSTRAINT IF EXISTS payroll_lines_employee_id_fkey CASCADE;
ALTER TABLE payroll_lines DROP CONSTRAINT IF EXISTS payroll_lines_employeeId_fkey CASCADE;
ALTER TABLE payroll_lines DROP CONSTRAINT IF EXISTS "payroll_lines_employeeId_fkey" CASCADE;

-- Drop employee_component_selections foreign keys
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_payroll_run_id_fkey CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_payrollRunId_fkey CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS "employee_component_selections_payrollRunId_fkey" CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_employee_id_fkey CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_employeeId_fkey CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS "employee_component_selections_employeeId_fkey" CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_component_id_fkey CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS employee_component_selections_componentId_fkey CASCADE;
ALTER TABLE employee_component_selections DROP CONSTRAINT IF EXISTS "employee_component_selections_componentId_fkey" CASCADE;

-- Drop payroll_line_components foreign keys
ALTER TABLE payroll_line_components DROP CONSTRAINT IF EXISTS payroll_line_components_payroll_line_id_fkey CASCADE;
ALTER TABLE payroll_line_components DROP CONSTRAINT IF EXISTS payroll_line_components_payrollLineId_fkey CASCADE;
ALTER TABLE payroll_line_components DROP CONSTRAINT IF EXISTS "payroll_line_components_payrollLineId_fkey" CASCADE;
ALTER TABLE payroll_line_components DROP CONSTRAINT IF EXISTS payroll_line_components_component_id_fkey CASCADE;
ALTER TABLE payroll_line_components DROP CONSTRAINT IF EXISTS payroll_line_components_componentId_fkey CASCADE;
ALTER TABLE payroll_line_components DROP CONSTRAINT IF EXISTS "payroll_line_components_componentId_fkey" CASCADE;

-- =====================================================
-- STEP 4: Add @map to Prisma schema if needed
-- =====================================================

-- NOTE: Based on Prisma schema, the columns should use camelCase in Prisma
-- but map to snake_case in PostgreSQL. If they don't exist with @map,
-- Prisma creates them as camelCase in database which is NOT PostgreSQL convention.

-- Check if columns are camelCase or snake_case:
DO $$
DECLARE
    has_snake_case boolean;
    has_camel_case boolean;
BEGIN
    -- Check payroll_lines
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payroll_lines' AND column_name = 'payroll_run_id'
    ) INTO has_snake_case;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payroll_lines' AND column_name = 'payrollRunId'
    ) INTO has_camel_case;

    IF has_snake_case THEN
        RAISE NOTICE 'payroll_lines uses snake_case (payroll_run_id) - GOOD!';
    ELSIF has_camel_case THEN
        RAISE NOTICE 'payroll_lines uses camelCase (payrollRunId) - Need to add @map in Prisma schema!';
    ELSE
        RAISE NOTICE 'payroll_lines column not found - table might not exist!';
    END IF;
END $$;

-- =====================================================
-- STEP 5: Recreate foreign keys based on actual columns
-- =====================================================

-- IMPORTANT: Uncomment ONLY the version that matches your database!
-- Run the check-column-names.sql first to see which version you need.

-- VERSION A: If columns are snake_case (payroll_run_id, employee_id, etc.)
-- Uncomment these if check-column-names.sql shows snake_case:

/*
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
*/

-- VERSION B: If columns are camelCase (payrollRunId, employeeId, etc.)
-- Uncomment these if check-column-names.sql shows camelCase:

/*
ALTER TABLE payroll_lines
    ADD CONSTRAINT "payroll_lines_payrollRunId_fkey"
    FOREIGN KEY ("payrollRunId")
    REFERENCES payroll_runs(id)
    ON DELETE CASCADE;

ALTER TABLE payroll_lines
    ADD CONSTRAINT "payroll_lines_employeeId_fkey"
    FOREIGN KEY ("employeeId")
    REFERENCES employees(id)
    ON DELETE RESTRICT;

ALTER TABLE employee_component_selections
    ADD CONSTRAINT "employee_component_selections_payrollRunId_fkey"
    FOREIGN KEY ("payrollRunId")
    REFERENCES payroll_runs(id)
    ON DELETE CASCADE;

ALTER TABLE employee_component_selections
    ADD CONSTRAINT "employee_component_selections_employeeId_fkey"
    FOREIGN KEY ("employeeId")
    REFERENCES employees(id)
    ON DELETE RESTRICT;

ALTER TABLE employee_component_selections
    ADD CONSTRAINT "employee_component_selections_componentId_fkey"
    FOREIGN KEY ("componentId")
    REFERENCES pay_components(id)
    ON DELETE RESTRICT;

ALTER TABLE payroll_line_components
    ADD CONSTRAINT "payroll_line_components_payrollLineId_fkey"
    FOREIGN KEY ("payrollLineId")
    REFERENCES payroll_lines(id)
    ON DELETE CASCADE;

ALTER TABLE payroll_line_components
    ADD CONSTRAINT "payroll_line_components_componentId_fkey"
    FOREIGN KEY ("componentId")
    REFERENCES pay_components(id)
    ON DELETE RESTRICT;
*/

-- =====================================================
-- STEP 6: Verify the changes
-- =====================================================

SELECT 'Final check - Foreign keys:' as info;
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- INSTRUCTIONS:
-- 1. First run check-column-names.sql to see column naming
-- 2. Based on results, uncomment either VERSION A or VERSION B above
-- 3. Run this script again
-- =====================================================
