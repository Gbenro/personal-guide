// Enhanced stub for routines service with localStorage persistence
// TODO: Replace with full PostgreSQL implementation

// Simple localStorage-based storage for routines
class RoutineStorage {
  private static ROUTINES_KEY = 'pg_user_routines'
  private static TEMPLATES_KEY = 'pg_routine_templates'
  private static SESSIONS_KEY = 'pg_routine_sessions'
  private static COMPLETIONS_KEY = 'pg_routine_completions'

  static getUserRoutines(userId: string): UserRoutine[] {
    try {
      const routines = localStorage.getItem(`${this.ROUTINES_KEY}_${userId}`)
      const parsedRoutines = routines ? JSON.parse(routines) : []

      // Transform date strings back to Date objects
      return parsedRoutines.map((routine: any) => ({
        ...routine,
        created_at: new Date(routine.created_at),
        updated_at: new Date(routine.updated_at),
        archived_at: routine.archived_at ? new Date(routine.archived_at) : undefined,
        last_completed_at: routine.last_completed_at ? new Date(routine.last_completed_at) : undefined
      }))
    } catch (error) {
      console.warn('Failed to load routines from localStorage:', error)
      return []
    }
  }

  static saveUserRoutines(userId: string, routines: UserRoutine[]): void {
    try {
      localStorage.setItem(`${this.ROUTINES_KEY}_${userId}`, JSON.stringify(routines))
    } catch (error) {
      console.warn('Failed to save routines to localStorage:', error)
    }
  }

  static addUserRoutine(userId: string, routine: UserRoutine): void {
    const existingRoutines = this.getUserRoutines(userId)
    const updatedRoutines = [...existingRoutines, routine]
    this.saveUserRoutines(userId, updatedRoutines)
  }

  static updateUserRoutine(userId: string, routineId: string, updates: Partial<UserRoutine>): UserRoutine | null {
    const existingRoutines = this.getUserRoutines(userId)
    const routineIndex = existingRoutines.findIndex(r => r.id === routineId)

    if (routineIndex === -1) return null

    const updatedRoutine = { ...existingRoutines[routineIndex], ...updates, updated_at: new Date() }
    existingRoutines[routineIndex] = updatedRoutine
    this.saveUserRoutines(userId, existingRoutines)
    return updatedRoutine
  }

  static removeUserRoutine(userId: string, routineId: string): void {
    const existingRoutines = this.getUserRoutines(userId)
    const updatedRoutines = existingRoutines.filter(r => r.id !== routineId)
    this.saveUserRoutines(userId, updatedRoutines)
  }

  // Session management
  static getRoutineSessions(userId: string): RoutineSession[] {
    try {
      const sessions = localStorage.getItem(`${this.SESSIONS_KEY}_${userId}`)
      return sessions ? JSON.parse(sessions).map((session: any) => ({
        ...session,
        started_at: new Date(session.started_at),
        updated_at: new Date(session.updated_at),
        current_step_started_at: session.current_step_started_at ? new Date(session.current_step_started_at) : undefined
      })) : []
    } catch (error) {
      console.warn('Failed to load routine sessions from localStorage:', error)
      return []
    }
  }

  static saveRoutineSessions(userId: string, sessions: RoutineSession[]): void {
    try {
      localStorage.setItem(`${this.SESSIONS_KEY}_${userId}`, JSON.stringify(sessions))
    } catch (error) {
      console.warn('Failed to save routine sessions to localStorage:', error)
    }
  }

  static addRoutineSession(userId: string, session: RoutineSession): void {
    const existing = this.getRoutineSessions(userId)
    const updated = [...existing, session]
    this.saveRoutineSessions(userId, updated)
  }

  static updateRoutineSession(userId: string, sessionId: string, updates: Partial<RoutineSession>): RoutineSession | null {
    const sessions = this.getRoutineSessions(userId)
    const index = sessions.findIndex(s => s.id === sessionId)
    if (index === -1) return null

    sessions[index] = { ...sessions[index], ...updates, updated_at: new Date() }
    this.saveRoutineSessions(userId, sessions)
    return sessions[index]
  }

  // Completion management
  static getRoutineCompletions(userId: string): RoutineCompletion[] {
    try {
      const completions = localStorage.getItem(`${this.COMPLETIONS_KEY}_${userId}`)
      return completions ? JSON.parse(completions).map((completion: any) => ({
        ...completion,
        started_at: new Date(completion.started_at),
        completed_at: completion.completed_at ? new Date(completion.completed_at) : undefined,
        date: new Date(completion.date),
        created_at: new Date(completion.created_at),
        steps_completed: completion.steps_completed?.map((step: any) => ({
          ...step,
          completed_at: new Date(step.completed_at)
        })) || [],
        steps_skipped: completion.steps_skipped?.map((step: any) => ({
          ...step,
          skipped_at: new Date(step.skipped_at)
        })) || []
      })) : []
    } catch (error) {
      console.warn('Failed to load routine completions from localStorage:', error)
      return []
    }
  }

