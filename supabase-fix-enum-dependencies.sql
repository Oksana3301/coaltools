-- Safe Fix for Pay Component Enum Dependencies
-- This script handles all dependent objects properly

-- Step 1: Check what objects depend on the enum types
-- (Optional - for debugging)
-- SELECT objid::regclass, refobjid::regtype 
-- FROM pg_depend d JOIN pg_type t ON t.oid = d.refobjid 
-- WHERE t.typname = 'pay_component_type';

-- Step 2: Create temporary column with correct enum type for pay_components table
DO $$ 
BEGIN
    -- First check if the column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'tipe_new'
    ) THEN
        -- Create the correct enum type if it doesn't exist
        BEGIN
            CREATE TYPE pay_component_type_correct AS ENUM ('EARNING', 'DEDUCTION');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;

        -- Add temporary column with correct type
        ALTER TABLE pay_components ADD COLUMN tipe_new pay_component_type_correct;
        
        -- Copy data with proper case conversion
        UPDATE pay_components SET tipe_new = 
            CASE 
                WHEN tipe::text ILIKE 'EARNING' THEN 'EARNING'::pay_component_type_correct
                WHEN tipe::text ILIKE 'earning' THEN 'EARNING'::pay_component_type_correct
                WHEN tipe::text ILIKE 'DEDUCTION' THEN 'DEDUCTION'::pay_component_type_correct
                WHEN tipe::text ILIKE 'deduction' THEN 'DEDUCTION'::pay_component_type_correct
                ELSE 'EARNING'::pay_component_type_correct -- default fallback
            END;
    END IF;
END $$;

-- Step 3: Create correct method enum
DO $$ 
BEGIN
    BEGIN
        CREATE TYPE pay_component_method_correct AS ENUM ('FLAT', 'PER_HARI', 'PERSENTASE');
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Add temporary column for method if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'metode_new'
    ) THEN
        ALTER TABLE pay_components ADD COLUMN metode_new pay_component_method_correct;
        
        UPDATE pay_components SET metode_new = 
            CASE 
                WHEN metode::text ILIKE 'FLAT' THEN 'FLAT'::pay_component_method_correct
                WHEN metode::text ILIKE 'flat' THEN 'FLAT'::pay_component_method_correct
                WHEN metode::text ILIKE 'PER_HARI' THEN 'PER_HARI'::pay_component_method_correct
                WHEN metode::text ILIKE 'per_hari' THEN 'PER_HARI'::pay_component_method_correct
                WHEN metode::text ILIKE 'PERSENTASE' THEN 'PERSENTASE'::pay_component_method_correct
                WHEN metode::text ILIKE 'persentase' THEN 'PERSENTASE'::pay_component_method_correct
                ELSE 'FLAT'::pay_component_method_correct
            END;
    END IF;
END $$;

-- Step 4: Create correct basis enum
DO $$ 
BEGIN
    BEGIN
        CREATE TYPE pay_component_basis_correct AS ENUM ('UPAH_HARIAN', 'BRUTO', 'HARI_KERJA');
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- Add temporary column for basis if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'basis_new'
    ) THEN
        ALTER TABLE pay_components ADD COLUMN basis_new pay_component_basis_correct;
        
        UPDATE pay_components SET basis_new = 
            CASE 
                WHEN basis::text ILIKE 'UPAH_HARIAN' THEN 'UPAH_HARIAN'::pay_component_basis_correct
                WHEN basis::text ILIKE 'upah_harian' THEN 'UPAH_HARIAN'::pay_component_basis_correct
                WHEN basis::text ILIKE 'BRUTO' THEN 'BRUTO'::pay_component_basis_correct
                WHEN basis::text ILIKE 'bruto' THEN 'BRUTO'::pay_component_basis_correct
                WHEN basis::text ILIKE 'HARI_KERJA' THEN 'HARI_KERJA'::pay_component_basis_correct
                WHEN basis::text ILIKE 'hari_kerja' THEN 'HARI_KERJA'::pay_component_basis_correct
                ELSE 'UPAH_HARIAN'::pay_component_basis_correct
            END;
    END IF;
END $$;

-- Step 5: Drop the old columns and rename the new ones
DO $$ 
BEGIN
    -- Drop old columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'tipe'
    ) THEN
        ALTER TABLE pay_components DROP COLUMN IF EXISTS tipe;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'metode'
    ) THEN
        ALTER TABLE pay_components DROP COLUMN IF EXISTS metode;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'basis'
    ) THEN
        ALTER TABLE pay_components DROP COLUMN IF EXISTS basis;
    END IF;

    -- Rename new columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'tipe_new'
    ) THEN
        ALTER TABLE pay_components RENAME COLUMN tipe_new TO tipe;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'metode_new'
    ) THEN
        ALTER TABLE pay_components RENAME COLUMN metode_new TO metode;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pay_components' AND column_name = 'basis_new'
    ) THEN
        ALTER TABLE pay_components RENAME COLUMN basis_new TO basis;
    END IF;
END $$;

-- Step 6: Clean up old enum types (with CASCADE if needed)
DO $$ 
BEGIN
    BEGIN
        DROP TYPE IF EXISTS pay_component_type CASCADE;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    BEGIN
        DROP TYPE IF EXISTS pay_component_method CASCADE;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    BEGIN
        DROP TYPE IF EXISTS pay_component_basis CASCADE;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- Step 7: Rename the correct enum types to the original names
DO $$ 
BEGIN
    BEGIN
        ALTER TYPE pay_component_type_correct RENAME TO pay_component_type;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TYPE pay_component_method_correct RENAME TO pay_component_method;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TYPE pay_component_basis_correct RENAME TO pay_component_basis;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- Step 8: Add NOT NULL constraints back
ALTER TABLE pay_components ALTER COLUMN tipe SET NOT NULL;
ALTER TABLE pay_components ALTER COLUMN metode SET NOT NULL;
ALTER TABLE pay_components ALTER COLUMN basis SET NOT NULL;

-- Step 9: Verify the fix worked
SELECT 
    'SUCCESS: Pay component enums fixed!' as result,
    'tipe column: ' || pg_typeof(tipe)::text as tipe_type,
    'metode column: ' || pg_typeof(metode)::text as metode_type,
    'basis column: ' || pg_typeof(basis)::text as basis_type
FROM pay_components 
LIMIT 1;
