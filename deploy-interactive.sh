#!/bin/bash
# Interactive Deployment Orchestrator for Daugherty Inc
# Runs all necessary scripts in the correct order with user interaction

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Logging functions
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_header() { echo -e "${BOLD}${CYAN}$1${NC}"; }

# Progress bar function
show_progress() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local completed=$((width * current / total))
    local remaining=$((width - completed))
    
    printf "\rProgress: ["
    printf "%${completed}s" | tr ' ' '█'
    printf "%${remaining}s" | tr ' ' '░'
    printf "] %3d%%" "$percentage"
}

# Display banner
display_banner() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                ║${NC}"
    echo -e "${CYAN}║${NC}        ${BOLD}${MAGENTA}Daugherty Inc - Interactive Deployment System${NC}        ${CYAN}║${NC}"
    echo -e "${CYAN}║                                                                ║${NC}"
    echo -e "${CYAN}║${NC}    ${GREEN}Intelligent orchestration for efficient deployment${NC}       ${CYAN}║${NC}"
    echo -e "${CYAN}║                                                                ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_header "🔍 Checking Prerequisites..."
    echo ""
    
    local all_ok=true
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_success "Node.js installed: $node_version"
    else
        log_error "Node.js is not installed (required: 18+)"
        all_ok=false
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        log_success "npm installed: v$npm_version"
    else
        log_error "npm is not installed"
        all_ok=false
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        log_success "Docker installed: $(docker --version | cut -d' ' -f3)"
    else
        log_warn "Docker not installed (optional for Docker deployment)"
    fi
    
    # Check Docker Compose (optional) - prioritize newer 'docker compose'
    if docker compose version &> /dev/null; then
        log_success "Docker Compose available (v2)"
    elif command -v docker-compose &> /dev/null; then
        log_success "Docker Compose available (legacy)"
    else
        log_warn "Docker Compose not available (optional for Docker deployment)"
    fi
    
    # Check disk space
    local available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -ge 5 ]; then
        log_success "Disk space available: ${available_space}GB"
    else
        log_warn "Low disk space: ${available_space}GB (5GB recommended)"
    fi
    
    echo ""
    
    if [ "$all_ok" = false ]; then
        log_error "Prerequisites check failed. Please install missing dependencies."
        return 1
    fi
    
    log_success "All prerequisites met!"
    return 0
}

# Cleanup function for caches and artifacts
cleanup_artifacts() {
    log_info "Cleaning caches and build artifacts..."
    rm -rf backend/node_modules frontend/node_modules frontend/dist || true
    npm cache clean --force >/dev/null 2>&1 || true
    log_success "Cleanup completed"
}

# Display deployment menu
display_menu() {
    echo ""
    log_header "📋 Select Deployment Mode:"
    echo ""
    echo "  1) 🚀 Quick Start - Initial setup for new installation"
    echo "  2) 💻 Development - Setup for local development"
    echo "  3) 🏗️  Production Build - Build for production deployment"
    echo "  4) 🐳 Docker Deployment - Full Docker containerized deployment"
    echo "  5) 🔄 Update Only - Pull latest changes and rebuild"
    echo "  6) 🧹 Clean & Rebuild - Clean all caches and rebuild from scratch"
    echo "  7) 🧪 Test Build - Validate build without deployment"
    echo "  8) ℹ️  Show Status - Display current deployment status"
    echo "  9) ❌ Exit"
    echo ""
}

# Quick Start Mode
mode_quick_start() {
    log_header "🚀 Quick Start - Initial Setup"
    echo ""
    
    log_info "This will set up the application for the first time"
    log_info "Steps: Prerequisites → Install Dependencies → Configure Environment → Build"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    local steps=4
    local current=0
    
    # Step 1: Run setup script
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Running setup script..."
    if bash ./setup.sh; then
        log_success "Setup completed"
    else
        log_error "Setup failed"
        return 1
    fi
    
    # Step 2: Check for environment files
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Checking environment configuration..."
    
    if [ ! -f backend/.env ]; then
        log_warn "Backend .env not found. Please configure backend/.env"
        read -p "Press Enter after configuring backend/.env..."
    else
        log_success "Backend environment configured"
    fi
    
    if [ ! -f frontend/.env ]; then
        log_info "Frontend .env not required for development"
    fi
    
    # Step 3: Build frontend
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Building frontend..."
    if npm run build:frontend; then
        log_success "Frontend built successfully"
    else
        log_error "Frontend build failed"
        return 1
    fi
    
    # Step 4: Complete
    ((current++))
    show_progress $current $steps
    echo ""
    echo ""
    log_success "Quick Start completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  • Start MongoDB (if using local MongoDB)"
    echo "  • Run 'npm run dev' to start development servers"
    echo "  • Access frontend at http://localhost:5173"
    echo "  • Access backend at http://localhost:5000"
    echo ""
}

