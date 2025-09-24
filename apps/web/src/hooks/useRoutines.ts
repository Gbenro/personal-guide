import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { RoutinesService } from '../lib/routinesService'
import type {
  RoutineTemplate,
  UserRoutine,
  RoutineSession,
  RoutineCompletion,
  CreateUserRoutineInput,
  UpdateUserRoutineInput,
  StartRoutineSessionInput,
  CompleteRoutineSessionInput,
  CompleteRoutineStepInput,
  SkipRoutineStepInput,
  RoutineFilters,
  RoutineTemplateFilters,
  RoutineStats,
  RoutineInsight
} from '../types/routines'

// =================== QUERY KEYS ===================

const routineKeys = {
  all: ['routines'] as const,
  templates: () => [...routineKeys.all, 'templates'] as const,
  templatesFiltered: (filters: RoutineTemplateFilters) => [...routineKeys.templates(), filters] as const,
  userRoutines: (userId: string) => [...routineKeys.all, 'user', userId] as const,
  userRoutinesFiltered: (userId: string, filters: RoutineFilters) => [...routineKeys.userRoutines(userId), filters] as const,
  routine: (userId: string, routineId: string) => [...routineKeys.userRoutines(userId), routineId] as const,
  activeSession: (userId: string, routineId: string) => [...routineKeys.all, 'session', userId, routineId] as const,
  stats: (userId: string) => [...routineKeys.all, 'stats', userId] as const,
  insights: (userId: string) => [...routineKeys.all, 'insights', userId] as const
}

// =================== ROUTINE TEMPLATES ===================

export function useRoutineTemplates(filters?: RoutineTemplateFilters) {
  const { user } = useAuth()

  return useQuery({
    queryKey: filters ? routineKeys.templatesFiltered(filters) : routineKeys.templates(),
    queryFn: () => RoutinesService.getRoutineTemplates(user?.id || '', filters),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useFeaturedTemplates() {
  return useQuery({
    queryKey: [...routineKeys.templates(), 'featured'],
    queryFn: () => RoutinesService.getFeaturedTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  })
}

// =================== USER ROUTINES ===================

export function useUserRoutines(filters?: RoutineFilters) {
  const { user } = useAuth()

  return useQuery({
    queryKey: filters
      ? routineKeys.userRoutinesFiltered(user?.id || '', filters)
      : routineKeys.userRoutines(user?.id || ''),
    queryFn: () => RoutinesService.getUserRoutines(user?.id || '', filters),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useUserRoutine(routineId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: routineKeys.routine(user?.id || '', routineId),
    queryFn: () => RoutinesService.getUserRoutine(user?.id || '', routineId),
    enabled: !!user?.id && !!routineId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useCreateRoutineFromTemplate() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, customizations }: { templateId: string; customizations?: Partial<CreateUserRoutineInput> }) =>
      RoutinesService.createRoutineFromTemplate(user?.id || '', templateId, customizations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.userRoutines(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: routineKeys.stats(user?.id || '') })
    }
  })
}

export function useCreateUserRoutine() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserRoutineInput) =>
      RoutinesService.createUserRoutine(user?.id || '', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.userRoutines(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: routineKeys.stats(user?.id || '') })
    }
  })
}

export function useUpdateUserRoutine() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ routineId, updates }: { routineId: string; updates: UpdateUserRoutineInput }) =>
      RoutinesService.updateUserRoutine(user?.id || '', routineId, updates),
    onSuccess: (updatedRoutine) => {
      queryClient.invalidateQueries({ queryKey: routineKeys.userRoutines(user?.id || '') })
      queryClient.setQueryData(
        routineKeys.routine(user?.id || '', updatedRoutine.id),
        updatedRoutine
      )
    }
  })
}

export function useDeleteUserRoutine() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (routineId: string) =>
      RoutinesService.deleteUserRoutine(user?.id || '', routineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.userRoutines(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: routineKeys.stats(user?.id || '') })
    }
  })
}

// =================== ROUTINE SESSIONS ===================

export function useActiveSession(routineId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: routineKeys.activeSession(user?.id || '', routineId),
    queryFn: () => RoutinesService.getActiveSession(user?.id || '', routineId),
    enabled: !!user?.id && !!routineId,
    refetchInterval: 5000, // Poll every 5 seconds for active sessions
    staleTime: 0 // Always fetch fresh data for active sessions
  })
}

export function useStartRoutineSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: StartRoutineSessionInput) =>
      RoutinesService.startRoutineSession(user?.id || '', input),
    onSuccess: (session) => {
      queryClient.setQueryData(
        routineKeys.activeSession(user?.id || '', session.routine_id),
        session
      )
      queryClient.invalidateQueries({ queryKey: routineKeys.userRoutines(user?.id || '') })
    }
  })
}

