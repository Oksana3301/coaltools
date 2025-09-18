# 🔧 Panduan Maintenance CoalTools

## 🎯 Overview
Panduan lengkap untuk maintenance rutin aplikasi CoalTools guna memastikan performa optimal dan keamanan sistem.

## 📅 Jadwal Maintenance

### Harian (Daily)
- [ ] Monitor system resources (CPU, Memory, Disk)
- [ ] Check application logs untuk errors
- [ ] Verify backup completion
- [ ] Monitor database performance

### Mingguan (Weekly)
- [ ] Review security logs
- [ ] Update dependencies (security patches)
- [ ] Clean up temporary files
- [ ] Database performance tuning
- [ ] Review user activity logs

### Bulanan (Monthly)
- [ ] Full system backup verification
- [ ] Security audit
- [ ] Performance optimization
- [ ] Update documentation
- [ ] Review and rotate logs

### Triwulan (Quarterly)
- [ ] Major dependency updates
- [ ] Security penetration testing
- [ ] Disaster recovery testing
- [ ] Performance benchmarking
- [ ] Code quality review

## 🗄️ Database Maintenance

### 1. Daily Database Tasks

```bash
#!/bin/bash
# daily-db-maintenance.sh

echo "📊 Starting daily database maintenance..."

# Check database connections
echo "🔍 Checking active connections..."
sudo -u postgres psql -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"

# Check database size
echo "📏 Checking database size..."
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('coaltools_prod')) as database_size;"

# Check for long-running queries
echo "⏱️ Checking long-running queries..."
sudo -u postgres psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"

# Update table statistics
echo "📈 Updating table statistics..."
sudo -u postgres psql coaltools_prod -c "ANALYZE;"

echo "✅ Daily database maintenance completed!"
```

### 2. Weekly Database Tasks

```bash
#!/bin/bash
# weekly-db-maintenance.sh

echo "🗄️ Starting weekly database maintenance..."

# Vacuum analyze all tables
echo "🧹 Running VACUUM ANALYZE..."
sudo -u postgres psql coaltools_prod -c "VACUUM ANALYZE;"

# Check for bloated tables
echo "🔍 Checking for table bloat..."
sudo -u postgres psql coaltools_prod -c "
SELECT 
  schemaname, 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Check index usage
echo "📊 Checking index usage..."
sudo -u postgres psql coaltools_prod -c "
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan ASC;
"

echo "✅ Weekly database maintenance completed!"
```

### 3. Monthly Database Tasks

```bash
#!/bin/bash
# monthly-db-maintenance.sh

echo "🗄️ Starting monthly database maintenance..."

# Full database backup
echo "💾 Creating full database backup..."
BACKUP_FILE="coaltools_full_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -U coaltools_user -h localhost coaltools_prod > "/backups/$BACKUP_FILE"
gzip "/backups/$BACKUP_FILE"

# Reindex database
echo "🔄 Reindexing database..."
sudo -u postgres psql coaltools_prod -c "REINDEX DATABASE coaltools_prod;"

# Clean up old data (older than 2 years)
echo "🧹 Cleaning up old data..."
sudo -u postgres psql coaltools_prod -c "
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';
DELETE FROM session_logs WHERE created_at < NOW() - INTERVAL '6 months';
"

# Update database statistics
echo "📊 Updating database statistics..."
sudo -u postgres psql coaltools_prod -c "ANALYZE;"

echo "✅ Monthly database maintenance completed!"
```

## 🖥️ System Maintenance

### 1. System Resource Monitoring

```bash
#!/bin/bash
# system-monitor.sh

echo "🖥️ System Resource Report - $(date)"
echo "==========================================="

# CPU Usage
echo "💻 CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5}'

# Memory Usage
echo "🧠 Memory Usage:"
free -h

# Disk Usage
echo "💾 Disk Usage:"
df -h

# Network Connections
echo "🌐 Network Connections:"
netstat -tuln | grep LISTEN

# Process Status
echo "⚙️ CoalTools Process Status:"
pm2 status

# Database Connections
echo "🗄️ Database Connections:"
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

echo "==========================================="
```

