/**
 * Script sederhana untuk menguji koneksi database
 * Menguji berbagai konfigurasi URL database yang mungkin
 */

const { Client } = require('pg');
const fs = require('fs');

// Baca file .env secara manual
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n');
    const env = {};
    
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    });
    
    return env;
  } catch (error) {
    console.log('⚠️ Could not read .env file');
    return {};
  }
}

const env = loadEnv();

// Konfigurasi database yang akan diuji
const dbConfigs = [
  {
    name: 'Current .env DATABASE_URL',
    connectionString: env.DATABASE_URL
  },
  {
    name: 'Direct connection (tanpa pooler)',
    connectionString: 'postgres://postgres:MySecurePass123%21@db.renoqjwuvdtesblmucax.supabase.co:5432/postgres'
  },
  {
    name: 'Pooler connection',
    connectionString: 'postgres://postgres.renoqjwuvdtesblmucax:MySecurePass123%21@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
  },
  {
    name: 'Alternative pooler',
    connectionString: 'postgres://postgres:MySecurePass123%21@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
  }
];

async function testConnection(config) {
  console.log(`\n🔍 Testing: ${config.name}`);
  console.log(`📡 URL: ${config.connectionString?.substring(0, 50)}...`);
  
  const client = new Client({
    connectionString: config.connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`⏰ Server time: ${result.rows[0].current_time}`);
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`📊 Tables found: ${tables.rows.length}`);
    if (tables.rows.length > 0) {
      console.log('   Tables:', tables.rows.map(r => r.table_name).join(', '));
    }
    
    return true;
  } catch (error) {
    console.log('❌ Connection failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Database Connection Test');
  console.log('=' .repeat(50));
  
  let successfulConnection = null;
  
  for (const config of dbConfigs) {
    const success = await testConnection(config);
    if (success && !successfulConnection) {
      successfulConnection = config;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMMARY');
  console.log('=' .repeat(50));
  
  if (successfulConnection) {
    console.log('✅ Found working connection!');
    console.log(`🎯 Use this URL: ${successfulConnection.connectionString}`);
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with the working URL');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run: npm run dev');
  } else {
    console.log('❌ No working connections found.');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check Supabase dashboard - is your project active?');
    console.log('2. Verify your database password');
    console.log('3. Check if your IP is whitelisted in Supabase');
    console.log('4. Try connecting from Supabase SQL Editor');
  }
}

main().catch(console.error);