# 🚨 Cloudflare Pages Build Directory Error Fix

## Problem Identified

The error shows:
```
Error: Cannot find cwd: /opt/buildhome/repo/Users/atikadewisuryani/Desktop/test_app
```

This happens because Cloudflare Pages is trying to use your local path instead of the repository root.

## ✅ Solution Applied

### 1. Updated Package.json
- **Added:** `"build:pages": "npm run build:cloudflare"`
- **Purpose:** Standard build script for Cloudflare Pages

### 2. Simplified Cloudflare Configuration
- **File:** `.cloudflare/pages.json`
- **Build command:** `npm run build:pages`
- **Output directory:** `.next`

### 3. Verified Node.js Version
- **File:** `.nvmrc` contains `18`

## 🔧 Manual Steps Required

### Step 1: Update Cloudflare Pages Settings

Go to your Cloudflare Pages dashboard and set:

**Build & Deploy Settings:**
```
Framework preset: Next.js
Build command: npm run build:pages
Build output directory: .next
Node.js version: 18.x
Root directory: (leave empty - use repository root)
```

### Step 2: Alternative Build Commands to Try

If the above doesn't work, try these build commands in order:

1. **Option 1:** `npm run build:pages`
2. **Option 2:** `npm run build:cloudflare`
3. **Option 3:** `npm run build`
4. **Option 4:** `prisma generate && next build`

### Step 3: Check Root Directory

Make sure **Root directory** is set to:
- ✅ **Empty** (use repository root)
- ❌ NOT `/Users/atikadewisuryani/Desktop/test_app`
- ❌ NOT any local path

### Step 4: Environment Variables

Set these environment variables:
```
NODE_ENV = production
DATABASE_URL = your_database_url
NEXTAUTH_SECRET = your_secret
NEXTAUTH_URL = https://your-domain.pages.dev
```

## 🎯 Expected Build Process

After the fix, your build should show:
```
✅ Cloning repository
✅ Installing dependencies
✅ Running: npm run build:pages
✅ Generating Prisma client
✅ Building Next.js application
✅ Deploying to Cloudflare Pages
```

## 🚫 What NOT to Do

- ❌ Don't set root directory to a local path
- ❌ Don't use `npx wrangler deploy`
- ❌ Don't set framework preset to "None"

## ✅ What TO Do

- ✅ Use repository root as root directory
- ✅ Set framework preset to "Next.js"
- ✅ Use `npm run build:pages` as build command
- ✅ Set Node.js version to 18.x

## 🔍 Troubleshooting

### If still getting directory errors:

1. **Check Root Directory Setting**
   - Should be empty or `/`
   - NOT your local path

2. **Try Different Build Commands**
   - `npm run build:pages`
   - `npm run build:cloudflare`
   - `npm run build`

3. **Verify Repository Structure**
   - `package.json` should be in root
   - `next.config.ts` should be in root
   - `.nvmrc` should be in root

---

**The fix is now applied. Update your Cloudflare Pages settings and try the different build commands!** 🚀
