# ⚡ Performance Optimization Guide - CoalTools

## 📋 Overview

Panduan lengkap untuk mengoptimalkan performa aplikasi CoalTools, mencakup frontend optimization, backend optimization, database tuning, dan monitoring.

## 🎯 Performance Targets

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8s
- **Time to Interactive (TTI)**: < 3.5s

### Application Metrics
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 50ms (average)
- **Page Load Time**: < 3s
- **Bundle Size**: < 500KB (gzipped)
- **Memory Usage**: < 100MB (client-side)

## 🚀 Frontend Optimization

### Next.js Optimization

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Compression
  compress: true,
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({
          enabled: true,
          openAnalyzer: true
        }))()
      )
      return config
    }
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    swcMinify: true,
    poweredByHeader: false,
    generateEtags: false,
    
    webpack: (config, { dev, isServer }) => {
      // Tree shaking
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // Minimize bundle size
      if (!dev && !isServer) {
        config.resolve.alias = {
          ...config.resolve.alias,
          '@/components/ui': '@/components/ui/index.ts'
        }
      }
      
      return config
    }
  })
}

module.exports = nextConfig
```

### Code Splitting & Lazy Loading

**components/LazyComponents.tsx**
```typescript
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components
export const EmployeeDataTable = dynamic(
  () => import('@/components/employees/EmployeeDataTable'),
  {
    loading: () => <Skeleton className="w-full h-96" />,
    ssr: false // Disable SSR for client-heavy components
  }
)

export const PayrollChart = dynamic(
  () => import('@/components/payroll/PayrollChart'),
  {
    loading: () => <Skeleton className="w-full h-64" />,
    ssr: false
  }
)

export const FinancialReports = dynamic(
  () => import('@/components/reports/FinancialReports'),
  {
    loading: () => <Skeleton className="w-full h-80" />,
    ssr: false
  }
)

// Route-based code splitting
export const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
)
```

### React Performance Optimization

**hooks/useOptimizedQuery.ts**
```typescript
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useMemo } from 'react'

interface OptimizedQueryOptions<T> extends UseQueryOptions<T> {
  enableBackground?: boolean
  staleTime?: number
  cacheTime?: number
}

export function useOptimizedQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
) {
  const optimizedOptions = useMemo(() => ({
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    ...options
  }), [options])

  return useQuery({
    queryKey: key,
    queryFn,
    ...optimizedOptions
  })
}

// Optimized infinite query for large datasets
export function useOptimizedInfiniteQuery<T>(
  key: string[],
  queryFn: ({ pageParam }: { pageParam: number }) => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
) {
  return useInfiniteQuery({
    queryKey: key,
    queryFn,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options
  })
}
```

**components/OptimizedDataTable.tsx**
```typescript
import React, { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useVirtualizer } from '@tanstack/react-virtual'

interface OptimizedDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  height?: number
  itemHeight?: number
  overscan?: number
}

export function OptimizedDataTable<T>({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  overscan = 5
}: OptimizedDataTableProps<T>) {
  // Memoize expensive calculations
  const memoizedData = useMemo(() => data, [data])
  const memoizedColumns = useMemo(() => columns, [columns])
  
  // Virtualized row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = memoizedData[index]
    
    return (
      <div style={style} className="flex items-center border-b">
        {memoizedColumns.map((column, colIndex) => (
          <div key={colIndex} className="flex-1 px-4 py-2">
            {column.cell ? column.cell(item) : item[column.accessorKey as keyof T]}
          </div>
        ))}
      </div>
    )
  }, [memoizedData, memoizedColumns])
  
  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex bg-muted font-medium">
        {memoizedColumns.map((column, index) => (
          <div key={index} className="flex-1 px-4 py-3">
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtualized Body */}
      <List
        height={height}
        itemCount={memoizedData.length}
        itemSize={itemHeight}
        overscanCount={overscan}
      >
        {Row}
      </List>
    </div>
  )
}
```

### Image Optimization

**components/OptimizedImage.tsx**
```typescript
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {hasError ? (
        <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
          <span>Failed to load image</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
    </div>
  )
}
```

## 🔧 Backend Optimization

### API Route Optimization

**lib/api-optimization.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LRUCache } from 'lru-cache'

// Response cache
const responseCache = new LRUCache<string, any>({
  max: 500,
  ttl: 5 * 60 * 1000 // 5 minutes
})

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>()

export function withOptimization<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>
) {
  return async function optimizedHandler(req: NextRequest): Promise<NextResponse<T>> {
    const start = Date.now()
    
    try {
      // Add performance headers
      const response = await handler(req)
      
      const duration = Date.now() - start
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Cache', 'MISS')
      
      return response
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
}

export function withCache<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  options: { ttl?: number; keyGenerator?: (req: NextRequest) => string } = {}
) {
  return async function cachedHandler(req: NextRequest): Promise<NextResponse<T>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(req)
    }
    
    const cacheKey = options.keyGenerator ? 
      options.keyGenerator(req) : 
      `${req.url}:${req.headers.get('authorization') || 'anonymous'}`
    
    // Check cache
    const cached = responseCache.get(cacheKey)
    if (cached) {
      const response = NextResponse.json(cached)
      response.headers.set('X-Cache', 'HIT')
      return response
    }
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      const result = await pendingRequests.get(cacheKey)!
      const response = NextResponse.json(result)
      response.headers.set('X-Cache', 'DEDUP')
      return response
    }
    
    // Execute request
    const requestPromise = handler(req).then(response => response.json())
    pendingRequests.set(cacheKey, requestPromise)
    
    try {
      const result = await requestPromise
      responseCache.set(cacheKey, result, { ttl: options.ttl })
      
      const response = NextResponse.json(result)
      response.headers.set('X-Cache', 'MISS')
      return response
    } finally {
      pendingRequests.delete(cacheKey)
    }
  }
}

// Pagination optimization
export function optimizePagination({
  page = 1,
  limit = 20,
  maxLimit = 100
}: {
  page?: number
  limit?: number
  maxLimit?: number
}) {
  const normalizedPage = Math.max(1, Math.floor(page))
  const normalizedLimit = Math.min(maxLimit, Math.max(1, Math.floor(limit)))
  const skip = (normalizedPage - 1) * normalizedLimit
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip,
    take: normalizedLimit
  }
}
```

