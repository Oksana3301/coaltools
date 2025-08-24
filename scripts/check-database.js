#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  console.log('🔍 Checking database connection and status...\n');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Check environment variables
    console.log('2️⃣ Checking environment variables...');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      console.log('✅ DATABASE_URL is set');
      console.log(`   URL: ${dbUrl.substring(0, 50)}...`);
    } else {
      console.log('❌ DATABASE_URL is not set');
    }
    console.log('');

    // Test 3: Test a simple query
    console.log('3️⃣ Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Simple query successful:', result);
    console.log('');

    // Test 4: Check table count
    console.log('4️⃣ Checking table information...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');

    // Test 5: Check specific tables
    console.log('5️⃣ Checking specific application tables...');
    const appTables = [
      'User',
      'KasKecilExpense', 
      'KasBesarExpense',
      'Employee',
      'ProductionReport'
    ];

    for (const tableName of appTables) {
      try {
        const count = await prisma[tableName].count();
        console.log(`   ✅ ${tableName}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      }
    }
    console.log('');

    // Test 6: Check database version
    console.log('6️⃣ Checking database version...');
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database version:', version[0].version.substring(0, 50) + '...');
    console.log('');

    console.log('🎉 All database checks completed successfully!');
    console.log('📊 Database is fully operational and ready to use.');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Check your DATABASE_URL in .env.local');
    console.error('2. Verify your Supabase database is running');
    console.error('3. Check if your IP is whitelisted in Supabase');
    console.error('4. Ensure your database credentials are correct');
    console.error('5. Try running: npm run db:generate');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabase();
