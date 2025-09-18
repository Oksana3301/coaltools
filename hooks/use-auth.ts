"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, getCurrentUser } from '@/lib/auth'

interface AuthGuardOptions {
  redirectTo?: string
  requireAuth?: boolean
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { redirectTo = '/auth', requireAuth = true } = options
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = isAuthenticated()
        const currentUser = getCurrentUser()
        
        setUser(currentUser)
        
        if (requireAuth && !authenticated) {
          // If auth is required but user is not authenticated
          if (pathname !== redirectTo) {
            router.push(`${redirectTo}?redirect=${pathname}`)
            return
          }
        } else if (authenticated && pathname === '/auth') {
          // If user is authenticated but trying to access auth page
          const urlParams = new URLSearchParams(window.location.search)
          const redirect = urlParams.get('redirect') || '/coal-tools-kaskecil'
          router.push(redirect)
          return
        }
        
        setIsLoading(false)
      } catch (error) {
        // Log error for debugging in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth check error:', error)
        }
        setUser(null)
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for changes in local storage (e.g., logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === null) {
        checkAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [pathname, router, redirectTo, requireAuth])

  return { 
    user, 
    isAuthenticated: isAuthenticated(), 
    isLoading 
  }
}

// Hook for pages that don't require authentication
export function useOptionalAuth() {
  return useAuthGuard({ requireAuth: false })
}

// Hook for public pages that should redirect if already authenticated
export function usePublicAuth() {
  return useAuthGuard({ requireAuth: false })
}