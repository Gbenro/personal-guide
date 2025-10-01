// Enhanced stub for habit service with localStorage persistence
// TODO: Replace with full PostgreSQL implementation

// Simple in-memory storage with localStorage persistence
class HabitStorage {
  private static HABITS_KEY = 'pg_user_habits'
  private static COMPLETIONS_KEY = 'pg_habit_completions'

  static getHabits(userId: string): Habit[] {
    try {
      const habits = localStorage.getItem(`${this.HABITS_KEY}_${userId}`)
      return habits ? JSON.parse(habits) : []
    } catch (error) {
      console.warn('Failed to load habits from localStorage:', error)
      return []
    }
  }

  static saveHabits(userId: string, habits: Habit[]): void {
    try {
      localStorage.setItem(`${this.HABITS_KEY}_${userId}`, JSON.stringify(habits))
    } catch (error) {
      console.warn('Failed to save habits to localStorage:', error)
    }
  }

  static getCompletions(userId: string): HabitCompletion[] {
    try {
      const completions = localStorage.getItem(`${this.COMPLETIONS_KEY}_${userId}`)
      return completions ? JSON.parse(completions) : []
    } catch (error) {
      console.warn('Failed to load completions from localStorage:', error)
      return []
    }
  }

  static saveCompletions(userId: string, completions: HabitCompletion[]): void {
    try {
      localStorage.setItem(`${this.COMPLETIONS_KEY}_${userId}`, JSON.stringify(completions))
    } catch (error) {
      console.warn('Failed to save completions to localStorage:', error)
    }
  }
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description?: string
  color?: string
  target_frequency?: number
  created_at: string
  updated_at: string
  archived_at?: string
}

export interface HabitCompletion {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes?: string
}

// Stub functions that return empty results
export async function getUserHabits(userId: string): Promise<Habit[]> {
  console.log('🔥 [ENHANCED STUB - FORCE UPDATE] getUserHabits called for userId:', userId)

  if (typeof window === 'undefined') {
    console.log('Server-side, returning empty array')
    return []
  }

  const habits = HabitStorage.getHabits(userId)
  console.log(`Found ${habits.length} habits for user`)
  return habits
}

export async function getTodayCompletions(userId: string): Promise<HabitCompletion[]> {
  console.log('✅ [ENHANCED STUB] getTodayCompletions called for userId:', userId)

  if (typeof window === 'undefined') {
    return []
  }

  const allCompletions = HabitStorage.getCompletions(userId)
  const today = new Date().toISOString().split('T')[0]

  const todayCompletions = allCompletions.filter(completion =>
    completion.completed_at.startsWith(today)
  )

  console.log(`Found ${todayCompletions.length} completions for today`)
  return todayCompletions
}

// Single habit creation
export async function createHabit(
  userId: string,
  name: string,
  description?: string,
  color?: string,
  targetFrequency?: number,
  frequencyPeriod?: 'daily' | 'weekly' | 'monthly'
): Promise<Habit | null> {
  console.log('🔥 [ENHANCED STUB - FORCE UPDATE] createHabit called with:', { userId, name, description, color })

  if (typeof window === 'undefined') {
    console.log('Server-side, cannot create habit')
    return null
  }

  const newHabit: Habit = {
    id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    name,
    description: description || '',
    color: color || '#3B82F6',
    target_frequency: targetFrequency || 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: undefined
  }

  const existingHabits = HabitStorage.getHabits(userId)
  const updatedHabits = [...existingHabits, newHabit]
  HabitStorage.saveHabits(userId, updatedHabits)

  console.log('✅ Created new habit:', newHabit)
  return newHabit
}

// Batch habit creation
export async function createHabits(
  userId: string,
  habits: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]
): Promise<Habit[]> {
  console.log('Create habits batch stub called - not implemented yet')
  return []
}

