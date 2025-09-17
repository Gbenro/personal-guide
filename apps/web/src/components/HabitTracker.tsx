'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, CheckCircleIcon, FireIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserHabits,
  createHabit,
  completeHabit,
  getTodayCompletions,
  calculateStreak,
  archiveHabit,
  type Habit,
  type HabitEntry,
  type HabitStreak
} from '@/lib/habitService'

const HABIT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
]

interface HabitWithStatus extends Habit {
  completedToday: boolean
  streak: HabitStreak
}

export default function HabitTracker() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const [todayCompletions, setTodayCompletions] = useState<HabitEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    color: HABIT_COLORS[0],
    target_frequency: 1
  })

  // Load habits and today's completions
  useEffect(() => {
    async function loadHabits() {
      if (!user) return

      setIsLoading(true)
      try {
        const [userHabits, completions] = await Promise.all([
          getUserHabits(user.id),
          getTodayCompletions(user.id)
        ])

        // Calculate streaks for each habit
        const habitsWithStatus = await Promise.all(
          userHabits.map(async (habit) => {
            const streak = await calculateStreak(habit.id, user.id)
            const completedToday = completions.some(c => c.habit_id === habit.id)
            return {
              ...habit,
              completedToday,
              streak
            }
          })
        )

        setHabits(habitsWithStatus)
        setTodayCompletions(completions)
      } catch (error) {
        console.error('Error loading habits:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHabits()
  }, [user])

  // Handle habit creation
  const handleCreateHabit = async () => {
    if (!user || !newHabit.name.trim()) return

    const habit = await createHabit(
      user.id,
      newHabit.name,
      newHabit.description,
      newHabit.color,
      newHabit.target_frequency
    )

    if (habit) {
      const habitWithStatus: HabitWithStatus = {
        ...habit,
        completedToday: false,
        streak: {
          habit_id: habit.id,
          current_streak: 0,
          longest_streak: 0,
          last_completed: null,
          total_completions: 0
        }
      }
      setHabits([...habits, habitWithStatus])
      setNewHabit({
        name: '',
        description: '',
        color: HABIT_COLORS[0],
        target_frequency: 1
      })
      setShowAddForm(false)
    }
  }

  // Handle habit completion toggle
  const handleToggleCompletion = async (habit: HabitWithStatus) => {
    if (!user) return

    if (!habit.completedToday) {
      const entry = await completeHabit(habit.id, user.id)
      if (entry) {
        setTodayCompletions([...todayCompletions, entry])
        const updatedStreak = await calculateStreak(habit.id, user.id)
        setHabits(habits.map(h => 
          h.id === habit.id 
            ? { ...h, completedToday: true, streak: updatedStreak }
            : h
        ))
      }
    }
  }

  // Handle habit deletion
  const handleDeleteHabit = async (habitId: string) => {
    const success = await archiveHabit(habitId)
    if (success) {
      setHabits(habits.filter(h => h.id !== habitId))
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded-lg"></div>
            <div className="h-16 bg-gray-100 rounded-lg"></div>
            <div className="h-16 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Daily Habits</h2>
            <p className="text-sm text-gray-500 mt-1">
              Track your progress and build streaks
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            title="Add new habit"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Habits List */}
      <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
        {habits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No habits yet. Create your first habit!</p>
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                habit.completedToday
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleCompletion(habit)}
                    className="transition-transform hover:scale-110"
                  >
                    {habit.completedToday ? (
                      <CheckCircleSolidIcon 
                        className="h-8 w-8 text-green-500"
                        style={{ color: habit.color }}
                      />
                    ) : (
                      <CheckCircleIcon 
                        className="h-8 w-8 text-gray-400 hover:text-gray-600"
                      />
                    )}
                  </button>
                  
                  <div>
                    <h3 className="font-medium text-gray-800">{habit.name}</h3>
                    {habit.description && (
                      <p className="text-sm text-gray-500">{habit.description}</p>
                    )}
                    
                    {/* Streak Display */}
                    {habit.streak.current_streak > 0 && (
                      <div className="flex items-center space-x-2 mt-1">
                        <FireIcon className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-600">
                          {habit.streak.current_streak} day streak
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Progress indicator */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {habit.streak.total_completions} total
                    </p>
                    {habit.streak.longest_streak > 0 && (
                      <p className="text-xs text-gray-500">
                        Best: {habit.streak.longest_streak} days
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete habit"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Habit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-semibold mb-4">Create New Habit</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Morning meditation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="e.g., 10 minutes of mindfulness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewHabit({ ...newHabit, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newHabit.color === color
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Target
                </label>
                <select
                  value={newHabit.target_frequency}
                  onChange={(e) => setNewHabit({ ...newHabit, target_frequency: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value={1}>Once per day</option>
                  <option value={2}>Twice per day</option>
                  <option value={3}>3 times per day</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewHabit({
                    name: '',
                    description: '',
                    color: HABIT_COLORS[0],
                    target_frequency: 1
                  })
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHabit}
                disabled={!newHabit.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}