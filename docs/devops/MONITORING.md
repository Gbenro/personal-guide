# Monitoring & Observability Guide

This guide covers the comprehensive monitoring setup for the Personal Guide application, including metrics collection, alerting, and observability best practices.

## 📊 Overview

Our monitoring stack provides full observability into:
- Application performance and health
- Infrastructure metrics
- User experience monitoring
- Security and compliance monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │────│   Prometheus     │────│    Grafana      │
│                 │    │                  │    │                 │
│ • Custom Metrics│    │ • Metrics Store  │    │ • Dashboards    │
│ • Health Checks │    │ • Alert Rules    │    │ • Visualization │
│ • Logs          │    │ • Scraping       │    │ • User Interface│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │  Alertmanager    │
                    │                  │
                    │ • Slack/Email    │
                    │ • PagerDuty      │
                    │ • Webhooks       │
                    └──────────────────┘
```

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Navigate to monitoring directory
cd monitoring

# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. Access Dashboards

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| Grafana | http://localhost:3001 | admin / admin |
| Prometheus | http://localhost:9090 | N/A |
| Alertmanager | http://localhost:9093 | N/A |
| Uptime Kuma | http://localhost:3002 | Setup required |

### 3. Import Dashboards

```bash
# Import Personal Guide dashboard
curl -X POST \
  http://admin:admin@localhost:3001/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @grafana/dashboards/personal-guide.json
```

## 📈 Metrics Collection

### Application Metrics

The application exposes metrics at `/api/metrics` endpoint:

```typescript
// Example metrics in the application
import { register, Counter, Histogram, Gauge } from 'prom-client';

// HTTP request metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route']
});

// Active users
const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});
```

### Infrastructure Metrics

- **Node Exporter**: System metrics (CPU, memory, disk, network)
- **cAdvisor**: Container metrics (Docker resource usage)
- **Prometheus**: Monitoring system metrics

### Custom Business Metrics

```typescript
// AI chat interactions
const aiChatInteractions = new Counter({
  name: 'ai_chat_interactions_total',
  help: 'Total AI chat interactions',
  labelNames: ['user_id', 'interaction_type']
});

// Mood tracking entries
const moodEntries = new Counter({
  name: 'mood_entries_total',
  help: 'Total mood tracking entries',
  labelNames: ['mood_score']
});

// Journal entries
const journalEntries = new Counter({
  name: 'journal_entries_total',
  help: 'Total journal entries created',
  labelNames: ['entry_type']
});
```

## 🚨 Alerting

### Alert Rules

Located in `monitoring/prometheus/alert_rules.yml`:

#### Critical Alerts
- **ApplicationDown**: Service unavailable for >1 minute
- **DatabaseConnectionFailure**: DB connection failures >5 in 5 minutes

#### Warning Alerts
- **HighResponseTime**: 95th percentile >3 seconds for 2 minutes
- **HighErrorRate**: Error rate >5% for 5 minutes
- **HighMemoryUsage**: Memory usage >512MB for 5 minutes
- **HighCPUUsage**: CPU usage >80% for 5 minutes

### Alert Channels

Configure alert destinations in `monitoring/alertmanager/alertmanager.yml`:

```yaml
receivers:
  - name: 'critical-alerts'
    email_configs:
      - to: 'alerts@personalguide.app'
        subject: '🚨 Critical Alert: {{ .GroupLabels.alertname }}'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#alerts'
        title: 'Critical Alert'
```

### Testing Alerts

```bash
# Trigger test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "Test alert from monitoring setup"
    }
  }]'
```

## 📊 Dashboards

### Main Application Dashboard

The primary dashboard includes:

1. **Overview Panel**
   - Service status indicators
   - Request rate and response time
   - Error rate trending

2. **Performance Metrics**
   - Response time percentiles
   - Throughput (requests/second)
   - Database query performance

3. **Resource Usage**
   - CPU and memory utilization
   - Disk space and I/O
   - Network traffic

4. **Business Metrics**
   - Active users
   - Feature usage (AI chat, mood tracking, journaling)
   - User engagement metrics

### Infrastructure Dashboard

- Container resource usage
- Host system metrics
- Docker container health
- Storage utilization

### Custom Dashboards

Create custom dashboards for specific use cases:

```json
{
  "dashboard": {
    "title": "AI Performance Monitoring",
    "panels": [
      {
        "title": "OpenAI API Response Time",
        "targets": [
          {
            "expr": "openai_api_duration_seconds"
          }
        ]
      }
    ]
  }
}
```

## 🔍 Log Management

### Log Aggregation

While we use lightweight monitoring, logs can be collected using:

```bash
# View application logs
docker-compose logs -f web

# View all monitoring logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Filter logs by service
docker-compose logs -f prometheus
```

### Log Levels

Configure appropriate log levels per environment:

- **Development**: `debug` - Verbose logging for troubleshooting
- **Staging**: `info` - Informational messages and above
- **Production**: `warn` - Warning and error messages only

### Structured Logging

Use structured logging format in production:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});
```

## 🔧 Configuration

### Prometheus Configuration

Key configuration in `monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'personal-guide'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
```

### Grafana Configuration

Environment variables for Grafana:

```env
GF_SECURITY_ADMIN_PASSWORD=secure_password
GF_USERS_ALLOW_SIGN_UP=false
GF_SMTP_ENABLED=true
GF_SMTP_HOST=smtp.gmail.com:587
```

