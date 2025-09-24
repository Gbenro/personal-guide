import { BeliefSystem } from '../../types/beliefs'

interface BeliefSystemsGridProps {
  systems: BeliefSystem[]
  onStartCycle: (systemId: string, customizations?: any) => void
  loading?: boolean
}

export function BeliefSystemsGrid({ systems, onStartCycle, loading }: BeliefSystemsGridProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      'Self-Worth': 'bg-pink-100 text-pink-800',
      'Confidence': 'bg-blue-100 text-blue-800',
      'Success': 'bg-green-100 text-green-800',
      'Health': 'bg-red-100 text-red-800',
      'Abundance': 'bg-yellow-100 text-yellow-800',
      'Love': 'bg-pink-100 text-pink-800',
      'Peace': 'bg-purple-100 text-purple-800',
      'Personal Growth': 'bg-indigo-100 text-indigo-800',
      'Career': 'bg-gray-100 text-gray-800',
      'Relationships': 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || colors['Personal Growth']
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Self-Worth': '💎',
      'Confidence': '💪',
      'Success': '🎯',
      'Health': '🌱',
      'Abundance': '💰',
      'Love': '❤️',
      'Peace': '☮️',
      'Personal Growth': '🌟',
      'Career': '💼',
      'Relationships': '🤝'
    }
    return icons[category as keyof typeof icons] || icons['Personal Growth']
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {systems.map((system) => (
        <div key={system.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getCategoryIcon(system.category)}</span>
                <h3 className="font-semibold text-gray-900">{system.title}</h3>
              </div>
              {system.is_featured && (
                <span className="text-yellow-500 text-sm">⭐ Featured</span>
              )}
            </div>

            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(system.category)}`}>
              {system.category}
            </span>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Description */}
            {system.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{system.description}</p>
            )}

            {/* Belief Statement */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Core Belief:</div>
              <p className="text-sm text-blue-900 font-medium italic">
                "{system.belief_statement}"
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-900">{system.cycle_length}</div>
                <div className="text-xs text-gray-600">Days</div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-900">{system.affirmations?.length || 0}</div>
                <div className="text-xs text-gray-600">Affirmations</div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-900">{system.times_completed}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
            </div>

            {/* Sample Affirmations */}
            {system.affirmations && system.affirmations.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Sample affirmations:</div>
                <div className="space-y-1">
                  {system.affirmations.slice(0, 2).map((affirmation: string, index: number) => (
                    <div key={index} className="text-xs text-gray-600 italic">
                      • "{affirmation}"
                    </div>
                  ))}
                  {system.affirmations.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{system.affirmations.length - 2} more affirmations
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Daily Activities Preview */}
            {system.daily_activities && system.daily_activities.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Daily activities:</div>
                <div className="flex flex-wrap gap-1">
                  {system.daily_activities.slice(0, 3).map((activity: any, index: number) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-700">
                      {activity.name}
                    </span>
                  ))}
                  {system.daily_activities.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-500">
                      +{system.daily_activities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Effectiveness Rating */}
            {system.average_effectiveness > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                <span>Effectiveness: {system.average_effectiveness.toFixed(1)}/10</span>
                <span>{'⭐'.repeat(Math.round(system.average_effectiveness / 2))}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => onStartCycle(system.id)}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Starting Cycle...' : 'Start 21-Day Cycle'}
            </button>
          </div>

          {/* Features Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center px-2 py-1 rounded bg-white text-gray-600">
                📖 Read Affirmations
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-white text-gray-600">
                🗣️ Speak Daily
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-white text-gray-600">
                🎯 Visualize
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-white text-gray-600">
                ✍️ Journal
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}