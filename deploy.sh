#!/bin/bash
# Unified deployment orchestrator with pre/post cache cleaning

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

cleanup_caches() {
    warn "Cleaning caches and temporary artifacts..."
    rm -rf backend/node_modules frontend/node_modules frontend/dist || true
    npm cache clean --force >/dev/null 2>&1 || true
    success "Cache cleanup complete"
}

handle_error() {
    error "Deployment failed (exit code $1 at line $2)"
    cleanup_caches
    exit "$1"
}

trap 'handle_error $? $LINENO' ERR
trap 'cleanup_caches' EXIT

echo "╔═══════════════════════════════════════════════════════╗"
echo "║        Daugherty Inc - Automated Deployment           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

log "Step 0: Pre-deploy cache cleanup"
cleanup_caches

log "Step 1: Installing dependencies (backend & frontend)"
npm run install:all
success "Dependencies installed"

log "Step 2: Building frontend"
npm run build:frontend
success "Frontend build complete"

log "Step 3: Running Docker deployment"
bash ./docker-deploy.sh
success "Docker deployment finished"

echo ""
success "Deployment pipeline completed successfully"
