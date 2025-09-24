// Goals Service - Hierarchical SMART Goals System
// Handles CRUD operations, hierarchy management, and SMART goals framework

import { supabase } from './supabase'
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

  /**
   * Create a new goal with SMART criteria
   */
  static async createGoal(userId: string, input: CreateGoalInput): Promise<Goal> {
    // Calculate hierarchy level based on parent
    let hierarchy_level = 0
    if (input.parent_goal_id) {
      const { data: parent } = await supabase
        .from('goals')
        .select('hierarchy_level')
        .eq('id', input.parent_goal_id)
        .single()

      if (parent) {
        hierarchy_level = parent.hierarchy_level + 1
      }
    }

    // Validate goal type vs hierarchy level
    this.validateGoalTypeHierarchy(input.goal_type, hierarchy_level)

    const goalData = {
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
      time_bound: input.time_bound.toISOString(),

      // Progress
      target_value: input.target_value,
      unit: input.unit,
      progress_percentage: 0,

      // Scheduling
      start_date: (input.start_date || new Date()).toISOString().split('T')[0],
      target_date: input.target_date.toISOString().split('T')[0],

      // Metadata
      priority: input.priority || 3,
      difficulty: input.difficulty || 3,
      energy_required: input.energy_required || 3,
      notes: input.notes,
      tags: input.tags || [],
      milestones: this.processMilestones(input.milestones || [])
    }

    const { data, error } = await supabase
      .from('goals')
      .insert(goalData)
      .select()
      .single()

    if (error) throw error

    // Create alignment if this has a parent
    if (input.parent_goal_id) {
      await this.createGoalAlignment(userId, input.parent_goal_id, data.id)
    }

    return this.transformGoalFromDb(data)
  }

  /**
   * Get goal by ID with optional child goals
   */
  static async getGoal(userId: string, goalId: string, includeChildren = false): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('id', goalId)
      .single()

    if (error || !data) return null

    let goal = this.transformGoalFromDb(data)

    if (includeChildren) {
      goal.child_goals = await this.getChildGoals(userId, goalId)
    }

    return goal
  }

  /**
   * Get all goals for user with filters
   */
  static async getGoals(userId: string, filters: GoalFilters = {}): Promise<Goal[]> {
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.goal_type?.length) {
      query = query.in('goal_type', filters.goal_type)
    }

    if (filters.category?.length) {
      query = query.in('category', filters.category)
    }

    if (filters.priority?.length) {
      query = query.in('priority', filters.priority)
    }

    if (filters.parent_goal_id) {
      query = query.eq('parent_goal_id', filters.parent_goal_id)
    }

    if (filters.due_soon) {
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      query = query.lte('target_date', sevenDaysFromNow.toISOString().split('T')[0])
    }

    if (filters.overdue) {
      const today = new Date().toISOString().split('T')[0]
      query = query.lt('target_date', today).eq('status', 'active')
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
    }

    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }

    // Order by hierarchy level, then priority, then target date
    query = query.order('hierarchy_level').order('priority').order('target_date')

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(this.transformGoalFromDb)
  }

  /**
   * Update goal
   */
  static async updateGoal(userId: string, goalId: string, updates: UpdateGoalInput): Promise<Goal> {
    const updateData: any = { ...updates }

    // Handle date formatting
    if (updates.time_bound) {
      updateData.time_bound = updates.time_bound.toISOString()
    }
    if (updates.start_date) {
      updateData.start_date = updates.start_date.toISOString().split('T')[0]
    }
    if (updates.target_date) {
      updateData.target_date = updates.target_date.toISOString().split('T')[0]
    }
    if (updates.completion_date) {
      updateData.completion_date = updates.completion_date.toISOString().split('T')[0]
    }

    // Auto-complete if progress reaches 100%
    if (updates.progress_percentage === 100 && !updates.status) {
      updateData.status = 'completed'
      updateData.completion_date = new Date().toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('user_id', userId)
      .eq('id', goalId)
      .select()
      .single()

    if (error) throw error

    // Update parent goal progress if this goal has a parent
    const goal = this.transformGoalFromDb(data)
    if (goal.parent_goal_id) {
      await this.updateParentGoalProgress(userId, goal.parent_goal_id)
    }

    return goal
  }

  /**
   * Delete goal (with cascade to children)
   */
  static async deleteGoal(userId: string, goalId: string): Promise<void> {
    // First delete all child goals
    const children = await this.getChildGoals(userId, goalId)
    for (const child of children) {
      await this.deleteGoal(userId, child.id)
    }

    // Delete alignments
    await supabase
      .from('goal_alignments')
      .delete()
      .eq('user_id', userId)
      .or(`parent_goal_id.eq.${goalId},child_goal_id.eq.${goalId}`)

    // Delete progress logs
    await supabase
      .from('goal_progress_logs')
      .delete()
      .eq('user_id', userId)
      .eq('goal_id', goalId)

    // Delete the goal
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('user_id', userId)
      .eq('id', goalId)

    if (error) throw error
  }

  // ============================================================================
  // HIERARCHY MANAGEMENT
  // ============================================================================

  /**
   * Get hierarchical view of goals (monthly → weekly → daily)
   */
  static async getGoalHierarchy(userId: string): Promise<GoalHierarchyView> {
    const [monthlyGoals, weeklyGoals, dailyGoals, alignments] = await Promise.all([
      this.getGoals(userId, { goal_type: ['monthly'] }),
      this.getGoals(userId, { goal_type: ['weekly'] }),
      this.getGoals(userId, { goal_type: ['daily'] }),
      this.getGoalAlignments(userId)
    ])

    return {
      monthly_goals: monthlyGoals,
      weekly_goals: weeklyGoals,
      daily_goals: dailyGoals,
      alignments
    }
  }

  /**
   * Get child goals for a parent goal
   */
  static async getChildGoals(userId: string, parentGoalId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('parent_goal_id', parentGoalId)
      .is('archived_at', null)
      .order('target_date')

    if (error) throw error
    return (data || []).map(this.transformGoalFromDb)
  }

  /**
   * Create goal alignment between parent and child
   */
  static async createGoalAlignment(
    userId: string,
    parentGoalId: string,
    childGoalId: string,
    alignmentStrength = 8,
    contributionPercentage = 25
  ): Promise<GoalAlignment> {
    const { data, error } = await supabase
      .from('goal_alignments')
      .insert({
        user_id: userId,
        parent_goal_id: parentGoalId,
        child_goal_id: childGoalId,
        alignment_strength: alignmentStrength,
        contribution_percentage: contributionPercentage
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get all goal alignments for user
   */
  static async getGoalAlignments(userId: string): Promise<GoalAlignment[]> {
    const { data, error } = await supabase
      .from('goal_alignments')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  /**
   * Update parent goal progress based on child goals
   */
  static async updateParentGoalProgress(userId: string, parentGoalId: string): Promise<void> {
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
  }

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  /**
   * Log progress for a goal
   */
  static async logProgress(userId: string, input: GoalProgressUpdate): Promise<GoalProgressLog> {
    // Get current goal state
    const goal = await this.getGoal(userId, input.goal_id)
    if (!goal) throw new Error('Goal not found')

    const cumulativeValue = (goal.current_value || 0) + input.progress_value
    const percentage = goal.target_value
      ? Math.min(100, Math.round((cumulativeValue / goal.target_value) * 100))
      : goal.progress_percentage

    // Create progress log
    const { data: logData, error: logError } = await supabase
      .from('goal_progress_logs')
      .insert({
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
        energy_level: input.energy_level
      })
      .select()
      .single()

    if (logError) throw logError

    // Update goal with new progress
    await this.updateGoal(userId, input.goal_id, {
      current_value: cumulativeValue,
      progress_percentage: percentage
    })

    return logData
  }

  /**
   * Get progress logs for a goal
   */
  static async getProgressLogs(userId: string, goalId: string): Promise<GoalProgressLog[]> {
    const { data, error } = await supabase
      .from('goal_progress_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_id', goalId)
      .order('log_date', { ascending: false })

    if (error) throw error
    return data || []
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  /**
   * Get goal templates (user's + public)
   */
  static async getGoalTemplates(userId: string): Promise<GoalTemplate[]> {
    const { data, error } = await supabase
      .from('goal_templates')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .order('times_used', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Create goal from template
   */
  static async createGoalFromTemplate(
    userId: string,
    input: CreateGoalFromTemplateInput
  ): Promise<Goal> {
    const template = await supabase
      .from('goal_templates')
      .select('*')
      .eq('id', input.template_id)
      .single()

    if (!template.data) throw new Error('Template not found')

    const t = template.data

    // Calculate target date
    const startDate = input.start_date || new Date()
    const targetDate = input.target_date || new Date(
      startDate.getTime() + t.time_bound_default_days * 24 * 60 * 60 * 1000
    )

    const goalInput: CreateGoalInput = {
      title: input.title || t.name,
      description: t.description,
      category: t.category,
      goal_type: t.goal_type,

      specific: input.customizations?.specific || t.specific_template,
      measurable: input.customizations?.measurable || t.measurable_template,
      achievable: input.customizations?.achievable || t.achievable_template,
      relevant: input.customizations?.relevant || t.relevant_template,
      time_bound: targetDate,

      target_value: input.target_value || t.default_target_value,
      unit: t.default_unit,
      start_date: startDate,
      target_date: targetDate,
      priority: t.default_priority,
      milestones: t.suggested_milestones
    }

    // Update template usage count
    await supabase
      .from('goal_templates')
      .update({ times_used: t.times_used + 1 })
      .eq('id', input.template_id)

    return this.createGoal(userId, goalInput)
  }

  // ============================================================================
  // STATISTICS AND INSIGHTS
  // ============================================================================

  /**
   * Get goal statistics
   */
  static async getGoalStats(userId: string): Promise<GoalStats> {
    const goals = await this.getGoals(userId)

    const stats: GoalStats = {
      total_goals: goals.length,
      active_goals: goals.filter(g => g.status === 'active').length,
      completed_goals: goals.filter(g => g.status === 'completed').length,
      paused_goals: goals.filter(g => g.status === 'paused').length,
      cancelled_goals: goals.filter(g => g.status === 'cancelled').length,

      monthly_goals: goals.filter(g => g.goal_type === 'monthly').length,
      weekly_goals: goals.filter(g => g.goal_type === 'weekly').length,
      daily_goals: goals.filter(g => g.goal_type === 'daily').length,

      average_progress: Math.round(
        goals.reduce((sum, g) => sum + g.progress_percentage, 0) / goals.length || 0
      ),
      on_track_goals: goals.filter(g => this.isGoalOnTrack(g)).length,
      behind_goals: goals.filter(g => this.isGoalBehind(g)).length,
      ahead_goals: goals.filter(g => this.isGoalAhead(g)).length,

      due_today: goals.filter(g => this.isDueToday(g)).length,
      due_this_week: goals.filter(g => this.isDueThisWeek(g)).length,
      overdue_goals: goals.filter(g => this.isOverdue(g)).length,

      completion_rate_this_month: await this.getCompletionRate(userId, 'month'),
      completion_rate_last_month: await this.getCompletionRate(userId, 'month', -1),

      current_daily_streak: await this.getDailyStreak(userId),
      longest_daily_streak: await this.getLongestDailyStreak(userId)
    }

    return stats
  }

  /**
   * Generate AI insights for goals
   */
  static async generateInsights(userId: string): Promise<GoalInsight[]> {
    const goals = await this.getGoals(userId, { status: ['active'] })
    const insights: GoalInsight[] = []

    for (const goal of goals) {
      // Check for overdue goals
      if (this.isOverdue(goal)) {
        insights.push({
          type: 'warning',
          title: 'Overdue Goal',
          description: `"${goal.title}" is past its target date. Consider adjusting the timeline or breaking it into smaller tasks.`,
          goal_id: goal.id,
          priority: 'high',
          action_required: true,
          created_at: new Date()
        })
      }

      // Check for goals that need breakdown
      if (goal.goal_type === 'monthly' && !goal.child_goals?.length) {
        insights.push({
          type: 'suggestion',
          title: 'Break Down Monthly Goal',
          description: `Consider breaking "${goal.title}" into weekly and daily sub-goals for better tracking.`,
          goal_id: goal.id,
          priority: 'medium',
          action_required: false,
          created_at: new Date()
        })
      }

      // Check for milestones approaching
      const upcomingMilestone = goal.milestones.find(m =>
        !m.completed &&
        new Date(goal.start_date.getTime() + m.target_date * 24 * 60 * 60 * 1000) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      )

      if (upcomingMilestone) {
        insights.push({
          type: 'milestone',
          title: 'Upcoming Milestone',
          description: `Milestone "${upcomingMilestone.title}" for "${goal.title}" is due soon.`,
          goal_id: goal.id,
          priority: 'medium',
          action_required: true,
          created_at: new Date()
        })
      }
    }

    return insights
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static transformGoalFromDb(data: any): Goal {
    return {
      ...data,
      start_date: new Date(data.start_date),
      target_date: new Date(data.target_date),
      time_bound: new Date(data.time_bound),
      completion_date: data.completion_date ? new Date(data.completion_date) : undefined,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      archived_at: data.archived_at ? new Date(data.archived_at) : undefined,
      tags: data.tags || [],
      milestones: data.milestones || []
    }
  }

  private static processMilestones(milestones: any[]): any[] {
    return milestones.map(m => ({
      ...m,
      id: crypto.randomUUID(),
      completed: false
    }))
  }

  private static validateGoalTypeHierarchy(goalType: GoalType, hierarchyLevel: number): void {
    const validCombinations = {
      monthly: [0],
      weekly: [0, 1],
      daily: [0, 1, 2],
      'one-time': [0, 1, 2, 3],
      'long-term': [0]
    }

    if (!validCombinations[goalType].includes(hierarchyLevel)) {
      throw new Error(`Invalid goal type "${goalType}" for hierarchy level ${hierarchyLevel}`)
    }
  }

  private static isGoalOnTrack(goal: Goal): boolean {
    const now = new Date()
    const start = goal.start_date
    const end = goal.target_date
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

    return Math.abs(goal.progress_percentage - expectedProgress) <= 10
  }

  private static isGoalBehind(goal: Goal): boolean {
    const now = new Date()
    const start = goal.start_date
    const end = goal.target_date
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

    return goal.progress_percentage < expectedProgress - 10
  }

  private static isGoalAhead(goal: Goal): boolean {
    const now = new Date()
    const start = goal.start_date
    const end = goal.target_date
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

    return goal.progress_percentage > expectedProgress + 10
  }

  private static isDueToday(goal: Goal): boolean {
    const today = new Date().toISOString().split('T')[0]
    const targetDate = goal.target_date.toISOString().split('T')[0]
    return targetDate === today && goal.status === 'active'
  }

  private static isDueThisWeek(goal: Goal): boolean {
    const now = new Date()
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
    return goal.target_date <= endOfWeek && goal.status === 'active'
  }

  private static isOverdue(goal: Goal): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return goal.target_date < today && goal.status === 'active'
  }

  private static async getCompletionRate(userId: string, period: 'week' | 'month', offset = 0): Promise<number> {
    const now = new Date()
    let startDate: Date, endDate: Date

    if (period === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (offset * 7))
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
    }

    const { data, error } = await supabase
      .from('goals')
      .select('status')
      .eq('user_id', userId)
      .gte('target_date', startDate.toISOString().split('T')[0])
      .lte('target_date', endDate.toISOString().split('T')[0])

    if (error || !data) return 0

    const total = data.length
    const completed = data.filter(g => g.status === 'completed').length

    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  private static async getDailyStreak(userId: string): Promise<number> {
    // Get daily goals completed in sequence
    const { data, error } = await supabase
      .from('goals')
      .select('completion_date')
      .eq('user_id', userId)
      .eq('goal_type', 'daily')
      .eq('status', 'completed')
      .not('completion_date', 'is', null)
      .order('completion_date', { ascending: false })

    if (error || !data) return 0

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const goal of data) {
      const completionDate = new Date(goal.completion_date)
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

  private static async getLongestDailyStreak(userId: string): Promise<number> {
    // Implementation would analyze historical daily goal completions
    // For now, return a placeholder
    return 0
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