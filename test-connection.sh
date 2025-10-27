#!/bin/bash
echo "🔍 Testing Database Connection..."
echo "=================================="

echo "1. Health Check:"
curl -s -X GET "https://coaltools.vercel.app/api/test-db" | jq .

echo -e "\n2. Pay Components API:"
curl -s -X GET "https://coaltools.vercel.app/api/pay-components" | jq .

echo -e "\n3. Test POST Operation:"
curl -s -X POST "https://coaltools.vercel.app/api/pay-components" \
  -H "Content-Type: application/json" \
  -d '{"nama": "Test Restart", "tipe": "EARNING", "metode": "FLAT", "basis": "BRUTO", "nominal": 75000, "aktif": true}' | jq .

echo -e "\n=================================="
echo "✅ Test completed!"
