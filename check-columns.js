const { PrismaClient } = require('@prisma/client');

async function checkColumns() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking users table columns...');
    
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('updated_at', 'role', 'id', 'name', 'email', 'password', 'aktif', 'created_at')
      ORDER BY column_name
    `;
    
    console.log('📊 Column details:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) default: ${col.column_default}`);
    });
    
    // Test simple query without problematic fields
    console.log('\n🧪 Testing simple user query...');
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role, aktif, created_at 
      FROM users 
      WHERE email = 'admin@coaltools.com' 
      LIMIT 1
    `;
    
    console.log('👤 Admin user data:', users[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();