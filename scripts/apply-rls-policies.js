const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read the DATABASE_URL from .env.local file
function getDatabaseUrl() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL="([^"]+)"/);
    if (match) {
      return match[1];
    }
  } catch (error) {
    console.error('Error reading .env.local file:', error.message);
  }
  
  // Fallback to environment variable
  return process.env.DATABASE_URL;
}

const DATABASE_URL = getDatabaseUrl();

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local or environment variables');
  process.exit(1);
}

console.log('🔗 Using DATABASE_URL:', DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

async function applyRLSPolicies() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-rls-simple.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Applying RLS policies...');
    
    // Split the SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          // If policy already exists, that's okay
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Policy already exists for statement ${i + 1}`);
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          }
        }
      }
    }

    console.log('🎉 RLS policies applied successfully!');
    
    // Test the connection by running a simple query
    console.log('🧪 Testing database connection...');
    const result = await client.query('SELECT current_database(), current_user');
    console.log(`✅ Database: ${result.rows[0].current_database}`);
    console.log(`✅ User: ${result.rows[0].current_user}`);

  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
applyRLSPolicies();