  static saveRoutineCompletions(userId: string, completions: RoutineCompletion[]): void {
    try {
      localStorage.setItem(`${this.COMPLETIONS_KEY}_${userId}`, JSON.stringify(completions))
    } catch (error) {
      console.warn('Failed to save routine completions to localStorage:', error)
    }
  }

  static addRoutineCompletion(userId: string, completion: RoutineCompletion): void {
    const existing = this.getRoutineCompletions(userId)
    const updated = [...existing, completion]
    this.saveRoutineCompletions(userId, updated)
  }
}

import type {
  RoutineTemplate,
  UserRoutine,
  RoutineCompletion,
  RoutineSession,
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
  RoutineCategory,
  TimeOfDay
} from '@/types/routines'

export class RoutinesService {
  // ============================================================================
  // ROUTINE TEMPLATES
  // ============================================================================

  static async getRoutineTemplates(userId: string, filters: RoutineTemplateFilters = {}): Promise<RoutineTemplate[]> {
    console.log('Routine templates stub called - returning empty templates')
    return []
  }

  static async getFeaturedTemplates(): Promise<RoutineTemplate[]> {
    console.log('Featured templates stub called - returning sample templates')
    return [
      {
        id: 'sample-1',
        user_id: 'system',
        created_by: 'system',
        name: 'Morning Energizer',
        description: 'Start your day with energy and focus',
        category: 'Morning' as RoutineCategory,
        routine_type: 'focus',
        steps: [
          {
            id: 'step-1',
            order: 1,
            title: 'Deep Breathing',
            description: 'Take 5 deep breaths to center yourself',
            duration: 60,
            type: 'breathing'
          },
          {
            id: 'step-2',
            order: 2,
            title: 'Set Daily Intention',
            description: 'Think about what you want to accomplish today',
            duration: 120,
            type: 'reflection'
          }
        ],
        estimated_duration: 3,
        difficulty_level: 1,
        energy_required: 2,
        times_used: 150,
        is_public: true,
        is_featured: true,
        allows_customization: true,
        allows_step_reordering: true,
        allows_timer_adjustment: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    ]
  }

  static async createRoutineTemplate(userId: string, input: CreateRoutineTemplateInput): Promise<RoutineTemplate> {
    console.log('Create routine template stub called - not implemented yet')
    throw new Error('Routine template creation not yet implemented')
  }

  // ============================================================================
  // USER ROUTINES
  // ============================================================================

  static async getUserRoutines(userId: string, filters: RoutineFilters = {}): Promise<UserRoutine[]> {
    console.log('🔥 [ENHANCED STUB] getUserRoutines called for userId:', userId)

    if (typeof window === 'undefined') {
      console.log('Server-side, returning empty array')
      return []
    }

    const routines = RoutineStorage.getUserRoutines(userId)
    console.log(`Found ${routines.length} routines for user`)

    // Apply basic filtering
    let filteredRoutines = routines

    if (filters.category?.length) {
      filteredRoutines = filteredRoutines.filter(r => filters.category!.includes(r.category))
    }

    if (filters.routine_type?.length) {
      filteredRoutines = filteredRoutines.filter(r => filters.routine_type!.includes(r.routine_type))
    }

    if (filters.is_active !== undefined) {
      filteredRoutines = filteredRoutines.filter(r => r.is_active === filters.is_active)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredRoutines = filteredRoutines.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        (r.description && r.description.toLowerCase().includes(searchLower))
      )
    }

    return filteredRoutines
  }

  static async getUserRoutine(userId: string, routineId: string): Promise<UserRoutine | null> {
    console.log('🔥 [ENHANCED STUB] getUserRoutine called with:', { userId, routineId })

    if (typeof window === 'undefined') {
      return null
    }

    const routines = RoutineStorage.getUserRoutines(userId)
    const routine = routines.find(r => r.id === routineId)

    console.log(`Found routine:`, routine ? routine.name : 'not found')
    return routine || null
  }

  static async createRoutineFromTemplate(userId: string, templateId: string, customizations: Partial<CreateUserRoutineInput> = {}): Promise<UserRoutine> {
    console.log('Create routine from template stub called - not implemented yet')
    throw new Error('Create routine from template not yet implemented')
  }

