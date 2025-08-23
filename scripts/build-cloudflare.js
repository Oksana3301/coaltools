#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Cloudflare Pages build...');

try {
  // Step 1: Install dependencies with legacy peer deps
  console.log('📦 Installing dependencies with legacy peer deps...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Step 2: Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Step 3: Build Next.js application
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
