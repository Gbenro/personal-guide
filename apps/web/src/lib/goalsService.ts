// Enhanced stub for goals service with localStorage persistence
// TODO: Replace with full PostgreSQL implementation

// Simple localStorage-based storage for goals
class GoalStorage {
  private static GOALS_KEY = 'pg_user_goals'
  private static PROGRESS_KEY = 'pg_goal_progress'
  private static ALIGNMENTS_KEY = 'pg_goal_alignments'

  static getUserGoals(userId: string): Goal[] {
    try {
      const goals = localStorage.getItem(`${this.GOALS_KEY}_${userId}`)
      return goals ? JSON.parse(goals) : []
    } catch (error) {
      console.warn('Failed to load goals from localStorage:', error)
      return []
    }
  }

  static saveUserGoals(userId: string, goals: Goal[]): void {
    try {
      localStorage.setItem(`${this.GOALS_KEY}_${userId}`, JSON.stringify(goals))
    } catch (error) {
      console.warn('Failed to save goals to localStorage:', error)
    }
  }

  static addUserGoal(userId: string, goal: Goal): void {
    const existingGoals = this.getUserGoals(userId)
    const updatedGoals = [...existingGoals, goal]
    this.saveUserGoals(userId, updatedGoals)
  }

  static updateUserGoal(userId: string, goalId: string, updates: Partial<Goal>): Goal | null {
    const existingGoals = this.getUserGoals(userId)
    const goalIndex = existingGoals.findIndex(g => g.id === goalId)

    if (goalIndex === -1) return null

    const updatedGoal = { ...existingGoals[goalIndex], ...updates, updated_at: new Date() }
    existingGoals[goalIndex] = updatedGoal
    this.saveUserGoals(userId, existingGoals)
    return updatedGoal
  }

  static removeUserGoal(userId: string, goalId: string): void {
    const existingGoals = this.getUserGoals(userId)
    const updatedGoals = existingGoals.filter(g => g.id !== goalId)
    this.saveUserGoals(userId, updatedGoals)
  }

  static getProgressLogs(userId: string): GoalProgressLog[] {
    try {
      const logs = localStorage.getItem(`${this.PROGRESS_KEY}_${userId}`)
      return logs ? JSON.parse(logs) : []
    } catch (error) {
      console.warn('Failed to load progress logs from localStorage:', error)
      return []
    }
  }

  static saveProgressLogs(userId: string, logs: GoalProgressLog[]): void {
    try {
      localStorage.setItem(`${this.PROGRESS_KEY}_${userId}`, JSON.stringify(logs))
    } catch (error) {
      console.warn('Failed to save progress logs to localStorage:', error)
    }
  }

  static addProgressLog(userId: string, log: GoalProgressLog): void {
    const existingLogs = this.getProgressLogs(userId)
    const updatedLogs = [...existingLogs, log]
    this.saveProgressLogs(userId, updatedLogs)
  }
}

import type {
  Goal,
  GoalProgressLog,
  GoalAlignment,
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
  GoalRecommendation,
  GoalAnalytics,
  GoalType,
  GoalStatus,
  GoalCategory
} from '@/types/goals'

export class GoalsService {
  // ============================================================================
  // CORE CRUD OPERATIONS
  // ============================================================================

  static async createGoal(userId: string, input: CreateGoalInput): Promise<Goal> {
    console.log('🔥 [ENHANCED STUB] createGoal called with:', { userId, input })

    if (typeof window === 'undefined') {
      console.log('Server-side, cannot create goal')
      throw new Error('Cannot create goal on server-side')
    }

    // Calculate hierarchy level based on parent
    let hierarchy_level = 0
    if (input.parent_goal_id) {
      const existingGoals = GoalStorage.getUserGoals(userId)
      const parent = existingGoals.find(g => g.id === input.parent_goal_id)
      if (parent) {
        hierarchy_level = parent.hierarchy_level + 1
      }
    }

    // Create goal
    const newGoal: Goal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      title: input.title,
      description: input.description,
      category: input.category,
      goal_type: input.goal_type,
      parent_goal_id: input.parent_goal_id,
      hierarchy_level,

      // SMART criteria
      specific: input.specific,
      measurable: input.measurable,
      achievable: input.achievable,
      relevant: input.relevant,
      time_bound: input.time_bound,

      // Progress
      target_value: input.target_value,
      current_value: 0,
      unit: input.unit,
      progress_percentage: 0,
      status: 'active',

      // Scheduling
      start_date: input.start_date || new Date(),
      target_date: input.target_date,

      // Metadata
      priority: input.priority || 3,
      difficulty: input.difficulty || 3,
      energy_required: input.energy_required || 3,
      notes: input.notes,
      tags: input.tags || [],
      milestones: input.milestones?.map((m, i) => ({
        ...m,
        id: `milestone-${Date.now()}-${i}`,
        completed: false
      })) || [],

      created_at: new Date(),
      updated_at: new Date(),
      completion_date: undefined,
      archived_at: undefined
    }

