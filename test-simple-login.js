const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function testSimpleLogin() {
  console.log('🔍 Testing simple login without API call...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test database connection
    console.log('\n1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Find user
    console.log('\n2. Finding admin user...');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@coaltools.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      aktif: user.aktif
    });
    
    // Test password
    console.log('\n3. Testing password...');
    const isValid = await bcrypt.compare('admin123', user.password);
    console.log('Password valid:', isValid ? '✅ YES' : '❌ NO');
    
    // Check if user is active
    console.log('\n4. Checking user status...');
    if (!user.aktif) {
      console.log('❌ User is not active');
      return;
    }
    
    console.log('✅ User is active');
    
    // Simulate successful login response
    console.log('\n5. Simulating login success...');
    const { password, ...userWithoutPassword } = user;
    
    const loginResponse = {
      success: true,
      data: userWithoutPassword,
      message: 'Login berhasil'
    };
    
    console.log('🎉 Login simulation successful!');
    console.log('Response:', JSON.stringify(loginResponse, null, 2));
    
    // Test if server is running
    console.log('\n6. Testing if server is running...');
    try {
      const response = await fetch('http://localhost:3000/api/health');
      console.log('Server status:', response.status);
      if (response.ok) {
        console.log('✅ Server is running');
      } else {
        console.log('⚠️ Server responded but with error status');
      }
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleLogin();