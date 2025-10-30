#!/bin/bash

echo "🔍 Testing All Production Endpoints..."
echo "======================================"

echo ""
echo "1. Testing Kas Kecil..."
curl -s 'https://coaltools.vercel.app/api/kas-kecil?page=1&limit=5' | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ SUCCESS' if data.get('success') else '❌ ERROR: ' + data.get('error', 'Unknown'))"

echo ""
echo "2. Testing Kas Besar..."
curl -s 'https://coaltools.vercel.app/api/kas-besar?page=1&limit=5' | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ SUCCESS' if data.get('success') else '❌ ERROR: ' + data.get('error', 'Unknown'))"

echo ""
echo "3. Testing Employees..."
curl -s 'https://coaltools.vercel.app/api/employees?page=1&limit=5' | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ SUCCESS' if data.get('success') else '❌ ERROR: ' + data.get('error', 'Unknown'))"

echo ""
echo "4. Testing Buyers..."
curl -s 'https://coaltools.vercel.app/api/buyers' | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ SUCCESS' if data.get('success') else '❌ ERROR: ' + data.get('error', 'Unknown'))"

echo ""
echo "5. Testing Payroll..."
curl -s 'https://coaltools.vercel.app/api/payroll?page=1&limit=5' | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ SUCCESS' if data.get('success') else '❌ ERROR: ' + data.get('error', 'Unknown'))"

echo ""
echo "6. Testing Pay Components..."
curl -s 'https://coaltools.vercel.app/api/pay-components' | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ SUCCESS' if data.get('success') else '❌ ERROR: ' + data.get('error', 'Unknown'))"

echo ""
echo "======================================"
echo "✅ Test Completed"
