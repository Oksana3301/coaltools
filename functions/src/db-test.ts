import { PrismaClient } from '@prisma/client';

// Test database connection
export async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful. User count: ${userCount}`);
    
    return { success: true, userCount };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}
