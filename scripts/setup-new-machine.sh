#!/bin/bash

# Business Tools Hub - New Machine Setup Script
# This script sets up the development environment on a new machine

echo "🚀 Setting up Business Tools Hub on new machine..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git from https://git-scm.com/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.supabase.template .env.local
    echo "⚠️  Please edit .env.local with your database credentials"
    echo "   DATABASE_URL should point to your Supabase database"
    echo "   NEXTAUTH_SECRET should be set to a secure random string"
fi

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env.local with your database credentials"
echo "2. Run: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run db:generate  - Generate Prisma client"
echo "  npm run db:push      - Push schema to database"
echo "  npm run db:studio    - Open Prisma Studio"
