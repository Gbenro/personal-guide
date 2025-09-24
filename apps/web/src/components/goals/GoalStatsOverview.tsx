'use client'

import type { GoalStats } from '@/types/goals'

interface GoalStatsOverviewProps {
  stats: GoalStats
}

export function GoalStatsOverview({ stats }: GoalStatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Active Goals Summary */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
        <div className="text-4xl font-bold mb-2">{stats.active_goals}/{stats.total_goals}</div>
        <div className="text-sm opacity-90">
          ⬆️ {stats.completed_goals} completed total
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <div className="text-sm opacity-80">On Track</div>
            <div className="text-xl font-semibold">{stats.on_track_goals}</div>
          </div>
          <div>
            <div className="text-sm opacity-80">Behind</div>
            <div className="text-xl font-semibold">{stats.behind_goals}</div>
          </div>
        </div>
      </div>

      {/* Goal Types Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">📊 Goal Types</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">📅 Monthly Goals</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {stats.monthly_goals} goals
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">📆 Weekly Goals</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              {stats.weekly_goals} goals
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">📋 Daily Goals</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              {stats.daily_goals} goals
            </span>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Average Progress</span>
            <span>{stats.average_progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.average_progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Timing and Deadlines */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">⏰ Deadlines</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Due Today</span>
            <span className={`font-bold ${stats.due_today > 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {stats.due_today}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Due This Week</span>
            <span className={`font-bold ${stats.due_this_week > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
              {stats.due_this_week}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Overdue</span>
            <span className={`font-bold ${stats.overdue_goals > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {stats.overdue_goals}
            </span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600 mb-2">Monthly Completion Rate</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-green-600">
              {stats.completion_rate_this_month}%
            </span>
            <span className="text-xs text-gray-500">
              (vs {stats.completion_rate_last_month}% last month)
            </span>
          </div>
        </div>

        {/* Daily Streak */}
        {stats.current_daily_streak > 0 && (
          <div className="mt-3 p-2 bg-green-50 rounded border-l-4 border-green-400">
            <p className="text-xs text-green-800">
              🔥 {stats.current_daily_streak} day streak!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}