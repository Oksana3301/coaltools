-- ===================================================
-- UPDATE USER PASSWORDS WITH BCRYPT HASH
-- ===================================================
-- This updates the demo user passwords to use bcrypt hashing
-- Original passwords: admin123 and staff123

-- Update admin password (admin123 -> bcrypt hash)
UPDATE users 
SET password = '$2a$10$6l9Y5RO/rQbw5X0g1LH4I.wP/J0eRJZfIH9GowXoQTT5t8oKxwqFK', 
    updated_at = CURRENT_TIMESTAMP 
WHERE email = 'admin@coaltools.com';

-- Update staff password (staff123 -> bcrypt hash)
UPDATE users 
SET password = '$2a$10$DLxYQUgcPx.MDxuGt0Sa1uzVwX0s2.0CTzaCLTlqaYO6Chl6LBM5O', 
    updated_at = CURRENT_TIMESTAMP 
WHERE email = 'staff@coaltools.com';

-- Verify the update
SELECT 
    id, 
    email, 
    name, 
    role, 
    SUBSTRING(password, 1, 20) || '...' as password_preview,
    updated_at
FROM users 
WHERE email LIKE '%coaltools.com'
ORDER BY role DESC;

SELECT '✅ Passwords updated with bcrypt hash!' as result;
