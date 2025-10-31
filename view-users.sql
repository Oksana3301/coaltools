-- View actual user data
SELECT 
    id,
    email,
    name,
    role,
    pg_typeof(role) as role_type,
    created_at,
    LENGTH(password) as password_length
FROM users
WHERE email LIKE '%coaltools.com'
ORDER BY email;
