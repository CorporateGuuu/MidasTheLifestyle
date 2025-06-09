#!/bin/bash

# Deployment Script for Midas The Lifestyle
# Comprehensive production deployment with safety checks and monitoring

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_ENV="${1:-staging}"
FORCE_DEPLOY="${2:-false}"

# Deployment settings
FRONTEND_DIR="$PROJECT_ROOT/frontend"
FUNCTIONS_DIR="$PROJECT_ROOT/netlify/functions"
BUILD_DIR="$FRONTEND_DIR/build"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"

# Netlify settings
NETLIFY_SITE_ID_STAGING="${NETLIFY_STAGING_SITE_ID:-}"
NETLIFY_SITE_ID_PRODUCTION="${NETLIFY_SITE_ID:-}"
NETLIFY_AUTH_TOKEN="${NETLIFY_AUTH_TOKEN:-}"

# Logging
LOG_FILE="$PROJECT_ROOT/deployment/logs/deploy_$(date +%Y%m%d_%H%M%S).log"
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
        *)       echo -e "${CYAN}[$level]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
}

# Error handler
error_handler() {
    local line_number="$1"
    log "ERROR" "Deployment failed at line $line_number"
    log "ERROR" "Check the log file: $LOG_FILE"
    
    # Cleanup on error
    cleanup_on_error
    exit 1
}

# Set error trap
trap 'error_handler $LINENO' ERR

# Cleanup function
cleanup_on_error() {
    log "WARN" "Cleaning up after error..."
    
    # Remove incomplete build artifacts
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
        log "INFO" "Removed incomplete build directory"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "INFO" "🔍 Running pre-deployment checks..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]] && [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
        log "ERROR" "Not in a valid Midas The Lifestyle project directory"
        exit 1
    fi
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2)
    local required_version="18.0.0"
    
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    log "INFO" "Node.js version: $node_version"
    
    # Check npm version
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm is not installed"
        exit 1
    fi
    
    local npm_version=$(npm --version)
    log "INFO" "npm version: $npm_version"
    
    # Check Netlify CLI
    if ! command -v netlify &> /dev/null; then
        log "WARN" "Netlify CLI not found, installing..."
        npm install -g netlify-cli
    fi
    
    # Check environment variables
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        if [[ -z "$NETLIFY_SITE_ID_PRODUCTION" ]]; then
            log "ERROR" "NETLIFY_SITE_ID not set for production deployment"
            exit 1
        fi
    elif [[ "$DEPLOYMENT_ENV" == "staging" ]]; then
        if [[ -z "$NETLIFY_SITE_ID_STAGING" ]]; then
            log "ERROR" "NETLIFY_STAGING_SITE_ID not set for staging deployment"
            exit 1
        fi
    fi
    
    if [[ -z "$NETLIFY_AUTH_TOKEN" ]]; then
        log "ERROR" "NETLIFY_AUTH_TOKEN not set"
        exit 1
    fi
    
    # Check Git status
    if [[ "$DEPLOYMENT_ENV" == "production" ]] && [[ "$FORCE_DEPLOY" != "true" ]]; then
        if ! git diff-index --quiet HEAD --; then
            log "ERROR" "Working directory is not clean. Commit changes or use --force"
            exit 1
        fi
        
        local current_branch=$(git rev-parse --abbrev-ref HEAD)
        if [[ "$current_branch" != "main" ]]; then
            log "ERROR" "Production deployment must be from main branch (current: $current_branch)"
            exit 1
        fi
    fi
    
    log "INFO" "✅ Pre-deployment checks passed"
}

# Install dependencies
install_dependencies() {
    log "INFO" "📦 Installing dependencies..."
    
    # Frontend dependencies
    if [[ -f "$FRONTEND_DIR/package.json" ]]; then
        log "INFO" "Installing frontend dependencies..."
        cd "$FRONTEND_DIR"
        npm ci --production=false
        log "INFO" "✅ Frontend dependencies installed"
    fi
    
    # Functions dependencies
    if [[ -f "$FUNCTIONS_DIR/package.json" ]]; then
        log "INFO" "Installing functions dependencies..."
        cd "$FUNCTIONS_DIR"
        npm ci --production=false
        log "INFO" "✅ Functions dependencies installed"
    fi
    
    cd "$PROJECT_ROOT"
}

