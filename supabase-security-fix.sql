-- =====================================================
-- SUPABASE SECURITY FIX - Fix mutable search_path
-- This fixes the security vulnerability where functions have
-- "role mutable search_path" which can lead to privilege escalation
-- =====================================================

-- =====================================================
-- 1. Fix get_user_role function
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id TEXT)
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE SQL 
   SECURITY DEFINER 
   SET search_path = public, pg_catalog;

-- =====================================================
-- 2. Fix is_admin_or_manager function  
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin_or_manager(user_id TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role IN ('ADMIN', 'MANAGER')
    );
$$ LANGUAGE SQL 
   SECURITY DEFINER 
   SET search_path = public, pg_catalog;

-- =====================================================
-- 3. Fix calculate_payroll_totals function
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_payroll_totals(payroll_run_id_param TEXT)
RETURNS TABLE (
    total_employees BIGINT,
    total_bruto DECIMAL(15,2),
    total_neto DECIMAL(15,2),
    total_tax DECIMAL(15,2),
    total_deductions DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_employees,
        COALESCE(SUM(bruto), 0)::DECIMAL(15,2) as total_bruto,
        COALESCE(SUM(neto), 0)::DECIMAL(15,2) as total_neto,
        COALESCE(SUM(pajak_nominal), 0)::DECIMAL(15,2) as total_tax,
        COALESCE(SUM(potongan_lain), 0)::DECIMAL(15,2) as total_deductions
    FROM payroll_lines 
    WHERE payroll_run_id = payroll_run_id_param 
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   SET search_path = public, pg_catalog;

-- =====================================================
-- 4. Verify the fixes by checking function definitions
-- =====================================================

-- Query to verify the search_path is now set correctly
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND p.proname IN ('get_user_role', 'is_admin_or_manager', 'calculate_payroll_totals')
ORDER BY p.proname;

-- =====================================================
-- 5. Additional security recommendations
-- =====================================================

-- Grant explicit permissions to ensure proper access
GRANT EXECUTE ON FUNCTION get_user_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_manager(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_payroll_totals(TEXT) TO authenticated;

-- Revoke unnecessary permissions from public
REVOKE ALL ON FUNCTION get_user_role(TEXT) FROM public;
REVOKE ALL ON FUNCTION is_admin_or_manager(TEXT) FROM public;
REVOKE ALL ON FUNCTION calculate_payroll_totals(TEXT) FROM public;

-- =====================================================
-- EXPLANATION OF THE FIX:
-- =====================================================

/*
The security issue "role mutable search_path" occurs when PostgreSQL functions
are created without explicitly setting the search_path. This allows attackers
to potentially manipulate the search_path and execute malicious code with
elevated privileges.

WHAT WE FIXED:
1. Added "SET search_path = public, pg_catalog" to all three functions
2. This ensures the functions only search in the public schema and pg_catalog
3. Prevents search_path manipulation attacks
4. Maintains SECURITY DEFINER for necessary elevated privileges
5. Added explicit GRANT/REVOKE statements for proper access control

SECURITY BENEFITS:
- Functions now have immutable search_path
- No more "role mutable search_path" warning
- Protection against privilege escalation attacks
- Explicit schema resolution prevents malicious function injection
- Proper access control with authenticated users only

These functions are now secure and follow PostgreSQL security best practices.
*/

