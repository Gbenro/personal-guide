'use client'

import { useEffect, useState } from 'react'
import { trackUserAction } from '@/lib/monitoring'
import { bundleAnalyzer } from '@/utils/bundleAnalyzer'

interface PerformanceMetrics {
  tabLoadTime: number
  bundleSize?: number
  memoryUsage?: number
  timestamp: number
}

interface BundlePerformanceMonitorProps {
  tabName: string
  onLoad?: () => void
}

export function BundlePerformanceMonitor({
  tabName,
  onLoad
}: BundlePerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loadStartTime] = useState(Date.now())

  useEffect(() => {
    const loadTime = Date.now() - loadStartTime

    // Get performance metrics if available
    const getMemoryUsage = () => {
      // @ts-ignore - Performance memory API is experimental
      if (window.performance && window.performance.memory) {
        // @ts-ignore
        return window.performance.memory.usedJSHeapSize
      }
      return undefined
    }

    // Estimate bundle size from performance API
    const getBundleSize = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const entries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        const recentChunks = entries.filter(entry =>
          entry.name.includes('chunk') &&
          entry.responseEnd > loadStartTime
        )

        return recentChunks.reduce((total, entry) =>
          total + (entry.transferSize || entry.encodedBodySize || 0), 0
        )
      }
      return undefined
    }

    const performanceMetrics: PerformanceMetrics = {
      tabLoadTime: loadTime,
      bundleSize: getBundleSize(),
      memoryUsage: getMemoryUsage(),
      timestamp: Date.now()
    }

    setMetrics(performanceMetrics)

    // Track in bundle analyzer
    bundleAnalyzer.trackTabLoad(tabName, loadTime, performanceMetrics.bundleSize)

    // Track performance in monitoring system
    trackUserAction({
      action: 'tab_load_performance',
      target: tabName,
      metadata: {
        loadTime,
        bundleSize: performanceMetrics.bundleSize,
        memoryUsage: performanceMetrics.memoryUsage,
        timestamp: performanceMetrics.timestamp
      }
    })

    // Log performance metrics for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${tabName} Tab Performance:`, {
        'Load Time': `${loadTime}ms`,
        'Bundle Size': performanceMetrics.bundleSize
          ? `${(performanceMetrics.bundleSize / 1024).toFixed(2)}KB`
          : 'N/A',
        'Memory Usage': performanceMetrics.memoryUsage
          ? `${(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
          : 'N/A',
        'Timestamp': new Date(performanceMetrics.timestamp).toISOString()
      })
    }

    // Call onLoad callback
    onLoad?.()
  }, [tabName, loadStartTime, onLoad])

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/90 text-white text-xs p-2 rounded-lg font-mono z-50 max-w-xs">
      <div className="font-semibold text-green-400 mb-1">
        {tabName} Performance
      </div>
      <div>Load: {metrics.tabLoadTime}ms</div>
      {metrics.bundleSize && (
        <div>Bundle: {(metrics.bundleSize / 1024).toFixed(1)}KB</div>
      )}
      {metrics.memoryUsage && (
        <div>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</div>
      )}
      <div className="mt-1 pt-1 border-t border-gray-600 text-gray-400">
        Run getPerfReport() in console
      </div>
    </div>
  )
}

// Hook for tracking tab performance across the app
export function useTabPerformance(tabName: string) {
  const [startTime] = useState(Date.now())
  const [isLoaded, setIsLoaded] = useState(false)

  const markAsLoaded = () => {
    if (!isLoaded) {
      const loadTime = Date.now() - startTime
      setIsLoaded(true)

      trackUserAction({
        action: 'tab_fully_loaded',
        target: tabName,
        metadata: { totalLoadTime: loadTime }
      })

      // Track in bundle analyzer as well
      bundleAnalyzer.trackTabLoad(`${tabName}_full`, loadTime)
    }
  }

  return { markAsLoaded, isLoaded }
}

// Component to wrap tab content with performance monitoring
export function TabPerformanceWrapper({
  children,
  tabName
}: {
  children: React.ReactNode
  tabName: string
}) {
  const { markAsLoaded } = useTabPerformance(tabName)

  useEffect(() => {
    // Mark as loaded after component mounts and renders
    const timer = setTimeout(markAsLoaded, 100)
    return () => clearTimeout(timer)
  }, [markAsLoaded])

  return (
    <>
      {children}
      <BundlePerformanceMonitor tabName={tabName} onLoad={markAsLoaded} />
    </>
  )
}