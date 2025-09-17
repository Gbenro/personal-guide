'use client'

import { useState, useEffect } from 'react'
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { ErrorReport, performHealthCheck } from '@/lib/monitoring'

interface ErrorStats {
  total: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  byComponent: Record<string, number>
  recentErrors: ErrorReport[]
}

export default function ErrorTrackingDashboard() {
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    total: 0,
    byType: {},
    bySeverity: {},
    byComponent: {},
    recentErrors: []
  })
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadErrorData()
    loadHealthStatus()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadErrorData()
      loadHealthStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadErrorData = async () => {
    try {
      // In a real implementation, this would fetch from your error tracking service
      // For now, we'll simulate some data
      const mockData: ErrorStats = {
        total: 42,
        byType: {
          'javascript-error': 18,
          'unhandled-promise-rejection': 12,
          'component-error': 8,
          'api-error': 4
        },
        bySeverity: {
          'critical': 2,
          'high': 15,
          'medium': 20,
          'low': 5
        },
        byComponent: {
          'HabitsTab': 8,
          'ChatTab': 6,
          'JournalTab': 4,
          'DashboardTab': 3
        },
        recentErrors: [
          {
            id: 'error-1',
            message: 'Cannot read property of undefined',
            stack: 'TypeError: Cannot read property...',
            url: 'http://localhost:3000/habits',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            sessionId: 'session-123',
            severity: 'high' as const,
            context: { component: 'HabitsTab' }
          },
          {
            id: 'error-2',
            message: 'Network request failed',
            stack: 'Error: Network request failed...',
            url: 'http://localhost:3000/chat',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            sessionId: 'session-456',
            severity: 'medium' as const,
            context: { api: '/api/chat/send' }
          }
        ]
      }

      setErrorStats(mockData)
    } catch (error) {
      console.error('Failed to load error data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadHealthStatus = async () => {
    try {
      const health = await performHealthCheck()
      setHealthStatus(health)
    } catch (error) {
      console.error('Failed to load health status:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Tracking</h1>
          <p className="text-gray-600">Monitor and analyze application errors</p>
        </div>
        {healthStatus && (
          <div className={`px-3 py-2 rounded-lg ${getHealthStatusColor(healthStatus.status)}`}>
            <span className="font-medium">System {healthStatus.status}</span>
          </div>
        )}
      </div>

      {/* Error Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Errors</p>
              <p className="text-2xl font-bold text-gray-900">{errorStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Errors</p>
              <p className="text-2xl font-bold text-gray-900">{errorStats.bySeverity.critical || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last 24h</p>
              <p className="text-2xl font-bold text-gray-900">{errorStats.recentErrors.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Affected Users</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Severity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Severity</h3>
          <div className="space-y-3">
            {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${getSeverityColor(severity).split(' ')[1]}`}></div>
                  <span className="capitalize text-gray-700">{severity}</span>
                </div>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Type */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Type</h3>
          <div className="space-y-3">
            {Object.entries(errorStats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-700">{type.replace('-', ' ')}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Component */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Component</h3>
          <div className="space-y-3">
            {Object.entries(errorStats.byComponent).map(([component, count]) => (
              <div key={component} className="flex items-center justify-between">
                <span className="text-gray-700">{component}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Errors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Context
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {errorStats.recentErrors.map((error) => (
                <tr key={error.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {error.message}
                    </div>
                    <div className="text-sm text-gray-500">
                      {error.url}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(error.severity)}`}>
                      {error.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {error.context?.component || error.context?.api || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(error.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health Checks */}
      {healthStatus && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Health Checks</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(healthStatus.checks).map(([check, result]) => (
                <div key={check} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {check.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </p>
                    {result.message && (
                      <p className="text-xs text-gray-500">{result.message}</p>
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    result.status === 'pass' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}