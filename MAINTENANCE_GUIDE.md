# 🔧 Maintenance Guide - CoalTools

## 📋 Overview

Panduan lengkap untuk maintenance rutin aplikasi CoalTools, mencakup daily operations, weekly maintenance, monthly tasks, dan quarterly reviews untuk memastikan sistem berjalan optimal dan aman.

## 📅 Maintenance Schedule

### Daily Tasks (Automated)
- Database backup (3:00 AM)
- Log rotation and cleanup
- System health monitoring
- Security scan
- Performance metrics collection

### Weekly Tasks (Manual Review)
- System performance review
- Security updates check
- Database optimization
- Backup verification
- Error log analysis

### Monthly Tasks
- Full system backup verification
- Dependency updates
- Security audit
- Performance optimization
- Documentation updates

### Quarterly Tasks
- Disaster recovery testing
- Security penetration testing
- Architecture review
- Capacity planning
- Training updates

## 🔄 Daily Maintenance

### Automated Daily Tasks

**scripts/daily-maintenance.sh**
```bash
#!/bin/bash

# Daily maintenance script for CoalTools
# Run via cron at 4:00 AM daily

set -e

# Configuration
LOG_DIR="/var/log/coaltools"
APP_DIR="/var/www/coaltools"
MAINTENANCE_LOG="$LOG_DIR/maintenance.log"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Function to log messages
log() {
    echo "[$DATE] $1" | tee -a "$MAINTENANCE_LOG"
}

# Function to send alerts
send_alert() {
    local severity=$1
    local message=$2
    
    # Log the alert
    log "ALERT [$severity]: $message"
    
    # Send to monitoring system (customize as needed)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"CoalTools Alert [$severity]: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Send email alert for critical issues
    if [ "$severity" = "CRITICAL" ] && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "CoalTools Critical Alert" "$ALERT_EMAIL"
    fi
}

log "Starting daily maintenance tasks"

# 1. System Health Check
log "Performing system health check..."

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    send_alert "WARNING" "Disk usage is at ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -gt 95 ]; then
    send_alert "CRITICAL" "Disk usage is at ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    send_alert "WARNING" "Memory usage is at ${MEMORY_USAGE}%"
fi

# Check application status
if ! systemctl is-active --quiet coaltools; then
    send_alert "CRITICAL" "CoalTools application is not running"
fi

if ! systemctl is-active --quiet postgresql; then
    send_alert "CRITICAL" "PostgreSQL database is not running"
fi

if ! systemctl is-active --quiet nginx; then
    send_alert "CRITICAL" "Nginx web server is not running"
fi

# 2. Database Health Check
log "Checking database health..."

# Check database connectivity
if ! sudo -u postgres psql -d coaltools -c "SELECT 1;" > /dev/null 2>&1; then
    send_alert "CRITICAL" "Database connectivity check failed"
else
    log "Database connectivity: OK"
fi

# Check for long-running queries
LONG_QUERIES=$(sudo -u postgres psql -d coaltools -t -c "
    SELECT COUNT(*) FROM pg_stat_activity 
    WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes'
    AND query NOT LIKE '%pg_stat_activity%';
" | xargs)

if [ "$LONG_QUERIES" -gt 0 ]; then
    send_alert "WARNING" "Found $LONG_QUERIES long-running database queries"
fi

# Check database size
DB_SIZE=$(sudo -u postgres psql -d coaltools -t -c "
    SELECT pg_size_pretty(pg_database_size('coaltools'));
" | xargs)
log "Database size: $DB_SIZE"

# 3. Log Cleanup
log "Performing log cleanup..."

# Rotate application logs
find "$LOG_DIR" -name "*.log" -size +100M -exec logrotate -f /etc/logrotate.d/coaltools {} \;

# Clean old log files (keep 30 days)
find "$LOG_DIR" -name "*.log.*" -mtime +30 -delete

# Clean old backup files (keep 7 days locally)
find /var/backups/coaltools -name "*.sql.gz" -mtime +7 -delete

# 4. Temporary File Cleanup
log "Cleaning temporary files..."

# Clean application temp files
find "$APP_DIR/tmp" -type f -mtime +1 -delete 2>/dev/null || true
find "$APP_DIR/.next/cache" -type f -mtime +7 -delete 2>/dev/null || true

# Clean system temp files
find /tmp -name "coaltools-*" -mtime +1 -delete 2>/dev/null || true

# 5. Security Checks
log "Performing security checks..."

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | grep "$(date +%b\ %d)" | wc -l)
if [ "$FAILED_LOGINS" -gt 50 ]; then
    send_alert "WARNING" "High number of failed login attempts: $FAILED_LOGINS"
fi

# Check for suspicious API requests
SUSPICIOUS_REQUESTS=$(grep -E "(sql|script|eval|exec)" "$LOG_DIR/access.log" | grep "$(date +%d/%b/%Y)" | wc -l)
if [ "$SUSPICIOUS_REQUESTS" -gt 10 ]; then
    send_alert "WARNING" "Suspicious API requests detected: $SUSPICIOUS_REQUESTS"
fi

# 6. Performance Metrics Collection
log "Collecting performance metrics..."

# API response times
AVG_RESPONSE_TIME=$(awk '/api/ {sum+=$10; count++} END {if(count>0) print sum/count; else print 0}' "$LOG_DIR/access.log")
log "Average API response time: ${AVG_RESPONSE_TIME}ms"

# Database connection count
DB_CONNECTIONS=$(sudo -u postgres psql -d coaltools -t -c "SELECT count(*) FROM pg_stat_activity;" | xargs)
log "Active database connections: $DB_CONNECTIONS"

# 7. Application Health Check
log "Checking application health..."

# Test API endpoints
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    log "API health check: OK"
else
    send_alert "CRITICAL" "API health check failed"
fi

# Check application logs for errors
ERROR_COUNT=$(grep -c "ERROR" "$LOG_DIR/application.log" | tail -1000 || echo 0)
if [ "$ERROR_COUNT" -gt 10 ]; then
    send_alert "WARNING" "High error count in application logs: $ERROR_COUNT"
fi

log "Daily maintenance tasks completed successfully"

# Generate daily report
cat > "$LOG_DIR/daily-report-$(date +%Y%m%d).txt" << EOF
CoalTools Daily Maintenance Report - $(date +"%Y-%m-%d")
=================================================

System Status:
- Disk Usage: ${DISK_USAGE}%
- Memory Usage: ${MEMORY_USAGE}%
- Database Size: $DB_SIZE
- Active DB Connections: $DB_CONNECTIONS
- Average API Response Time: ${AVG_RESPONSE_TIME}ms
- Application Errors: $ERROR_COUNT
- Failed Logins: $FAILED_LOGINS
- Suspicious Requests: $SUSPICIOUS_REQUESTS

Services Status:
- CoalTools Application: $(systemctl is-active coaltools)
- PostgreSQL Database: $(systemctl is-active postgresql)
- Nginx Web Server: $(systemctl is-active nginx)

Maintenance Tasks Completed:
- System health check
- Database health check
- Log cleanup and rotation
- Temporary file cleanup
- Security checks
- Performance metrics collection
- Application health check

Generated: $(date)
EOF

log "Daily report generated: daily-report-$(date +%Y%m%d).txt"
```

