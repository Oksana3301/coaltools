# 💾 Backup & Recovery Guide - CoalTools

## 📋 Overview

Panduan lengkap untuk backup dan recovery sistem CoalTools, mencakup database backup, file backup, automated backup strategies, dan disaster recovery procedures.

## 🎯 Backup Strategy

### Backup Types

1. **Full Backup**: Complete database and application files
2. **Incremental Backup**: Only changed data since last backup
3. **Differential Backup**: Changed data since last full backup
4. **Point-in-Time Recovery**: Restore to specific timestamp

### Backup Schedule

- **Daily**: Automated database backup (3 AM)
- **Weekly**: Full system backup (Sunday 2 AM)
- **Monthly**: Archive backup to long-term storage
- **Before Deployment**: Manual backup before major updates

### Retention Policy

- **Daily backups**: Keep for 30 days
- **Weekly backups**: Keep for 12 weeks
- **Monthly backups**: Keep for 12 months
- **Yearly backups**: Keep for 7 years (compliance)

## 🗄️ Database Backup

### PostgreSQL Backup Scripts

**scripts/backup-database.sh**
```bash
#!/bin/bash

# Database backup script for CoalTools
# Usage: ./scripts/backup-database.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="/var/backups/coaltools"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="coaltools_${ENVIRONMENT}_${DATE}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
RETENTION_DAYS=30

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
else
    echo "Environment file .env.${ENVIRONMENT} not found"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send to Slack (optional)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"CoalTools Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Send email (optional)
    if [ -n "$BACKUP_EMAIL" ]; then
        echo "$message" | mail -s "CoalTools Backup $status" "$BACKUP_EMAIL"
    fi
}

# Start backup process
log "Starting database backup for environment: $ENVIRONMENT"

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Set PostgreSQL password
export PGPASSWORD="$DB_PASS"

# Create backup
log "Creating database dump..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --if-exists --create \
    --format=plain --encoding=UTF8 \
    > "$BACKUP_DIR/$BACKUP_FILE"; then
    
    log "Database dump created successfully"
    
    # Compress backup
    log "Compressing backup file..."
    if gzip "$BACKUP_DIR/$BACKUP_FILE"; then
        log "Backup compressed successfully: $COMPRESSED_FILE"
        
        # Verify backup integrity
        log "Verifying backup integrity..."
        if gunzip -t "$BACKUP_DIR/$COMPRESSED_FILE"; then
            log "Backup integrity verified"
            
            # Get backup size
            BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
            
            # Upload to cloud storage (optional)
            if [ -n "$AWS_S3_BUCKET" ]; then
                log "Uploading backup to S3..."
                aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" \
                    "s3://$AWS_S3_BUCKET/database-backups/$COMPRESSED_FILE" \
                    --storage-class STANDARD_IA
                
                if [ $? -eq 0 ]; then
                    log "Backup uploaded to S3 successfully"
                else
                    log "Failed to upload backup to S3"
                fi
            fi
            
            # Clean up old backups
            log "Cleaning up old backups..."
            find "$BACKUP_DIR" -name "coaltools_${ENVIRONMENT}_*.sql.gz" \
                -type f -mtime +$RETENTION_DAYS -delete
            
            # Send success notification
            send_notification "SUCCESS" "Database backup completed successfully. Size: $BACKUP_SIZE"
            
            log "Backup process completed successfully"
            
        else
            log "ERROR: Backup integrity check failed"
            send_notification "FAILED" "Backup integrity check failed"
            exit 1
        fi
    else
        log "ERROR: Failed to compress backup"
        send_notification "FAILED" "Failed to compress backup"
        exit 1
    fi
else
    log "ERROR: Failed to create database dump"
    send_notification "FAILED" "Failed to create database dump"
    exit 1
fi

# Unset password
unset PGPASSWORD

log "Backup script completed"
```

**Make script executable:**
```bash
chmod +x scripts/backup-database.sh
```

### Automated Backup with Cron