# Development Mode
mode_development() {
    log_header "💻 Development Setup"
    echo ""
    
    log_info "This will prepare the environment for local development"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    local steps=3
    local current=0
    
    # Install dependencies
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Installing dependencies..."
    npm run install:all
    log_success "Dependencies installed"
    
    # Check MongoDB
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Checking MongoDB..."
    if command -v mongod &> /dev/null; then
        log_success "MongoDB is installed"
    else
        log_warn "MongoDB not found. You'll need MongoDB for the backend."
        log_warn "Install from: https://docs.mongodb.com/manual/installation/"
    fi
    
    # Complete
    ((current++))
    show_progress $current $steps
    echo ""
    echo ""
    log_success "Development environment ready!"
    echo ""
    echo "Start development with: npm run dev"
    echo ""
}

# Production Build Mode
mode_production_build() {
    log_header "🏗️  Production Build"
    echo ""
    
    log_info "This will create optimized production builds"
    log_warn "This will clean caches and rebuild everything"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    local steps=5
    local current=0
    
    # Clean caches
    ((current++))
    show_progress $current $steps
    echo ""
    cleanup_artifacts
    
    # Install backend dependencies
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Installing backend dependencies..."
    npm run install:backend
    log_success "Backend dependencies installed"
    
    # Install frontend dependencies
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Installing frontend dependencies..."
    npm run install:frontend
    log_success "Frontend dependencies installed"
    
    # Build frontend
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Building frontend (optimized)..."
    npm run build:frontend
    log_success "Frontend built"
    
    # Complete
    ((current++))
    show_progress $current $steps
    echo ""
    echo ""
    log_success "Production build completed!"
    echo ""
    echo "Built artifacts:"
    echo "  • Frontend: frontend/dist/"
    echo "  • Backend: backend/src/"
    echo ""
    echo "Deploy with PM2 or your preferred process manager"
    echo ""
}

# Docker Deployment Mode
mode_docker_deployment() {
    log_header "🐳 Docker Deployment"
    echo ""
    
    log_info "This will deploy the full application using Docker"
    log_warn "This will run the comprehensive Docker deployment script"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    log_info "Running Docker deployment script..."
    echo ""
    
    if bash ./docker-deploy.sh; then
        log_success "Docker deployment completed!"
    else
        log_error "Docker deployment failed"
        return 1
    fi
}

# Update Only Mode
mode_update_only() {
    log_header "🔄 Update Only"
    echo ""
    
    log_info "This will pull latest changes and rebuild"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    local steps=4
    local current=0
    
    # Pull changes
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Pulling latest changes from git..."
    if [ -d .git ]; then
        if git pull; then
            log_success "Git pull completed"
        else
            log_warn "Git pull failed - check for conflicts or connection issues"
        fi
    else
        log_warn "Not a git repository - skipping git pull"
    fi
    
    # Update dependencies
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Updating dependencies..."
    npm run install:all
    log_success "Dependencies updated"
    
    # Rebuild frontend
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Rebuilding frontend..."
    npm run build:frontend
    log_success "Frontend rebuilt"
    
    # Complete
    ((current++))
    show_progress $current $steps
    echo ""
    echo ""
    log_success "Update completed!"
    echo ""
}

# Clean and Rebuild Mode
mode_clean_rebuild() {
    log_header "🧹 Clean & Rebuild"
    echo ""
    
    log_warn "This will delete all build artifacts, caches, and node_modules"
    log_warn "Then rebuild everything from scratch"
    echo ""
    read -p "Are you sure? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    local steps=4
    local current=0
    
    # Clean everything
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Removing node_modules..."
    rm -rf backend/node_modules frontend/node_modules node_modules || true
    
    ((current++))
    show_progress $current $steps
    echo ""
    cleanup_artifacts
    
    # Reinstall and rebuild
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Installing all dependencies..."
    npm run install:all
    log_success "Dependencies installed"
    
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Building frontend..."
    npm run build:frontend
    log_success "Frontend built"
    
    ((current++))
    show_progress $current $steps
    echo ""
    echo ""
    log_success "Clean rebuild completed!"
    echo ""
}

