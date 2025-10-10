# 🚀 Cloudflare Pages Deployment Guide

## Quick Fix for Build Failures

### Step 1: Update Cloudflare Pages Settings

1. Go to your Cloudflare Pages dashboard
2. Select your project
3. Go to **Settings** → **Build & deployments**
4. Update these settings:

```
Framework preset: Next.js
Build command: npm run build:cloudflare
Build output directory: .next
Node.js version: 18.x
```

### Step 2: Set Environment Variables

In **Settings** → **Environment variables**, add:

```
NODE_ENV = production
DATABASE_URL = your_supabase_database_url
NEXTAUTH_SECRET = your_generated_secret
NEXTAUTH_URL = https://your-domain.pages.dev
```

**Important:** Make sure to select "Production" environment for all variables.

### Step 3: Test Locally First

```bash
# Clear everything
rm -rf node_modules package-lock.json .next

# Fresh install
npm install

# Test the Cloudflare build
npm run build:cloudflare

# If successful, deploy
```

## Common Issues & Solutions

### Issue 1: "bcryptjs module not found"
**Solution:** The build script now handles this properly. If it still fails:

```bash
npm install bcryptjs@latest
```

### Issue 2: "Prisma client generation failed"
**Solution:** The new build script handles this step-by-step.

### Issue 3: "Build timeout"
**Solution:** 
- Use the optimized build script
- Ensure Node.js 18.x is selected
- Clear build cache in Cloudflare

### Issue 4: "Database connection failed"
**Solution:**
- Verify DATABASE_URL is correct
- Ensure database is accessible from Cloudflare
- Check if your database allows external connections

## Alternative Deployment Options

If Cloudflare Pages continues to fail:

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option 2: Railway
- Better for full-stack apps
- Includes database hosting
- Automatic deployments

### Option 3: Netlify
- Good for static sites
- May need modifications for dynamic features

## Environment Variables Checklist

✅ **Required Variables:**
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `NEXTAUTH_SECRET=your_secret`
- `NEXTAUTH_URL=https://your-domain.pages.dev`

✅ **Optional Variables:**
- `NEXT_PUBLIC_APP_URL=https://your-domain.pages.dev`

## Build Process

The new build process:
1. Generates Prisma client
2. Builds Next.js application
3. Handles errors gracefully
4. Provides detailed logging

## Monitoring

After deployment:
1. Check build logs for errors
2. Monitor application performance
3. Verify database connections
4. Test all features

## Support

If issues persist:
1. Check Cloudflare Pages documentation
2. Review build logs carefully
3. Consider switching to Vercel
4. Contact Cloudflare support

---

**Remember:** Always test locally before deploying!
