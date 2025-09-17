'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePersonalGuideStore, useInsights } from '@/stores/personalGuideStore'
import { getJournalStats } from '@/lib/journalService'
import {
  BookOpenIcon,
  PencilIcon,
  HeartIcon,
  ChartBarIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline'

interface JournalInsightsProps {
  onOpenJournal?: () => void
  showActions?: boolean
}

export default function JournalInsights({
  onOpenJournal,
  showActions = true
}: JournalInsightsProps) {
  const { user } = useAuth()
  const insights = useInsights()
  const { setInsights, calculateInsights } = usePersonalGuideStore()
  const [isLoading, setIsLoading] = useState(true)
  const [journalStats, setJournalStats] = useState<any>(null)

  useEffect(() => {
    loadJournalInsights()
  }, [user])

  const loadJournalInsights = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const stats = await getJournalStats(user.id)
      setJournalStats(stats)

      // Update insights in store
      calculateInsights()
    } catch (error) {
      console.error('Error loading journal insights:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your journey today!"
    if (streak === 1) return "Great start! Keep it up!"
    if (streak < 7) return `${streak} days strong!`
    if (streak < 30) return `Amazing ${streak}-day streak!`
    return `Incredible ${streak}-day streak! 🔥`
  }

  const getMoodEmoji = (rating: number) => {
    if (rating >= 8) return '🤩'
    if (rating >= 6) return '😊'
    if (rating >= 4) return '😐'
    if (rating >= 2) return '😔'
    return '😢'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpenIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Journal Insights
              </h3>
              <p className="text-sm text-gray-500">
                Your reflection journey
              </p>
            </div>
          </div>
          {showActions && (
            <button
              onClick={onOpenJournal}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Write new entry"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {journalStats && journalStats.totalEntries > 0 ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
                  <BookOpenIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {journalStats.totalEntries}
                </div>
                <div className="text-xs text-gray-600">
                  {journalStats.totalEntries === 1 ? 'Entry' : 'Entries'}
                </div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
                  <FireIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-xl font-bold text-green-600">
                  {journalStats.currentStreak}
                </div>
                <div className="text-xs text-gray-600">Day Streak</div>
              </div>

              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mx-auto mb-2">
                  <PencilIcon className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {journalStats.totalWords.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Words</div>
              </div>

              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2">
                  <FaceSmileIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-xl font-bold text-purple-600 flex items-center justify-center">
                  {getMoodEmoji(journalStats.averageMoodRating)}
                  <span className="ml-1 text-sm">
                    {journalStats.averageMoodRating}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Avg Mood</div>
              </div>
            </div>

            {/* Streak Message */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">
                {journalStats.currentStreak > 0 ? '🔥' : '📝'}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {getStreakMessage(journalStats.currentStreak)}
              </p>
              {journalStats.longestStreak > journalStats.currentStreak && (
                <p className="text-xs text-gray-500 mt-1">
                  Personal best: {journalStats.longestStreak} days
                </p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">This week:</span>
                  <span className="font-medium">
                    {journalStats.entriesThisWeek} {journalStats.entriesThisWeek === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">This month:</span>
                  <span className="font-medium">
                    {journalStats.entriesThisMonth} {journalStats.entriesThisMonth === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg words:</span>
                  <span className="font-medium">{journalStats.averageWordsPerEntry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Best streak:</span>
                  <span className="font-medium">{journalStats.longestStreak} days</span>
                </div>
              </div>
            </div>

            {/* Top Tags */}
            {journalStats.topTags && journalStats.topTags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Common Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {journalStats.topTags.slice(0, 5).map((tag: { tag: string; count: number }) => (
                    <span
                      key={tag.tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {tag.tag}
                      <span className="ml-1 text-purple-600">({tag.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {showActions && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={onOpenJournal}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Write New Entry</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Start Your Journal Journey
            </h4>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Begin documenting your thoughts, experiences, and growth. Writing helps clarify your mind and track your progress.
            </p>
            {showActions && (
              <button
                onClick={onOpenJournal}
                className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
              >
                <PencilIcon className="w-4 h-4" />
                <span>Write First Entry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}