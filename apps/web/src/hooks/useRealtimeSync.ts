'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createHabitsSubscription,
  createHabitCompletionsSubscription,
  realtimeService
} from '@/lib/realtimeService'
import { queryKeys } from '@/lib/queryClient'

interface UseRealtimeSyncOptions {
  userId: string
  enabled?: boolean
  debounceMs?: number
}

type CacheUpdateFunction = () => void

export function useRealtimeSync({
  userId,
  enabled = true,
  debounceMs = 300
}: UseRealtimeSyncOptions) {
  const queryClient = useQueryClient()
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Debounced cache invalidation to prevent excessive re-renders
  const debouncedInvalidate = useCallback((queryKey: string, invalidateFn: CacheUpdateFunction) => {
    const timers = debounceTimersRef.current

    // Clear existing timer for this query key
    const existingTimer = timers.get(queryKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      invalidateFn()
      timers.delete(queryKey)
    }, debounceMs)

    timers.set(queryKey, timer)
  }, [debounceMs])

  // Optimistic update with rollback capability
  const optimisticUpdate = useCallback(<T>(
    queryKey: any[],
    updateFn: (oldData: T | undefined) => T | undefined,
    rollbackData?: T
  ) => {
    try {
      // Apply optimistic update
      queryClient.setQueryData(queryKey, updateFn)

      // If rollback data is provided, set up a mechanism to rollback on error
      if (rollbackData) {
        setTimeout(() => {
          // This is a simple rollback mechanism
          // In a more sophisticated setup, you'd track the update and rollback only if it fails
          queryClient.invalidateQueries({ queryKey })
        }, 5000) // Rollback after 5 seconds if not confirmed by server
      }
    } catch (error) {
      console.error('Optimistic update failed:', error)
      // Invalidate to get fresh data from server
      queryClient.invalidateQueries({ queryKey })
    }
  }, [queryClient])

  // Setup habits subscription
  useEffect(() => {
    if (!enabled || !userId) return

    let subscriptionCleanup: (() => void) | undefined

    const setupHabitsSubscription = async () => {
      try {
        await createHabitsSubscription(userId, {
          onInsert: (payload) => {
            console.log('Habit inserted:', payload.new)

            // Optimistic update: Add new habit to cache
            const userHabitsKey = queryKeys.habits.byUser(userId)
            optimisticUpdate(userHabitsKey, (oldData: any[]) => {
              if (!oldData) return [payload.new]
              return [...oldData, payload.new]
            })

            // Update stats with debouncing
            debouncedInvalidate('habit-stats', () => {
              queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(userId) })
            })
          },

          onUpdate: (payload) => {
            console.log('Habit updated:', payload.new)

            const habitId = payload.new.id

            // Optimistic update: Update specific habit
            const habitKey = queryKeys.habits.byId(habitId, userId)
            optimisticUpdate(habitKey, () => payload.new)

            // Update habits list
            const userHabitsKey = queryKeys.habits.byUser(userId)
            optimisticUpdate(userHabitsKey, (oldData: any[]) => {
              if (!oldData) return [payload.new]
              return oldData.map(habit =>
                habit.id === habitId ? payload.new : habit
              )
            })

            // Update archived habits if needed
            if (payload.new.archived_at || payload.old.archived_at) {
              debouncedInvalidate('archived-habits', () => {
                queryClient.invalidateQueries({ queryKey: queryKeys.habits.archived(userId) })
              })
            }

            // Update stats with debouncing
            debouncedInvalidate('habit-stats', () => {
              queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(userId) })
            })
          },

          onDelete: (payload) => {
            console.log('Habit deleted:', payload.old)

            const habitId = payload.old.id

            // Remove from cache
            queryClient.removeQueries({ queryKey: queryKeys.habits.byId(habitId, userId) })

            // Update habits list
            const userHabitsKey = queryKeys.habits.byUser(userId)
            optimisticUpdate(userHabitsKey, (oldData: any[]) => {
              if (!oldData) return []
              return oldData.filter(habit => habit.id !== habitId)
            })

            // Update related queries with debouncing
            debouncedInvalidate('habit-delete-cleanup', () => {
              queryClient.invalidateQueries({ queryKey: queryKeys.habits.archived(userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.byHabit(habitId, userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habitStreaks.byHabit(habitId, userId) })
            })
          }
        })
      } catch (error) {
        console.error('Failed to setup habits subscription:', error)
      }
    }

    setupHabitsSubscription()

    return () => {
      if (subscriptionCleanup) {
        subscriptionCleanup()
      }
    }
  }, [enabled, userId, queryClient, optimisticUpdate, debouncedInvalidate])

  // Setup habit completions subscription
  useEffect(() => {
    if (!enabled || !userId) return

    let subscriptionCleanup: (() => void) | undefined

    const setupCompletionsSubscription = async () => {
      try {
        await createHabitCompletionsSubscription(userId, {
          onInsert: (payload) => {
            console.log('Habit completion inserted:', payload.new)

            const habitId = payload.new.habit_id

            // Update today's completions
            const todayKey = queryKeys.habitCompletions.today(userId)
            optimisticUpdate(todayKey, (oldData: any[]) => {
              if (!oldData) return [payload.new]
              return [...oldData, payload.new]
            })

            // Update related queries with debouncing
            debouncedInvalidate('completion-insert', () => {
              queryClient.invalidateQueries({ queryKey: queryKeys.habitStreaks.byHabit(habitId, userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.byHabit(habitId, userId) })
            })
          },

          onUpdate: (payload) => {
            console.log('Habit completion updated:', payload.new)

            const habitId = payload.new.habit_id
            const completionId = payload.new.id

            // Update today's completions
            const todayKey = queryKeys.habitCompletions.today(userId)
            optimisticUpdate(todayKey, (oldData: any[]) => {
              if (!oldData) return [payload.new]
              return oldData.map(completion =>
                completion.id === completionId ? payload.new : completion
              )
            })

            // Update related queries with debouncing
            debouncedInvalidate('completion-update', () => {
              queryClient.invalidateQueries({ queryKey: queryKeys.habitStreaks.byHabit(habitId, userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.byHabit(habitId, userId) })
            })
          },

          onDelete: (payload) => {
            console.log('Habit completion deleted:', payload.old)

            const habitId = payload.old.habit_id
            const completionId = payload.old.id

            // Update today's completions
            const todayKey = queryKeys.habitCompletions.today(userId)
            optimisticUpdate(todayKey, (oldData: any[]) => {
              if (!oldData) return []
              return oldData.filter(completion => completion.id !== completionId)
            })

            // Update related queries with debouncing
            debouncedInvalidate('completion-delete', () => {
              queryClient.invalidateQueries({ queryKey: queryKeys.habitStreaks.byHabit(habitId, userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(userId) })
              queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.byHabit(habitId, userId) })
            })
          }
        })
      } catch (error) {
        console.error('Failed to setup habit completions subscription:', error)
      }
    }

    setupCompletionsSubscription()

    return () => {
      if (subscriptionCleanup) {
        subscriptionCleanup()
      }
    }
  }, [enabled, userId, queryClient, optimisticUpdate, debouncedInvalidate])

  // Cleanup debounce timers on unmount
  useEffect(() => {
    const timers = debounceTimersRef.current

    return () => {
      // Clear all pending timers
      timers.forEach(timer => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  // Manual sync function for forcing cache updates
  const forceSync = useCallback(() => {
    if (!userId) return

    // Clear all debounce timers and invalidate all related queries immediately
    const timers = debounceTimersRef.current
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()

    // Invalidate all habit-related queries
    queryClient.invalidateQueries({ queryKey: queryKeys.habits.byUser(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.habits.archived(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.habits.stats(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.habitCompletions.today(userId) })
  }, [userId, queryClient])

  return {
    forceSync,
    isEnabled: enabled,
  }
}

// Higher-level hook that automatically enables sync when user is available
export function useAutoRealtimeSync(userId?: string) {
  return useRealtimeSync({
    userId: userId || '',
    enabled: !!userId
  })
}