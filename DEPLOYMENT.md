# 🚀 Cloudflare Pages Deployment Guide

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain**: `mycoaltools.online` (purchased from Rumah Web)
3. **GitHub Repository**: [https://github.com/Oksana3301/coaltools](https://github.com/Oksana3301/coaltools)

## Step 1: Connect GitHub Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Create a project**
3. Choose **Connect to Git**
4. Select your GitHub account and the `coaltools` repository
5. Click **Begin setup**

## Step 2: Configure Build Settings

### Build Configuration:
- **Project name**: `mycoaltools`
- **Production branch**: `main`
- **Framework preset**: `Next.js`
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (leave empty)

### Environment Variables:
Add these environment variables in the Cloudflare Pages settings:

```
NODE_ENV=production
DATABASE_URL=your_database_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://mycoaltools.online
```

## Step 3: Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete (usually 2-5 minutes)
3. Your site will be available at: `https://mycoaltools.pages.dev`

## Step 4: Configure Custom Domain

1. In your Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `mycoaltools.online`
4. Click **Continue**
5. The domain will be automatically configured

## Step 5: Database Setup

Since this is a full-stack application with database features, you'll need to:

1. **Set up a production database** (Supabase, PlanetScale, or similar)
2. **Update environment variables** with production database URL
3. **Run database migrations**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Authentication secret key | `your-secret-key-here` |
| `NEXTAUTH_URL` | Your domain URL | `https://mycoaltools.online` |

## Troubleshooting

### Build Errors
- Check the build logs in Cloudflare Pages
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure database is accessible from Cloudflare's servers
- Check if database requires SSL connections

### Domain Issues
- Ensure DNS is properly configured
- Check if domain is pointing to Cloudflare nameservers
- Verify SSL certificate is active

## Post-Deployment

1. **Test all features**:
   - Authentication system
   - Coal Tools functionality
   - PDF generation
   - Database operations

2. **Monitor performance**:
   - Use Cloudflare Analytics
   - Check build times
   - Monitor error rates

3. **Set up monitoring**:
   - Enable error tracking
   - Set up uptime monitoring
   - Configure alerts

## Support

If you encounter issues:
1. Check Cloudflare Pages documentation
2. Review build logs
3. Verify environment variables
4. Test locally with production settings

---

**Your application will be live at**: `https://mycoaltools.online`
