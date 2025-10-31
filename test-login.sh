#!/bin/bash
echo "Testing Admin Login..."
curl -s -X POST 'https://coaltools.vercel.app/api/auth/login' \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"admin@coaltools.com","password":"admin123"}' | python3 -m json.tool

echo ""
echo ""
echo "Testing Staff Login..."
curl -s -X POST 'https://coaltools.vercel.app/api/auth/login' \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"staff@coaltools.com","password":"staff123"}' | python3 -m json.tool
