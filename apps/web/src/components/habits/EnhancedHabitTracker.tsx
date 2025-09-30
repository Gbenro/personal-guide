'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  CheckCircleIcon,
  FireIcon,
  TrashIcon,
  StarIcon,
  ChartBarIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  BookmarkIcon,
  TrophyIcon,
  SunIcon,
  MoonIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon as CheckCircleSolidIcon,
  StarIcon as StarSolidIcon,
  FireIcon as FireSolidIcon,
  TrophyIcon as TrophySolidIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '@/contexts/AuthContext'
import ErrorBoundary from '../ErrorBoundary'
import { reportError, trackUserAction, measureAsyncExecutionTime } from '@/lib/monitoring'
import { type Habit, type HabitEntry, type HabitStreak } from '@/lib/habitService'
import {
  useHabitsWithDetails,
  useCreateHabit,
  useCompleteHabit,
  useUndoHabitCompletion,
  useArchiveHabit,
  useHabitStreak,
} from '@/hooks/useHabits'
import { useQuickNotifications } from '@/hooks/useNotifications'
import NotificationCenter from '@/components/notifications/NotificationCenter'

const HABIT_COLORS = [
  { name: 'Ocean Blue', value: '#3B82F6', gradient: 'from-blue-400 to-blue-600' },
  { name: 'Forest Green', value: '#10B981', gradient: 'from-green-400 to-green-600' },
  { name: 'Sunset Orange', value: '#F59E0B', gradient: 'from-orange-400 to-orange-600' },
  { name: 'Cherry Red', value: '#EF4444', gradient: 'from-red-400 to-red-600' },
  { name: 'Royal Purple', value: '#8B5CF6', gradient: 'from-purple-400 to-purple-600' },
  { name: 'Pink Rose', value: '#EC4899', gradient: 'from-pink-400 to-pink-600' },
  { name: 'Cyan Sky', value: '#06B6D4', gradient: 'from-cyan-400 to-cyan-600' },
  { name: 'Warm Amber', value: '#F97316', gradient: 'from-amber-400 to-amber-600' },
]

const HABIT_CATEGORIES = [
  { name: 'Health & Fitness', icon: '💪', color: 'text-green-600' },
  { name: 'Mindfulness', icon: '🧘', color: 'text-purple-600' },
  { name: 'Learning', icon: '📚', color: 'text-blue-600' },
  { name: 'Productivity', icon: '⚡', color: 'text-yellow-600' },
  { name: 'Relationships', icon: '❤️', color: 'text-red-600' },
  { name: 'Personal Care', icon: '✨', color: 'text-pink-600' },
  { name: 'Creativity', icon: '🎨', color: 'text-indigo-600' },
  { name: 'Other', icon: '📝', color: 'text-gray-600' }
]

const TIME_OF_DAY = [
  { name: 'Morning', icon: '🌅', time: 'morning' },
  { name: 'Afternoon', icon: '☀️', time: 'afternoon' },
  { name: 'Evening', icon: '🌅', time: 'evening' },
  { name: 'Anytime', icon: '⏰', time: 'anytime' }
]

interface HabitWithStatus extends Habit {
  completedToday: boolean
  streak: HabitStreak
  category?: string
  timeOfDay?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  priority?: 'low' | 'medium' | 'high'
  completionRate?: number
  bestStreak?: number
}

interface HabitFormData {
  name: string
  description: string
  color: typeof HABIT_COLORS[0]
  target_frequency: number
  frequency_period: 'daily' | 'weekly' | 'monthly'
  category: string
  timeOfDay: string
  difficulty: 'easy' | 'medium' | 'hard'
  priority: 'low' | 'medium' | 'high'
}

// Helper function to format frequency display
const formatFrequency = (frequency: number, period: string = 'daily') => {
  const periodMap: { [key: string]: string } = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month'
  }
  const periodName = periodMap[period] || 'day'
  return `${frequency} time${frequency > 1 ? 's' : ''} per ${periodName}`
}

