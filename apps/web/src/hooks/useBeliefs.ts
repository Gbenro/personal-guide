import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { BeliefsService } from '../lib/beliefsService'
import type {
  BeliefSystem,
  UserBeliefCycle,
  DailyBeliefActivity,
  BeliefMilestone,
  CreateBeliefSystemInput,
  CreateBeliefCycleInput,
  UpdateBeliefCycleInput,
  UpdateDailyActivityInput,
  CreateMilestoneInput,
  BeliefSystemFilters,
  BeliefCycleFilters,
  BeliefStats,
  BeliefInsight
} from '../types/beliefs'

// =================== QUERY KEYS ===================

const beliefKeys = {
  all: ['beliefs'] as const,
  systems: () => [...beliefKeys.all, 'systems'] as const,
  systemsFiltered: (filters: BeliefSystemFilters) => [...beliefKeys.systems(), filters] as const,
  userCycles: (userId: string) => [...beliefKeys.all, 'cycles', userId] as const,
  userCyclesFiltered: (userId: string, filters: BeliefCycleFilters) => [...beliefKeys.userCycles(userId), filters] as const,
  cycle: (userId: string, cycleId: string) => [...beliefKeys.userCycles(userId), cycleId] as const,
  dailyActivity: (userId: string, cycleId: string, day: number) => [...beliefKeys.all, 'activity', userId, cycleId, day] as const,
  recentActivities: (userId: string, cycleId: string) => [...beliefKeys.cycle(userId, cycleId), 'activities'] as const,
  stats: (userId: string) => [...beliefKeys.all, 'stats', userId] as const,
  insights: (userId: string) => [...beliefKeys.all, 'insights', userId] as const
}

// =================== BELIEF SYSTEMS ===================

export function useBeliefSystems(filters?: BeliefSystemFilters) {
  const { user } = useAuth()

  return useQuery({
    queryKey: filters ? beliefKeys.systemsFiltered(filters) : beliefKeys.systems(),
    queryFn: () => BeliefsService.getBeliefSystems(user?.id || '', filters),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useFeaturedBeliefSystems() {
  return useQuery({
    queryKey: [...beliefKeys.systems(), 'featured'],
    queryFn: () => BeliefsService.getFeaturedBeliefSystems(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  })
}

export function useCreateBeliefSystem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBeliefSystemInput) =>
      BeliefsService.createBeliefSystem(user?.id || '', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beliefKeys.systems() })
    }
  })
}

// =================== USER BELIEF CYCLES ===================

export function useUserBeliefCycles(filters?: BeliefCycleFilters) {
  const { user } = useAuth()

  return useQuery({
    queryKey: filters
      ? beliefKeys.userCyclesFiltered(user?.id || '', filters)
      : beliefKeys.userCycles(user?.id || ''),
    queryFn: () => BeliefsService.getUserBeliefCycles(user?.id || '', filters),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useUserBeliefCycle(cycleId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: beliefKeys.cycle(user?.id || '', cycleId),
    queryFn: () => BeliefsService.getUserBeliefCycle(user?.id || '', cycleId),
    enabled: !!user?.id && !!cycleId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useCreateBeliefCycle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBeliefCycleInput) =>
      BeliefsService.createBeliefCycle(user?.id || '', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: beliefKeys.userCycles(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: beliefKeys.stats(user?.id || '') })
    }
  })
}

export function useUpdateBeliefCycle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cycleId, updates }: { cycleId: string; updates: UpdateBeliefCycleInput }) =>
      BeliefsService.updateBeliefCycle(user?.id || '', cycleId, updates),
    onSuccess: (updatedCycle) => {
      queryClient.invalidateQueries({ queryKey: beliefKeys.userCycles(user?.id || '') })
      queryClient.setQueryData(
        beliefKeys.cycle(user?.id || '', updatedCycle.id),
        updatedCycle
      )
    }
  })
}

// =================== DAILY ACTIVITIES ===================

export function useDailyActivity(cycleId: string, dayNumber: number) {
  const { user } = useAuth()

  return useQuery({
    queryKey: beliefKeys.dailyActivity(user?.id || '', cycleId, dayNumber),
    queryFn: () => BeliefsService.getDailyActivity(user?.id || '', cycleId, dayNumber),
    enabled: !!user?.id && !!cycleId && dayNumber > 0,
    staleTime: 30 * 1000, // 30 seconds for active day tracking
    gcTime: 2 * 60 * 1000 // 2 minutes
  })
}

export function useRecentActivities(cycleId: string, limit?: number) {
  const { user } = useAuth()

  return useQuery({
    queryKey: beliefKeys.recentActivities(user?.id || '', cycleId),
    queryFn: () => BeliefsService.getRecentActivities(user?.id || '', cycleId, limit),
    enabled: !!user?.id && !!cycleId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useUpdateDailyActivity() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      cycleId,
      dayNumber,
      updates
    }: {
      cycleId: string
      dayNumber: number
      updates: UpdateDailyActivityInput
    }) => BeliefsService.updateDailyActivity(user?.id || '', cycleId, dayNumber, updates),
    onSuccess: (updatedActivity, variables) => {
      // Update specific daily activity
      queryClient.setQueryData(
        beliefKeys.dailyActivity(user?.id || '', variables.cycleId, variables.dayNumber),
        updatedActivity
      )

      // Refresh recent activities and cycle data
      queryClient.invalidateQueries({
        queryKey: beliefKeys.recentActivities(user?.id || '', variables.cycleId)
      })
      queryClient.invalidateQueries({
        queryKey: beliefKeys.cycle(user?.id || '', variables.cycleId)
      })
      queryClient.invalidateQueries({
        queryKey: beliefKeys.stats(user?.id || '')
      })
    }
  })
}

