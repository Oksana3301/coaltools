# 🔒 Security Guide - CoalTools

## 📋 Overview

Panduan keamanan komprehensif untuk aplikasi CoalTools yang mencakup authentication, authorization, data protection, dan best practices keamanan.

## 🛡️ Security Architecture

### Security Layers
```
┌─────────────────────────────────────┐
│           Frontend Security         │
│  • Input Validation                 │
│  • XSS Protection                   │
│  • CSRF Protection                  │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│          API Security               │
│  • Authentication                   │
│  • Authorization                    │
│  • Rate Limiting                    │
│  • Input Sanitization              │
└─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│         Database Security           │
│  • Encrypted Connections            │
│  • Parameterized Queries            │
│  • Data Encryption                  │
│  • Access Controls                  │
└─────────────────────────────────────┘
```

## 🔐 Authentication & Authorization

### JWT Token Management

**lib/auth.ts**
```typescript
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = '7d'
const REFRESH_TOKEN_EXPIRES_IN = '30d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'coaltools',
    audience: 'coaltools-users'
  })
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string) {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  )
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'coaltools',
      audience: 'coaltools-users'
    }) as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Hash password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Set secure HTTP-only cookies
 */
export function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies()
  
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })
  
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/'
  })
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies() {
  const cookieStore = cookies()
  
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
}
```

### Role-Based Access Control (RBAC)

**lib/permissions.ts**
```typescript
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER'
}

export enum Permission {
  // Employee permissions
  EMPLOYEE_READ = 'employee:read',
  EMPLOYEE_WRITE = 'employee:write',
  EMPLOYEE_DELETE = 'employee:delete',
  
  // Payroll permissions
  PAYROLL_READ = 'payroll:read',
  PAYROLL_WRITE = 'payroll:write',
  PAYROLL_APPROVE = 'payroll:approve',
  
  // Financial permissions
  FINANCE_READ = 'finance:read',
  FINANCE_WRITE = 'finance:write',
  FINANCE_APPROVE = 'finance:approve',
  
  // Report permissions
  REPORT_READ = 'report:read',
  REPORT_EXPORT = 'report:export',
  
  // System permissions
  SYSTEM_ADMIN = 'system:admin',
  USER_MANAGEMENT = 'user:management'
}

/**
 * Role-Permission mapping
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_WRITE,
    Permission.EMPLOYEE_DELETE,
    Permission.PAYROLL_READ,
    Permission.PAYROLL_WRITE,
    Permission.PAYROLL_APPROVE,
    Permission.FINANCE_READ,
    Permission.FINANCE_WRITE,
    Permission.FINANCE_APPROVE,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,
    Permission.SYSTEM_ADMIN,
    Permission.USER_MANAGEMENT
  ],
  [Role.MANAGER]: [
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_WRITE,
    Permission.PAYROLL_READ,
    Permission.PAYROLL_WRITE,
    Permission.PAYROLL_APPROVE,
    Permission.FINANCE_READ,
    Permission.FINANCE_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT
  ],
  [Role.STAFF]: [
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_READ,
    Permission.PAYROLL_WRITE,
    Permission.FINANCE_READ,
    Permission.REPORT_READ
  ],
  [Role.VIEWER]: [
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_READ,
    Permission.FINANCE_READ,
    Permission.REPORT_READ
  ]
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: Role,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}
```

### Authentication Middleware

**middleware.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { hasPermission, Permission, Role } from '@/lib/permissions'

// Protected routes configuration
const PROTECTED_ROUTES = {
  '/dashboard': [Permission.EMPLOYEE_READ],
  '/coal-tools-karyawan': [Permission.EMPLOYEE_READ],
  '/coal-tools-payroll': [Permission.PAYROLL_READ],
  '/coal-tools-kas-besar': [Permission.FINANCE_READ],
  '/coal-tools-kas-kecil': [Permission.FINANCE_READ],
  '/coal-tools-laporan': [Permission.REPORT_READ],
  '/admin': [Permission.SYSTEM_ADMIN]
}