### Database Optimization

**lib/database-optimization.ts**
```typescript
import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

// Connection pooling configuration
export function createOptimizedPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' }
    ]
  })
}

// Query optimization utilities
export class QueryOptimizer {
  private prisma: PrismaClient
  private queryCache = new Map<string, { result: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.setupQueryLogging()
  }
  
  private setupQueryLogging() {
    this.prisma.$on('query', (e) => {
      if (e.duration > 100) { // Log slow queries
        console.warn('Slow Query Detected:', {
          query: e.query,
          duration: `${e.duration}ms`,
          params: e.params
        })
      }
    })
  }
  
  // Optimized employee queries
  async getEmployeesOptimized({
    page = 1,
    limit = 20,
    search,
    site,
    jabatan,
    aktif = true
  }: {
    page?: number
    limit?: number
    search?: string
    site?: string
    jabatan?: string
    aktif?: boolean
  }) {
    const cacheKey = `employees:${page}:${limit}:${search}:${site}:${jabatan}:${aktif}`
    
    // Check cache
    const cached = this.queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result
    }
    
    const start = performance.now()
    
    const where = {
      aktif,
      ...(search && {
        OR: [
          { nama: { contains: search, mode: 'insensitive' as const } },
          { nik: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(site && { site }),
      ...(jabatan && { jabatan })
    }
    
    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        select: {
          id: true,
          nama: true,
          nik: true,
          jabatan: true,
          site: true,
          kontrakUpahHarian: true,
          aktif: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.employee.count({ where })
    ])
    
    const duration = performance.now() - start
    console.log(`Employee query completed in ${duration.toFixed(2)}ms`)
    
    const result = {
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
    
    // Cache result
    this.queryCache.set(cacheKey, { result, timestamp: Date.now() })
    
    return result
  }
  
  // Optimized payroll queries with aggregation
  async getPayrollSummary(periode: string) {
    const cacheKey = `payroll-summary:${periode}`
    
    const cached = this.queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result
    }
    
    const start = performance.now()
    
    const result = await this.prisma.payroll.aggregate({
      where: { periode },
      _sum: {
        gajiPokok: true,
        uangLembur: true,
        uangMakan: true,
        uangBbm: true,
        bonus: true,
        potongan: true,
        totalGaji: true
      },
      _count: {
        id: true
      }
    })
    
    const duration = performance.now() - start
    console.log(`Payroll summary query completed in ${duration.toFixed(2)}ms`)
    
    this.queryCache.set(cacheKey, { result, timestamp: Date.now() })
    
    return result
  }
  
  // Batch operations for better performance
  async batchUpdateEmployees(updates: Array<{ id: string; data: any }>) {
    const start = performance.now()
    
    const results = await this.prisma.$transaction(
      updates.map(({ id, data }) =>
        this.prisma.employee.update({
          where: { id },
          data
        })
      )
    )
    
    const duration = performance.now() - start
    console.log(`Batch update completed in ${duration.toFixed(2)}ms`)
    
    // Clear related cache
    this.clearCacheByPattern('employees:')
    
    return results
  }
  
  private clearCacheByPattern(pattern: string) {
    for (const key of this.queryCache.keys()) {
      if (key.startsWith(pattern)) {
        this.queryCache.delete(key)
      }
    }
  }
}
```

