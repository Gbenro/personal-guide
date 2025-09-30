// Enhanced stub for routines service with localStorage persistence
// TODO: Replace with full PostgreSQL implementation

// Simple localStorage-based storage for routines
class RoutineStorage {
  private static ROUTINES_KEY = 'pg_user_routines'
  private static TEMPLATES_KEY = 'pg_routine_templates'
  private static SESSIONS_KEY = 'pg_routine_sessions'

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
    console.log('Start routine session stub called - not implemented yet')
    throw new Error('Start routine session not yet implemented')
  }

  static async getActiveSession(userId: string, routineId: string): Promise<RoutineSession | null> {
    console.log('Get active session stub called - returning null')
    return null
  }

  static async updateSessionProgress(userId: string, sessionId: string, updates: Partial<RoutineSession>): Promise<RoutineSession> {
    console.log('Update session progress stub called - not implemented yet')
    throw new Error('Update session progress not yet implemented')
  }

  static async completeRoutineStep(userId: string, input: CompleteRoutineStepInput): Promise<void> {
    console.log('Complete routine step stub called - not implemented yet')
  }

  static async skipRoutineStep(userId: string, input: SkipRoutineStepInput): Promise<void> {
    console.log('Skip routine step stub called - not implemented yet')
  }

  static async completeRoutineSession(userId: string, input: CompleteRoutineSessionInput): Promise<RoutineCompletion> {
    console.log('Complete routine session stub called - not implemented yet')
    throw new Error('Complete routine session not yet implemented')
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