import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getUserHabits,
  createHabit,
  updateHabit,
  archiveHabit,
  deleteHabitPermanently,
  getHabitById,
  getArchivedHabits,
  restoreHabit,
  searchHabits,
  createHabits,
  updateHabits,
  archiveHabits,
  getHabitStats,
  completeHabit,
  undoHabitCompletion,
  getTodayCompletions,
  calculateStreak,
  getHabitCompletionsRange,
  type Habit,
  type HabitEntry,
  type HabitStreak,
  type HabitSearchFilters,
  type HabitStats,
} from '@/lib/habitService'
import { queryKeys } from '@/lib/queryClient'

// Query hooks for reading data
export function useHabits(userId: string) {
  return useQuery({
    queryKey: queryKeys.habits.byUser(userId),
    queryFn: () => getUserHabits(userId),
    enabled: !!userId,
  })
}

export function useHabit(habitId: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.habits.byId(habitId, userId),
    queryFn: () => getHabitById(habitId, userId),
    enabled: !!habitId && !!userId,
  })
}

export function useArchivedHabits(userId: string) {
  return useQuery({
    queryKey: queryKeys.habits.archived(userId),
    queryFn: () => getArchivedHabits(userId),
    enabled: !!userId,
  })
}

export function useSearchHabits(userId: string, filters: HabitSearchFilters = {}) {
  return useQuery({
    queryKey: queryKeys.habits.search(userId, filters),
    queryFn: () => searchHabits(userId, filters),
    enabled: !!userId,
  })
}

export function useHabitStats(userId: string) {
  return useQuery({
    queryKey: queryKeys.habits.stats(userId),
    queryFn: () => getHabitStats(userId),
    enabled: !!userId,
  })
}

export function useTodayCompletions(userId: string) {
  return useQuery({
    queryKey: queryKeys.habitCompletions.today(userId),
    queryFn: () => getTodayCompletions(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  })
}

export function useHabitStreak(habitId: string, userId: string) {
  return useQuery({
    queryKey: queryKeys.habitStreaks.byHabit(habitId, userId),
    queryFn: () => calculateStreak(habitId, userId),
    enabled: !!habitId && !!userId,
  })
}

export function useHabitCompletionsRange(
  habitId: string,
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return useQuery({
    queryKey: queryKeys.habitCompletions.range(
      habitId,
      userId,
      startDate.toISOString(),
      endDate.toISOString()
    ),
    queryFn: () => getHabitCompletionsRange(habitId, userId, startDate, endDate),
    enabled: !!habitId && !!userId && !!startDate && !!endDate,
  })
}

// Mutation hooks for data modifications
export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      name,
      description,
      color,
      targetFrequency,
      frequencyPeriod,
    }: {
      userId: string
      name: string
      description?: string
      color?: string
      targetFrequency?: number
      frequencyPeriod?: 'daily' | 'weekly' | 'monthly'
    }) => createHabit(userId, name, description, color, targetFrequency, frequencyPeriod),
    onSuccess: (data, variables) => {
      // Invalidate and refetch habits for this user
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(variables.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      habitId,
      updates,
      userId,
    }: {
      habitId: string
      updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at'>>
      userId: string
    }) => updateHabit(habitId, updates),
    onSuccess: (data, variables) => {
      // Update specific habit in cache
      if (data) {
        queryClient.setQueryData(
          queryKeys.habits.byId(variables.habitId, variables.userId),
          data
        )
      }
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(variables.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
    },
  })
}

export function useArchiveHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, userId }: { habitId: string; userId: string }) =>
      archiveHabit(habitId),
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.archived(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
      }
    },
  })
}

export function useDeleteHabitPermanently() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, userId }: { habitId: string; userId: string }) =>
      deleteHabitPermanently(habitId),
    onSuccess: (success, variables) => {
      if (success) {
        // Remove from cache and invalidate related queries
        queryClient.removeQueries({ queryKey: queryKeys.habits.byId(variables.habitId, variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.archived(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.byHabit(variables.habitId, variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habitStreaks.byHabit(variables.habitId, variables.userId) })
      }
    },
  })
}

export function useRestoreHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, userId }: { habitId: string; userId: string }) =>
      restoreHabit(habitId),
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.archived(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
      }
    },
  })
}

export function useCreateHabits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      habits,
    }: {
      userId: string
      habits: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]
    }) => createHabits(userId, habits),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(variables.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
    },
  })
}

export function useUpdateHabits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      habitUpdates,
      userId,
    }: {
      habitUpdates: { id: string; updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at'>> }[]
      userId: string
    }) => updateHabits(habitUpdates),
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
        // Invalidate individual habit queries
        variables.habitUpdates.forEach(({ id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.habits.byId(id, variables.userId) })
        })
      }
    },
  })
}

export function useArchiveHabits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitIds, userId }: { habitIds: string[]; userId: string }) =>
      archiveHabits(habitIds),
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.archived(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
      }
    },
  })
}

export function useCompleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      habitId,
      userId,
      notes,
    }: {
      habitId: string
      userId: string
      notes?: string
    }) => completeHabit(habitId, userId, notes),
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate related queries for real-time updates
        queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.today(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habitStreaks.byHabit(variables.habitId, variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.byHabit(variables.habitId, variables.userId) })
      }
    },
  })
}

export function useUndoHabitCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, userId }: { habitId: string; userId: string }) =>
      undoHabitCompletion(habitId, userId),
    onSuccess: (success, variables) => {
      if (success) {
        // Invalidate related queries for real-time updates
        queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.today(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habitStreaks.byHabit(variables.habitId, variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.byHabit(variables.habitId, variables.userId) })
      }
    },
  })
}

// Combined hook for habits with completions and streaks
export function useHabitsWithDetails(userId: string) {
  const habitsQuery = useHabits(userId)
  const completionsQuery = useTodayCompletions(userId)
  const statsQuery = useHabitStats(userId)

  return {
    habits: habitsQuery.data || [],
    completions: completionsQuery.data || [],
    stats: statsQuery.data,
    isLoading: habitsQuery.isLoading || completionsQuery.isLoading || statsQuery.isLoading,
    error: habitsQuery.error || completionsQuery.error || statsQuery.error,
    refetch: () => {
      habitsQuery.refetch()
      completionsQuery.refetch()
      statsQuery.refetch()
    },
  }
}