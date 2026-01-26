#!/bin/bash
# Deployment validation script
# Comprehensive validation of the entire deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAIL_COUNT=0

check_test() {
    echo -n "  ├─ $1... "
}

pass_test() {
    echo -e "${GREEN}✓${NC}"
}

fail_test() {
    echo -e "${RED}✗${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

echo "╔════════════════════════════════════════════╗"
echo "║   Deployment Validation Suite              ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Environment validation
echo "1. Environment Configuration"
if [ -f .env.docker ]; then
    pass_test "  ├─ .env.docker exists"
    
    source .env.docker
    
    check_test "MONGO_PASSWORD is set"
    [ -n "$MONGO_PASSWORD" ] && pass_test || fail_test
    
    check_test "JWT_SECRET is set"
    [ -n "$JWT_SECRET" ] && pass_test || fail_test
    
    check_test "JWT_SECRET is not default"
    [ "$JWT_SECRET" != "changeme-to-secure-random-string" ] && pass_test || fail_test
else
    fail_test "  ├─ .env.docker missing"
fi

# Container validation
echo "2. Container Status"
check_test "MongoDB container running"
docker ps | grep -q daugherty-mongodb && pass_test || fail_test

check_test "Backend container running"
docker ps | grep -q daugherty-backend && pass_test || fail_test

check_test "Frontend container running"
docker ps | grep -q daugherty-frontend && pass_test || fail_test

# Health validation
echo "3. Service Health"
check_test "MongoDB health"
[ "$(docker inspect --format='{{.State.Health.Status}}' daugherty-mongodb)" = "healthy" ] && pass_test || fail_test

check_test "Backend health"
[ "$(docker inspect --format='{{.State.Health.Status}}' daugherty-backend)" = "healthy" ] && pass_test || fail_test

check_test "Frontend health"
[ "$(docker inspect --format='{{.State.Health.Status}}' daugherty-frontend)" = "healthy" ] && pass_test || fail_test

# API validation
echo "4. API Endpoints"
check_test "Health endpoint"
curl -f -s http://localhost:5000/api/health > /dev/null && pass_test || fail_test

check_test "Portfolio endpoint"
curl -f -s http://localhost:5000/api/portfolio > /dev/null && pass_test || fail_test

check_test "Consultations endpoint"
curl -f -s http://localhost:5000/api/consultations > /dev/null && pass_test || fail_test

# Volume validation
echo "5. Data Persistence"
check_test "MongoDB volume exists"
docker volume inspect daugherty-inc_mongodb_data &>/dev/null && pass_test || fail_test

check_test "Backend uploads volume exists"
docker volume inspect daugherty-inc_backend_uploads &>/dev/null && pass_test || fail_test

check_test "Backend logs volume exists"
docker volume inspect daugherty-inc_backend_logs &>/dev/null && pass_test || fail_test

# Network validation
echo "6. Network Configuration"
check_test "Network exists"
docker network inspect daugherty-inc_daugherty-network &>/dev/null && pass_test || fail_test

check_test "Containers on network"
NETWORK_CONTAINERS=$(docker network inspect daugherty-inc_daugherty-network | grep -o "daugherty-" | wc -l)
[ "$NETWORK_CONTAINERS" -ge 3 ] && pass_test || fail_test

echo ""
echo "════════════════════════════════════════════"
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All validation tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAIL_COUNT validation test(s) failed${NC}"
    exit 1
fi