export async function completeHabit(habitId: string, userId: string, notes?: string): Promise<HabitCompletion | null> {
  console.log('✅ [ENHANCED STUB] completeHabit called with:', { habitId, userId, notes })

  if (typeof window === 'undefined') {
    return null
  }

  const completion: HabitCompletion = {
    id: `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    habit_id: habitId,
    user_id: userId,
    completed_at: new Date().toISOString(),
    notes: notes || undefined
  }

  const existingCompletions = HabitStorage.getCompletions(userId)
  const updatedCompletions = [...existingCompletions, completion]
  HabitStorage.saveCompletions(userId, updatedCompletions)

  console.log('✅ Created habit completion:', completion)
  return completion
}

// Singular version for single habit updates
export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<Habit | null> {
  console.log('Update habit stub called - not implemented yet')
  return null
}

// Plural version for batch updates
export async function updateHabits(habitUpdates: { id: string; updates: Partial<Habit> }[]): Promise<boolean> {
  console.log('Update habits batch stub called - not implemented yet')
  return false
}

// Missing function exports
export async function getHabitById(habitId: string, userId: string): Promise<Habit | null> {
  console.log('Get habit by ID stub called - not implemented yet')
  return null
}

export async function archiveHabit(habitId: string): Promise<boolean> {
  console.log('Archive habit stub called - not implemented yet')
  return false
}

export async function deleteHabitPermanently(habitId: string): Promise<boolean> {
  console.log('Delete habit permanently stub called - not implemented yet')
  return false
}

export async function getArchivedHabits(userId: string): Promise<Habit[]> {
  console.log('Get archived habits stub called - not implemented yet')
  return []
}

export async function restoreHabit(habitId: string): Promise<boolean> {
  console.log('Restore habit stub called - not implemented yet')
  return false
}

export async function searchHabits(userId: string, filters: HabitSearchFilters = {}): Promise<Habit[]> {
  console.log('Search habits stub called - not implemented yet')
  return []
}

export async function archiveHabits(habitIds: string[]): Promise<boolean> {
  console.log('Archive habits batch stub called - not implemented yet')
  return false
}

export async function getHabitStats(userId: string): Promise<HabitStats | null> {
  console.log('🔥 [ENHANCED STUB - FORCE UPDATE] getHabitStats called for userId:', userId)

  if (typeof window === 'undefined') {
    return null
  }

  const habits = HabitStorage.getHabits(userId)
  const completions = HabitStorage.getCompletions(userId)

  // Calculate today's completions
  const today = new Date().toISOString().split('T')[0]
  const todayCompletions = completions.filter(c => c.completed_at.startsWith(today))

  // Calculate basic stats
  const stats: HabitStats = {
    totalHabits: habits.length,
    activeHabits: habits.filter(h => !h.archived_at).length,
    archivedHabits: habits.filter(h => h.archived_at).length,
    totalCompletions: completions.length,
    todayCompletions: todayCompletions.length,
    streakCount: calculateCurrentStreak(completions)
  }

  console.log('✅ Calculated habit stats:', stats)
  return stats
}

// Helper function to calculate current streak
function calculateCurrentStreak(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0

  const sortedCompletions = completions
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sortedCompletions.length; i++) {
    const completionDate = new Date(sortedCompletions[i].completed_at)
    completionDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - streak)

    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export async function undoHabitCompletion(habitId: string, userId: string): Promise<boolean> {
  console.log('Undo habit completion stub called - not implemented yet')
  return false
}

export async function calculateStreak(habitId: string, userId: string): Promise<HabitStreak | null> {
  console.log('🔥 [ENHANCED STUB] calculateStreak called with:', { habitId, userId })

  if (typeof window === 'undefined') {
    return null
  }

  try {
    // Get all completions for this specific habit
    const allCompletions = HabitStorage.getCompletions(userId)
    const habitCompletions = allCompletions.filter(c => c.habit_id === habitId)

    if (habitCompletions.length === 0) {
      return {
        habit_id: habitId,
        current_streak: 0,
        longest_streak: 0,
        last_completed: null,
        total_completions: 0,
        weekly_streak: 0,
        monthly_streak: 0,
        streak_percentage: 0,
        days_since_start: 0,
        completion_rate: 0,
        is_at_risk: false,
        next_milestone: 7,
        streak_health: 'critical'
      }
    }

    // Normalize dates to start of day for accurate comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Convert completion dates to normalized timestamps and sort
    const completionDates = habitCompletions.map(completion => {
      const date = new Date(completion.completed_at)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    }).sort((a, b) => b - a) // Most recent first

    // Remove duplicates (multiple completions on same day count as one)
    const uniqueCompletionDates = [...new Set(completionDates)]

    const lastCompleted = new Date(uniqueCompletionDates[0])
    const daysSinceLastCompletion = Math.floor(
      (today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate current streak
    let currentStreak = 0

    // Current streak logic: must be completed today or yesterday to maintain
    if (daysSinceLastCompletion <= 1) {
      currentStreak = 1

      // Count consecutive days backwards from the most recent completion
      let checkDate = lastCompleted.getTime()
      for (let i = 1; i < uniqueCompletionDates.length; i++) {
        const prevDate = uniqueCompletionDates[i]
        const expectedPrevDate = checkDate - (24 * 60 * 60 * 1000) // Previous day

        if (prevDate === expectedPrevDate) {
          currentStreak++
          checkDate = prevDate
        } else {
          break // Streak broken
        }
      }
    }

    // Calculate longest streak by finding the longest consecutive sequence
    let longestStreak = 0
    let tempStreak = 1

    for (let i = 0; i < uniqueCompletionDates.length - 1; i++) {
      const currentDate = uniqueCompletionDates[i]
      const nextDate = uniqueCompletionDates[i + 1]
      const dayDiff = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24))

      if (dayDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak) // Don't forget the last streak

    // Calculate additional metrics
    const isAtRisk = daysSinceLastCompletion >= 2 && currentStreak > 0
    const nextMilestone = currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : currentStreak + 100

    let streakHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'critical'
    if (currentStreak >= 30) streakHealth = 'excellent'
    else if (currentStreak >= 7) streakHealth = 'good'
    else if (currentStreak >= 3) streakHealth = 'warning'

    const result: HabitStreak = {
      habit_id: habitId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed: lastCompleted,
      total_completions: habitCompletions.length,
      is_at_risk: isAtRisk,
      next_milestone: nextMilestone,
      streak_health: streakHealth
    }

    console.log('✅ [ENHANCED STUB] Calculated streak:', result)
    return result

  } catch (error) {
    console.error('Error calculating streak:', error)
    return null
  }
}

export async function getHabitCompletionsRange(
  habitId: string,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  console.log('🔥 [ENHANCED STUB] getHabitCompletionsRange called with:', { habitId, userId, startDate, endDate })

  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const allCompletions = HabitStorage.getCompletions(userId)
    const habitCompletions = allCompletions.filter(c => c.habit_id === habitId)

    // Create a map of date strings to completion counts
    const completionMap: Record<string, number> = {}

    // Initialize all dates in range to 0
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      completionMap[dateStr] = 0
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Count completions for each date
    habitCompletions.forEach(completion => {
      const completionDate = new Date(completion.completed_at)
      const dateStr = completionDate.toISOString().split('T')[0]

      if (completionDate >= startDate && completionDate <= endDate) {
        completionMap[dateStr] = (completionMap[dateStr] || 0) + 1
      }
    })

    console.log('✅ [ENHANCED STUB] Calculated completion range:', completionMap)
    return completionMap

  } catch (error) {
    console.error('Error getting habit completions range:', error)
    return {}
  }
}

export async function getHabitInsights(habitId: string, userId: string): Promise<any> {
  console.log('Get habit insights stub called - not implemented yet')
  return null
}

export async function getHabitContextAnalytics(userId: string): Promise<any> {
  console.log('Get habit context analytics stub called - not implemented yet')
  return null
}

export async function getStreakAnalytics(habitId: string, userId: string): Promise<StreakAnalytics> {
  console.log('Get streak analytics stub called - not implemented yet')
  return {
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    totalCompletions: 0
  }
}

// Type definitions and interfaces
export interface HabitEntry {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes?: string
}

export interface HabitStreak {
  habit_id: string
  current_streak: number
  longest_streak: number
  last_completed: Date | null
  total_completions: number
  // Enhanced streak data
  weekly_streak?: number
  monthly_streak?: number
  streak_percentage?: number
  days_since_start?: number
  completion_rate?: number
  is_at_risk?: boolean
  next_milestone?: number
  streak_health?: 'excellent' | 'good' | 'warning' | 'critical'
}

export interface HabitSearchFilters {
  archived?: boolean
  color?: string
  name?: string
}

export interface HabitStats {
  totalHabits: number
  activeHabits: number
  archivedHabits: number
  totalCompletions: number
  todayCompletions: number
  streakCount: number
}

export interface StreakAnalytics {
  currentStreak: number
  longestStreak: number
  completionRate: number
  totalCompletions: number
}

export async function getHabitStreakAnalytics(habitId: string): Promise<StreakAnalytics> {
  console.log('Habit analytics stub called - returning empty analytics')
  return {
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    totalCompletions: 0
  }
}

// Real-time subscription stubs
export const realtimeService = {
  subscribe: (channel: string, callback: Function) => {
    console.log(`Real-time subscription stub for ${channel} - not implemented yet`)
    return { unsubscribe: () => {} }
  }
}