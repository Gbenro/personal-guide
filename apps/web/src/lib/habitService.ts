import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface Habit {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  target_frequency: number // times per period
  frequency_period?: 'daily' | 'weekly' | 'monthly' // default to daily for backward compatibility
  created_at: string
  updated_at: string
  archived_at?: string
}

export interface HabitEntry {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes?: string
  created_at: string
  // Context tracking for AI insights
  context?: HabitContext
}

export interface HabitContext {
  // Environmental context
  location?: 'home' | 'work' | 'gym' | 'outdoors' | 'travel' | 'other'
  time_of_day?: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night'
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'other'

  // Emotional/Physical context
  mood_before?: 1 | 2 | 3 | 4 | 5 // 1=very bad, 5=very good
  mood_after?: 1 | 2 | 3 | 4 | 5
  energy_level?: 1 | 2 | 3 | 4 | 5 // 1=very low, 5=very high
  stress_level?: 1 | 2 | 3 | 4 | 5 // 1=very low, 5=very high

  // Social context
  social_setting?: 'alone' | 'with_family' | 'with_friends' | 'with_colleagues' | 'in_group' | 'other'

  // Performance metrics
  completion_time_minutes?: number
  difficulty_rating?: 1 | 2 | 3 | 4 | 5 // 1=very easy, 5=very hard
  satisfaction_rating?: 1 | 2 | 3 | 4 | 5 // 1=not satisfied, 5=very satisfied

  // Behavioral context
  interruptions?: number
  motivation_source?: 'internal' | 'external_reminder' | 'peer_pressure' | 'habit_stack' | 'other'
  completion_method?: 'full' | 'partial' | 'modified' | 'minimum_viable'

  // Environmental factors
  distractions_present?: boolean
  optimal_conditions?: boolean

  // Tags for flexible categorization
  tags?: string[]
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

export interface StreakAnalytics {
  habit_id: string
  completion_pattern: 'consistent' | 'irregular' | 'weekend_warrior' | 'workday_focused'
  best_day_of_week: string
  worst_day_of_week: string
  average_gap_days: number
  recent_trend: 'improving' | 'stable' | 'declining'
  recommended_actions: string[]
}

// Get all active habits for a user
export async function getUserHabits(userId: string): Promise<Habit[]> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching habits:', error)
      return []
    }

    return (data as Habit[]) || []
  } catch (error) {
    console.error('Error in getUserHabits:', error)
    return []
  }
}

// Create a new habit
export async function createHabit(
  userId: string,
  name: string,
  description?: string,
  color: string = '#3B82F6',
  targetFrequency: number = 1,
  frequencyPeriod: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<Habit | null> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name,
        description,
        color,
        target_frequency: targetFrequency,
        frequency_period: frequencyPeriod
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating habit:', error)
      return null
    }

    return data as Habit
  } catch (error) {
    console.error('Error in createHabit:', error)
    return null
  }
}

// Update a habit
export async function updateHabit(
  habitId: string,
  updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at'>>
): Promise<Habit | null> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', habitId)
      .select()
      .single()

    if (error) {
      console.error('Error updating habit:', error)
      return null
    }

    return data as Habit
  } catch (error) {
    console.error('Error in updateHabit:', error)
    return null
  }
}

// Archive a habit (soft delete)
export async function archiveHabit(habitId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habits')
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', habitId)

    if (error) {
      console.error('Error archiving habit:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in archiveHabit:', error)
    return false
  }
}

// Record a habit completion with optional context
export async function completeHabit(
  habitId: string,
  userId: string,
  notes?: string,
  context?: HabitContext
): Promise<HabitEntry | null> {
  try {
    const completionData = {
      habit_id: habitId,
      user_id: userId,
      completed_at: new Date().toISOString(),
      notes,
      ...(context && { context: JSON.stringify(context) })
    }

    const { data, error } = await supabase
      .from('habit_completions')
      .insert(completionData)
      .select()
      .single()

    if (error) {
      console.error('Error completing habit:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    // Parse context back to object if it exists
    const entry = data as any
    if (entry.context) {
      try {
        entry.context = JSON.parse(entry.context)
      } catch (parseError) {
        console.warn('Failed to parse habit context:', parseError)
        entry.context = undefined
      }
    }

    return entry as HabitEntry
  } catch (error) {
    console.error('Error in completeHabit:', error)
    return null
  }
}

// Undo a habit completion (remove today's completion)
export async function undoHabitCompletion(
  habitId: string,
  userId: string
): Promise<boolean> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString())

    if (error) {
      console.error('Error undoing habit completion:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return false
    }

    return true
  } catch (error) {
    console.error('Error in undoHabitCompletion:', error)
    return false
  }
}

