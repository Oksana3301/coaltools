# Firebase Deployment Guide with Supabase Integration

## Overview

This guide explains how to deploy your Coal Tools application to Firebase Hosting while keeping Supabase as your database. This setup gives you the best of both worlds: Firebase's hosting and functions with Supabase's powerful PostgreSQL database.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Firebase      │    │   Supabase      │
│   Hosting       │    │   Functions     │    │   Database      │
│                 │    │                 │    │                 │
│ • Static Files  │◄──►│ • API Routes    │◄──►│ • PostgreSQL    │
│ • Frontend      │    │ • Next.js SSR   │    │ • RLS Policies  │
│ • CDN           │    │ • Server Logic  │    │ • Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### 1. Firebase CLI Installation
```bash
npm install -g firebase-tools
```

### 2. Firebase Login
```bash
firebase login
```

### 3. Firebase Project Setup
```bash
firebase init hosting
firebase init functions
```

### 4. Environment Variables
Ensure your `.env.local` file contains:
```env
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-project.web.app"
```

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

Use the provided deployment script:

```bash
./scripts/deploy-to-firebase.sh
```

This script will:
- ✅ Check prerequisites
- ✅ Build Next.js application
- ✅ Build Firebase Functions
- ✅ Deploy to Firebase
- ✅ Verify deployment

### Option 2: Manual Deployment

#### Step 1: Build the Application
```bash
npm run build
```

#### Step 2: Build Firebase Functions
```bash
cd functions
npm install
npm run build
cd ..
```

#### Step 3: Deploy to Firebase
```bash
firebase deploy
```

## Configuration Files

### 1. `firebase.json`
```json
{
  "hosting": {
    "public": "public",
    "rewrites": [
      {
        "source": "**",
        "function": "nextjs"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### 2. `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@prisma/client'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};
```

### 3. `functions/src/index.ts`
```typescript
import * as functions from 'firebase-functions';
import next from 'next';

const app = next({ dev: false, hostname: 'localhost', port: 3000 });
const handle = app.getRequestHandler();

export const nextjs = functions.https.onRequest(async (req, res) => {
  const parsedUrl = parse(req.url!, true);
  await handle(req, res, parsedUrl);
});
```

## Environment Variables

### Firebase Functions Environment
Set these in Firebase Console > Functions > Configuration:

```bash
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-project.web.app
```

### Local Development
Use `.env.local`:
```env
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Testing Deployment

### 1. Check Firebase Functions
```bash
firebase functions:log
```

### 2. Test API Endpoints
```bash
curl https://your-project.web.app/api/employees
curl https://your-project.web.app/api/payroll
```

### 3. Test Frontend
Visit: `https://your-project.web.app`

## Troubleshooting

### Common Issues

#### 1. "Function not found" Error
```bash
# Rebuild and redeploy functions
cd functions
npm run build
cd ..
firebase deploy --only functions
```

#### 2. Database Connection Issues
- Check `DATABASE_URL` in Firebase Functions configuration
- Verify Supabase project is active
- Check RLS policies are applied

#### 3. Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf functions/lib
npm run build
cd functions && npm run build && cd ..
```

#### 4. Environment Variables Not Loading
```bash
# Set environment variables in Firebase Console
firebase functions:config:set database.url="your-database-url"
firebase deploy --only functions
```

### Debugging Commands

```bash
# View function logs
firebase functions:log

# Test functions locally
firebase emulators:start

# Check deployment status
firebase projects:list
firebase hosting:channel:list
```

## Performance Optimization

### 1. Caching Headers
Firebase automatically caches static assets. Custom headers are configured in `firebase.json`.

### 2. CDN Benefits
Firebase Hosting provides global CDN for fast loading worldwide.

### 3. Function Optimization
- Use connection pooling for database connections
- Implement proper error handling
- Monitor function execution times

## Security Considerations

### 1. Environment Variables
- Never commit sensitive data to version control
- Use Firebase Functions configuration for production secrets
- Rotate secrets regularly

### 2. Database Security
- RLS policies are already configured in Supabase
- Use connection pooling
- Monitor database access logs

### 3. API Security
- Implement proper authentication
- Use HTTPS for all communications
- Validate input data

## Monitoring and Maintenance

### 1. Firebase Console
- Monitor function execution times
- Check error rates
- View usage statistics

### 2. Supabase Dashboard
- Monitor database performance
- Check RLS policy effectiveness
- Review access logs

### 3. Application Monitoring
- Set up error tracking
- Monitor API response times
- Track user interactions

## Cost Optimization

### 1. Firebase Functions
- Monitor function invocations
- Optimize cold start times
- Use appropriate memory allocation

### 2. Supabase Database
- Monitor query performance
- Use connection pooling
- Implement proper indexing

### 3. Hosting
- Optimize bundle sizes
- Use efficient caching strategies
- Minimize static asset sizes

## Support

If you encounter issues:

1. **Check Firebase Console** for function logs and errors
2. **Verify Supabase Connection** in the dashboard
3. **Test Locally** using Firebase emulators
4. **Review Environment Variables** in both local and production
5. **Check RLS Policies** are properly applied

---

**Status**: ✅ **Ready for Deployment**
**Last Updated**: August 27, 2025
**Version**: 1.0
