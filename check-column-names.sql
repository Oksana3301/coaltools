-- Check actual column names in database tables
-- Run this to see what column names exist

-- Check payroll_lines table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payroll_lines'
ORDER BY ordinal_position;

-- Check employee_component_selections table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employee_component_selections'
ORDER BY ordinal_position;

-- Check payroll_line_components table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payroll_line_components'
ORDER BY ordinal_position;

-- Check all foreign keys
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
    AND tc.table_name IN ('payroll_lines', 'employee_component_selections', 'payroll_line_components')
ORDER BY tc.table_name, kcu.column_name;
