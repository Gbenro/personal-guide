'use client'

import { useEffect, useCallback, useRef } from 'react'
import { recordPerformanceMetric, measureAsyncExecutionTime } from '@/lib/monitoring'

interface PerformanceHookOptions {
  trackRender?: boolean
  trackUserInteractions?: boolean
  trackApiCalls?: boolean
  componentName?: string
}

export function usePerformanceMonitoring(options: PerformanceHookOptions = {}) {
  const {
    trackRender = true,
    trackUserInteractions = true,
    trackApiCalls = true,
    componentName = 'Unknown'
  } = options

  const renderStartTime = useRef<number>(0)
  const mountTime = useRef<number>(0)

  // Track component mount time
  useEffect(() => {
    mountTime.current = performance.now()

    return () => {
      const unmountTime = performance.now()
      const mountDuration = unmountTime - mountTime.current

      if (trackRender) {
        recordPerformanceMetric({
          name: `component.${componentName}.mount-duration`,
          value: mountDuration,
          unit: 'ms',
          tags: {
            type: 'component-lifecycle',
            component: componentName
          }
        })
      }
    }
  }, [componentName, trackRender])

  // Track render performance
  const trackRenderPerformance = useCallback((renderType: 'initial' | 'update' = 'update') => {
    if (!trackRender) return

    const renderTime = performance.now()

    if (renderStartTime.current > 0) {
      const renderDuration = renderTime - renderStartTime.current

      recordPerformanceMetric({
        name: `component.${componentName}.render-time`,
        value: renderDuration,
        unit: 'ms',
        tags: {
          type: 'component-performance',
          component: componentName,
          renderType
        }
      })
    }

    renderStartTime.current = renderTime
  }, [componentName, trackRender])

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string, target?: string) => {
    if (!trackUserInteractions) return

    recordPerformanceMetric({
      name: `interaction.${interactionType}`,
      value: 1,
      unit: 'count',
      tags: {
        type: 'user-interaction',
        component: componentName,
        target: target || 'unknown'
      }
    })
  }, [componentName, trackUserInteractions])

  // Track API calls with timing
  const trackApiCall = useCallback(async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    if (!trackApiCalls) {
      return apiCall()
    }

    return measureAsyncExecutionTime(`api.${apiName}`, async () => {
      try {
        const result = await apiCall()

        recordPerformanceMetric({
          name: `api.${apiName}.success`,
          value: 1,
          unit: 'count',
          tags: {
            type: 'api-call',
            component: componentName,
            status: 'success'
          }
        })

        return result
      } catch (error) {
        recordPerformanceMetric({
          name: `api.${apiName}.error`,
          value: 1,
          unit: 'count',
          tags: {
            type: 'api-call',
            component: componentName,
            status: 'error'
          }
        })
        throw error
      }
    })
  }, [componentName, trackApiCalls])

  // Track loading states
  const trackLoadingTime = useCallback((loadingType: string, startTime: number) => {
    const loadingDuration = performance.now() - startTime

    recordPerformanceMetric({
      name: `loading.${loadingType}`,
      value: loadingDuration,
      unit: 'ms',
      tags: {
        type: 'loading-performance',
        component: componentName
      }
    })
  }, [componentName])

  // Track memory usage
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory

      recordPerformanceMetric({
        name: `memory.used-heap-size`,
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        tags: {
          type: 'memory-usage',
          component: componentName
        }
      })

      recordPerformanceMetric({
        name: `memory.heap-size-limit`,
        value: memory.jsHeapSizeLimit,
        unit: 'bytes',
        tags: {
          type: 'memory-limit',
          component: componentName
        }
      })
    }
  }, [componentName])

  // Track bundle size impact
  const trackBundleImpact = useCallback((bundleName: string, size: number) => {
    recordPerformanceMetric({
      name: `bundle.${bundleName}.size`,
      value: size,
      unit: 'bytes',
      tags: {
        type: 'bundle-size',
        component: componentName
      }
    })
  }, [componentName])

  return {
    trackRenderPerformance,
    trackInteraction,
    trackApiCall,
    trackLoadingTime,
    trackMemoryUsage,
    trackBundleImpact
  }
}