**Setup cron job:**
```bash
# Edit crontab
crontab -e

# Add backup jobs
# Daily backup at 3 AM
0 3 * * * /path/to/coaltools/scripts/backup-database.sh production >> /var/log/coaltools-backup.log 2>&1

# Weekly full backup at 2 AM on Sunday
0 2 * * 0 /path/to/coaltools/scripts/full-backup.sh production >> /var/log/coaltools-backup.log 2>&1

# Monthly cleanup at 1 AM on 1st day of month
0 1 1 * * /path/to/coaltools/scripts/cleanup-backups.sh >> /var/log/coaltools-backup.log 2>&1
```

### Point-in-Time Recovery Setup

**Enable WAL archiving in PostgreSQL:**

**postgresql.conf**
```ini
# Enable WAL archiving
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
max_wal_senders = 3
wal_keep_segments = 32

# Checkpoint settings
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 1GB
min_wal_size = 80MB
```

**WAL archive script:**
```bash
#!/bin/bash
# scripts/archive-wal.sh

WAL_FILE=$1
ARCHIVE_DIR="/var/lib/postgresql/wal_archive"
S3_BUCKET="your-backup-bucket"

# Copy to local archive
cp "$WAL_FILE" "$ARCHIVE_DIR/"

# Upload to S3
aws s3 cp "$WAL_FILE" "s3://$S3_BUCKET/wal-archive/" --storage-class GLACIER

# Clean up old WAL files (keep 7 days)
find "$ARCHIVE_DIR" -name "*.wal" -mtime +7 -delete
```

## 📁 Application Files Backup

### Full System Backup Script

**scripts/full-backup.sh**
```bash
#!/bin/bash

# Full system backup script for CoalTools
# Includes application files, uploads, and configuration

set -e

# Configuration
ENVIRONMENT=${1:-production}
APP_DIR="/var/www/coaltools"
BACKUP_DIR="/var/backups/coaltools"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="coaltools_full_${ENVIRONMENT}_${DATE}"
EXCLUDE_FILE="/tmp/backup_exclude.txt"

# Create exclude file
cat > "$EXCLUDE_FILE" << EOF
node_modules/
.next/
.git/
logs/
*.log
.env*
.DS_Store
tmp/
cache/
EOF

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting full system backup for environment: $ENVIRONMENT"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create application files backup
log "Creating application files backup..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_files.tar.gz" \
    -C "$(dirname $APP_DIR)" \
    --exclude-from="$EXCLUDE_FILE" \
    "$(basename $APP_DIR)"

if [ $? -eq 0 ]; then
    log "Application files backup created successfully"
else
    log "ERROR: Failed to create application files backup"
    exit 1
fi

# Create database backup
log "Creating database backup..."
./scripts/backup-database.sh "$ENVIRONMENT"

if [ $? -eq 0 ]; then
    log "Database backup created successfully"
else
    log "ERROR: Failed to create database backup"
    exit 1
fi

# Create configuration backup
log "Creating configuration backup..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    /etc/nginx/sites-available/coaltools \
    /etc/systemd/system/coaltools.service \
    "$APP_DIR/.env.production" 2>/dev/null || true

# Create uploads backup (if exists)
if [ -d "$APP_DIR/public/uploads" ]; then
    log "Creating uploads backup..."
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" \
        -C "$APP_DIR/public" uploads/
fi

# Create combined backup archive
log "Creating combined backup archive..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" \
    -C "$BACKUP_DIR" \
    "${BACKUP_NAME}_files.tar.gz" \
    "${BACKUP_NAME}_config.tar.gz" \
    "${BACKUP_NAME}_uploads.tar.gz" 2>/dev/null || true

# Upload to cloud storage
if [ -n "$AWS_S3_BUCKET" ]; then
    log "Uploading full backup to S3..."
    aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" \
        "s3://$AWS_S3_BUCKET/full-backups/" \
        --storage-class STANDARD_IA
fi

# Clean up temporary files
rm -f "$EXCLUDE_FILE"
rm -f "$BACKUP_DIR/${BACKUP_NAME}_files.tar.gz"
rm -f "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz"
rm -f "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz"

log "Full backup completed successfully"
```

## 🔄 Recovery Procedures

### Database Recovery

