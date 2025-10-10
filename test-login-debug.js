const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Test database connection and login
async function testLogin() {
  console.log('🔍 Testing database connection and login...');
  
  // Test 1: Database connection
  console.log('\n1. Testing database connection...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    console.log('📊 DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  // Test 2: Check if users table exists and has data
  console.log('\n2. Testing users table...');
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible. Total users: ${userCount}`);
    
    if (userCount === 0) {
      console.log('⚠️ No users found in database');
      return;
    }
  } catch (error) {
    console.error('❌ Users table error:', error.message);
    return;
  }
  
  // Test 3: Find admin user
  console.log('\n3. Testing admin user lookup...');
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      aktif: adminUser.aktif
    });
    
    // Test 4: Password verification
    console.log('\n4. Testing password verification...');
    const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful');
      console.log('🎉 Login test completed successfully!');
    } else {
      console.log('❌ Password verification failed');
      console.log('🔍 Stored password hash:', adminUser.password.substring(0, 20) + '...');
    }
    
  } catch (error) {
    console.error('❌ User lookup error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLogin().catch(console.error);