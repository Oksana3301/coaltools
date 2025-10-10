# 📋 Panduan Deployment dan Maintenance - CoalTools

## 🚀 Panduan Deployment

### Prasyarat
- Node.js 18+ 
- PostgreSQL database
- npm atau yarn package manager

### 1. Persiapan Environment

```bash
# Clone repository
git clone <repository-url>
cd coaltools

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

### 2. Konfigurasi Database

```bash
# Setup database URL di .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/coaltools"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial data (optional)
npx tsx scripts/create-demo-users.ts
```

### 3. Build dan Deploy

#### Development
```bash
npm run dev
```

#### Production Build
```bash
# Build aplikasi
npm run build

# Start production server
npm start
```

#### Deploy ke Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Deploy ke Platform Lain
```bash
# Build untuk production
npm run build

# Copy files yang diperlukan:
# - .next/
# - public/
# - package.json
# - prisma/
```

## 🔧 Maintenance Guide

### Database Maintenance

#### Backup Database
```bash
# PostgreSQL backup
pg_dump -h localhost -U username -d coaltools > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U username -d coaltools < backup_20241201.sql
```

#### Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Monitoring dan Logging

#### Health Check Endpoints
- `GET /api/health` - Status aplikasi dan database
- `GET /api/employees` - Test API functionality

#### Log Files
```bash
# Check application logs
tail -f logs/application.log

# Check error logs
tail -f logs/error.log
```

### Performance Optimization

#### Database Optimization
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Add indexes for frequently queried fields
CREATE INDEX idx_employees_nik ON employees(nik);
CREATE INDEX idx_employees_aktif ON employees(aktif);
```

#### Application Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for unused dependencies
npx depcheck
```

### Security Updates

#### Regular Security Checks
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

#### Environment Security
```bash
# Rotate secrets regularly
# Update NEXTAUTH_SECRET
# Update database passwords
# Update API keys
```

### Backup Strategy

#### Daily Backups
```bash
#!/bin/bash
# backup-daily.sh
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/coaltools"

# Database backup
pg_dump -h $DB_HOST -U $DB_USER -d coaltools > $BACKUP_DIR/db_$DATE.sql

# File backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /app/uploads

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

#### Weekly Full Backup
```bash
#!/bin/bash
# backup-weekly.sh
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/coaltools/weekly"

# Full application backup
tar -czf $BACKUP_DIR/full_backup_$DATE.tar.gz /app

# Keep only last 12 weeks
find $BACKUP_DIR -name "*.tar.gz" -mtime +84 -delete
```

### Troubleshooting

#### Common Issues

**Database Connection Issues**
```bash
# Test database connection
npx tsx test-db-connection-simple.js

# Check database status
psql -h localhost -U username -c "SELECT version();"
```

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

**Performance Issues**
```bash
# Check memory usage
ps aux | grep node

# Check disk space
df -h

# Monitor database connections
SELECT count(*) FROM pg_stat_activity;
```

### Monitoring Checklist

#### Daily Checks
- [ ] Application health check
- [ ] Database connectivity
- [ ] Error logs review
- [ ] Backup verification

#### Weekly Checks
- [ ] Performance metrics review
- [ ] Security updates check
- [ ] Database optimization
- [ ] Full backup verification

#### Monthly Checks
- [ ] Dependency updates
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation updates

### Contact Information

**Development Team:**
- Lead Developer: [email]
- Database Admin: [email]
- DevOps: [email]

**Emergency Contacts:**
- On-call Developer: [phone]
- System Administrator: [phone]

---

*Dokumen ini harus diperbarui setiap kali ada perubahan pada sistem atau proses deployment.*