// Get today's completions for all habits
export async function getTodayCompletions(userId: string): Promise<HabitEntry[]> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString())

    if (error) {
      console.error('Error fetching today\'s completions:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return []
    }

    return (data as HabitEntry[]) || []
  } catch (error) {
    console.error('Error in getTodayCompletions:', error)
    return []
  }
}

// Calculate streak for a habit
export async function calculateStreak(
  habitId: string,
  userId: string
): Promise<HabitStreak> {
  try {
    // Get habit info and completions
    const [habitResponse, completionsResponse] = await Promise.all([
      supabase
        .from('habits')
        .select('created_at, target_frequency, frequency_period')
        .eq('id', habitId)
        .eq('user_id', userId)
        .single(),
      supabase
        .from('habit_completions')
        .select('completed_at')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
    ])

    if (completionsResponse.error || !completionsResponse.data || completionsResponse.data.length === 0) {
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

    const entries = completionsResponse.data as { completed_at: string }[]
    const habit = habitResponse.data
    const habitCreated = habit ? new Date(habit.created_at) : new Date()

    // Normalize dates to start of day for accurate comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastCompleted = new Date(entries[0].completed_at)
    const lastCompletedDate = new Date(lastCompleted)
    lastCompletedDate.setHours(0, 0, 0, 0)

    // Convert completion dates to normalized day strings for easier processing
    const completionDates = entries.map(entry => {
      const date = new Date(entry.completed_at)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    }).sort((a, b) => b - a) // Most recent first

    // Remove duplicates (multiple completions on same day count as one)
    const uniqueCompletionDates = [...new Set(completionDates)]

    // Calculate current streak
    let currentStreak = 0
    const daysSinceLastCompletion = Math.floor(
      (today.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Current streak logic: must be completed today or yesterday to maintain
    if (daysSinceLastCompletion <= 1) {
      currentStreak = 1

      // Count consecutive days backwards from the most recent completion
      let checkDate = lastCompletedDate.getTime()
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
    longestStreak = Math.max(longestStreak, tempStreak)

    // Calculate enhanced metrics
    const daysSinceStart = Math.floor(
      (today.getTime() - habitCreated.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Weekly and monthly streaks
    const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
    const monthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))

    const weeklyCompletions = uniqueCompletionDates.filter(date => date >= weekAgo.getTime()).length
    const monthlyCompletions = uniqueCompletionDates.filter(date => date >= monthAgo.getTime()).length

    // Calculate completion rate
    const expectedDays = Math.max(1, daysSinceStart + 1)
    const completionRate = (uniqueCompletionDates.length / expectedDays) * 100

    // Determine if at risk (no completion in 2+ days)
    const isAtRisk = daysSinceLastCompletion >= 2

    // Calculate next milestone
    const milestones = [7, 14, 21, 30, 50, 75, 100, 200, 365]
    const nextMilestone = milestones.find(m => m > currentStreak) || (Math.ceil((currentStreak + 1) / 100) * 100)

    // Determine streak health
    let streakHealth: 'excellent' | 'good' | 'warning' | 'critical'
    if (completionRate >= 80) streakHealth = 'excellent'
    else if (completionRate >= 60) streakHealth = 'good'
    else if (completionRate >= 40) streakHealth = 'warning'
    else streakHealth = 'critical'

    // Calculate streak percentage (how much of the longest streak is the current streak)
    const streakPercentage = longestStreak > 0 ? (currentStreak / longestStreak) * 100 : 0

    return {
      habit_id: habitId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed: lastCompleted,
      total_completions: entries.length,
      weekly_streak: weeklyCompletions,
      monthly_streak: monthlyCompletions,
      streak_percentage: Math.round(streakPercentage),
      days_since_start: daysSinceStart,
      completion_rate: Math.round(completionRate),
      is_at_risk: isAtRisk,
      next_milestone: nextMilestone,
      streak_health: streakHealth
    }
  } catch (error) {
    console.error('Error calculating streak:', error)
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
      is_at_risk: true,
      next_milestone: 7,
      streak_health: 'critical'
    }
  }
}

// Get detailed streak analytics for a habit
export async function getStreakAnalytics(
  habitId: string,
  userId: string
): Promise<StreakAnalytics> {
  try {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('completed_at')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(90) // Last 90 days for analysis

    if (error || !data || data.length === 0) {
      return {
        habit_id: habitId,
        completion_pattern: 'irregular',
        best_day_of_week: 'Monday',
        worst_day_of_week: 'Sunday',
        average_gap_days: 0,
        recent_trend: 'stable',
        recommended_actions: ['Start by completing the habit today to begin building momentum']
      }
    }

    const entries = data as { completed_at: string }[]

    // Analyze day of week patterns
    const dayOfWeekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    entries.forEach(entry => {
      const day = new Date(entry.completed_at).getDay()
      dayOfWeekCounts[day]++
    })

    const bestDay = Object.entries(dayOfWeekCounts).reduce((a, b) =>
      dayOfWeekCounts[a[0]] > dayOfWeekCounts[b[0]] ? a : b
    )[0]

    const worstDay = Object.entries(dayOfWeekCounts).reduce((a, b) =>
      dayOfWeekCounts[a[0]] < dayOfWeekCounts[b[0]] ? a : b
    )[0]

    // Analyze gaps between completions
    const gaps = []
    for (let i = 0; i < entries.length - 1; i++) {
      const current = new Date(entries[i].completed_at)
      const next = new Date(entries[i + 1].completed_at)
      const gap = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
      gaps.push(gap)
    }

    const averageGap = gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0

    // Determine completion pattern
    let completionPattern: 'consistent' | 'irregular' | 'weekend_warrior' | 'workday_focused'
    const weekendCompletions = dayOfWeekCounts[0] + dayOfWeekCounts[6]
    const weekdayCompletions = dayOfWeekCounts[1] + dayOfWeekCounts[2] + dayOfWeekCounts[3] + dayOfWeekCounts[4] + dayOfWeekCounts[5]

    if (averageGap <= 1.5) {
      completionPattern = 'consistent'
    } else if (weekendCompletions > weekdayCompletions * 0.5) {
      completionPattern = 'weekend_warrior'
    } else if (weekdayCompletions > weekendCompletions * 1.5) {
      completionPattern = 'workday_focused'
    } else {
      completionPattern = 'irregular'
    }

    // Analyze recent trend (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const recentCompletions = entries.filter(entry =>
      new Date(entry.completed_at) >= thirtyDaysAgo
    ).length

    const previousCompletions = entries.filter(entry => {
      const date = new Date(entry.completed_at)
      return date >= sixtyDaysAgo && date < thirtyDaysAgo
    }).length

    let recentTrend: 'improving' | 'stable' | 'declining'
    if (recentCompletions > previousCompletions * 1.1) {
      recentTrend = 'improving'
    } else if (recentCompletions < previousCompletions * 0.9) {
      recentTrend = 'declining'
    } else {
      recentTrend = 'stable'
    }

    // Generate recommendations
    const recommendations = []

    if (completionPattern === 'irregular') {
      recommendations.push('Try setting a specific time each day for this habit')
    }

    if (averageGap > 2) {
      recommendations.push('Focus on reducing gaps between completions - consistency beats perfection')
    }

    if (recentTrend === 'declining') {
      recommendations.push('Your recent performance is declining - consider adjusting your approach or reducing difficulty')
    }

    if (dayOfWeekCounts[parseInt(worstDay)] === 0) {
      recommendations.push(`${dayNames[parseInt(worstDay)]}s seem challenging for you - try planning ahead for this day`)
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job maintaining this habit! Keep up the excellent work.')
    }

    return {
      habit_id: habitId,
      completion_pattern: completionPattern,
      best_day_of_week: dayNames[parseInt(bestDay)],
      worst_day_of_week: dayNames[parseInt(worstDay)],
      average_gap_days: Math.round(averageGap * 10) / 10,
      recent_trend: recentTrend,
      recommended_actions: recommendations
    }
  } catch (error) {
    console.error('Error calculating streak analytics:', error)
    return {
      habit_id: habitId,
      completion_pattern: 'irregular',
      best_day_of_week: 'Monday',
      worst_day_of_week: 'Sunday',
      average_gap_days: 0,
      recent_trend: 'stable',
      recommended_actions: ['Unable to analyze patterns - please continue tracking your habit']
    }
  }
}

// Get habit completions for a date range (for heatmap)
export async function getHabitCompletionsRange(
  habitId: string,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ [date: string]: number }> {
  try {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('completed_at')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())

    if (error) {
      console.error('Error fetching habit completions range:', error)
      return {}
    }

    const completions: { [date: string]: number } = {}

    if (data) {
      data.forEach((entry: { completed_at: string }) => {
        const date = new Date(entry.completed_at).toISOString().split('T')[0]
        completions[date] = (completions[date] || 0) + 1
      })
    }

    return completions
  } catch (error) {
    console.error('Error in getHabitCompletionsRange:', error)
    return {}
  }
}

// Get a single habit by ID
export async function getHabitById(habitId: string, userId: string): Promise<Habit | null> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching habit by ID:', error)
      return null
    }

    return data as Habit
  } catch (error) {
    console.error('Error in getHabitById:', error)
    return null
  }
}

