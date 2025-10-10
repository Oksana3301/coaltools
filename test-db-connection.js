const { PrismaClient } = require('@prisma/client');

// Manually load environment variables from .env.local
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
  });
  
  console.log('✅ Environment variables loaded from .env.local');
} catch (error) {
  console.log('⚠️  Could not load .env.local:', error.message);
}

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...');
  console.log('📋 Environment Variables:');
  console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('- DATABASE_URL preview:', process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.replace(/:\/\/.*@/, '://***:***@') : 'NOT SET');
  
  let prisma;
  
  try {
    console.log('\n🔧 Creating Prisma Client...');
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('✅ Prisma Client created successfully');
    
    console.log('\n🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    console.log('\n📊 Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Simple query successful:', result);
    
    console.log('\n👥 Testing users table...');
    const userCount = await prisma.user.count();
    console.log('✅ Users table accessible, count:', userCount);
    
    console.log('\n🔍 Testing specific user query...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@coaltools.com' },
      select: { id: true, email: true, role: true, aktif: true }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser);
    } else {
      console.log('⚠️  Admin user not found in database');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
    
    // Specific error handling
    if (error.code === 'P1001') {
      console.log('\n💡 Troubleshooting P1001 (Can\'t reach database server):');
      console.log('1. Check internet connection');
      console.log('2. Verify Supabase project is active');
      console.log('3. Check database URL and credentials');
      console.log('4. Verify firewall/network settings');
    }
    
  } finally {
    if (prisma) {
      console.log('\n🔌 Disconnecting from database...');
      await prisma.$disconnect();
      console.log('✅ Disconnected successfully');
    }
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('\n🎉 Database connection test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error during test:', error);
    process.exit(1);
  });