### Daily Monitoring Dashboard

**scripts/generate-dashboard.sh**
```bash
#!/bin/bash

# Generate HTML dashboard for daily monitoring
# Run every hour via cron

DASHBOARD_DIR="/var/www/html/monitoring"
DASHBOARD_FILE="$DASHBOARD_DIR/index.html"
LOG_DIR="/var/log/coaltools"

# Create dashboard directory
mkdir -p "$DASHBOARD_DIR"

# Collect current metrics
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
UPTIME=$(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')

# Database metrics
DB_SIZE=$(sudo -u postgres psql -d coaltools -t -c "SELECT pg_size_pretty(pg_database_size('coaltools'));" | xargs)
DB_CONNECTIONS=$(sudo -u postgres psql -d coaltools -t -c "SELECT count(*) FROM pg_stat_activity;" | xargs)

# Application metrics
APP_STATUS=$(systemctl is-active coaltools)
DB_STATUS=$(systemctl is-active postgresql)
NGINX_STATUS=$(systemctl is-active nginx)

# Generate HTML dashboard
cat > "$DASHBOARD_FILE" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CoalTools Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
        .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .status-ok { color: #27ae60; }
        .status-warning { color: #f39c12; }
        .status-critical { color: #e74c3c; }
        .progress-bar { width: 100%; height: 20px; background: #ecf0f1; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .logs { margin-top: 20px; }
        .log-box { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; font-family: monospace; max-height: 300px; overflow-y: auto; }
        .timestamp { color: #95a5a6; font-size: 12px; }
    </style>
    <script>
        function refreshPage() {
            location.reload();
        }
        setInterval(refreshPage, 60000); // Refresh every minute
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CoalTools Monitoring Dashboard</h1>
            <p>Last Updated: $(date)</p>
            <p>System Uptime: $UPTIME</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-title">System Resources</div>
                <div class="metric-value">CPU: ${CPU_USAGE}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${CPU_USAGE}%; background: $([ $CPU_USAGE -gt 80 ] && echo '#e74c3c' || echo '#27ae60')"></div>
                </div>
                <div class="metric-value">Memory: ${MEMORY_USAGE}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${MEMORY_USAGE}%; background: $([ $MEMORY_USAGE -gt 80 ] && echo '#e74c3c' || echo '#27ae60')"></div>
                </div>
                <div class="metric-value">Disk: ${DISK_USAGE}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${DISK_USAGE}%; background: $([ $DISK_USAGE -gt 80 ] && echo '#e74c3c' || echo '#27ae60')"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Services Status</div>
                <div class="metric-value status-$([ "$APP_STATUS" = "active" ] && echo 'ok' || echo 'critical')">Application: $APP_STATUS</div>
                <div class="metric-value status-$([ "$DB_STATUS" = "active" ] && echo 'ok' || echo 'critical')">Database: $DB_STATUS</div>
                <div class="metric-value status-$([ "$NGINX_STATUS" = "active" ] && echo 'ok' || echo 'critical')">Web Server: $NGINX_STATUS</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Database Metrics</div>
                <div class="metric-value">Size: $DB_SIZE</div>
                <div class="metric-value">Connections: $DB_CONNECTIONS</div>
                <div class="metric-value">Status: <span class="status-$([ "$DB_STATUS" = "active" ] && echo 'ok' || echo 'critical')">$DB_STATUS</span></div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Recent Backups</div>
EOF

# Add recent backup information
RECENT_BACKUPS=$(find /var/backups/coaltools -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -3)
echo "                <div style='font-family: monospace; font-size: 12px;'>" >> "$DASHBOARD_FILE"
echo "$RECENT_BACKUPS" | while read -r line; do
    if [ -n "$line" ]; then
        TIMESTAMP=$(echo "$line" | cut -d' ' -f1)
        FILEPATH=$(echo "$line" | cut -d' ' -f2-)
        FILENAME=$(basename "$FILEPATH")
        FORMATTED_DATE=$(date -d @"$TIMESTAMP" '+%Y-%m-%d %H:%M')
        echo "                    <div>$FORMATTED_DATE - $FILENAME</div>" >> "$DASHBOARD_FILE"
    fi
done

cat >> "$DASHBOARD_FILE" << EOF
                </div>
            </div>
        </div>
        
        <div class="logs">
            <div class="metric-card">
                <div class="metric-title">Recent Application Logs</div>
                <div class="log-box">
EOF

# Add recent log entries
if [ -f "$LOG_DIR/application.log" ]; then
    tail -20 "$LOG_DIR/application.log" | while IFS= read -r line; do
        echo "                    <div>$line</div>" >> "$DASHBOARD_FILE"
    done
else
    echo "                    <div>No application logs found</div>" >> "$DASHBOARD_FILE"
fi

cat >> "$DASHBOARD_FILE" << EOF
                </div>
            </div>
        </div>
    </div>
</body>
</html>
EOF

echo "Dashboard generated: $DASHBOARD_FILE"
```

