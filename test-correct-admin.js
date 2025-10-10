const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function testCorrectAdmin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing correct admin login...');
    
    // Find the correct admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@coaltools.com' }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found with email admin@coaltools.com');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      aktif: adminUser.aktif,
      hasPassword: !!adminUser.password
    });
    
    if (!adminUser.password) {
      console.log('❌ Admin user has no password set');
      return;
    }
    
    // Test password verification
    const testPassword = 'admin123';
    console.log(`\n🔐 Testing password: "${testPassword}"`);
    
    const isValid = await bcrypt.compare(testPassword, adminUser.password);
    
    if (isValid) {
      console.log('✅ Password verification successful!');
      console.log('🎉 Login should work now!');
    } else {
      console.log('❌ Password verification failed');
      console.log('🔍 Stored password hash:', adminUser.password.substring(0, 20) + '...');
      
      // Try to create a new hash for comparison
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('🔍 New hash for comparison:', newHash.substring(0, 20) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCorrectAdmin();