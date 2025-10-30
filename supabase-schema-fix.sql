-- Fix kas_kecil_expenses table to match Prisma schema
ALTER TABLE kas_kecil_expenses 
ADD COLUMN IF NOT EXISTS "tipeAktivitas" TEXT,
ADD COLUMN IF NOT EXISTS "hari" TEXT,
ADD COLUMN IF NOT EXISTS "tanggal" TEXT,
ADD COLUMN IF NOT EXISTS "bulan" TEXT,
ADD COLUMN IF NOT EXISTS "barang" TEXT,
ADD COLUMN IF NOT EXISTS "banyak" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "satuan" TEXT,
ADD COLUMN IF NOT EXISTS "hargaSatuan" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "total" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "vendorNama" TEXT,
ADD COLUMN IF NOT EXISTS "vendorTelp" TEXT,
ADD COLUMN IF NOT EXISTS "vendorEmail" TEXT,
ADD COLUMN IF NOT EXISTS "jenis" TEXT,
ADD COLUMN IF NOT EXISTS "subJenis" TEXT,
ADD COLUMN IF NOT EXISTS "buktiUrl" TEXT,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_status_idx ON kas_kecil_expenses(status);
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_createdAt_idx ON kas_kecil_expenses("createdAt");
CREATE INDEX IF NOT EXISTS kas_kecil_expenses_deletedAt_idx ON kas_kecil_expenses("deletedAt");

SELECT 'kas_kecil_expenses table updated successfully' as result;
