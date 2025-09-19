'use client'

import { useHabitStreak, useStreakAnalytics } from '@/hooks/useHabits'
import { FireIcon, TrophyIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { animationPresets } from '@/config/animations'

interface StreakStatsProps {
  habitId: string
  userId: string
  habitName: string
}

export default function StreakStats({ habitId, userId, habitName }: StreakStatsProps) {
  const { data: streak, isLoading: streakLoading } = useHabitStreak(habitId, userId)
  const { data: analytics, isLoading: analyticsLoading } = useStreakAnalytics(habitId, userId)

  if (streakLoading || analyticsLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!streak || !analytics) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500 text-center">Unable to load streak statistics</p>
      </div>
    )
  }

  const getStreakHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200'
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPatternEmoji = (pattern: string) => {
    switch (pattern) {
      case 'consistent': return '⭐'
      case 'weekend_warrior': return '🏖️'
      case 'workday_focused': return '💼'
      case 'irregular': return '📊'
      default: return '📈'
    }
  }

  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈'
      case 'stable': return '➡️'
      case 'declining': return '📉'
      default: return '📊'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-blue-500" />
          Streak Statistics for {habitName}
        </h3>

        {streak.is_at_risk && (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
            <ExclamationTriangleIcon className="h-3 w-3" />
            At Risk
          </div>
        )}
      </div>

      {/* Main Streak Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border ${animationPresets.interactiveCard}`}>
          <div className="flex items-center justify-between mb-2">
            <FireIcon className="h-6 w-6 text-orange-500" />
            <span className="text-2xl font-bold text-orange-600">{streak.current_streak}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Current Streak</p>
          <p className="text-xs text-gray-500">
            {streak.next_milestone} days to next milestone
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${animationPresets.interactiveCard}`}>
          <div className="flex items-center justify-between mb-2">
            <TrophyIcon className="h-6 w-6 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600">{streak.longest_streak}</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Longest Streak</p>
          <p className="text-xs text-gray-500">
            Personal best record
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${animationPresets.interactiveCard}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">📅</span>
            <span className="text-2xl font-bold text-blue-600">{streak.completion_rate}%</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
          <p className="text-xs text-gray-500">
            Since you started ({streak.days_since_start} days)
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${getStreakHealthColor(streak.streak_health || 'good')}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">💪</span>
            <span className="text-sm font-bold capitalize">{streak.streak_health}</span>
          </div>
          <p className="text-sm font-medium">Streak Health</p>
          <p className="text-xs opacity-75">
            Based on consistency
          </p>
        </div>
      </div>

      {/* Weekly/Monthly Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Last 7 Days</span>
            <span className="text-xl font-bold text-blue-600">{streak.weekly_streak}</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {Math.round((streak.weekly_streak || 0) / 7 * 100)}% this week
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-800">Last 30 Days</span>
            <span className="text-xl font-bold text-purple-600">{streak.monthly_streak}</span>
          </div>
          <p className="text-xs text-purple-700 mt-1">
            {Math.round((streak.monthly_streak || 0) / 30 * 100)}% this month
          </p>
        </div>
      </div>

      {/* Analytics Insights */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          📊 Pattern Analysis
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl mb-1">{getPatternEmoji(analytics.completion_pattern)}</div>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {analytics.completion_pattern.replace('_', ' ')}
            </p>
            <p className="text-xs text-gray-600">Completion Pattern</p>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-1">{getTrendEmoji(analytics.recent_trend)}</div>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {analytics.recent_trend}
            </p>
            <p className="text-xs text-gray-600">Recent Trend</p>
          </div>

          <div className="text-center">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-sm font-medium text-gray-900">
              {analytics.average_gap_days} days
            </p>
            <p className="text-xs text-gray-600">Average Gap</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Best day:</span>
            <span className="font-medium text-green-600">{analytics.best_day_of_week}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Challenging day:</span>
            <span className="font-medium text-orange-600">{analytics.worst_day_of_week}</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analytics.recommended_actions.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            💡 Recommendations
          </h4>
          <ul className="space-y-1">
            {analytics.recommended_actions.map((action, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}