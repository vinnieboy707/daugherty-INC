#!/bin/bash
# Comprehensive health check script
# Tests all services and provides detailed status

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_check() {
    echo -n "Checking $1... "
}

log_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
}

log_fail() {
    echo -e "${RED}✗ FAIL${NC} - $1"
}

log_warn() {
    echo -e "${YELLOW}⚠ WARN${NC} - $1"
}

echo "╔═══════════════════════════════════════╗"
echo "║   Daugherty Inc Health Check          ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check if containers are running
log_check "Container status"
CONTAINERS=$(docker-compose ps -q)
if [ -z "$CONTAINERS" ]; then
    log_fail "No containers running"
    exit 1
fi
log_pass

# Check MongoDB
log_check "MongoDB"
if docker exec daugherty-mongodb mongosh --eval "db.adminCommand('ping')" --quiet &>/dev/null; then
    log_pass
else
    log_fail "Cannot connect to MongoDB"
fi

# Check Backend
log_check "Backend API"
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$BACKEND_RESPONSE" = "200" ]; then
    log_pass
else
    log_fail "Backend returned HTTP $BACKEND_RESPONSE"
fi

# Check Frontend
log_check "Frontend"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    log_pass
else
    log_fail "Frontend returned HTTP $FRONTEND_RESPONSE"
fi

# Check disk space
log_check "Disk space"
AVAILABLE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE" -gt 2 ]; then
    log_pass
else
    log_warn "Low disk space: ${AVAILABLE}GB"
fi

# Check memory
log_check "Memory usage"
MONGO_MEM=$(docker stats daugherty-mongodb --no-stream --format "{{.MemUsage}}" | awk '{print $1}' | sed 's/MiB//')
BACKEND_MEM=$(docker stats daugherty-backend --no-stream --format "{{.MemUsage}}" | awk '{print $1}' | sed 's/MiB//')
if [ "${MONGO_MEM%.*}" -lt 1000 ] && [ "${BACKEND_MEM%.*}" -lt 1000 ]; then
    log_pass
else
    log_warn "High memory usage"
fi

echo ""
echo "Health check complete!"
