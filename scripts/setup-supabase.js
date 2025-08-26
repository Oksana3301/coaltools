#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupSupabase() {
  console.log('🚀 Supabase Setup for Kas Besar Management\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. ✅ Supabase project created at https://supabase.com');
  console.log('2. ✅ Database password noted down');
  console.log('3. ✅ Project ready (green status in dashboard)\n');
  
  const hasProject = await askQuestion('Do you have a Supabase project ready? (y/n): ');
  
  if (hasProject.toLowerCase() !== 'y') {
    console.log('\n📖 Please create a Supabase project first:');
    console.log('1. Go to https://supabase.com');
    console.log('2. Click "New Project"');
    console.log('3. Fill in project details');
    console.log('4. Note down the database password');
    console.log('5. Wait for project to be ready');
    console.log('6. Run this script again\n');
    rl.close();
    return;
  }
  
  console.log('\n📝 Please provide your Supabase details:\n');
  
  const projectRef = await askQuestion('Project Reference (from URL or connection string): ');
  const password = await askQuestion('Database Password: ');
  
  if (!projectRef || !password) {
    console.log('❌ Project reference and password are required!');
    rl.close();
    return;
  }
  
  // Create .env.local file
  const envContent = `# Supabase Database Configuration
DATABASE_URL="postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres"

# Next.js Configuration  
NEXTAUTH_SECRET="kas-besar-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"

# Generated on: ${new Date().toISOString()}
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local file created successfully!');
    console.log('📍 Location:', envPath);
    
    console.log('\n🔄 Next steps:');
    console.log('1. npm run db:push    # Push schema to Supabase');
    console.log('2. npm run db:seed    # Create demo user');
    console.log('3. npm run dev        # Start development server');
    console.log('4. Open http://localhost:3000/coal-tools');
    
    console.log('\n🎯 Test the "Tambah Kas Besar" button!');
    
  } catch (error) {
    console.log('❌ Error creating .env.local file:', error.message);
  }
  
  rl.close();
}

// Run the setup
setupSupabase().catch(console.error);
