const fs = require('fs');
const path = require('path');

// Read the current schema
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🔄 Converting Prisma schema from PostgreSQL to SQLite...');

// Replace PostgreSQL-specific types and functions
schema = schema
  // Change provider
  .replace(/provider = "postgresql"/, 'provider = "sqlite"')
  
  // Replace UUID generation
  .replace(/@default\(dbgenerated\("\(gen_random_uuid\(\)\)::text"\)\)/g, '@default(cuid())')
  
  // Replace Decimal with Float for SQLite
  .replace(/Decimal/g, 'Float')
  .replace(/@db\.Decimal\(\d+,\s*\d+\)/g, '')
  .replace(/@db\.Float\(\d+,\s*\d+\)/g, '')
  .replace(/@db\.VarChar\(\d+\)/g, '')
  .replace(/@db\.Text/g, '')
  
  // Replace String arrays with String for SQLite
  .replace(/String\[\]/g, 'String')
  
  // Replace PostgreSQL timestamp types
  .replace(/@db\.Timestamptz\(\d+\)/g, '')
  
  // Replace enum types with String
  .replace(/user_role\?/g, 'String?')
  .replace(/pay_component_type/g, 'String')
  .replace(/pay_component_method/g, 'String')
  .replace(/pay_component_basis/g, 'String')
  .replace(/payroll_status/g, 'String')
  .replace(/login_status/g, 'String')
  
  // Replace enum defaults
  .replace(/@default\(STAFF\)/g, '@default("STAFF")')
  .replace(/@default\(DRAFT\)/g, '@default("DRAFT")')
  .replace(/@default\(ALLOWANCE\)/g, '@default("ALLOWANCE")')
  .replace(/@default\(DEDUCTION\)/g, '@default("DEDUCTION")')
  .replace(/@default\(FIXED\)/g, '@default("FIXED")')
  .replace(/@default\(PERCENTAGE\)/g, '@default("PERCENTAGE")')
  .replace(/@default\(DAILY_RATE\)/g, '@default("DAILY_RATE")')
  .replace(/@default\(SUCCESS\)/g, '@default("SUCCESS")')
  .replace(/@default\(FAILED\)/g, '@default("FAILED")');

// Remove enum definitions (SQLite doesn't support enums)
schema = schema.replace(/enum\s+\w+\s*\{[^}]+\}/g, '');

// Write the updated schema
fs.writeFileSync(schemaPath, schema);

console.log('✅ Schema converted to SQLite successfully!');
console.log('📝 Next steps:');
console.log('   1. Run: npx prisma generate');
console.log('   2. Run: npx prisma db push');
console.log('   3. Test database connection');