**scripts/restore-database.sh**
```bash
#!/bin/bash

# Database restore script for CoalTools
# Usage: ./scripts/restore-database.sh <backup_file> [environment]

set -e

BACKUP_FILE=$1
ENVIRONMENT=${2:-production}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file> [environment]"
    echo "Example: $0 coaltools_production_20240115_030001.sql.gz"
    exit 1
fi

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
else
    echo "Environment file .env.${ENVIRONMENT} not found"
    exit 1
fi

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Confirmation prompt
read -p "This will REPLACE the current database. Are you sure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

log "Starting database restore from: $BACKUP_FILE"

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Set PostgreSQL password
export PGPASSWORD="$DB_PASS"

# Stop application (if running)
log "Stopping application..."
sudo systemctl stop coaltools || true

# Create backup of current database before restore
log "Creating backup of current database..."
CURRENT_BACKUP="current_backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    > "/tmp/$CURRENT_BACKUP"

log "Current database backed up to: /tmp/$CURRENT_BACKUP"

# Restore database
log "Restoring database..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    # Compressed backup
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
else
    # Uncompressed backup
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    log "Database restored successfully"
    
    # Run migrations if needed
    log "Running database migrations..."
    cd /var/www/coaltools
    npx prisma migrate deploy
    npx prisma generate
    
    # Start application
    log "Starting application..."
    sudo systemctl start coaltools
    
    # Verify application is running
    sleep 10
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log "Application started successfully"
        log "Database restore completed successfully"
    else
        log "WARNING: Application may not be running properly"
    fi
    
else
    log "ERROR: Database restore failed"
    log "Restoring previous database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "/tmp/$CURRENT_BACKUP"
    sudo systemctl start coaltools
    exit 1
fi

# Unset password
unset PGPASSWORD

log "Restore process completed"
```

### Point-in-Time Recovery

**scripts/pitr-restore.sh**
```bash
#!/bin/bash

# Point-in-Time Recovery script
# Usage: ./scripts/pitr-restore.sh <target_time> <base_backup>

set -e

TARGET_TIME=$1
BASE_BACKUP=$2

if [ -z "$TARGET_TIME" ] || [ -z "$BASE_BACKUP" ]; then
    echo "Usage: $0 <target_time> <base_backup>"
    echo "Example: $0 '2024-01-15 14:30:00' /backups/base_backup_20240115.tar.gz"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Point-in-Time Recovery to: $TARGET_TIME"

# Stop PostgreSQL
sudo systemctl stop postgresql

# Backup current data directory
sudo mv /var/lib/postgresql/14/main /var/lib/postgresql/14/main.backup

# Restore base backup
log "Restoring base backup..."
sudo mkdir -p /var/lib/postgresql/14/main
sudo tar -xzf "$BASE_BACKUP" -C /var/lib/postgresql/14/main
sudo chown -R postgres:postgres /var/lib/postgresql/14/main

# Create recovery configuration
log "Creating recovery configuration..."
sudo -u postgres cat > /var/lib/postgresql/14/main/recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '$TARGET_TIME'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL in recovery mode
log "Starting PostgreSQL in recovery mode..."
sudo systemctl start postgresql

# Wait for recovery to complete
log "Waiting for recovery to complete..."
while sudo -u postgres psql -c "SELECT pg_is_in_recovery();" | grep -q "t"; do
    sleep 5
    echo "Recovery in progress..."
done

log "Point-in-Time Recovery completed successfully"
log "Database recovered to: $TARGET_TIME"
```

### Application Recovery

