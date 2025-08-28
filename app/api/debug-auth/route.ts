import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    // Environment info
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    
    // Auth variables (check existence, don't expose values)
    DATABASE_URL: process.env.DATABASE_URL ? 'Set ✅' : 'Missing ❌',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set ✅' : 'Missing ❌',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing ❌',
    
    // Additional Supabase variables
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✅' : 'Missing ❌',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌',
    
    // Timestamp
    timestamp: new Date().toISOString(),
    
    // URL info
    host: process.env.VERCEL_URL || 'localhost',
    region: process.env.VERCEL_REGION || 'local'
  }

  // Check if all required variables are present
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  const status = missingVars.length === 0 ? 'healthy' : 'missing-vars'

  return NextResponse.json({
    status,
    environment: envCheck,
    missingVariables: missingVars,
    recommendations: missingVars.length > 0 ? [
      'Add missing environment variables in Vercel dashboard',
      'Ensure NEXTAUTH_URL matches your Vercel domain',
      'Verify DATABASE_URL is a valid Supabase connection string'
    ] : [
      'All environment variables are properly configured',
      'If authentication still fails, check database connectivity',
      'Test the /api/test-db endpoint'
    ]
  })
}
