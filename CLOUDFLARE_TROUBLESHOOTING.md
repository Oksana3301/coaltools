# 🔧 Cloudflare Pages Troubleshooting Guide

## Common Build Issues & Solutions

### Issue 1: "Failed to install dependencies"

**Symptoms:**
- Build fails during `npm install`
- Error messages about missing packages
- Timeout during dependency installation

**Solutions:**

1. **Clear npm cache locally and test:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Update package.json with exact versions:**
   - Use exact versions instead of ranges
   - Remove any conflicting dependencies

3. **Check Node.js version compatibility:**
   - Ensure Node.js 18+ is specified
   - Add `.nvmrc` file with version 18

### Issue 2: "Prisma client generation failed"

**Symptoms:**
- Build fails during Prisma client generation
- Database connection errors during build

**Solutions:**

1. **Add postinstall script:**
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate"
     }
   }
   ```

2. **Update build command:**
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build"
     }
   }
   ```

3. **Configure Prisma for edge runtime:**
   ```typescript
   // next.config.ts
   experimental: {
     serverComponentsExternalPackages: ['@prisma/client'],
   }
   ```

### Issue 3: "Build timeout"

**Symptoms:**
- Build takes too long and times out
- Memory issues during build

**Solutions:**

1. **Optimize build process:**
   - Remove unnecessary dependencies
   - Use smaller package versions
   - Enable build caching

2. **Split build into smaller steps:**
   - Separate Prisma generation
   - Use incremental builds

### Issue 4: "Environment variables not found"

**Symptoms:**
- Build fails with missing environment variables
- Database connection errors

**Solutions:**

1. **Set all required environment variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=your_database_url
   NEXTAUTH_SECRET=your_secret
   NEXTAUTH_URL=https://mycoaltools.online
   ```

2. **Check variable names:**
   - Ensure exact spelling
   - Check for extra spaces
   - Verify environment selection (Production)

## Build Configuration Checklist

### ✅ Package.json Requirements:
- [ ] All dependencies have compatible versions
- [ ] Node.js version specified (>=18)
- [ ] Build script includes Prisma generation
- [ ] Postinstall script for Prisma
- [ ] No conflicting dependencies

### ✅ Next.js Configuration:
- [ ] ESLint disabled for builds
- [ ] TypeScript errors ignored
- [ ] Prisma client externalized
- [ ] Server components configured

### ✅ Environment Variables:
- [ ] NODE_ENV=production
- [ ] DATABASE_URL set correctly
- [ ] NEXTAUTH_SECRET generated
- [ ] NEXTAUTH_URL matches domain

### ✅ Cloudflare Pages Settings:
- [ ] Framework preset: Next.js
- [ ] Build command: npm run build
- [ ] Build output directory: .next
- [ ] Node.js version: 18.x

## Step-by-Step Fix Process

### Step 1: Test Locally
```bash
# Clear everything
rm -rf node_modules package-lock.json .next

# Fresh install
npm install

# Test build
npm run build

# Test start
npm start
```

### Step 2: Update Cloudflare Settings
1. Go to your Pages project
2. Settings → Build & deployments
3. Update build settings:
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Node.js version: `18`

### Step 3: Set Environment Variables
1. Settings → Environment variables
2. Add all required variables
3. Set environment to "Production"
4. Mark sensitive variables as "Encrypted"

### Step 4: Redeploy
1. Go to Deployments tab
2. Click "Redeploy"
3. Monitor build logs
4. Check for specific error messages

## Common Error Messages & Fixes

### "Cannot find module '@prisma/client'"
**Fix:** Add `prisma generate` to build script

### "Module not found: Can't resolve 'bcryptjs'"
**Fix:** Ensure bcryptjs is in dependencies, not devDependencies

### "Build exceeded maximum time limit"
**Fix:** Optimize dependencies, remove unused packages

### "Environment variable not found"
**Fix:** Check spelling and environment selection

### "Database connection failed"
**Fix:** Verify DATABASE_URL and database accessibility

## Alternative Deployment Options

If Cloudflare Pages continues to fail:

### Option 1: Vercel
- Better Next.js support
- Automatic deployments
- Free tier available

### Option 2: Netlify
- Good for static sites
- Easy configuration
- Free tier available

### Option 3: Railway
- Full-stack deployment
- Database included
- Pay-as-you-go pricing

## Support Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment

## Emergency Fixes

### Quick Fix 1: Remove Prisma from Build
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

### Quick Fix 2: Use Static Export
```typescript
// next.config.ts
const nextConfig = {
  output: 'export',
  trailingSlash: true,
}
```

### Quick Fix 3: Disable Database Features
- Comment out database-dependent code
- Use localStorage fallbacks
- Deploy without database features

---

**Remember:** Always test locally before deploying!
