# Panduan Troubleshooting CoalTools

## Daftar Isi
- [Error Console Logs](#error-console-logs)
- [Database Connection Issues](#database-connection-issues)
- [Development Server Issues](#development-server-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Performance Issues](#performance-issues)

## Error Console Logs

### 1. API Health Endpoint Error
**Error:** `net::ERR_ABORTED http://localhost:3000/api/health`

**Penyebab:**
- API route dikonfigurasi sebagai `force-static` padahal membutuhkan akses database real-time
- Database connection tidak tersedia

**Solusi:**
```typescript
// Di file app/api/health/route.ts
export const dynamic = "force-dynamic" // Bukan "force-static"
```

### 2. Database Status Check Error
**Error:** `Database status check error: TypeError: Failed to fetch`

**Penyebab:**
- Health check endpoint gagal
- Database tidak tersedia dalam mode development

**Solusi:**
1. Pastikan health endpoint berjalan dengan benar
2. Untuk mode offline, gunakan mock response dalam OfflinePayrollCalculator

### 3. Syntax Error - Invalid Token
**Error:** `SyntaxError: Invalid or unexpected token`

**Penyebab:**
- Konflik dalam override fetch function
- Error handling tidak memadai dalam useEffect

**Solusi:**
```typescript
// Tambahkan error handling dalam useEffect
try {
  // Override fetch logic
  window.fetch = async (input, init) => {
    try {
      // Implementation
    } catch (error) {
      console.warn('Mock fetch error:', error)
      return originalFetch(input, init)
    }
  }
} catch (error) {
  console.error('Error setting up offline mode:', error)
}
```

## Database Connection Issues

### 1. Prisma Connection Error
**Error:** `Can't reach database server`

**Solusi untuk Development:**
```bash
# 1. Comment out DATABASE_URL di .env.local
# DATABASE_URL="your-database-url"

# 2. Tambahkan mode development
DEVELOPMENT_MODE="offline"
NODE_ENV="development"
```

**Solusi untuk Production:**
1. Pastikan database server berjalan
2. Verifikasi connection string
3. Check firewall dan network access

### 2. Prisma Client Initialization Error
**Error:** `PrismaClientInitializationError`

**Solusi:**
```typescript
// Gunakan safe client creation
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. PrismaClient will not be initialized.')
    return null
  }
  
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  } catch (error) {
    console.error('Failed to create PrismaClient:', error)
    return null
  }
}
```

## Development Server Issues

### 1. Server Won't Start
**Kemungkinan Penyebab:**
- Port 3000 sudah digunakan
- Node modules corrupt
- Environment variables tidak valid

**Solusi:**
```bash
# 1. Kill process di port 3000
lsof -ti:3000 | xargs kill -9

# 2. Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install

# 3. Start server
npm run dev
```

### 2. Hot Reload Tidak Bekerja
**Solusi:**
```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}
```

### 3. Memory Issues
**Error:** `JavaScript heap out of memory`

**Solusi:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

## Build & Deployment Issues

### 1. Build Failures
**Error:** `Build failed with errors`

**Checklist:**
- [ ] Semua TypeScript errors resolved
- [ ] Environment variables tersedia
- [ ] Database schema up to date
- [ ] No unused imports

**Solusi:**
```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint check
npm run lint

# 3. Clean build
rm -rf .next
npm run build
```

### 2. Deployment Issues
**Vercel Deployment Errors:**

1. **Environment Variables:**
   - Set semua required env vars di Vercel dashboard
   - Pastikan DATABASE_URL valid untuk production

2. **Build Timeout:**
   ```json
   // vercel.json
   {
     "builds": [{
       "src": "package.json",
       "use": "@vercel/next",
       "config": {
         "maxLambdaSize": "50mb"
       }
     }]
   }
   ```

## Performance Issues

### 1. Slow Page Load
**Optimisasi:**
```typescript
// 1. Lazy loading components
const PayrollCalculator = dynamic(() => import('./PayrollCalculator'), {
  loading: () => <div>Loading...</div>
})

// 2. Optimize images
import Image from 'next/image'

// 3. Code splitting
const AdminPanel = dynamic(() => import('./AdminPanel'), {
  ssr: false
})
```

### 2. Bundle Size Issues
**Analisis:**
```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

**Optimisasi:**
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}
```

## Debugging Tools

### 1. Console Debugging
```typescript
// Enable detailed logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { data, error, status })
}
```

### 2. Network Debugging
```typescript
// Log all fetch requests
const originalFetch = window.fetch
window.fetch = async (...args) => {
  console.log('Fetch:', args[0])
  const response = await originalFetch(...args)
  console.log('Response:', response.status)
  return response
}
```

### 3. React DevTools
- Install React Developer Tools browser extension
- Use Profiler untuk performance analysis
- Check component re-renders

## Langkah Troubleshooting Umum

1. **Check Console Errors**
   - Buka Developer Tools (F12)
   - Periksa Console tab untuk errors
   - Periksa Network tab untuk failed requests

2. **Restart Development Server**
   ```bash
   # Stop server (Ctrl+C)
   # Clear cache
   rm -rf .next
   # Restart
   npm run dev
   ```

3. **Check Environment Variables**
   ```bash
   # Verify .env.local exists dan valid
   cat .env.local
   ```

4. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

5. **Clear All Caches**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Clear npm cache
   npm cache clean --force
   
   # Clear browser cache (hard refresh)
   # Ctrl+Shift+R atau Cmd+Shift+R
   ```

## Kontak Support

Jika masalah masih berlanjut:

1. **GitHub Issues:** Buat issue baru dengan:
   - Deskripsi masalah
   - Steps to reproduce
   - Error messages
   - Environment info (OS, Node version, dll)

2. **Development Team:**
   - Email: support@coaltools.dev
   - Slack: #coaltools-support

3. **Documentation:**
   - [API Documentation](./API_DOCUMENTATION.md)
   - [Deployment Guide](./DEPLOYMENT_GUIDE.md)
   - [Maintenance Guide](./MAINTENANCE_GUIDE.md)

---

**Catatan:** Selalu backup data sebelum melakukan troubleshooting yang melibatkan perubahan database atau konfigurasi production.