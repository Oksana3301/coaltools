-- ===================================================
-- FULL SCHEMA SYNC FOR COALTOOLS SUPABASE DATABASE
-- Run this in Supabase SQL Editor
-- ===================================================

-- 1. Fix kas_kecil_expenses table
DO $$ 
BEGIN
    -- Add all missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'tipeAktivitas') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "tipeAktivitas" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'hari') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "hari" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'tanggal') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "tanggal" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kas_kecil_expenses' AND column_name = 'bulan') THEN
        ALTER TABLE kas_kecil_expenses ADD COLUMN "bulan" TEXT;
    END IF;
END $$;

-- 2. Verify and create indexes
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_status_idx ON kas_kecil_expenses(status);
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_createdAt_idx ON kas_kecil_expenses("createdAt");

-- 3. Check current schema
SELECT 
    'kas_kecil_expenses' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'kas_kecil_expenses'
ORDER BY ordinal_position;