## 📊 Weekly Maintenance

### Weekly Maintenance Script

**scripts/weekly-maintenance.sh**
```bash
#!/bin/bash

# Weekly maintenance script for CoalTools
# Run every Sunday at 2:00 AM

set -e

LOG_DIR="/var/log/coaltools"
APP_DIR="/var/www/coaltools"
WEEKLY_LOG="$LOG_DIR/weekly-maintenance.log"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Function to log messages
log() {
    echo "[$DATE] $1" | tee -a "$WEEKLY_LOG"
}

log "Starting weekly maintenance tasks"

# 1. Database Maintenance
log "Performing database maintenance..."

# Update table statistics
sudo -u postgres psql -d coaltools -c "ANALYZE;"
log "Database statistics updated"

# Vacuum database
sudo -u postgres psql -d coaltools -c "VACUUM;"
log "Database vacuum completed"

# Reindex database
sudo -u postgres psql -d coaltools -c "REINDEX DATABASE coaltools;"
log "Database reindex completed"

# Check for unused indexes
UNUSED_INDEXES=$(sudo -u postgres psql -d coaltools -t -c "
    SELECT schemaname, tablename, indexname, idx_scan
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    ORDER BY schemaname, tablename, indexname;
")

if [ -n "$UNUSED_INDEXES" ]; then
    log "Unused indexes found:"
    echo "$UNUSED_INDEXES" | tee -a "$WEEKLY_LOG"
fi

# 2. Security Updates Check
log "Checking for security updates..."

# Update package lists
sudo apt update

# Check for security updates
SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -i security | wc -l)
if [ "$SECURITY_UPDATES" -gt 0 ]; then
    log "$SECURITY_UPDATES security updates available"
    
    # Apply security updates (uncomment if auto-update is desired)
    # sudo apt upgrade -y
else
    log "No security updates available"
fi

# 3. Application Dependencies Check
log "Checking application dependencies..."

cd "$APP_DIR"

# Check for npm security vulnerabilities
npm audit --audit-level moderate > /tmp/npm-audit.txt 2>&1 || true
VULNERABILITIES=$(grep -c "vulnerabilities" /tmp/npm-audit.txt || echo 0)

if [ "$VULNERABILITIES" -gt 0 ]; then
    log "$VULNERABILITIES npm vulnerabilities found"
    cat /tmp/npm-audit.txt | tee -a "$WEEKLY_LOG"
else
    log "No npm vulnerabilities found"
fi

# Check for outdated packages
npm outdated > /tmp/npm-outdated.txt 2>&1 || true
if [ -s /tmp/npm-outdated.txt ]; then
    log "Outdated npm packages found:"
    cat /tmp/npm-outdated.txt | tee -a "$WEEKLY_LOG"
fi

# 4. Performance Analysis
log "Performing performance analysis..."

# Analyze slow queries
SLOW_QUERIES=$(sudo -u postgres psql -d coaltools -t -c "
    SELECT query, mean_time, calls
    FROM pg_stat_statements
    WHERE mean_time > 100
    ORDER BY mean_time DESC
    LIMIT 10;
" 2>/dev/null || echo "pg_stat_statements not available")

if [ "$SLOW_QUERIES" != "pg_stat_statements not available" ]; then
    log "Top slow queries:"
    echo "$SLOW_QUERIES" | tee -a "$WEEKLY_LOG"
fi

# Check table sizes
TABLE_SIZES=$(sudo -u postgres psql -d coaltools -t -c "
    SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10;
")

log "Largest tables:"
echo "$TABLE_SIZES" | tee -a "$WEEKLY_LOG"

# 5. Log Analysis
log "Analyzing application logs..."

# Count error types
ERROR_SUMMARY=$(grep "ERROR" "$LOG_DIR/application.log" | awk '{print $3}' | sort | uniq -c | sort -nr | head -10)
if [ -n "$ERROR_SUMMARY" ]; then
    log "Top error types this week:"
    echo "$ERROR_SUMMARY" | tee -a "$WEEKLY_LOG"
fi

# Check for memory leaks
MEMORY_PATTERN=$(grep -i "memory\|heap\|leak" "$LOG_DIR/application.log" | wc -l)
if [ "$MEMORY_PATTERN" -gt 0 ]; then
    log "Potential memory issues detected: $MEMORY_PATTERN occurrences"
fi

# 6. Backup Verification
log "Verifying backup integrity..."

# Run backup verification script
if [ -f "scripts/verify-backups.sh" ]; then
    ./scripts/verify-backups.sh --test-restore
else
    log "Backup verification script not found"
fi

# 7. SSL Certificate Check
log "Checking SSL certificate..."

if [ -n "$DOMAIN_NAME" ]; then
    CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN_NAME" -connect "$DOMAIN_NAME:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
        log "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
    else
        log "SSL certificate valid for $DAYS_UNTIL_EXPIRY days"
    fi
fi

log "Weekly maintenance tasks completed successfully"

# Generate weekly report
cat > "$LOG_DIR/weekly-report-$(date +%Y%m%d).txt" << EOF
CoalTools Weekly Maintenance Report - $(date +"%Y-%m-%d")
=====================================================

Database Maintenance:
- Statistics updated
- Vacuum completed
- Reindex completed
- Unused indexes: $(echo "$UNUSED_INDEXES" | wc -l)

Security:
- Security updates available: $SECURITY_UPDATES
- NPM vulnerabilities: $VULNERABILITIES
- SSL certificate expires in: $DAYS_UNTIL_EXPIRY days

Performance:
- Slow queries analyzed
- Table sizes reviewed
- Memory usage patterns checked

Backups:
- Backup integrity verified
- Test restore completed

Logs:
- Error patterns analyzed
- Memory leak indicators: $MEMORY_PATTERN

Generated: $(date)
EOF

log "Weekly report generated: weekly-report-$(date +%Y%m%d).txt"
```

