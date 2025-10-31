import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrismaClient } from '@/lib/db'

const prisma = getPrismaClient()

export async function GET(request: NextRequest) {
  try {
    const testResults: any = {
      step1_bcrypt: 'pending',
      step2_prisma: 'pending',
      step3_database_connection: 'pending',
      step4_find_user: 'pending',
      step5_password_verify: 'pending'
    }

    // Step 1: Test bcrypt
    try {
      const testHash = await bcrypt.hash('test123', 10)
      const testVerify = await bcrypt.compare('test123', testHash)
      testResults.step1_bcrypt = testVerify ? 'OK' : 'FAIL'
      testResults.bcrypt_hash_sample = testHash.substring(0, 20) + '...'
    } catch (e) {
      testResults.step1_bcrypt = 'ERROR: ' + (e instanceof Error ? e.message : String(e))
    }

    // Step 2: Test Prisma client
    try {
      testResults.step2_prisma = prisma ? 'OK - client exists' : 'FAIL - client is null'
    } catch (e) {
      testResults.step2_prisma = 'ERROR: ' + (e instanceof Error ? e.message : String(e))
    }

    // Step 3: Test database connection
    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1 as test`
        testResults.step3_database_connection = 'OK'
      } catch (e) {
        testResults.step3_database_connection = 'ERROR: ' + (e instanceof Error ? e.message : String(e))
      }

      // Step 4: Find user
      try {
        const user = await prisma.user.findUnique({
          where: { email: 'admin@coaltools.com' }
        })
        testResults.step4_find_user = user ? 'OK - user found' : 'FAIL - user not found'
        if (user) {
          testResults.user_data = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            has_password: !!user.password,
            password_preview: user.password ? user.password.substring(0, 20) + '...' : 'none'
          }

          // Step 5: Test password verify
          if (user.password) {
            try {
              const isValid = await bcrypt.compare('admin123', user.password)
              testResults.step5_password_verify = isValid ? 'OK - password matches' : 'FAIL - password does not match'
            } catch (e) {
              testResults.step5_password_verify = 'ERROR: ' + (e instanceof Error ? e.message : String(e))
            }
          } else {
            testResults.step5_password_verify = 'SKIP - no password set'
          }
        }
      } catch (e) {
        testResults.step4_find_user = 'ERROR: ' + (e instanceof Error ? e.message : String(e))
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Login debug test completed',
      results: testResults
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
