import { useBeliefStats } from '../../hooks/useBeliefs'

export function BeliefStatsCard() {
  const { data: stats, isLoading } = useBeliefStats()

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
      label: 'Active Cycles',
      value: stats.active_cycles,
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
      label: 'Days Practiced',
      value: stats.total_days_practiced,
      icon: '📅',
      color: 'text-green-600'
    },
    {
      label: 'Affirmations',
      value: stats.total_affirmations_spoken,
      icon: '🗣️',
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Belief Journey</h3>

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

      {/* Progress Messages */}
      <div className="mt-4 space-y-2">
        {stats.current_streak >= 7 && (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <span className="text-orange-600 mr-2">🔥</span>
              <span className="text-sm text-orange-800">
                Amazing! You're on a {stats.current_streak}-day belief work streak. This consistency is rewiring your brain!
              </span>
            </div>
          </div>
        )}

        {stats.average_belief_strength_improvement > 2 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">📈</span>
              <span className="text-sm text-green-800">
                Your belief strength has improved by an average of {stats.average_belief_strength_improvement.toFixed(1)} points!
              </span>
            </div>
          </div>
        )}

        {stats.completed_cycles > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <span className="text-blue-600 mr-2">🎉</span>
              <span className="text-sm text-blue-800">
                You've completed {stats.completed_cycles} full belief installation cycle{stats.completed_cycles > 1 ? 's' : ''}!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}