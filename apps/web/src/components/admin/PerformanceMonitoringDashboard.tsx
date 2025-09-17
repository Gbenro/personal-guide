'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { recordPerformanceMetric, measureAsyncExecutionTime } from '@/lib/monitoring'

interface PerformanceMetrics {
  pageLoad: {
    avg: number
    p95: number
    samples: number
  }
  apiResponse: {
    avg: number
    p95: number
    samples: number
  }
  renderTime: {
    avg: number
    p95: number
    samples: number
  }
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  networkMetrics: {
    effectiveType: string
    downlink: number
    rtt: number
  }
  vitals: {
    fcp: number // First Contentful Paint
    lcp: number // Largest Contentful Paint
    fid: number // First Input Delay
    cls: number // Cumulative Layout Shift
  }
}

export default function PerformanceMonitoringDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  useEffect(() => {
    initializePerformanceMonitoring()
    loadPerformanceMetrics()

    // Refresh metrics every 30 seconds
    const interval = setInterval(loadPerformanceMetrics, 30000)

    return () => clearInterval(interval)
  }, [])

  const initializePerformanceMonitoring = () => {
    // Collect device information
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }

    setDeviceInfo(info)

    // Set up performance observers
    if ('PerformanceObserver' in window) {
      setupPerformanceObservers()
    }

    // Measure initial page load performance
    measurePageLoadMetrics()
  }

  const setupPerformanceObservers = () => {
    try {
      // Observe Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metricName = entry.name || entry.entryType
          recordPerformanceMetric({
            name: `core-web-vitals.${metricName}`,
            value: entry.startTime || (entry as any).value || entry.duration,
            unit: 'ms',
            tags: {
              type: 'web-vital',
              entryType: entry.entryType
            }
          })
        }
      })

      observer.observe({
        entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      })

      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming
          recordPerformanceMetric({
            name: 'navigation.dom-complete',
            value: navEntry.domComplete - navEntry.navigationStart,
            unit: 'ms',
            tags: { type: 'navigation' }
          })

          recordPerformanceMetric({
            name: 'navigation.load-complete',
            value: navEntry.loadEventEnd - navEntry.navigationStart,
            unit: 'ms',
            tags: { type: 'navigation' }
          })
        }
      })

      navObserver.observe({ entryTypes: ['navigation'] })

    } catch (error) {
      console.warn('Performance Observer setup failed:', error)
    }
  }

  const measurePageLoadMetrics = () => {
    if (performance.timing) {
      const timing = performance.timing
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart

      recordPerformanceMetric({
        name: 'page-load.total',
        value: pageLoadTime,
        unit: 'ms',
        tags: { type: 'page-load' }
      })

      const dnsTime = timing.domainLookupEnd - timing.domainLookupStart
      const tcpTime = timing.connectEnd - timing.connectStart
      const ttfb = timing.responseStart - timing.requestStart

      recordPerformanceMetric({
        name: 'page-load.dns',
        value: dnsTime,
        unit: 'ms',
        tags: { type: 'network' }
      })

      recordPerformanceMetric({
        name: 'page-load.tcp',
        value: tcpTime,
        unit: 'ms',
        tags: { type: 'network' }
      })

      recordPerformanceMetric({
        name: 'page-load.ttfb',
        value: ttfb,
        unit: 'ms',
        tags: { type: 'network' }
      })
    }
  }

  const loadPerformanceMetrics = async () => {
    try {
      // Simulate fetching performance metrics
      // In a real implementation, this would come from your analytics service
      const mockMetrics: PerformanceMetrics = {
        pageLoad: {
          avg: 1234,
          p95: 2456,
          samples: 150
        },
        apiResponse: {
          avg: 245,
          p95: 567,
          samples: 89
        },
        renderTime: {
          avg: 16.7,
          p95: 33.3,
          samples: 200
        },
        memoryUsage: getMemoryUsage(),
        networkMetrics: getNetworkInfo(),
        vitals: getCoreWebVitals()
      }

      setMetrics(mockMetrics)
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      }
    }

    return { used: 0, total: 0, percentage: 0 }
  }

  const getNetworkInfo = () => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection
      return {
        effectiveType: conn.effectiveType || 'unknown',
        downlink: conn.downlink || 0,
        rtt: conn.rtt || 0
      }
    }

    return { effectiveType: 'unknown', downlink: 0, rtt: 0 }
  }

  const getCoreWebVitals = () => {
    // In a real implementation, these would be collected over time
    return {
      fcp: 1200,
      lcp: 2400,
      fid: 45,
      cls: 0.12
    }
  }

  const runPerformanceTest = async () => {
    const testDuration = await measureAsyncExecutionTime('performance-test', async () => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100))

      // Measure DOM manipulation
      const div = document.createElement('div')
      div.innerHTML = 'Test content'
      document.body.appendChild(div)
      await new Promise(resolve => requestAnimationFrame(resolve))
      document.body.removeChild(div)
    })

    alert(`Performance test completed in ${testDuration.toFixed(2)}ms`)
  }

  const getPerformanceScore = (value: number, good: number, needs: number) => {
    if (value <= good) return { score: 'Good', color: 'text-green-600 bg-green-100' }
    if (value <= needs) return { score: 'Needs Improvement', color: 'text-yellow-600 bg-yellow-100' }
    return { score: 'Poor', color: 'text-red-600 bg-red-100' }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return <div className="p-6 text-center text-gray-500">Failed to load performance metrics</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
          <p className="text-gray-600">Monitor application performance and user experience</p>
        </div>
        <button
          onClick={runPerformanceTest}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Run Test
        </button>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{metrics.vitals.fcp}ms</div>
            <div className="text-sm text-gray-600">First Contentful Paint</div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              getPerformanceScore(metrics.vitals.fcp, 1800, 3000).color
            }`}>
              {getPerformanceScore(metrics.vitals.fcp, 1800, 3000).score}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{metrics.vitals.lcp}ms</div>
            <div className="text-sm text-gray-600">Largest Contentful Paint</div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              getPerformanceScore(metrics.vitals.lcp, 2500, 4000).color
            }`}>
              {getPerformanceScore(metrics.vitals.lcp, 2500, 4000).score}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{metrics.vitals.fid}ms</div>
            <div className="text-sm text-gray-600">First Input Delay</div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              getPerformanceScore(metrics.vitals.fid, 100, 300).color
            }`}>
              {getPerformanceScore(metrics.vitals.fid, 100, 300).score}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{metrics.vitals.cls.toFixed(3)}</div>
            <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
              getPerformanceScore(metrics.vitals.cls, 0.1, 0.25).color
            }`}>
              {getPerformanceScore(metrics.vitals.cls, 0.1, 0.25).score}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Page Load Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.pageLoad.avg}ms</p>
              <p className="text-xs text-gray-500">P95: {metrics.pageLoad.p95}ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <GlobeAltIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">API Response</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.apiResponse.avg}ms</p>
              <p className="text-xs text-gray-500">P95: {metrics.apiResponse.p95}ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Render Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.renderTime.avg}ms</p>
              <p className="text-xs text-gray-500">P95: {metrics.renderTime.p95}ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">JavaScript Heap</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics.memoryUsage.percentage > 80 ? 'bg-red-500' :
                    metrics.memoryUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${metrics.memoryUsage.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.memoryUsage.percentage}% used
              </div>
            </div>
          </div>
        </div>

        {/* Network Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Connection Type</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {metrics.networkMetrics.effectiveType}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Downlink</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.networkMetrics.downlink} Mbps
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Round Trip Time</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.networkMetrics.rtt}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Information */}
      {deviceInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <ComputerDesktopIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Platform</span>
              </div>
              <p className="text-sm text-gray-900">{deviceInfo.platform}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CpuChipIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">CPU Cores</span>
              </div>
              <p className="text-sm text-gray-900">{deviceInfo.hardwareConcurrency || 'Unknown'}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <DevicePhoneMobileIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Screen</span>
              </div>
              <p className="text-sm text-gray-900">
                {deviceInfo.screen.width}×{deviceInfo.screen.height}
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <GlobeAltIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Online</span>
              </div>
              <p className="text-sm text-gray-900">{deviceInfo.onLine ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}