    // Save to localStorage
    GoalStorage.addUserGoal(userId, newGoal)

    console.log('✅ [ENHANCED STUB] Created and saved goal:', newGoal)
    return newGoal
  }

  static async getGoal(userId: string, goalId: string, includeChildren = false): Promise<Goal | null> {
    console.log('🔥 [ENHANCED STUB] getGoal called with:', { userId, goalId, includeChildren })

    if (typeof window === 'undefined') {
      return null
    }

    const goals = GoalStorage.getUserGoals(userId)
    const goal = goals.find(g => g.id === goalId)

    if (!goal) {
      console.log('Goal not found')
      return null
    }

    if (includeChildren) {
      const childGoals = goals.filter(g => g.parent_goal_id === goalId)
      goal.child_goals = childGoals
    }

    console.log(`Found goal: ${goal.title}`)
    return goal
  }

  static async getGoals(userId: string, filters: GoalFilters = {}): Promise<Goal[]> {
    console.log('🔥 [ENHANCED STUB] getGoals called for userId:', userId)

    if (typeof window === 'undefined') {
      console.log('Server-side, returning empty array')
      return []
    }

    let goals = GoalStorage.getUserGoals(userId).filter(g => !g.archived_at)
    console.log(`Found ${goals.length} goals for user`)

    // Apply filters
    if (filters.status?.length) {
      goals = goals.filter(g => filters.status!.includes(g.status))
    }

    if (filters.goal_type?.length) {
      goals = goals.filter(g => filters.goal_type!.includes(g.goal_type))
    }

    if (filters.category?.length) {
      goals = goals.filter(g => filters.category!.includes(g.category))
    }

    if (filters.priority?.length) {
      goals = goals.filter(g => filters.priority!.includes(g.priority))
    }

    if (filters.parent_goal_id) {
      goals = goals.filter(g => g.parent_goal_id === filters.parent_goal_id)
    }

    if (filters.due_soon) {
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      goals = goals.filter(g => new Date(g.target_date) <= sevenDaysFromNow)
    }

    if (filters.overdue) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      goals = goals.filter(g => new Date(g.target_date) < today && g.status === 'active')
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      goals = goals.filter(g =>
        g.title.toLowerCase().includes(searchLower) ||
        (g.description && g.description.toLowerCase().includes(searchLower)) ||
        (g.notes && g.notes.toLowerCase().includes(searchLower))
      )
    }

    if (filters.tags?.length) {
      goals = goals.filter(g =>
        filters.tags!.some(tag => g.tags.includes(tag))
      )
    }

    // Sort by hierarchy level, then priority, then target date
    goals.sort((a, b) => {
      if (a.hierarchy_level !== b.hierarchy_level) {
        return a.hierarchy_level - b.hierarchy_level
      }
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    })

    return goals
  }

  static async updateGoal(userId: string, goalId: string, updates: UpdateGoalInput): Promise<Goal> {
    console.log('🔥 [ENHANCED STUB] updateGoal called with:', { userId, goalId, updates })

    if (typeof window === 'undefined') {
      throw new Error('Cannot update goal on server-side')
    }

    // Auto-complete if progress reaches 100%
    if (updates.progress_percentage === 100 && !updates.status) {
      updates.status = 'completed'
      updates.completion_date = new Date()
    }

    const updatedGoal = GoalStorage.updateUserGoal(userId, goalId, updates)
    if (!updatedGoal) {
      throw new Error('Goal not found')
    }

    // Update parent goal progress if this goal has a parent
    if (updatedGoal.parent_goal_id) {
      await this.updateParentGoalProgress(userId, updatedGoal.parent_goal_id)
    }

    console.log('✅ [ENHANCED STUB] Updated goal:', updatedGoal)
    return updatedGoal
  }

  static async deleteGoal(userId: string, goalId: string): Promise<void> {
    console.log('🔥 [ENHANCED STUB] deleteGoal called with:', { userId, goalId })

    if (typeof window === 'undefined') {
      console.log('Server-side, cannot delete goal')
      return
    }

    // First delete all child goals
    const goals = GoalStorage.getUserGoals(userId)
    const childGoals = goals.filter(g => g.parent_goal_id === goalId)

    for (const child of childGoals) {
      await this.deleteGoal(userId, child.id)
    }

    // Delete progress logs for this goal
    const progressLogs = GoalStorage.getProgressLogs(userId)
    const filteredLogs = progressLogs.filter(log => log.goal_id !== goalId)
    GoalStorage.saveProgressLogs(userId, filteredLogs)

    // Delete the goal
    GoalStorage.removeUserGoal(userId, goalId)
    console.log('✅ [ENHANCED STUB] Deleted goal:', goalId)
  }

  // ============================================================================
  // HIERARCHY MANAGEMENT
  // ============================================================================

  static async getGoalHierarchy(userId: string): Promise<GoalHierarchyView> {
    console.log('🔥 [ENHANCED STUB] getGoalHierarchy called for userId:', userId)

    const [monthlyGoals, weeklyGoals, dailyGoals] = await Promise.all([
      this.getGoals(userId, { goal_type: ['monthly'] }),
      this.getGoals(userId, { goal_type: ['weekly'] }),
      this.getGoals(userId, { goal_type: ['daily'] })
    ])

    return {
      monthly_goals: monthlyGoals,
      weekly_goals: weeklyGoals,
      daily_goals: dailyGoals,
      alignments: [] // Would need separate alignment tracking
    }
  }

  static async getChildGoals(userId: string, parentGoalId: string): Promise<Goal[]> {
    console.log('🔥 [ENHANCED STUB] getChildGoals called with:', { userId, parentGoalId })

    if (typeof window === 'undefined') {
      return []
    }

    const goals = GoalStorage.getUserGoals(userId)
    const childGoals = goals.filter(g =>
      g.parent_goal_id === parentGoalId && !g.archived_at
    ).sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())

    console.log(`Found ${childGoals.length} child goals`)
    return childGoals
  }

  static async createGoalAlignment(
    userId: string,
    parentGoalId: string,
    childGoalId: string,
    alignmentStrength = 8,
    contributionPercentage = 25
  ): Promise<GoalAlignment> {
    console.log('Create goal alignment stub called - not implemented yet')
    throw new Error('Goal alignment creation not yet implemented')
  }

  static async getGoalAlignments(userId: string): Promise<GoalAlignment[]> {
    console.log('Get goal alignments stub called - returning empty alignments')
    return []
  }

  static async updateParentGoalProgress(userId: string, parentGoalId: string): Promise<void> {
    console.log('🔥 [ENHANCED STUB] updateParentGoalProgress called with:', { userId, parentGoalId })

    if (typeof window === 'undefined') {
      return
    }

    const childGoals = await this.getChildGoals(userId, parentGoalId)

    if (childGoals.length === 0) return

    // Calculate weighted average progress
    const totalWeight = childGoals.reduce((sum, child) => sum + (child.priority || 3), 0)
    const weightedProgress = childGoals.reduce((sum, child) => {
      const weight = child.priority || 3
      return sum + (child.progress_percentage * weight)
    }, 0)

    const averageProgress = Math.round(weightedProgress / totalWeight)

    await this.updateGoal(userId, parentGoalId, {
      progress_percentage: averageProgress
    })

    console.log(`✅ Updated parent goal progress to ${averageProgress}%`)
  }

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  static async logProgress(userId: string, input: GoalProgressUpdate): Promise<GoalProgressLog> {
    console.log('🔥 [ENHANCED STUB] logProgress called with:', { userId, input })

    if (typeof window === 'undefined') {
      throw new Error('Cannot log progress on server-side')
    }

    // Get current goal state
    const goal = await this.getGoal(userId, input.goal_id)
    if (!goal) throw new Error('Goal not found')

    const cumulativeValue = (goal.current_value || 0) + input.progress_value
    const percentage = goal.target_value
      ? Math.min(100, Math.round((cumulativeValue / goal.target_value) * 100))
      : goal.progress_percentage

    // Create progress log
    const progressLog: GoalProgressLog = {
      id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      goal_id: input.goal_id,
      user_id: userId,
      progress_value: input.progress_value,
      cumulative_value: cumulativeValue,
      percentage,
      notes: input.notes,
      reflection: input.reflection,
      challenges: input.challenges,
      next_actions: input.next_actions,
      mood: input.mood,
      energy_level: input.energy_level,
      log_date: new Date(),
      created_at: new Date()
    }

    // Save progress log
    GoalStorage.addProgressLog(userId, progressLog)

    // Update goal with new progress
    await this.updateGoal(userId, input.goal_id, {
      current_value: cumulativeValue,
      progress_percentage: percentage
    })

    console.log('✅ [ENHANCED STUB] Logged progress:', progressLog)
    return progressLog
  }

  static async getProgressLogs(userId: string, goalId: string): Promise<GoalProgressLog[]> {
    console.log('🔥 [ENHANCED STUB] getProgressLogs called with:', { userId, goalId })

    if (typeof window === 'undefined') {
      return []
    }

    const allLogs = GoalStorage.getProgressLogs(userId)
    const goalLogs = allLogs
      .filter(log => log.goal_id === goalId)
      .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())

    console.log(`Found ${goalLogs.length} progress logs for goal`)
    return goalLogs
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  static async getGoalTemplates(userId: string): Promise<GoalTemplate[]> {
    console.log('Goal templates stub called - returning empty templates')
    return []
  }

  static async createGoalFromTemplate(
    userId: string,
    input: CreateGoalFromTemplateInput
  ): Promise<Goal> {
    console.log('Create goal from template stub called - not implemented yet')
    throw new Error('Create goal from template not yet implemented')
  }

  // ============================================================================
  // STATISTICS AND INSIGHTS
  // ============================================================================

  static async getGoalStats(userId: string): Promise<GoalStats> {
    console.log('🔥 [ENHANCED STUB] getGoalStats called for userId:', userId)

    if (typeof window === 'undefined') {
      return this.getEmptyStats()
    }

    const goals = GoalStorage.getUserGoals(userId).filter(g => !g.archived_at)
    console.log(`Calculating stats for ${goals.length} goals`)

    const activeGoals = goals.filter(g => g.status === 'active')
    const completedGoals = goals.filter(g => g.status === 'completed')
    const pausedGoals = goals.filter(g => g.status === 'paused')
    const cancelledGoals = goals.filter(g => g.status === 'cancelled')

    const monthlyGoals = goals.filter(g => g.goal_type === 'monthly')
    const weeklyGoals = goals.filter(g => g.goal_type === 'weekly')
    const dailyGoals = goals.filter(g => g.goal_type === 'daily')

    const averageProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length)
      : 0

    const onTrackGoals = activeGoals.filter(g => this.isGoalOnTrack(g))
    const behindGoals = activeGoals.filter(g => this.isGoalBehind(g))
    const aheadGoals = activeGoals.filter(g => this.isGoalAhead(g))

    const dueToday = activeGoals.filter(g => this.isDueToday(g))
    const dueThisWeek = activeGoals.filter(g => this.isDueThisWeek(g))
    const overdueGoals = activeGoals.filter(g => this.isOverdue(g))

    const stats: GoalStats = {
      total_goals: goals.length,
      active_goals: activeGoals.length,
      completed_goals: completedGoals.length,
      paused_goals: pausedGoals.length,
      cancelled_goals: cancelledGoals.length,

      monthly_goals: monthlyGoals.length,
      weekly_goals: weeklyGoals.length,
      daily_goals: dailyGoals.length,

      average_progress: averageProgress,
      on_track_goals: onTrackGoals.length,
      behind_goals: behindGoals.length,
      ahead_goals: aheadGoals.length,

      due_today: dueToday.length,
      due_this_week: dueThisWeek.length,
      overdue_goals: overdueGoals.length,

      completion_rate_this_month: this.calculateCompletionRate(completedGoals, 'month', 0),
      completion_rate_last_month: this.calculateCompletionRate(completedGoals, 'month', -1),

      current_daily_streak: this.calculateDailyStreak(dailyGoals),
      longest_daily_streak: this.calculateLongestDailyStreak(dailyGoals)
    }

    console.log('✅ [ENHANCED STUB] Calculated goal stats:', stats)
    return stats
  }

  private static getEmptyStats(): GoalStats {
    return {
      total_goals: 0,
      active_goals: 0,
      completed_goals: 0,
      paused_goals: 0,
      cancelled_goals: 0,
      monthly_goals: 0,
      weekly_goals: 0,
      daily_goals: 0,
      average_progress: 0,
      on_track_goals: 0,
      behind_goals: 0,
      ahead_goals: 0,
      due_today: 0,
      due_this_week: 0,
      overdue_goals: 0,
      completion_rate_this_month: 0,
      completion_rate_last_month: 0,
      current_daily_streak: 0,
      longest_daily_streak: 0
    }
  }

  static async generateInsights(userId: string): Promise<GoalInsight[]> {
    console.log('Generate goal insights stub called - returning empty insights')
    return []
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static isGoalOnTrack(goal: Goal): boolean {
    const now = new Date()
    const start = new Date(goal.start_date)
    const end = new Date(goal.target_date)
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

    return Math.abs(goal.progress_percentage - expectedProgress) <= 10
  }

  private static isGoalBehind(goal: Goal): boolean {
    const now = new Date()
    const start = new Date(goal.start_date)
    const end = new Date(goal.target_date)
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

    return goal.progress_percentage < expectedProgress - 10
  }

  private static isGoalAhead(goal: Goal): boolean {
    const now = new Date()
    const start = new Date(goal.start_date)
    const end = new Date(goal.target_date)
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

    return goal.progress_percentage > expectedProgress + 10
  }

  private static isDueToday(goal: Goal): boolean {
    const today = new Date().toISOString().split('T')[0]
    const targetDate = new Date(goal.target_date).toISOString().split('T')[0]
    return targetDate === today
  }

  private static isDueThisWeek(goal: Goal): boolean {
    const now = new Date()
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
    return new Date(goal.target_date) <= endOfWeek
  }

  private static isOverdue(goal: Goal): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(goal.target_date) < today
  }

  private static calculateCompletionRate(completedGoals: Goal[], period: 'week' | 'month', offset: number): number {
    const now = new Date()
    let startDate: Date, endDate: Date

    if (period === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (offset * 7))
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
    }

    const periodCompletions = completedGoals.filter(g => {
      if (!g.completion_date) return false
      const completionDate = new Date(g.completion_date)
      return completionDate >= startDate && completionDate <= endDate
    })

    // For stub purposes, return length as completion rate
    return periodCompletions.length
  }

  private static calculateDailyStreak(dailyGoals: Goal[]): number {
    const completedDailyGoals = dailyGoals
      .filter(g => g.status === 'completed' && g.completion_date)
      .sort((a, b) => new Date(b.completion_date!).getTime() - new Date(a.completion_date!).getTime())

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const goal of completedDailyGoals) {
      const completionDate = new Date(goal.completion_date!)
      completionDate.setHours(0, 0, 0, 0)

      if (completionDate.getTime() === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (completionDate.getTime() < currentDate.getTime()) {
        break
      }
    }

    return streak
  }

  private static calculateLongestDailyStreak(dailyGoals: Goal[]): number {
    // For stub purposes, return current streak as longest
    return this.calculateDailyStreak(dailyGoals)
  }
}

// Export individual functions for easier use
export const {
  createGoal,
  getGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  getGoalHierarchy,
  getChildGoals,
  createGoalAlignment,
  logProgress,
  getProgressLogs,
  getGoalTemplates,
  createGoalFromTemplate,
  getGoalStats,
  generateInsights
} = GoalsService