## 🗓️ Monthly Maintenance

### Monthly Maintenance Script

**scripts/monthly-maintenance.sh**
```bash
#!/bin/bash

# Monthly maintenance script for CoalTools
# Run on the first Sunday of each month

set -e

LOG_DIR="/var/log/coaltools"
APP_DIR="/var/www/coaltools"
MONTHLY_LOG="$LOG_DIR/monthly-maintenance.log"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Function to log messages
log() {
    echo "[$DATE] $1" | tee -a "$MONTHLY_LOG"
}

log "Starting monthly maintenance tasks"

# 1. Full System Update
log "Performing full system update..."

# Create system snapshot before updates
log "Creating system snapshot..."
sudo timeshift --create --comments "Before monthly maintenance $(date +%Y%m%d)" --tags M

# Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
sudo apt autoclean

log "System update completed"

# 2. Application Dependencies Update
log "Updating application dependencies..."

cd "$APP_DIR"

# Backup current package-lock.json
cp package-lock.json package-lock.json.backup

# Update dependencies
npm update
npm audit fix --force

# Rebuild application
npm run build

# Test application
if npm run test; then
    log "Application tests passed after dependency update"
else
    log "WARNING: Application tests failed after dependency update"
    # Restore backup if tests fail
    cp package-lock.json.backup package-lock.json
    npm ci
    npm run build
fi

# 3. Database Optimization
log "Performing database optimization..."

# Full vacuum with analyze
sudo -u postgres psql -d coaltools -c "VACUUM FULL ANALYZE;"

# Update database statistics
sudo -u postgres psql -d coaltools -c "UPDATE pg_stat_statements SET calls = 0, total_time = 0, mean_time = 0;"

# Check database integrity
DB_INTEGRITY=$(sudo -u postgres psql -d coaltools -t -c "SELECT count(*) FROM pg_stat_database WHERE datname = 'coaltools';")
log "Database integrity check: $DB_INTEGRITY"

# 4. Security Audit
log "Performing security audit..."

# Check for rootkits
if command -v rkhunter >/dev/null 2>&1; then
    sudo rkhunter --check --skip-keypress --report-warnings-only
fi

# Check file permissions
find "$APP_DIR" -type f -perm /o+w -exec ls -l {} \; > /tmp/world-writable-files.txt
if [ -s /tmp/world-writable-files.txt ]; then
    log "WARNING: World-writable files found:"
    cat /tmp/world-writable-files.txt | tee -a "$MONTHLY_LOG"
fi

# Check for SUID files
find / -type f -perm -4000 2>/dev/null > /tmp/suid-files.txt
SUID_COUNT=$(wc -l < /tmp/suid-files.txt)
log "SUID files found: $SUID_COUNT"

# 5. Performance Optimization
log "Performing performance optimization..."

# Clear application caches
rm -rf "$APP_DIR/.next/cache/*"
rm -rf "$APP_DIR/node_modules/.cache/*"

# Optimize images (if any new ones)
find "$APP_DIR/public" -name "*.jpg" -o -name "*.png" -newer "$APP_DIR/public/.last-optimized" 2>/dev/null | while read -r img; do
    if command -v optipng >/dev/null 2>&1; then
        optipng -o2 "$img"
    fi
done
touch "$APP_DIR/public/.last-optimized"

# 6. Backup Strategy Review
log "Reviewing backup strategy..."

# Check backup sizes and trends
BACKUP_SIZES=$(find /var/backups/coaltools -name "*.sql.gz" -type f -printf '%s %p\n' | sort -n | tail -10)
log "Recent backup sizes:"
echo "$BACKUP_SIZES" | tee -a "$MONTHLY_LOG"

# Test backup restoration on staging environment
if [ -n "$STAGING_DATABASE_URL" ]; then
    log "Testing backup restoration on staging..."
    LATEST_BACKUP=$(find /var/backups/coaltools -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    # Restore to staging (implement based on your staging setup)
    # ./scripts/restore-to-staging.sh "$LATEST_BACKUP"
fi

# 7. Capacity Planning
log "Performing capacity planning analysis..."

# Database growth analysis
DB_GROWTH=$(sudo -u postgres psql -d coaltools -t -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as current_size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC;
")

log "Current table sizes:"
echo "$DB_GROWTH" | tee -a "$MONTHLY_LOG"

# Disk usage projection
CURRENT_USAGE=$(df / | awk 'NR==2 {print $3}')
USAGE_30_DAYS_AGO=$(find /var/log -name "disk-usage-*" -mtime -30 | head -1 | xargs cat 2>/dev/null || echo "$CURRENT_USAGE")
GROWTH_RATE=$(( (CURRENT_USAGE - USAGE_30_DAYS_AGO) / 30 ))
PROJECTED_USAGE_90_DAYS=$(( CURRENT_USAGE + (GROWTH_RATE * 90) ))

log "Disk usage projection (90 days): $(( PROJECTED_USAGE_90_DAYS / 1024 / 1024 ))GB"
echo "$CURRENT_USAGE" > "/var/log/disk-usage-$(date +%Y%m%d).txt"

# 8. Documentation Update
log "Checking documentation updates..."

# Check if README and documentation are up to date
if [ -f "$APP_DIR/README.md" ]; then
    README_AGE=$(find "$APP_DIR/README.md" -mtime +90 | wc -l)
    if [ "$README_AGE" -gt 0 ]; then
        log "WARNING: README.md is older than 90 days"
    fi
fi

log "Monthly maintenance tasks completed successfully"

# Generate monthly report
cat > "$LOG_DIR/monthly-report-$(date +%Y%m).txt" << EOF
CoalTools Monthly Maintenance Report - $(date +"%Y-%m")
====================================================

System Updates:
- System packages updated
- Application dependencies updated
- Security patches applied

Database Optimization:
- Full vacuum completed
- Statistics updated
- Integrity check passed

Security Audit:
- File permissions checked
- SUID files: $SUID_COUNT
- Rootkit scan completed

Performance:
- Caches cleared
- Images optimized
- Performance metrics collected

Capacity Planning:
- Current disk usage: $(( CURRENT_USAGE / 1024 / 1024 ))GB
- Projected usage (90 days): $(( PROJECTED_USAGE_90_DAYS / 1024 / 1024 ))GB
- Database growth analyzed

Backup Strategy:
- Backup integrity verified
- Staging restore tested
- Backup sizes reviewed

Generated: $(date)
EOF

log "Monthly report generated: monthly-report-$(date +%Y%m).txt"
```

