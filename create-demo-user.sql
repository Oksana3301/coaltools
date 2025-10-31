-- Create demo admin user for login
-- Password akan di-hash nanti, untuk demo pakai plaintext dulu

-- First, check what columns actually exist in users table
-- You can run this separately to see the table structure:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users';

-- Create demo users with correct column names
INSERT INTO users (id, email, name, password, role, created_at, updated_at)
VALUES 
  ('demo-admin-123', 'admin@coaltools.com', 'Admin Demo', 'admin123', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo-staff-456', 'staff@coaltools.com', 'Staff Demo', 'staff123', 'STAFF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  updated_at = CURRENT_TIMESTAMP;

-- Verify
SELECT id, email, name, role, created_at FROM users WHERE email LIKE '%coaltools.com';
