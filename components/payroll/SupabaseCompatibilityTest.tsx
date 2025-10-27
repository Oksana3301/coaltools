'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Server,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Interface untuk hasil test
 */
interface TestResult {
  success: boolean
  status: 'PASS' | 'FAIL' | 'ERROR'
  message: string
  results?: {
    database: {
      connected: boolean
      tables: string[]
      errors: string[]
    }
    supabase: {
      compatible: boolean
      features: string[]
      errors: string[]
    }
    dataIntegrity: {
      valid: boolean
      checks: string[]
      errors: string[]
    }
  }
  error?: string
  timestamp?: string
}

/**
 * Props untuk komponen SupabaseCompatibilityTest
 */
interface SupabaseCompatibilityTestProps {
  onTestComplete?: (result: TestResult) => void
  className?: string
}

/**
 * Komponen untuk test kompatibilitas Supabase
 * Memvalidasi koneksi database, fitur Supabase, dan integritas data
 */
export function SupabaseCompatibilityTest({ 
  onTestComplete,
  className 
}: SupabaseCompatibilityTestProps) {
  const [isTesting, setIsTesting] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isWriteTesting, setIsWriteTesting] = useState(false)

  /**
   * Jalankan test kompatibilitas
   */
  const runCompatibilityTest = useCallback(async () => {
    setIsTesting(true)
    setTestProgress(0)
    setTestResult(null)

    try {
      // Step 1: Test database connection
      setTestProgress(25)
      const response = await fetch('/api/test-supabase', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      setTestProgress(75)
      const result = await response.json()
      
      setTestProgress(100)
      setTestResult(result)
      onTestComplete?.(result)

    } catch (error) {
      console.error('Compatibility test error:', error)
      const errorResult: TestResult = {
        success: false,
        status: 'ERROR',
        message: 'Test failed with error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      setTestResult(errorResult)
      onTestComplete?.(errorResult)
    } finally {
      setIsTesting(false)
    }
  }, [onTestComplete])

  /**
   * Jalankan test write operations
   */
  const runWriteTest = useCallback(async () => {
    setIsWriteTesting(true)

    try {
      const response = await fetch('/api/test-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testData: {
            timestamp: new Date().toISOString(),
            type: 'write_test'
          }
        })
      })

      const result = await response.json()
      
      // Update test result with write test results
      if (testResult) {
        const updatedResult = {
          ...testResult,
          writeTest: result
        }
        setTestResult(updatedResult)
        onTestComplete?.(updatedResult)
      }

    } catch (error) {
      console.error('Write test error:', error)
    } finally {
      setIsWriteTesting(false)
    }
  }, [testResult, onTestComplete])

  /**
   * Reset test results
   */
  const resetTest = useCallback(() => {
    setTestResult(null)
    setTestProgress(0)
  }, [])

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Test Kompatibilitas Supabase
        </CardTitle>
        <CardDescription>
          Validasi koneksi database, fitur Supabase, dan integritas data sebelum deploy
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Status */}
        {testResult && (
          <Alert className={cn(
            testResult.status === 'PASS' ? 'border-green-200 bg-green-50' :
            testResult.status === 'FAIL' ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
          )}>
            {testResult.status === 'PASS' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : testResult.status === 'FAIL' ? (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={cn(
              testResult.status === 'PASS' ? 'text-green-800' :
              testResult.status === 'FAIL' ? 'text-yellow-800' :
              'text-red-800'
            )}>
              <div className="space-y-2">
                <p className="font-medium">{testResult.message}</p>
                {testResult.timestamp && (
                  <p className="text-xs opacity-75">
                    Tested at: {new Date(testResult.timestamp).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {isTesting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Running Tests</span>
              <span>{Math.round(testProgress)}%</span>
            </div>
            <Progress value={testProgress} className="w-full" />
          </div>
        )}

        {/* Test Results */}
        {testResult?.results && (
          <div className="space-y-4">
            {/* Database Test */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Server className="w-4 h-4" />
                Database Connection
                <Badge variant={testResult.results.database.connected ? "default" : "destructive"}>
                  {testResult.results.database.connected ? 'CONNECTED' : 'DISCONNECTED'}
                </Badge>
              </h4>
              <div className="space-y-1">
                {testResult.results.database.tables.map((table, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {table}
                  </div>
                ))}
                {testResult.results.database.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    ✗ {error}
                  </div>
                ))}
              </div>
            </div>

            {/* Supabase Test */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Supabase Compatibility
                <Badge variant={testResult.results.supabase.compatible ? "default" : "destructive"}>
                  {testResult.results.supabase.compatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}
                </Badge>
              </h4>
              <div className="space-y-1">
                {testResult.results.supabase.features.map((feature, index) => (
                  <div key={index} className="text-sm text-green-600">
                    ✓ {feature}
                  </div>
                ))}
                {testResult.results.supabase.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    ✗ {error}
                  </div>
                ))}
              </div>
            </div>

            {/* Data Integrity Test */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Data Integrity
                <Badge variant={testResult.results.dataIntegrity.valid ? "default" : "destructive"}>
                  {testResult.results.dataIntegrity.valid ? 'VALID' : 'INVALID'}
                </Badge>
              </h4>
              <div className="space-y-1">
                {testResult.results.dataIntegrity.checks.map((check, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {check}
                  </div>
                ))}
                {testResult.results.dataIntegrity.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    ✗ {error}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={runCompatibilityTest}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Run Compatibility Test
          </Button>
          
          {testResult && testResult.status === 'PASS' && (
            <Button
              onClick={runWriteTest}
              disabled={isWriteTesting}
              variant="outline"
            >
              {isWriteTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test Write Operations
            </Button>
          )}
          
          {testResult && (
            <Button
              onClick={resetTest}
              variant="outline"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Compatibility Test: Validasi koneksi database dan fitur Supabase</p>
          <p>• Write Test: Test operasi create, update, delete ke database</p>
          <p>• Data Integrity: Cek konsistensi dan struktur data</p>
          <p>• Semua test harus PASS sebelum deploy ke production</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default SupabaseCompatibilityTest
