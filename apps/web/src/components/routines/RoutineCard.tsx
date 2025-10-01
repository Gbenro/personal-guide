import { useState } from 'react'
import { UserRoutine } from '../../types/routines'
import { useRoutineActions, useActiveSession, useCompleteRoutineSession } from '../../hooks/useRoutines'
import { CompleteRoutineModal } from './CompleteRoutineModal'

interface RoutineCardProps {
  routine: UserRoutine
  onEdit: () => void
}

export function RoutineCard({ routine, onEdit }: RoutineCardProps) {
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const { toggleFavorite, toggleActive, startRoutine, isLoading } = useRoutineActions(routine.id)
  const { data: activeSession } = useActiveSession(routine.id)
  const completeSessionMutation = useCompleteRoutineSession()

  const getCategoryColor = (category: string) => {
    const colors = {
      Morning: 'bg-orange-100 text-orange-800',
      Evening: 'bg-purple-100 text-purple-800',
      Workout: 'bg-red-100 text-red-800',
      Meditation: 'bg-blue-100 text-blue-800',
      Work: 'bg-gray-100 text-gray-800',
      Study: 'bg-green-100 text-green-800',
      Wellness: 'bg-pink-100 text-pink-800',
      General: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.General
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      Morning: '🌅',
      Evening: '🌙',
      Workout: '💪',
      Meditation: '🧘',
      Work: '💼',
      Study: '📚',
      Wellness: '🌸',
      General: '⭐'
    }
    return icons[category as keyof typeof icons] || icons.General
  }

  const handleStartRoutine = () => {
    startRoutine()
  }

  const handleCompleteRoutine = async (input: any) => {
    await completeSessionMutation.mutateAsync(input)
    setShowCompleteModal(false)
  }

  const getSessionDuration = () => {
    if (!activeSession) return 0
    return Math.round((Date.now() - activeSession.started_at.getTime()) / (1000 * 60))
  }

  const isRoutineActive = !!activeSession && activeSession.status === 'active'


  return (
    <div className={`bg-white rounded-lg border ${!routine.is_active ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{getCategoryIcon(routine.category)}</span>
              <h3 className="font-semibold text-gray-900 truncate">{routine.name}</h3>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(routine.category)}`}>
              {routine.category}
            </span>
          </div>

          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => toggleFavorite(routine)}
              disabled={isLoading}
              className={`p-1.5 rounded-md transition-colors ${
                routine.is_favorite
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {routine.is_favorite ? '⭐' : '☆'}
            </button>

            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {routine.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{routine.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{routine.current_streak}</div>
            <div className="text-xs text-gray-600">Current Streak</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{routine.total_completions}</div>
            <div className="text-xs text-gray-600">Completions</div>
          </div>
        </div>

        {/* Duration & Schedule Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>⏱️ {routine.estimated_duration} min</span>
          {routine.is_scheduled && (
            <span className="flex items-center">
              📅 Scheduled
            </span>
          )}
        </div>

        {/* Steps Preview */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">{routine.steps.length} steps</div>
          <div className="flex -space-x-1">
            {routine.steps.slice(0, 3).map((_, index) => (
              <div
                key={index}
                className="w-6 h-6 bg-blue-100 border-2 border-white rounded-full flex items-center justify-center text-xs text-blue-600 font-medium"
              >
                {index + 1}
              </div>
            ))}
            {routine.steps.length > 3 && (
              <div className="w-6 h-6 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center text-xs text-gray-500">
                +{routine.steps.length - 3}
              </div>
            )}
          </div>
        </div>


        {/* Actions */}
        <div className="flex space-x-2">
          {isRoutineActive ? (
            <>
              <button
                onClick={() => setShowCompleteModal(true)}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 transition-all"
              >
                🏁 Complete ({getSessionDuration()}m)
              </button>
              <div className="px-2 py-2 bg-green-50 rounded-lg flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleStartRoutine}
                disabled={!routine.is_active || isLoading}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  routine.is_active && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Starting...' : '▶️ Start Ritual'}
              </button>

              <button
                onClick={() => toggleActive(routine)}
                disabled={isLoading}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  routine.is_active
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
              >
                {routine.is_active ? 'Pause' : 'Resume'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Last completed indicator */}
      {routine.last_completed_at && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-500">
            Last completed {new Date(routine.last_completed_at).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Complete Routine Modal */}
      {showCompleteModal && activeSession && (
        <CompleteRoutineModal
          open={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          onComplete={handleCompleteRoutine}
          routine={routine}
          session={activeSession}
          actualDurationMinutes={getSessionDuration()}
        />
      )}
    </div>
  )
}