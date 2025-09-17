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