// Debug script to test API login with detailed error logging
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Simulate the exact API route logic with detailed logging
async function debugApiLogin() {
  console.log('🔧 Debugging API login with detailed error tracking...');
  
  try {
    console.log('\n1. Testing environment variables...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    console.log('\n2. Testing Prisma client creation...');
    let prisma;
    try {
      prisma = new PrismaClient();
      console.log('✅ Prisma client created successfully');
    } catch (prismaError) {
      console.log('❌ Prisma client creation failed:', prismaError.message);
      return;
    }
    
    console.log('\n3. Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (connectError) {
      console.log('❌ Database connection failed:', connectError.message);
      return;
    }
    
    console.log('\n4. Testing bcrypt import...');
    try {
      const testHash = await bcrypt.hash('test', 12);
      const testCompare = await bcrypt.compare('test', testHash);
      console.log('✅ bcrypt working:', testCompare);
    } catch (bcryptError) {
      console.log('❌ bcrypt error:', bcryptError.message);
      return;
    }
    
    console.log('\n5. Testing zod validation...');
    try {
      const { z } = require('zod');
      const LoginSchema = z.object({
        email: z.string().email("Format email tidak valid"),
        password: z.string().min(1, "Password wajib diisi")
      });
      
      const testData = LoginSchema.parse({
        email: 'admin@coaltools.com',
        password: 'admin123'
      });
      console.log('✅ Zod validation working');
    } catch (zodError) {
      console.log('❌ Zod validation error:', zodError.message);
      return;
    }
    
    console.log('\n6. Testing user query...');
    try {
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
        hasPassword: !!user.password
      });
      
      console.log('\n7. Testing password comparison...');
      const isValid = await bcrypt.compare('admin123', user.password);
      console.log('✅ Password comparison result:', isValid);
      
      console.log('\n8. Testing response creation...');
      const { password, ...userWithoutPassword } = user;
      const response = {
        success: true,
        data: userWithoutPassword,
        message: 'Login berhasil'
      };
      console.log('✅ Response created successfully');
      
    } catch (queryError) {
      console.log('❌ Database query error:', queryError.message);
      console.log('Error code:', queryError.code);
      console.log('Error stack:', queryError.stack);
      return;
    }
    
    console.log('\n9. Testing logger import...');
    try {
      const { logger } = require('./lib/logger.ts');
      console.log('✅ Logger imported successfully');
      logger.info('Test log message');
    } catch (loggerError) {
      console.log('❌ Logger error:', loggerError.message);
      console.log('This might be the cause of API 500 error!');
    }
    
    console.log('\n🎉 All components working individually!');
    console.log('The error is likely in the logger import in the API route.');
    
  } catch (error) {
    console.error('❌ Unexpected error in debug script:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

debugApiLogin();