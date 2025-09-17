# Error Tracking Setup

## Overview
The Personal Guide application includes comprehensive error tracking and monitoring capabilities to ensure high reliability and quick issue resolution.

## Features

### 1. Error Reporting
- **Global Error Handler**: Catches unhandled JavaScript errors
- **Promise Rejection Handler**: Captures unhandled promise rejections
- **Component Error Boundaries**: React component-level error catching
- **Custom Error Reporting**: Manual error reporting with context

### 2. Error Classification
- **Severity Levels**: Critical, High, Medium, Low
- **Error Types**: JavaScript errors, Component errors, API errors, Network errors
- **Context Capture**: Component stack, user actions, session data

### 3. Monitoring Dashboard
- Real-time error metrics and trends
- Error breakdown by type, severity, and component
- System health monitoring
- Recent error logs with detailed information

## Configuration

### Environment Variables

```bash
# Required for production monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_DATADOG_API_KEY=your_datadog_key
NEXT_PUBLIC_LOGROCKET_APP_ID=your_logrocket_id

# Generic webhook fallback
NEXT_PUBLIC_MONITORING_WEBHOOK=https://your-monitoring-service.com/webhook
NEXT_PUBLIC_MONITORING_TOKEN=your_auth_token

# Enable monitoring in development
ENABLE_MONITORING=true
```

### Supported Services

1. **Sentry** - Error tracking and performance monitoring
2. **DataDog** - Application performance monitoring
3. **LogRocket** - Session recording and user analytics
4. **Generic Webhook** - Custom monitoring solutions

## Usage

### Automatic Error Catching

The monitoring system automatically captures:
- Unhandled JavaScript errors
- Unhandled promise rejections
- React component errors via Error Boundaries

### Manual Error Reporting

```typescript
import { reportError } from '@/lib/monitoring'

// Report a custom error
reportError({
  message: 'User authentication failed',
  severity: 'high',
  context: {
    userId: user.id,
    attemptCount: 3,
    action: 'login'
  }
})
```

### Error Boundaries

Wrap components with error boundaries for graceful error handling:

```typescript
import ErrorBoundary from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Custom error handling
        console.log('Component error:', error)
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  )
}
```

### Using Error Hooks

```typescript
import { useErrorHandler } from '@/components/ErrorBoundary'

function MyComponent() {
  const handleError = useErrorHandler()

  const handleAsyncOperation = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      handleError(error)
    }
  }
}
```

## Error Dashboard

Access the error tracking dashboard at `/admin/errors` (admin access required).

Features:
- Error overview with metrics
- Error breakdown by type, severity, component
- Recent error logs
- System health status
- Real-time updates

## Health Monitoring

The system performs regular health checks:
- localStorage availability
- Performance API functionality
- Network connectivity
- Memory usage (where available)

Health status is reported as:
- **Healthy**: All checks pass
- **Degraded**: One check fails
- **Unhealthy**: Multiple checks fail

## Performance Impact

- Error tracking has minimal performance overhead
- Errors are batched and sent every 30 seconds
- Critical errors are sent immediately
- Data is compressed and optimized for transmission

## Privacy & Security

- No sensitive data is logged
- User data is anonymized
- Error reports include only necessary debugging information
- All data transmission is encrypted

## Development vs Production

**Development Mode:**
- Errors logged to browser console
- Detailed error information displayed
- Extended debugging context

**Production Mode:**
- Errors sent to configured monitoring services
- User-friendly error messages
- Automatic error recovery where possible

## Troubleshooting

### Common Issues

1. **Monitoring not working in development**
   - Set `ENABLE_MONITORING=true` in your `.env.local`
   - Check browser console for monitoring logs

2. **Errors not appearing in external services**
   - Verify environment variables are set correctly
   - Check network connectivity
   - Review service-specific documentation

3. **Performance issues**
   - Monitor batch size and frequency
   - Check memory usage in development tools
   - Consider reducing monitoring scope if needed

### Debug Commands

```bash
# Check monitoring configuration
npm run check-monitoring

# Test error reporting
npm run test-errors

# View error logs
npm run logs:errors
```

## Best Practices

1. **Use appropriate severity levels**
   - Critical: System breaking errors
   - High: Major feature failures
   - Medium: Minor issues affecting UX
   - Low: Warnings and info messages

2. **Provide meaningful context**
   - Include user actions leading to error
   - Add relevant component or page information
   - Include any relevant IDs or parameters

3. **Handle errors gracefully**
   - Always provide fallback UI
   - Show user-friendly error messages
   - Implement retry mechanisms where appropriate

4. **Monitor error trends**
   - Regular review of error dashboard
   - Track error resolution progress
   - Identify patterns and common issues

## Integration Examples

### Next.js API Routes

```typescript
// pages/api/example.ts
import { reportError } from '@/lib/monitoring'

export default async function handler(req, res) {
  try {
    // API logic here
  } catch (error) {
    reportError({
      message: error.message,
      severity: 'high',
      context: {
        api: req.url,
        method: req.method,
        userId: req.user?.id
      }
    })

    res.status(500).json({ error: 'Internal server error' })
  }
}
```

### React Components

```typescript
// components/DataFetcher.tsx
import { useErrorHandler } from '@/components/ErrorBoundary'

export function DataFetcher() {
  const handleError = useErrorHandler()

  useEffect(() => {
    fetchData().catch(handleError)
  }, [handleError])
}
```

This comprehensive error tracking system ensures that issues are caught early, properly categorized, and efficiently resolved, maintaining a high-quality user experience.