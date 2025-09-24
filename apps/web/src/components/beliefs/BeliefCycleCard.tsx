import { UserBeliefCycle } from '../../types/beliefs'
import { useBeliefCycleActions } from '../../hooks/useBeliefs'

interface BeliefCycleCardProps {
  cycle: UserBeliefCycle
  onViewDetails: () => void
}

export function BeliefCycleCard({ cycle, onViewDetails }: BeliefCycleCardProps) {
  const { pauseCycle, resumeCycle, isLoading } = useBeliefCycleActions(cycle.id)

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

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      abandoned: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors.active
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      active: '🟢',
      completed: '✅',
      paused: '⏸️',
      abandoned: '🔴'
    }
    return icons[status as keyof typeof icons] || icons.active
  }

  const progressPercentage = Math.round((cycle.days_completed / 21) * 100)
  const daysRemaining = 21 - cycle.current_day

  return (
    <div className={`bg-white rounded-lg border hover:shadow-md transition-shadow ${cycle.status === 'paused' ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{cycle.title}</h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
            {getStatusIcon(cycle.status)} {cycle.status}
          </span>
        </div>

        {cycle.belief_systems?.category && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(cycle.belief_systems.category)}`}>
            {cycle.belief_systems.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Belief Statement */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Belief Statement:</div>
          <p className="text-sm text-gray-900 font-medium italic line-clamp-2">
            "{cycle.personal_belief_statement}"
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Day {cycle.current_day} of 21</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{cycle.consecutive_days}</div>
            <div className="text-xs text-gray-600">Streak</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{cycle.days_completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>

        {/* Belief Strength Progress */}
        {cycle.current_belief_strength && cycle.initial_belief_strength && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Belief Strength:</span>
              <span className="font-semibold text-blue-600">
                {cycle.initial_belief_strength} → {cycle.current_belief_strength}
                <span className="text-green-600 ml-1">
                  (+{cycle.current_belief_strength - cycle.initial_belief_strength})
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Time Info */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
          {cycle.status === 'active' && (
            <span>
              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Cycle complete!'}
            </span>
          )}
          {cycle.status === 'completed' && cycle.actual_completion_date && (
            <span>Completed {new Date(cycle.actual_completion_date).toLocaleDateString()}</span>
          )}
          {cycle.status === 'paused' && (
            <span>Paused on day {cycle.current_day}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {cycle.status === 'active' ? 'Continue' : 'View Details'}
          </button>

          {cycle.status === 'active' && (
            <button
              onClick={() => pauseCycle(cycle)}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              ⏸️
            </button>
          )}

          {cycle.status === 'paused' && (
            <button
              onClick={() => resumeCycle(cycle)}
              disabled={isLoading}
              className="px-3 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              ▶️
            </button>
          )}
        </div>
      </div>

      {/* Personal Reason Footer */}
      {cycle.personal_reason && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-500 mb-1">Why this matters to you:</div>
          <p className="text-xs text-gray-700 line-clamp-2">{cycle.personal_reason}</p>
        </div>
      )}
    </div>
  )
}