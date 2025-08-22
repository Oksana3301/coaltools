// Authentication and session management utilities

export interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export const AUTH_STORAGE_KEY = 'user'

// Get current user from localStorage
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem(AUTH_STORAGE_KEY)
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

// Set current user in localStorage
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } catch (error) {
    console.error('Error saving user data:', error)
  }
}

// Remove current user from localStorage (logout)
export function removeCurrentUser(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
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
export function logout(): void {
  removeCurrentUser()
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/auth'
  }
}
