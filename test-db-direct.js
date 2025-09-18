const { PrismaClient } = require('@prisma/client');

// Test database directly with raw queries
async function testDatabaseDirect() {
  console.log('🔍 Testing database with raw queries...');
  
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
    
    // Test 1: Check table structure
    console.log('\n1. Checking users table structure...');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    console.log('📊 Users table structure:', tableInfo);
    
    // Test 2: Check actual data
    console.log('\n2. Checking users data...');
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role, aktif, created_at
      FROM users 
      LIMIT 5;
    `;
    console.log('👥 Users data:', users);
    
    // Test 3: Check admin user specifically
    console.log('\n3. Checking admin user...');
    const adminUsers = await prisma.$queryRaw`
      SELECT id, name, email, role, aktif
      FROM users 
      WHERE email = 'admin@example.com';
    `;
    console.log('👤 Admin user:', adminUsers);
    
    // Test 4: Check role values
    console.log('\n4. Checking role values...');
    const roleValues = await prisma.$queryRaw`
      SELECT DISTINCT role, COUNT(*) as count
      FROM users 
      GROUP BY role;
    `;
    console.log('🏷️ Role values:', roleValues);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseDirect().catch(console.error);