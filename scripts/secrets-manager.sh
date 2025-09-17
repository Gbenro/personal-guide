#!/bin/bash

# =============================================================================
# Personal Guide - Secrets Management Script
# Handles secure management of secrets across environments
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SECRETS_DIR="$PROJECT_ROOT/secrets"
VAULT_FILE="$SECRETS_DIR/vault.gpg"

# Default values
ACTION=""
ENVIRONMENT=""
SECRET_NAME=""
SECRET_VALUE=""
VAULT_PASSWORD=""

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
Personal Guide Secrets Management Script

DESCRIPTION:
    Securely manage secrets for different environments using GPG encryption.
    Secrets are encrypted at rest and only decrypted when needed.

USAGE: $0 [ACTION] [OPTIONS]

ACTIONS:
    init                        Initialize secrets vault
    set                         Set a secret value
    get                         Get a secret value
    list                        List all secrets for an environment
    rotate                      Rotate a secret (generate new value)
    backup                      Create encrypted backup of secrets
    restore                     Restore secrets from backup
    sync                        Sync secrets to GitHub Secrets

OPTIONS:
    -e, --environment ENV       Target environment (dev|staging|prod)
    -n, --name NAME            Secret name
    -v, --value VALUE          Secret value (use - to read from stdin)
    -f, --file FILE            Read secret from file
    -p, --password PASSWORD    Vault password (use \$VAULT_PASSWORD if not provided)
    -h, --help                 Show this help message

EXAMPLES:
    # Initialize vault
    $0 init

    # Set a secret
    $0 set -e production -n DATABASE_PASSWORD -v "secure_password"

    # Set secret from stdin (for multi-line secrets)
    echo "multi-line-secret" | $0 set -e staging -n PRIVATE_KEY -v -

    # Get a secret
    $0 get -e production -n DATABASE_PASSWORD

    # List all secrets for environment
    $0 list -e production

    # Rotate OpenAI API key
    $0 rotate -e production -n OPENAI_API_KEY

    # Sync to GitHub Secrets
    $0 sync -e production

SECURITY NOTES:
    - Secrets are encrypted using GPG with AES256
    - Vault password should be stored securely (not in code)
    - Use environment variables or secure input for sensitive operations
    - Regularly rotate secrets and backup vault

EOF
}

check_prerequisites() {
    local required_tools=("gpg" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is required but not installed"
        fi
    done
}

get_vault_password() {
    if [ -n "${VAULT_PASSWORD:-}" ]; then
        return
    fi

    if [ -n "${VAULT_PASSWORD_FILE:-}" ] && [ -f "$VAULT_PASSWORD_FILE" ]; then
        VAULT_PASSWORD=$(cat "$VAULT_PASSWORD_FILE")
        return
    fi

    echo -n "Enter vault password: "
    read -s VAULT_PASSWORD
    echo
}

init_vault() {
    log "Initializing secrets vault..."

    mkdir -p "$SECRETS_DIR"

    if [ -f "$VAULT_FILE" ]; then
        warn "Vault already exists at $VAULT_FILE"
        read -p "Do you want to reinitialize? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            info "Vault initialization cancelled"
            return
        fi
    fi

    get_vault_password

    # Create initial empty vault structure
    local initial_data='{
        "development": {},
        "staging": {},
        "production": {},
        "metadata": {
            "created": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
            "version": "1.0"
        }
    }'

    echo "$initial_data" | gpg --batch --yes --passphrase "$VAULT_PASSWORD" --cipher-algo AES256 --compress-algo 1 -c > "$VAULT_FILE"

    log "Vault initialized successfully"

    # Create .gitignore to exclude secrets
    echo "# Secrets - do not commit" > "$SECRETS_DIR/.gitignore"
    echo "vault.gpg" >> "$SECRETS_DIR/.gitignore"
    echo "*.key" >> "$SECRETS_DIR/.gitignore"
    echo "*.pem" >> "$SECRETS_DIR/.gitignore"
}

decrypt_vault() {
    if [ ! -f "$VAULT_FILE" ]; then
        error "Vault not found. Run '$0 init' first."
    fi

    get_vault_password
    gpg --batch --quiet --passphrase "$VAULT_PASSWORD" --decrypt "$VAULT_FILE" 2>/dev/null || error "Failed to decrypt vault. Check password."
}

encrypt_vault() {
    local data="$1"
    get_vault_password
    echo "$data" | gpg --batch --yes --passphrase "$VAULT_PASSWORD" --cipher-algo AES256 --compress-algo 1 -c > "$VAULT_FILE"
}

set_secret() {
    if [ -z "$ENVIRONMENT" ] || [ -z "$SECRET_NAME" ]; then
        error "Environment and secret name are required"
    fi

    # Get secret value
    if [ "$SECRET_VALUE" = "-" ]; then
        SECRET_VALUE=$(cat)
    elif [ -z "$SECRET_VALUE" ]; then
        echo -n "Enter secret value: "
        read -s SECRET_VALUE
        echo
    fi

    log "Setting secret $SECRET_NAME for environment $ENVIRONMENT"

    local vault_data
    vault_data=$(decrypt_vault)

    # Update the secret
    vault_data=$(echo "$vault_data" | jq --arg env "$ENVIRONMENT" --arg name "$SECRET_NAME" --arg value "$SECRET_VALUE" \
        '.[$env][$name] = {
            "value": $value,
            "updated": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
            "updated_by": "'$(whoami)'"
        }')

    encrypt_vault "$vault_data"

    log "Secret $SECRET_NAME set successfully"
}

