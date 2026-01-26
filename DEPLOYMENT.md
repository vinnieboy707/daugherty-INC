# Deployment Guide - Daugherty Inc

## 🚀 Production Deployment

This guide covers deploying the Daugherty Inc application to production.

### Automated deployment

For an end-to-end, order-safe flow with cache cleaning and failure rollback:

```bash
# From repo root
chmod +x deploy.sh
npm run deploy
```

This will:
- Clean caches before/after
- Install backend/frontend deps
- Build the frontend
- Run the Docker deployment script

### Prerequisites

- Node.js 18+ installed on production server
- MongoDB database (local or cloud like MongoDB Atlas)
- Domain name configured
- SSL certificate (recommend Let's Encrypt)
- Process manager (PM2 recommended)

## Backend Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MongoDB (if hosting locally)
# Or use MongoDB Atlas for cloud database
```

### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/vinnieboy707/daugherty-INC.git
cd daugherty-INC

# Install dependencies
npm run install:backend

# Configure environment
cd backend
cp .env.production.example .env
nano .env  # Edit with your production values
```

### 3. Required Environment Variables

Edit `backend/.env` with these REQUIRED values:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/daugherty-inc
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=<generate-secure-random-string>
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Create Upload Directories

```bash
mkdir -p backend/uploads/portfolio
mkdir -p backend/uploads/consultations
mkdir -p backend/logs
```

### 5. Start Backend with PM2

```bash
# From project root
pm2 start ecosystem.config.json

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs
```

### 6. PM2 Management Commands

```bash
# View logs
pm2 logs daugherty-backend

# Monitor
pm2 monit

# Restart
pm2 restart daugherty-backend

# Stop
pm2 stop daugherty-backend

# Delete
pm2 delete daugherty-backend
```

## Frontend Deployment

### Option 1: Static Hosting (Vercel, Netlify, etc.)

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts
# Set build command: npm run build
# Set output directory: dist
```

#### Environment Variables (Vercel Dashboard)

```
VITE_API_URL=https://api.yourdomain.com/api
```

#### Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy from frontend directory
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Option 2: Self-Hosted with Nginx

```bash
# Build frontend
cd frontend
npm install
npm run build

# Copy build to web root
sudo cp -r dist/* /var/www/yourdomain.com/html/
```

#### Nginx Configuration

Create `/etc/nginx/sites-available/daugherty-inc`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/yourdomain.com/html;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;
    gzip_disable "MSIE [1-6]\.";
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/daugherty-inc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Add database user
4. Whitelist IP addresses (or allow from anywhere for dynamic IPs)
5. Get connection string
6. Update `MONGODB_URI` in `.env`

### Local MongoDB

```bash
# Install MongoDB
sudo apt install mongodb-server

# Start service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Connection string for local
MONGODB_URI=mongodb://localhost:27017/daugherty-inc
```

## Security Checklist

- [ ] Environment variables configured correctly
- [ ] JWT_SECRET is strong and random
- [ ] MongoDB credentials are secure
- [ ] CORS origins restricted to your domain
- [ ] SSL certificate installed and working
- [ ] File upload limits configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular backups configured
- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] Logs are being collected
- [ ] Monitoring is set up

## Monitoring & Maintenance

### Log Management

```bash
# View PM2 logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f backend/logs/app.log
```

### Backup Strategy

```bash
# MongoDB backup
mongodump --uri="$MONGODB_URI" --out=/backup/$(date +%Y%m%d)

# Uploaded files backup
tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz backend/uploads/
```

### Updates

```bash
# Pull latest code
git pull origin main

# Update dependencies
npm run install:backend
cd frontend && npm install

# Rebuild frontend
npm run build

# Restart backend
pm2 restart daugherty-backend

# Redeploy frontend
# (Copy new build to web root or redeploy to Vercel/Netlify)
```

## Testing Production

### Health Check

```bash
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T...",
  "uptime": 1234.56,
  "environment": "production"
}
```

### Frontend

Visit: https://yourdomain.com

Test:
- Home page loads
- Portfolio page displays
- Booking form works
- AI assistant responds
- Admin dashboard accessible
- Image uploads work

## Performance Optimization

### Backend

- Use PM2 cluster mode (already configured)
- Enable MongoDB indexes
- Implement caching (Redis)
- Use CDN for static assets

### Frontend

- Build is already optimized with Vite
- Images are optimized with Sharp
- Gzip compression enabled
- Lazy loading implemented

## Troubleshooting

### Backend won't start

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs daugherty-backend

# Common issues:
# - MongoDB connection failed: Check MONGODB_URI
# - Port already in use: Check if another process is using port 5000
# - Missing environment variables: Check .env file
```

### Frontend not loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Check SSL certificate
sudo certbot certificates
```

### Database connection issues

```bash
# Test MongoDB connection
mongosh "$MONGODB_URI"

# Check MongoDB Atlas IP whitelist
# Check database user credentials
```

## Support

For issues or questions:
- Check logs first
- Review configuration files
- Consult the FULLSTACK_README.md
- Open an issue on GitHub

## Quick Commands Reference

```bash
# Start everything
pm2 start ecosystem.config.json

# Stop everything
pm2 stop all

# Restart backend
pm2 restart daugherty-backend

# View logs
pm2 logs

# Monitor
pm2 monit

# Deploy frontend (Vercel)
cd frontend && vercel --prod

# Backup database
mongodump --uri="$MONGODB_URI" --out=/backup/$(date +%Y%m%d)
```

---

**Production Ready!** 🚀

Your Daugherty Inc application is now production-ready and deployed!
