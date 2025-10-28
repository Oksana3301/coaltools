const fs = require('fs');
const path = require('path');

// List of API files that need Prisma singleton pattern
const apiFiles = [
  'app/api/employees/route.ts',
  'app/api/employees/[id]/route.ts',
  'app/api/buyers/route.ts',
  'app/api/buyers/[id]/route.ts',
  'app/api/pay-components/route.ts',
  'app/api/payroll/route.ts',
  'app/api/payroll/[id]/route.ts',
  'app/api/payroll/save/route.ts',
  'app/api/invoices/route.ts',
  'app/api/kwitansi/route.ts',
  'app/api/users/route.ts',
  'app/api/onboarding/route.ts',
  'app/api/kas-kecil/[id]/route.ts',
  'app/api/kas-besar/[id]/route.ts',
  'app/api/kas-besar/stats/route.ts',
  'app/api/test-supabase/route.ts',
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
    
    // Check if file already has singleton pattern
    if (content.includes('globalForPrisma')) {
      console.log(`✅ ${filePath} already has singleton pattern`);
      return;
    }
    
    // Replace simple PrismaClient instantiation
    const oldPattern = /const prisma = new PrismaClient\(\)/g;
    if (oldPattern.test(content)) {
      content = content.replace(oldPattern, prismaSingletonCode);
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⚠️  ${filePath} - No simple PrismaClient found`);
    }
  } else {
    console.log(`❌ ${filePath} - File not found`);
  }
});

console.log('🎉 Prisma singleton pattern applied to all API routes!');
