// Goals System React Hooks
// Provides React Query integration for hierarchical SMART goals

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GoalsService } from '@/lib/goalsService'
import type {
  Goal,
  GoalProgressLog,
  GoalTemplate,
  CreateGoalInput,
  UpdateGoalInput,
  GoalFilters,
  GoalStats,
  GoalInsight,
  GoalHierarchyView,
  CreateGoalFromTemplateInput,
  GoalProgressUpdate,
  BulkGoalUpdate,
  GoalType,
  GoalStatus
} from '@/types/goals'

// Query keys for React Query
export const goalQueryKeys = {
  all: ['goals'] as const,
  lists: () => [...goalQueryKeys.all, 'list'] as const,
  list: (filters: GoalFilters) => [...goalQueryKeys.lists(), filters] as const,
  details: () => [...goalQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalQueryKeys.details(), id] as const,
  hierarchy: (userId: string) => [...goalQueryKeys.all, 'hierarchy', userId] as const,
  stats: (userId: string) => [...goalQueryKeys.all, 'stats', userId] as const,
  insights: (userId: string) => [...goalQueryKeys.all, 'insights', userId] as const,
  templates: (userId: string) => [...goalQueryKeys.all, 'templates', userId] as const,
  progressLogs: (goalId: string) => [...goalQueryKeys.all, 'progressLogs', goalId] as const,
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Get all goals with optional filters
 */
export function useGoals(userId: string, filters: GoalFilters = {}) {
  return useQuery({
    queryKey: goalQueryKeys.list(filters),
    queryFn: () => GoalsService.getGoals(userId, filters),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Get single goal by ID
 */
export function useGoal(userId: string, goalId: string, includeChildren = false) {
  return useQuery({
    queryKey: goalQueryKeys.detail(goalId),
    queryFn: () => GoalsService.getGoal(userId, goalId, includeChildren),
    enabled: !!userId && !!goalId,
    staleTime: 30000,
  })
}

/**
 * Get hierarchical view of goals (monthly → weekly → daily)
 */
export function useGoalHierarchy(userId: string) {
  return useQuery({
    queryKey: goalQueryKeys.hierarchy(userId),
    queryFn: () => GoalsService.getGoalHierarchy(userId),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Get goal statistics
 */
export function useGoalStats(userId: string) {
  return useQuery({
    queryKey: goalQueryKeys.stats(userId),
    queryFn: () => GoalsService.getGoalStats(userId),
    enabled: !!userId,
    staleTime: 60000,
  })
}

/**
 * Get AI-generated insights
 */
export function useGoalInsights(userId: string) {
  return useQuery({
    queryKey: goalQueryKeys.insights(userId),
    queryFn: () => GoalsService.generateInsights(userId),
    enabled: !!userId,
    staleTime: 300000, // 5 minutes
  })
}

/**
 * Get goal templates
 */
export function useGoalTemplates(userId: string) {
  return useQuery({
    queryKey: goalQueryKeys.templates(userId),
    queryFn: () => GoalsService.getGoalTemplates(userId),
    enabled: !!userId,
    staleTime: 300000, // 5 minutes
  })
}

/**
 * Get progress logs for a goal
 */
export function useGoalProgressLogs(userId: string, goalId: string) {
  return useQuery({
    queryKey: goalQueryKeys.progressLogs(goalId),
    queryFn: () => GoalsService.getProgressLogs(userId, goalId),
    enabled: !!userId && !!goalId,
    staleTime: 30000,
  })
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Get active goals by type
 */
export function useActiveGoalsByType(userId: string, goalType: GoalType) {
  return useGoals(userId, { status: ['active'], goal_type: [goalType] })
}

/**
 * Get today's goals
 */
export function useTodaysGoals(userId: string) {
  return useGoals(userId, {
    status: ['active'],
    goal_type: ['daily'],
    due_soon: true
  })
}

/**
 * Get overdue goals
 */
export function useOverdueGoals(userId: string) {
  return useGoals(userId, {
    status: ['active'],
    overdue: true
  })
}

/**
 * Get goals by category
 */
export function useGoalsByCategory(userId: string, category: string) {
  return useGoals(userId, {
    status: ['active'],
    category: [category as any]
  })
}

/**
 * Get child goals for a parent
 */
export function useChildGoals(userId: string, parentGoalId: string) {
  return useGoals(userId, { parent_goal_id: parentGoalId })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new goal
 */
export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: CreateGoalInput }) =>
      GoalsService.createGoal(userId, input),

    onSuccess: (newGoal, { userId }) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.hierarchy(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.stats(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.insights(userId) })

      // Add to cache if we have the list query
      const filters = { status: ['active'] as GoalStatus[] }
      queryClient.setQueryData(
        goalQueryKeys.list(filters),
        (oldData: Goal[] | undefined) => {
          if (!oldData) return [newGoal]
          return [...oldData, newGoal]
        }
      )
    },
  })
}

/**
 * Update a goal
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      goalId,
      updates
    }: {
      userId: string
      goalId: string
      updates: UpdateGoalInput
    }) => GoalsService.updateGoal(userId, goalId, updates),

    onSuccess: (updatedGoal, { userId, goalId }) => {
      // Update the specific goal in cache
      queryClient.setQueryData(
        goalQueryKeys.detail(goalId),
        updatedGoal
      )

      // Update goal in any list queries
      queryClient.setQueriesData(
        { queryKey: goalQueryKeys.lists() },
        (oldData: Goal[] | undefined) => {
          if (!oldData) return oldData
          return oldData.map(goal =>
            goal.id === goalId ? updatedGoal : goal
          )
        }
      )

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.hierarchy(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.stats(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.insights(userId) })
    },
  })
}

/**
 * Delete a goal
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, goalId }: { userId: string; goalId: string }) =>
      GoalsService.deleteGoal(userId, goalId),

    onSuccess: (_, { userId, goalId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: goalQueryKeys.detail(goalId) })
      queryClient.removeQueries({ queryKey: goalQueryKeys.progressLogs(goalId) })

      // Remove from list queries
      queryClient.setQueriesData(
        { queryKey: goalQueryKeys.lists() },
        (oldData: Goal[] | undefined) => {
          if (!oldData) return oldData
          return oldData.filter(goal => goal.id !== goalId)
        }
      )

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.hierarchy(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.stats(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.insights(userId) })
    },
  })
}

/**
 * Log progress for a goal
 */
export function useLogGoalProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, update }: { userId: string; update: GoalProgressUpdate }) =>
      GoalsService.logProgress(userId, update),

    onSuccess: (progressLog, { userId, update }) => {
      // Invalidate progress logs
      queryClient.invalidateQueries({
        queryKey: goalQueryKeys.progressLogs(update.goal_id)
      })

      // Invalidate the goal to get updated progress
      queryClient.invalidateQueries({
        queryKey: goalQueryKeys.detail(update.goal_id)
      })

      // Invalidate lists to update progress in lists
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.hierarchy(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.stats(userId) })
    },
  })
}