# Test Build Mode
mode_test_build() {
    log_header "🧪 Test Build"
    echo ""
    
    log_info "This will validate the build without deployment"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 0
    fi
    
    local steps=3
    local current=0
    local all_ok=true
    
    # Test backend
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Testing backend setup..."
    if [ -f backend/package.json ]; then
        log_success "Backend package.json found"
        if [ -d backend/node_modules ]; then
            log_success "Backend dependencies installed"
        else
            log_warn "Backend dependencies not installed"
            all_ok=false
        fi
    else
        log_error "Backend package.json not found"
        all_ok=false
    fi
    
    # Test frontend
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Testing frontend setup..."
    if [ -f frontend/package.json ]; then
        log_success "Frontend package.json found"
        if [ -d frontend/node_modules ]; then
            log_success "Frontend dependencies installed"
        else
            log_warn "Frontend dependencies not installed"
            all_ok=false
        fi
    else
        log_error "Frontend package.json not found"
        all_ok=false
    fi
    
    # Test build
    ((current++))
    show_progress $current $steps
    echo ""
    log_info "Attempting test build..."
    local build_log="./build-test.log"
    if npm run build:frontend > "$build_log" 2>&1; then
        log_success "Test build successful"
        rm -f "$build_log"
    else
        log_error "Test build failed"
        log_info "Check $build_log for details"
        all_ok=false
    fi
    
    echo ""
    if [ "$all_ok" = true ]; then
        log_success "All tests passed!"
    else
        log_warn "Some tests failed. Please review the output above."
    fi
    echo ""
}

# Show Status Mode
mode_show_status() {
    log_header "ℹ️  Current Status"
    echo ""
    
    # Check dependencies
    echo -e "${BOLD}Dependencies:${NC}"
    if [ -d backend/node_modules ]; then
        log_success "Backend dependencies: Installed"
    else
        log_warn "Backend dependencies: Not installed"
    fi
    
    if [ -d frontend/node_modules ]; then
        log_success "Frontend dependencies: Installed"
    else
        log_warn "Frontend dependencies: Not installed"
    fi
    echo ""
    
    # Check builds
    echo -e "${BOLD}Build Artifacts:${NC}"
    if [ -d frontend/dist ]; then
        local file_count=$(find frontend/dist -type f | wc -l)
        log_success "Frontend build: Exists ($file_count files)"
    else
        log_warn "Frontend build: Not found"
    fi
    echo ""
    
    # Check environment
    echo -e "${BOLD}Environment:${NC}"
    if [ -f backend/.env ]; then
        log_success "Backend .env: Configured"
    else
        log_warn "Backend .env: Not found"
    fi
    
    if [ -f .env.docker ]; then
        log_success "Docker .env: Configured"
    else
        log_info "Docker .env: Not configured (optional)"
    fi
    echo ""
    
    # Check Docker
    echo -e "${BOLD}Docker Status:${NC}"
    if command -v docker &> /dev/null; then
        if docker ps &> /dev/null; then
            local running=$(docker ps --filter "name=daugherty" --format "{{.Names}}" | wc -l)
            if [ "$running" -gt 0 ]; then
                log_success "Docker containers running: $running"
                docker ps --filter "name=daugherty" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            else
                log_info "Docker: No containers running"
            fi
        else
            log_warn "Docker daemon not running"
        fi
    else
        log_info "Docker: Not installed"
    fi
    echo ""
}

# Main function
main() {
    # Check if running in correct directory
    if [ ! -f package.json ]; then
        log_error "Must be run from the project root directory"
        exit 1
    fi
    
    display_banner
    
    # Check prerequisites first
    if ! check_prerequisites; then
        echo ""
        read -p "Press Enter to exit..."
        exit 1
    fi
    
    # Main loop
    while true; do
        display_menu
        read -p "Select option [1-9]: " choice
        echo ""
        
        case $choice in
            1)
                mode_quick_start
                ;;
            2)
                mode_development
                ;;
            3)
                mode_production_build
                ;;
            4)
                mode_docker_deployment
                ;;
            5)
                mode_update_only
                ;;
            6)
                mode_clean_rebuild
                ;;
            7)
                mode_test_build
                ;;
            8)
                mode_show_status
                ;;
            9)
                log_info "Exiting..."
                exit 0
                ;;
            *)
                log_error "Invalid option. Please select 1-9."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to return to menu..."
        display_banner
    done
}

# Run main function
main