**scripts/restore-application.sh**
```bash
#!/bin/bash

# Application restore script
# Usage: ./scripts/restore-application.sh <backup_file>

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 coaltools_full_production_20240115_020001_complete.tar.gz"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Confirmation prompt
read -p "This will REPLACE the current application. Are you sure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

log "Starting application restore from: $BACKUP_FILE"

# Stop application
log "Stopping application..."
sudo systemctl stop coaltools
sudo systemctl stop nginx

# Backup current application
log "Backing up current application..."
sudo mv /var/www/coaltools /var/www/coaltools.backup.$(date +%Y%m%d_%H%M%S)

# Extract backup
log "Extracting backup..."
sudo mkdir -p /var/www/coaltools
sudo tar -xzf "$BACKUP_FILE" -C /tmp/

# Restore application files
if [ -f "/tmp/coaltools_full_*_files.tar.gz" ]; then
    log "Restoring application files..."
    sudo tar -xzf /tmp/coaltools_full_*_files.tar.gz -C /var/www/
fi

# Restore configuration
if [ -f "/tmp/coaltools_full_*_config.tar.gz" ]; then
    log "Restoring configuration files..."
    sudo tar -xzf /tmp/coaltools_full_*_config.tar.gz -C /
fi

# Restore uploads
if [ -f "/tmp/coaltools_full_*_uploads.tar.gz" ]; then
    log "Restoring uploads..."
    sudo tar -xzf /tmp/coaltools_full_*_uploads.tar.gz -C /var/www/coaltools/public/
fi

# Set proper permissions
log "Setting permissions..."
sudo chown -R www-data:www-data /var/www/coaltools
sudo chmod -R 755 /var/www/coaltools

# Install dependencies
log "Installing dependencies..."
cd /var/www/coaltools
sudo -u www-data npm ci --production

# Build application
log "Building application..."
sudo -u www-data npm run build

# Start services
log "Starting services..."
sudo systemctl start coaltools
sudo systemctl start nginx

# Verify application
log "Verifying application..."
sleep 10
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "Application restored and running successfully"
else
    log "WARNING: Application may not be running properly"
fi

# Clean up temporary files
rm -f /tmp/coaltools_full_*

log "Application restore completed"
```

## ☁️ Cloud Backup Integration

### AWS S3 Backup

**scripts/s3-backup.sh**
```bash
#!/bin/bash

# AWS S3 backup integration
# Requires AWS CLI configured with appropriate credentials

set -e

# Configuration
S3_BUCKET="your-coaltools-backups"
S3_PREFIX="coaltools-backups"
LOCAL_BACKUP_DIR="/var/backups/coaltools"
ENVIRONMENT=${1:-production}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Sync local backups to S3
log "Syncing backups to S3..."
aws s3 sync "$LOCAL_BACKUP_DIR" "s3://$S3_BUCKET/$S3_PREFIX/$ENVIRONMENT/" \
    --storage-class STANDARD_IA \
    --exclude "*.tmp" \
    --exclude "*.log"

if [ $? -eq 0 ]; then
    log "Backup sync to S3 completed successfully"
else
    log "ERROR: Failed to sync backups to S3"
    exit 1
fi

# Set lifecycle policy for cost optimization
aws s3api put-bucket-lifecycle-configuration \
    --bucket "$S3_BUCKET" \
    --lifecycle-configuration file://s3-lifecycle-policy.json

log "S3 backup process completed"
```

**s3-lifecycle-policy.json**
```json
{
  "Rules": [
    {
      "ID": "CoalToolsBackupLifecycle",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "coaltools-backups/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 2555
      }
    }
  ]
}
```

### Google Cloud Storage Backup

**scripts/gcs-backup.sh**
```bash
#!/bin/bash

# Google Cloud Storage backup integration
# Requires gcloud CLI configured

set -e

# Configuration
GCS_BUCKET="your-coaltools-backups"
GCS_PREFIX="coaltools-backups"
LOCAL_BACKUP_DIR="/var/backups/coaltools"
ENVIRONMENT=${1:-production}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Sync local backups to GCS
log "Syncing backups to Google Cloud Storage..."
gsutil -m rsync -r -d "$LOCAL_BACKUP_DIR" "gs://$GCS_BUCKET/$GCS_PREFIX/$ENVIRONMENT/"

if [ $? -eq 0 ]; then
    log "Backup sync to GCS completed successfully"
else
    log "ERROR: Failed to sync backups to GCS"
    exit 1
fi

# Set lifecycle policy
gsutil lifecycle set gcs-lifecycle-policy.json "gs://$GCS_BUCKET"

log "GCS backup process completed"
```

## 🔄 Disaster Recovery Plan

### Recovery Time Objectives (RTO)

- **Database Recovery**: 30 minutes
- **Application Recovery**: 1 hour
- **Full System Recovery**: 4 hours
- **Data Loss Tolerance (RPO)**: 1 hour

### Disaster Recovery Procedures

#### 1. Complete System Failure

**Recovery Steps:**

1. **Assess Damage**
   ```bash
   # Check system status
   systemctl status coaltools
   systemctl status postgresql
   systemctl status nginx
   
   # Check disk space
   df -h
   
   # Check logs
   tail -f /var/log/syslog
   ```