/**
 * Create goal from template
 */
export function useCreateGoalFromTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      input
    }: {
      userId: string
      input: CreateGoalFromTemplateInput
    }) => GoalsService.createGoalFromTemplate(userId, input),

    onSuccess: (newGoal, { userId }) => {
      // Same invalidation as create goal
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.hierarchy(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.stats(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.insights(userId) })
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.templates(userId) })
    },
  })
}

/**
 * Create goal alignment
 */
export function useCreateGoalAlignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      parentGoalId,
      childGoalId,
      alignmentStrength,
      contributionPercentage
    }: {
      userId: string
      parentGoalId: string
      childGoalId: string
      alignmentStrength?: number
      contributionPercentage?: number
    }) => GoalsService.createGoalAlignment(
      userId,
      parentGoalId,
      childGoalId,
      alignmentStrength,
      contributionPercentage
    ),

    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.hierarchy(userId) })
    },
  })
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Check if user has any active goals
 */
export function useHasActiveGoals(userId: string) {
  const { data: goals = [] } = useGoals(userId, { status: ['active'] })
  return goals.length > 0
}

/**
 * Get goal completion percentage for a specific time period
 */
export function useGoalCompletionRate(userId: string) {
  const { data: stats } = useGoalStats(userId)
  return {
    thisMonth: stats?.completion_rate_this_month || 0,
    lastMonth: stats?.completion_rate_last_month || 0,
  }
}

/**
 * Get goals due soon (next 7 days)
 */
export function useGoalsDueSoon(userId: string) {
  return useGoals(userId, {
    status: ['active'],
    due_soon: true
  })
}

/**
 * Get goal hierarchy for a specific parent goal
 */
export function useGoalTree(userId: string, rootGoalId?: string) {
  const { data: hierarchy } = useGoalHierarchy(userId)

  if (!hierarchy || !rootGoalId) return hierarchy

  // Filter hierarchy to show only the specified goal tree
  const filterGoalTree = (goals: Goal[], parentId: string | undefined): Goal[] => {
    return goals.filter(goal => goal.parent_goal_id === parentId)
  }

  return {
    monthly_goals: hierarchy.monthly_goals.filter(g => g.id === rootGoalId),
    weekly_goals: filterGoalTree(hierarchy.weekly_goals, rootGoalId),
    daily_goals: hierarchy.daily_goals.filter(g =>
      hierarchy.weekly_goals.some(w =>
        w.parent_goal_id === rootGoalId && g.parent_goal_id === w.id
      )
    ),
    alignments: hierarchy.alignments.filter(a =>
      a.parent_goal_id === rootGoalId ||
      hierarchy.weekly_goals.some(w =>
        w.parent_goal_id === rootGoalId && a.parent_goal_id === w.id
      )
    )
  }
}

/**
 * Optimistic goal updates for better UX
 */
export function useOptimisticGoalUpdate() {
  const queryClient = useQueryClient()

  return {
    updateGoalOptimistically: (goalId: string, updates: Partial<Goal>) => {
      // Update goal in detail cache
      queryClient.setQueryData(
        goalQueryKeys.detail(goalId),
        (oldGoal: Goal | undefined) => {
          if (!oldGoal) return oldGoal
          return { ...oldGoal, ...updates }
        }
      )

      // Update goal in list caches
      queryClient.setQueriesData(
        { queryKey: goalQueryKeys.lists() },
        (oldData: Goal[] | undefined) => {
          if (!oldData) return oldData
          return oldData.map(goal =>
            goal.id === goalId ? { ...goal, ...updates } : goal
          )
        }
      )
    }
  }
}