export function useCompleteRoutineStep() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CompleteRoutineStepInput) =>
      RoutinesService.completeRoutineStep(user?.id || '', input),
    onSuccess: () => {
      // Refresh active sessions to get updated progress
      queryClient.invalidateQueries({
        queryKey: routineKeys.all,
        predicate: (query) => query.queryKey.includes('session')
      })
    }
  })
}

export function useSkipRoutineStep() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SkipRoutineStepInput) =>
      RoutinesService.skipRoutineStep(user?.id || '', input),
    onSuccess: () => {
      // Refresh active sessions to get updated progress
      queryClient.invalidateQueries({
        queryKey: routineKeys.all,
        predicate: (query) => query.queryKey.includes('session')
      })
    }
  })
}

export function useCompleteRoutineSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CompleteRoutineSessionInput) =>
      RoutinesService.completeRoutineSession(user?.id || '', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routineKeys.userRoutines(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: routineKeys.stats(user?.id || '') })
      queryClient.invalidateQueries({
        queryKey: routineKeys.all,
        predicate: (query) => query.queryKey.includes('session')
      })
    }
  })
}

export function usePauseSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      RoutinesService.pauseSession(user?.id || '', sessionId),
    onSuccess: (session) => {
      queryClient.setQueryData(
        routineKeys.activeSession(user?.id || '', session.routine_id),
        session
      )
    }
  })
}

export function useResumeSession() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      RoutinesService.resumeSession(user?.id || '', sessionId),
    onSuccess: (session) => {
      queryClient.setQueryData(
        routineKeys.activeSession(user?.id || '', session.routine_id),
        session
      )
    }
  })
}

// =================== STATISTICS & INSIGHTS ===================

export function useRoutineStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: routineKeys.stats(user?.id || ''),
    queryFn: () => RoutinesService.getRoutineStats(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useRoutineInsights() {
  const { user } = useAuth()

  return useQuery({
    queryKey: routineKeys.insights(user?.id || ''),
    queryFn: () => RoutinesService.generateRoutineInsights(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  })
}

// =================== UTILITY HOOKS ===================

export function useRoutineActions(routineId: string) {
  const updateRoutine = useUpdateUserRoutine()
  const deleteRoutine = useDeleteUserRoutine()
  const startSession = useStartRoutineSession()

  const toggleFavorite = (routine: UserRoutine) => {
    updateRoutine.mutate({
      routineId: routine.id,
      updates: { is_favorite: !routine.is_favorite }
    })
  }

  const toggleActive = (routine: UserRoutine) => {
    updateRoutine.mutate({
      routineId: routine.id,
      updates: { is_active: !routine.is_active }
    })
  }

  const toggleScheduled = (routine: UserRoutine) => {
    updateRoutine.mutate({
      routineId: routine.id,
      updates: { is_scheduled: !routine.is_scheduled }
    })
  }

  const startRoutine = (input?: Omit<StartRoutineSessionInput, 'routine_id'>) => {
    startSession.mutate({
      routine_id: routineId,
      ...input
    })
  }

  const removeRoutine = () => {
    if (confirm('Are you sure you want to delete this routine?')) {
      deleteRoutine.mutate(routineId)
    }
  }

  return {
    toggleFavorite,
    toggleActive,
    toggleScheduled,
    startRoutine,
    removeRoutine,
    isLoading: updateRoutine.isPending || deleteRoutine.isPending || startSession.isPending
  }
}

export function useSessionActions(sessionId: string) {
  const completeStep = useCompleteRoutineStep()
  const skipStep = useSkipRoutineStep()
  const completeSession = useCompleteRoutineSession()
  const pauseSession = usePauseSession()
  const resumeSession = useResumeSession()

  const finishStep = (stepId: string, duration?: number, notes?: string) => {
    completeStep.mutate({
      session_id: sessionId,
      step_id: stepId,
      duration_seconds: duration,
      notes
    })
  }

  const skipCurrentStep = (stepId: string, reason?: string) => {
    skipStep.mutate({
      session_id: sessionId,
      step_id: stepId,
      reason
    })
  }

  const finishSession = (feedback: Omit<CompleteRoutineSessionInput, 'session_id'>) => {
    completeSession.mutate({
      session_id: sessionId,
      ...feedback
    })
  }

  const pause = () => {
    pauseSession.mutate(sessionId)
  }

  const resume = () => {
    resumeSession.mutate(sessionId)
  }

  return {
    finishStep,
    skipCurrentStep,
    finishSession,
    pause,
    resume,
    isLoading: completeStep.isPending || skipStep.isPending || completeSession.isPending ||
               pauseSession.isPending || resumeSession.isPending
  }
}