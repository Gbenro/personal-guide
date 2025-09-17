import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep inactive data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed queries once
      retry: 1,
      // Retry delay of 1 second
      retryDelay: 1000,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect (Supabase handles this)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay of 1 second
      retryDelay: 1000,
    },
  },
})

// Query key factory for consistent cache keys
export const queryKeys = {
  habits: {
    all: ['habits'] as const,
    byUser: (userId: string) => ['habits', 'user', userId] as const,
    byId: (habitId: string, userId: string) => ['habits', 'id', habitId, userId] as const,
    archived: (userId: string) => ['habits', 'archived', userId] as const,
    search: (userId: string, filters: Record<string, any>) => ['habits', 'search', userId, filters] as const,
    stats: (userId: string) => ['habits', 'stats', userId] as const,
  },
  habitCompletions: {
    all: ['habitCompletions'] as const,
    today: (userId: string) => ['habitCompletions', 'today', userId] as const,
    byHabit: (habitId: string, userId: string) => ['habitCompletions', 'habit', habitId, userId] as const,
    range: (habitId: string, userId: string, startDate: string, endDate: string) =>
      ['habitCompletions', 'range', habitId, userId, startDate, endDate] as const,
  },
  habitStreaks: {
    all: ['habitStreaks'] as const,
    byHabit: (habitId: string, userId: string) => ['habitStreaks', 'habit', habitId, userId] as const,
  },
} as const