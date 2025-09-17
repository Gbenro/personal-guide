'use client'

import { useState } from 'react'
import { FireIcon } from '@heroicons/react/24/outline'
import { getDynamicGreeting, getMoodOptions } from '@/lib/dashboardService'
import ProgressRing from './ProgressRing'
import type { DashboardStats } from '@/lib/dashboardService'

interface SmartHeaderProps {
  stats: DashboardStats
  userName?: string
  onMoodLog?: (mood: number) => void
}

export default function SmartHeader({ stats, userName = 'there', onMoodLog }: SmartHeaderProps) {
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)

  const greeting = getDynamicGreeting()
  const moodOptions = getMoodOptions()

  const handleMoodSelect = (moodValue: number) => {
    setSelectedMood(moodValue)
    setShowMoodSelector(false)
    onMoodLog?.(moodValue)
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold mb-1">
            {greeting}
          </h2>
          <p className="text-blue-100 text-sm md:text-base">
            Welcome back, {userName}! Let's make today count.
          </p>

          {/* Quick stats row */}
          <div className="flex items-center space-x-4 mt-4">
            {stats.longestCurrentStreak > 0 && (
              <div className="flex items-center space-x-1 bg-white/20 rounded-full px-3 py-1">
                <FireIcon className="h-4 w-4 text-orange-300" />
                <span className="text-sm font-medium">
                  {stats.longestCurrentStreak} day streak
                </span>
              </div>
            )}

            <button
              onClick={() => setShowMoodSelector(!showMoodSelector)}
              className="bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 text-sm font-medium transition-colors"
            >
              {selectedMood ? (
                <>
                  {moodOptions.find(m => m.value === selectedMood)?.emoji} {moodOptions.find(m => m.value === selectedMood)?.label}
                </>
              ) : (
                '😊 Log mood'
              )}
            </button>
          </div>

          {/* Mood selector dropdown */}
          {showMoodSelector && (
            <div className="absolute z-10 mt-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
              <div className="flex space-x-2">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodSelect(mood.value)}
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    title={mood.label}
                  >
                    <span className="text-2xl mb-1">{mood.emoji}</span>
                    <span className="text-xs text-gray-600 font-medium">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress ring */}
        <div className="flex-shrink-0 ml-6">
          <ProgressRing
            percentage={stats.dailyCompletionRate}
            size={80}
            className="filter drop-shadow-sm"
          />
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.completedTodayCount}</div>
          <div className="text-xs text-blue-100 uppercase tracking-wide">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.pendingTodayCount}</div>
          <div className="text-xs text-blue-100 uppercase tracking-wide">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.totalActiveStreaks}</div>
          <div className="text-xs text-blue-100 uppercase tracking-wide">Active Streaks</div>
        </div>
      </div>
    </div>
  )
}