// API routes that require authentication
const PROTECTED_API_ROUTES = {
  '/api/employees': {
    GET: [Permission.EMPLOYEE_READ],
    POST: [Permission.EMPLOYEE_WRITE],
    PUT: [Permission.EMPLOYEE_WRITE],
    DELETE: [Permission.EMPLOYEE_DELETE]
  },
  '/api/payroll': {
    GET: [Permission.PAYROLL_READ],
    POST: [Permission.PAYROLL_WRITE],
    PUT: [Permission.PAYROLL_WRITE]
  },
  '/api/finance': {
    GET: [Permission.FINANCE_READ],
    POST: [Permission.FINANCE_WRITE],
    PUT: [Permission.FINANCE_WRITE]
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  
  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Get token from cookies
  const token = request.cookies.get('access_token')?.value
  
  if (!token) {
    return redirectToAuth(request)
  }
  
  // Verify token
  const payload = verifyToken(token)
  if (!payload) {
    return redirectToAuth(request)
  }
  
  // Check permissions for protected routes
  if (pathname.startsWith('/api/')) {
    return checkApiPermissions(pathname, method, payload.role as Role)
  } else {
    return checkPagePermissions(pathname, payload.role as Role)
  }
}

function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ['/auth', '/api/auth', '/_next', '/favicon.ico']
  return publicRoutes.some(route => pathname.startsWith(route))
}

function redirectToAuth(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/auth'
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

function checkPagePermissions(pathname: string, userRole: Role): NextResponse {
  const requiredPermissions = PROTECTED_ROUTES[pathname as keyof typeof PROTECTED_ROUTES]
  
  if (requiredPermissions) {
    const hasAccess = requiredPermissions.some(permission => 
      hasPermission(userRole, permission)
    )
    
    if (!hasAccess) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  
  return NextResponse.next()
}

function checkApiPermissions(
  pathname: string,
  method: string,
  userRole: Role
): NextResponse {
  const routePermissions = PROTECTED_API_ROUTES[pathname as keyof typeof PROTECTED_API_ROUTES]
  
  if (routePermissions) {
    const requiredPermissions = routePermissions[method as keyof typeof routePermissions]
    
    if (requiredPermissions) {
      const hasAccess = requiredPermissions.some(permission => 
        hasPermission(userRole, permission)
      )
      
      if (!hasAccess) {
        return new NextResponse(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
```

## 🛡️ Input Validation & Sanitization

### Zod Validation Schemas

**lib/validations.ts**
```typescript
import { z } from 'zod'

// Common validation patterns
const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/
const nikRegex = /^[A-Z0-9]{3,20}$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Sanitization helpers
function sanitizeString(str: string): string {
  return str.trim().replace(/[<>"'&]/g, '')
}

function sanitizeNumber(num: number): number {
  return Math.max(0, Math.floor(num))
}

// User validation
export const userSchema = z.object({
  name: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .transform(sanitizeString),
  email: z.string()
    .email('Format email tidak valid')
    .toLowerCase()
    .transform(sanitizeString),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(passwordRegex, 'Password harus mengandung huruf besar, kecil, angka, dan simbol'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER'])
})

// Employee validation
export const employeeSchema = z.object({
  nama: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .transform(sanitizeString),
  nik: z.string()
    .min(3, 'NIK minimal 3 karakter')
    .max(20, 'NIK maksimal 20 karakter')
    .regex(nikRegex, 'NIK hanya boleh huruf besar dan angka')
    .transform(sanitizeString),
  jabatan: z.string()
    .min(2, 'Jabatan minimal 2 karakter')
    .transform(sanitizeString),
  site: z.string()
    .min(2, 'Site minimal 2 karakter')
    .transform(sanitizeString),
  kontrakUpahHarian: z.number()
    .min(0, 'Upah harian tidak boleh negatif')
    .max(10000000, 'Upah harian terlalu besar')
    .transform(sanitizeNumber),
  defaultUangMakan: z.number()
    .min(0, 'Uang makan tidak boleh negatif')
    .max(1000000, 'Uang makan terlalu besar')
    .transform(sanitizeNumber),
  defaultUangBbm: z.number()
    .min(0, 'Uang BBM tidak boleh negatif')
    .max(1000000, 'Uang BBM terlalu besar')
    .transform(sanitizeNumber),
  noTelp: z.string()
    .regex(phoneRegex, 'Format nomor telepon tidak valid')
    .optional()
    .transform(val => val ? sanitizeString(val) : undefined)
})

// Payroll validation
export const payrollSchema = z.object({
  employeeId: z.string().uuid('ID karyawan tidak valid'),
  periode: z.string().regex(/^\d{4}-\d{2}$/, 'Format periode tidak valid (YYYY-MM)'),
  hariKerja: z.number()
    .min(0, 'Hari kerja tidak boleh negatif')
    .max(31, 'Hari kerja maksimal 31')
    .transform(sanitizeNumber),
  jamLembur: z.number()
    .min(0, 'Jam lembur tidak boleh negatif')
    .max(200, 'Jam lembur terlalu besar')
    .transform(sanitizeNumber),
  bonus: z.number()
    .min(0, 'Bonus tidak boleh negatif')
    .max(50000000, 'Bonus terlalu besar')
    .transform(sanitizeNumber),
  potongan: z.number()
    .min(0, 'Potongan tidak boleh negatif')
    .max(50000000, 'Potongan terlalu besar')
    .transform(sanitizeNumber)
})

// Financial transaction validation
export const transactionSchema = z.object({
  tanggal: z.date().max(new Date(), 'Tanggal tidak boleh di masa depan'),
  keterangan: z.string()
    .min(3, 'Keterangan minimal 3 karakter')
    .max(500, 'Keterangan maksimal 500 karakter')
    .transform(sanitizeString),
  jumlah: z.number()
    .min(1, 'Jumlah minimal 1')
    .max(1000000000, 'Jumlah terlalu besar')
    .transform(sanitizeNumber),
  jenis: z.enum(['MASUK', 'KELUAR']),
  kategori: z.string()
    .min(2, 'Kategori minimal 2 karakter')
    .transform(sanitizeString)
})

// API validation wrapper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}
```

## 🔒 Data Protection

### Database Security

**lib/database-security.ts**
```typescript
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
  cipher.setAAD(Buffer.from('coaltools', 'utf8'))
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
  decipher.setAAD(Buffer.from('coaltools', 'utf8'))
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Secure Prisma client with logging
 */
export function createSecurePrismaClient() {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' }
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

// Audit logging
export interface AuditLog {
  userId: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export async function logAuditEvent(
  prisma: PrismaClient,
  auditData: AuditLog
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        oldValues: auditData.oldValues ? JSON.stringify(auditData.oldValues) : null,
        newValues: auditData.newValues ? JSON.stringify(auditData.newValues) : null,
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        timestamp: auditData.timestamp
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}
```

### Rate Limiting

**lib/rate-limit.ts**
```typescript
import { NextRequest } from 'next/server'
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 login attempts per 15 minutes
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // 3 registration attempts per hour
  },
  '/api/employees': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  },
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  }
}

export async function rateLimit(
  req: NextRequest,
  endpoint?: string
): Promise<{ success: boolean; remaining?: number; resetTime?: number }> {
  const config = DEFAULT_CONFIGS[endpoint || 'default'] || DEFAULT_CONFIGS.default
  
  const key = config.keyGenerator ? 
    config.keyGenerator(req) : 
    getDefaultKey(req, endpoint)
  
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000))
  }
  
  const ttl = await redis.ttl(key)
  const resetTime = Date.now() + (ttl * 1000)
  
  if (current > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime
    }
  }
  
  return {
    success: true,
    remaining: config.maxRequests - current,
    resetTime
  }
}

function getDefaultKey(req: NextRequest, endpoint?: string): string {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const path = endpoint || req.nextUrl.pathname
  
  return `rate_limit:${ip}:${path}:${hashString(userAgent)}`
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

// Rate limit middleware
export function withRateLimit(config?: RateLimitConfig) {
  return async function rateLimitMiddleware(
    req: NextRequest,
    endpoint: string
  ) {
    const result = await rateLimit(req, endpoint)
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          resetTime: result.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime?.toString() || ''
          }
        }
      )
    }
    
    return null // Continue to next middleware
  }
}
```

## 🛡️ Frontend Security

### XSS Protection

**lib/xss-protection.ts**
```typescript
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000) // Limit length
}

