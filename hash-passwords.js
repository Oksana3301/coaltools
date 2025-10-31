const bcrypt = require('bcryptjs')

async function hashPasswords() {
  const passwords = {
    admin123: await bcrypt.hash('admin123', 10),
    staff123: await bcrypt.hash('staff123', 10)
  }
  
  console.log('-- Hashed passwords for SQL:')
  console.log('')
  console.log('Admin password hash:')
  console.log(passwords.admin123)
  console.log('')
  console.log('Staff password hash:')
  console.log(passwords.staff123)
  console.log('')
  console.log('-- SQL to update users:')
  console.log('')
  console.log(`UPDATE users SET password = '${passwords.admin123}', updated_at = CURRENT_TIMESTAMP WHERE email = 'admin@coaltools.com';`)
  console.log(`UPDATE users SET password = '${passwords.staff123}', updated_at = CURRENT_TIMESTAMP WHERE email = 'staff@coaltools.com';`)
}

hashPasswords()
