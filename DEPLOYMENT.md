# Personal Guide - Deployment Guide

## 🚀 Phase 1: Foundation & Infrastructure

This guide covers the complete DevOps setup for the Personal Guide application, including containerization, CI/CD pipelines, monitoring, and deployment strategies.

## 📋 Overview

The deployment infrastructure includes:

- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions with comprehensive testing
- **Monitoring**: Prometheus, Grafana, Loki stack
- **Security**: Vulnerability scanning, dependency auditing
- **Health Checks**: Application and infrastructure monitoring
- **Environments**: Staging and Production with approval gates

## 🛠 Prerequisites

### Required Tools
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 20+
- Git

### Environment Setup
1. Clone the repository
2. Copy environment files:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
3. Configure environment variables (see Environment Variables section)

## 🔧 Local Development

### Quick Start
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f personal-guide-web

# Stop services
docker-compose down
```

### Service URLs
- **Application**: http://localhost:3000
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **pgAdmin**: http://localhost:5050 (admin@personalguide.app/admin)
- **Redis Commander**: http://localhost:8081

### Development Commands
```bash
# Build application container
docker build -t personal-guide-web .

# Run only the application
docker-compose up personal-guide-web postgres redis

# Rebuild and start
docker-compose up --build

# View container health
docker-compose ps
```

## 🌐 Environment Variables

### Application (.env.local)
```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/personal_guide"
POSTGRES_PASSWORD="secure_password"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="secure_redis_password"

# Monitoring
ENABLE_MONITORING="true"

# API Keys (Optional)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

### Monitoring (.env.monitoring)
```bash
# Grafana
GRAFANA_PASSWORD="secure_grafana_password"

# Database Admin
PGADMIN_PASSWORD="secure_pgadmin_password"
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### Continuous Integration (ci.yml)
Triggers on:
- Push to main/develop branches
- Pull requests
- Manual dispatch

**Pipeline Stages:**
1. **Security Scan**: Trivy vulnerability scanning
2. **Code Quality**: ESLint, TypeScript checking, formatting
3. **Testing**: Unit, integration, and E2E tests
4. **Build**: Application compilation and validation
5. **Docker Build**: Container creation and security scan
6. **Performance**: Lighthouse CI testing
7. **Deployment Readiness**: Final validation

#### Continuous Deployment (deploy.yml)
Triggers on:
- Successful CI completion
- Manual deployment dispatch

**Deployment Stages:**
1. **Validation**: Determine deployment strategy
2. **Staging Deploy**: Automatic staging deployment
3. **Production Deploy**: Manual approval required
4. **Health Checks**: Post-deployment validation
5. **Monitoring**: Performance baseline establishment
6. **Rollback**: Automated rollback on failure

### Deployment Approval Process

#### Staging Deployment
- ✅ Automatic after successful CI
- ✅ Health checks and smoke tests
- ✅ Performance validation

#### Production Deployment
- ⚠️ Manual approval required
- ⚠️ Blue-green deployment strategy
- ⚠️ Database migration handling
- ⚠️ Comprehensive health checks
- ⚠️ Stakeholder notification

## 📊 Monitoring & Observability

### Metrics Collection
- **Application Metrics**: Custom business metrics via monitoring service
- **Infrastructure Metrics**: Prometheus + Node Exporter
- **Container Metrics**: cAdvisor
- **Database Metrics**: PostgreSQL Exporter

### Logging
- **Application Logs**: Structured JSON logging
- **Container Logs**: Docker log driver
- **Log Aggregation**: Loki + Promtail
- **Log Retention**: 30 days default

### Alerting
- **Error Rate**: >5% error rate triggers alert
- **Response Time**: >2s 95th percentile triggers alert
- **Resource Usage**: >80% CPU/Memory triggers alert
- **Health Check**: Failed health checks trigger immediate alert

### Dashboards
- **Application Dashboard**: Business metrics, user activity
- **Infrastructure Dashboard**: System resources, container health
- **Error Dashboard**: Error tracking and analysis

## 🛡 Security

### Container Security
- **Base Images**: Official Alpine Linux images
- **Non-root User**: Application runs as non-root user
- **Vulnerability Scanning**: Trivy integration
- **Secret Management**: Environment variables, no hardcoded secrets
- **Image Signing**: Container signature verification

### Application Security
- **Input Validation**: Zod schema validation
- **Error Handling**: Comprehensive error boundaries
- **Security Headers**: CSRF, XSS protection
- **Authentication**: NextAuth.js integration
- **Dependency Auditing**: NPM audit in CI

### Network Security
- **Container Networks**: Isolated container networking
- **TLS Termination**: HTTPS enforcement
- **API Rate Limiting**: Request throttling
- **CORS Configuration**: Proper cross-origin setup

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres personal_guide > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres personal_guide < backup.sql
```

### Volume Backup
```bash
# Backup all volumes
docker run --rm -v personal-guide-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Disaster Recovery
1. **RTO (Recovery Time Objective)**: 30 minutes
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Frequency**: Daily automated backups
4. **Backup Retention**: 30 days
5. **Restore Testing**: Weekly automated restore tests

## 🚀 Deployment Strategies

### Blue-Green Deployment
- Zero-downtime deployments
- Quick rollback capability
- Full environment validation
- DNS/Load balancer switching

### Rolling Updates
- Gradual service replacement
- Health check validation
- Automatic rollback on failure
- Minimal resource overhead

### Canary Deployment
- Traffic splitting capability
- A/B testing support
- Risk mitigation
- Gradual feature rollout

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale web containers
docker-compose up --scale personal-guide-web=3

# Load balancer configuration required
```

### Vertical Scaling
```yaml
# docker-compose.yml resource limits
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Database Scaling
- **Read Replicas**: PostgreSQL streaming replication
- **Connection Pooling**: PgBouncer integration
- **Query Optimization**: Automated performance monitoring

## 🔧 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs personal-guide-web

# Check health status
docker-compose ps

# Rebuild container
docker-compose up --build personal-guide-web
```

#### Database Connection Issues
```bash
# Test database connection
docker-compose exec personal-guide-web npm run db:test

# Reset database
docker-compose down -v
docker-compose up postgres
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Analyze application metrics
# Visit http://localhost:3001 (Grafana)
```

### Debug Mode
```bash
# Enable debug logging
ENABLE_MONITORING=true DEBUG=* docker-compose up

# Access container shell
docker-compose exec personal-guide-web sh
```

## 📞 Support

### Health Check Endpoints
- **Application Health**: `GET /api/health`
- **Database Health**: `GET /api/health/db`
- **Cache Health**: `GET /api/health/cache`

### Monitoring Endpoints
- **Metrics**: `GET /api/metrics`
- **Performance**: `GET /api/performance`

### Emergency Contacts
- **DevOps Lead**: [Your Contact]
- **System Administrator**: [Your Contact]
- **On-Call Rotation**: [Your Rotation Schedule]

---

## 🏁 Phase 1 Completion Checklist

- ✅ **Container Infrastructure**: Docker, Docker Compose
- ✅ **CI/CD Pipeline**: GitHub Actions with security scanning
- ✅ **Monitoring Stack**: Prometheus, Grafana, Loki
- ✅ **Health Checks**: Application and infrastructure monitoring
- ✅ **Security**: Vulnerability scanning, input validation
- ✅ **Error Handling**: Comprehensive error boundaries
- ✅ **Documentation**: Complete deployment and operations guide

**Next Phase**: Production deployment, advanced monitoring, and scaling optimization.