"use client"

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Database, Wifi, WifiOff } from 'lucide-react'

interface DatabaseStatusProps {
  className?: string
}

export function DatabaseStatus({ className }: DatabaseStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      
      // Check if response is successful and database is available
      if (response.ok && data.success && data.database?.available === true) {
        setIsOnline(true)
      } else {
        setIsOnline(false)
      }
    } catch (error) {
      console.error('Database status check error:', error)
      setIsOnline(false)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()
    
    // Check every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <WifiOff className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Database Unavailable</AlertTitle>
      <AlertDescription className="text-red-700">
        Unable to connect to the database. Please check your internet connection and try again. 
        Some features may be limited.
      </AlertDescription>
    </Alert>
  )
}
