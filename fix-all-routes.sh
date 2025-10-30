#!/bin/bash

# Script to fix all API routes with old Prisma singleton pattern

FILES=(
  "app/api/admin-test/route.ts"
  "app/api/auth/logout/route.ts"
  "app/api/auth/mfa/setup/route.ts"
  "app/api/buyers/[id]/route.ts"
  "app/api/buyers/route.ts"
  "app/api/dashboard/summary/route.ts"
  "app/api/employees/[id]/route.ts"
  "app/api/kas-besar/route.ts"
  "app/api/kas-besar/stats/route.ts"
  "app/api/payroll/route.ts"
  "app/api/payroll/save/route.ts"
  "app/api/test-supabase/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Create backup
    cp "$file" "$file.backup"

    # Replace old Prisma singleton pattern
    # This uses a temporary file to do the replacement
    awk '
      BEGIN { in_singleton = 0; printed_import = 0 }

      # Skip the old singleton pattern
      /^import.*PrismaClient.*from.*@prisma\/client/ {
        if (!printed_import) {
          print "import { getPrismaClient } from '"'"'@/lib/db'"'"'"
          printed_import = 1
        }
        next
      }

      /^\/\/ Singleton pattern/ { in_singleton = 1; next }
      /^const globalForPrisma/ { in_singleton = 1; next }
      /^const prisma = globalForPrisma/ {
        print ""
        print "// Use shared prisma client from lib/db"
        print "const prisma = getPrismaClient()"
        in_singleton = 0
        next
      }
      /^if.*process\.env\.NODE_ENV.*production.*globalForPrisma/ { next }

      { if (!in_singleton) print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"

    echo "Fixed $file"
  else
    echo "File not found: $file"
  fi
done

echo "All files processed!"
