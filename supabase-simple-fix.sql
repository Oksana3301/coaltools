-- Simple fix: Just add missing columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Verify the fix worked
SELECT 'Employees table updated successfully!' as result;
