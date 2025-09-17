# Security & Secrets Management Guide

This guide covers the comprehensive security practices and secrets management for the Personal Guide project.

## 🔐 Overview

Our security approach follows defense-in-depth principles with multiple layers:
- **Application Security**: Secure coding practices, input validation
- **Infrastructure Security**: Container security, network isolation
- **Secrets Management**: Encrypted storage, rotation, access control
- **Monitoring**: Security monitoring, vulnerability scanning
- **Compliance**: Security auditing, compliance checks

## 🏗️ Security Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │    │    Infrastructure │    │     Secrets     │
│                 │    │                  │    │                 │
│ • Input Valid.  │    │ • Container Scan │    │ • GPG Vault     │
│ • Auth/AuthZ    │ ───│ • Network Sec.   │────│ • Rotation      │
│ • HTTPS/TLS     │    │ • Monitoring     │    │ • Access Control│
│ • Rate Limiting │    │ • Vulnerability  │    │ • Audit Trail   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │   Compliance     │
                    │                  │
                    │ • Security Audit │
                    │ • Penetration    │
                    │ • Compliance     │
                    │ • Reporting      │
                    └──────────────────┘
```

## 🔑 Secrets Management

### Secrets Architecture

We use a multi-layered approach to secrets management:

1. **Development**: Local `.env` files (git-ignored)
2. **CI/CD**: GitHub Secrets
3. **Vault**: GPG-encrypted vault for backup and rotation
4. **Runtime**: Environment variables only

### Quick Start

```bash
# Initialize secrets vault
./scripts/secrets-manager.sh init

# Set development secrets
./scripts/secrets-manager.sh set -e development -n OPENAI_API_KEY -v "sk-..."

# Set production secrets
./scripts/secrets-manager.sh set -e production -n DATABASE_PASSWORD -v -
# (Enter password securely)

# List all secrets for environment
./scripts/secrets-manager.sh list -e production

# Rotate a secret
./scripts/secrets-manager.sh rotate -e production -n NEXTAUTH_SECRET
```

### Secrets Categories

| Category | Examples | Rotation Schedule |
|----------|----------|------------------|
| **Database** | Connection strings, passwords | 90 days |
| **API Keys** | OpenAI, third-party services | 30 days |
| **Auth** | JWT secrets, session keys | 60 days |
| **Certificates** | TLS certificates | Before expiry |
| **Monitoring** | Service credentials | 90 days |

### Secrets Naming Convention

```bash
# Format: {ENVIRONMENT}_{SERVICE}_{TYPE}
PROD_DATABASE_PASSWORD
STAGING_OPENAI_API_KEY
DEV_NEXTAUTH_SECRET
PROD_GRAFANA_ADMIN_PASSWORD
```

### Environment-Specific Secrets

#### Development
```bash
# Core application secrets
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
NEXTAUTH_SECRET

# Optional development tools
SENTRY_DSN (optional)
```

#### Staging
```bash
# All development secrets plus:
SUPABASE_SERVICE_KEY
SMTP_PASSWORD
GRAFANA_ADMIN_PASSWORD
```

#### Production
```bash
# All staging secrets plus:
BACKUP_ENCRYPTION_KEY
MONITORING_API_KEYS
CERTIFICATE_PRIVATE_KEYS
```

## 🛡️ Application Security

### Authentication & Authorization

#### NextAuth.js Configuration

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';

export default NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_KEY!,
  }),
  providers: [
    // OAuth providers
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to token
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.userId = token.userId;
      return session;
    },
  },
});
```

#### Role-Based Access Control (RBAC)

```typescript
// lib/auth.ts
export const permissions = {
  'user': ['read:own_data'],
  'premium': ['read:own_data', 'write:own_data', 'access:ai_features'],
  'admin': ['read:all_data', 'write:all_data', 'manage:users']
} as const;

export function hasPermission(
  userRole: string,
  requiredPermission: string
): boolean {
  return permissions[userRole]?.includes(requiredPermission) || false;
}

// Middleware for API routes
export function requirePermission(permission: string) {
  return (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
```

