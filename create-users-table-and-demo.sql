-- ===================================================
-- CREATE USERS TABLE AND DEMO ACCOUNTS
-- ===================================================

-- 1. Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT,
    role TEXT DEFAULT 'STAFF',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- 2. Insert demo users
INSERT INTO users (id, email, name, password, role, created_at, updated_at)
VALUES 
  ('demo-admin-123', 'admin@coaltools.com', 'Admin Demo', 'admin123', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo-staff-456', 'staff@coaltools.com', 'Staff Demo', 'staff123', 'STAFF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Verify
SELECT id, email, name, role, created_at FROM users WHERE email LIKE '%coaltools.com';

SELECT '✅ Demo users created successfully!' as result;
