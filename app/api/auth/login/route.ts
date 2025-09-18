import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logger } from '@/lib/logger'

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
    const body = await request.json()
    const validatedData = LoginSchema.parse(body)

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

    // Get Prisma client (returns null if not available)
    const prisma = getPrismaClient()
    
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      // Record failed attempt
      recordFailedAttempt(rateLimitKey)
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)

    if (!isPasswordValid) {
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

    logger.apiError('/api/auth/login', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}
