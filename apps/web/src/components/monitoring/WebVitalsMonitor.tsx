'use client'

import { useEffect } from 'react'
import { recordPerformanceMetric } from '@/lib/monitoring'

export default function WebVitalsMonitor() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    // Dynamic import of web-vitals to avoid SSR issues
    const loadWebVitals = async () => {
      try {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')

        const sendToAnalytics = (metric: any) => {
          recordPerformanceMetric({
            name: `web-vital.${metric.name}`,
            value: metric.value,
            unit: 'ms',
            tags: {
              type: 'core-web-vital',
              rating: metric.rating,
              navigationType: metric.navigationType || 'unknown'
            }
          })

          // Also log for debugging in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`Web Vital: ${metric.name}`, {
              value: metric.value,
              rating: metric.rating,
              delta: metric.delta
            })
          }
        }

        // Measure Core Web Vitals
        getCLS(sendToAnalytics)
        getFID(sendToAnalytics)
        getFCP(sendToAnalytics)
        getLCP(sendToAnalytics)
        getTTFB(sendToAnalytics)

      } catch (error) {
        console.warn('Failed to load web-vitals:', error)
      }
    }

    // Delay slightly to avoid blocking initial render
    const timer = setTimeout(loadWebVitals, 100)

    return () => clearTimeout(timer)
  }, [])

  // Also track page visibility changes for better performance context
  useEffect(() => {
    const handleVisibilityChange = () => {
      recordPerformanceMetric({
        name: 'page.visibility-change',
        value: document.hidden ? 0 : 1,
        unit: 'boolean',
        tags: {
          type: 'page-lifecycle',
          hidden: document.hidden.toString(),
          timestamp: Date.now().toString()
        }
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Track page load performance
  useEffect(() => {
    const measurePageLoad = () => {
      if (typeof window === 'undefined' || !window.performance) return

      // Wait for load event
      if (document.readyState === 'complete') {
        measureTimings()
      } else {
        window.addEventListener('load', measureTimings)
      }
    }

    const measureTimings = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigation) {
        // DNS lookup time
        recordPerformanceMetric({
          name: 'navigation.dns-lookup',
          value: navigation.domainLookupEnd - navigation.domainLookupStart,
          unit: 'ms',
          tags: { type: 'navigation-timing' }
        })

        // TCP connection time
        recordPerformanceMetric({
          name: 'navigation.tcp-connection',
          value: navigation.connectEnd - navigation.connectStart,
          unit: 'ms',
          tags: { type: 'navigation-timing' }
        })

        // Time to First Byte
        recordPerformanceMetric({
          name: 'navigation.ttfb',
          value: navigation.responseStart - navigation.requestStart,
          unit: 'ms',
          tags: { type: 'navigation-timing' }
        })

        // DOM Content Loaded
        recordPerformanceMetric({
          name: 'navigation.dom-content-loaded',
          value: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          unit: 'ms',
          tags: { type: 'navigation-timing' }
        })

        // Complete page load
        recordPerformanceMetric({
          name: 'navigation.load-complete',
          value: navigation.loadEventEnd - navigation.navigationStart,
          unit: 'ms',
          tags: { type: 'navigation-timing' }
        })

        // Resource timing
        const resources = performance.getEntriesByType('resource')
        const resourceStats = {
          total: resources.length,
          scripts: 0,
          stylesheets: 0,
          images: 0,
          fonts: 0,
          other: 0
        }

        resources.forEach((resource: any) => {
          if (resource.name.includes('.js')) resourceStats.scripts++
          else if (resource.name.includes('.css')) resourceStats.stylesheets++
          else if (resource.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) resourceStats.images++
          else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/)) resourceStats.fonts++
          else resourceStats.other++
        })

        Object.entries(resourceStats).forEach(([type, count]) => {
          recordPerformanceMetric({
            name: `resources.${type}`,
            value: count,
            unit: 'count',
            tags: { type: 'resource-count' }
          })
        })
      }
    }

    measurePageLoad()
  }, [])

  // Track long tasks (blocking main thread)
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          recordPerformanceMetric({
            name: 'performance.long-task',
            value: entry.duration,
            unit: 'ms',
            tags: {
              type: 'long-task',
              startTime: entry.startTime.toString()
            }
          })

          // Log warning for very long tasks in development
          if (process.env.NODE_ENV === 'development' && entry.duration > 100) {
            console.warn(`Long task detected: ${entry.duration}ms at ${entry.startTime}ms`)
          }
        }
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })

      return () => longTaskObserver.disconnect()
    } catch (error) {
      console.warn('PerformanceObserver for long tasks not supported:', error)
    }
  }, [])

  // Track memory usage (Chrome only)
  useEffect(() => {
    const trackMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory

        recordPerformanceMetric({
          name: 'memory.used-heap-size',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          tags: { type: 'memory-usage' }
        })

        recordPerformanceMetric({
          name: 'memory.total-heap-size',
          value: memory.totalJSHeapSize,
          unit: 'bytes',
          tags: { type: 'memory-usage' }
        })

        recordPerformanceMetric({
          name: 'memory.heap-size-limit',
          value: memory.jsHeapSizeLimit,
          unit: 'bytes',
          tags: { type: 'memory-limit' }
        })

        const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

        recordPerformanceMetric({
          name: 'memory.usage-percentage',
          value: usagePercentage,
          unit: 'percent',
          tags: { type: 'memory-usage' }
        })

        // Warn about high memory usage
        if (process.env.NODE_ENV === 'development' && usagePercentage > 80) {
          console.warn(`High memory usage: ${usagePercentage.toFixed(1)}%`)
        }
      }
    }

    // Track memory initially and then every 30 seconds
    trackMemory()
    const memoryInterval = setInterval(trackMemory, 30000)

    return () => clearInterval(memoryInterval)
  }, [])

  // This component doesn't render anything
  return null
}

// Helper function to get performance rating
export function getPerformanceRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 }
  }

  const threshold = thresholds[metric]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// Performance budget checker
export function checkPerformanceBudget(metrics: Record<string, number>): {
  passed: boolean
  violations: Array<{ metric: string; value: number; budget: number }>
} {
  const budgets: Record<string, number> = {
    FCP: 1800,
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    TTFB: 800
  }

  const violations: Array<{ metric: string; value: number; budget: number }> = []

  Object.entries(budgets).forEach(([metric, budget]) => {
    if (metrics[metric] && metrics[metric] > budget) {
      violations.push({
        metric,
        value: metrics[metric],
        budget
      })
    }
  })

  return {
    passed: violations.length === 0,
    violations
  }
}