# Personal Guide - DevOps Infrastructure

This documentation covers the complete DevOps infrastructure for the Personal Guide project, including CI/CD pipelines, monitoring, environment management, and security practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Management](#environment-management)
- [Monitoring & Observability](#monitoring--observability)
- [Security & Secrets Management](#security--secrets-management)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The Personal Guide project uses a modern DevOps stack with the following components:

- **CI/CD**: GitHub Actions with multi-stage pipeline
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local/staging, production-ready scaling
- **Monitoring**: Prometheus, Grafana, Alertmanager
- **Security**: GPG-encrypted secrets, vulnerability scanning
- **Environments**: Development, Staging, Production with proper isolation

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging      │    │   Production    │
│                 │    │                  │    │                 │
│ • Local Docker  │    │ • Cloud Deploy   │    │ • Load Balanced │
│ • Hot Reload    │ ──▶│ • Integration    │──▶ │ • Auto Scaling  │
│ • Debug Mode    │    │ • E2E Testing    │    │ • High Availability│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │   Monitoring     │
                    │                  │
                    │ • Prometheus     │
                    │ • Grafana        │
                    │ • Alertmanager   │
                    │ • Uptime Kuma    │
                    └──────────────────┘
```

## CI/CD Pipeline

### Pipeline Stages

1. **Security Scanning**
   - Vulnerability scanning with Trivy
   - Dependency auditing
   - SAST (Static Application Security Testing)

2. **Code Quality**
   - ESLint for code linting
   - TypeScript type checking
   - Prettier for code formatting

3. **Testing**
   - Unit tests with Jest
   - Integration tests
   - End-to-end tests with Playwright

4. **Build & Validation**
   - Next.js application build
   - Docker image creation
   - Build artifact validation

5. **Deployment**
   - Automatic staging deployment
   - Manual production deployment with approval
   - Health checks and smoke tests

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main/develop | Continuous Integration |
| `deploy.yml` | CI completion | Continuous Deployment |
| `monitoring.yml` | Schedule/Manual | Monitoring and Health Checks |
| `secrets-sync.yml` | Manual | Secrets Management |

## Environment Management

### Environment Configuration

Each environment has its own configuration file:

- `environments/.env.development` - Local development
- `environments/.env.staging` - Staging environment
- `environments/.env.production` - Production environment

### Environment Variables

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| `NODE_ENV` | development | production | production | Node.js environment |
| `LOG_LEVEL` | debug | info | warn | Logging verbosity |
| `RATE_LIMIT_ENABLED` | false | true | true | API rate limiting |
| `ANALYTICS_ENABLED` | false | true | true | Analytics tracking |

### Deployment Scripts

Use the deployment script for consistent deployments:

```bash
# Deploy to staging
./scripts/deploy.sh -e staging

# Deploy specific version to production
./scripts/deploy.sh -e production -t v1.2.3

# Dry run deployment
./scripts/deploy.sh -e staging -d
```

## Monitoring & Observability

### Stack Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notification
- **Node Exporter**: System metrics
- **cAdvisor**: Container metrics
- **Uptime Kuma**: Uptime monitoring

### Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Application Uptime | Service availability | < 99.9% |
| Response Time | API response time | > 3 seconds |
| Error Rate | 5xx error percentage | > 5% |
| Memory Usage | Application memory | > 512MB |
| CPU Usage | CPU utilization | > 80% |

### Dashboards

Access monitoring dashboards:

- **Grafana**: `http://localhost:3001` (local) or `https://grafana.personalguide.app`
- **Prometheus**: `http://localhost:9090` (local)
- **Alertmanager**: `http://localhost:9093` (local)
- **Uptime Kuma**: `http://localhost:3002` (local)

### Starting Monitoring Stack

```bash
# Start monitoring services
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

## Security & Secrets Management

### Secrets Architecture

Secrets are managed using a layered approach:

1. **Local Development**: `.env.local` files (git-ignored)
2. **CI/CD**: GitHub Secrets
3. **Vault**: GPG-encrypted vault for backup and rotation

### Secrets Manager

Use the secrets manager script for secure operations:

```bash
# Initialize vault
./scripts/secrets-manager.sh init

# Set a secret
./scripts/secrets-manager.sh set -e production -n DATABASE_PASSWORD -v "secure_password"

# Get a secret
./scripts/secrets-manager.sh get -e production -n DATABASE_PASSWORD

# List secrets
./scripts/secrets-manager.sh list -e production

# Rotate a secret
./scripts/secrets-manager.sh rotate -e production -n OPENAI_API_KEY

# Sync to GitHub Secrets
./scripts/secrets-manager.sh sync -e production
```

### Security Practices

1. **Encryption**: All secrets encrypted with GPG AES256
2. **Rotation**: Regular secret rotation (30-90 days)
3. **Access Control**: Limited access to production secrets
4. **Audit Trail**: All secret operations logged
5. **Vulnerability Scanning**: Regular security scans

## Deployment Guide

### Prerequisites

- Docker and Docker Compose installed
- GitHub CLI (`gh`) for secrets management
- GPG for secrets encryption
- Node.js 20+ and pnpm for local development

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd personal-guide

# Install dependencies
pnpm install

# Start development environment
pnpm dev

# Start monitoring (optional)
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### Staging Deployment

```bash
# Deploy to staging
./scripts/deploy.sh -e staging

# Check deployment status
curl https://staging.personalguide.app/api/health
```

### Production Deployment

```bash
# Deploy to production (requires confirmation)
./scripts/deploy.sh -e production

# Deploy specific version
./scripts/deploy.sh -e production -t v1.2.3

# Check deployment status
curl https://personalguide.app/api/health
```

## Troubleshooting

### Common Issues

#### CI/CD Pipeline Failures

**Build Failures**
```bash
# Check build logs in GitHub Actions
# Common causes:
# - TypeScript errors
# - Missing environment variables
# - Dependency issues

# Fix TypeScript errors
pnpm type-check

# Fix linting issues
pnpm lint --fix
```

**Docker Build Issues**
```bash
# Build locally to debug
docker build -t personal-guide:debug .

# Check for multi-platform issues
docker buildx build --platform linux/amd64 -t personal-guide:debug .
```

#### Deployment Issues

**Health Check Failures**
```bash
# Check application logs
docker-compose logs web

# Check if environment variables are set
docker-compose exec web env | grep -E "(DATABASE|API_KEY)"

# Manual health check
curl -v http://localhost:3000/api/health
```

**Database Connection Issues**
```bash
# Check Supabase connectivity
curl -H "apikey: ${SUPABASE_ANON_KEY}" "${SUPABASE_URL}/rest/v1/"

# Verify service key
# Check secrets are properly set
```

#### Monitoring Issues

**Prometheus Not Scraping**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify application metrics endpoint
curl http://localhost:3000/api/metrics

# Check Prometheus configuration
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml
```

**Grafana Dashboard Issues**
```bash
# Check Grafana logs
docker-compose logs grafana

# Verify data source configuration
# Default login: admin/admin
```

### Performance Issues

**High Response Times**
1. Check database query performance
2. Review Next.js build optimization
3. Monitor memory usage
4. Check network latency

**High Memory Usage**
1. Review memory leaks in application
2. Optimize image sizes
3. Check for zombie processes
4. Monitor garbage collection

## Best Practices

### Development

1. **Code Quality**
   - Use TypeScript for type safety
   - Follow ESLint and Prettier rules
   - Write comprehensive tests
   - Document complex logic

2. **Git Workflow**
   - Use feature branches
   - Write descriptive commit messages
   - Keep commits atomic and focused
   - Use conventional commit format

3. **Testing**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for critical user flows
   - Regular security testing

### Operations

1. **Monitoring**
   - Monitor all critical metrics
   - Set up meaningful alerts
   - Review metrics regularly
   - Plan capacity based on trends

2. **Security**
   - Regular security updates
   - Rotate secrets frequently
   - Monitor for vulnerabilities
   - Follow principle of least privilege

3. **Deployment**
   - Use blue-green deployments
   - Always test in staging first
   - Have rollback procedures ready
   - Monitor post-deployment

### Infrastructure

1. **Scalability**
   - Design for horizontal scaling
   - Use caching strategically
   - Optimize database queries
   - Plan for traffic spikes

2. **Reliability**
   - Implement health checks
   - Use circuit breakers
   - Plan for disaster recovery
   - Regular backup testing

3. **Cost Optimization**
   - Monitor resource usage
   - Use free tiers effectively
   - Optimize container sizes
   - Review spending regularly

## Support

For infrastructure issues or questions:

1. Check this documentation first
2. Review GitHub Actions logs
3. Check monitoring dashboards
4. Create an issue with detailed information

## Contributing

When contributing to infrastructure:

1. Test changes in development first
2. Update documentation
3. Follow security best practices
4. Get peer review for production changes