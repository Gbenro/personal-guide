'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import { reportError, trackUserAction, measureAsyncExecutionTime } from '@/lib/monitoring'
import { completeHabit } from '@/lib/habitService'
import { getDashboardData, type HabitWithStatus, type DashboardStats, type WeeklyStats, type AIInsight } from '@/lib/dashboardService'
import { TabType } from '@/types/navigation'

// Import Zustand store and journal components
import { usePersonalGuideStore, useJournalModal } from '@/stores/personalGuideStore'
import { JournalModal, QuickMoodTracker, JournalInsights } from '@/components/journal'
import { createMoodEntry } from '@/lib/journalService'

// Import mood and energy tracking
import { MoodEnergyTracker } from '@/components/mood'
import { createMoodEnergyEntry } from '@/lib/moodEnergyService'

// Import dashboard components
import SmartHeader from '@/components/dashboard/SmartHeader'
import TodaysCommandCenter from '@/components/dashboard/TodaysCommandCenter'
import WeeklyChart from '@/components/dashboard/WeeklyChart'
import AIInsights from '@/components/dashboard/AIInsights'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import AchievementHighlights from '@/components/dashboard/AchievementHighlights'

interface DashboardTabProps {
  onTabChange?: (tab: TabType) => void
}

export default function DashboardTab({ onTabChange }: DashboardTabProps) {
  const { user } = useAuth()
  const { open: openJournalModal } = useJournalModal()
  const addMoodEntry = usePersonalGuideStore(state => state.addMoodEntry)
  const addMoodEnergyEntry = usePersonalGuideStore(state => state.addMoodEnergyEntry)
  const [isLoading, setIsLoading] = useState(true)
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const [completionAnimation, setCompletionAnimation] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    dailyCompletionRate: 0,
    totalActiveHabits: 0,
    completedTodayCount: 0,
    pendingTodayCount: 0,
    longestCurrentStreak: 0,
    totalActiveStreaks: 0,
    atRiskHabitsCount: 0,
    weeklyCompletionRate: 0,
    monthlyTrend: 'stable'
  })
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    completionRates: [0, 0, 0, 0, 0, 0, 0],
    totalCompletions: 0,
    averageCompletionRate: 0,
    bestDay: 'Monday',
    worstDay: 'Monday'
  })
  const [insights, setInsights] = useState<AIInsight[]>([])

  // Load dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return

      setIsLoading(true)
      try {
        const dashboardData = await getDashboardData(user.id)
        setHabits(dashboardData.habits)
        setStats(dashboardData.stats)
        setWeeklyStats(dashboardData.weeklyStats)
        setInsights(dashboardData.insights)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  // Handle habit completion with animation
  const handleCompleteHabit = async (habitId: string) => {
    if (!user) return

    try {
      // Track user action
      trackUserAction({
        action: 'habit_completion_started',
        target: habitId,
        metadata: { userId: user.id }
      })

      // Start completion animation
      setCompletionAnimation(habitId)

      const entry = await measureAsyncExecutionTime('completeHabit', () =>
        completeHabit(habitId, user.id)
      )

      if (entry) {
        // Reload dashboard data to get updated stats
        const dashboardData = await measureAsyncExecutionTime('getDashboardData', () =>
          getDashboardData(user.id)
        )
        setHabits(dashboardData.habits)
        setStats(dashboardData.stats)
        setInsights(dashboardData.insights)

        // Track successful completion
        trackUserAction({
          action: 'habit_completed',
          target: habitId,
          metadata: { userId: user.id, entryId: entry.id }
        })

        // Clear animation after a delay
        setTimeout(() => setCompletionAnimation(null), 1000)
      }
    } catch (error) {
      console.error('Error completing habit:', error)
      reportError({
        message: `Failed to complete habit ${habitId}`,
        stack: error instanceof Error ? error.stack : undefined,
        severity: 'medium',
        context: { habitId, userId: user.id }
      })
      setCompletionAnimation(null)
    }
  }

  // Handle mood logging
  const handleMoodLog = async (mood: number) => {
    if (!user) return

    try {
      const moodEntry = await createMoodEntry(user.id, {
        rating: mood,
        notes: `Mood logged from dashboard: ${mood}/10`
      })

      if (moodEntry) {
        addMoodEntry(moodEntry)
        console.log('Mood logged successfully:', mood)
      }
    } catch (error) {
      console.error('Error logging mood:', error)
    }
  }

  // Handle mood and energy tracking
  const handleMoodEnergySubmit = async (data: {
    moodRating: number
    energyLevel: number
    notes?: string
    tags?: string[]
    context?: any
  }) => {
    if (!user) return

    try {
      const entry = await createMoodEnergyEntry(user.id, data)

      if (entry) {
        addMoodEnergyEntry(entry)
        console.log('Mood & energy logged successfully:', data)
      }
    } catch (error) {
      console.error('Error logging mood & energy:', error)
    }
  }

  // Handle AI insight actions
  const handleInsightAction = (insight: AIInsight) => {
    switch (insight.id) {
      case 'at-risk-habits':
        // Focus on habits tab
        onTabChange?.('habits')
        break
      case 'motivation-boost':
        // Stay on dashboard but scroll to command center
        document.getElementById('command-center')?.scrollIntoView({ behavior: 'smooth' })
        break
      default:
        console.log('Insight action:', insight.action)
    }
  }

  // Quick action handlers
  const handleAddHabit = () => onTabChange?.('habits')
  const handleOpenChat = () => onTabChange?.('chat')
  const handleOpenJournal = () => {
    openJournalModal()
  }
  const handleViewGoals = () => onTabChange?.('goals')
  const handleViewBeliefs = () => onTabChange?.('beliefs')
  const handleViewHabits = () => onTabChange?.('habits')

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton with improved spacing */}
            <div className="h-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded-2xl"></div>

            {/* Grid skeleton with better mobile spacing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        reportError({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack || undefined,
          severity: 'high',
          context: { component: 'DashboardTab', userId: user?.id }
        })
      }}
    >
      <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50/50 to-blue-50/30 min-h-full">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Smart Header */}
        <div className="animate-fade-in">
          <SmartHeader
            stats={stats}
            userName={user?.user_metadata?.name || 'there'}
            onMoodLog={handleMoodLog}
          />
        </div>

        {/* Section Divider */}
        <div className="hidden lg:block border-t border-gray-200/50"></div>

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Today's Command Center */}
          <div id="command-center" className="animate-slide-up">
            <TodaysCommandCenter
              habits={habits}
              onCompleteHabit={handleCompleteHabit}
              onViewHabits={handleViewHabits}
              completionAnimation={completionAnimation}
            />
          </div>

          {/* Weekly Chart */}
          <div className="animate-slide-up animation-delay-100">
            <WeeklyChart weeklyStats={weeklyStats} />
          </div>
        </div>

        {/* Section Divider */}
        <div className="hidden lg:block border-t border-gray-200/50"></div>

        {/* Enhanced middle section with achievements, activity, and journal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* AI Insights */}
          <div className="animate-slide-up animation-delay-200">
            <AIInsights
              insights={insights}
              onAction={handleInsightAction}
            />
          </div>

          {/* Journal Insights */}
          <div className="animate-slide-up animation-delay-250">
            <JournalInsights
              onOpenJournal={handleOpenJournal}
              showActions={true}
            />
          </div>

          {/* Achievement Highlights */}
          <div className="animate-slide-up animation-delay-300">
            <AchievementHighlights
              stats={stats}
              habits={habits}
              weeklyStats={weeklyStats}
            />
          </div>

          {/* Recent Activity */}
          <div className="animate-slide-up animation-delay-400">
            <RecentActivity
              habits={habits}
              maxItems={5}
            />
          </div>
        </div>

        {/* Section Divider */}
        <div className="hidden lg:block border-t border-gray-200/50"></div>

        {/* Enhanced Mood & Energy Tracker Section */}
        <div className="animate-slide-up animation-delay-450">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Mood & Energy Tracker */}
            <MoodEnergyTracker
              onSubmit={handleMoodEnergySubmit}
              compact={true}
            />

            {/* Journal Quick Access */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Daily Reflection
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Capture your thoughts and insights
                </p>
              </div>
              <div className="space-y-3">
                <QuickMoodTracker
                  onMoodLogged={handleMoodLog}
                  showLabel={true}
                  size="sm"
                />
                <button
                  onClick={handleOpenJournal}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
                >
                  <span>📝</span>
                  <span>Open Journal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="hidden lg:block border-t border-gray-200/50"></div>

        {/* Quick Actions */}
        <div className="animate-slide-up animation-delay-500">
          <QuickActions
            onAddHabit={handleAddHabit}
            onOpenChat={handleOpenChat}
            onOpenJournal={handleOpenJournal}
            onViewGoals={handleViewGoals}
            onViewBeliefs={handleViewBeliefs}
          />
        </div>

        {/* Enhanced welcome state for new users */}
        {habits.length === 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 lg:p-8 text-center border border-blue-100 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="text-5xl mb-4 animate-bounce">🌱</div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                Welcome to Personal Guide!
              </h3>
              <p className="text-gray-600 mb-6 text-sm lg:text-base">
                Ready to start your personal growth journey? Create your first habit and begin building positive momentum with our AI-powered guidance.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleAddHabit}
                  className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium shadow-sm min-h-[44px]"
                >
                  Create Your First Habit
                </button>
                <p className="text-xs text-gray-500">
                  💡 Start small - even 5 minutes a day can create lasting change
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced footer stats with better mobile layout */}
        {habits.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm animate-fade-in">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Your Growth Overview
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3 lg:p-4 hover:bg-blue-100 transition-colors group">
                <div className="text-xl lg:text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
                  {stats.totalActiveHabits}
                </div>
                <div className="text-xs lg:text-sm text-gray-600 mt-1">Active Habits</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 lg:p-4 hover:bg-green-100 transition-colors group">
                <div className="text-xl lg:text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">
                  {stats.totalActiveStreaks}
                </div>
                <div className="text-xs lg:text-sm text-gray-600 mt-1">Active Streaks</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 lg:p-4 hover:bg-orange-100 transition-colors group">
                <div className="text-xl lg:text-2xl font-bold text-orange-600 group-hover:scale-110 transition-transform">
                  {weeklyStats.totalCompletions}
                </div>
                <div className="text-xs lg:text-sm text-gray-600 mt-1">Week Completions</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 lg:p-4 hover:bg-purple-100 transition-colors group">
                <div className="text-xl lg:text-2xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
                  {weeklyStats.averageCompletionRate}%
                </div>
                <div className="text-xs lg:text-sm text-gray-600 mt-1">Weekly Average</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Keep building momentum! Small consistent actions lead to extraordinary results.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-450 {
          animation-delay: 0.45s;
        }

        .animation-delay-250 {
          animation-delay: 0.25s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

        {/* Journal Modal */}
        <JournalModal onSuccess={() => {
          // Optionally reload dashboard data when journal entry is saved
          console.log('Journal entry saved, dashboard refreshed')
        }} />
      </div>
    </ErrorBoundary>
  )
}