  static async createUserRoutine(userId: string, input: CreateUserRoutineInput): Promise<UserRoutine> {
    console.log('🔥 [ENHANCED STUB] createUserRoutine called with:', { userId, input })

    if (typeof window === 'undefined') {
      console.log('Server-side, cannot create routine')
      throw new Error('Cannot create routine on server-side')
    }

    // Validate input
    if (!input.steps || !Array.isArray(input.steps) || input.steps.length === 0) {
      console.error('❌ [ENHANCED STUB] createUserRoutine: invalid steps')
      throw new Error('Routine steps are required and must be a non-empty array')
    }

    // Create routine and save to localStorage
    const newRoutine: UserRoutine = {
      id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      template_id: input.template_id,
      name: input.name,
      description: input.description,
      category: input.category,
      routine_type: input.routine_type,
      steps: input.steps.map((step, index) => ({
        ...step,
        id: step.id || `step-${Date.now()}-${index}`,
        order: step.order || index + 1
      })),
      estimated_duration: input.estimated_duration || this.calculateEstimatedDuration(input.steps),
      preferred_time_of_day: input.preferred_time_of_day,
      is_active: true,
      is_scheduled: input.is_scheduled || false,
      is_favorite: false,
      scheduled_days: input.scheduled_days || [1, 2, 3, 4, 5, 6, 7],
      scheduled_time: input.scheduled_time,
      timezone: input.timezone,
      total_completions: 0,
      current_streak: 0,
      best_streak: 0,
      last_completed_at: undefined,
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: undefined
    }

    // Save to localStorage
    RoutineStorage.addUserRoutine(userId, newRoutine)

    console.log('✅ [ENHANCED STUB] Created and saved routine:', newRoutine)
    return newRoutine
  }

  static async updateUserRoutine(userId: string, routineId: string, updates: UpdateUserRoutineInput): Promise<UserRoutine> {
    console.log('🔥 [ENHANCED STUB] updateUserRoutine called with:', { userId, routineId, updates })

    if (typeof window === 'undefined') {
      throw new Error('Cannot update routine on server-side')
    }

    const updatedRoutine = RoutineStorage.updateUserRoutine(userId, routineId, updates)

    if (!updatedRoutine) {
      throw new Error('Routine not found')
    }

    console.log('✅ [ENHANCED STUB] Updated routine:', updatedRoutine)
    return updatedRoutine
  }

  static async deleteUserRoutine(userId: string, routineId: string): Promise<void> {
    console.log('🔥 [ENHANCED STUB] deleteUserRoutine called with:', { userId, routineId })

    if (typeof window === 'undefined') {
      console.log('Server-side, cannot delete routine')
      return
    }

    RoutineStorage.removeUserRoutine(userId, routineId)
    console.log('✅ [ENHANCED STUB] Deleted routine:', routineId)
  }

  // ============================================================================
  // ROUTINE SESSIONS
  // ============================================================================

  static async startRoutineSession(userId: string, input: StartRoutineSessionInput): Promise<RoutineSession> {
    console.log('🔥 [ENHANCED STUB] startRoutineSession called with:', { userId, input })

    if (typeof window === 'undefined') {
      throw new Error('Cannot start routine session on server-side')
    }

    // Get the routine to initialize session
    const routine = await this.getUserRoutine(userId, input.routine_id)
    if (!routine) {
      throw new Error('Routine not found')
    }

    // Create new session
    const newSession: RoutineSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      routine_id: input.routine_id,
      status: 'active',
      current_step_index: 0,
      current_step_started_at: new Date(),
      total_steps: routine.steps.length,
      completed_steps: 0,
      elapsed_time: 0,
      session_data: input.session_data || {},
      pause_count: 0,
      total_pause_time: 0,
      started_at: new Date(),
      updated_at: new Date()
    }

    // Save session
    RoutineStorage.addRoutineSession(userId, newSession)

    console.log('✅ [ENHANCED STUB] Started routine session:', newSession)

    // Additional debug logging
    const savedSessions = RoutineStorage.getRoutineSessions(userId)
    console.log('All sessions after creation:', savedSessions)