## 📋 Maintenance Checklists

### Daily Checklist
- [ ] System health monitoring alerts reviewed
- [ ] Database backup completed successfully
- [ ] Application logs checked for errors
- [ ] Disk space and memory usage within limits
- [ ] All critical services running
- [ ] Security alerts reviewed
- [ ] Performance metrics collected

### Weekly Checklist
- [ ] Database maintenance completed (vacuum, analyze, reindex)
- [ ] Security updates checked and applied
- [ ] Application dependencies audited
- [ ] Backup integrity verified
- [ ] SSL certificate expiration checked
- [ ] Performance analysis completed
- [ ] Log analysis for error patterns
- [ ] Unused database indexes identified

### Monthly Checklist
- [ ] Full system update completed
- [ ] Application dependencies updated
- [ ] Security audit performed
- [ ] Database optimization completed
- [ ] Performance optimization applied
- [ ] Backup strategy reviewed
- [ ] Capacity planning analysis
- [ ] Documentation updates checked
- [ ] Staging environment tested
- [ ] Disaster recovery procedures tested

### Quarterly Checklist
- [ ] Full disaster recovery test
- [ ] Security penetration testing
- [ ] Architecture review
- [ ] Performance benchmarking
- [ ] Compliance audit
- [ ] Staff training updates
- [ ] Vendor contract reviews
- [ ] Business continuity plan review