### 2. Log Management

```bash
#!/bin/bash
# log-management.sh

echo "📝 Starting log management..."

# Rotate PM2 logs
echo "🔄 Rotating PM2 logs..."
pm2 flush

# Compress old logs
echo "🗜️ Compressing old logs..."
find /var/log -name "*.log" -mtime +7 -exec gzip {} \;

# Clean up old compressed logs (older than 30 days)
echo "🧹 Cleaning up old logs..."
find /var/log -name "*.gz" -mtime +30 -delete

# Clean up application logs
echo "🧹 Cleaning up application logs..."
find ./logs -name "*.log" -mtime +14 -delete

echo "✅ Log management completed!"
```

### 3. Security Updates

```bash
#!/bin/bash
# security-updates.sh

echo "🔒 Starting security updates..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Update Node.js dependencies
echo "📦 Checking for security vulnerabilities..."
npm audit

# Fix vulnerabilities if any
echo "🔧 Fixing vulnerabilities..."
npm audit fix

# Update global packages
echo "🌐 Updating global packages..."
npm update -g

# Restart services if needed
echo "🔄 Restarting services..."
sudo systemctl restart nginx
pm2 restart coaltools

echo "✅ Security updates completed!"
```

## 📊 Performance Monitoring

### 1. Application Performance

```bash
#!/bin/bash
# performance-monitor.sh

echo "📊 Performance Monitoring Report - $(date)"
echo "============================================"

# PM2 Process Information
echo "⚙️ PM2 Process Status:"
pm2 jlist | jq '.[] | {name: .name, status: .pm2_env.status, cpu: .monit.cpu, memory: .monit.memory}'

# Response Time Check
echo "⏱️ Response Time Check:"
curl -o /dev/null -s -w "Response Time: %{time_total}s\nHTTP Code: %{http_code}\n" http://localhost:3000/api/health

# Database Performance
echo "🗄️ Database Performance:"
sudo -u postgres psql coaltools_prod -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 5;
"

echo "============================================"
```

### 2. Database Performance Tuning

```sql
-- performance-queries.sql

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  (total_time/calls) as avg_time
FROM pg_stat_statements 
WHERE calls > 100
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check cache hit ratio
SELECT 
  'cache hit rate' as metric,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as percentage
FROM pg_statio_user_tables;
```

## 🔐 Security Maintenance

### 1. Security Audit Script

```bash
#!/bin/bash
# security-audit.sh

echo "🔒 Starting security audit..."

# Check for failed login attempts
echo "🔍 Checking failed login attempts..."
sudo grep "Failed password" /var/log/auth.log | tail -10

# Check open ports
echo "🌐 Checking open ports..."
nmap -sT -O localhost

# Check file permissions
echo "📁 Checking critical file permissions..."
ls -la /etc/passwd /etc/shadow /etc/group

# Check for SUID files
echo "🔍 Checking for SUID files..."
find / -perm -4000 -type f 2>/dev/null

# Check SSL certificate expiry
echo "🔒 Checking SSL certificate expiry..."
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates

echo "✅ Security audit completed!"
```

### 2. Backup Verification

```bash
#!/bin/bash
# backup-verification.sh

echo "💾 Starting backup verification..."

# Check backup files
echo "📁 Checking backup files..."
ls -la /backups/ | tail -10

# Test database backup restore (on test database)
echo "🧪 Testing backup restore..."
LATEST_BACKUP=$(ls -t /backups/*.sql.gz | head -1)
echo "Testing restore of: $LATEST_BACKUP"

# Create test database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS coaltools_test_restore;"
sudo -u postgres psql -c "CREATE DATABASE coaltools_test_restore;"

# Restore backup to test database
gunzip -c "$LATEST_BACKUP" | sudo -u postgres psql coaltools_test_restore

# Verify restore
TABLE_COUNT=$(sudo -u postgres psql coaltools_test_restore -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Restored tables count: $TABLE_COUNT"

# Cleanup test database
sudo -u postgres psql -c "DROP DATABASE coaltools_test_restore;"

echo "✅ Backup verification completed!"
```