### Input Validation & Sanitization

```typescript
// lib/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Validation schemas
export const userInputSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long')
    .transform(val => DOMPurify.sanitize(val)),
  mood: z.number().int().min(1).max(10),
});

// API validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}
```

### Rate Limiting

```typescript
// lib/rate-limiting.ts
import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options: RateLimitOptions = {}) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (token: string, limit: number) => {
      const tokenCount = (tokenCache.get(token) as number) || 0;

      if (tokenCount >= limit) {
        return { success: false, reset: Date.now() + options.interval! };
      }

      tokenCache.set(token, tokenCount + 1);
      return { success: true };
    },
  };
}

// Usage in API routes
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const identifier = req.ip || 'anonymous';
  const result = limiter.check(identifier, 10); // 10 requests per minute

  if (!result.success) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      resetTime: result.reset
    });
  }

  // Handle request
}
```

### Content Security Policy (CSP)

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.openai.com https://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 🐳 Container Security

### Dockerfile Security Best Practices

```dockerfile
# Use specific version tags
FROM node:20-alpine3.18

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies as root, then switch to non-root
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Copy application code
COPY --chown=nextjs:nodejs . .

# Build application
RUN pnpm build

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["pnpm", "start"]
```

### Security Scanning

#### Trivy Configuration

```yaml
# .trivyignore
# Ignore specific vulnerabilities if they don't apply
CVE-2023-XXXXX

# Trivy configuration in CI
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'personal-guide:latest'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH,MEDIUM'
    exit-code: '1'
```

#### Container Hardening

```yaml
# docker-compose security settings
services:
  web:
    image: personal-guide:latest
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - SETGID
      - SETUID
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
    user: "1001:1001"
```

## 🔍 Security Monitoring

### Security Metrics

```typescript
// lib/security-metrics.ts
import { Counter, Histogram } from 'prom-client';

export const securityMetrics = {
  authAttempts: new Counter({
    name: 'auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['method', 'success', 'ip']
  }),

  rateLimitHits: new Counter({
    name: 'rate_limit_hits_total',
    help: 'Total rate limit violations',
    labelNames: ['endpoint', 'ip']
  }),

  inputValidationErrors: new Counter({
    name: 'input_validation_errors_total',
    help: 'Total input validation errors',
    labelNames: ['endpoint', 'error_type']
  }),
};

// Record security events
export function recordSecurityEvent(
  type: 'auth_attempt' | 'rate_limit' | 'validation_error',
  labels: Record<string, string>
) {
  switch (type) {
    case 'auth_attempt':
      securityMetrics.authAttempts.labels(labels).inc();
      break;
    case 'rate_limit':
      securityMetrics.rateLimitHits.labels(labels).inc();
      break;
    case 'validation_error':
      securityMetrics.inputValidationErrors.labels(labels).inc();
      break;
  }
}
```

### Security Alerts

```yaml
# monitoring/prometheus/security_rules.yml
groups:
  - name: security-alerts
    rules:
      - alert: SuspiciousAuthActivity
        expr: increase(auth_attempts_total{success="false"}[5m]) > 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Suspicious authentication activity detected"

      - alert: RateLimitBreach
        expr: increase(rate_limit_hits_total[5m]) > 50
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit violations detected"

      - alert: InputValidationSpike
        expr: increase(input_validation_errors_total[5m]) > 20
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Spike in input validation errors"
```

## 🛠️ Security Tools Integration

### Sentry for Error Tracking

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Security-focused configuration
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.token;
    }

    // Filter out PII
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    return event;
  },

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
```

### OWASP ZAP Integration

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  pull_request:
    branches: [main]

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

## 🔐 Secrets Rotation

### Automated Rotation Strategy

```bash
#!/bin/bash
# scripts/rotate-secrets.sh

SECRETS_TO_ROTATE=(
  "OPENAI_API_KEY:30"      # Rotate every 30 days
  "NEXTAUTH_SECRET:60"     # Rotate every 60 days
  "DATABASE_PASSWORD:90"   # Rotate every 90 days
)

