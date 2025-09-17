'use client'

import EnhancedHabitTracker from '../habits/EnhancedHabitTracker'
import ErrorBoundary from '../ErrorBoundary'
import { reportError } from '@/lib/monitoring'
import { useAuth } from '@/contexts/AuthContext'

export default function HabitsTab() {
  const { user } = useAuth()

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        reportError({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack || undefined,
          severity: 'high',
          context: { component: 'HabitsTab', userId: user?.id }
        })
      }}
    >
      <div className="h-full bg-gradient-to-br from-green-50/30 to-blue-50/20 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
                <p className="text-gray-600">Build consistency, track progress, achieve your goals</p>
              </div>
            </div>

            {/* Enhanced context indicators */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Smart Tracking</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🔥</span>
                <span>Streak Counter</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📊</span>
                <span>Progress Analytics</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🎯</span>
                <span>Goal Achievement</span>
              </div>
            </div>
          </div>

          <EnhancedHabitTracker />
        </div>
      </div>
    </ErrorBoundary>
  )
}