2. **Restore Database**
   ```bash
   # Get latest backup
   aws s3 ls s3://your-backup-bucket/database-backups/ --recursive | sort | tail -1
   
   # Download and restore
   aws s3 cp s3://your-backup-bucket/database-backups/latest.sql.gz /tmp/
   ./scripts/restore-database.sh /tmp/latest.sql.gz production
   ```

3. **Restore Application**
   ```bash
   # Get latest full backup
   aws s3 ls s3://your-backup-bucket/full-backups/ --recursive | sort | tail -1
   
   # Download and restore
   aws s3 cp s3://your-backup-bucket/full-backups/latest.tar.gz /tmp/
   ./scripts/restore-application.sh /tmp/latest.tar.gz
   ```

4. **Verify Recovery**
   ```bash
   # Check application health
   curl -f http://localhost:3000/api/health
   
   # Check database connectivity
   npx prisma db pull
   
   # Run smoke tests
   npm run test:smoke
   ```

#### 2. Data Corruption

**Recovery Steps:**

1. **Identify Corruption Scope**
   ```sql
   -- Check data integrity
   SELECT COUNT(*) FROM "Employee" WHERE "createdAt" IS NULL;
   SELECT COUNT(*) FROM "Payroll" WHERE "totalGaji" < 0;
   ```

2. **Point-in-Time Recovery**
   ```bash
   # Restore to time before corruption
   ./scripts/pitr-restore.sh '2024-01-15 10:00:00' /backups/base_backup.tar.gz
   ```

3. **Selective Data Recovery**
   ```bash
   # Restore specific tables
   pg_restore -h localhost -U postgres -d coaltools \
     --table="Employee" --table="Payroll" \
     /backups/latest.backup
   ```

## 📊 Backup Monitoring

### Backup Verification Script

**scripts/verify-backups.sh**
```bash
#!/bin/bash

# Backup verification script
# Checks backup integrity and completeness

set -e

BACKUP_DIR="/var/backups/coaltools"
LOG_FILE="/var/log/backup-verification.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting backup verification"

# Check if backups exist
if [ ! -d "$BACKUP_DIR" ]; then
    log "ERROR: Backup directory does not exist: $BACKUP_DIR"
    exit 1
fi

# Check recent backups
RECENT_BACKUP=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime -1 | head -1)
if [ -z "$RECENT_BACKUP" ]; then
    log "WARNING: No recent database backup found (within 24 hours)"
else
    log "Recent backup found: $RECENT_BACKUP"
    
    # Test backup integrity
    if gunzip -t "$RECENT_BACKUP"; then
        log "Backup integrity check passed"
    else
        log "ERROR: Backup integrity check failed"
        exit 1
    fi
    
    # Check backup size
    BACKUP_SIZE=$(stat -f%z "$RECENT_BACKUP" 2>/dev/null || stat -c%s "$RECENT_BACKUP")
    MIN_SIZE=1048576  # 1MB minimum
    
    if [ "$BACKUP_SIZE" -lt "$MIN_SIZE" ]; then
        log "WARNING: Backup size is suspiciously small: $BACKUP_SIZE bytes"
    else
        log "Backup size check passed: $BACKUP_SIZE bytes"
    fi
fi

# Check cloud backup sync
if [ -n "$AWS_S3_BUCKET" ]; then
    log "Checking S3 backup sync..."
    S3_BACKUPS=$(aws s3 ls "s3://$AWS_S3_BUCKET/database-backups/" --recursive | wc -l)
    if [ "$S3_BACKUPS" -gt 0 ]; then
        log "S3 backups found: $S3_BACKUPS files"
    else
        log "WARNING: No S3 backups found"
    fi
fi

# Test restore capability (on test database)
if [ "$1" = "--test-restore" ]; then
    log "Testing restore capability..."
    
    # Create test database
    createdb coaltools_test || true
    
    # Restore to test database
    if gunzip -c "$RECENT_BACKUP" | psql -d coaltools_test; then
        log "Test restore successful"
        
        # Verify data
        EMPLOYEE_COUNT=$(psql -d coaltools_test -t -c "SELECT COUNT(*) FROM \"Employee\";" | xargs)
        log "Test database employee count: $EMPLOYEE_COUNT"
        
        # Cleanup
        dropdb coaltools_test
    else
        log "ERROR: Test restore failed"
        dropdb coaltools_test || true
        exit 1
    fi
fi

log "Backup verification completed successfully"
```