for secret_config in "${SECRETS_TO_ROTATE[@]}"; do
  IFS=':' read -r secret_name days <<< "$secret_config"

  # Check if rotation is needed
  last_rotation=$(./scripts/secrets-manager.sh get-metadata -e production -n "$secret_name" -k "last_rotation")

  if [ $(($(date +%s) - last_rotation)) -gt $((days * 24 * 60 * 60)) ]; then
    echo "Rotating $secret_name (last rotation: $days days ago)"
    ./scripts/secrets-manager.sh rotate -e production -n "$secret_name"
  fi
done
```

### Manual Rotation Process

```bash
# 1. Rotate the secret
./scripts/secrets-manager.sh rotate -e production -n OPENAI_API_KEY

# 2. Update GitHub Secrets
./scripts/secrets-manager.sh sync -e production

# 3. Deploy updated configuration
./scripts/deploy.sh -e production

# 4. Verify application functionality
curl -f https://personalguide.app/api/health

# 5. Update monitoring and audit logs
echo "$(date): OPENAI_API_KEY rotated successfully" >> audit.log
```

## 🏥 Incident Response

### Security Incident Playbook

#### 1. Detection
- Monitor security alerts in Grafana
- Check Sentry for security-related errors
- Review access logs for anomalies

#### 2. Assessment
```bash
# Check recent authentication attempts
grep "auth_attempt" /var/log/app.log | tail -100

# Review rate limiting violations
curl http://localhost:9090/api/v1/query?query=rate_limit_hits_total

# Check for suspicious IP addresses
grep "suspicious_activity" /var/log/security.log
```

#### 3. Containment
```bash
# Block suspicious IP at load balancer level
# Rotate compromised credentials
./scripts/secrets-manager.sh rotate -e production -n COMPROMISED_SECRET

# Scale down affected services if needed
docker-compose scale web=0
```

#### 4. Recovery
```bash
# Deploy security patches
./scripts/deploy.sh -e production -t security-patch-v1.2.3

# Verify system integrity
./scripts/security-check.sh

# Restore normal operations
docker-compose scale web=2
```

#### 5. Lessons Learned
- Document incident timeline
- Update security procedures
- Improve monitoring and alerting
- Conduct post-incident review

## 📋 Security Checklist

### Pre-Deployment Security Review

- [ ] Input validation implemented for all user inputs
- [ ] Authentication and authorization properly configured
- [ ] Rate limiting enabled for all API endpoints
- [ ] HTTPS/TLS configured with strong ciphers
- [ ] Security headers implemented (CSP, HSTS, etc.)
- [ ] Secrets properly managed and rotated
- [ ] Container security scanning passed
- [ ] Dependency vulnerability scanning passed
- [ ] Security monitoring and alerting configured

### Regular Security Maintenance

#### Weekly
- [ ] Review security alerts and incidents
- [ ] Check for new vulnerability disclosures
- [ ] Verify backup integrity

#### Monthly
- [ ] Rotate short-term secrets (API keys)
- [ ] Review access logs for anomalies
- [ ] Update security documentation
- [ ] Test incident response procedures

#### Quarterly
- [ ] Conduct security audit
- [ ] Review and update security policies
- [ ] Rotate long-term secrets
- [ ] Penetration testing (if applicable)
- [ ] Security training for team

## 🔧 Security Configuration

### Environment Variables Security

```bash
# Production environment security settings
export NODE_ENV=production
export SECURE_COOKIES=true
export TRUST_PROXY=true
export RATE_LIMIT_ENABLED=true
export SECURITY_HEADERS_ENABLED=true
export CSP_ENABLED=true
export HSTS_ENABLED=true
```

### Database Security

```sql
-- Supabase Row Level Security policies
CREATE POLICY user_data_access ON user_data
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY admin_access ON user_data
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

This comprehensive security guide ensures that the Personal Guide application maintains high security standards across all environments and components.