'use client'

import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
import type { HabitWithStatus } from '@/lib/dashboardService'

interface TodaysCommandCenterProps {
  habits: HabitWithStatus[]
  onCompleteHabit: (habitId: string) => void
  onViewHabits: () => void
  completionAnimation?: string | null
}

export default function TodaysCommandCenter({
  habits,
  onCompleteHabit,
  onViewHabits,
  completionAnimation
}: TodaysCommandCenterProps) {
  const pendingHabits = habits.filter(h => !h.completedToday)
  const atRiskHabits = habits.filter(h => h.isAtRisk)
  const completedHabits = habits.filter(h => h.completedToday)

  // Prioritize display: at-risk habits first, then pending, then completed
  const prioritizedHabits = [
    ...atRiskHabits.filter(h => !h.completedToday),
    ...pendingHabits.filter(h => !h.isAtRisk),
    ...completedHabits.slice(0, 2) // Show max 2 completed for space
  ].slice(0, 4) // Show max 4 total

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div>
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-500" />
            Today's Focus
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {pendingHabits.length > 0
              ? `${pendingHabits.length} habit${pendingHabits.length > 1 ? 's' : ''} pending`
              : 'All habits completed! 🎉'
            }
          </p>
        </div>

        {habits.length > 4 && (
          <button
            onClick={onViewHabits}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-3 py-1 rounded-md transition-colors min-h-[32px]"
          >
            View all
          </button>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-6 lg:py-8">
          <div className="animate-bounce mb-4">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto" />
          </div>
          <h4 className="text-lg font-medium text-gray-700 mb-2">Ready to start your journey?</h4>
          <p className="text-gray-500 mb-6 text-sm">
            Create your first habit and begin building positive momentum
          </p>
          <button
            onClick={onViewHabits}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium shadow-sm min-h-[44px]"
          >
            Create your first habit
          </button>
          <p className="text-xs text-gray-400 mt-3">
            💡 Tip: Start with just 5 minutes a day
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prioritizedHabits.map((habit) => {
            const isAnimating = completionAnimation === habit.id

            return (
              <div
                key={habit.id}
                className={`p-3 lg:p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-sm ${
                  habit.completedToday
                    ? 'bg-green-50 border-green-200 animate-completion'
                    : habit.isAtRisk
                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                } ${isAnimating ? 'animate-pulse ring-2 ring-green-400' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => !habit.completedToday && onCompleteHabit(habit.id)}
                      disabled={habit.completedToday}
                      className="transition-all duration-200 hover:scale-110 active:scale-95 disabled:cursor-default flex-shrink-0"
                      title={habit.completedToday ? 'Completed!' : 'Mark as complete'}
                    >
                      {habit.completedToday ? (
                        <CheckCircleSolidIcon
                          className={`h-8 w-8 text-green-500 ${isAnimating ? 'animate-bounce' : ''}`}
                          style={{ color: habit.color }}
                        />
                      ) : (
                        <CheckCircleIcon
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1"
                        />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-800 truncate">{habit.name}</h4>

                        {habit.isAtRisk && !habit.completedToday && (
                          <div className="flex items-center space-x-1 text-red-600 flex-shrink-0 animate-pulse">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            <span className="text-xs font-medium">At risk</span>
                          </div>
                        )}
                      </div>

                      {habit.description && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{habit.description}</p>
                      )}

                      <div className="flex items-center flex-wrap gap-2 lg:gap-4">
                        {habit.streak.current_streak > 0 && (
                          <span className="text-xs text-gray-600 bg-orange-100 px-2 py-1 rounded-full inline-flex items-center gap-1">
                            🔥 {habit.streak.current_streak} day streak
                          </span>
                        )}

                        {!habit.completedToday && habit.daysSinceLastCompletion < Infinity && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Last: {habit.daysSinceLastCompletion === 0 ? 'Today' :
                                  habit.daysSinceLastCompletion === 1 ? 'Yesterday' :
                                  `${habit.daysSinceLastCompletion} days ago`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!habit.completedToday && (
                    <button
                      onClick={() => onCompleteHabit(habit.id)}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 min-h-[32px] min-w-[80px] ${
                        habit.isAtRisk
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                      }`}
                      title={habit.isAtRisk ? 'Complete to save your streak' : 'Mark as complete'}
                    >
                      {habit.isAtRisk ? 'Save streak' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Quick action buttons with better mobile layout */}
          {pendingHabits.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => pendingHabits.forEach(h => onCompleteHabit(h.id))}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm font-medium shadow-sm min-h-[44px] flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Complete all ({pendingHabits.length})
                </button>

                {atRiskHabits.length > 0 && (
                  <button
                    onClick={() => atRiskHabits.filter(h => !h.completedToday).forEach(h => onCompleteHabit(h.id))}
                    className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm font-medium shadow-sm min-h-[44px] flex items-center justify-center gap-2"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Save streaks ({atRiskHabits.filter(h => !h.completedToday).length})
                  </button>
                )}
              </div>

              {/* Motivational tip */}
              <div className="mt-3 p-2 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700 text-center">
                  💪 Building habits? Focus on consistency over perfection!
                </p>
              </div>
            </div>
          )}

          {/* Celebration for all completed */}
          {pendingHabits.length === 0 && habits.length > 0 && (
            <div className="pt-4 border-t border-gray-100 text-center">
              <div className="animate-bounce text-2xl mb-2">🎉</div>
              <p className="text-sm font-medium text-green-700 mb-1">
                Amazing! All habits completed today!
              </p>
              <p className="text-xs text-gray-600">
                You're building incredible momentum. Keep it up!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom styles for animations */}
      <style jsx>{`
        .animate-completion {
          animation: completionGlow 0.8s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes completionGlow {
          0% {
            background-color: #fef3c7;
            transform: scale(1);
          }
          50% {
            background-color: #d1fae5;
            transform: scale(1.02);
          }
          100% {
            background-color: #ecfdf5;
            transform: scale(1);
          }
        }

        @media (max-width: 640px) {
          .min-w-0 {
            min-width: 0;
          }
        }
      `}</style>
    </div>
  )
}