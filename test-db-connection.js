const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test employees table
    const employeeCount = await prisma.employee.count();
    console.log(`✅ Found ${employeeCount} employees in database`);
    
    console.log('\n🎉 Database verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    // Common solutions
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check DATABASE_URL in .env.local');
    console.log('2. Verify Supabase project is active');
    console.log('3. Check network connectivity');
    console.log('4. Verify database password is correct');
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();