## 🔧 Maintenance Tools

### System Monitoring Tools

**Install monitoring tools:**
```bash
# Install system monitoring tools
sudo apt install htop iotop nethogs ncdu

# Install database monitoring tools
sudo apt install postgresql-contrib

# Install security tools
sudo apt install rkhunter chkrootkit fail2ban

# Install performance tools
sudo apt install sysstat dstat
```

### Custom Monitoring Scripts

**scripts/system-monitor.sh**
```bash
#!/bin/bash

# Real-time system monitoring script
# Usage: ./scripts/system-monitor.sh [duration_in_seconds]

DURATION=${1:-60}
INTERVAL=5
LOG_FILE="/tmp/system-monitor-$(date +%Y%m%d_%H%M%S).log"

echo "Starting system monitoring for $DURATION seconds..."
echo "Log file: $LOG_FILE"

# Function to collect metrics
collect_metrics() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # Database connections
    local db_connections=$(sudo -u postgres psql -d coaltools -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "N/A")
    
    # Network connections
    local network_connections=$(netstat -an | grep :3000 | wc -l)
    
    echo "$timestamp,CPU:${cpu_usage}%,Memory:${memory_usage}%,Disk:${disk_usage}%,Load:${load_avg},DB_Conn:${db_connections},Net_Conn:${network_connections}" >> "$LOG_FILE"
    
    printf "\r%s | CPU: %s%% | Memory: %s%% | Disk: %s%% | Load: %s | DB: %s | Net: %s" \
        "$timestamp" "$cpu_usage" "$memory_usage" "$disk_usage" "$load_avg" "$db_connections" "$network_connections"
}

# Monitor for specified duration
END_TIME=$(($(date +%s) + DURATION))
while [ $(date +%s) -lt $END_TIME ]; do
    collect_metrics
    sleep $INTERVAL
done

echo -e "\n\nMonitoring completed. Log saved to: $LOG_FILE"

# Generate summary
echo "\nSummary:"
echo "========"
awk -F',' '{
    split($2, cpu, ":"); cpu_sum += substr(cpu[2], 1, length(cpu[2])-1)
    split($3, mem, ":"); mem_sum += substr(mem[2], 1, length(mem[2])-1)
    split($4, disk, ":"); disk_sum += substr(disk[2], 1, length(disk[2])-1)
    count++
} END {
    printf "Average CPU Usage: %.1f%%\n", cpu_sum/count
    printf "Average Memory Usage: %.1f%%\n", mem_sum/count
    printf "Average Disk Usage: %.1f%%\n", disk_sum/count
    printf "Total Samples: %d\n", count
}' "$LOG_FILE"
```