# Run tests
run_tests() {
    log "INFO" "🧪 Running tests..."
    
    # Frontend tests
    if [[ -f "$FRONTEND_DIR/package.json" ]]; then
        cd "$FRONTEND_DIR"
        
        # Type checking
        if npm run type-check &> /dev/null; then
            log "INFO" "✅ TypeScript type checking passed"
        else
            log "ERROR" "TypeScript type checking failed"
            exit 1
        fi
        
        # Linting
        if npm run lint &> /dev/null; then
            log "INFO" "✅ Linting passed"
        else
            log "ERROR" "Linting failed"
            exit 1
        fi
        
        # Unit tests
        if npm test -- --coverage --watchAll=false &> /dev/null; then
            log "INFO" "✅ Unit tests passed"
        else
            log "ERROR" "Unit tests failed"
            exit 1
        fi
    fi
    
    cd "$PROJECT_ROOT"
}

# Build application
build_application() {
    log "INFO" "🏗️ Building application for $DEPLOYMENT_ENV..."
    
    cd "$FRONTEND_DIR"
    
    # Set environment variables
    export NODE_ENV="$DEPLOYMENT_ENV"
    export REACT_APP_ENVIRONMENT="$DEPLOYMENT_ENV"
    export REACT_APP_API_URL="/.netlify/functions"
    
    # Build the application
    npm run build
    
    if [[ ! -d "$BUILD_DIR" ]]; then
        log "ERROR" "Build failed - build directory not found"
        exit 1
    fi
    
    # Verify build
    local build_size=$(du -sh "$BUILD_DIR" | cut -f1)
    log "INFO" "✅ Build completed successfully (size: $build_size)"
    
    # Run bundle analysis
    if command -v npx &> /dev/null; then
        log "INFO" "📊 Analyzing bundle size..."
        npx webpack-bundle-analyzer "$BUILD_DIR/static/js/*.js" --mode server --port 8888 &
        local analyzer_pid=$!
        sleep 5
        kill $analyzer_pid 2>/dev/null || true
    fi
    
    cd "$PROJECT_ROOT"
}

# Create backup
create_backup() {
    log "INFO" "💾 Creating deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment info
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        netlify api listSites --json > "$BACKUP_DIR/site_info.json" 2>/dev/null || true
    fi
    
    # Backup environment configuration
    cp -r "$PROJECT_ROOT/deployment/environments" "$BACKUP_DIR/" 2>/dev/null || true
    
    # Backup build artifacts
    if [[ -d "$BUILD_DIR" ]]; then
        cp -r "$BUILD_DIR" "$BACKUP_DIR/build_backup" 2>/dev/null || true
    fi
    
    log "INFO" "✅ Backup created at $BACKUP_DIR"
}

