-- ===================================================
-- FIX STATUS COLUMN TYPE IN KAS_KECIL_EXPENSES
-- ===================================================
-- Problem: status column is ENUM but Prisma expects TEXT/VARCHAR
-- Solution: Convert ENUM to TEXT

-- Step 1: Check current status column type
SELECT
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'kas_kecil_expenses'
AND column_name = 'status';

-- Step 2: If it's an ENUM, convert to TEXT
DO $$
BEGIN
    -- Drop the default first if it exists
    ALTER TABLE kas_kecil_expenses ALTER COLUMN status DROP DEFAULT;

    -- Convert ENUM to TEXT using CAST
    ALTER TABLE kas_kecil_expenses
        ALTER COLUMN status TYPE TEXT
        USING status::TEXT;

    -- Set new default value
    ALTER TABLE kas_kecil_expenses
        ALTER COLUMN status SET DEFAULT 'DRAFT';

    -- Make sure it's NOT NULL
    ALTER TABLE kas_kecil_expenses
        ALTER COLUMN status SET NOT NULL;

    RAISE NOTICE 'Successfully converted status column from ENUM to TEXT';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Step 3: Verify the change
SELECT
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'kas_kecil_expenses'
AND column_name = 'status';

-- Step 4: Check if there are any records with status values
SELECT status, COUNT(*) as count
FROM kas_kecil_expenses
GROUP BY status;