// Get all archived habits for a user
export async function getArchivedHabits(userId: string): Promise<Habit[]> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })

    if (error) {
      console.error('Error fetching archived habits:', error)
      return []
    }

    return (data as Habit[]) || []
  } catch (error) {
    console.error('Error in getArchivedHabits:', error)
    return []
  }
}

// Restore an archived habit
export async function restoreHabit(habitId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habits')
      .update({
        archived_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', habitId)

    if (error) {
      console.error('Error restoring habit:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in restoreHabit:', error)
    return false
  }
}

// Delete a habit (alias for archiveHabit for compatibility)
export async function deleteHabit(habitId: string): Promise<boolean> {
  return await archiveHabit(habitId)
}

// Toggle habit completion (mark as complete if not done today, undo if already done)
export async function toggleHabitCompletion(habitId: string, userId: string): Promise<boolean> {
  try {
    // Check if habit was already completed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: existingCompletion, error: checkError } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString())
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing completion:', checkError)
      return false
    }

    if (existingCompletion) {
      // Already completed today, so undo it
      return await undoHabitCompletion(habitId, userId)
    } else {
      // Not completed today, so complete it
      const result = await completeHabit(habitId, userId)
      return result !== null
    }
  } catch (error) {
    console.error('Error in toggleHabitCompletion:', error)
    return false
  }
}

// Hard delete a habit (permanent removal)
export async function deleteHabitPermanently(habitId: string): Promise<boolean> {
  try {
    // First delete all completions for this habit
    const { error: completionsError } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)

    if (completionsError) {
      console.error('Error deleting habit completions:', completionsError)
      return false
    }

    // Then delete the habit itself
    const { error: habitError } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)

    if (habitError) {
      console.error('Error deleting habit:', habitError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteHabitPermanently:', error)
    return false
  }
}

// Search habits with filters
export interface HabitSearchFilters {
  query?: string
  category?: string
  frequency_period?: 'daily' | 'weekly' | 'monthly'
  created_after?: Date
  created_before?: Date
  include_archived?: boolean
}

export async function searchHabits(
  userId: string,
  filters: HabitSearchFilters = {}
): Promise<Habit[]> {
  try {
    let query = supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)

    // Apply filters
    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
    }

    if (filters.frequency_period) {
      query = query.eq('frequency_period', filters.frequency_period)
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after.toISOString())
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before.toISOString())
    }

    if (!filters.include_archived) {
      query = query.is('archived_at', null)
    }

    query = query.order('created_at', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Error searching habits:', error)
      return []
    }

    return (data as Habit[]) || []
  } catch (error) {
    console.error('Error in searchHabits:', error)
    return []
  }
}

