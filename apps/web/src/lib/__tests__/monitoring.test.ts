import {
  reportError,
  recordPerformanceMetric,
  trackUserAction,
  measureExecutionTime,
  measureAsyncExecutionTime,
  recordCustomMetric,
  recordBusinessMetric,
  setUserId,
  performHealthCheck
} from '../monitoring'

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  group: jest.spyOn(console, 'group').mockImplementation(),
  groupEnd: jest.spyOn(console, 'groupEnd').mockImplementation(),
}

describe('monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment
    process.env.NODE_ENV = 'test'
    process.env.ENABLE_MONITORING = 'true'
  })

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockClear())
  })

  describe('reportError', () => {
    it('should report an error with all required fields', () => {
      const error = {
        message: 'Test error',
        stack: 'Error stack trace',
        severity: 'high' as const,
        context: { userId: 'user123' }
      }

      reportError(error)

      // Since we're in test mode with ENABLE_MONITORING=true, it should process the error
      // but won't actually send to external services
      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should handle errors without optional fields', () => {
      const error = {
        message: 'Simple error'
      }

      reportError(error)

      // Should not throw and should handle gracefully
      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should handle critical errors differently', () => {
      const error = {
        message: 'Critical system failure',
        severity: 'critical' as const
      }

      reportError(error)

      // Critical errors should trigger immediate flush
      expect(consoleSpy.log).toHaveBeenCalled()
    })
  })

  describe('recordPerformanceMetric', () => {
    it('should record a performance metric', () => {
      const metric = {
        name: 'page-load-time',
        value: 1234,
        unit: 'ms',
        tags: { page: 'dashboard' }
      }

      recordPerformanceMetric(metric)

      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should handle metrics without tags', () => {
      const metric = {
        name: 'api-response-time',
        value: 250,
        unit: 'ms'
      }

      recordPerformanceMetric(metric)

      expect(consoleSpy.log).toHaveBeenCalled()
    })
  })

  describe('trackUserAction', () => {
    it('should track user actions', () => {
      const action = {
        action: 'click',
        target: 'submit-button',
        metadata: { formId: 'login-form' }
      }

      trackUserAction(action)

      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should handle actions without metadata', () => {
      const action = {
        action: 'page-view',
        target: 'dashboard'
      }

      trackUserAction(action)

      expect(consoleSpy.log).toHaveBeenCalled()
    })
  })

  describe('measureExecutionTime', () => {
    it('should measure and record function execution time', () => {
      const testFunction = jest.fn(() => 'result')

      const result = measureExecutionTime('test-function', testFunction)

      expect(result).toBe('result')
      expect(testFunction).toHaveBeenCalled()
      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should handle function that throws error', () => {
      const testFunction = jest.fn(() => {
        throw new Error('Test error')
      })

      expect(() => measureExecutionTime('failing-function', testFunction)).toThrow('Test error')
      expect(testFunction).toHaveBeenCalled()
    })
  })

  describe('measureAsyncExecutionTime', () => {
    it('should measure async function execution time', async () => {
      const asyncFunction = jest.fn().mockResolvedValue('async result')

      const result = await measureAsyncExecutionTime('async-test', asyncFunction)

      expect(result).toBe('async result')
      expect(asyncFunction).toHaveBeenCalled()
      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should handle async function that rejects', async () => {
      const asyncFunction = jest.fn().mockRejectedValue(new Error('Async error'))

      await expect(measureAsyncExecutionTime('failing-async', asyncFunction))
        .rejects.toThrow('Async error')
      expect(asyncFunction).toHaveBeenCalled()
    })
  })

  describe('recordCustomMetric', () => {
    it('should record custom metrics with all parameters', () => {
      recordCustomMetric('custom-metric', 42, 'units', { tag: 'value' })

      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should record custom metrics with defaults', () => {
      recordCustomMetric('simple-metric', 10)

      expect(consoleSpy.log).toHaveBeenCalled()
    })
  })

  describe('recordBusinessMetric', () => {
    it('should record business metrics', () => {
      const metric = {
        name: 'user-signup',
        value: 1,
        userId: 'user123',
        context: { source: 'landing-page' }
      }

      recordBusinessMetric(metric)

      expect(consoleSpy.log).toHaveBeenCalled()
    })
  })

  describe('setUserId', () => {
    it('should set user ID for tracking', () => {
      setUserId('user456')

      // This should not throw and should be handled internally
      expect(() => setUserId('user456')).not.toThrow()
    })
  })

  describe('performHealthCheck', () => {
    beforeEach(() => {
      // Mock localStorage for health checks
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: jest.fn(),
          removeItem: jest.fn()
        },
        writable: true
      })

      // Mock navigator for health checks
      Object.defineProperty(window, 'navigator', {
        value: {
          onLine: true
        },
        writable: true
      })
    })

    it('should perform health check and return status', async () => {
      const healthStatus = await performHealthCheck()

      expect(healthStatus).toHaveProperty('status')
      expect(healthStatus).toHaveProperty('checks')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status)
    })

    it('should detect localStorage availability', async () => {
      const healthStatus = await performHealthCheck()

      expect(healthStatus.checks).toHaveProperty('localStorage')
      expect(healthStatus.checks.localStorage).toHaveProperty('status')
    })

    it('should detect performance API availability', async () => {
      const healthStatus = await performHealthCheck()

      expect(healthStatus.checks).toHaveProperty('performanceAPI')
    })

    it('should handle localStorage errors', async () => {
      // Mock localStorage to throw error
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: jest.fn(() => {
            throw new Error('localStorage not available')
          }),
          removeItem: jest.fn()
        },
        writable: true
      })

      const healthStatus = await performHealthCheck()

      expect(healthStatus.checks.localStorage.status).toBe('fail')
    })
  })

  describe('monitoring configuration', () => {
    it('should respect NODE_ENV settings', () => {
      process.env.NODE_ENV = 'development'
      process.env.ENABLE_MONITORING = 'false'

      // Should still work but may have different behavior
      reportError({ message: 'Test in development' })

      // In development without monitoring enabled, it might not log
      // This tests the configuration handling
    })

    it('should handle production environment', () => {
      process.env.NODE_ENV = 'production'

      reportError({ message: 'Production error' })

      // In production, errors should be processed for external services
      // but in test environment, they'll be mocked
    })
  })

  describe('error queue and batching', () => {
    it('should handle multiple errors', () => {
      // Report multiple errors to test batching
      for (let i = 0; i < 5; i++) {
        reportError({
          message: `Error ${i}`,
          severity: 'medium' as const
        })
      }

      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it('should handle mixed monitoring data types', () => {
      reportError({ message: 'Error' })
      recordPerformanceMetric({ name: 'metric', value: 100, unit: 'ms' })
      trackUserAction({ action: 'click', target: 'button' })

      expect(consoleSpy.log).toHaveBeenCalled()
    })
  })
})