/**
 * Enhanced Database Connection Module
 *
 * This module now uses the robust connection manager with:
 * - Automatic retry with exponential backoff
 * - Connection pooling optimized for serverless
 * - Health checks
 * - Comprehensive error handling
 */

import { PrismaClient } from '@prisma/client'

// Re-export everything from the robust implementation
export {
  prisma,
  getPrismaClient,
  getPrismaClientSafe,
  getPrismaClientForBuild,
  testDatabaseConnection,
  executeWithRetry,
  isDatabaseAvailable,
  getConnectionStats,
  disconnectPrisma
} from './db-robust'

// Fallback Supabase REST API functions
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function supabaseQuery(table: string, operation: 'select' | 'insert' | 'update' | 'delete', data?: any) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase configuration not found')
  }

  let url = `${SUPABASE_URL}/rest/v1/${table}`
  let method = 'GET'
  let body: string | undefined

  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  switch (operation) {
    case 'select':
      url += '?select=*&deleted_at=is.null'
      break
    case 'insert':
      method = 'POST'
      body = JSON.stringify(data)
      break
    case 'update':
      method = 'PATCH'
      const { id, ...updateData } = data
      body = JSON.stringify(updateData)
      // For update, we need to add filter to URL
      if (id) {
        url += `?id=eq.${id}`
      }
      break
    case 'delete':
      method = 'DELETE'
      if (data && data.id) {
        url += `?id=eq.${data.id}`
      }
      break
  }

  console.log('Supabase request:', { url, method, headers: { ...headers, Authorization: '[HIDDEN]' }, body })

  const response = await fetch(url, {
    method,
    headers,
    body
  })

  console.log('Supabase response:', response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Supabase error details:', errorText)
    throw new Error(`Supabase API error: ${response.statusText} - ${errorText}`)
  }

  const result = await response.json()
  console.log('Supabase result:', result)
  return result
}

// Export a safe version that returns null instead of throwing
export function getPrismaClientSafe(): PrismaClient | null {
  return prisma
}

// For build-time compatibility, export a mock client when DATABASE_URL is not available
export function getPrismaClientForBuild(): PrismaClient | null {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    // During production build without DATABASE_URL, return null to prevent build failures
    return null
  }
  return prisma
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  return prisma !== null
}
