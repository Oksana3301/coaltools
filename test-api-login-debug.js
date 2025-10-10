const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function testApiLogin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing API login flow step by step...');
    
    // Step 1: Test database connection
    console.log('\n1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Step 2: Find user
    console.log('\n2. Finding user...');
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
      aktif: user.aktif,
      hasPassword: !!user.password
    });
    
    // Step 3: Test password
    console.log('\n3. Testing password verification...');
    const isPasswordValid = await bcrypt.compare('admin123', user.password);
    console.log('Password valid:', isPasswordValid ? '✅ YES' : '❌ NO');
    
    // Step 4: Test user active status
    console.log('\n4. Checking user status...');
    console.log('User active:', user.aktif ? '✅ YES' : '❌ NO');
    
    // Step 5: Simulate login logic
    console.log('\n5. Simulating login logic...');
    
    if (!user.aktif) {
      console.log('❌ Login would fail: User not active');
      return;
    }
    
    if (!isPasswordValid) {
      console.log('❌ Login would fail: Invalid password');
      return;
    }
    
    console.log('✅ All checks passed - login should succeed!');
    
    // Step 6: Test actual HTTP request
    console.log('\n6. Testing actual HTTP request...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@coaltools.com',
        password: 'admin123'
      })
    });
    
    const result = await response.json();
    console.log('HTTP Response Status:', response.status);
    console.log('HTTP Response Body:', result);
    
    if (result.success) {
      console.log('🎉 API Login successful!');
    } else {
      console.log('❌ API Login failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testApiLogin();