export default function EnhancedHabitTracker() {
  const { user } = useAuth()

  // React Query hooks for data fetching
  const { habits: rawHabits, completions, stats, isLoading, error } = useHabitsWithDetails(user?.id || '')
  const createHabitMutation = useCreateHabit()
  const completeHabitMutation = useCompleteHabit()
  const undoHabitCompletionMutation = useUndoHabitCompletion()
  const archiveHabitMutation = useArchiveHabit()

  // Notification hooks
  const quickNotifications = useQuickNotifications()

  // UI state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithStatus | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'streak' | 'completion' | 'priority'>('priority')
  const [showStats, setShowStats] = useState(false)

  const [newHabit, setNewHabit] = useState<HabitFormData>({
    name: '',
    description: '',
    color: HABIT_COLORS[0],
    target_frequency: 1,
    frequency_period: 'daily',
    category: HABIT_CATEGORIES[0].name,
    timeOfDay: TIME_OF_DAY[0].time,
    difficulty: 'medium',
    priority: 'medium'
  })

  // Transform raw habits data with enhanced metadata
  const habits: HabitWithStatus[] = rawHabits.map((habit) => {
    const completedToday = completions.some(c => c.habit_id === habit.id)

    // Calculate real streak data from completions
    const habitCompletions = completions.filter(c => c.habit_id === habit.id)

    // Calculate current streak
    let currentStreak = 0
    const sortedCompletions = habitCompletions
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())

    if (sortedCompletions.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < sortedCompletions.length; i++) {
        const completionDate = new Date(sortedCompletions[i].completed_at)
        completionDate.setHours(0, 0, 0, 0)

        const expectedDate = new Date(today)
        expectedDate.setDate(expectedDate.getDate() - currentStreak)

        if (completionDate.getTime() === expectedDate.getTime()) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Calculate longest streak (simplified - would need more complex logic for full accuracy)
    const longestStreak = Math.max(currentStreak, 0)

    const realStreak: HabitStreak = {
      habit_id: habit.id,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed: habitCompletions.length > 0 ? new Date(habitCompletions[0].completed_at) : null,
      total_completions: habitCompletions.length
    }

    // Calculate days since habit was created
    const createdDate = new Date(habit.created_at)
    const now = new Date()
    const daysSinceCreated = Math.max(1, Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))

    // Calculate realistic completion rate
    const completionRate = daysSinceCreated > 0 ?
      Math.round((habitCompletions.length / daysSinceCreated) * 100) : 0

    return {
      ...habit,
      completedToday,
      streak: realStreak,
      completionRate,
      bestStreak: realStreak.longest_streak,
      // Enhanced categorization
      category: habit.description?.includes('exercise') ? 'Health & Fitness' :
               habit.description?.includes('meditat') ? 'Mindfulness' :
               habit.description?.includes('read') ? 'Learning' : 'Other',
      timeOfDay: 'anytime',
      difficulty: 'medium' as const,
      priority: realStreak.current_streak > 7 ? 'high' as const : 'medium' as const
    }
  })

  // Enhanced habit creation with validation
  const handleCreateHabit = async () => {
    if (!user || !newHabit.name.trim()) return

    trackUserAction({
      action: 'habit_creation_started',
      target: 'habit_form',
      metadata: {
        category: newHabit.category,
        difficulty: newHabit.difficulty,
        priority: newHabit.priority
      }
    })

    try {
      await createHabitMutation.mutateAsync({
        userId: user.id,
        name: newHabit.name,
        description: newHabit.description,
        color: newHabit.color.value,
        targetFrequency: newHabit.target_frequency,
        frequencyPeriod: newHabit.frequency_period
      })

      resetForm()

      trackUserAction({
        action: 'habit_created',
        target: 'habit_tracker',
        metadata: { habitName: newHabit.name, category: newHabit.category }
      })
    } catch (error) {
      reportError({
        message: 'Failed to create habit',
        severity: 'medium',
        context: { habitName: newHabit.name, userId: user.id }
      })
    }
  }

  // Enhanced habit completion with celebration effects
  const handleToggleCompletion = async (habit: HabitWithStatus) => {
    if (!user || habit.completedToday) return

    try {
      await completeHabitMutation.mutateAsync({
        habitId: habit.id,
        userId: user.id
      })

      trackUserAction({
        action: 'habit_completed',
        target: habit.id,
        metadata: {
          habitName: habit.name,
          category: habit.category
        }
      })

      // Calculate new streak (current + 1 since we just completed)
      const newStreak = habit.streak.current_streak + 1
      const isNewRecord = newStreak > habit.streak.longest_streak

      // Trigger celebration notification
      quickNotifications.celebrate(habit.id, habit.name, newStreak, isNewRecord)

      // Check for milestone notifications
      const milestones = [7, 14, 21, 30, 50, 75, 100, 200, 365]
      if (milestones.includes(newStreak)) {
        quickNotifications.milestone(habit.id, habit.name, newStreak)
      }

      // Check for streak at risk prevention (completed just in time)
      if (habit.streak.is_at_risk) {
        quickNotifications.encourage(habit.id, habit.name, 'comeback')
      } else if (newStreak >= 3) {
        quickNotifications.encourage(habit.id, habit.name, 'keep_going')
      }

    } catch (error) {
      reportError({
        message: 'Failed to complete habit',
        severity: 'medium',
        context: { habitId: habit.id, userId: user.id }
      })
    }
  }

  // Undo habit completion
  const handleUndoCompletion = async (habit: HabitWithStatus) => {
    if (!user || !habit.completedToday) return

    try {
      await undoHabitCompletionMutation.mutateAsync({
        habitId: habit.id,
        userId: user.id
      })

      trackUserAction({
        action: 'habit_completion_undone',
        target: habit.id,
        metadata: {
          habitName: habit.name,
          previousStreak: habit.streak.current_streak,
          category: habit.category
        }
      })
    } catch (error) {
      reportError({
        message: 'Failed to undo habit completion',
        severity: 'medium',
        context: { habitId: habit.id, userId: user.id }
      })
    }
  }

  // Enhanced habit deletion with confirmation
  const handleDeleteHabit = async (habit: HabitWithStatus) => {
    if (!confirm(`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await archiveHabitMutation.mutateAsync({
        habitId: habit.id,
        userId: user!.id
      })

      trackUserAction({
        action: 'habit_deleted',
        target: habit.id,
        metadata: { habitName: habit.name, streak: habit.streak.current_streak }
      })
    } catch (error) {
      reportError({
        message: 'Failed to delete habit',
        severity: 'medium',
        context: { habitId: habit.id }
      })
    }
  }

  const resetForm = () => {
    setNewHabit({
      name: '',
      description: '',
      color: HABIT_COLORS[0],
      target_frequency: 1,
      frequency_period: 'daily',
      category: HABIT_CATEGORIES[0].name,
      timeOfDay: TIME_OF_DAY[0].time,
      difficulty: 'medium',
      priority: 'medium'
    })
    setShowAddForm(false)
    setEditingHabit(null)
  }

  // Enhanced filtering and sorting
  const filteredAndSortedHabits = habits
    .filter(habit => filterCategory === 'all' || habit.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'streak':
          return b.streak.current_streak - a.streak.current_streak
        case 'completion':
          return (b.completionRate || 0) - (a.completionRate || 0)
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2)
        default:
          return 0
      }
    })

  // Enhanced statistics calculation using React Query stats with fallback
  const localStats = {
    totalHabits: habits.length,
    completedToday: habits.filter(h => h.completedToday).length,
    totalStreaks: habits.reduce((sum, h) => sum + h.streak.current_streak, 0),
    longestStreak: Math.max(...habits.map(h => h.streak.longest_streak), 0),
    completionRate: habits.length > 0 ?
      Math.round((habits.filter(h => h.completedToday).length / habits.length) * 100) : 0,
    averageStreak: habits.length > 0 ?
      Math.round(habits.reduce((sum, h) => sum + h.streak.current_streak, 0) / habits.length) : 0
  }

  // Use React Query stats when available, fallback to local calculation
  const finalStats = stats ? {
    totalHabits: stats.active_habits,
    completedToday: localStats.completedToday, // Use local since it's real-time
    averageStreak: localStats.averageStreak, // Use local calculation for now
    longestStreak: stats.longest_streak,
    completionRate: stats.completion_rate_today
  } : localStats

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
            ))}
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
          context: { component: 'EnhancedHabitTracker', userId: user?.id }
        })
      }}
    >
      <div className="space-y-6">
        {/* Enhanced Header with Statistics */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Daily Habits</h2>
              <p className="text-blue-100">Build consistency, achieve greatness</p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notification Center */}
              <NotificationCenter userId={user?.id || ''} />

              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                title="Toggle statistics"
              >
                <ChartBarIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Habit</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black bg-opacity-20 rounded-lg p-3 border border-white border-opacity-20">
              <div className="text-2xl font-bold text-white">{finalStats.completedToday}/{finalStats.totalHabits}</div>
              <div className="text-sm text-blue-100 font-medium">Today's Progress</div>
            </div>
            <div className="bg-black bg-opacity-20 rounded-lg p-3 border border-white border-opacity-20">
              <div className="text-2xl font-bold flex items-center text-white">
                <FireSolidIcon className="w-6 h-6 text-orange-300 mr-1" />
                {finalStats.averageStreak}
              </div>
              <div className="text-sm text-blue-100 font-medium">Avg Streak</div>
            </div>
            <div className="bg-black bg-opacity-20 rounded-lg p-3 border border-white border-opacity-20">
              <div className="text-2xl font-bold text-white">{finalStats.completionRate}%</div>
              <div className="text-sm text-blue-100 font-medium">Completion Rate</div>
            </div>
            <div className="bg-black bg-opacity-20 rounded-lg p-3 border border-white border-opacity-20">
              <div className="text-2xl font-bold flex items-center text-white">
                <TrophySolidIcon className="w-6 h-6 text-yellow-300 mr-1" />
                {finalStats.longestStreak}
              </div>
              <div className="text-sm text-blue-100 font-medium">Best Streak</div>
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Categories</option>
                {HABIT_CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="priority">Sort by Priority</option>
                <option value="name">Sort by Name</option>
                <option value="streak">Sort by Streak</option>
                <option value="completion">Sort by Completion</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="grid grid-cols-2 gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-current rounded-sm"></div>
                  ))}
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="space-y-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-4 h-0.5 bg-current rounded-sm"></div>
                  ))}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Habits Display */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {filteredAndSortedHabits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filterCategory === 'all' ? 'No habits yet' : `No ${filterCategory} habits`}
              </h3>
              <p className="text-gray-700 mb-6 max-w-md mx-auto">
                Start building positive habits that will transform your daily routine and help you achieve your goals.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Your First Habit
              </button>
            </div>
          ) : (
            <div className={`p-6 ${
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }`}>
              {filteredAndSortedHabits.map((habit) => (
                <div
                  key={habit.id}
                  className={`group relative overflow-hidden transition-all duration-200 ${
                    viewMode === 'grid'
                      ? `rounded-xl border-2 p-4 ${
                          habit.completedToday
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`
                      : `rounded-lg border p-3 ${
                          habit.completedToday
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`
                  }`}
                >
                  {/* Priority indicator */}
                  {habit.priority === 'high' && (
                    <div className="absolute top-2 right-2">
                      <StarSolidIcon className="w-4 h-4 text-yellow-500" title="High Priority" />
                    </div>
                  )}

                  <div className={`flex items-center ${viewMode === 'grid' ? 'flex-col text-center space-y-3' : 'justify-between'}`}>
                    <div className={`flex items-center ${viewMode === 'grid' ? 'flex-col space-y-2' : 'space-x-3'}`}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleCompletion(habit)}
                          className="transition-transform hover:scale-110 relative"
                          disabled={habit.completedToday}
                        >
                          {habit.completedToday ? (
                            <CheckCircleSolidIcon
                              className="h-12 w-12"
                              style={{ color: habit.color }}
                            />
                          ) : (
                            <CheckCircleIcon
                              className="h-12 w-12 text-gray-500 hover:text-gray-700"
                              style={{
                                borderColor: habit.color,
                                borderWidth: '2px'
                              }}
                            />
                          )}

                          {/* Completion animation overlay */}
                          {habit.completedToday && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>
                            </div>
                          )}
                        </button>

                        {/* Undo button - only show when completed */}
                        {habit.completedToday && (
                          <button
                            onClick={() => handleUndoCompletion(habit)}
                            className="p-2 text-gray-500 hover:text-orange-500 transition-colors rounded-full hover:bg-orange-50"
                            title="Undo completion"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className={viewMode === 'grid' ? 'text-center' : ''}>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-800">{habit.name}</h3>
                          {habit.category && HABIT_CATEGORIES.find(c => c.name === habit.category) && (
                            <span className="text-sm">
                              {HABIT_CATEGORIES.find(c => c.name === habit.category)?.icon}
                            </span>
                          )}
                        </div>

                        {habit.description && viewMode === 'grid' && (
                          <p className="text-sm text-gray-700 mb-2">{habit.description}</p>
                        )}

                        {/* Enhanced streak display */}
                        <div className="flex items-center space-x-4 text-sm">
                          {habit.streak.current_streak > 0 && (
                            <div className="flex items-center space-x-1">
                              <FireSolidIcon className="h-4 w-4 text-orange-500" />
                              <span className="font-medium text-orange-600">
                                {habit.streak.current_streak} days
                              </span>
                            </div>
                          )}

                          {habit.completionRate !== undefined && habit.completionRate > 0 && (
                            <div className="text-gray-700">
                              {habit.completionRate}% rate
                            </div>
                          )}

                          {habit.streak.longest_streak > 0 && habit.streak.longest_streak > habit.streak.current_streak && (
                            <div className="flex items-center space-x-1 text-gray-600">
                              <TrophyIcon className="h-3 w-3" />
                              <span className="text-xs">Best: {habit.streak.longest_streak}</span>
                            </div>
                          )}
                        </div>

                        {/* Difficulty and time indicators */}
                        {viewMode === 'grid' && (
                          <div className="flex items-center justify-center space-x-2 mt-2 text-xs text-gray-600">
                            {habit.difficulty === 'easy' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">Easy</span>}
                            {habit.difficulty === 'medium' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Medium</span>}
                            {habit.difficulty === 'hard' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">Hard</span>}

                            {habit.timeOfDay && habit.timeOfDay !== 'anytime' && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center space-x-1">
                                <ClockIcon className="w-3 h-3" />
                                <span>{TIME_OF_DAY.find(t => t.time === habit.timeOfDay)?.name}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className={`flex items-center space-x-2 ${viewMode === 'grid' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                      <div className="text-right text-xs text-gray-500">
                        <p>{habit.streak.total_completions} total</p>
                      </div>

                      <button
                        onClick={() => setEditingHabit(habit)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit habit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteHabit(habit)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete habit"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar for grid view */}
                  {viewMode === 'grid' && habit.target_frequency > 1 && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                          style={{
                            width: `${habit.completedToday ? 100 : 0}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {habit.completedToday ? 'Completed' : `0/${habit.target_frequency} ${
                          habit.frequency_period
                            ? habit.frequency_period === 'daily' ? 'today' : habit.frequency_period.slice(0, -2)
                            : 'today'
                        }`}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Add/Edit Habit Modal */}
        {(showAddForm || editingHabit) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingHabit ? 'Edit Habit' : 'Create New Habit'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Morning meditation"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newHabit.description}
                    onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="e.g., 10 minutes of mindfulness to start the day"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newHabit.category}
                      onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      {HABIT_CATEGORIES.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time of Day
                    </label>
                    <select
                      value={newHabit.timeOfDay}
                      onChange={(e) => setNewHabit({ ...newHabit, timeOfDay: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      {TIME_OF_DAY.map(time => (
                        <option key={time.time} value={time.time}>{time.icon} {time.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={newHabit.difficulty}
                      onChange={(e) => setNewHabit({ ...newHabit, difficulty: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newHabit.priority}
                      onChange={(e) => setNewHabit({ ...newHabit, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">⭐ High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {HABIT_COLORS.map((colorOption) => (
                      <button
                        key={colorOption.value}
                        onClick={() => setNewHabit({ ...newHabit, color: colorOption })}
                        className={`relative h-12 rounded-lg border-2 transition-all ${
                          newHabit.color.value === colorOption.value
                            ? 'border-gray-800 scale-105 shadow-lg'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: colorOption.value }}
                        title={colorOption.name}
                      >
                        {newHabit.color.value === colorOption.value && (
                          <CheckCircleSolidIcon className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency Target
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Times</label>
                      <select
                        value={newHabit.target_frequency}
                        onChange={(e) => setNewHabit({ ...newHabit, target_frequency: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        {[...Array(20)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Period</label>
                      <select
                        value={newHabit.frequency_period}
                        onChange={(e) => setNewHabit({ ...newHabit, frequency_period: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Target: {newHabit.target_frequency} time{newHabit.target_frequency > 1 ? 's' : ''} per {newHabit.frequency_period.slice(0, -2)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateHabit}
                  disabled={!newHabit.name.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}