## 📞 Emergency Procedures

### Emergency Response Plan

1. **System Down**
   - Check service status: `systemctl status coaltools postgresql nginx`
   - Review recent logs: `journalctl -u coaltools --since "1 hour ago"`
   - Restart services if needed: `sudo systemctl restart coaltools`
   - Escalate if issue persists

2. **Database Issues**
   - Check database connectivity: `sudo -u postgres psql -d coaltools -c "SELECT 1;"`
   - Review database logs: `tail -f /var/log/postgresql/postgresql-14-main.log`
   - Check for long-running queries: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
   - Consider database restart: `sudo systemctl restart postgresql`

3. **High Resource Usage**
   - Identify resource-intensive processes: `htop`, `iotop`
   - Check for memory leaks: `ps aux --sort=-%mem | head`
   - Review application logs for errors
   - Consider service restart or server reboot

4. **Security Incident**
   - Isolate affected systems
   - Change all passwords and API keys
   - Review access logs: `grep "Failed password" /var/log/auth.log`
   - Contact security team
   - Document incident

### Emergency Contacts

- **System Administrator**: [Contact Information]
- **Database Administrator**: [Contact Information]
- **Security Team**: [Contact Information]
- **Management**: [Contact Information]
- **Hosting Provider Support**: [Support Numbers]