/**
 * Content Security Policy headers
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}
```

### CSRF Protection

**lib/csrf-protection.ts**
```typescript
import { NextRequest } from 'next/server'
import crypto from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET!

/**
 * Generate CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now().toString()
  const randomBytes = crypto.randomBytes(16).toString('hex')
  const payload = `${sessionId}:${timestamp}:${randomBytes}`
  
  const hmac = crypto.createHmac('sha256', CSRF_SECRET)
  hmac.update(payload)
  const signature = hmac.digest('hex')
  
  return Buffer.from(`${payload}:${signature}`).toString('base64')
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, sessionId: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const [session, timestamp, randomBytes, signature] = decoded.split(':')
    
    // Check session match
    if (session !== sessionId) {
      return false
    }
    
    // Check token age (max 1 hour)
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    if (now - tokenTime > 60 * 60 * 1000) {
      return false
    }
    
    // Verify signature
    const payload = `${session}:${timestamp}:${randomBytes}`
    const hmac = crypto.createHmac('sha256', CSRF_SECRET)
    hmac.update(payload)
    const expectedSignature = hmac.digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    return false
  }
}

/**
 * CSRF middleware for API routes
 */
export function withCSRFProtection() {
  return async function csrfMiddleware(req: NextRequest) {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return null
    }
    
    const token = req.headers.get('x-csrf-token')
    const sessionId = req.cookies.get('session_id')?.value
    
    if (!token || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'CSRF token missing' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    if (!verifyCSRFToken(token, sessionId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return null // Continue to next middleware
  }
}
```

## 🔍 Security Monitoring

### Security Event Logging

**lib/security-monitoring.ts**
```typescript
import { PrismaClient } from '@prisma/client'

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export interface SecurityEvent {
  type: SecurityEventType
  userId?: string
  ipAddress: string
  userAgent: string
  details: Record<string, any>
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timestamp: Date
}

export class SecurityMonitor {
  private prisma: PrismaClient
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  
  async logSecurityEvent(event: SecurityEvent) {
    try {
      await this.prisma.securityLog.create({
        data: {
          type: event.type,
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          details: JSON.stringify(event.details),
          severity: event.severity,
          timestamp: event.timestamp
        }
      })
      
      // Alert for high severity events
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await this.sendSecurityAlert(event)
      }
      
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
  
  async detectSuspiciousActivity(userId: string, ipAddress: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    // Check for multiple failed logins
    const failedLogins = await this.prisma.securityLog.count({
      where: {
        type: SecurityEventType.LOGIN_FAILURE,
        userId,
        timestamp: { gte: oneHourAgo }
      }
    })
    
    if (failedLogins >= 5) {
      await this.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        userId,
        ipAddress,
        userAgent: '',
        details: { reason: 'Multiple failed login attempts', count: failedLogins },
        severity: 'HIGH',
        timestamp: new Date()
      })
      
      return true
    }
    
    // Check for unusual access patterns
    const recentAccess = await this.prisma.securityLog.findMany({
      where: {
        userId,
        timestamp: { gte: oneHourAgo },
        type: SecurityEventType.DATA_ACCESS
      },
      select: { ipAddress: true }
    })
    
    const uniqueIPs = new Set(recentAccess.map(log => log.ipAddress))
    if (uniqueIPs.size > 3) {
      await this.logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        userId,
        ipAddress,
        userAgent: '',
        details: { reason: 'Access from multiple IPs', ipCount: uniqueIPs.size },
        severity: 'MEDIUM',
        timestamp: new Date()
      })
      
      return true
    }
    
    return false
  }
  
  private async sendSecurityAlert(event: SecurityEvent) {
    // Implementation for sending alerts (email, Slack, etc.)
    console.warn('SECURITY ALERT:', {
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: event.details
    })
  }
}
```

## 🔧 Security Configuration

### Environment Variables

**.env.example**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/coaltools"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
CSRF_SECRET="your-csrf-secret-key"
ENCRYPTION_KEY="your-encryption-key-32-chars-long"

# Redis (for rate limiting)
REDIS_URL="redis://localhost:6379"

# Security
NODE_ENV="production"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

### Security Headers

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

## 📋 Security Checklist

### Pre-Deployment Security Audit

- [ ] **Authentication & Authorization**
  - [ ] JWT tokens properly configured with expiration
  - [ ] Password hashing using bcrypt with salt rounds ≥ 12
  - [ ] Role-based access control implemented
  - [ ] Session management secure (HTTP-only cookies)
  - [ ] Logout functionality clears all tokens

- [ ] **Input Validation & Sanitization**
  - [ ] All user inputs validated with Zod schemas
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] XSS prevention (input sanitization)
  - [ ] File upload validation (if applicable)
  - [ ] Rate limiting implemented

- [ ] **Data Protection**
  - [ ] Sensitive data encrypted at rest
  - [ ] Database connections encrypted (SSL/TLS)
  - [ ] Environment variables secured
  - [ ] Audit logging implemented
  - [ ] Data backup strategy in place

- [ ] **Network Security**
  - [ ] HTTPS enforced in production
  - [ ] Security headers configured
  - [ ] CORS properly configured
  - [ ] API endpoints protected
  - [ ] Rate limiting on sensitive endpoints

- [ ] **Monitoring & Logging**
  - [ ] Security event logging
  - [ ] Error monitoring (Sentry)
  - [ ] Suspicious activity detection
  - [ ] Regular security log reviews
  - [ ] Incident response plan

### Regular Security Maintenance

- [ ] **Monthly Tasks**
  - [ ] Review security logs
  - [ ] Update dependencies
  - [ ] Check for security vulnerabilities
  - [ ] Review user access permissions
  - [ ] Test backup and recovery procedures

- [ ] **Quarterly Tasks**
  - [ ] Security penetration testing
  - [ ] Code security review
  - [ ] Update security policies
  - [ ] Staff security training
  - [ ] Incident response drill

---

*Keamanan adalah prioritas utama. Pastikan semua langkah keamanan diimplementasikan sebelum deployment ke production.*