## 📈 Monitoring Dashboard

### 1. Health Check Endpoint

Pastikan endpoint `/api/health` tersedia:

```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check Redis connection (if using)
    // await redis.ping()
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      // redis: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    }
    
    res.status(200).json(healthStatus)
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
}
```

### 2. Monitoring Script

```bash
#!/bin/bash
# monitoring.sh

echo "📊 CoalTools Monitoring Dashboard"
echo "================================="
echo "Timestamp: $(date)"
echo ""

# Application Health
echo "🏥 Application Health:"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
echo "$HEALTH_RESPONSE" | jq .
echo ""

# System Resources
echo "🖥️ System Resources:"
echo "CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk: $(df -h / | awk 'NR==2{print $5}')"
echo ""

# Database Status
echo "🗄️ Database Status:"
DB_CONNECTIONS=$(sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity;")
echo "Active connections: $DB_CONNECTIONS"
echo ""

# Recent Errors
echo "🚨 Recent Errors (last 10):"
pm2 logs coaltools --lines 10 --err

echo "================================="
```

## 🚨 Emergency Procedures

### 1. Application Down

```bash
#!/bin/bash
# emergency-restart.sh

echo "🚨 Emergency Application Restart"
echo "==============================="

# Stop application
echo "⏹️ Stopping application..."
pm2 stop coaltools

# Clear logs
echo "🧹 Clearing logs..."
pm2 flush

# Restart application
echo "🚀 Restarting application..."
pm2 start coaltools

# Wait for startup
echo "⏳ Waiting for application to start..."
sleep 10

# Check health
echo "🏥 Checking application health..."
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

echo "==============================="
```

### 2. Database Recovery

```bash
#!/bin/bash
# database-recovery.sh

echo "🚨 Database Recovery Procedure"
echo "============================="

# Stop application
echo "⏹️ Stopping application..."
pm2 stop coaltools

# Backup current database
echo "💾 Creating emergency backup..."
EMERGENCY_BACKUP="emergency_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -U coaltools_user -h localhost coaltools_prod > "/backups/$EMERGENCY_BACKUP"

# Restore from latest backup
echo "🔄 Restoring from latest backup..."
LATEST_BACKUP=$(ls -t /backups/*.sql.gz | head -1)
echo "Restoring from: $LATEST_BACKUP"

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE coaltools_prod;"
sudo -u postgres psql -c "CREATE DATABASE coaltools_prod;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE coaltools_prod TO coaltools_user;"

# Restore backup
gunzip -c "$LATEST_BACKUP" | sudo -u postgres psql coaltools_prod

# Run migrations
echo "🗄️ Running migrations..."
npx prisma migrate deploy

# Start application
echo "🚀 Starting application..."
pm2 start coaltools

echo "============================="
```

## 📞 Contact & Support

### Emergency Contacts
- **System Administrator**: admin@coaltools.com
- **Database Administrator**: dba@coaltools.com
- **Security Team**: security@coaltools.com
- **On-call Support**: +62-xxx-xxx-xxxx

### Escalation Procedures
1. **Level 1**: Application restart, basic troubleshooting
2. **Level 2**: Database issues, performance problems
3. **Level 3**: Security incidents, data corruption
4. **Level 4**: Complete system failure, disaster recovery

---

**⚠️ Penting**: 
- Selalu dokumentasikan setiap maintenance yang dilakukan
- Lakukan testing setelah setiap perubahan
- Simpan backup sebelum melakukan maintenance major
- Monitor sistem selama 24 jam setelah maintenance