### Alertmanager Configuration

Configure notification channels:

```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@personalguide.app'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
```

## 🎯 Performance Monitoring

### Key Performance Indicators (KPIs)

| Metric | Target | Critical |
|--------|--------|----------|
| Uptime | 99.9% | 99.5% |
| Response Time (p95) | <2s | <5s |
| Error Rate | <1% | <5% |
| CPU Usage | <70% | <90% |
| Memory Usage | <80% | <95% |

### Synthetic Monitoring

Implement synthetic checks:

```bash
# Health check script
#!/bin/bash
ENDPOINT="https://personalguide.app/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ $RESPONSE -ne 200 ]; then
  echo "Health check failed: HTTP $RESPONSE"
  exit 1
fi

echo "Health check passed"
```

### Real User Monitoring (RUM)

Track real user performance:

```typescript
// Client-side performance tracking
if (typeof window !== 'undefined') {
  // Core Web Vitals
  import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

  function sendToAnalytics(metric) {
    // Send to your analytics service
    console.log(metric);
  }

  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

## 🛠️ Troubleshooting

### Common Issues

#### Metrics Not Appearing

1. **Check application metrics endpoint**:
   ```bash
   curl http://localhost:3000/api/metrics
   ```

2. **Verify Prometheus scraping**:
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

3. **Check Prometheus logs**:
   ```bash
   docker-compose logs prometheus
   ```

#### Grafana Dashboard Issues

1. **Verify data source connection**:
   - Go to Configuration → Data Sources
   - Test Prometheus connection

2. **Check query syntax**:
   - Use Prometheus query browser
   - Verify metric names and labels

3. **Import dashboard manually**:
   ```bash
   # Copy dashboard JSON and import via UI
   cat grafana/dashboards/personal-guide.json
   ```

#### Alertmanager Not Sending Alerts

1. **Check Alertmanager configuration**:
   ```bash
   docker-compose exec alertmanager cat /etc/alertmanager/alertmanager.yml
   ```

2. **Verify SMTP settings**:
   ```bash
   # Test email configuration
   docker-compose logs alertmanager
   ```

3. **Check alert routing**:
   - Visit http://localhost:9093/#/alerts
   - Verify alerts are being received

### Performance Optimization

#### Reduce Monitoring Overhead

1. **Optimize scrape intervals**:
   ```yaml
   scrape_interval: 30s  # Increase for less critical metrics
   ```

2. **Limit metric cardinality**:
   ```typescript
   // Avoid high-cardinality labels
   const counter = new Counter({
     name: 'requests_total',
     labelNames: ['method', 'status'] // Not 'user_id'
   });
   ```

3. **Use recording rules**:
   ```yaml
   groups:
     - name: personal_guide_rules
       rules:
         - record: job:http_requests:rate5m
           expr: rate(http_requests_total[5m])
   ```

## 📚 Best Practices

### Monitoring Strategy

1. **Start with the Four Golden Signals**:
   - Latency
   - Traffic
   - Errors
   - Saturation

2. **Monitor Business Metrics**:
   - User engagement
   - Feature adoption
   - Revenue impact

3. **Implement SLIs and SLOs**:
   - Service Level Indicators
   - Service Level Objectives
   - Error budgets

### Alert Management

1. **Meaningful Alerts**:
   - Only alert on actionable issues
   - Provide context in alert messages
   - Include runbook links

2. **Alert Fatigue Prevention**:
   - Tune thresholds carefully
   - Use alert grouping
   - Implement alert escalation

3. **Incident Response**:
   - Clear escalation procedures
   - Post-incident reviews
   - Continuous improvement

### Dashboard Design

1. **User-Focused Dashboards**:
   - Different dashboards for different audiences
   - Clear and intuitive layouts
   - Relevant time ranges

2. **Performance Optimization**:
   - Limit queries per dashboard
   - Use appropriate time ranges
   - Cache expensive queries

## 🔮 Advanced Features

### Custom Metrics Collection

```typescript
// Custom business logic metrics
export class MetricsCollector {
  private static aiInteractionCounter = new Counter({
    name: 'ai_interactions_total',
    help: 'Total AI interactions',
    labelNames: ['user_id', 'interaction_type', 'success']
  });

  static recordAIInteraction(
    userId: string,
    type: string,
    success: boolean
  ) {
    this.aiInteractionCounter
      .labels(userId, type, success.toString())
      .inc();
  }
}
```

### Integration with External Services

```typescript
// Sentry integration for error tracking
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ],
  tracesSampleRate: 0.1
});
```

### Automated Anomaly Detection

```yaml
# Prometheus rules for anomaly detection
groups:
  - name: anomaly_detection
    rules:
      - alert: ResponseTimeAnomaly
        expr: |
          (
            rate(http_request_duration_seconds_sum[5m]) /
            rate(http_request_duration_seconds_count[5m])
          ) >
          (
            avg_over_time(
              rate(http_request_duration_seconds_sum[5m])[1d:5m] /
              rate(http_request_duration_seconds_count[5m])[1d:5m]
            ) * 2
          )
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Response time anomaly detected"
```

This monitoring setup provides comprehensive observability into your Personal Guide application, enabling proactive issue detection and resolution.