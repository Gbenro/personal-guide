import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import {
  usePerformanceMonitoring,
  usePagePerformance,
  useFormPerformance,
  useScrollPerformance
} from '../usePerformanceMonitoring'
import * as monitoring from '@/lib/monitoring'

// Mock the monitoring module
jest.mock('@/lib/monitoring')

const mockRecordPerformanceMetric = monitoring.recordPerformanceMetric as jest.MockedFunction<
  typeof monitoring.recordPerformanceMetric
>
const mockMeasureAsyncExecutionTime = monitoring.measureAsyncExecutionTime as jest.MockedFunction<
  typeof monitoring.measureAsyncExecutionTime
>

// Mock performance.now()
const mockPerformanceNow = jest.fn()
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  },
  writable: true
})

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPerformanceNow.mockReturnValue(1000)
  })

  describe('usePerformanceMonitoring hook', () => {
    it('should track component mount duration', () => {
      const { unmount } = renderHook(() =>
        usePerformanceMonitoring({ componentName: 'TestComponent' })
      )

      // Simulate time passing
      mockPerformanceNow.mockReturnValue(1100)

      unmount()

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'component.TestComponent.mount-duration',
        value: 100,
        unit: 'ms',
        tags: {
          type: 'component-lifecycle',
          component: 'TestComponent'
        }
      })
    })

    it('should track render performance', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({ componentName: 'TestComponent' })
      )

      act(() => {
        result.current.trackRenderPerformance('initial')
      })

      // Simulate second render
      mockPerformanceNow.mockReturnValue(1050)

      act(() => {
        result.current.trackRenderPerformance('update')
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'component.TestComponent.render-time',
        value: 50,
        unit: 'ms',
        tags: {
          type: 'component-performance',
          component: 'TestComponent',
          renderType: 'update'
        }
      })
    })

    it('should track user interactions', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({ componentName: 'TestComponent' })
      )

      act(() => {
        result.current.trackInteraction('click', 'submit-button')
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'interaction.click',
        value: 1,
        unit: 'count',
        tags: {
          type: 'user-interaction',
          component: 'TestComponent',
          target: 'submit-button'
        }
      })
    })

    it('should track API calls with timing', async () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({ componentName: 'TestComponent' })
      )

      const mockApiCall = jest.fn().mockResolvedValue('api result')
      mockMeasureAsyncExecutionTime.mockImplementation((name, fn) => fn())

      const apiResult = await result.current.trackApiCall('fetchUser', mockApiCall)

      expect(apiResult).toBe('api result')
      expect(mockMeasureAsyncExecutionTime).toHaveBeenCalledWith('api.fetchUser', expect.any(Function))
      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'api.fetchUser.success',
        value: 1,
        unit: 'count',
        tags: {
          type: 'api-call',
          component: 'TestComponent',
          status: 'success'
        }
      })
    })

    it('should track API call errors', async () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({ componentName: 'TestComponent' })
      )

      const mockApiCall = jest.fn().mockRejectedValue(new Error('API error'))
      mockMeasureAsyncExecutionTime.mockImplementation((name, fn) => fn())

      await expect(result.current.trackApiCall('fetchUser', mockApiCall)).rejects.toThrow('API error')

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'api.fetchUser.error',
        value: 1,
        unit: 'count',
        tags: {
          type: 'api-call',
          component: 'TestComponent',
          status: 'error'
        }
      })
    })

    it('should track loading time', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({ componentName: 'TestComponent' })
      )

      const startTime = 900
      mockPerformanceNow.mockReturnValue(1200)

      act(() => {
        result.current.trackLoadingTime('data-loading', startTime)
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'loading.data-loading',
        value: 300,
        unit: 'ms',
        tags: {
          type: 'loading-performance',
          component: 'TestComponent'
        }
      })
    })

    it('should track memory usage when available', () => {
      // Mock performance.memory
      Object.defineProperty(global, 'performance', {
        value: {
          now: mockPerformanceNow,
          memory: {
            usedJSHeapSize: 5000000,
            jsHeapSizeLimit: 10000000
          }
        },
        writable: true
      })

      const { result } = renderHook(() =>
        usePerformanceMonitoring({ componentName: 'TestComponent' })
      )

      act(() => {
        result.current.trackMemoryUsage()
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'memory.used-heap-size',
        value: 5000000,
        unit: 'bytes',
        tags: {
          type: 'memory-usage',
          component: 'TestComponent'
        }
      })
    })

    it('should respect tracking options', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitoring({
          componentName: 'TestComponent',
          trackRender: false,
          trackUserInteractions: false,
          trackApiCalls: false
        })
      )

      act(() => {
        result.current.trackInteraction('click', 'button')
      })

      // Should not track because trackUserInteractions is false
      expect(mockRecordPerformanceMetric).not.toHaveBeenCalled()
    })
  })

  describe('usePagePerformance hook', () => {
    it('should track page navigation', () => {
      const { result } = renderHook(() => usePagePerformance('dashboard'))

      act(() => {
        result.current.trackPageNavigation('profile', 'button')
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'navigation.dashboard-to-profile',
        value: 1,
        unit: 'count',
        tags: {
          type: 'page-navigation',
          fromPage: 'dashboard',
          toPage: 'profile',
          method: 'button'
        }
      })
    })

    it('should track page visibility changes', () => {
      renderHook(() => usePagePerformance('dashboard'))

      // Simulate visibility change
      Object.defineProperty(document, 'hidden', { value: true, writable: true })
      fireEvent(document, new Event('visibilitychange'))

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'page.dashboard.visibility-change',
        value: 1,
        unit: 'count',
        tags: {
          type: 'page-visibility',
          page: 'dashboard',
          visible: false
        }
      })
    })
  })

  describe('useFormPerformance hook', () => {
    it('should track form lifecycle', () => {
      const { result } = renderHook(() => useFormPerformance('login-form'))

      act(() => {
        result.current.trackFormStart()
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'form.login-form.started',
        value: 1,
        unit: 'count',
        tags: {
          type: 'form-interaction',
          form: 'login-form',
          action: 'start'
        }
      })
    })

    it('should track field interactions', () => {
      const { result } = renderHook(() => useFormPerformance('login-form'))

      act(() => {
        result.current.trackFieldInteraction('username', 'focus')
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'form.login-form.field-focus',
        value: 1,
        unit: 'count',
        tags: {
          type: 'form-field-interaction',
          form: 'login-form',
          field: 'username',
          interaction: 'focus'
        }
      })
    })

    it('should track form submission with timing', () => {
      const { result } = renderHook(() => useFormPerformance('login-form'))

      mockPerformanceNow.mockReturnValue(1000)

      act(() => {
        result.current.trackFormStart()
      })

      // Simulate some field interactions
      act(() => {
        result.current.trackFieldInteraction('username', 'input')
        result.current.trackFieldInteraction('password', 'input')
      })

      mockPerformanceNow.mockReturnValue(1500)

      act(() => {
        result.current.trackFormSubmission(true, [])
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'form.login-form.submission-time',
          value: 500,
          unit: 'ms'
        })
      )

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'form.login-form.success',
        value: 1,
        unit: 'count',
        tags: {
          type: 'form-result',
          form: 'login-form'
        }
      })
    })

    it('should track form submission failures', () => {
      const { result } = renderHook(() => useFormPerformance('login-form'))

      act(() => {
        result.current.trackFormStart()
        result.current.trackFormSubmission(false, ['Invalid username'])
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'form.login-form.error',
          value: 1,
          unit: 'count'
        })
      )
    })
  })

  describe('useScrollPerformance hook', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should track scroll performance', () => {
      renderHook(() => useScrollPerformance('content-area'))

      // Simulate scroll start
      fireEvent(window, new Event('scrollstart'))

      mockPerformanceNow.mockReturnValue(1100)

      // Simulate multiple scroll events
      fireEvent.scroll(window)
      fireEvent.scroll(window)
      fireEvent.scroll(window)

      mockPerformanceNow.mockReturnValue(1200)

      // Simulate scroll end (via timeout)
      jest.advanceTimersByTime(200)

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'scroll.content-area.duration',
        value: 100,
        unit: 'ms',
        tags: {
          type: 'scroll-performance',
          component: 'content-area'
        }
      })

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith({
        name: 'scroll.content-area.events',
        value: 3,
        unit: 'count',
        tags: {
          type: 'scroll-events',
          component: 'content-area'
        }
      })
    })
  })

  describe('performance monitoring integration', () => {
    it('should work with React component lifecycle', () => {
      const TestComponent = () => {
        const { trackRenderPerformance, trackInteraction } = usePerformanceMonitoring({
          componentName: 'TestComponent'
        })

        React.useEffect(() => {
          trackRenderPerformance('initial')
        }, [trackRenderPerformance])

        return (
          <button onClick={() => trackInteraction('click', 'test-button')}>
            Test Button
          </button>
        )
      }

      render(<TestComponent />)

      fireEvent.click(screen.getByText('Test Button'))

      expect(mockRecordPerformanceMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'interaction.click'
        })
      )
    })
  })
})