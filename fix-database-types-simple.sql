-- Fix Database Type Issues - SIMPLE VERSION
-- This version drops policies, fixes the type, but doesn't recreate policies
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- STEP 1: Check existing policies
-- =====================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users';

-- =====================================================
-- STEP 2: Temporarily disable RLS to make changes
-- =====================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Drop all policies on users table
-- =====================================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON users';
    END LOOP;
END $$;

-- =====================================================
-- STEP 4: Fix User Role Column - Convert enum to varchar
-- =====================================================

-- Drop the default that uses the enum
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Change the column type from enum to varchar
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text;

-- Set the default value back
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'STAFF';

-- =====================================================
-- STEP 5: Drop the enum type
-- =====================================================
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- STEP 6: Re-enable RLS (without policies for now)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: Create simple permissive policy for all operations
-- =====================================================

-- Allow all operations for authenticated users (you can restrict this later)
CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- STEP 8: Verify the changes
-- =====================================================

-- Check the role column type
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- Check if enum type is removed
SELECT typname FROM pg_type WHERE typname = 'user_role';

-- Test query to ensure it works
SELECT id, email, name, role, created_at
FROM users
LIMIT 5;

-- Count users
SELECT COUNT(*) as total_users FROM users;

-- =====================================================
-- DONE!
-- The role column is now VARCHAR(50) and should work properly
-- =====================================================
