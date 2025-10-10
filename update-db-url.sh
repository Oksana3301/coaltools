#!/bin/bash

echo "🔧 Updating DATABASE_URL with pooled connection..."

# Remove existing DATABASE_URL
echo "Removing existing DATABASE_URL..."
vercel env rm DATABASE_URL --yes 2>/dev/null || true

# Add new pooled DATABASE_URL
echo "Adding pooled DATABASE_URL..."
echo "postgres://postgres:MySecurePass123!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?options=reference%3Drenoqjwuvdtesblmucax&sslmode=require&pgbouncer=true" | vercel env add DATABASE_URL production,preview,development

echo "✅ DATABASE_URL updated successfully!"
echo "🚀 Now deploying with new configuration..."

# Deploy with updated environment
vercel --prod

echo "🎉 Deployment complete! Test your app now."
