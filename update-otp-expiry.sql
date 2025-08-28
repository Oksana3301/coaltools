-- Update OTP expiry to 10 minutes (600 seconds) in Supabase
-- Run this in your Supabase SQL Editor if needed

-- For email OTP expiry
UPDATE auth.config 
SET raw_phone_change_token_validity_interval = '10 minutes'::interval,
    raw_email_change_token_validity_interval = '10 minutes'::interval
WHERE instance_id = 'your-instance-id';

-- Alternative: Update auth settings table if it exists
-- Note: This might vary based on your Supabase setup
UPDATE auth.settings 
SET email_change_confirm_interval = 600,
    phone_change_confirm_interval = 600
WHERE id = 1;

-- Check current settings
SELECT 
  email_change_confirm_interval,
  phone_change_confirm_interval
FROM auth.settings;
