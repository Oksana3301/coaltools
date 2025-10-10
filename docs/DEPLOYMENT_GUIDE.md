# 📋 Panduan Deployment CoalTools

## 🎯 Overview
Panduan lengkap untuk deployment aplikasi CoalTools dari development hingga production environment.

## 📋 Prerequisites

### System Requirements
- Node.js 18.x atau lebih tinggi
- PostgreSQL 14.x atau lebih tinggi
- Redis 6.x atau lebih tinggi (untuk caching)
- PM2 (untuk production deployment)
- Nginx (untuk reverse proxy)

### Environment Variables
Buat file `.env.production` dengan konfigurasi berikut:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/coaltools_prod"
DIRECT_URL="postgresql://username:password@localhost:5432/coaltools_prod"

# Application Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Security
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-encryption-key-32-chars"

# External Services
REDIS_URL="redis://localhost:6379"
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"

# Monitoring
SENTRY_DSN="your-sentry-dsn" # Optional
```

## 🚀 Deployment Steps

### 1. Persiapan Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 2. Database Setup

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE coaltools_prod;
CREATE USER coaltools_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE coaltools_prod TO coaltools_user;
\q
```

### 3. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-repo/coaltools.git
cd coaltools

# Install dependencies
npm ci --only=production

# Setup environment
cp .env.example .env.production
# Edit .env.production dengan konfigurasi yang sesuai

# Run database migrations
npx prisma migrate deploy
npx prisma generate

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
```

### 4. Nginx Configuration

Buat file `/etc/nginx/sites-available/coaltools`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static {
        alias /path/to/coaltools/.next/static;
        expires 365d;
        access_log off;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

Aktifkan konfigurasi:

```bash
sudo ln -s /etc/nginx/sites-available/coaltools /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 PM2 Configuration

Buat file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'coaltools',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/coaltools',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=4096'
  }]
};
```

## 📊 Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Monitor aplikasi
pm2 monit

# Lihat logs
pm2 logs coaltools

# Restart aplikasi
pm2 restart coaltools

# Reload aplikasi (zero downtime)
pm2 reload coaltools
```

### 2. Database Monitoring

```bash
# Monitor PostgreSQL performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('coaltools_prod'));"
```

### 3. System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop

# Monitor disk I/O
sudo iotop

# Monitor network usage
sudo nethogs
```

## 🔄 Update & Maintenance

### 1. Application Updates

```bash
#!/bin/bash
# update-app.sh

echo "🚀 Starting application update..."

# Backup database
echo "📦 Creating database backup..."
pg_dump -U coaltools_user -h localhost coaltools_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy
npx prisma generate

# Build application
echo "🔨 Building application..."
npm run build

# Reload PM2
echo "🔄 Reloading application..."
pm2 reload coaltools

echo "✅ Update completed successfully!"
```

### 2. Database Maintenance

```bash
#!/bin/bash
# db-maintenance.sh

echo "🗄️ Starting database maintenance..."

# Vacuum and analyze
sudo -u postgres psql coaltools_prod -c "VACUUM ANALYZE;"

# Reindex
sudo -u postgres psql coaltools_prod -c "REINDEX DATABASE coaltools_prod;"

# Update statistics
sudo -u postgres psql coaltools_prod -c "ANALYZE;"

echo "✅ Database maintenance completed!"
```

## 🔒 Security Checklist

- [ ] SSL/TLS certificate installed dan valid
- [ ] Firewall configured (hanya port 80, 443, 22 terbuka)
- [ ] Database password kuat dan encrypted
- [ ] Environment variables aman
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitoring dan alerting aktif
- [ ] Rate limiting configured
- [ ] CORS policy configured
- [ ] Security headers implemented

## 🚨 Troubleshooting

### Common Issues

1. **Application tidak start**
   ```bash
   # Check PM2 logs
   pm2 logs coaltools
   
   # Check environment variables
   pm2 env 0
   ```

2. **Database connection error**
   ```bash
   # Test database connection
   psql -U coaltools_user -h localhost -d coaltools_prod
   
   # Check PostgreSQL status
   sudo systemctl status postgresql
   ```

3. **High memory usage**
   ```bash
   # Restart application
   pm2 restart coaltools
   
   # Check memory usage
   pm2 monit
   ```

4. **Slow performance**
   ```bash
   # Check database queries
   sudo -u postgres psql coaltools_prod -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
   
   # Clear Redis cache
   redis-cli FLUSHALL
   ```

## 📞 Support

Untuk bantuan lebih lanjut:
- Email: support@coaltools.com
- Documentation: https://docs.coaltools.com
- GitHub Issues: https://github.com/your-repo/coaltools/issues

---

**⚠️ Penting**: Selalu lakukan backup sebelum melakukan update atau maintenance!