// =================== STATISTICS & INSIGHTS ===================

export function useBeliefStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: beliefKeys.stats(user?.id || ''),
    queryFn: () => BeliefsService.getBeliefStats(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useBeliefInsights() {
  const { user } = useAuth()

  return useQuery({
    queryKey: beliefKeys.insights(user?.id || ''),
    queryFn: () => BeliefsService.generateBeliefInsights(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  })
}

// =================== UTILITY HOOKS ===================

export function useBeliefCycleActions(cycleId: string) {
  const updateCycle = useUpdateBeliefCycle()
  const updateActivity = useUpdateDailyActivity()

  const pauseCycle = (cycle: UserBeliefCycle) => {
    updateCycle.mutate({
      cycleId: cycle.id,
      updates: { status: 'paused' }
    })
  }

  const resumeCycle = (cycle: UserBeliefCycle) => {
    updateCycle.mutate({
      cycleId: cycle.id,
      updates: { status: 'active' }
    })
  }

  const updateBeliefStrength = (cycle: UserBeliefCycle, strength: number) => {
    updateCycle.mutate({
      cycleId: cycle.id,
      updates: { current_belief_strength: strength }
    })
  }

  const completeActivity = (
    dayNumber: number,
    activityType: 'read_affirmation' | 'speak_affirmation' | 'visualization' | 'journaling',
    additionalData?: Partial<UpdateDailyActivityInput>
  ) => {
    const updates: UpdateDailyActivityInput = {
      [`${activityType}_completed`]: true,
      ...additionalData
    }

    updateActivity.mutate({
      cycleId,
      dayNumber,
      updates
    })
  }

  const logProgress = (
    dayNumber: number,
    ratings: {
      beliefStrength?: number
      mood?: number
      confidence?: number
      resistance?: number
    },
    notes?: {
      dailyNotes?: string
      challenges?: string
      breakthroughs?: string
      gratitude?: string[]
    }
  ) => {
    const updates: UpdateDailyActivityInput = {
      belief_strength_rating: ratings.beliefStrength,
      mood_rating: ratings.mood,
      confidence_rating: ratings.confidence,
      resistance_level: ratings.resistance,
      daily_notes: notes?.dailyNotes,
      challenges_faced: notes?.challenges,
      breakthroughs: notes?.breakthroughs,
      gratitude_items: notes?.gratitude
    }

    updateActivity.mutate({
      cycleId,
      dayNumber,
      updates
    })
  }

  return {
    pauseCycle,
    resumeCycle,
    updateBeliefStrength,
    completeActivity,
    logProgress,
    isLoading: updateCycle.isPending || updateActivity.isPending
  }
}

export function useTodaysBeliefWork() {
  const { user } = useAuth()
  const { data: activeCycles } = useUserBeliefCycles({ status: ['active'] })

  // Get today's activities for all active cycles
  const todaysActivities = useQuery({
    queryKey: [...beliefKeys.all, 'todays-work', user?.id],
    queryFn: async () => {
      if (!activeCycles || activeCycles.length === 0) return []

      const activities = await Promise.all(
        activeCycles.map(cycle =>
          BeliefsService.getDailyActivity(user?.id || '', cycle.id, cycle.current_day)
        )
      )

      return activities
        .map((activity, index) => ({
          cycle: activeCycles[index],
          activity: activity
        }))
        .filter(item => item.activity !== null)
    },
    enabled: !!user?.id && !!activeCycles && activeCycles.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000 // 2 minutes
  })

  const pendingWork = todaysActivities.data?.filter(item =>
    item.activity && item.activity.completion_percentage < 100
  ) || []

  const completedWork = todaysActivities.data?.filter(item =>
    item.activity && item.activity.completion_percentage === 100
  ) || []

  return {
    isLoading: todaysActivities.isLoading,
    pendingWork,
    completedWork,
    totalWork: todaysActivities.data?.length || 0,
    completionRate: todaysActivities.data?.length > 0 ?
      (completedWork.length / todaysActivities.data.length) * 100 : 0
  }
}

export function useBeliefProgress() {
  const { user } = useAuth()
  const { data: cycles } = useUserBeliefCycles({ status: ['active', 'completed'] })

  return useQuery({
    queryKey: [...beliefKeys.all, 'progress', user?.id],
    queryFn: async () => {
      if (!cycles || cycles.length === 0) return []

      const progress = await Promise.all(
        cycles.map(async cycle => {
          const recentActivities = await BeliefsService.getRecentActivities(user?.id || '', cycle.id, 7)

          return {
            cycle_id: cycle.id,
            cycle_title: cycle.title,
            belief_statement: cycle.personal_belief_statement,
            current_day: cycle.current_day,
            total_days: 21, // Default cycle length
            days_completed: cycle.days_completed,
            consecutive_days: cycle.consecutive_days,
            completion_percentage: Math.round((cycle.days_completed / 21) * 100),
            belief_strength_progress: cycle.current_belief_strength && cycle.initial_belief_strength ?
              cycle.current_belief_strength - cycle.initial_belief_strength : 0,
            recent_activities: recentActivities,
            status: cycle.status
          }
        })
      )

      return progress
    },
    enabled: !!user?.id && !!cycles && cycles.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}