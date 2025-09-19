/**
 * Bundle Analyzer Utility
 * Provides insights into code splitting effectiveness and performance metrics
 */

interface BundleStats {
  name: string
  size: number
  loadTime: number
  timestamp: number
}

interface PerformanceReport {
  initialBundleSize: number
  lazyLoadedChunks: BundleStats[]
  averageTabLoadTime: number
  totalMemoryUsage: number
  cacheHitRate: number
  optimizationScore: number
}

class BundleAnalyzer {
  private performanceEntries: PerformanceEntry[] = []
  private bundleStats: Map<string, BundleStats> = new Map()
  private startTime: number = Date.now()

  constructor() {
    this.initializePerformanceObserver()
  }

  private initializePerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          this.performanceEntries.push(...entries)

          // Log navigation and resource timing for development
          if (process.env.NODE_ENV === 'development') {
            entries.forEach(entry => {
              if (entry.entryType === 'navigation') {
                console.log('📊 Navigation Performance:', {
                  domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                  loadComplete: entry.loadEventEnd - entry.loadEventStart,
                  total: entry.loadEventEnd - entry.navigationStart
                })
              }

              if (entry.entryType === 'resource' && entry.name.includes('chunk')) {
                console.log('🧩 Chunk Loaded:', {
                  name: entry.name.split('/').pop(),
                  duration: entry.duration,
                  size: entry.transferSize || entry.encodedBodySize
                })
              }
            })
          }
        })

        observer.observe({
          entryTypes: ['navigation', 'resource', 'measure', 'mark']
        })
      } catch (error) {
        console.warn('Performance Observer not supported or failed to initialize:', error)
      }
    }
  }

  trackTabLoad(tabName: string, loadTime: number, bundleSize?: number) {
    const stats: BundleStats = {
      name: tabName,
      size: bundleSize || 0,
      loadTime,
      timestamp: Date.now()
    }

    this.bundleStats.set(tabName, stats)

    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Tab Performance Tracked:`, {
        tab: tabName,
        loadTime: `${loadTime}ms`,
        size: bundleSize ? `${(bundleSize / 1024).toFixed(2)}KB` : 'Unknown'
      })
    }
  }

  getPerformanceReport(): PerformanceReport {
    const tabStats = Array.from(this.bundleStats.values())
    const averageLoadTime = tabStats.length > 0
      ? tabStats.reduce((sum, stat) => sum + stat.loadTime, 0) / tabStats.length
      : 0

    // Calculate optimization score based on various metrics
    const optimizationScore = this.calculateOptimizationScore(tabStats, averageLoadTime)

    // Get memory usage if available
    const memoryUsage = this.getMemoryUsage()

    // Calculate cache effectiveness (simplified)
    const cacheHitRate = this.calculateCacheHitRate()

    return {
      initialBundleSize: this.getInitialBundleSize(),
      lazyLoadedChunks: tabStats,
      averageTabLoadTime: averageLoadTime,
      totalMemoryUsage: memoryUsage,
      cacheHitRate,
      optimizationScore
    }
  }

  private calculateOptimizationScore(tabStats: BundleStats[], avgLoadTime: number): number {
    let score = 100

    // Penalize if average load time is high
    if (avgLoadTime > 1000) score -= 30
    else if (avgLoadTime > 500) score -= 15
    else if (avgLoadTime > 200) score -= 5

    // Bonus for using code splitting (having multiple chunks)
    if (tabStats.length > 3) score += 10

    // Penalize for very large chunks
    const largeBundles = tabStats.filter(stat => stat.size > 500 * 1024) // > 500KB
    score -= largeBundles.length * 10

    return Math.max(0, Math.min(100, score))
  }

  private getInitialBundleSize(): number {
    const navigationEntry = this.performanceEntries.find(
      entry => entry.entryType === 'navigation'
    ) as PerformanceNavigationTiming

    if (navigationEntry) {
      return navigationEntry.transferSize || navigationEntry.encodedBodySize || 0
    }

    return 0
  }

  private getMemoryUsage(): number {
    // @ts-ignore - Performance memory API is experimental
    if (typeof window !== 'undefined' && window.performance?.memory) {
      // @ts-ignore
      return window.performance.memory.usedJSHeapSize
    }
    return 0
  }

  private calculateCacheHitRate(): number {
    const resourceEntries = this.performanceEntries.filter(
      entry => entry.entryType === 'resource'
    ) as PerformanceResourceTiming[]

    if (resourceEntries.length === 0) return 0

    const cachedResources = resourceEntries.filter(
      entry => entry.transferSize === 0 && entry.decodedBodySize > 0
    )

    return (cachedResources.length / resourceEntries.length) * 100
  }

  generateDevelopmentReport(): string {
    const report = this.getPerformanceReport()

    return `
🎯 Bundle Optimization Report
════════════════════════════

📦 Initial Bundle: ${(report.initialBundleSize / 1024).toFixed(2)}KB
🧩 Lazy Chunks: ${report.lazyLoadedChunks.length}
⚡ Avg Tab Load: ${report.averageTabLoadTime.toFixed(0)}ms
💾 Memory Usage: ${(report.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB
🎯 Cache Hit Rate: ${report.cacheHitRate.toFixed(1)}%
📊 Optimization Score: ${report.optimizationScore}/100

Tab Performance:
${report.lazyLoadedChunks
  .sort((a, b) => b.loadTime - a.loadTime)
  .map(chunk => `  • ${chunk.name}: ${chunk.loadTime}ms`)
  .join('\n')}

Performance Tips:
${this.generatePerformanceTips(report)}
    `.trim()
  }

  private generatePerformanceTips(report: PerformanceReport): string {
    const tips: string[] = []

    if (report.averageTabLoadTime > 500) {
      tips.push('⚠️  Consider optimizing component imports and reducing bundle sizes')
    }

    if (report.cacheHitRate < 50) {
      tips.push('💡 Improve caching strategies for better performance')
    }

    if (report.lazyLoadedChunks.length < 3) {
      tips.push('🧩 Consider adding more code splitting points')
    }

    if (report.optimizationScore < 70) {
      tips.push('📈 Review bundle analyzer recommendations for optimization')
    }

    if (tips.length === 0) {
      tips.push('✅ Great job! Your bundle optimization is performing well')
    }

    return tips.join('\n')
  }
}

// Singleton instance for global use
export const bundleAnalyzer = new BundleAnalyzer()

// Development helper to log performance report
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Add console command for manual performance reporting
  (window as any).getPerfReport = () => {
    console.log(bundleAnalyzer.generateDevelopmentReport())
  }

  // Auto-generate report every 30 seconds in development
  setInterval(() => {
    const report = bundleAnalyzer.getPerformanceReport()
    if (report.lazyLoadedChunks.length > 0) {
      console.log('🔄 Performance Update:', {
        chunks: report.lazyLoadedChunks.length,
        avgLoad: `${report.averageTabLoadTime.toFixed(0)}ms`,
        score: `${report.optimizationScore}/100`
      })
    }
  }, 30000)
}

export default bundleAnalyzer