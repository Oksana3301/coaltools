// Authentication and session management utilities

export interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  user: User
  loginTime: number
  lastActivity: number
}

export const AUTH_STORAGE_KEY = 'user'
export const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

// Get current user from localStorage with session validation
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  try {
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!sessionData) return null
    
    const session: UserSession = JSON.parse(sessionData)
    const now = Date.now()
    
    // Check if session has expired
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      removeCurrentUser()
      return null
    }
    
    // Update last activity
    session.lastActivity = now
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    
    return session.user
  } catch (error) {
    console.error('Error parsing user data:', error)
    removeCurrentUser()
    return null
  }
}

// Set current user in localStorage with session data
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return
  
  try {
    const now = Date.now()
    const session: UserSession = {
      user,
      loginTime: now,
      lastActivity: now
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    
    // Also set a cookie for middleware authentication
    const expires = new Date(now + SESSION_TIMEOUT)
    document.cookie = `auth-session=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  } catch (error) {
    console.error('Error saving user data:', error)
  }
}

// Remove current user from localStorage (logout)
export function removeCurrentUser(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    
    // Also remove the auth cookie
    document.cookie = `auth-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
  } catch (error) {
    console.error('Error removing user data:', error)
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

// Check if user has specific role
export function hasRole(role: string): boolean {
  const user = getCurrentUser()
  return user?.role === role
}

// Check if user is admin
export function isAdmin(): boolean {
  return hasRole('admin')
}

// Check if user is approver
export function isApprover(): boolean {
  return hasRole('approver') || hasRole('admin')
}

// Get session info
export function getSessionInfo(): { loginTime: Date | null; timeRemaining: number } {
  if (typeof window === 'undefined') return { loginTime: null, timeRemaining: 0 }
  
  try {
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!sessionData) return { loginTime: null, timeRemaining: 0 }
    
    const session: UserSession = JSON.parse(sessionData)
    const now = Date.now()
    const timeRemaining = Math.max(0, SESSION_TIMEOUT - (now - session.lastActivity))
    
    return {
      loginTime: new Date(session.loginTime),
      timeRemaining
    }
  } catch (error) {
    console.error('Error getting session info:', error)
    return { loginTime: null, timeRemaining: 0 }
  }
}

// Format time remaining in human readable format
export function formatTimeRemaining(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return 'Less than 1 minute'
  }
}

// Login function
export async function login(email: string, password: string): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const result = await response.json()

    if (result.success) {
      setCurrentUser(result.data)
      return { success: true, data: result.data }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

// Logout function
export async function logout(): Promise<void> {
  const user = getCurrentUser()
  
  // Call logout API if user data is available
  if (user) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id, 
          email: user.email 
        }),
      })
    } catch (error) {
      // Don't prevent logout if API call fails
      console.warn('Logout API call failed:', error)
    }
  }
  
  // Always clear local storage
  removeCurrentUser()
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/auth'
  }
}
