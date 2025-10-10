# 🔧 Troubleshooting Guide - CoalTools

## 📋 Overview

Panduan lengkap untuk mendiagnosis dan mengatasi masalah yang umum terjadi pada aplikasi CoalTools, mencakup frontend issues, backend problems, database errors, dan deployment issues.

## 🚨 Common Issues & Solutions

### 1. Application Won't Start

#### Problem: `npm run dev` fails

**Symptoms:**
- Error messages during startup
- Port already in use
- Module not found errors

**Solutions:**

```bash
# Check if port is in use
lsof -i :3000

# Kill process using port 3000
kill -9 $(lsof -t -i:3000)

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (should be 18+)
node --version

# Update Node.js if needed
nvm install 18
nvm use 18
```

#### Problem: Environment variables not loaded

**Symptoms:**
- Database connection errors
- Authentication failures
- Missing configuration values

**Solutions:**

```bash
# Check if .env.local exists
ls -la .env*

# Verify environment variables
echo $DATABASE_URL
echo $NEXTAUTH_SECRET

# Create .env.local if missing
cp .env.example .env.local

# Restart development server
npm run dev
```

### 2. Database Connection Issues

#### Problem: Prisma connection errors

**Symptoms:**
```
PrismaClientInitializationError: Can't reach database server
Error: P1001: Can't reach database server
```

**Solutions:**

```bash
# Check database status
pg_isready -h localhost -p 5432

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://username:password@localhost:5432/coaltools

# Test database connection
npx prisma db pull

# Reset database if corrupted
npx prisma migrate reset
npx prisma db push
npx prisma generate
```

#### Problem: Migration failures

**Symptoms:**
```
Migration failed to apply cleanly to the shadow database
Error: P3006: Migration `xxx` failed to apply cleanly to the shadow database
```

**Solutions:**

```bash
# Check migration status
npx prisma migrate status

# Reset migrations (CAUTION: This will delete all data)
npx prisma migrate reset

# Apply migrations manually
npx prisma db push --force-reset

# Generate Prisma client
npx prisma generate

# Seed database
npm run db:seed
```

### 3. Authentication Problems

#### Problem: NextAuth.js session issues

**Symptoms:**
- Users can't log in
- Session expires immediately
- Redirect loops

**Solutions:**

```bash
# Check NEXTAUTH_SECRET
echo $NEXTAUTH_SECRET
# Should be at least 32 characters

# Generate new secret if needed
openssl rand -base64 32

# Check NEXTAUTH_URL
echo $NEXTAUTH_URL
# Should match your domain (http://localhost:3000 for dev)

# Clear browser cookies and localStorage
# In browser console:
localStorage.clear()
# Then clear cookies for localhost:3000
```

**Check NextAuth configuration:**

```typescript
// pages/api/auth/[...nextauth].ts
import { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  // Verify these settings
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  }
}
```

### 4. API Route Errors

#### Problem: 500 Internal Server Error

**Symptoms:**
- API endpoints returning 500 errors
- No specific error message
- Server crashes

**Debugging Steps:**

```bash
# Check server logs
npm run dev
# Look for error messages in terminal

# Test API endpoint directly
curl -X GET http://localhost:3000/api/employees \
  -H "Content-Type: application/json"

# Check database connection in API route
curl -X GET http://localhost:3000/api/health
```

**Common API Route Issues:**

```typescript
// app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Add proper error handling
    const employees = await prisma.employee.findMany({
      where: { aktif: true },
      select: {
        id: true,
        nama: true,
        nik: true,
        jabatan: true,
        site: true
      }
    })

    return NextResponse.json({
      success: true,
      data: employees
    })
  } catch (error) {
    console.error('API Error:', error)
    
    // Return detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          stack: error.stack 
        },
        { status: 500 }
      )
    }
    
    // Generic error in production
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

#### Problem: CORS errors

**Symptoms:**
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**Solutions:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  const response = NextResponse.next()
  
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

### 5. Frontend Issues

#### Problem: Hydration errors

**Symptoms:**
```
Warning: Text content did not match. Server: "..." Client: "..."
Error: Hydration failed because the initial UI does not match what was rendered on the server
```

**Solutions:**

```typescript
// Use dynamic imports for client-only components
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('@/components/ClientOnlyComponent'),
  { ssr: false }
)

// Or use useEffect for client-side only code
import { useEffect, useState } from 'react'

function MyComponent() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return <div>Loading...</div>
  }
  
  return (
    <div>
      {/* Client-side only content */}
    </div>
  )
}
```

#### Problem: Component not updating

**Symptoms:**
- Data changes but UI doesn't update
- Stale data displayed
- Form values not updating

**Solutions:**

```typescript
// Check React Query cache invalidation
import { useQueryClient } from '@tanstack/react-query'

function MyComponent() {
  const queryClient = useQueryClient()
  
  const handleUpdate = async () => {
    // Update data
    await updateEmployee(data)
    
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['employees'] })
    
    // Or update cache directly
    queryClient.setQueryData(['employees'], (oldData) => {
      // Update logic here
      return newData
    })
  }
}

// Check component re-rendering
import { useCallback, useMemo } from 'react'

function OptimizedComponent({ data }) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, processed: true }))
  }, [data])
  
  // Memoize callbacks
  const handleClick = useCallback((id) => {
    // Handle click
  }, [])
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  )
}
```

### 6. Build & Deployment Issues

#### Problem: Build failures

**Symptoms:**
```
Type error: Property 'xxx' does not exist on type 'yyy'
Error: Failed to compile
```

**Solutions:**

```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix type errors
# Check types/index.ts for missing type definitions

# Clear Next.js cache
rm -rf .next
npm run build

# Check for unused imports
npx eslint . --fix

