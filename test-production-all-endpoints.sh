#!/bin/bash

# Production Comprehensive Test
# Tests all endpoints on production URL

PROD_URL="https://coaltools.vercel.app"

echo "========================================="
echo "🚀 PRODUCTION ENDPOINT TEST"
echo "========================================="
echo "Testing URL: $PROD_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local url=$2
    local expected_field=$3

    echo -n "Testing $name... "

    response=$(curl -s "$url")
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$http_code" = "200" ]; then
        if echo "$response" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ SUCCESS${NC} (HTTP $http_code)"
            if [ -n "$expected_field" ]; then
                if echo "$response" | grep -q "$expected_field"; then
                    echo "   └─ Response contains expected data"
                else
                    echo -e "   ${YELLOW}⚠️  Warning: Expected field '$expected_field' not found${NC}"
                fi
            fi
        else
            echo -e "${RED}❌ FAILED${NC} - Response: $(echo $response | head -c 100)"
        fi
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
        echo "   Response: $(echo $response | head -c 200)"
    fi
    echo ""
}

echo "1️⃣  KAS KECIL"
echo "──────────────────────────────────────"
test_endpoint "GET Kas Kecil (List)" "$PROD_URL/api/kas-kecil?page=1&limit=5" "data"

echo "2️⃣  KAS BESAR"
echo "──────────────────────────────────────"
test_endpoint "GET Kas Besar (List)" "$PROD_URL/api/kas-besar?page=1&limit=5" "data"
test_endpoint "GET Kas Besar Stats" "$PROD_URL/api/kas-besar/stats" "totalTransactions"

echo "3️⃣  EMPLOYEES (SDM)"
echo "──────────────────────────────────────"
test_endpoint "GET Employees (List)" "$PROD_URL/api/employees?page=1&limit=5" "data"

echo "4️⃣  BUYERS (PEMBELI)"
echo "──────────────────────────────────────"
test_endpoint "GET Buyers (List)" "$PROD_URL/api/buyers" "data"

echo "5️⃣  PAY COMPONENTS (KOMPONEN GAJI)"
echo "──────────────────────────────────────"
test_endpoint "GET Pay Components" "$PROD_URL/api/pay-components" "data"

echo "6️⃣  PAYROLL"
echo "──────────────────────────────────────"
test_endpoint "GET Payroll (List)" "$PROD_URL/api/payroll?page=1&limit=5" "data"

echo "7️⃣  USERS (MANAJEMEN PENGGUNA)"
echo "──────────────────────────────────────"
test_endpoint "GET Users (List)" "$PROD_URL/api/users" "data"

echo "========================================="
echo "🏁 PRODUCTION TEST COMPLETE"
echo "========================================="
echo ""
echo "Production URL: $PROD_URL"
echo "All endpoints tested!"
echo ""
echo "Next steps:"
echo "1. Check if all endpoints show ✅ SUCCESS"
echo "2. Open browser and test each menu manually"
echo "3. Try CRUD operations (Create, Read, Update, Delete)"
echo ""
