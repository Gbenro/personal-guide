// Routines Service - Guided Step-by-Step Flows System
// Handles templates, user routines, sessions, and completion tracking

import { supabase } from './supabase'
import type {
  RoutineTemplate,
  UserRoutine,
  RoutineCompletion,
  RoutineSession,
  RoutineStepTemplate,
  CreateRoutineTemplateInput,
  CreateUserRoutineInput,
  UpdateUserRoutineInput,
  StartRoutineSessionInput,
  CompleteRoutineStepInput,
  SkipRoutineStepInput,
  CompleteRoutineSessionInput,
  RoutineFilters,
  RoutineTemplateFilters,
  RoutineStats,
  RoutineInsight,
  RoutineRecommendation,
  RoutineSessionState,
  RoutineProgress,
  WeeklyRoutineSchedule,
  RoutineCalendarEvent,
  RoutineType,
  RoutineCategory,
  TimeOfDay
} from '@/types/routines'

export class RoutinesService {
  // ============================================================================
  // ROUTINE TEMPLATES
  // ============================================================================

  /**
   * Get routine templates (system + user templates)
   */
  static async getRoutineTemplates(userId: string, filters: RoutineTemplateFilters = {}): Promise<RoutineTemplate[]> {
    let query = supabase
      .from('routine_templates')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`)

    // Apply filters
    if (filters.category?.length) {
      query = query.in('category', filters.category)
    }

    if (filters.routine_type?.length) {
      query = query.in('routine_type', filters.routine_type)
    }

    if (filters.difficulty_level?.length) {
      query = query.in('difficulty_level', filters.difficulty_level)
    }

    if (filters.duration_range) {
      query = query.gte('estimated_duration', filters.duration_range[0])
        .lte('estimated_duration', filters.duration_range[1])
    }

    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    query = query.order('is_featured', { ascending: false })
      .order('times_used', { ascending: false })
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(this.transformRoutineTemplateFromDb)
  }

  /**
   * Get featured routine templates
   */
  static async getFeaturedTemplates(): Promise<RoutineTemplate[]> {
    const { data, error } = await supabase
      .from('routine_templates')
      .select('*')
      .eq('is_featured', true)
      .eq('is_public', true)
      .order('times_used', { ascending: false })
      .limit(6)

    if (error) throw error
    return (data || []).map(this.transformRoutineTemplateFromDb)
  }

  /**
   * Create routine template
   */
  static async createRoutineTemplate(userId: string, input: CreateRoutineTemplateInput): Promise<RoutineTemplate> {
    const steps = this.processStepsForDb(input.steps)

    const { data, error } = await supabase
      .from('routine_templates')
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description,
        category: input.category,
        routine_type: input.routine_type,
        estimated_duration: input.estimated_duration || this.calculateEstimatedDuration(steps),
        difficulty_level: input.difficulty_level || 3,
        energy_required: input.energy_required || 3,
        steps,
        is_public: input.is_public || false,
        allows_customization: input.allows_customization !== false,
        allows_step_reordering: input.allows_step_reordering !== false,
        allows_timer_adjustment: input.allows_timer_adjustment !== false,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return this.transformRoutineTemplateFromDb(data)
  }

  // ============================================================================
  // USER ROUTINES
  // ============================================================================

  /**
   * Get user's routines
   */
  static async getUserRoutines(userId: string, filters: RoutineFilters = {}): Promise<UserRoutine[]> {
    let query = supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)

    // Apply filters
    if (filters.category?.length) {
      query = query.in('category', filters.category)
    }

    if (filters.routine_type?.length) {
      query = query.in('routine_type', filters.routine_type)
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters.is_scheduled !== undefined) {
      query = query.eq('is_scheduled', filters.is_scheduled)
    }

    if (filters.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    query = query.order('is_favorite', { ascending: false })
      .order('current_streak', { ascending: false })
      .order('total_completions', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(this.transformUserRoutineFromDb)
  }

  /**
   * Get single user routine
   */
  static async getUserRoutine(userId: string, routineId: string): Promise<UserRoutine | null> {
    const { data, error } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', userId)
      .eq('id', routineId)
      .single()

    if (error || !data) return null
    return this.transformUserRoutineFromDb(data)
  }

  /**
   * Create user routine from template
   */
  static async createRoutineFromTemplate(userId: string, templateId: string, customizations: Partial<CreateUserRoutineInput> = {}): Promise<UserRoutine> {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('routine_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) throw new Error('Template not found')

    // Update template usage count
    await supabase
      .from('routine_templates')
      .update({ times_used: template.times_used + 1 })
      .eq('id', templateId)

    // Create user routine
    const routineData = {
      user_id: userId,
      template_id: templateId,
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      category: customizations.category || template.category,
      routine_type: customizations.routine_type || template.routine_type,
      steps: customizations.steps ? this.processStepsForDb(customizations.steps) : template.steps,
      estimated_duration: customizations.estimated_duration || template.estimated_duration,
      preferred_time_of_day: customizations.preferred_time_of_day,
      is_scheduled: customizations.is_scheduled || false,
      scheduled_days: customizations.scheduled_days || [1, 2, 3, 4, 5, 6, 7],
      scheduled_time: customizations.scheduled_time,
      timezone: customizations.timezone
    }

    const { data, error } = await supabase
      .from('user_routines')
      .insert(routineData)
      .select()
      .single()

    if (error) throw error
    return this.transformUserRoutineFromDb(data)
  }

  /**
   * Create custom user routine
   */
  static async createUserRoutine(userId: string, input: CreateUserRoutineInput): Promise<UserRoutine> {
    console.log('🔧 [DEBUG] createUserRoutine called with:', { userId, input })

    if (!input.steps) {
      console.error('❌ [ERROR] createUserRoutine: input.steps is missing')
      throw new Error('Routine steps are required')
    }

    const steps = this.processStepsForDb(input.steps)
    console.log('🔧 [DEBUG] processed steps:', steps)

    const insertData = {
      user_id: userId,
      template_id: input.template_id,
      name: input.name,
      description: input.description,
      category: input.category,
      routine_type: input.routine_type,
      steps,
      estimated_duration: input.estimated_duration || this.calculateEstimatedDuration(steps),
      preferred_time_of_day: input.preferred_time_of_day,
      is_scheduled: input.is_scheduled || false,
      scheduled_days: input.scheduled_days || [1, 2, 3, 4, 5, 6, 7],
      scheduled_time: input.scheduled_time,
      timezone: input.timezone
    }

    console.log('🔧 [DEBUG] inserting data:', insertData)

    const { data, error } = await supabase
      .from('user_routines')
      .insert(insertData)
      .select()
      .single()

    console.log('🔧 [DEBUG] supabase response:', { data, error })

    if (error) {
      console.error('❌ [ERROR] createUserRoutine database error:', error)
      throw error
    }

    if (!data) {
      console.error('❌ [ERROR] createUserRoutine: no data returned from database')
      throw new Error('No data returned from routine creation')
    }

    return this.transformUserRoutineFromDb(data)
  }

  /**
   * Update user routine
   */
  static async updateUserRoutine(userId: string, routineId: string, updates: UpdateUserRoutineInput): Promise<UserRoutine> {
    const updateData: any = { ...updates }

    if (updates.steps) {
      updateData.steps = this.processStepsForDb(updates.steps)
      if (!updates.estimated_duration) {
        updateData.estimated_duration = this.calculateEstimatedDuration(updateData.steps)
      }
    }

    const { data, error } = await supabase
      .from('user_routines')
      .update(updateData)
      .eq('user_id', userId)
      .eq('id', routineId)
      .select()
      .single()

    if (error) throw error
    return this.transformUserRoutineFromDb(data)
  }

  /**
   * Delete user routine
   */
  static async deleteUserRoutine(userId: string, routineId: string): Promise<void> {
    // Delete related sessions and completions
    await Promise.all([
      supabase.from('routine_sessions').delete().eq('user_id', userId).eq('routine_id', routineId),
      supabase.from('routine_completions').delete().eq('user_id', userId).eq('routine_id', routineId)
    ])

    const { error } = await supabase
      .from('user_routines')
      .delete()
      .eq('user_id', userId)
      .eq('id', routineId)

    if (error) throw error
  }

  // ============================================================================
  // ROUTINE SESSIONS
  // ============================================================================

  /**
   * Start a new routine session
   */
  static async startRoutineSession(userId: string, input: StartRoutineSessionInput): Promise<RoutineSession> {
    // Get routine
    const routine = await this.getUserRoutine(userId, input.routine_id)
    if (!routine) throw new Error('Routine not found')

    // Check for existing active session
    const { data: existingSession } = await supabase
      .from('routine_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('routine_id', input.routine_id)
      .eq('status', 'active')
      .single()

    if (existingSession) {
      return this.transformRoutineSessionFromDb(existingSession)
    }

    // Create completion record
    const { data: completion, error: completionError } = await supabase
      .from('routine_completions')
      .insert({
        user_id: userId,
        routine_id: input.routine_id,
        started_at: new Date().toISOString(),
        mood_before: input.mood_before,
        energy_before: input.energy_before,
        location: input.location,
        weather: input.weather,
        steps_completed: [],
        steps_skipped: []
      })
      .select()
      .single()

    if (completionError) throw completionError

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('routine_sessions')
      .insert({
        user_id: userId,
        routine_id: input.routine_id,
        completion_id: completion.id,
        status: 'active',
        current_step_index: 0,
        total_steps: routine.steps.length,
        current_step_started_at: new Date().toISOString(),
        session_data: {}
      })
      .select()
      .single()

    if (sessionError) throw sessionError
    return this.transformRoutineSessionFromDb(session)
  }

  /**
   * Get active session for routine
   */
  static async getActiveSession(userId: string, routineId: string): Promise<RoutineSession | null> {
    const { data, error } = await supabase
      .from('routine_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .eq('status', 'active')
      .single()

    if (error || !data) return null
    return this.transformRoutineSessionFromDb(data)
  }

  /**
   * Update session progress
   */
  static async updateSessionProgress(userId: string, sessionId: string, updates: Partial<RoutineSession>): Promise<RoutineSession> {
    const { data, error } = await supabase
      .from('routine_sessions')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return this.transformRoutineSessionFromDb(data)
  }

  /**
   * Complete a routine step
   */
  static async completeRoutineStep(userId: string, input: CompleteRoutineStepInput): Promise<void> {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('routine_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('id', input.session_id)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    // Update completion record
    const stepCompletion = {
      step_id: input.step_id,
      completed_at: new Date().toISOString(),
      duration_seconds: input.duration_seconds,
      notes: input.notes
    }

    const { data: completion } = await supabase
      .from('routine_completions')
      .select('steps_completed')
      .eq('id', session.completion_id)
      .single()

    const updatedStepsCompleted = [...(completion?.steps_completed || []), stepCompletion]

    await supabase
      .from('routine_completions')
      .update({ steps_completed: updatedStepsCompleted })
      .eq('id', session.completion_id)

    // Update session
    const newStepIndex = session.current_step_index + 1
    const isLastStep = newStepIndex >= session.total_steps

    await supabase
      .from('routine_sessions')
      .update({
        current_step_index: newStepIndex,
        completed_steps: session.completed_steps + 1,
        current_step_started_at: isLastStep ? null : new Date().toISOString(),
        status: isLastStep ? 'completed' : 'active'
      })
      .eq('id', input.session_id)
  }

  /**
   * Skip a routine step
   */
  static async skipRoutineStep(userId: string, input: SkipRoutineStepInput): Promise<void> {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('routine_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('id', input.session_id)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    // Update completion record
    const stepSkip = {
      step_id: input.step_id,
      skipped_at: new Date().toISOString(),
      reason: input.reason
    }

    const { data: completion } = await supabase
      .from('routine_completions')
      .select('steps_skipped')
      .eq('id', session.completion_id)
      .single()

    const updatedStepsSkipped = [...(completion?.steps_skipped || []), stepSkip]

    await supabase
      .from('routine_completions')
      .update({ steps_skipped: updatedStepsSkipped })
      .eq('id', session.completion_id)

    // Update session (move to next step)
    const newStepIndex = session.current_step_index + 1
    const isLastStep = newStepIndex >= session.total_steps

    await supabase
      .from('routine_sessions')
      .update({
        current_step_index: newStepIndex,
        current_step_started_at: isLastStep ? null : new Date().toISOString(),
        status: isLastStep ? 'completed' : 'active'
      })
      .eq('id', input.session_id)
  }

  /**
   * Complete routine session
   */
  static async completeRoutineSession(userId: string, input: CompleteRoutineSessionInput): Promise<RoutineCompletion> {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('routine_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('id', input.session_id)
      .single()

    if (sessionError || !session) throw new Error('Session not found')

    const completedAt = new Date()
    const startedAt = new Date(session.started_at)
    const durationMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / (1000 * 60))

    // Update completion record
    const { data: completion, error: completionError } = await supabase
      .from('routine_completions')
      .update({
        completed_at: completedAt.toISOString(),
        duration_minutes: durationMinutes,
        completion_percentage: Math.round((session.completed_steps / session.total_steps) * 100),
        mood_after: input.mood_after,
        energy_after: input.energy_after,
        focus_level: input.focus_level,
        rating: input.rating,
        notes: input.notes,
        tags: input.tags || [],
        interruptions_count: input.interruptions_count || 0
      })
      .eq('id', session.completion_id)
      .select()
      .single()

    if (completionError) throw completionError

    // Update session status
    await supabase
      .from('routine_sessions')
      .update({ status: 'completed' })
      .eq('id', input.session_id)

    // Update routine stats
    await this.updateRoutineStats(userId, session.routine_id, completion)

    return this.transformRoutineCompletionFromDb(completion)
  }

  /**
   * Pause/resume session
   */
  static async pauseSession(userId: string, sessionId: string): Promise<RoutineSession> {
    const { data, error } = await supabase
      .from('routine_sessions')
      .update({ status: 'paused' })
      .eq('user_id', userId)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return this.transformRoutineSessionFromDb(data)
  }

  static async resumeSession(userId: string, sessionId: string): Promise<RoutineSession> {
    const { data, error } = await supabase
      .from('routine_sessions')
      .update({
        status: 'active',
        current_step_started_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return this.transformRoutineSessionFromDb(data)
  }

  // ============================================================================
  // STATISTICS AND INSIGHTS
  // ============================================================================

  /**
   * Get routine statistics
   */
  static async getRoutineStats(userId: string): Promise<RoutineStats> {
    const [routines, completions] = await Promise.all([
      this.getUserRoutines(userId),
      this.getRecentCompletions(userId, 30)
    ])

    const thisWeekCompletions = completions.filter(c => {
      const completionDate = new Date(c.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return completionDate >= weekAgo
    })

    const thisMonthCompletions = completions.filter(c => {
      const completionDate = new Date(c.date)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return completionDate >= monthAgo
    })

    const categoryDistribution = routines.reduce((acc, routine) => {
      acc[routine.category] = (acc[routine.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const stats: RoutineStats = {
      total_routines: routines.length,
      active_routines: routines.filter(r => r.is_active).length,
      scheduled_routines: routines.filter(r => r.is_scheduled).length,
      favorite_routines: routines.filter(r => r.is_favorite).length,

      total_completions: routines.reduce((sum, r) => sum + r.total_completions, 0),
      completions_this_week: thisWeekCompletions.length,
      completions_this_month: thisMonthCompletions.length,
      average_completion_rate: this.calculateCompletionRate(routines, 30),

      current_streak: Math.max(...routines.map(r => r.current_streak), 0),
      longest_streak: Math.max(...routines.map(r => r.best_streak), 0),

      total_time_practiced: completions.reduce((sum, c) => sum + (c.duration_minutes || 0), 0),
      average_session_duration: this.calculateAverageSessionDuration(completions),
      most_practiced_time_of_day: this.getMostPracticedTimeOfDay(routines),

      most_used_category: this.getMostUsedCategory(categoryDistribution),
      category_distribution: categoryDistribution,

      average_mood_improvement: this.calculateAverageMoodImprovement(completions),
      average_energy_improvement: this.calculateAverageEnergyImprovement(completions),
      average_session_rating: this.calculateAverageRating(completions)
    }

    return stats
  }

  /**
   * Generate routine insights
   */
  static async generateRoutineInsights(userId: string): Promise<RoutineInsight[]> {
    const [routines, stats, recentCompletions] = await Promise.all([
      this.getUserRoutines(userId, { is_active: true }),
      this.getRoutineStats(userId),
      this.getRecentCompletions(userId, 7)
    ])

    const insights: RoutineInsight[] = []

    // Streak insights
    if (stats.current_streak >= 7) {
      insights.push({
        type: 'streak',
        title: 'Great Streak!',
        description: `You're on a ${stats.current_streak}-day routine streak. Keep it going!`,
        priority: 'high',
        created_at: new Date()
      })
    }

    // Consistency insights
    if (recentCompletions.length < 3) {
      insights.push({
        type: 'consistency',
        title: 'Build Consistency',
        description: 'Try to complete at least one routine daily for better habit formation.',
        priority: 'medium',
        action_suggested: 'Schedule a short morning or evening routine',
        created_at: new Date()
      })
    }

    // Mood improvement insights
    if (stats.average_mood_improvement > 2) {
      insights.push({
        type: 'mood',
        title: 'Routines Boost Your Mood!',
        description: `Your routines improve your mood by an average of ${stats.average_mood_improvement.toFixed(1)} points.`,
        priority: 'low',
        created_at: new Date()
      })
    }

    return insights
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static transformRoutineTemplateFromDb(data: any): RoutineTemplate {
    return {
      ...data,
      steps: data.steps || [],
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private static transformUserRoutineFromDb(data: any): UserRoutine {
    // DEBUG: Add diagnostic logging
    console.log('🔍 [DEBUG] transformUserRoutineFromDb called with data:', JSON.stringify(data, null, 2))

    if (!data) {
      console.error('❌ [ERROR] transformUserRoutineFromDb: data is null or undefined')
      throw new Error('Cannot transform null routine data')
    }

    if (!data.steps) {
      console.warn('⚠️ [WARN] transformUserRoutineFromDb: data.steps is missing, using empty array')
    }

    try {
      const result = {
        ...data,
        steps: data.steps || [],
        scheduled_days: data.scheduled_days || [1, 2, 3, 4, 5, 6, 7],
        last_completed_at: data.last_completed_at ? new Date(data.last_completed_at) : undefined,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        archived_at: data.archived_at ? new Date(data.archived_at) : undefined
      }

      console.log('✅ [DEBUG] transformUserRoutineFromDb result:', JSON.stringify(result, null, 2))
      return result
    } catch (error) {
      console.error('❌ [ERROR] transformUserRoutineFromDb failed:', error)
      throw error
    }
  }

  private static transformRoutineSessionFromDb(data: any): RoutineSession {
    return {
      ...data,
      current_step_started_at: data.current_step_started_at ? new Date(data.current_step_started_at) : undefined,
      session_data: data.session_data || {},
      started_at: new Date(data.started_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private static transformRoutineCompletionFromDb(data: any): RoutineCompletion {
    return {
      ...data,
      steps_completed: data.steps_completed || [],
      steps_skipped: data.steps_skipped || [],
      tags: data.tags || [],
      started_at: new Date(data.started_at),
      completed_at: data.completed_at ? new Date(data.completed_at) : undefined,
      date: new Date(data.date),
      created_at: new Date(data.created_at)
    }
  }

  private static processStepsForDb(steps: any[]): any[] {
    console.log('🔧 [DEBUG] processStepsForDb input:', steps)

    if (!steps || !Array.isArray(steps)) {
      console.error('❌ [ERROR] processStepsForDb: steps is not an array:', steps)
      throw new Error('Steps must be an array')
    }

    const processedSteps = steps.map((step, index) => {
      if (!step) {
        console.warn('⚠️ [WARN] processStepsForDb: empty step at index', index)
        return {
          id: crypto.randomUUID(),
          order: index + 1,
          title: `Step ${index + 1}`,
          description: '',
          duration: 60
        }
      }

      return {
        ...step,
        id: step.id || crypto.randomUUID(),
        order: step.order || index + 1
      }
    })

    console.log('🔧 [DEBUG] processStepsForDb output:', processedSteps)
    return processedSteps
  }

  private static calculateEstimatedDuration(steps: any[]): number {
    return Math.round(steps.reduce((total, step) => total + (step.duration || 60), 0) / 60)
  }

  private static async updateRoutineStats(userId: string, routineId: string, completion: any): Promise<void> {
    const { data: routine } = await supabase
      .from('user_routines')
      .select('total_completions, current_streak, best_streak, last_completed_at')
      .eq('id', routineId)
      .single()

    if (!routine) return

    const lastCompleted = routine.last_completed_at ? new Date(routine.last_completed_at) : null
    const today = new Date(completion.date)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let newStreak = routine.current_streak
    if (!lastCompleted || lastCompleted.toDateString() === yesterday.toDateString()) {
      newStreak += 1
    } else if (lastCompleted.toDateString() !== today.toDateString()) {
      newStreak = 1
    }

    const newBestStreak = Math.max(routine.best_streak, newStreak)

    await supabase
      .from('user_routines')
      .update({
        total_completions: routine.total_completions + 1,
        current_streak: newStreak,
        best_streak: newBestStreak,
        last_completed_at: completion.completed_at
      })
      .eq('id', routineId)
  }

  private static async getRecentCompletions(userId: string, days: number): Promise<RoutineCompletion[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', cutoffDate.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) throw error
    return (data || []).map(this.transformRoutineCompletionFromDb)
  }

  private static calculateCompletionRate(routines: UserRoutine[], days: number): number {
    if (routines.length === 0) return 0

    const totalPossible = routines.filter(r => r.is_active).length * days
    const totalCompleted = routines.reduce((sum, r) => sum + r.total_completions, 0)

    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
  }

  private static calculateAverageSessionDuration(completions: RoutineCompletion[]): number {
    const durations = completions.filter(c => c.duration_minutes).map(c => c.duration_minutes!)
    return durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
  }

  private static getMostPracticedTimeOfDay(routines: UserRoutine[]): TimeOfDay {
    const timeOfDayCount = routines.reduce((acc, routine) => {
      const timeOfDay = routine.preferred_time_of_day || 'anytime'
      acc[timeOfDay] = (acc[timeOfDay] || 0) + routine.total_completions
      return acc
    }, {} as Record<string, number>)

    return Object.entries(timeOfDayCount).reduce((a, b) =>
      timeOfDayCount[a[0]] > timeOfDayCount[b[0]] ? a : b
    )[0] as TimeOfDay || 'anytime'
  }

  private static getMostUsedCategory(distribution: Record<string, number>): RoutineCategory {
    return Object.entries(distribution).reduce((a, b) =>
      distribution[a[0]] > distribution[b[0]] ? a : b
    )[0] as RoutineCategory || 'General'
  }

  private static calculateAverageMoodImprovement(completions: RoutineCompletion[]): number {
    const improvements = completions
      .filter(c => c.mood_before && c.mood_after)
      .map(c => c.mood_after! - c.mood_before!)

    return improvements.length > 0 ?
      improvements.reduce((a, b) => a + b, 0) / improvements.length : 0
  }

  private static calculateAverageEnergyImprovement(completions: RoutineCompletion[]): number {
    const improvements = completions
      .filter(c => c.energy_before && c.energy_after)
      .map(c => c.energy_after! - c.energy_before!)

    return improvements.length > 0 ?
      improvements.reduce((a, b) => a + b, 0) / improvements.length : 0
  }

  private static calculateAverageRating(completions: RoutineCompletion[]): number {
    const ratings = completions.filter(c => c.rating).map(c => c.rating!)
    return ratings.length > 0 ?
      ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
  }
}

// Export individual functions for easier use
export const {
  getRoutineTemplates,
  getFeaturedTemplates,
  createRoutineTemplate,
  getUserRoutines,
  getUserRoutine,
  createRoutineFromTemplate,
  createUserRoutine,
  updateUserRoutine,
  deleteUserRoutine,
  startRoutineSession,
  getActiveSession,
  updateSessionProgress,
  completeRoutineStep,
  skipRoutineStep,
  completeRoutineSession,
  pauseSession,
  resumeSession,
  getRoutineStats,
  generateRoutineInsights
} = RoutinesService