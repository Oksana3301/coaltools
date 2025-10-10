import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of protected routes that require authentication
const protectedRoutes = [
  '/coal-tools-kaskecil',
  '/coal-tools-kasbesar', 
  '/coal-tools-karyawan',
  '/payroll-integrated',
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
    // Since we're using localStorage-based auth (client-side only),
    // we need to let the client-side handle authentication
    // The middleware will redirect unauthenticated users, but authenticated users
    // with localStorage data will be handled by client-side routing
    
    // Check for auth cookie (set by client-side after login)
    const authCookie = request.cookies.get('auth-session')
    
    // Only redirect if there's no auth cookie at all
    // This allows client-side auth to work while still protecting routes
    if (!authCookie) {
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
