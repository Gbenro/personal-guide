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

export async function createHabit(habit: Partial<Habit>): Promise<Habit | null> {
  console.log('Create habit stub called - not implemented yet')
  return null
}

export async function completeHabit(habitId: string, userId: string, notes?: string): Promise<HabitCompletion | null> {
  console.log('Complete habit stub called - not implemented yet')
  return null
}

// Real-time subscription stubs
export const realtimeService = {
  subscribe: (channel: string, callback: Function) => {
    console.log(`Real-time subscription stub for ${channel} - not implemented yet`)
    return { unsubscribe: () => {} }
  }
}