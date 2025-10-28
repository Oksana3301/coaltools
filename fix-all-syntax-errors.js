const fs = require('fs');
const path = require('path');

// List of API files that need syntax fixes
const apiFiles = [
  'app/api/buyers/route.ts',
  'app/api/payroll/route.ts',
  'app/api/users/route.ts',
  'app/api/employees/[id]/route.ts',
  'app/api/buyers/[id]/route.ts',
  'app/api/pay-components/route.ts',
  'app/api/payroll/[id]/route.ts',
  'app/api/invoices/route.ts',
  'app/api/kwitansi/route.ts',
  'app/api/onboarding/route.ts',
  'app/api/kas-kecil/[id]/route.ts',
  'app/api/kas-besar/[id]/route.ts',
  'app/api/admin-test/route.ts'
];

apiFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Fix broken prisma initialization patterns
    const brokenPatterns = [
      // Pattern 1: // prisma already initialized above, { status: 503 } )
      /\/\/ prisma already initialized above,\s*\{ status: 503 \}\s*\)\s*\)\s*\}\s*\n\s*\{/g,
      // Pattern 2: // prisma already initialized above, { status: 503 } )
      /\/\/ prisma already initialized above,\s*\{ status: 503 \}\s*\)\s*\)\s*\}\s*\n\s*\n\s*\{/g,
      // Pattern 3: // prisma already initialized above, { status: 503 } )
      /\/\/ prisma already initialized above,\s*\{ status: 503 \}\s*\)\s*\)\s*\}\s*\n\s*\n\s*\/\/ prisma already initialized above,\s*\{ status: 503 \}\s*\)\s*\)\s*\}\s*\n\s*\n\s*\{/g
    ];
    
    brokenPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        modified = true;
      }
    });
    
    // Fix specific broken lines
    const brokenLines = [
      '// prisma already initialized above,',
      '        { status: 503 }',
      '      )',
      '    }',
      '',
      '    '
    ];
    
    // Remove broken lines that appear together
    let lines = content.split('\n');
    let newLines = [];
    let skipNext = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (skipNext) {
        skipNext = false;
        continue;
      }
      
      // Check if this line starts a broken pattern
      if (line.includes('// prisma already initialized above,')) {
        // Skip this line and the next few lines that are part of the broken pattern
        let j = i + 1;
        while (j < lines.length && (
          lines[j].includes('{ status: 503 }') ||
          lines[j].includes(')') ||
          lines[j].includes('}') ||
          lines[j].trim() === ''
        )) {
          j++;
        }
        i = j - 1; // Skip to the end of the broken pattern
        continue;
      }
      
      newLines.push(line);
    }
    
    content = newLines.join('\n');
    
    if (modified || content !== fs.readFileSync(fullPath, 'utf8')) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⚠️  ${filePath} - No changes needed`);
    }
  } else {
    console.log(`❌ ${filePath} - File not found`);
  }
});

console.log('🎉 All syntax errors fixed!');
