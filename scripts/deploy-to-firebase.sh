#!/bin/bash

# Firebase Deployment Script for Coal Tools with Supabase
# This script deploys the Next.js app to Firebase while keeping Supabase as the database

set -e

echo "🚀 Starting Firebase deployment with Supabase integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_warning "You are not logged in to Firebase. Please login first:"
    firebase login
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found. Please create it with your Supabase configuration."
    exit 1
fi

print_status "Building Next.js application..."

# Build the Next.js application
npm run build

if [ $? -eq 0 ]; then
    print_success "Next.js build completed successfully"
else
    print_error "Next.js build failed"
    exit 1
fi

print_status "Building Firebase Functions..."

# Build Firebase Functions
cd functions
npm install
npm run build
cd ..

if [ $? -eq 0 ]; then
    print_success "Firebase Functions build completed successfully"
else
    print_error "Firebase Functions build failed"
    exit 1
fi

print_status "Deploying to Firebase..."

# Deploy to Firebase
firebase deploy

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    print_status "Your application is now live on Firebase with Supabase integration!"
    print_status "Database: Supabase (PostgreSQL)"
    print_status "Hosting: Firebase Hosting"
    print_status "Functions: Firebase Functions"
    echo ""
    print_status "You can access your application at:"
    echo "https://your-project-id.web.app"
    echo ""
    print_status "To get your project URL, run:"
    echo "firebase hosting:channel:list"
else
    print_error "Deployment failed"
    exit 1
fi

print_success "🎉 Deployment completed! Your app is now live with Supabase database!"
