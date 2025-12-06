# Production Setup Guide

## Running on a Web Server (Linux/Windows Server)

### Prerequisites
- Node.js v20+
- PostgreSQL 14+
- PM2 (process manager)
- 2GB+ RAM recommended

### Linux/Unix Server Setup

```bash
# 1. Clone/Extract project
cd /home/username/billing-system

# 2. Install dependencies
npm install

# 3. Build the application
npm run build

# 4. Start with PM2
pm2 start npm --name "billing-system" -- start

# 5. Enable PM2 startup (auto-restart on reboot)
pm2 startup systemd -u username --hp /home/username
pm2 save

# 6. View logs
pm2 logs billing-system
```

### Windows Server Setup

1. **Using batch file (recommended):**
   ```bash
   prod.bat
   ```

2. **Manual setup:**
   ```bash
   npm install
   npm run build
   pm2 start "npm run start" --name "billing-system"
   pm2 startup windows
   pm2 save
   ```

### Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache Reverse Proxy (Optional)

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
</VirtualHost>
```

## Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/billing_system

# Node Environment
NODE_ENV=production

# Server Port (optional, default 5000)
PORT=5000
```

## Database Setup for Production

### PostgreSQL Configuration

1. **Create dedicated user:**
```bash
psql -U postgres

CREATE USER billing_user WITH PASSWORD 'secure_password';
CREATE DATABASE billing_system OWNER billing_user;

GRANT CONNECT ON DATABASE billing_system TO billing_user;
GRANT USAGE ON SCHEMA public TO billing_user;
GRANT CREATE ON SCHEMA public TO billing_user;
```

2. **Configure for backups:**
```bash
# Daily backup cron job (Linux)
0 2 * * * pg_dump -U billing_user billing_system > /backups/billing_$(date +\%Y\%m\%d).sql
```

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Use strong admin credentials during setup
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Configure firewall rules
- [ ] Regular database backups
- [ ] Monitor disk space
- [ ] Keep Node.js and dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable PM2 auto-restart on crash

## Monitoring

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Memory usage
pm2 info billing-system

# Logs
pm2 logs billing-system --lines 100
```

### Database Maintenance
```bash
# Analyze query performance
ANALYZE;

# Vacuum (clean up)
VACUUM;

# Full maintenance
REINDEX DATABASE billing_system;
```

## Scaling (Multiple Instances)

```bash
# Cluster mode with 4 instances
pm2 start "npm run start" -i 4 --name "billing-system"

# With load balancer
pm2 start "npm run start" -i max --name "billing-system"
```

## Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs billing-system

# Verify database connection
psql -U username -d billing_system -c "SELECT 1"
```

### High memory usage
```bash
# Restart with memory limit
pm2 restart billing-system --max-memory-restart 1G
```

### Port already in use
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Backup Strategy

```bash
# Daily backup
pg_dump -U billing_user billing_system > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_*.sql

# Upload to remote storage
# (Implement your backup mechanism)
```

---

**For offline installation on Windows, use `dev.bat` or `prod.bat`**