// Bulk create habits
export async function createHabits(userId: string, habits: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]): Promise<Habit[]> {
  try {
    const habitsToInsert = habits.map(habit => ({
      ...habit,
      user_id: userId,
      target_frequency: habit.target_frequency || 1,
      frequency_period: habit.frequency_period || 'daily',
      color: habit.color || '#3B82F6'
    }))

    const { data, error } = await supabase
      .from('habits')
      .insert(habitsToInsert)
      .select()

    if (error) {
      console.error('Error creating habits in bulk:', error)
      return []
    }

    return (data as Habit[]) || []
  } catch (error) {
    console.error('Error in createHabits:', error)
    return []
  }
}

// Bulk update habits
export async function updateHabits(habitUpdates: { id: string, updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at'>> }[]): Promise<boolean> {
  try {
    const updatePromises = habitUpdates.map(({ id, updates }) =>
      supabase
        .from('habits')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    )

    const results = await Promise.all(updatePromises)

    // Check if any updates failed
    const hasErrors = results.some(result => result.error)
    if (hasErrors) {
      console.error('Some habit updates failed:', results.filter(r => r.error))
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateHabits:', error)
    return false
  }
}

// Bulk archive habits
export async function archiveHabits(habitIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habits')
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', habitIds)

    if (error) {
      console.error('Error archiving habits in bulk:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in archiveHabits:', error)
    return false
  }
}

// Get habit statistics
export interface HabitStats {
  total_habits: number
  active_habits: number
  archived_habits: number
  total_completions: number
  completion_rate_today: number
  completion_rate_week: number
  completion_rate_month: number
  longest_streak: number
  current_active_streaks: number
}

export async function getHabitStats(userId: string): Promise<HabitStats> {
  try {
    // Get all habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)

    if (habitsError) {
      console.error('Error fetching habits for stats:', habitsError)
      throw habitsError
    }

    const allHabits = habits || []
    const activeHabits = allHabits.filter(h => !h.archived_at)
    const archivedHabits = allHabits.filter(h => h.archived_at)

    // Get all completions
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)

    if (completionsError) {
      console.error('Error fetching completions for stats:', completionsError)
      throw completionsError
    }

    const allCompletions = completions || []

    // Calculate time-based completion rates
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(todayStart)
    monthStart.setDate(monthStart.getDate() - 30)

    const todayCompletions = allCompletions.filter(c =>
      new Date(c.completed_at) >= todayStart
    ).length

    const weekCompletions = allCompletions.filter(c =>
      new Date(c.completed_at) >= weekStart
    ).length

    const monthCompletions = allCompletions.filter(c =>
      new Date(c.completed_at) >= monthStart
    ).length

    // Calculate completion rates
    const activeHabitsCount = activeHabits.length
    const completionRateToday = activeHabitsCount > 0 ? (todayCompletions / activeHabitsCount) * 100 : 0
    const completionRateWeek = activeHabitsCount > 0 ? (weekCompletions / (activeHabitsCount * 7)) * 100 : 0
    const completionRateMonth = activeHabitsCount > 0 ? (monthCompletions / (activeHabitsCount * 30)) * 100 : 0

    // Calculate streaks (simplified - would need more complex logic for accurate streaks)
    const longestStreak = allCompletions.length > 0 ? Math.max(...activeHabits.map(h => {
      const habitCompletions = allCompletions.filter(c => c.habit_id === h.id)
      return habitCompletions.length // Simplified - should calculate actual consecutive days
    })) : 0

    return {
      total_habits: allHabits.length,
      active_habits: activeHabits.length,
      archived_habits: archivedHabits.length,
      total_completions: allCompletions.length,
      completion_rate_today: Math.round(completionRateToday),
      completion_rate_week: Math.round(completionRateWeek),
      completion_rate_month: Math.round(completionRateMonth),
      longest_streak: longestStreak,
      current_active_streaks: activeHabits.length // Simplified
    }
  } catch (error) {
    console.error('Error in getHabitStats:', error)
    return {
      total_habits: 0,
      active_habits: 0,
      archived_habits: 0,
      total_completions: 0,
      completion_rate_today: 0,
      completion_rate_week: 0,
      completion_rate_month: 0,
      longest_streak: 0,
      current_active_streaks: 0
    }
  }
}

// Context Analytics Functions for AI Insights

/**
 * Analyze habit patterns and context to generate insights
 */
export async function getHabitInsights(habitId: string, userId: string): Promise<{
  success_patterns: any[]
  struggle_patterns: any[]
  optimal_conditions: any[]
  recommendations: string[]
}> {
  try {
    const { data: completions, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Analyze patterns in the context data
    const successPatterns = []
    const strugglePatterns = []
    const optimalConditions = []

    // Group completions by context factors
    const byMood = completions.reduce((acc, comp) => {
      if (comp.context?.mood_before) {
        acc[comp.context.mood_before] = (acc[comp.context.mood_before] || 0) + 1
      }
      return acc
    }, {})

    const byTimeOfDay = completions.reduce((acc, comp) => {
      if (comp.context?.time_of_day) {
        acc[comp.context.time_of_day] = (acc[comp.context.time_of_day] || 0) + 1
      }
      return acc
    }, {})

    const byLocation = completions.reduce((acc, comp) => {
      if (comp.context?.location) {
        acc[comp.context.location] = (acc[comp.context.location] || 0) + 1
      }
      return acc
    }, {})

    // Generate insights
    const recommendations = []

    // Find optimal time of day
    const bestTime = Object.entries(byTimeOfDay).sort(([,a], [,b]) => b - a)[0]
    if (bestTime) {
      recommendations.push(`You perform best during ${bestTime[0].replace('_', ' ')}`)
    }

    // Find optimal location
    const bestLocation = Object.entries(byLocation).sort(([,a], [,b]) => b - a)[0]
    if (bestLocation) {
      recommendations.push(`You're most successful when at ${bestLocation[0]}`)
    }

    // Find optimal mood range
    const bestMoods = Object.entries(byMood).filter(([mood, count]) => parseInt(mood) >= 3)
    if (bestMoods.length > 0) {
      recommendations.push(`Focus on this habit when your mood is 3+ for better success`)
    }

    return {
      success_patterns: Object.entries(byTimeOfDay).map(([time, count]) => ({ time, count })),
      struggle_patterns: [],
      optimal_conditions: [
        { factor: 'time_of_day', value: bestTime?.[0], frequency: bestTime?.[1] },
        { factor: 'location', value: bestLocation?.[0], frequency: bestLocation?.[1] }
      ],
      recommendations
    }
  } catch (error) {
    console.error('Error in getHabitInsights:', error)
    return {
      success_patterns: [],
      struggle_patterns: [],
      optimal_conditions: [],
      recommendations: []
    }
  }
}

/**
 * Analyze context patterns across all user habits
 */
export async function getHabitContextAnalytics(userId: string): Promise<{
  overall_patterns: any[]
  mood_trends: any[]
  energy_patterns: any[]
  location_effectiveness: any[]
  time_optimization: any[]
}> {
  try {
    const { data: completions, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(500)

    if (error) throw error

    // Analyze mood trends over time
    const moodTrends = completions
      .filter(c => c.context?.mood_before && c.context?.mood_after)
      .map(c => ({
        date: c.completed_at,
        mood_improvement: c.context.mood_after - c.context.mood_before,
        energy_level: c.context.energy_level
      }))

    // Analyze energy patterns by time of day
    const energyByTime = completions
      .filter(c => c.context?.time_of_day && c.context?.energy_level)
      .reduce((acc, comp) => {
        const time = comp.context.time_of_day
        if (!acc[time]) acc[time] = []
        acc[time].push(comp.context.energy_level)
        return acc
      }, {})

    const energyPatterns = Object.entries(energyByTime).map(([time, levels]) => ({
      time_of_day: time,
      average_energy: levels.reduce((sum, level) => sum + level, 0) / levels.length,
      completion_count: levels.length
    }))

    // Location effectiveness
    const locationEffectiveness = completions
      .filter(c => c.context?.location)
      .reduce((acc, comp) => {
        const location = comp.context.location
        if (!acc[location]) acc[location] = { completions: 0, total_mood_improvement: 0 }
        acc[location].completions++
        if (comp.context.mood_before && comp.context.mood_after) {
          acc[location].total_mood_improvement += (comp.context.mood_after - comp.context.mood_before)
        }
        return acc
      }, {})

    return {
      overall_patterns: [],
      mood_trends: moodTrends.slice(0, 30), // Last 30 completions
      energy_patterns: energyPatterns,
      location_effectiveness: Object.entries(locationEffectiveness).map(([location, data]) => ({
        location,
        completions: data.completions,
        average_mood_improvement: data.total_mood_improvement / data.completions
      })),
      time_optimization: energyPatterns.sort((a, b) => b.average_energy - a.average_energy)
    }
  } catch (error) {
    console.error('Error in getHabitContextAnalytics:', error)
    return {
      overall_patterns: [],
      mood_trends: [],
      energy_patterns: [],
      location_effectiveness: [],
      time_optimization: []
    }
  }
}