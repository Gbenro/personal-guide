import { supabase } from './supabase'
import type {
  BeliefSystem,
  UserBeliefCycle,
  DailyBeliefActivity,
  BeliefMilestone,
  BeliefAffirmation,
  BeliefVisualizationScript,
  CreateBeliefSystemInput,
  CreateBeliefCycleInput,
  UpdateBeliefCycleInput,
  UpdateDailyActivityInput,
  CreateMilestoneInput,
  BeliefSystemFilters,
  BeliefCycleFilters,
  BeliefStats,
  BeliefInsight,
  BeliefProgress,
  BeliefRecommendation,
  BeliefCategory
} from '../types/beliefs'

export class BeliefsService {
  // ============================================================================
  // BELIEF SYSTEMS
  // ============================================================================

  /**
   * Get belief systems (public + user's private systems)
   */
  static async getBeliefSystems(userId: string, filters: BeliefSystemFilters = {}): Promise<BeliefSystem[]> {
    let query = supabase
      .from('belief_systems')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`)

    // Apply filters
    if (filters.category?.length) {
      query = query.in('category', filters.category)
    }

    if (filters.cycle_length) {
      query = query.gte('cycle_length', filters.cycle_length[0])
        .lte('cycle_length', filters.cycle_length[1])
    }

    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,belief_statement.ilike.%${filters.search}%`)
    }

    query = query.order('is_featured', { ascending: false })
      .order('times_completed', { ascending: false })
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(this.transformBeliefSystemFromDb)
  }

  /**
   * Get featured belief systems
   */
  static async getFeaturedBeliefSystems(): Promise<BeliefSystem[]> {
    const { data, error } = await supabase
      .from('belief_systems')
      .select('*')
      .eq('is_featured', true)
      .eq('is_public', true)
      .order('times_completed', { ascending: false })
      .limit(6)

    if (error) throw error
    return (data || []).map(this.transformBeliefSystemFromDb)
  }

  /**
   * Create belief system
   */
  static async createBeliefSystem(userId: string, input: CreateBeliefSystemInput): Promise<BeliefSystem> {
    const { data, error } = await supabase
      .from('belief_systems')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        category: input.category,
        belief_statement: input.belief_statement,
        affirmations: input.affirmations,
        visualization_script: input.visualization_script,
        journaling_prompts: input.journaling_prompts || [],
        daily_activities: input.daily_activities || [],
        cycle_length: input.cycle_length || 21,
        is_public: input.is_public || false,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return this.transformBeliefSystemFromDb(data)
  }

  // ============================================================================
  // USER BELIEF CYCLES
  // ============================================================================

  /**
   * Get user's belief cycles
   */
  static async getUserBeliefCycles(userId: string, filters: BeliefCycleFilters = {}): Promise<UserBeliefCycle[]> {
    let query = supabase
      .from('user_belief_cycles')
      .select(`
        *,
        belief_systems(title, category, belief_statement)
      `)
      .eq('user_id', userId)
      .is('archived_at', null)

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.category?.length) {
      query = query.in('belief_systems.category', filters.category)
    }

    if (filters.start_date_range) {
      query = query.gte('start_date', filters.start_date_range[0].toISOString())
        .lte('start_date', filters.start_date_range[1].toISOString())
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,personal_belief_statement.ilike.%${filters.search}%`)
    }

    query = query.order('status', { ascending: true }) // active first
      .order('start_date', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(this.transformUserBeliefCycleFromDb)
  }

  /**
   * Get single belief cycle
   */
  static async getUserBeliefCycle(userId: string, cycleId: string): Promise<UserBeliefCycle | null> {
    const { data, error } = await supabase
      .from('user_belief_cycles')
      .select(`
        *,
        belief_systems(*)
      `)
      .eq('user_id', userId)
      .eq('id', cycleId)
      .single()

    if (error || !data) return null
    return this.transformUserBeliefCycleFromDb(data)
  }

  /**
   * Create belief cycle from system
   */
  static async createBeliefCycle(userId: string, input: CreateBeliefCycleInput): Promise<UserBeliefCycle> {
    // Get belief system
    const { data: beliefSystem, error: systemError } = await supabase
      .from('belief_systems')
      .select('*')
      .eq('id', input.belief_system_id)
      .single()

    if (systemError || !beliefSystem) throw new Error('Belief system not found')

    // Update system usage
    await supabase
      .from('belief_systems')
      .update({ times_started: beliefSystem.times_started + 1 })
      .eq('id', input.belief_system_id)

    const cycleData = {
      user_id: userId,
      belief_system_id: input.belief_system_id,
      title: input.title || beliefSystem.title,
      personal_belief_statement: input.personal_belief_statement || beliefSystem.belief_statement,
      personal_reason: input.personal_reason,
      status: 'active' as const,
      current_day: 1,
      start_date: new Date().toISOString(),
      target_completion_date: this.calculateTargetDate(beliefSystem.cycle_length),
      days_completed: 0,
      consecutive_days: 0,
      total_activities_completed: 0,
      target_belief_strength: input.target_belief_strength || 10,
      preferred_reminder_time: input.preferred_reminder_time,
      custom_affirmations: input.custom_affirmations || [],
      custom_activities: input.custom_activities || []
    }

    const { data, error } = await supabase
      .from('user_belief_cycles')
      .insert(cycleData)
      .select()
      .single()

    if (error) throw error

    // Create first daily activity record
    await this.createDailyActivityRecord(userId, data.id, 1)

    return this.transformUserBeliefCycleFromDb(data)
  }

  /**
   * Update belief cycle
   */
  static async updateBeliefCycle(userId: string, cycleId: string, updates: UpdateBeliefCycleInput): Promise<UserBeliefCycle> {
    const { data, error } = await supabase
      .from('user_belief_cycles')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', cycleId)
      .select()
      .single()

    if (error) throw error
    return this.transformUserBeliefCycleFromDb(data)
  }

  // ============================================================================
  // DAILY ACTIVITIES
  // ============================================================================

  /**
   * Get daily activity for cycle and day
   */
  static async getDailyActivity(userId: string, cycleId: string, dayNumber: number): Promise<DailyBeliefActivity | null> {
    const { data, error } = await supabase
      .from('daily_belief_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .eq('day_number', dayNumber)
      .single()

    if (error || !data) return null
    return this.transformDailyActivityFromDb(data)
  }

  /**
   * Get recent activities for cycle
   */
  static async getRecentActivities(userId: string, cycleId: string, limit: number = 7): Promise<DailyBeliefActivity[]> {
    const { data, error } = await supabase
      .from('daily_belief_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .order('day_number', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(this.transformDailyActivityFromDb)
  }

  /**
   * Update daily activity
   */
  static async updateDailyActivity(userId: string, cycleId: string, dayNumber: number, updates: UpdateDailyActivityInput): Promise<DailyBeliefActivity> {
    // Get or create daily activity record
    let dailyActivity = await this.getDailyActivity(userId, cycleId, dayNumber)

    if (!dailyActivity) {
      dailyActivity = await this.createDailyActivityRecord(userId, cycleId, dayNumber)
    }

    // Calculate completion percentage
    const completionFields = [
      'read_affirmation_completed',
      'speak_affirmation_completed',
      'visualization_completed',
      'journaling_completed'
    ]

    const updatedData = { ...dailyActivity, ...updates }
    const completedCount = completionFields.filter(field => updatedData[field as keyof typeof updatedData]).length
    const completionPercentage = Math.round((completedCount / completionFields.length) * 100)

    const finalUpdates = {
      ...updates,
      completion_percentage: completionPercentage,
      completed_at: completionPercentage === 100 ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('daily_belief_activities')
      .update(finalUpdates)
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .eq('day_number', dayNumber)
      .select()
      .single()

    if (error) throw error

    // Update cycle progress if day was completed
    if (completionPercentage === 100 && !dailyActivity.completed_at) {
      await this.updateCycleProgress(userId, cycleId, dayNumber)
    }

    return this.transformDailyActivityFromDb(data)
  }

  // ============================================================================
  // STATISTICS AND INSIGHTS
  // ============================================================================

  /**
   * Get belief stats for user
   */
  static async getBeliefStats(userId: string): Promise<BeliefStats> {
    const [cycles, activities] = await Promise.all([
      this.getUserBeliefCycles(userId),
      this.getRecentActivitiesForUser(userId, 30)
    ])

    const activeCycles = cycles.filter(c => c.status === 'active')
    const completedCycles = cycles.filter(c => c.status === 'completed')
    const pausedCycles = cycles.filter(c => c.status === 'paused')

    // Calculate category distribution
    const categoryDistribution = cycles.reduce((acc, cycle) => {
      const category = cycle.belief_systems?.category || 'Personal Growth'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostPracticedCategory = Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as BeliefCategory || 'Personal Growth'

    const stats: BeliefStats = {
      total_cycles: cycles.length,
      active_cycles: activeCycles.length,
      completed_cycles: completedCycles.length,
      paused_cycles: pausedCycles.length,

      total_days_practiced: activities.filter(a => a.completion_percentage === 100).length,
      current_streak: this.calculateCurrentStreak(activities),
      longest_streak: this.calculateLongestStreak(activities),
      average_cycle_completion_rate: this.calculateAverageCompletionRate(cycles),

      average_belief_strength_improvement: this.calculateAverageBeliefImprovement(cycles),
      average_mood_improvement: this.calculateAverageMoodImprovement(activities),
      average_confidence_improvement: this.calculateAverageConfidenceImprovement(activities),

      most_practiced_category: mostPracticedCategory,
      category_distribution: categoryDistribution as Record<BeliefCategory, number>,

      total_affirmations_spoken: activities.reduce((sum, a) => sum + (a.spoken_affirmation_count || 0), 0),
      total_visualization_minutes: activities.reduce((sum, a) => sum + (a.visualization_duration_minutes || 0), 0),
      total_journal_entries: activities.filter(a => a.journal_entry).length,
      average_daily_completion_rate: activities.length > 0 ?
        activities.reduce((sum, a) => sum + a.completion_percentage, 0) / activities.length : 0
    }

    return stats
  }

  /**
   * Generate belief insights
   */
  static async generateBeliefInsights(userId: string): Promise<BeliefInsight[]> {
    const [cycles, stats, recentActivities] = await Promise.all([
      this.getUserBeliefCycles(userId, { status: ['active'] }),
      this.getBeliefStats(userId),
      this.getRecentActivitiesForUser(userId, 7)
    ])

    const insights: BeliefInsight[] = []

    // Progress insights
    if (stats.current_streak >= 7) {
      insights.push({
        type: 'progress',
        title: 'Amazing Streak!',
        description: `You've completed belief work for ${stats.current_streak} consecutive days. This consistency is rewiring your neural pathways!`,
        priority: 'high',
        created_at: new Date()
      })
    }

    // Breakthrough insights
    const highImprovements = recentActivities.filter(a =>
      a.belief_strength_rating && a.belief_strength_rating >= 8
    )
    if (highImprovements.length >= 3) {
      insights.push({
        type: 'breakthrough',
        title: 'Belief Strength Breakthrough',
        description: 'Your belief strength ratings show significant improvement. You\'re making real progress!',
        priority: 'high',
        created_at: new Date()
      })
    }

    // Resistance insights
    const highResistance = recentActivities.filter(a =>
      a.resistance_level && a.resistance_level >= 7
    )
    if (highResistance.length >= 2) {
      insights.push({
        type: 'resistance',
        title: 'Working Through Resistance',
        description: 'You\'re experiencing some resistance. This is normal - it means the belief work is challenging old patterns.',
        priority: 'medium',
        action_suggested: 'Try shorter sessions or gentler affirmations',
        created_at: new Date()
      })
    }

    // Suggestion insights
    if (recentActivities.length < 3) {
      insights.push({
        type: 'suggestion',
        title: 'Build Consistency',
        description: 'Regular practice is key for belief installation. Try to complete at least one activity daily.',
        priority: 'medium',
        action_suggested: 'Set a daily reminder for belief work',
        created_at: new Date()
      })
    }

    return insights
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static transformBeliefSystemFromDb(data: any): BeliefSystem {
    return {
      ...data,
      affirmations: data.affirmations || [],
      journaling_prompts: data.journaling_prompts || [],
      daily_activities: data.daily_activities || [],
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private static transformUserBeliefCycleFromDb(data: any): UserBeliefCycle {
    return {
      ...data,
      custom_affirmations: data.custom_affirmations || [],
      custom_activities: data.custom_activities || [],
      start_date: new Date(data.start_date),
      target_completion_date: data.target_completion_date ? new Date(data.target_completion_date) : undefined,
      actual_completion_date: data.actual_completion_date ? new Date(data.actual_completion_date) : undefined,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      archived_at: data.archived_at ? new Date(data.archived_at) : undefined
    }
  }

  private static transformDailyActivityFromDb(data: any): DailyBeliefActivity {
    return {
      ...data,
      affirmations_read: data.affirmations_read || [],
      gratitude_items: data.gratitude_items || [],
      date: new Date(data.date),
      completed_at: data.completed_at ? new Date(data.completed_at) : undefined,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private static calculateTargetDate(cycleLengthDays: number): string {
    const target = new Date()
    target.setDate(target.getDate() + cycleLengthDays - 1)
    return target.toISOString()
  }

  private static async createDailyActivityRecord(userId: string, cycleId: string, dayNumber: number): Promise<DailyBeliefActivity> {
    const { data, error } = await supabase
      .from('daily_belief_activities')
      .insert({
        user_id: userId,
        cycle_id: cycleId,
        day_number: dayNumber,
        date: new Date().toISOString().split('T')[0],
        read_affirmation_completed: false,
        speak_affirmation_completed: false,
        visualization_completed: false,
        journaling_completed: false,
        affirmations_read: [],
        spoken_affirmation_count: 0,
        gratitude_items: [],
        completion_percentage: 0
      })
      .select()
      .single()

    if (error) throw error
    return this.transformDailyActivityFromDb(data)
  }

  private static async updateCycleProgress(userId: string, cycleId: string, completedDay: number): Promise<void> {
    const { data: cycle } = await supabase
      .from('user_belief_cycles')
      .select('days_completed, consecutive_days, total_activities_completed, current_day')
      .eq('id', cycleId)
      .single()

    if (!cycle) return

    const newDaysCompleted = cycle.days_completed + 1
    let newConsecutiveDays = cycle.consecutive_days

    // Check if this day is consecutive
    if (completedDay === cycle.current_day) {
      newConsecutiveDays += 1
    } else {
      newConsecutiveDays = 1 // Reset if not consecutive
    }

    const updates = {
      days_completed: newDaysCompleted,
      consecutive_days: newConsecutiveDays,
      total_activities_completed: cycle.total_activities_completed + 4, // Assuming 4 activities per day
      current_day: Math.max(cycle.current_day, completedDay + 1)
    }

    // Check if cycle is complete
    const { data: beliefSystem } = await supabase
      .from('belief_systems')
      .select('cycle_length')
      .eq('id', cycleId)
      .single()

    if (beliefSystem && newDaysCompleted >= beliefSystem.cycle_length) {
      updates.status = 'completed'
      updates.actual_completion_date = new Date().toISOString()
    }

    await supabase
      .from('user_belief_cycles')
      .update(updates)
      .eq('id', cycleId)
  }

  private static async getRecentActivitiesForUser(userId: string, days: number): Promise<DailyBeliefActivity[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('daily_belief_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('date', cutoffDate.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(this.transformDailyActivityFromDb)
  }

  private static calculateCurrentStreak(activities: DailyBeliefActivity[]): number {
    if (activities.length === 0) return 0

    const sortedActivities = activities
      .filter(a => a.completion_percentage === 100)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (sortedActivities.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedActivities.length; i++) {
      const activityDate = new Date(sortedActivities[i].date)
      activityDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - streak)

      if (activityDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  private static calculateLongestStreak(activities: DailyBeliefActivity[]): number {
    // Implementation similar to current streak but tracking maximum
    // This is a simplified version - full implementation would track all historical streaks
    return Math.max(this.calculateCurrentStreak(activities), 0)
  }

  private static calculateAverageCompletionRate(cycles: UserBeliefCycle[]): number {
    if (cycles.length === 0) return 0

    const completionRates = cycles.map(cycle => {
      const expectedDays = 21 // Default cycle length
      return (cycle.days_completed / expectedDays) * 100
    })

    return completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
  }

  private static calculateAverageBeliefImprovement(cycles: UserBeliefCycle[]): number {
    const improvements = cycles
      .filter(c => c.initial_belief_strength && c.current_belief_strength)
      .map(c => c.current_belief_strength! - c.initial_belief_strength!)

    return improvements.length > 0 ?
      improvements.reduce((a, b) => a + b, 0) / improvements.length : 0
  }

  private static calculateAverageMoodImprovement(activities: DailyBeliefActivity[]): number {
    // This would require before/after mood tracking in activities
    // Simplified implementation
    return 0
  }

  private static calculateAverageConfidenceImprovement(activities: DailyBeliefActivity[]): number {
    const ratings = activities
      .filter(a => a.confidence_rating)
      .map(a => a.confidence_rating!)

    return ratings.length > 0 ?
      ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
  }
}

// Export individual functions for easier use
export const {
  getBeliefSystems,
  getFeaturedBeliefSystems,
  createBeliefSystem,
  getUserBeliefCycles,
  getUserBeliefCycle,
  createBeliefCycle,
  updateBeliefCycle,
  getDailyActivity,
  getRecentActivities,
  updateDailyActivity,
  getBeliefStats,
  generateBeliefInsights
} = BeliefsService