// Hook for tracking page performance
export function usePagePerformance(pageName: string) {
  const pageLoadStart = useRef<number>(0)

  useEffect(() => {
    pageLoadStart.current = performance.now()

    // Track page load performance
    const handleLoad = () => {
      const loadTime = performance.now() - pageLoadStart.current

      recordPerformanceMetric({
        name: `page.${pageName}.load-time`,
        value: loadTime,
        unit: 'ms',
        tags: {
          type: 'page-performance',
          page: pageName
        }
      })
    }

    // Track page visibility changes
    const handleVisibilityChange = () => {
      recordPerformanceMetric({
        name: `page.${pageName}.visibility-change`,
        value: 1,
        unit: 'count',
        tags: {
          type: 'page-visibility',
          page: pageName,
          visible: !document.hidden
        }
      })
    }

    window.addEventListener('load', handleLoad)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('load', handleLoad)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pageName])

  // Track page navigation
  const trackPageNavigation = useCallback((targetPage: string, method: 'link' | 'button' | 'programmatic') => {
    recordPerformanceMetric({
      name: `navigation.${pageName}-to-${targetPage}`,
      value: 1,
      unit: 'count',
      tags: {
        type: 'page-navigation',
        fromPage: pageName,
        toPage: targetPage,
        method
      }
    })
  }, [pageName])

  return {
    trackPageNavigation
  }
}

// Hook for tracking form performance
export function useFormPerformance(formName: string) {
  const formStartTime = useRef<number>(0)
  const fieldInteractions = useRef<Record<string, number>>({})

  const trackFormStart = useCallback(() => {
    formStartTime.current = performance.now()
    fieldInteractions.current = {}

    recordPerformanceMetric({
      name: `form.${formName}.started`,
      value: 1,
      unit: 'count',
      tags: {
        type: 'form-interaction',
        form: formName,
        action: 'start'
      }
    })
  }, [formName])

  const trackFieldInteraction = useCallback((fieldName: string, interactionType: 'focus' | 'input' | 'blur') => {
    if (!fieldInteractions.current[fieldName]) {
      fieldInteractions.current[fieldName] = 0
    }
    fieldInteractions.current[fieldName]++

    recordPerformanceMetric({
      name: `form.${formName}.field-${interactionType}`,
      value: 1,
      unit: 'count',
      tags: {
        type: 'form-field-interaction',
        form: formName,
        field: fieldName,
        interaction: interactionType
      }
    })
  }, [formName])

  const trackFormSubmission = useCallback((success: boolean, validationErrors?: string[]) => {
    const submissionTime = performance.now() - formStartTime.current

    recordPerformanceMetric({
      name: `form.${formName}.submission-time`,
      value: submissionTime,
      unit: 'ms',
      tags: {
        type: 'form-performance',
        form: formName,
        success: success.toString(),
        hasValidationErrors: (validationErrors && validationErrors.length > 0).toString()
      }
    })

    recordPerformanceMetric({
      name: `form.${formName}.${success ? 'success' : 'error'}`,
      value: 1,
      unit: 'count',
      tags: {
        type: 'form-result',
        form: formName
      }
    })

    // Track field interaction patterns
    Object.entries(fieldInteractions.current).forEach(([fieldName, interactions]) => {
      recordPerformanceMetric({
        name: `form.${formName}.field-interactions`,
        value: interactions,
        unit: 'count',
        tags: {
          type: 'form-field-usage',
          form: formName,
          field: fieldName
        }
      })
    })
  }, [formName])

  return {
    trackFormStart,
    trackFieldInteraction,
    trackFormSubmission
  }
}

// Hook for tracking scroll performance
export function useScrollPerformance(componentName: string) {
  const scrollStart = useRef<number>(0)
  const scrollEvents = useRef<number>(0)

  useEffect(() => {
    const handleScrollStart = () => {
      if (scrollStart.current === 0) {
        scrollStart.current = performance.now()
        scrollEvents.current = 0
      }
    }

    const handleScroll = () => {
      scrollEvents.current++
    }

    const handleScrollEnd = () => {
      if (scrollStart.current > 0) {
        const scrollDuration = performance.now() - scrollStart.current

        recordPerformanceMetric({
          name: `scroll.${componentName}.duration`,
          value: scrollDuration,
          unit: 'ms',
          tags: {
            type: 'scroll-performance',
            component: componentName
          }
        })

        recordPerformanceMetric({
          name: `scroll.${componentName}.events`,
          value: scrollEvents.current,
          unit: 'count',
          tags: {
            type: 'scroll-events',
            component: componentName
          }
        })

        scrollStart.current = 0
      }
    }

    let scrollTimeout: NodeJS.Timeout

    const debouncedScrollEnd = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(handleScrollEnd, 150)
    }

    window.addEventListener('scrollstart', handleScrollStart)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('scroll', debouncedScrollEnd)

    return () => {
      window.removeEventListener('scrollstart', handleScrollStart)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', debouncedScrollEnd)
      clearTimeout(scrollTimeout)
    }
  }, [componentName])
}