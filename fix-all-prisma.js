const fs = require('fs');
const path = require('path');

// List of API files that need Prisma fixes
const apiFiles = [
  'app/api/employees/route.ts',
  'app/api/employees/[id]/route.ts',
  'app/api/buyers/route.ts',
  'app/api/buyers/[id]/route.ts',
  'app/api/pay-components/route.ts',
  'app/api/payroll/route.ts',
  'app/api/payroll/[id]/route.ts',
  'app/api/invoices/route.ts',
  'app/api/kwitansi/route.ts',
  'app/api/users/route.ts',
  'app/api/onboarding/route.ts',
  'app/api/kas-kecil/[id]/route.ts',
  'app/api/kas-besar/[id]/route.ts',
  'app/api/kas-besar/stats/route.ts',
  'app/api/admin-test/route.ts'
];

const prismaSingletonCode = `// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`;

apiFiles.forEach(filePath => {
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

console.log('🎉 All Prisma patterns fixed!');
