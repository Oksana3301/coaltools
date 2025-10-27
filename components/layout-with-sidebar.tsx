"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { SidebarNav } from "@/components/sidebar-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { DatabaseStatus } from "@/components/ui/database-status"
import { Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { getCurrentUser, logout, getSessionInfo, formatTimeRemaining } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LayoutWithSidebarProps {
  children: React.ReactNode
}

export function LayoutWithSidebar({ children }: LayoutWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<{ loginTime: Date | null; timeRemaining: number }>({ loginTime: null, timeRemaining: 0 })
  const { toast } = useToast()

  useEffect(() => {
    const handleLogoutInternal = async () => {
      setIsLoggingOut(true)
      try {
        toast({
          title: "Logging out...",
          description: "Please wait while we log you out safely."
        })
        
        await logout()
        
        toast({
          title: "Logged out successfully",
          description: "You have been logged out safely."
        })
      } catch (error) {
        console.error('Logout error:', error)
        toast({
          title: "Logout Error",
          description: "There was an error logging out. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoggingOut(false)
      }
    }

    try {
      const currentUser = getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        const session = getSessionInfo()
        setSessionInfo(session)
        
        // Update session info every minute
        const interval = setInterval(() => {
          try {
            const updatedSession = getSessionInfo()
            setSessionInfo(updatedSession)
            
            // Auto logout if session expired
            if (updatedSession.timeRemaining <= 0) {
              handleLogoutInternal()
            }
          } catch (error) {
            console.error('Session update error:', error)
          }
        }, 60000) // Check every minute
        
        return () => clearInterval(interval)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      setUser(null)
      setSessionInfo({ loginTime: null, timeRemaining: 0 })
    }
  }, [toast])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      toast({
        title: "Logging out...",
        description: "Please wait while we log you out safely."
      })
      
      await logout()
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out safely."
      })
    } catch (error) {
      console.error('Logout error:', error)
      
      toast({
        title: "Logout Error",
        description: "There was an issue logging out. Redirecting anyway.",
        variant: "destructive"
      })
      
      // Force logout anyway
      window.location.href = '/auth'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">Admin</Badge>
      case 'approver':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Approver</Badge>
      case 'user':
        return <Badge variant="outline" className="text-xs">User</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{role}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <Link className="flex items-center space-x-2" href="/">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BT</span>
              </div>
              <span className="font-bold text-lg">Business Tools</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:not([class*='size-']):size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                  {getRoleBadge(user.role)}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {sessionInfo.timeRemaining > 0 && (
                        <p className="text-xs leading-none text-blue-600">
                          Session: {formatTimeRemaining(sessionInfo.timeRemaining)}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600"
                  >
                    <LogOut className={`h-4 w-4 mr-2 ${isLoggingOut ? 'animate-spin' : ''}`} />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Masuk</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border shadow-sm transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:inset-0
        `}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-4">
              <SidebarNav />
            </div>
            <div className="p-3 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                Business Tools v2.0
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-8">
            <DatabaseStatus className="mb-4" />
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