### Database Indexing Strategy

**prisma/migrations/add_performance_indexes.sql**
```sql
-- Employee table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_nama_gin 
  ON "Employee" USING gin(to_tsvector('indonesian', nama));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_nik 
  ON "Employee" (nik);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_site_jabatan 
  ON "Employee" (site, jabatan);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_aktif_created 
  ON "Employee" (aktif, "createdAt" DESC);

-- Payroll table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_employee_periode 
  ON "Payroll" ("employeeId", periode);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_periode 
  ON "Payroll" (periode DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_created 
  ON "Payroll" ("createdAt" DESC);

-- Financial transaction indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kas_besar_tanggal 
  ON "KasBesar" (tanggal DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kas_besar_jenis_tanggal 
  ON "KasBesar" (jenis, tanggal DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kas_kecil_tanggal 
  ON "KasKecil" (tanggal DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kas_kecil_jenis_tanggal 
  ON "KasKecil" (jenis, tanggal DESC);

-- Audit log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_timestamp 
  ON "AuditLog" ("userId", timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_resource_timestamp 
  ON "AuditLog" (resource, timestamp DESC);

-- Security log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_log_type_timestamp 
  ON "SecurityLog" (type, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_log_user_timestamp 
  ON "SecurityLog" ("userId", timestamp DESC);
```

## 📊 Monitoring & Analytics

### Performance Monitoring

**lib/performance-monitor.ts**
```typescript
import { NextRequest } from 'next/server'

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift()
    }
  }
  
  getMetricStats(name: string) {
    const values = this.metrics.get(name) || []
    if (values.length === 0) return null
    
    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }
  
  getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [name] of this.metrics) {
      result[name] = this.getMetricStats(name)
    }
    return result
  }
}

// Performance middleware
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async function monitoredHandler(req: NextRequest): Promise<Response> {
    const start = performance.now()
    const monitor = PerformanceMonitor.getInstance()
    
    try {
      const response = await handler(req)
      const duration = performance.now() - start
      
      // Record metrics
      monitor.recordMetric(`api.${req.nextUrl.pathname}.duration`, duration)
      monitor.recordMetric(`api.${req.nextUrl.pathname}.status.${response.status}`, 1)
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`)
      
      return response
    } catch (error) {
      const duration = performance.now() - start
      monitor.recordMetric(`api.${req.nextUrl.pathname}.duration`, duration)
      monitor.recordMetric(`api.${req.nextUrl.pathname}.error`, 1)
      
      throw error
    }
  }
}
```

### Web Vitals Tracking

**lib/web-vitals.ts**
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

export function trackWebVitals() {
  function sendToAnalytics(metric: WebVitalMetric) {
    // Send to your analytics service
    console.log('Web Vital:', metric)
    
    // Example: Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true
      })
    }
    
    // Example: Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(console.error)
  }
  
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}

// Custom performance observer
export function observePerformance() {
  if (typeof window === 'undefined') return
  
  // Observe long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          console.warn('Long Task Detected:', {
            duration: entry.duration,
            startTime: entry.startTime
          })
        }
        
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          console.log('Navigation Timing:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            firstByte: navEntry.responseStart - navEntry.requestStart
          })
        }
      }
    })
    
    observer.observe({ entryTypes: ['longtask', 'navigation'] })
  }
  
  // Monitor memory usage
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
        console.warn('High Memory Usage:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        })
      }
    }, 30000) // Check every 30 seconds
  }
}
```

## 🔧 Build Optimization

### Webpack Bundle Analysis

**scripts/analyze-bundle.js**
```javascript
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

// Package.json scripts:
// "analyze": "ANALYZE=true npm run build"
// "analyze:server": "BUNDLE_ANALYZE=server npm run build"
// "analyze:browser": "BUNDLE_ANALYZE=browser npm run build"

module.exports = withBundleAnalyzer({
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Analyze bundle size
    if (process.env.BUNDLE_ANALYZE) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: isServer ? 8888 : 8889,
          openAnalyzer: true
        })
      )
    }
    
    // Optimize chunks
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    }
    
    return config
  }
})
```

### Performance Budget

**performance-budget.json**
```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "2kb",
      "maximumError": "4kb"
    },
    {
      "type": "any",
      "maximumWarning": "2mb",
      "maximumError": "5mb"
    }
  ],
  "options": {
    "outputPath": "dist/"
  }
}
```

