-- ===================================================
-- COMPLETE SUPABASE DATABASE FIX FOR COALTOOLS
-- ===================================================
-- Jalankan script ini di Supabase SQL Editor
-- Ini akan memperbaiki semua masalah schema

-- ===================================================
-- STEP 1: Fix kas_kecil_expenses table
-- ===================================================

-- Check if table exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kas_kecil_expenses') THEN
        -- Create table if it doesn't exist
        CREATE TABLE kas_kecil_expenses (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
            hari TEXT,
            tanggal TEXT,
            bulan TEXT,
            "tipeAktivitas" TEXT,
            barang TEXT,
            banyak DOUBLE PRECISION,
            satuan TEXT,
            "hargaSatuan" DOUBLE PRECISION,
            total DOUBLE PRECISION,
            "vendorNama" TEXT,
            "vendorTelp" TEXT,
            "vendorEmail" TEXT,
            jenis TEXT,
            "subJenis" TEXT,
            "buktiUrl" TEXT,
            status TEXT DEFAULT 'DRAFT' NOT NULL,
            notes TEXT,
            "createdBy" TEXT,
            "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
            "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
            "deletedAt" TIMESTAMP(3)
        );
        RAISE NOTICE 'Created kas_kecil_expenses table';
    ELSE
        RAISE NOTICE 'Table kas_kecil_expenses already exists';
    END IF;
END $$;

-- Add missing columns if table exists but columns are missing
DO $$
BEGIN
    -- Check and add each column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'tipeAktivitas') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "tipeAktivitas" TEXT;
        RAISE NOTICE 'Added column tipeAktivitas';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'hari') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "hari" TEXT;
        RAISE NOTICE 'Added column hari';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'tanggal') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "tanggal" TEXT;
        RAISE NOTICE 'Added column tanggal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'bulan') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "bulan" TEXT;
        RAISE NOTICE 'Added column bulan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'barang') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "barang" TEXT;
        RAISE NOTICE 'Added column barang';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'banyak') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "banyak" DOUBLE PRECISION;
        RAISE NOTICE 'Added column banyak';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'satuan') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "satuan" TEXT;
        RAISE NOTICE 'Added column satuan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'hargaSatuan') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "hargaSatuan" DOUBLE PRECISION;
        RAISE NOTICE 'Added column hargaSatuan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'total') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "total" DOUBLE PRECISION;
        RAISE NOTICE 'Added column total';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'vendorNama') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "vendorNama" TEXT;
        RAISE NOTICE 'Added column vendorNama';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'vendorTelp') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "vendorTelp" TEXT;
        RAISE NOTICE 'Added column vendorTelp';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'vendorEmail') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "vendorEmail" TEXT;
        RAISE NOTICE 'Added column vendorEmail';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'jenis') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "jenis" TEXT;
        RAISE NOTICE 'Added column jenis';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'subJenis') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "subJenis" TEXT;
        RAISE NOTICE 'Added column subJenis';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'buktiUrl') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "buktiUrl" TEXT;
        RAISE NOTICE 'Added column buktiUrl';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'notes') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "notes" TEXT;
        RAISE NOTICE 'Added column notes';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'createdBy') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "createdBy" TEXT;
        RAISE NOTICE 'Added column createdBy';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'deletedAt') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "deletedAt" TIMESTAMP(3);
        RAISE NOTICE 'Added column deletedAt';
    END IF;
END $$;

-- ===================================================
-- STEP 2: Fix status column type (CRITICAL)
-- ===================================================

DO $$
DECLARE
    status_type TEXT;
BEGIN
    -- Get current data type of status column
    SELECT data_type INTO status_type
    FROM information_schema.columns
    WHERE table_name = 'kas_kecil_expenses'
    AND column_name = 'status';

    -- If status is not 'text' or 'character varying', convert it
    IF status_type NOT IN ('text', 'character varying') THEN
        -- Drop default first
        BEGIN
            ALTER TABLE kas_kecil_expenses ALTER COLUMN status DROP DEFAULT;
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;

        -- Convert to TEXT
        ALTER TABLE kas_kecil_expenses
            ALTER COLUMN status TYPE TEXT
            USING status::TEXT;

        -- Set default
        ALTER TABLE kas_kecil_expenses
            ALTER COLUMN status SET DEFAULT 'DRAFT';

        -- Set NOT NULL
        ALTER TABLE kas_kecil_expenses
            ALTER COLUMN status SET NOT NULL;

        RAISE NOTICE 'Converted status column to TEXT type';
    ELSE
        RAISE NOTICE 'Status column is already TEXT type';
    END IF;
END $$;

-- ===================================================
-- STEP 3: Create indexes for performance
-- ===================================================

CREATE INDEX IF NOT EXISTS kas_kecil_expenses_status_idx ON kas_kecil_expenses(status);
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_createdAt_idx ON kas_kecil_expenses("createdAt");
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_deletedAt_idx ON kas_kecil_expenses("deletedAt");
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_createdBy_idx ON kas_kecil_expenses("createdBy");

-- ===================================================
-- STEP 4: Verify schema is correct
-- ===================================================

SELECT
    '✅ kas_kecil_expenses schema verification' as info,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'kas_kecil_expenses'
ORDER BY ordinal_position;

-- ===================================================
-- STEP 5: Check if table has any data
-- ===================================================

SELECT
    '✅ Data check' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
    COUNT(CASE WHEN "deletedAt" IS NULL THEN 1 END) as active_count
FROM kas_kecil_expenses;

-- ===================================================
-- SUCCESS MESSAGE
-- ===================================================

SELECT '🎉 Schema fix completed successfully!' as result;