# Update dependencies
npm update
npm audit fix
```

#### Problem: Production deployment issues

**Symptoms:**
- App works in development but fails in production
- Environment variables not loaded
- Database connection fails

**Solutions:**

```bash
# Test production build locally
npm run build
npm run start

# Check production environment variables
echo $NODE_ENV
echo $DATABASE_URL
echo $NEXTAUTH_SECRET

# Verify database migrations in production
npx prisma migrate deploy
npx prisma generate

# Check Docker build (if using Docker)
docker build -t coaltools .
docker run -p 3000:3000 coaltools
```

### 7. Performance Issues

#### Problem: Slow page loads

**Symptoms:**
- Pages take long to load
- High Time to First Byte (TTFB)
- Poor Lighthouse scores

**Debugging:**

```bash
# Analyze bundle size
npm run analyze

# Check for large dependencies
npx webpack-bundle-analyzer .next/static/chunks/*.js

# Profile React components
# Add ?profiler=true to URL in development

# Check database query performance
# Enable Prisma query logging
```

**Solutions:**

```typescript
// Implement code splitting
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { 
    loading: () => <p>Loading...</p>,
    ssr: false 
  }
)

// Optimize images
import Image from 'next/image'

function OptimizedImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={500}
      height={300}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    />
  )
}

// Implement pagination
function EmployeeList() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['employees', page],
    queryFn: () => fetchEmployees({ page, limit: 20 })
  })
  
  return (
    <div>
      {/* Render paginated data */}
    </div>
  )
}
```

## 🔍 Debugging Tools & Techniques

### 1. Browser Developer Tools

**Console Debugging:**
```javascript
// Add debug logs
console.log('Debug:', { data, error, state })

// Use console.table for arrays
console.table(employees)

// Use console.time for performance
console.time('API Call')
await fetchData()
console.timeEnd('API Call')

// Use debugger statement
function problematicFunction() {
  debugger; // Execution will pause here
  // Your code
}
```

**Network Tab:**
- Check API request/response
- Verify request headers
- Check response status codes
- Monitor request timing

**React Developer Tools:**
- Inspect component props and state
- Check component re-renders
- Profile component performance

### 2. Server-Side Debugging

**Logging:**
```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ] : [])
  ]
})

// Usage in API routes
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    logger.info('Fetching employees', { 
      url: request.url,
      method: request.method 
    })
    
    const employees = await prisma.employee.findMany()
    
    logger.info('Successfully fetched employees', { 
      count: employees.length 
    })
    
    return NextResponse.json({ success: true, data: employees })
  } catch (error) {
    logger.error('Failed to fetch employees', { 
      error: error.message,
      stack: error.stack 
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

### 3. Database Debugging

**Prisma Query Logging:**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  
  // Log slow queries
  prisma.$on('query', (e) => {
    if (e.duration > 100) {
      console.warn('Slow Query:', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`
      })
    }
  })
  
  prisma.$on('error', (e) => {
    console.error('Prisma Error:', e)
  })
}
```

**Database Query Analysis:**
```sql
-- Check slow queries (PostgreSQL)
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 🚨 Emergency Procedures

### 1. Application Down

**Immediate Actions:**
1. Check server status
2. Verify database connectivity
3. Check recent deployments
4. Review error logs
5. Implement rollback if necessary

**Rollback Procedure:**
```bash
# Git rollback
git log --oneline -10
git revert <commit-hash>
git push origin main

# Database rollback (if needed)
npx prisma migrate reset
npx prisma db push

# Docker rollback
docker pull coaltools:previous-tag
docker stop coaltools-current
docker run -d --name coaltools-rollback coaltools:previous-tag
```

### 2. Database Corruption

**Recovery Steps:**
```bash
# Stop application
docker stop coaltools

# Restore from backup
psql -U postgres -d coaltools < backup_latest.sql

# Verify data integrity
psql -U postgres -d coaltools -c "SELECT COUNT(*) FROM \"Employee\";"

# Restart application
docker start coaltools
```

### 3. Security Incident

**Immediate Response:**
1. Change all passwords and API keys
2. Revoke all active sessions
3. Review access logs
4. Update security configurations
5. Notify relevant stakeholders

```bash
# Generate new secrets
openssl rand -base64 32  # New NEXTAUTH_SECRET
openssl rand -base64 32  # New JWT_SECRET

# Update environment variables
# Restart all services

# Check for suspicious activity
grep -i "failed\|error\|unauthorized" logs/combined.log
```

## 📞 Getting Help

### 1. Log Collection

**Collect relevant logs:**
```bash
# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# System logs (macOS)
log show --predicate 'process == "node"' --last 1h

# Database logs
tail -f /usr/local/var/log/postgresql@14.log

# Docker logs
docker logs coaltools --tail 100
```

### 2. System Information

**Gather system info:**
```bash
# Node.js and npm versions
node --version
npm --version

# System information
uname -a
df -h
free -m

# Database version
psql --version

# Docker information
docker --version
docker system info
```

### 3. Create Issue Report

**Include in your report:**
- Detailed description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces
- System information
- Recent changes made
- Screenshots (if applicable)

---

## 📋 Quick Reference

### Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev  # Run migrations
npx prisma db push   # Push schema changes
npx prisma generate  # Generate Prisma client

# Debugging
npm run analyze      # Analyze bundle size
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

### Environment Variables Checklist
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=...
```

### Port Usage
- **3000**: Next.js development server
- **5432**: PostgreSQL database
- **5555**: Prisma Studio
- **8888/8889**: Bundle analyzer

---

*Jika masalah masih berlanjut setelah mengikuti panduan ini, silakan hubungi tim development dengan informasi lengkap tentang masalah yang dihadapi.*