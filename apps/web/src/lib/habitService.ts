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
}

export interface HabitStreak {
  habit_id: string
  current_streak: number
  longest_streak: number
  last_completed: Date | null
  total_completions: number
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

// Record a habit completion
export async function completeHabit(
  habitId: string,
  userId: string,
  notes?: string
): Promise<HabitEntry | null> {
  try {
    const { data, error } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: habitId,
        user_id: userId,
        completed_at: new Date().toISOString(),
        notes
      })
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

    return data as HabitEntry
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
    const { data, error } = await supabase
      .from('habit_completions')
      .select('completed_at')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return {
        habit_id: habitId,
        current_streak: 0,
        longest_streak: 0,
        last_completed: null,
        total_completions: 0
      }
    }

    const entries = data as { completed_at: string }[]
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const lastCompleted = new Date(entries[0].completed_at)
    const lastCompletedDate = new Date(lastCompleted)
    lastCompletedDate.setHours(0, 0, 0, 0)
    
    // Check if the habit was completed today or yesterday
    const daysSinceLastCompletion = Math.floor(
      (today.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceLastCompletion <= 1) {
      currentStreak = 1
      
      // Count consecutive days
      for (let i = 1; i < entries.length; i++) {
        const currentDate = new Date(entries[i - 1].completed_at)
        const prevDate = new Date(entries[i].completed_at)
        currentDate.setHours(0, 0, 0, 0)
        prevDate.setHours(0, 0, 0, 0)
        
        const dayDiff = Math.floor(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (dayDiff === 1) {
          currentStreak++
          tempStreak++
        } else if (dayDiff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

    return {
      habit_id: habitId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed: lastCompleted,
      total_completions: entries.length
    }
  } catch (error) {
    console.error('Error calculating streak:', error)
    return {
      habit_id: habitId,
      current_streak: 0,
      longest_streak: 0,
      last_completed: null,
      total_completions: 0
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