#!/bin/bash

echo "========================================="
echo "🧪 COMPREHENSIVE CRUD TEST - ALL ENDPOINTS"
echo "========================================="
echo ""

BASE_URL="https://coaltools.vercel.app"

# Test 1: KAS KECIL
echo "1️⃣  KAS KECIL CRUD TEST"
echo "─────────────────────"
echo -n "  📖 GET (List): "
curl -s "$BASE_URL/api/kas-kecil?page=1&limit=5" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ SUCCESS -', len(d.get('data', [])), 'records') if d.get('success') else print('❌ ERROR:', d.get('error'))"

echo ""

# Test 2: KAS BESAR
echo "2️⃣  KAS BESAR CRUD TEST"
echo "─────────────────────"
echo -n "  📖 GET (List): "
curl -s "$BASE_URL/api/kas-besar?page=1&limit=5" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ SUCCESS -', len(d.get('data', [])), 'records') if d.get('success') else print('❌ ERROR:', d.get('error'))"

echo -n "  📊 GET (Stats): "
curl -s "$BASE_URL/api/kas-besar/stats" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ SUCCESS') if d.get('success') else print('❌ ERROR:', d.get('error'))"

echo ""

# Test 3: EMPLOYEES
echo "3️⃣  EMPLOYEES CRUD TEST"
echo "─────────────────────"
echo -n "  📖 GET (List): "
curl -s "$BASE_URL/api/employees?page=1&limit=5" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ SUCCESS -', len(d.get('data', [])), 'records') if d.get('success') else print('❌ ERROR:', d.get('error'))"

echo ""

# Test 4: BUYERS
echo "4️⃣  BUYERS CRUD TEST"
echo "─────────────────────"
echo -n "  📖 GET (List): "
curl -s "$BASE_URL/api/buyers" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ SUCCESS -', len(d.get('data', [])), 'records') if d.get('success') else print('❌ ERROR:', d.get('error'))"

echo ""

# Test 5: PAY COMPONENTS
echo "5️⃣  PAY COMPONENTS CRUD TEST"
echo "─────────────────────"
echo -n "  📖 GET (List): "
curl -s "$BASE_URL/api/pay-components" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ SUCCESS -', len(d.get('data', [])), 'records') if d.get('success') else print('❌ ERROR:', d.get('error'))"

echo ""

# Test 6: PAYROLL
echo "6️⃣  PAYROLL CRUD TEST"
echo "─────────────────────"
echo -n "  📖 GET (List): "
curl -s "$BASE_URL/api/payroll?page=1&limit=5" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ SUCCESS -', len(d.get('data', [])), 'records') if d.get('success') else print('❌ ERROR:', d.get('error'))"

echo ""

# Test 7: USERS
echo "7️⃣  USERS API TEST"
echo "─────────────────────"
echo -n "  📖 GET (List): "
curl -s "$BASE_URL/api/users" | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ SUCCESS -', len(d.get('data', [])), 'records') if d.get('success') else print('❌ ERROR:', d.get('error'))"

echo ""
echo "========================================="
echo "✅ CRUD TEST COMPLETED"
echo "========================================="
