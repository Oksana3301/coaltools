import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of protected routes that require authentication
const protectedRoutes = [
  '/coal-tools-kaskecil',
  '/coal-tools-kasbesar', 
  '/coal-tools-karyawan',
  '/coal-tools-kalkulatorgaji',
  '/coal-tools-laporanproduksi',
  '/onboarding-demo',
  '/admin-status-test',
  '/invoice',
  '/kwitansi',
  '/dashboard'
]

// List of public routes that don't require authentication
const publicRoutes = [
  '/auth',
  '/api/auth/login',
  '/api/auth/logout',
  '/',
  '/favicon.ico',
  '/_next'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow all API routes (except auth ones which are handled separately)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Allow static files and public routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    publicRoutes.some(route => pathname === route)
  ) {
    return NextResponse.next()
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Check for both cookie and localStorage-based auth
    const authCookie = request.cookies.get('user')
    const sessionCookie = request.cookies.get('auth-session')
    
    // If no auth indicators and it's a protected route, redirect to login
    // Temporarily disable middleware for development - let client-side handle auth
    // TODO: Implement proper cookie-based auth for production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment && !authCookie && !sessionCookie) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
