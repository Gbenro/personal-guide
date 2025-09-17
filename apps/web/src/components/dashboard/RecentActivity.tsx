'use client'

import { CheckCircleIcon, TrophyIcon, FireIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import type { HabitWithStatus } from '@/lib/dashboardService'

interface ActivityItem {
  id: string
  type: 'completion' | 'streak' | 'milestone' | 'achievement'
  title: string
  description: string
  timestamp: Date
  color: string
  icon: React.ComponentType<any>
}

interface RecentActivityProps {
  habits: HabitWithStatus[]
  maxItems?: number
}

export default function RecentActivity({ habits, maxItems = 5 }: RecentActivityProps) {
  // Generate recent activity items from habits data
  const generateActivityItems = (): ActivityItem[] => {
    const activities: ActivityItem[] = []

    // Add completed habits from today
    habits.filter(h => h.completedToday).forEach(habit => {
      activities.push({
        id: `completion-${habit.id}`,
        type: 'completion',
        title: 'Habit completed',
        description: `Completed "${habit.name}"`,
        timestamp: new Date(), // In real app, this would be the actual completion time
        color: 'text-green-600',
        icon: CheckCircleIcon
      })
    })

    // Add streak milestones
    habits.forEach(habit => {
      const streak = habit.streak.current_streak
      if (streak >= 7 && streak % 7 === 0) {
        activities.push({
          id: `milestone-${habit.id}`,
          type: 'milestone',
          title: `${streak}-day streak reached!`,
          description: `Amazing consistency with "${habit.name}"`,
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random recent time
          color: 'text-orange-600',
          icon: FireIcon
        })
      }
    })

    // Add achievements
    const totalActiveStreaks = habits.filter(h => h.streak.current_streak > 0).length
    if (totalActiveStreaks >= 3) {
      activities.push({
        id: 'multi-streak-achievement',
        type: 'achievement',
        title: 'Multi-Streak Master',
        description: `Maintaining ${totalActiveStreaks} active streaks simultaneously`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        color: 'text-purple-600',
        icon: TrophyIcon
      })
    }

    // Sort by timestamp (most recent first)
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxItems)
  }

  const activityItems = generateActivityItems()

  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`
    }
    return timestamp.toLocaleDateString()
  }

  const getActivityBgColor = (type: ActivityItem['type']): string => {
    switch (type) {
      case 'completion':
        return 'bg-green-50 border-green-200'
      case 'streak':
        return 'bg-orange-50 border-orange-200'
      case 'milestone':
        return 'bg-yellow-50 border-yellow-200'
      case 'achievement':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (activityItems.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            Complete habits to see your recent activity and achievements here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Last 24h
        </span>
      </div>

      <div className="space-y-3">
        {activityItems.map((activity) => {
          const Icon = activity.icon
          return (
            <div
              key={activity.id}
              className={`p-3 rounded-lg border ${getActivityBgColor(activity.type)} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {activityItems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Keep building momentum! Every action counts toward your growth.
          </p>
        </div>
      )}
    </div>
  )
}