### Backup Monitoring Dashboard

**scripts/backup-status.sh**
```bash
#!/bin/bash

# Generate backup status report
# Can be used with monitoring systems

BACKUP_DIR="/var/backups/coaltools"
OUTPUT_FORMAT=${1:-text}  # text, json, or html

# Collect backup statistics
LAST_BACKUP=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
LAST_BACKUP_TIME=$(stat -c %Y "$LAST_BACKUP" 2>/dev/null || echo 0)
CURRENT_TIME=$(date +%s)
HOURS_SINCE_BACKUP=$(( (CURRENT_TIME - LAST_BACKUP_TIME) / 3600 ))

TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

# Check backup health
if [ "$HOURS_SINCE_BACKUP" -lt 25 ]; then
    BACKUP_STATUS="healthy"
else
    BACKUP_STATUS="warning"
fi

# Output in requested format
case "$OUTPUT_FORMAT" in
    "json")
        cat << EOF
{
  "backup_status": "$BACKUP_STATUS",
  "last_backup": "$LAST_BACKUP",
  "hours_since_backup": $HOURS_SINCE_BACKUP,
  "total_backups": $TOTAL_BACKUPS,
  "total_size": "$TOTAL_SIZE",
  "timestamp": $(date +%s)
}
EOF
        ;;
    "html")
        cat << EOF
<!DOCTYPE html>
<html>
<head><title>CoalTools Backup Status</title></head>
<body>
<h1>CoalTools Backup Status</h1>
<table border="1">
<tr><td>Status</td><td>$BACKUP_STATUS</td></tr>
<tr><td>Last Backup</td><td>$LAST_BACKUP</td></tr>
<tr><td>Hours Since Backup</td><td>$HOURS_SINCE_BACKUP</td></tr>
<tr><td>Total Backups</td><td>$TOTAL_BACKUPS</td></tr>
<tr><td>Total Size</td><td>$TOTAL_SIZE</td></tr>
</table>
</body>
</html>
EOF
        ;;
    *)
        echo "CoalTools Backup Status Report"
        echo "=============================="
        echo "Status: $BACKUP_STATUS"
        echo "Last Backup: $LAST_BACKUP"
        echo "Hours Since Backup: $HOURS_SINCE_BACKUP"
        echo "Total Backups: $TOTAL_BACKUPS"
        echo "Total Size: $TOTAL_SIZE"
        echo "Generated: $(date)"
        ;;
esac
```

## 📋 Backup Checklist

### Daily Backup Verification
- [ ] Database backup completed successfully
- [ ] Backup file integrity verified
- [ ] Backup uploaded to cloud storage
- [ ] Backup size within expected range
- [ ] No error notifications received

### Weekly Backup Tasks
- [ ] Full system backup completed
- [ ] Test restore procedure on staging
- [ ] Verify backup retention policy
- [ ] Check cloud storage costs
- [ ] Review backup logs for issues

### Monthly Backup Maintenance
- [ ] Archive old backups to long-term storage
- [ ] Test disaster recovery procedures
- [ ] Update backup documentation
- [ ] Review and update retention policies
- [ ] Audit backup access permissions

### Quarterly Backup Audit
- [ ] Full disaster recovery test
- [ ] Review backup strategy effectiveness
- [ ] Update recovery time objectives
- [ ] Test backup restoration on different environment
- [ ] Update backup and recovery documentation

---

## 📞 Emergency Contacts

### Backup & Recovery Team
- **Primary DBA**: [Contact Information]
- **System Administrator**: [Contact Information]
- **DevOps Engineer**: [Contact Information]
- **Cloud Provider Support**: [Support Numbers]

### Escalation Procedures
1. **Level 1**: System Administrator (0-2 hours)
2. **Level 2**: Senior DBA (2-4 hours)
3. **Level 3**: External Consultant (4+ hours)

---

*Backup dan recovery adalah komponen kritis untuk kelangsungan bisnis. Pastikan untuk menguji prosedur recovery secara berkala dan memperbarui dokumentasi sesuai dengan perubahan sistem.*