get_secret() {
    if [ -z "$ENVIRONMENT" ] || [ -z "$SECRET_NAME" ]; then
        error "Environment and secret name are required"
    fi

    local vault_data
    vault_data=$(decrypt_vault)

    local secret_value
    secret_value=$(echo "$vault_data" | jq -r --arg env "$ENVIRONMENT" --arg name "$SECRET_NAME" \
        '.[$env][$name].value // empty')

    if [ -z "$secret_value" ] || [ "$secret_value" = "null" ]; then
        error "Secret $SECRET_NAME not found in environment $ENVIRONMENT"
    fi

    echo "$secret_value"
}

list_secrets() {
    if [ -z "$ENVIRONMENT" ]; then
        error "Environment is required"
    fi

    log "Secrets in environment: $ENVIRONMENT"

    local vault_data
    vault_data=$(decrypt_vault)

    echo "$vault_data" | jq -r --arg env "$ENVIRONMENT" \
        '.[$env] | to_entries[] | "\(.key) (updated: \(.value.updated // "unknown"))"' | \
        sort || error "No secrets found for environment $ENVIRONMENT"
}

rotate_secret() {
    if [ -z "$ENVIRONMENT" ] || [ -z "$SECRET_NAME" ]; then
        error "Environment and secret name are required"
    fi

    log "Rotating secret $SECRET_NAME for environment $ENVIRONMENT"

    # Generate new secret based on type
    local new_value
    case "$SECRET_NAME" in
        *PASSWORD*|*SECRET*|*TOKEN*)
            new_value=$(openssl rand -base64 32)
            ;;
        *KEY*)
            new_value=$(openssl rand -hex 32)
            ;;
        *)
            warn "Unknown secret type. Generating random string."
            new_value=$(openssl rand -base64 32)
            ;;
    esac

    SECRET_VALUE="$new_value"
    set_secret

    log "Secret $SECRET_NAME rotated successfully"
    info "New value: $new_value"
    warn "Remember to update the application configuration!"
}

backup_vault() {
    log "Creating vault backup..."

    local backup_file="$SECRETS_DIR/vault-backup-$(date +%Y%m%d-%H%M%S).gpg"

    if [ ! -f "$VAULT_FILE" ]; then
        error "Vault not found"
    fi

    cp "$VAULT_FILE" "$backup_file"

    log "Backup created: $backup_file"
}

restore_vault() {
    local backup_file="$1"

    if [ -z "$backup_file" ]; then
        error "Backup file path is required"
    fi

    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi

    warn "This will replace the current vault"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        info "Restore cancelled"
        return
    fi

    cp "$backup_file" "$VAULT_FILE"

    log "Vault restored from: $backup_file"
}

sync_to_github() {
    if [ -z "$ENVIRONMENT" ]; then
        error "Environment is required"
    fi

    log "Syncing secrets to GitHub Secrets for environment: $ENVIRONMENT"

    local vault_data
    vault_data=$(decrypt_vault)

    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is required for syncing secrets"
    fi

    # Get all secrets for the environment
    local secrets
    secrets=$(echo "$vault_data" | jq -r --arg env "$ENVIRONMENT" '.[$env] | keys[]')

    while IFS= read -r secret_name; do
        if [ -n "$secret_name" ]; then
            local secret_value
            secret_value=$(echo "$vault_data" | jq -r --arg env "$ENVIRONMENT" --arg name "$secret_name" \
                '.[$env][$name].value')

            log "Syncing secret: $secret_name"

            # Set GitHub secret
            echo "$secret_value" | gh secret set "${ENVIRONMENT^^}_${secret_name}" --body -

            info "Synced: $secret_name"
        fi
    done <<< "$secrets"

    log "GitHub Secrets sync completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        init|set|get|list|rotate|backup|restore|sync)
            ACTION="$1"
            shift
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -n|--name)
            SECRET_NAME="$2"
            shift 2
            ;;
        -v|--value)
            SECRET_VALUE="$2"
            shift 2
            ;;
        -f|--file)
            if [ -f "$2" ]; then
                SECRET_VALUE=$(cat "$2")
            else
                error "File not found: $2"
            fi
            shift 2
            ;;
        -p|--password)
            VAULT_PASSWORD="$2"
            shift 2
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

# Validate action
if [ -z "$ACTION" ]; then
    error "Action is required. Use -h for help."
fi

# Main execution
main() {
    check_prerequisites

    case "$ACTION" in
        init)
            init_vault
            ;;
        set)
            set_secret
            ;;
        get)
            get_secret
            ;;
        list)
            list_secrets
            ;;
        rotate)
            rotate_secret
            ;;
        backup)
            backup_vault
            ;;
        restore)
            if [ $# -eq 0 ]; then
                error "Backup file path is required for restore action"
            fi
            restore_vault "$1"
            ;;
        sync)
            sync_to_github
            ;;
        *)
            error "Unknown action: $ACTION"
            ;;
    esac
}

# Execute main function
main "$@"