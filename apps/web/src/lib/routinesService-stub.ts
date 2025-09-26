// Temporary stub for routines service to prevent Supabase errors
// TODO: Replace with full PostgreSQL implementation

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
    console.log('Get user routines stub called - returning empty routines')
    return []
  }

  static async getUserRoutine(userId: string, routineId: string): Promise<UserRoutine | null> {
    console.log('Get user routine stub called - returning null')
    return null
  }

  static async createRoutineFromTemplate(userId: string, templateId: string, customizations: Partial<CreateUserRoutineInput> = {}): Promise<UserRoutine> {
    console.log('Create routine from template stub called - not implemented yet')
    throw new Error('Create routine from template not yet implemented')
  }

  static async createUserRoutine(userId: string, input: CreateUserRoutineInput): Promise<UserRoutine> {
    console.log('🔧 [STUB] createUserRoutine called with:', { userId, input })

    // Validate input
    if (!input.steps || !Array.isArray(input.steps) || input.steps.length === 0) {
      console.error('❌ [STUB] createUserRoutine: invalid steps')
      throw new Error('Routine steps are required and must be a non-empty array')
    }

    // Return a mock routine for now
    const mockRoutine: UserRoutine = {
      id: `routine-${Date.now()}`,
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

    console.log('✅ [STUB] createUserRoutine returning mock routine:', mockRoutine)
    return mockRoutine
  }

  static async updateUserRoutine(userId: string, routineId: string, updates: UpdateUserRoutineInput): Promise<UserRoutine> {
    console.log('Update user routine stub called - not implemented yet')
    throw new Error('Update routine not yet implemented')
  }

  static async deleteUserRoutine(userId: string, routineId: string): Promise<void> {
    console.log('Delete user routine stub called - not implemented yet')
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
    console.log('Get routine stats stub called - returning empty stats')
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