    return newSession
  }

  static async getActiveSession(userId: string, routineId: string): Promise<RoutineSession | null> {
    console.log('🔥 [ENHANCED STUB] getActiveSession called with:', { userId, routineId })

    if (typeof window === 'undefined') {
      return null
    }

    const sessions = RoutineStorage.getRoutineSessions(userId)
    console.log('All sessions for user:', sessions)

    const activeSession = sessions.find(s =>
      s.routine_id === routineId &&
      (s.status === 'active' || s.status === 'paused')
    )

    console.log('Looking for routine:', routineId)
    console.log('Sessions matching routine:', sessions.filter(s => s.routine_id === routineId))
    console.log('Found active session:', activeSession ? activeSession.id : 'none')
    return activeSession || null
  }

  static async updateSessionProgress(userId: string, sessionId: string, updates: Partial<RoutineSession>): Promise<RoutineSession> {
    console.log('🔥 [ENHANCED STUB] updateSessionProgress called with:', { userId, sessionId, updates })

    if (typeof window === 'undefined') {
      throw new Error('Cannot update session progress on server-side')
    }

    const updatedSession = RoutineStorage.updateRoutineSession(userId, sessionId, updates)

    if (!updatedSession) {
      throw new Error('Session not found')
    }

    console.log('✅ [ENHANCED STUB] Updated session progress:', updatedSession)
    return updatedSession
  }

  static async completeRoutineStep(userId: string, input: CompleteRoutineStepInput): Promise<void> {
    console.log('Complete routine step stub called - not implemented yet')
  }

  static async skipRoutineStep(userId: string, input: SkipRoutineStepInput): Promise<void> {
    console.log('Skip routine step stub called - not implemented yet')
  }

  static async completeRoutineSession(userId: string, input: CompleteRoutineSessionInput): Promise<RoutineCompletion> {
    console.log('🔥 [ENHANCED STUB] completeRoutineSession called with:', { userId, input })

    if (typeof window === 'undefined') {
      throw new Error('Cannot complete routine session on server-side')
    }

    // Get the session
    const sessions = RoutineStorage.getRoutineSessions(userId)
    const session = sessions.find(s => s.id === input.session_id)
    if (!session) {
      throw new Error('Session not found')
    }

    // Get the routine
    const routine = await this.getUserRoutine(userId, session.routine_id)
    if (!routine) {
      throw new Error('Routine not found')
    }

    const now = new Date()
    const completionPercentage = Math.round((session.completed_steps / session.total_steps) * 100)

    // Create completion record
    const completion: RoutineCompletion = {
      id: `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      routine_id: session.routine_id,
      started_at: session.started_at,
      completed_at: now,
      duration_minutes: Math.round((now.getTime() - session.started_at.getTime()) / (1000 * 60)),
      completion_percentage: completionPercentage,
      steps_completed: input.steps_completed || [],
      steps_skipped: input.steps_skipped || [],
      mood_before: input.mood_before,
      mood_after: input.mood_after,
      energy_before: input.energy_before,
      energy_after: input.energy_after,
      focus_level: input.focus_level,
      rating: input.rating,
      notes: input.notes,
      tags: input.tags || ['Routine'],
      location: input.location,
      weather: input.weather,
      interruptions_count: input.interruptions_count || 0,
      date: now,
      created_at: now
    }

    // Save completion
    RoutineStorage.addRoutineCompletion(userId, completion)

    // Update session status
    RoutineStorage.updateRoutineSession(userId, input.session_id, {
      status: 'completed',
      completion_id: completion.id
    })

    // Update routine stats
    const updatedStats = {
      total_completions: routine.total_completions + 1,
      last_completed_at: now
    }

    // Calculate actual completion time vs estimated
    if (completion.duration_minutes) {
      const avgTime = routine.average_completion_time || routine.estimated_duration
      updatedStats.average_completion_time = Math.round(
        ((avgTime * routine.total_completions) + completion.duration_minutes) / (routine.total_completions + 1)
      )
    }

    RoutineStorage.updateUserRoutine(userId, session.routine_id, updatedStats)

    // Create journal entry if notes provided
    if (input.notes || input.mood_before || input.mood_after) {
      try {
        const { createJournalEntry } = await import('./journalService')

        let journalContent = ''

        if (input.notes) {
          journalContent += `**Routine Notes:**\n${input.notes}\n\n`
        }

        if (input.mood_before || input.mood_after || input.energy_before || input.energy_after) {
          journalContent += `**Routine Experience:**\n`
          if (input.mood_before) journalContent += `• Mood before: ${input.mood_before}/10\n`
          if (input.mood_after) journalContent += `• Mood after: ${input.mood_after}/10\n`
          if (input.energy_before) journalContent += `• Energy before: ${input.energy_before}/10\n`
          if (input.energy_after) journalContent += `• Energy after: ${input.energy_after}/10\n`
          if (input.focus_level) journalContent += `• Focus level: ${input.focus_level}/10\n`
          journalContent += '\n'
        }

        journalContent += `**Routine Details:**\n`
        journalContent += `• **Routine:** ${routine.name}\n`
        journalContent += `• **Duration:** ${completion.duration_minutes} minutes\n`
        journalContent += `• **Completion:** ${completionPercentage}%\n`
        if (input.rating) journalContent += `• **Rating:** ${input.rating}/5 stars\n`
        if (input.interruptions_count) journalContent += `• **Interruptions:** ${input.interruptions_count}\n`

        const journalTags = ['Routine', routine.category, routine.name]
        if (input.tags) {
          journalTags.push(...input.tags.filter(tag => !journalTags.includes(tag)))
        }

        await createJournalEntry(userId, {
          title: `${routine.name} Routine Complete`,
          content: journalContent,
          mood_rating: input.mood_after,
          tags: journalTags
        })

        console.log('✅ [ENHANCED STUB] Created journal entry for routine completion')
      } catch (error) {
        console.error('Failed to create journal entry:', error)
        // Don't fail the routine completion if journal fails
      }
    }

    console.log('✅ [ENHANCED STUB] Completed routine session:', completion)
    return completion
  }

  static async pauseSession(userId: string, sessionId: string): Promise<RoutineSession> {
    console.log('Pause session stub called - not implemented yet')
    throw new Error('Pause session not yet implemented')
  }

  static async resumeSession(userId: string, sessionId: string): Promise<RoutineSession> {
    console.log('Resume session stub called - not implemented yet')
    throw new Error('Resume session not yet implemented')
  }

  // ============================================================================
  // STATISTICS AND INSIGHTS
  // ============================================================================

  static async getRoutineStats(userId: string): Promise<RoutineStats> {
    console.log('🔥 [ENHANCED STUB] getRoutineStats called for userId:', userId)

    if (typeof window === 'undefined') {
      return this.getEmptyStats()
    }

    const routines = RoutineStorage.getUserRoutines(userId)
    console.log(`Calculating stats for ${routines.length} routines`)

    const activeRoutines = routines.filter(r => r.is_active && !r.archived_at)
    const scheduledRoutines = routines.filter(r => r.is_scheduled)
    const favoriteRoutines = routines.filter(r => r.is_favorite)

    // Calculate category distribution
    const categoryDistribution = routines.reduce((acc, routine) => {
      acc[routine.category] = (acc[routine.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostUsedCategory = Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as RoutineCategory || 'General'

    const stats: RoutineStats = {
      total_routines: routines.length,
      active_routines: activeRoutines.length,
      scheduled_routines: scheduledRoutines.length,
      favorite_routines: favoriteRoutines.length,
      total_completions: routines.reduce((sum, r) => sum + r.total_completions, 0),
      completions_this_week: 0, // Would need completion tracking
      completions_this_month: 0, // Would need completion tracking
      average_completion_rate: 0, // Would need completion tracking
      current_streak: Math.max(...routines.map(r => r.current_streak), 0),
      longest_streak: Math.max(...routines.map(r => r.best_streak), 0),
      total_time_practiced: routines.reduce((sum, r) => sum + (r.estimated_duration * r.total_completions), 0),
      average_session_duration: routines.length > 0 ?
        Math.round(routines.reduce((sum, r) => sum + r.estimated_duration, 0) / routines.length) : 0,
      most_practiced_time_of_day: 'anytime' as TimeOfDay,
      most_used_category: mostUsedCategory,
      category_distribution: categoryDistribution,
      average_mood_improvement: 0,
      average_energy_improvement: 0,
      average_session_rating: 0
    }

    console.log('✅ [ENHANCED STUB] Calculated routine stats:', stats)
    return stats
  }

  private static getEmptyStats(): RoutineStats {
    return {
      total_routines: 0,
      active_routines: 0,
      scheduled_routines: 0,
      favorite_routines: 0,
      total_completions: 0,
      completions_this_week: 0,
      completions_this_month: 0,
      average_completion_rate: 0,
      current_streak: 0,
      longest_streak: 0,
      total_time_practiced: 0,
      average_session_duration: 0,
      most_practiced_time_of_day: 'anytime' as TimeOfDay,
      most_used_category: 'General' as RoutineCategory,
      category_distribution: {},
      average_mood_improvement: 0,
      average_energy_improvement: 0,
      average_session_rating: 0
    }
  }

  static async generateRoutineInsights(userId: string): Promise<RoutineInsight[]> {
    console.log('Generate routine insights stub called - returning empty insights')
    return []
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static calculateEstimatedDuration(steps: any[]): number {
    return Math.round(steps.reduce((total, step) => total + (step.duration || 60), 0) / 60)
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