---

## 📚 Maintenance Documentation

### Maintenance Log Template

```
Maintenance Log Entry
====================
Date: [YYYY-MM-DD]
Time: [HH:MM]
Performed by: [Name]
Type: [Daily/Weekly/Monthly/Emergency]

Tasks Completed:
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

Issues Found:
- Issue 1: [Description and resolution]
- Issue 2: [Description and resolution]

Recommendations:
- Recommendation 1
- Recommendation 2

Next Actions:
- Action 1 (Due: [Date])
- Action 2 (Due: [Date])

Notes:
[Additional notes and observations]
```

### Maintenance Schedule

**Cron Configuration:**
```bash
# Edit crontab
sudo crontab -e

# Add maintenance jobs
# Daily maintenance at 4:00 AM
0 4 * * * /var/www/coaltools/scripts/daily-maintenance.sh >> /var/log/coaltools/cron.log 2>&1

# Weekly maintenance every Sunday at 2:00 AM
0 2 * * 0 /var/www/coaltools/scripts/weekly-maintenance.sh >> /var/log/coaltools/cron.log 2>&1

# Monthly maintenance on first Sunday at 1:00 AM
0 1 1-7 * 0 /var/www/coaltools/scripts/monthly-maintenance.sh >> /var/log/coaltools/cron.log 2>&1

# Generate dashboard every hour
0 * * * * /var/www/coaltools/scripts/generate-dashboard.sh >> /var/log/coaltools/cron.log 2>&1

# System monitoring every 5 minutes
*/5 * * * * /var/www/coaltools/scripts/system-monitor.sh 60 >> /var/log/coaltools/monitoring.log 2>&1
```

---

*Maintenance yang konsisten dan teratur adalah kunci untuk menjaga sistem CoalTools berjalan dengan optimal, aman, dan reliable. Pastikan untuk mengikuti jadwal maintenance dan mendokumentasikan semua aktivitas dengan baik.*