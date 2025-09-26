// Temporary stub for habit service to prevent Supabase errors
// TODO: Replace with full PostgreSQL implementation

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
  console.log('Habit service stub called - returning empty habits')
  return []
}

export async function getTodayCompletions(userId: string): Promise<HabitCompletion[]> {
  console.log('Habit completions stub called - returning empty completions')
  return []
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
  console.log('Create habit stub called - not implemented yet')
  return null
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
  console.log('Complete habit stub called - not implemented yet')
  return null
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
  console.log('Get habit stats stub called - not implemented yet')
  return null
}

export async function undoHabitCompletion(habitId: string, userId: string): Promise<boolean> {
  console.log('Undo habit completion stub called - not implemented yet')
  return false
}

export async function calculateStreak(habitId: string, userId: string): Promise<HabitStreak | null> {
  console.log('Calculate streak stub called - not implemented yet')
  return null
}

export async function getHabitCompletionsRange(
  habitId: string,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<HabitCompletion[]> {
  console.log('Get habit completions range stub called - not implemented yet')
  return []
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
  current: number
  longest: number
  lastCompleted?: string
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