# Deploy to Netlify
deploy_to_netlify() {
    log "INFO" "🚀 Deploying to Netlify ($DEPLOYMENT_ENV)..."
    
    local site_id=""
    local deploy_args=""
    
    # Set site ID based on environment
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        site_id="$NETLIFY_SITE_ID_PRODUCTION"
        deploy_args="--prod"
    else
        site_id="$NETLIFY_SITE_ID_STAGING"
        deploy_args=""
    fi
    
    # Deploy to Netlify
    cd "$FRONTEND_DIR"
    
    local deploy_output
    deploy_output=$(netlify deploy \
        --dir="$BUILD_DIR" \
        --site="$site_id" \
        $deploy_args \
        --json 2>&1)
    
    if [[ $? -eq 0 ]]; then
        local deploy_url=$(echo "$deploy_output" | jq -r '.deploy_url // .url' 2>/dev/null || echo "")
        log "INFO" "✅ Deployment successful!"
        log "INFO" "🌐 Deploy URL: $deploy_url"
        
        # Save deployment info
        echo "$deploy_output" > "$BACKUP_DIR/deployment_info.json"
    else
        log "ERROR" "Deployment failed"
        log "ERROR" "$deploy_output"
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

# Post-deployment checks
post_deployment_checks() {
    log "INFO" "🔍 Running post-deployment checks..."
    
    local base_url=""
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        base_url="https://midasthelifestyle.netlify.app"
    else
        base_url="https://midasthelifestyle-staging.netlify.app"
    fi
    
    # Wait for deployment to propagate
    log "INFO" "⏳ Waiting for deployment to propagate..."
    sleep 30
    
    # Health check
    log "INFO" "🏥 Running health check..."
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url" || echo "000")
    
    if [[ "$response_code" == "200" ]]; then
        log "INFO" "✅ Health check passed (HTTP $response_code)"
    else
        log "ERROR" "Health check failed (HTTP $response_code)"
        exit 1
    fi
    
    # Performance check
    log "INFO" "⚡ Running basic performance check..."
    local load_time=$(curl -s -o /dev/null -w "%{time_total}" "$base_url" || echo "0")
    log "INFO" "📊 Page load time: ${load_time}s"
    
    if (( $(echo "$load_time > 5.0" | bc -l) )); then
        log "WARN" "Page load time is slower than expected (${load_time}s > 5.0s)"
    fi
    
    # Check critical pages
    local critical_pages=("/" "/inventory" "/login" "/register")
    for page in "${critical_pages[@]}"; do
        local page_response=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$page" || echo "000")
        if [[ "$page_response" == "200" ]]; then
            log "INFO" "✅ $page - OK"
        else
            log "WARN" "⚠️ $page - HTTP $page_response"
        fi
    done
}

# Send notifications
send_notifications() {
    log "INFO" "📢 Sending deployment notifications..."
    
    local deployment_status="SUCCESS"
    local deployment_url=""
    
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        deployment_url="https://midasthelifestyle.netlify.app"
    else
        deployment_url="https://midasthelifestyle-staging.netlify.app"
    fi
    
    # Slack notification (if webhook URL is set)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local slack_payload=$(cat <<EOF
{
    "text": "🚀 Midas The Lifestyle Deployment",
    "attachments": [
        {
            "color": "good",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$DEPLOYMENT_ENV",
                    "short": true
                },
                {
                    "title": "Status",
                    "value": "$deployment_status",
                    "short": true
                },
                {
                    "title": "URL",
                    "value": "$deployment_url",
                    "short": false
                },
                {
                    "title": "Deployed by",
                    "value": "$(git config user.name) ($(git config user.email))",
                    "short": true
                },
                {
                    "title": "Commit",
                    "value": "$(git rev-parse --short HEAD)",
                    "short": true
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$slack_payload" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    log "INFO" "✅ Notifications sent"
}

# Main deployment function
main() {
    log "INFO" "🎯 Starting Midas The Lifestyle deployment to $DEPLOYMENT_ENV"
    log "INFO" "📅 Deployment started at $(date)"
    
    # Run deployment steps
    pre_deployment_checks
    install_dependencies
    run_tests
    build_application
    create_backup
    deploy_to_netlify
    post_deployment_checks
    send_notifications
    
    log "INFO" "🎉 Deployment completed successfully!"
    log "INFO" "📅 Deployment finished at $(date)"
    log "INFO" "📋 Log file: $LOG_FILE"
    
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        log "INFO" "🌐 Production site: https://midasthelifestyle.netlify.app"
    else
        log "INFO" "🌐 Staging site: https://midasthelifestyle-staging.netlify.app"
    fi
}

# Help function
show_help() {
    cat << EOF
Midas The Lifestyle Deployment Script

Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENT:
    staging     Deploy to staging environment (default)
    production  Deploy to production environment

OPTIONS:
    --force     Force deployment even with uncommitted changes
    --help      Show this help message

Examples:
    $0                          # Deploy to staging
    $0 staging                  # Deploy to staging
    $0 production               # Deploy to production
    $0 production --force       # Force deploy to production

Environment Variables:
    NETLIFY_AUTH_TOKEN          Netlify authentication token
    NETLIFY_SITE_ID             Production site ID
    NETLIFY_STAGING_SITE_ID     Staging site ID
    SLACK_WEBHOOK_URL           Slack webhook for notifications (optional)

EOF
}

# Parse arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    production|staging|development)
        DEPLOYMENT_ENV="$1"
        if [[ "${2:-}" == "--force" ]]; then
            FORCE_DEPLOY="true"
        fi
        ;;
    --force)
        FORCE_DEPLOY="true"
        ;;
    "")
        # Use default staging environment
        ;;
    *)
        log "ERROR" "Invalid argument: $1"
        show_help
        exit 1
        ;;
esac

# Run main deployment
main
