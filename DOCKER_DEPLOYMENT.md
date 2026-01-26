# 🐳 Docker Deployment Guide

This guide covers deploying the Daugherty Inc application using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/vinnieboy707/daugherty-INC.git
cd daugherty-INC
```

### 2. Configure Environment

```bash
# Copy environment example
cp .env.docker.example .env.docker

# Edit with your values
nano .env.docker
```

**Required changes:**
- `MONGO_PASSWORD` - Set a strong password
- `JWT_SECRET` - Generate a secure random string
- `FRONTEND_URL` - Your production domain (e.g., https://yourdomain.com)

### 3. Start Application

```bash
# Build and start all services
docker-compose --env-file .env.docker up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health
- **MongoDB**: localhost:27017

## Production Deployment

### 1. Update Environment Variables

Edit `.env.docker`:

```env
MONGO_USER=admin
MONGO_PASSWORD=<strong-random-password>
JWT_SECRET=<secure-random-string>
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
```

### 2. Build Production Images

```bash
# Build with production flag
docker-compose --env-file .env.docker build --no-cache

# Verify images
docker images | grep daugherty
```

### 3. Deploy

```bash
# Start in detached mode
docker-compose --env-file .env.docker up -d

# Verify all services are healthy
docker-compose ps
```

### 4. SSL/HTTPS Setup

#### Option 1: Using Nginx Reverse Proxy

Create nginx config on host:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:5000;
    }
}
```

#### Option 2: Using Traefik

Add Traefik service to `docker-compose.yml`:

```yaml
traefik:
  image: traefik:v2.10
  command:
    - "--api.insecure=true"
    - "--providers.docker=true"
    - "--entrypoints.web.address=:80"
    - "--entrypoints.websecure.address=:443"
    - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
    - "--certificatesresolvers.myresolver.acme.email=admin@yourdomain.com"
    - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - "/var/run/docker.sock:/var/run/docker.sock:ro"
    - "./letsencrypt:/letsencrypt"
```

## Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop backend
```

### Remove Everything

```bash
# Stop and remove containers
docker-compose down

# Remove containers, volumes, and images
docker-compose down -v --rmi all
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build --no-cache

# Restart services
docker-compose down
docker-compose up -d
```

## Database Management

### Backup Database

```bash
# Create backup
docker-compose exec mongodb mongodump \
  --username admin \
  --password changeme \
  --authenticationDatabase admin \
  --out /data/backup/$(date +%Y%m%d)

# Copy backup to host
docker cp daugherty-mongodb:/data/backup ./backups/
```

### Restore Database

```bash
# Copy backup to container
docker cp ./backups/20260126 daugherty-mongodb:/data/restore/

# Restore
docker-compose exec mongodb mongorestore \
  --username admin \
  --password changeme \
  --authenticationDatabase admin \
  /data/restore/20260126
```

### Access MongoDB Shell

```bash
docker-compose exec mongodb mongosh \
  -u admin \
  -p changeme \
  --authenticationDatabase admin \
  daugherty-inc
```

## Backup Strategy

### Automated Backups

Create backup script `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongodb mongodump \
  --username admin \
  --password ${MONGO_PASSWORD} \
  --authenticationDatabase admin \
  --archive > $BACKUP_DIR/mongodb.archive

# Backup uploaded files
docker cp daugherty-backend:/app/uploads $BACKUP_DIR/

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

Add to crontab:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost/

# Container health
docker-compose ps
```

### Resource Usage

```bash
# Monitor resources
docker stats

# Specific container
docker stats daugherty-backend
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - MongoDB connection: Verify MONGODB_URI in .env.docker
# - Port conflict: Check if port 5000 is in use
# - Missing environment: Ensure .env.docker is loaded
```

### Frontend not loading

```bash
# Check logs
docker-compose logs frontend

# Verify build
docker-compose exec frontend ls -la /usr/share/nginx/html

# Check nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

### Database connection issues

```bash
# Check MongoDB status
docker-compose ps mongodb

# Test connection
docker-compose exec backend node -e \
  "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

### Container keeps restarting

```bash
# View recent logs
docker-compose logs --tail=50 backend

# Check exit code
docker-compose ps

# Inspect container
docker inspect daugherty-backend
```

## Performance Optimization

### Production Configuration

Update `docker-compose.yml` for production:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 1G
      reservations:
        cpus: '1'
        memory: 512M
  environment:
    NODE_ENV: production
```

### Enable Logging Driver

```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

## Security Best Practices

1. **Change default passwords** in `.env.docker`
2. **Use secrets** instead of environment variables for sensitive data
3. **Run as non-root** user in containers
4. **Enable Docker security scanning**
5. **Keep images updated**
6. **Use private registry** for production images
7. **Enable firewall** on host machine
8. **Regular security audits**

## Scaling

### Horizontal Scaling

```yaml
backend:
  deploy:
    replicas: 3
  # Add load balancer (nginx, traefik, etc.)
```

### Vertical Scaling

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 2G
```

## CI/CD Integration

### GitHub Actions Example

See `.github/workflows/docker-deploy.yml` (to be created)

### Manual Deployment

```bash
# Build
docker-compose build

# Tag
docker tag daugherty-backend:latest registry.example.com/daugherty-backend:v1.0

# Push
docker push registry.example.com/daugherty-backend:v1.0

# Deploy on production server
docker pull registry.example.com/daugherty-backend:v1.0
docker-compose up -d
```

## Useful Commands Reference

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Stop
docker-compose stop

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Status
docker-compose ps

# Execute command
docker-compose exec backend sh

# Remove
docker-compose down

# Remove with volumes
docker-compose down -v

# Backup DB
docker-compose exec mongodb mongodump --archive > backup.archive

# Restore DB
docker-compose exec -T mongodb mongorestore --archive < backup.archive
```

---

**Docker Deployment Complete!** 🐳

Your application is now running in containers with MongoDB, backend API, and frontend all configured and ready!
