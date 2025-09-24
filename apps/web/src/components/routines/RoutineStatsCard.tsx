import { useRoutineStats } from '../../hooks/useRoutines'

export function RoutineStatsCard() {
  const { data: stats, isLoading } = useRoutineStats()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statItems = [
    {
      label: 'Active Routines',
      value: stats.active_routines,
      icon: '🔄',
      color: 'text-blue-600'
    },
    {
      label: 'Current Streak',
      value: stats.current_streak,
      icon: '🔥',
      color: 'text-orange-600'
    },
    {
      label: 'This Week',
      value: stats.completions_this_week,
      icon: '📅',
      color: 'text-green-600'
    },
    {
      label: 'Total Time',
      value: `${Math.round(stats.total_time_practiced / 60)}h`,
      icon: '⏱️',
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">{item.icon}</span>
              <span className={`text-2xl font-bold ${item.color}`}>
                {item.value}
              </span>
            </div>
            <div className="text-sm text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>

      {stats.current_streak > 0 && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center">
            <span className="text-orange-600 mr-2">🔥</span>
            <span className="text-sm text-orange-800">
              Great job! You're on a {stats.current_streak}-day routine streak. Keep it going!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}