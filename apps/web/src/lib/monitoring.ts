// =============================================================================
// MONITORING & OBSERVABILITY SERVICE
// =============================================================================

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  componentStack?: string
  url: string
  userAgent: string
  timestamp: string
  userId?: string
  sessionId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
}

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: string
  tags?: Record<string, string>
}

export interface UserAction {
  id: string
  action: string
  target: string
  timestamp: string
  userId?: string
  sessionId: string
  metadata?: Record<string, any>
}

class MonitoringService {
  private sessionId: string
  private userId?: string
  private isEnabled: boolean
  private queue: (ErrorReport | PerformanceMetric | UserAction)[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true'

    if (this.isEnabled) {
      this.initializeMonitoring()
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeMonitoring() {
    // Start performance observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializePerformanceObserver()
    }

    // Start error handlers
    this.initializeErrorHandlers()

    // Start flush interval
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 30000) // Flush every 30 seconds
  }

  private initializePerformanceObserver() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric({
            name: entry.name,
            value: entry.duration || entry.startTime,
            unit: 'ms',
            tags: {
              type: entry.entryType,
              ...(entry.entryType === 'navigation' && {
                loadType: (entry as PerformanceNavigationTiming).type.toString()
              })
            }
          })
        }
      })

      observer.observe({
        entryTypes: ['navigation', 'measure', 'paint', 'largest-contentful-paint']
      })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }
  }

  private initializeErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Global error handler
      window.addEventListener('error', (event) => {
        this.reportError({
          message: event.message,
          stack: event.error?.stack,
          severity: 'high',
          context: {
            url: event.filename,
            line: event.lineno,
            column: event.colno,
            type: 'javascript-error'
          }
        })
      })

      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        this.reportError({
          message: event.reason?.message || 'Unhandled promise rejection',
          stack: event.reason?.stack,
          severity: 'high',
          context: {
            type: 'unhandled-promise-rejection',
            reason: event.reason
          }
        })
      })
    }
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  reportError(error: {
    message: string
    stack?: string
    componentStack?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    context?: Record<string, any>
  }) {
    if (!this.isEnabled) return

    const report: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      componentStack: error.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      severity: error.severity || 'medium',
      context: error.context
    }

    this.queue.push(report)

    // Immediate flush for critical errors
    if (error.severity === 'critical') {
      this.flush()
    }
  }

  recordPerformanceMetric(metric: {
    name: string
    value: number
    unit: string
    tags?: Record<string, string>
  }) {
    if (!this.isEnabled) return

    const performanceMetric: PerformanceMetric = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      timestamp: new Date().toISOString(),
      tags: metric.tags
    }

    this.queue.push(performanceMetric)
  }

  trackUserAction(action: {
    action: string
    target: string
    metadata?: Record<string, any>
  }) {
    if (!this.isEnabled) return

    const userAction: UserAction = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action: action.action,
      target: action.target,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      metadata: action.metadata
    }

    this.queue.push(userAction)
  }

  // Measure and record function execution time
  measureExecutionTime<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.recordPerformanceMetric({
      name: `function.${name}`,
      value: duration,
      unit: 'ms',
      tags: { type: 'function-execution' }
    })

    return result
  }

  // Measure and record async function execution time
  async measureAsyncExecutionTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    this.recordPerformanceMetric({
      name: `function.${name}`,
      value: duration,
      unit: 'ms',
      tags: { type: 'async-function-execution' }
    })

    return result
  }

  // Record custom metrics
  recordCustomMetric(name: string, value: number, unit: string = 'count', tags?: Record<string, string>) {
    this.recordPerformanceMetric({ name, value, unit, tags })
  }

  // Record business metrics
  recordBusinessMetric(metric: {
    name: string
    value: number
    userId?: string
    context?: Record<string, any>
  }) {
    this.recordPerformanceMetric({
      name: `business.${metric.name}`,
      value: metric.value,
      unit: 'count',
      tags: {
        userId: metric.userId || this.userId || 'anonymous',
        ...metric.context
      }
    })
  }

  private async flush() {
    if (this.queue.length === 0) return

    const batch = [...this.queue]
    this.queue = []

    try {
      // In production, this would send to your monitoring service
      // For now, we'll log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('📊 Monitoring Data')

        const errors = batch.filter(item => 'severity' in item)
        const performance = batch.filter(item => 'value' in item && !('action' in item))
        const actions = batch.filter(item => 'action' in item)

        if (errors.length > 0) {
          console.group('🔴 Errors')
          errors.forEach(error => console.error(error))
          console.groupEnd()
        }

        if (performance.length > 0) {
          console.group('⚡ Performance')
          performance.forEach(metric => console.log(metric))
          console.groupEnd()
        }

        if (actions.length > 0) {
          console.group('👤 User Actions')
          actions.forEach(action => console.log(action))
          console.groupEnd()
        }

        console.groupEnd()
      }

      // Send to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        await this.sendToMonitoringService(batch)
      }

    } catch (error) {
      console.error('Failed to flush monitoring data:', error)
      // Re-add items back to queue for retry
      this.queue.unshift(...batch)
    }
  }

  // Send monitoring data to external service
  private async sendToMonitoringService(batch: (ErrorReport | PerformanceMetric | UserAction)[]) {
    try {
      // Sentry integration example
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        const errors = batch.filter(item => 'severity' in item) as ErrorReport[]
        for (const error of errors) {
          // Sentry.captureException would go here
          console.log('Would send to Sentry:', error)
        }
      }

      // DataDog integration example
      if (process.env.NEXT_PUBLIC_DATADOG_API_KEY) {
        const metrics = batch.filter(item => 'value' in item && !('action' in item)) as PerformanceMetric[]
        // DataDog metrics API call would go here
        console.log('Would send to DataDog:', metrics)
      }

      // LogRocket integration example
      if (process.env.NEXT_PUBLIC_LOGROCKET_APP_ID) {
        const actions = batch.filter(item => 'action' in item) as UserAction[]
        // LogRocket session recording would go here
        console.log('Would send to LogRocket:', actions)
      }

      // Generic webhook fallback
      if (process.env.NEXT_PUBLIC_MONITORING_WEBHOOK) {
        await fetch(process.env.NEXT_PUBLIC_MONITORING_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MONITORING_TOKEN || ''}`
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            source: 'personal-guide-web',
            batch
          })
        })
      }
    } catch (error) {
      console.error('Failed to send to monitoring service:', error)
      throw error
    }
  }

  // Health check functionality
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, { status: 'pass' | 'fail', message?: string }>
  }> {
    const checks: Record<string, { status: 'pass' | 'fail', message?: string }> = {}

    // Check localStorage availability
    try {
      localStorage.setItem('health-check', 'test')
      localStorage.removeItem('health-check')
      checks.localStorage = { status: 'pass' }
    } catch (error) {
      checks.localStorage = { status: 'fail', message: 'localStorage unavailable' }
    }

    // Check performance API
    checks.performanceAPI = {
      status: typeof performance !== 'undefined' && 'now' in performance ? 'pass' : 'fail'
    }

    // Check network connectivity (basic)
    try {
      if (navigator.onLine !== undefined) {
        checks.networkConnectivity = { status: navigator.onLine ? 'pass' : 'fail' }
      }
    } catch (error) {
      checks.networkConnectivity = { status: 'fail', message: 'Cannot check network status' }
    }

    // Check memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      checks.memoryUsage = {
        status: memoryUsage < 0.9 ? 'pass' : 'fail',
        message: `${Math.round(memoryUsage * 100)}% used`
      }
    }

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length
    const status = failedChecks === 0 ? 'healthy' : failedChecks <= 1 ? 'degraded' : 'unhealthy'

    return { status, checks }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    // Final flush
    this.flush()
  }
}

// Create singleton instance
const monitoring = new MonitoringService()

// Export convenience functions
export const reportError = (error: Parameters<MonitoringService['reportError']>[0]) =>
  monitoring.reportError(error)

export const recordPerformanceMetric = (metric: Parameters<MonitoringService['recordPerformanceMetric']>[0]) =>
  monitoring.recordPerformanceMetric(metric)

export const trackUserAction = (action: Parameters<MonitoringService['trackUserAction']>[0]) =>
  monitoring.trackUserAction(action)

export const measureExecutionTime = <T>(name: string, fn: () => T): T =>
  monitoring.measureExecutionTime(name, fn)

export const measureAsyncExecutionTime = <T>(name: string, fn: () => Promise<T>): Promise<T> =>
  monitoring.measureAsyncExecutionTime(name, fn)

export const recordCustomMetric = (name: string, value: number, unit?: string, tags?: Record<string, string>) =>
  monitoring.recordCustomMetric(name, value, unit, tags)

export const recordBusinessMetric = (metric: Parameters<MonitoringService['recordBusinessMetric']>[0]) =>
  monitoring.recordBusinessMetric(metric)

export const setUserId = (userId: string) => monitoring.setUserId(userId)

export const performHealthCheck = () => monitoring.performHealthCheck()

export default monitoring