'use client'

import { useState } from 'react'
import { TrophyIcon, FireIcon, StarIcon, SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid'
import type { DashboardStats, HabitWithStatus, WeeklyStats } from '@/lib/dashboardService'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  unlocked: boolean
  progress?: number
  target?: number
  color: string
  bgColor: string
  tip?: string
}

interface AchievementHighlightsProps {
  stats: DashboardStats
  habits: HabitWithStatus[]
  weeklyStats: WeeklyStats
}

export default function AchievementHighlights({ stats, habits, weeklyStats }: AchievementHighlightsProps) {
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null)

  // Generate achievements based on user data
  const generateAchievements = (): Achievement[] => {
    const achievements: Achievement[] = []

    // Streak achievements
    achievements.push({
      id: 'first-week',
      title: 'First Week',
      description: 'Complete a 7-day streak',
      icon: FireIcon,
      unlocked: stats.longestCurrentStreak >= 7,
      progress: Math.min(stats.longestCurrentStreak, 7),
      target: 7,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      tip: 'Consistency is key! Focus on small daily actions.'
    })

    achievements.push({
      id: 'consistency-champion',
      title: 'Consistency Champion',
      description: 'Maintain a 30-day streak',
      icon: TrophyIcon,
      unlocked: stats.longestCurrentStreak >= 30,
      progress: Math.min(stats.longestCurrentStreak, 30),
      target: 30,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      tip: 'Amazing dedication! You\'re building lasting habits.'
    })

    // Multi-habit achievements
    achievements.push({
      id: 'habit-master',
      title: 'Habit Master',
      description: 'Track 5 active habits',
      icon: StarIcon,
      unlocked: stats.totalActiveHabits >= 5,
      progress: Math.min(stats.totalActiveHabits, 5),
      target: 5,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      tip: 'Diversifying your habits creates a well-rounded routine.'
    })

    // Completion rate achievements
    achievements.push({
      id: 'perfectionist',
      title: 'Daily Perfectionist',
      description: 'Achieve 100% completion rate',
      icon: SparklesIcon,
      unlocked: stats.dailyCompletionRate >= 100,
      progress: stats.dailyCompletionRate,
      target: 100,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      tip: 'Perfect days fuel motivation and build confidence!'
    })

    // Weekly consistency
    achievements.push({
      id: 'weekly-warrior',
      title: 'Weekly Warrior',
      description: 'Maintain 80% weekly average',
      icon: TrophyIcon,
      unlocked: weeklyStats.averageCompletionRate >= 80,
      progress: weeklyStats.averageCompletionRate,
      target: 80,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      tip: '80% consistency leads to incredible long-term results.'
    })

    return achievements
  }

  const achievements = generateAchievements()
  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const nextToUnlock = achievements.find(a => !a.unlocked && a.progress && a.target)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div className="flex items-center space-x-2">
          <TrophySolidIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Achievements</h3>
        </div>
        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {unlockedCount}/{totalCount} unlocked
        </span>
      </div>

      {/* Next achievement preview */}
      {nextToUnlock && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <InformationCircleIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Almost there!</span>
          </div>
          <p className="text-xs text-gray-700">
            <span className="font-medium">{nextToUnlock.title}</span> - {' '}
            {nextToUnlock.progress}/{nextToUnlock.target} ({Math.round((nextToUnlock.progress! / nextToUnlock.target!) * 100)}%)
          </p>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((nextToUnlock.progress! / nextToUnlock.target!) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon
          const progressPercentage = achievement.target
            ? Math.min((achievement.progress || 0) / achievement.target * 100, 100)
            : 0
          const isHovered = hoveredAchievement === achievement.id

          return (
            <div
              key={achievement.id}
              className={`p-3 lg:p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-sm ${
                achievement.unlocked
                  ? achievement.bgColor
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              } ${isHovered ? 'scale-102' : ''}`}
              onMouseEnter={() => setHoveredAchievement(achievement.id)}
              onMouseLeave={() => setHoveredAchievement(null)}
              title={achievement.tip}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    achievement.unlocked
                      ? 'bg-white/80 shadow-sm'
                      : 'bg-gray-200'
                  } ${isHovered && achievement.unlocked ? 'scale-110' : ''}`}>
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        achievement.unlocked
                          ? achievement.color
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${
                    achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {achievement.description}
                  </p>

                  {/* Progress bar for achievements */}
                  {achievement.target && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={achievement.unlocked ? achievement.color : 'text-gray-500'}>
                          {achievement.progress || 0}/{achievement.target}
                        </span>
                        <span className={achievement.unlocked ? achievement.color : 'text-gray-500'}>
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                            achievement.unlocked
                              ? achievement.color.replace('text-', 'bg-').replace('-600', '-400')
                              : 'bg-gray-300'
                          }`}
                          style={{
                            width: `${progressPercentage}%`,
                            animationDelay: '200ms'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Unlocked badge with animation */}
                  {achievement.unlocked && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        achievement.color
                      } bg-white/80 animate-unlocked`}>
                        ✨ Unlocked
                      </span>
                    </div>
                  )}

                  {/* Progress indicator for locked achievements */}
                  {!achievement.unlocked && achievement.progress && achievement.target && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-200">
                        {Math.round(progressPercentage)}% complete
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Achievement summary and motivation */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {unlockedCount > 0 ? (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              🎉 You've unlocked {unlockedCount} achievement{unlockedCount > 1 ? 's' : ''}!
            </p>
            <p className="text-xs text-gray-600">
              Keep going! You're building incredible momentum with your habits.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              🚀 Your first achievement is waiting!
            </p>
            <p className="text-xs text-gray-600">
              Complete habits consistently to unlock rewards and track your progress.
            </p>
          </div>
        )}
      </div>

      {/* Custom styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scale-102 {
          transform: scale(1.02);
        }

        .animate-unlocked {
          animation: unlockPulse 2s ease-in-out infinite;
        }

        @keyframes unlockPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @media (max-width: 640px) {
          .hover\\:scale-110:hover {
            transform: none;
          }

          .scale-102 {
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}