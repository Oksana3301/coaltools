#!/bin/bash

# =====================================================
# Deploy Security Fix to Supabase
# This script applies the security fixes for mutable search_path
# =====================================================

echo "🔐 Deploying Supabase Security Fix..."
echo "====================================="

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase-security-fix.sql" ]; then
    echo "❌ supabase-security-fix.sql not found in current directory"
    exit 1
fi

# Apply the security fix
echo "📤 Applying security fix to Supabase..."

# Option 1: If you have supabase CLI configured
echo "Executing SQL fixes..."
supabase db reset --linked
supabase db push

# Option 2: Manual instructions for Supabase Dashboard
echo ""
echo "🔧 MANUAL DEPLOYMENT INSTRUCTIONS:"
echo "====================================="
echo "If the automatic deployment doesn't work, please:"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the content from 'supabase-security-fix.sql'"
echo "4. Execute the SQL script"
echo ""
echo "📋 The fix will:"
echo "   ✅ Add SET search_path to all three functions"
echo "   ✅ Remove the 'mutable search_path' security warning"
echo "   ✅ Protect against privilege escalation attacks"
echo ""

# Option 3: Direct connection if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
    echo "🔌 Found DATABASE_URL, attempting direct connection..."
    if command -v psql &> /dev/null; then
        echo "📊 Executing security fix via psql..."
        psql "$DATABASE_URL" -f supabase-security-fix.sql
        if [ $? -eq 0 ]; then
            echo "✅ Security fix applied successfully via direct connection!"
        else
            echo "❌ Failed to apply via direct connection. Try manual method."
        fi
    else
        echo "📝 psql not available. Use manual method in Supabase Dashboard."
    fi
fi

echo ""
echo "🎯 VERIFICATION:"
echo "================"
echo "After applying the fix, the functions should no longer have:"
echo "'role mutable search_path' warnings"
echo ""
echo "✅ Security fix deployment completed!"

