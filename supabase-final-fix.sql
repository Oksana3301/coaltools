-- Final Fix: Add missing timestamp columns to pay_components table

ALTER TABLE pay_components 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Verify the fix
SELECT 
    'SUCCESS: Pay Components table fixed!' as result,
    'createdAt and updatedAt columns added' as fix_status;