## 📱 Mobile Performance

### Progressive Web App (PWA)

**next.config.js (PWA)**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60 // 1 day
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
})

module.exports = withPWA({
  // Your Next.js config
})
```

**public/manifest.json**
```json
{
  "name": "CoalTools - Mining Management System",
  "short_name": "CoalTools",
  "description": "Comprehensive mining operations management system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🚀 Deployment Optimization

### Docker Optimization

**Dockerfile.optimized**
```dockerfile
# Multi-stage build for smaller image size
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### CDN Configuration

**lib/cdn-config.ts**
```typescript
// CloudFront or similar CDN configuration
export const CDN_CONFIG = {
  // Static assets
  staticAssets: {
    domain: process.env.CDN_DOMAIN || '',
    paths: ['/images/*', '/icons/*', '/_next/static/*'],
    cacheControl: 'public, max-age=31536000, immutable'
  },
  
  // API responses
  apiCache: {
    paths: ['/api/employees', '/api/reports/*'],
    cacheControl: 'public, max-age=300, s-maxage=600', // 5min browser, 10min CDN
    varyHeaders: ['Authorization']
  },
  
  // Dynamic content
  dynamicContent: {
    paths: ['/dashboard/*', '/coal-tools-*'],
    cacheControl: 'public, max-age=0, s-maxage=60', // No browser cache, 1min CDN
    varyHeaders: ['Cookie', 'Authorization']
  }
}

// Helper function to get optimized asset URL
export function getAssetUrl(path: string): string {
  if (process.env.NODE_ENV === 'production' && CDN_CONFIG.staticAssets.domain) {
    return `${CDN_CONFIG.staticAssets.domain}${path}`
  }
  return path
}
```

## 📊 Performance Testing

### Lighthouse CI Configuration

**.lighthouserc.js**
```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/coal-tools-karyawan',
        'http://localhost:3000/coal-tools-payroll'
      ],
      startServerCommand: 'npm run start',
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}
```

### Load Testing

**scripts/load-test.js**
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 }   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
    errors: ['rate<0.1']
  }
}

const BASE_URL = 'http://localhost:3000'

export default function() {
  // Test login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  })
  
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500
  }) || errorRate.add(1)
  
  // Test employee list
  const employeesRes = http.get(`${BASE_URL}/api/employees`)
  
  check(employeesRes, {
    'employees status is 200': (r) => r.status === 200,
    'employees response time < 300ms': (r) => r.timings.duration < 300,
    'employees has data': (r) => JSON.parse(r.body).data.length > 0
  }) || errorRate.add(1)
  
  // Test payroll data
  const payrollRes = http.get(`${BASE_URL}/api/payroll?periode=2024-01`)
  
  check(payrollRes, {
    'payroll status is 200': (r) => r.status === 200,
    'payroll response time < 400ms': (r) => r.timings.duration < 400
  }) || errorRate.add(1)
  
  sleep(1)
}
```

## 📋 Performance Checklist

### Pre-Deployment Performance Audit

- [ ] **Frontend Optimization**
  - [ ] Code splitting implemented
  - [ ] Lazy loading for heavy components
  - [ ] Image optimization (WebP, AVIF)
  - [ ] Bundle size under 500KB (gzipped)
  - [ ] Tree shaking enabled
  - [ ] Unused code removed

- [ ] **Backend Optimization**
  - [ ] Database queries optimized
  - [ ] Proper indexing in place
  - [ ] API response caching
  - [ ] Request deduplication
  - [ ] Connection pooling configured

- [ ] **Caching Strategy**
  - [ ] Browser caching headers set
  - [ ] CDN configuration optimized
  - [ ] API response caching
  - [ ] Static asset caching
  - [ ] Database query caching

- [ ] **Monitoring & Analytics**
  - [ ] Web Vitals tracking
  - [ ] Performance monitoring
  - [ ] Error tracking
  - [ ] Database performance monitoring
  - [ ] Server resource monitoring

### Regular Performance Maintenance

- [ ] **Weekly Tasks**
  - [ ] Review performance metrics
  - [ ] Check for slow queries
  - [ ] Monitor bundle size changes
  - [ ] Review error rates

- [ ] **Monthly Tasks**
  - [ ] Run Lighthouse audits
  - [ ] Analyze bundle composition
  - [ ] Review caching effectiveness
  - [ ] Update performance budgets
  - [ ] Load testing

---

*Performance optimization adalah proses berkelanjutan. Monitor metrics secara regular dan lakukan optimisasi berdasarkan data real-world usage.*