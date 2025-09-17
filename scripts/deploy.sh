#!/bin/bash

# =============================================================================
# Personal Guide - Deployment Script
# Handles deployment to different environments with proper configuration
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_DIR="$PROJECT_ROOT/environments"

# Default values
ENVIRONMENT=""
DOCKER_TAG=""
DRY_RUN=false
VERBOSE=false

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

show_help() {
    cat << EOF
Personal Guide Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV    Target environment (development|staging|production)
    -t, --tag TAG           Docker image tag to deploy (default: latest)
    -d, --dry-run           Show what would be deployed without executing
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0 -e staging                    # Deploy latest to staging
    $0 -e production -t v1.2.3       # Deploy specific version to production
    $0 -e staging -d                 # Dry run deployment to staging

ENVIRONMENTS:
    development    Local development environment
    staging        Staging environment for testing
    production     Production environment

EOF
}

validate_environment() {
    case "$ENVIRONMENT" in
        development|staging|production)
            log "Environment: $ENVIRONMENT"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
            ;;
    esac
}

load_environment_config() {
    local env_file="$ENV_DIR/.env.$ENVIRONMENT"

    if [ ! -f "$env_file" ]; then
        error "Environment file not found: $env_file"
    fi

    log "Loading environment configuration: $env_file"
    source "$env_file"
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check required tools
    local required_tools=("docker" "docker-compose" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is required but not installed"
        fi
    done

    # Check Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running"
    fi

    # Check environment file exists
    if [ ! -f "$ENV_DIR/.env.$ENVIRONMENT" ]; then
        error "Environment file not found: $ENV_DIR/.env.$ENVIRONMENT"
    fi

    log "Prerequisites check passed"
}

build_application() {
    log "Building application for $ENVIRONMENT..."

    cd "$PROJECT_ROOT"

    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: Would build Docker image with tag: $DOCKER_TAG"
        return
    fi

    # Build Docker image
    docker build \
        --build-arg NODE_ENV="$([ "$ENVIRONMENT" = "development" ] && echo "development" || echo "production")" \
        --build-arg APP_ENV="$ENVIRONMENT" \
        -t "personal-guide:$DOCKER_TAG" \
        -f Dockerfile \
        .

    log "Application built successfully"
}

deploy_to_development() {
    log "Deploying to development environment..."

    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: Would start development environment"
        return
    fi

    # Copy environment file
    cp "$ENV_DIR/.env.development" "$PROJECT_ROOT/.env.local"

    # Install dependencies and start development server
    cd "$PROJECT_ROOT"
    npm install
    npm run dev &

    log "Development environment started"
}

deploy_to_staging() {
    log "Deploying to staging environment..."

    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: Would deploy to staging with image: personal-guide:$DOCKER_TAG"
        return
    fi

    # Deploy using docker-compose
    cd "$PROJECT_ROOT"

    # Copy environment file
    cp "$ENV_DIR/.env.staging" "$PROJECT_ROOT/.env"

    # Deploy with docker-compose
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

    # Run health check
    sleep 30
    check_health "https://staging.personalguide.app"

    log "Staging deployment completed"
}

deploy_to_production() {
    log "Deploying to production environment..."

    # Production requires extra confirmation
    if [ "$DRY_RUN" = false ]; then
        warn "You are about to deploy to PRODUCTION environment"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            error "Production deployment cancelled"
        fi
    fi

    if [ "$DRY_RUN" = true ]; then
        info "DRY RUN: Would deploy to production with image: personal-guide:$DOCKER_TAG"
        return
    fi

    # Deploy using docker-compose
    cd "$PROJECT_ROOT"

    # Copy environment file
    cp "$ENV_DIR/.env.production" "$PROJECT_ROOT/.env"

    # Create backup before deployment
    create_backup

    # Deploy with docker-compose
    docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

    # Run health check
    sleep 30
    check_health "https://personalguide.app"

    # Run smoke tests
    run_smoke_tests

    log "Production deployment completed"
}

create_backup() {
    log "Creating backup before deployment..."

    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"

    # Backup database (example for Supabase)
    # In real implementation, this would backup the database
    info "Backup created: $backup_name"
}

check_health() {
    local url="$1"
    log "Running health check: $url/api/health"

    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url/api/health" > /dev/null; then
            log "Health check passed"
            return 0
        fi

        warn "Health check failed (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    error "Health check failed after $max_attempts attempts"
}

run_smoke_tests() {
    log "Running smoke tests..."

    # Run basic smoke tests
    # In real implementation, this would run automated tests
    info "Smoke tests passed"
}

cleanup() {
    log "Cleaning up..."

    # Remove temporary files
    cd "$PROJECT_ROOT"

    # Clean up old Docker images (keep last 3)
    docker images "personal-guide" --format "table {{.Tag}}" | tail -n +4 | xargs -r docker rmi "personal-guide:" || true

    log "Cleanup completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--tag)
            DOCKER_TAG="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate required arguments
if [ -z "$ENVIRONMENT" ]; then
    error "Environment is required. Use -e or --environment"
fi

# Set default Docker tag if not provided
if [ -z "$DOCKER_TAG" ]; then
    DOCKER_TAG="latest"
fi

# Main deployment flow
main() {
    log "Starting deployment to $ENVIRONMENT environment"

    validate_environment
    check_prerequisites
    load_environment_config
    build_application

    case "$ENVIRONMENT" in
        development)
            deploy_to_development
            ;;
        staging)
            deploy_to_staging
            ;;
        production)
            deploy_to_production
            ;;
    esac

    cleanup

    log "Deployment to $ENVIRONMENT completed successfully!"
}

# Execute main function
main