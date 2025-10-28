const fs = require('fs');
const path = require('path');

// List of files that need getPrismaClient fixes
const files = [
  'app/api/test-connection/route.ts',
  'app/api/kwitansi/route.ts',
  'app/api/invoices/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/auth/mfa/setup/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/health/route.ts',
  'app/api/kas-besar/[id]/route.ts',
  'app/api/kas-kecil/[id]/route.ts',
  'app/api/dashboard/summary/route.ts',
  'app/api/test-db/route.ts',
  'app/api/payroll/[id]/route.ts',
  'app/api/buyers/[id]/route.ts',
  'app/api/onboarding/route.ts',
  'app/api/employees/route.ts',
  'app/api/employees/[id]/route.ts'
];

const prismaSingletonCode = `// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Check if file already has singleton pattern
    if (content.includes('globalForPrisma')) {
      console.log(`✅ ${filePath} already has singleton pattern`);
      return;
    }
    
    // Replace getPrismaClient import
    if (content.includes("import { getPrismaClient } from '@/lib/db'")) {
      content = content.replace(
        "import { getPrismaClient } from '@/lib/db'",
        "import { PrismaClient } from '@prisma/client'"
      );
      modified = true;
    }
    
    // Replace getPrismaClient import with other imports
    if (content.includes("import { getPrismaClient, isDatabaseAvailable } from '@/lib/db'")) {
      content = content.replace(
        "import { getPrismaClient, isDatabaseAvailable } from '@/lib/db'",
        "import { PrismaClient } from '@prisma/client'\nimport { isDatabaseAvailable } from '@/lib/db'"
      );
      modified = true;
    }
    
    // Add singleton pattern after imports
    if (content.includes("import { PrismaClient } from '@prisma/client'") && !content.includes('globalForPrisma')) {
      const importEndIndex = content.lastIndexOf("import");
      const nextLineIndex = content.indexOf('\n', importEndIndex) + 1;
      content = content.slice(0, nextLineIndex) + '\n' + prismaSingletonCode + '\n' + content.slice(nextLineIndex);
      modified = true;
    }
    
    // Replace getPrismaClient() calls
    const getPrismaPattern = /const prisma = getPrismaClient\(\);\s*if \(!prisma\) \{[^}]+\}/g;
    if (getPrismaPattern.test(content)) {
      content = content.replace(getPrismaPattern, '// prisma already initialized above');
      modified = true;
    }
    
    // Replace simple getPrismaClient() calls
    const simplePattern = /const prisma = getPrismaClient\(\);/g;
    if (simplePattern.test(content)) {
      content = content.replace(simplePattern, '// prisma already initialized above');
      modified = true;
    }
    
    // Special case for onboarding route
    if (filePath === 'app/api/onboarding/route.ts') {
      content = content.replace(
        /let prismaInstance: ReturnType<typeof getPrismaClient> \| null = null/g,
        '// prisma already initialized above'
      );
      content = content.replace(
        /prismaInstance = getPrismaClient\(\)/g,
        '// prisma already initialized above'
      );
      content = content.replace(
        /prismaInstance/g,
        'prisma'
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⚠️  ${filePath} - No changes needed`);
    }
  } else {
    console.log(`❌ ${filePath} - File not found`);
  }
});

console.log('🎉 All getPrismaClient references fixed!');
