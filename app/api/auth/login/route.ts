import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Rate limiting store (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

// Rate limiting configuration
const RATE_LIMIT_MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_LOCKOUT = 30 * 60 * 1000 // 30 minutes

function getRateLimitKey(ip: string, email: string): string {
  return `${ip}:${email}`
}

function checkRateLimit(key: string): { allowed: boolean; timeUntilReset?: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(key)
  
  if (!attempts) {
    return { allowed: true }
  }
  
  // Reset if window has expired
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.delete(key)
    return { allowed: true }
  }
  
  // Check if still in lockout period
  if (attempts.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const timeUntilReset = RATE_LIMIT_LOCKOUT - (now - attempts.lastAttempt)
    if (timeUntilReset > 0) {
      return { allowed: false, timeUntilReset }
    }
    // Lockout expired, reset
    loginAttempts.delete(key)
    return { allowed: true }
  }
  
  return { allowed: true }
}

function recordFailedAttempt(key: string): void {
  const now = Date.now()
  const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: now }
  
  attempts.count += 1
  attempts.lastAttempt = now
  loginAttempts.set(key, attempts)
}

function clearFailedAttempts(key: string): void {
  loginAttempts.delete(key)
}

const LoginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi")
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Login API called');
    
    // Parse request body
    const body = await request.json()
    console.log('📝 Request body parsed:', { email: body.email, hasPassword: !!body.password });
    
    // Validate input
    console.log('🔍 Starting validation...');
    const validatedData = LoginSchema.parse(body)
    console.log('✅ Validation passed');

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1'
    
    const rateLimitKey = getRateLimitKey(clientIP, validatedData.email)
    
    // Check rate limit
    const rateLimit = checkRateLimit(rateLimitKey)
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.timeUntilReset || 0) / (60 * 1000))
      return NextResponse.json(
        { 
          success: false, 
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`,
          rateLimited: true
        },
        { status: 429 }
      )
    }

    // Get Prisma client with retry mechanism
    console.log('🔍 Getting database connection...');
    const prisma = getPrismaClient()
    
    if (!prisma) {
      console.log('❌ Database not available - using fallback authentication');
      
      // Fallback authentication for demo purposes
      if (validatedData.email === 'admin@coaltools.com' && validatedData.password === 'admin123') {
        console.log('✅ Fallback authentication successful');
        return NextResponse.json({
          success: true,
          data: {
            id: 'fallback-admin',
            email: 'admin@coaltools.com',
            name: 'Admin (Fallback)',
            role: 'ADMIN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          message: 'Login berhasil (mode offline)',
          fallback: true
        })
      }
      
      // Record failed attempt even in fallback mode
      recordFailedAttempt(rateLimitKey)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database tidak tersedia. Silakan coba lagi nanti atau hubungi administrator.',
          offline: true
        },
        { status: 503 }
      )
    }
    console.log('✅ Database connection obtained');
    
    // Test database connection with retry
    let connectionRetries = 3;
    let dbConnected = false;
    
    while (connectionRetries > 0 && !dbConnected) {
      try {
        console.log(`🔍 Testing database connection (attempt ${4 - connectionRetries}/3)...`);
        await prisma.$queryRaw`SELECT 1`;
        dbConnected = true;
        console.log('✅ Database connection test successful');
      } catch (dbError) {
        connectionRetries--;
        console.log(`❌ Database connection test failed (${connectionRetries} retries left):`, dbError);
        
        if (connectionRetries > 0) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // All retries exhausted, use fallback
          console.log('❌ All database connection retries exhausted, using fallback');
          
          if (validatedData.email === 'admin@coaltools.com' && validatedData.password === 'admin123') {
            console.log('✅ Fallback authentication successful after DB failure');
            return NextResponse.json({
              success: true,
              data: {
                id: 'fallback-admin-retry',
                email: 'admin@coaltools.com',
                name: 'Admin (Fallback after DB error)',
                role: 'ADMIN',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              message: 'Login berhasil (mode offline setelah error database)',
              fallback: true,
              dbError: true
            })
          }
          
          recordFailedAttempt(rateLimitKey)
          return NextResponse.json(
            { 
              success: false, 
              error: 'Database tidak dapat diakses. Silakan coba lagi nanti atau hubungi administrator.',
              dbError: true,
              details: dbError instanceof Error ? dbError.message : 'Unknown database error'
            },
            { status: 503 }
          )
        }
      }
    }

    // Find user by email
    console.log('🔍 Searching for user:', validatedData.email);
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    console.log('👤 User found:', !!user);

    if (!user) {
      console.log('❌ User not found');
      // Record failed attempt
      recordFailedAttempt(rateLimitKey)
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Verify password
    console.log('🔍 Verifying password...');
    if (!user.password) {
      console.log('❌ User has no password set');
      recordFailedAttempt(rateLimitKey)
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      )
    }
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)
    console.log('🔐 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      // Record failed attempt
      recordFailedAttempt(rateLimitKey)
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(rateLimitKey)

    // Return user data (without password)
    console.log('✅ Login successful');
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'Login berhasil'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Data tidak valid', 
          details: error.issues 
        },
        { status: 400 }
      )
    }

    console.error('❌ API Error [/api/auth/login]:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}
