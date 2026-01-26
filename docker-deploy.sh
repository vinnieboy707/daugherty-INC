#!/bin/bash
# Comprehensive Docker onboarding and deployment script
# Error-resistant and failproof deployment system

set -e  # Exit on error
trap 'error_handler $? $LINENO' ERR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handler
error_handler() {
    echo -e "${RED}✗ Error occurred in script at line $2 with exit code $1${NC}"
    echo -e "${YELLOW}Rolling back changes...${NC}"
    docker-compose down 2>/dev/null || true
    exit $1
}

# Logging
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Banner
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        Daugherty Inc - Docker Deployment System              ║"
echo "║        Error-Resistant & Failproof Onboarding                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Pre-flight checks
log_info "Step 1/10: Running pre-flight checks..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
log_success "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
log_success "Docker Compose is installed"

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    log_error "Docker daemon is not running"
    echo "Please start Docker and try again"
    exit 1
fi
log_success "Docker daemon is running"

# Check available disk space (need at least 5GB)
AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 5 ]; then
    log_warning "Low disk space: ${AVAILABLE_SPACE}GB available (5GB recommended)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    log_success "Sufficient disk space available: ${AVAILABLE_SPACE}GB"
fi

# Step 2: Environment configuration
log_info "Step 2/10: Configuring environment..."

if [ ! -f .env.docker ]; then
    log_info "Creating .env.docker from template..."
    cp .env.docker.example .env.docker
    
    # Generate secure secrets
    log_info "Generating secure secrets..."
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    MONGO_PASSWORD=$(openssl rand -hex 16 2>/dev/null || node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
    
    # Update .env.docker
    sed -i.bak "s/changeme-in-production/$MONGO_PASSWORD/g" .env.docker
    sed -i.bak "s/changeme-to-secure-random-string/$JWT_SECRET/g" .env.docker
    rm -f .env.docker.bak
    
    log_success "Environment file created with secure secrets"
    log_warning "Please review and update .env.docker with your production values"
    log_warning "Especially: FRONTEND_URL, VITE_API_URL, and optional email/AI settings"
    
    read -p "Press Enter to continue after reviewing .env.docker..."
else
    log_success "Environment file already exists"
fi

# Step 3: Validate environment
log_info "Step 3/10: Validating environment configuration..."

source .env.docker

REQUIRED_VARS=("MONGO_USER" "MONGO_PASSWORD" "JWT_SECRET")
ALL_VALID=true

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        log_error "Required variable $VAR is not set"
        ALL_VALID=false
    fi
done

if [ "$ALL_VALID" = false ]; then
    log_error "Environment validation failed"
    exit 1
fi

if [ "$JWT_SECRET" = "changeme-to-secure-random-string" ]; then
    log_error "JWT_SECRET has not been changed from default"
    exit 1
fi

log_success "Environment validation passed"

# Step 4: Stop any existing containers
log_info "Step 4/10: Stopping existing containers..."

if docker-compose ps -q 2>/dev/null | grep -q .; then
    log_info "Stopping running containers..."
    docker-compose down
    log_success "Existing containers stopped"
else
    log_success "No existing containers to stop"
fi

# Step 5: Pull latest images
log_info "Step 5/10: Pulling latest base images..."

docker pull mongo:7
log_success "Base images pulled"

# Step 6: Build application images
log_info "Step 6/10: Building application images..."

docker-compose build --no-cache
if [ $? -eq 0 ]; then
    log_success "Application images built successfully"
else
    log_error "Failed to build application images"
    exit 1
fi

# Step 7: Create required directories
log_info "Step 7/10: Creating required directories..."

mkdir -p backend/uploads/portfolio backend/uploads/consultations backend/logs
chmod -R 777 backend/uploads backend/logs
log_success "Directories created with proper permissions"

# Step 8: Start services
log_info "Step 8/10: Starting services..."

docker-compose --env-file .env.docker up -d

if [ $? -eq 0 ]; then
    log_success "Services started successfully"
else
    log_error "Failed to start services"
    exit 1
fi

# Step 9: Wait for services to be healthy
log_info "Step 9/10: Waiting for services to become healthy..."

MAX_WAIT=120
WAIT_TIME=0

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    MONGO_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' daugherty-mongodb 2>/dev/null || echo "starting")
    BACKEND_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' daugherty-backend 2>/dev/null || echo "starting")
    FRONTEND_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' daugherty-frontend 2>/dev/null || echo "starting")
    
    if [ "$MONGO_HEALTHY" = "healthy" ] && [ "$BACKEND_HEALTHY" = "healthy" ] && [ "$FRONTEND_HEALTHY" = "healthy" ]; then
        log_success "All services are healthy!"
        break
    fi
    
    echo -n "."
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
done

echo ""

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    log_error "Services failed to become healthy within ${MAX_WAIT} seconds"
    log_info "Checking container logs..."
    docker-compose logs --tail=50
    exit 1
fi

# Step 10: Run health checks
log_info "Step 10/10: Running comprehensive health checks..."

# Test MongoDB
log_info "Testing MongoDB connection..."
if docker exec daugherty-mongodb mongosh \
    -u "$MONGO_USER" \
    -p "$MONGO_PASSWORD" \
    --authenticationDatabase admin \
    --eval "db.adminCommand('ping')" \
    --quiet &>/dev/null; then
    log_success "MongoDB is accessible"
else
    log_error "MongoDB connection failed"
    exit 1
fi

# Test Backend API
log_info "Testing Backend API..."
sleep 5  # Give backend a moment
BACKEND_PORT=${BACKEND_PORT:-5000}
if curl -f -s http://localhost:$BACKEND_PORT/api/health > /dev/null; then
    log_success "Backend API is responding"
else
    log_warning "Backend API health check failed, checking logs..."
    docker logs daugherty-backend --tail=20
fi

# Test Frontend
log_info "Testing Frontend..."
FRONTEND_PORT=${FRONTEND_PORT:-80}
if curl -f -s http://localhost:$FRONTEND_PORT > /dev/null; then
    log_success "Frontend is accessible"
else
    log_warning "Frontend health check failed"
fi

# Deployment complete!
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║              🎉 DEPLOYMENT SUCCESSFUL! 🎉                     ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

log_success "Daugherty Inc is now running!"
echo ""
echo "Access your application:"
echo "  Frontend:     http://localhost:${FRONTEND_PORT:-80}"
echo "  Backend API:  http://localhost:${BACKEND_PORT:-5000}/api"
echo "  Health Check: http://localhost:${BACKEND_PORT:-5000}/api/health"
echo ""
echo "Useful commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop services:    docker-compose stop"
echo "  Restart services: docker-compose restart"
echo "  Check status:     docker-compose ps"
echo "  Run backup:       docker-compose run --rm backup"
echo ""
echo "Documentation:"
echo "  DOCKER_DEPLOYMENT.md     - Complete Docker guide"
echo "  PRODUCTION_CHECKLIST.md  - Production checklist"
echo "  FULLSTACK_README.md      - Development guide"
echo ""
log_warning "Remember to:"
log_warning "  1. Review and update .env.docker with production values"
log_warning "  2. Set up SSL/HTTPS for production"
log_warning "  3. Configure regular backups"
log_warning "  4. Set up monitoring and alerts"
echo ""
