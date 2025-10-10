const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function fixAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing admin password...');
    
    // Create proper hash for 'admin123'
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    console.log('🔐 Generated hash:', hashedPassword.substring(0, 20) + '...');
    
    // Update admin user password
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@coaltools.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Admin password updated successfully');
    
    // Test the new password
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('🧪 Password verification test:', isValid ? '✅ SUCCESS' : '❌ FAILED');
    
    // Test login with updated password
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@coaltools.com' }
    });
    
    const loginTest = await bcrypt.compare('admin123', adminUser.password);
    console.log('🎯 Login test result:', loginTest ? '✅ LOGIN WILL WORK' : '❌ LOGIN STILL BROKEN');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();