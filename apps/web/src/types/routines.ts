// Routines System TypeScript Types
// Guided step-by-step flows with templates, timers, and completion tracking

export type RoutineType = 'morning' | 'evening' | 'custom' | 'workout' | 'meditation' | 'work' | 'study'
export type RoutineCategory = 'Morning' | 'Evening' | 'Midday' | 'Workout' | 'Meditation' | 'Work' | 'Study' | 'Wellness' | 'General'
export type RoutineSessionStatus = 'active' | 'paused' | 'completed' | 'abandoned'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime'

export interface RoutineStep {
  id: string
  name: string
  description: string
  instructions: string
  duration: number // seconds
  order: number
  is_timed?: boolean
  requires_timer?: boolean
  requires_music?: boolean
  requires_guidance?: boolean
  audio_url?: string
  video_url?: string
  image_url?: string
  guidance_text?: string
  category?: string
  difficulty_level?: number // 1-5
}

export interface RoutineTemplate {
  id: string
  user_id?: string // null for system templates
  name: string
  description?: string
  category: RoutineCategory
  routine_type: RoutineType
  estimated_duration: number // minutes
  difficulty_level: number // 1-5
  energy_required: number // 1-5
  steps: RoutineStep[]
  is_public: boolean
  is_featured: boolean
  times_used: number
  average_rating: number
  allows_customization: boolean
  allows_step_reordering: boolean
  allows_timer_adjustment: boolean
  created_at: Date
  updated_at: Date
  created_by?: string
}

export interface UserRoutine {
  id: string
  user_id: string
  template_id?: string
  name: string
  description?: string
  category: RoutineCategory
  routine_type: RoutineType
  steps: RoutineStep[]
  estimated_duration: number // minutes
  preferred_time_of_day?: TimeOfDay

  // Schedule settings
  is_scheduled: boolean
  scheduled_days: number[] // 1=Monday, 7=Sunday
  scheduled_time?: string // HH:MM format
  timezone?: string

  // Progress and stats
  total_completions: number
  current_streak: number
  best_streak: number
  last_completed_at?: Date
  average_completion_time?: number // actual minutes taken

  // Status
  is_active: boolean
  is_favorite: boolean

  // Metadata
  created_at: Date
  updated_at: Date
  archived_at?: Date
}

export interface RoutineCompletion {
  id: string
  user_id: string
  routine_id: string
  started_at: Date
  completed_at?: Date
  duration_minutes?: number
  completion_percentage: number

  // Step tracking
  steps_completed: StepCompletion[]
  steps_skipped: StepSkip[]

  // Experience tracking
  mood_before?: number // 1-10
  mood_after?: number // 1-10
  energy_before?: number // 1-10
  energy_after?: number // 1-10
  focus_level?: number // 1-10

  // Feedback
  rating?: number // 1-5
  notes?: string
  tags: string[]

  // Context
  location?: string
  weather?: string
  interruptions_count: number

  // Metadata
  date: Date
  created_at: Date
}

export interface StepCompletion {
  step_id: string
  completed_at: Date
  duration_seconds?: number
  notes?: string
}

export interface StepSkip {
  step_id: string
  skipped_at: Date
  reason?: string
}

export interface RoutineSession {
  id: string
  user_id: string
  routine_id: string
  completion_id?: string
  status: RoutineSessionStatus
  current_step_index: number
  current_step_started_at?: Date
  total_steps: number
  completed_steps: number
  elapsed_time: number // seconds
  session_data: Record<string, any>
  pause_count: number
  total_pause_time: number // seconds
  started_at: Date
  updated_at: Date
}

export interface RoutineStepTemplate {
  id: string
  name: string
  description?: string
  instructions?: string
  category: string
  default_duration: number // seconds
  min_duration: number
  max_duration: number
  is_timed: boolean
  requires_timer: boolean
  requires_music: boolean
  requires_guidance: boolean
  difficulty_level: number // 1-5
  audio_url?: string
  video_url?: string
  image_url?: string
  guidance_text?: string
  times_used: number
  average_rating: number
  is_public: boolean
  created_at: Date
  updated_at: Date
  created_by?: string
}

// Input types for creating/updating
export interface CreateRoutineTemplateInput {
  name: string
  description?: string
  category: RoutineCategory
  routine_type: RoutineType
  estimated_duration?: number
  difficulty_level?: number
  energy_required?: number
  steps: Omit<RoutineStep, 'id'>[]
  is_public?: boolean
  allows_customization?: boolean
  allows_step_reordering?: boolean
  allows_timer_adjustment?: boolean
}

export interface CreateUserRoutineInput {
  template_id?: string
  name: string
  description?: string
  category: RoutineCategory
  routine_type: RoutineType
  steps: Omit<RoutineStep, 'id'>[]
  estimated_duration?: number
  preferred_time_of_day?: TimeOfDay
  is_scheduled?: boolean
  scheduled_days?: number[]
  scheduled_time?: string
  timezone?: string
}

export interface UpdateUserRoutineInput {
  name?: string
  description?: string
  category?: RoutineCategory
  steps?: RoutineStep[]
  estimated_duration?: number
  preferred_time_of_day?: TimeOfDay
  is_scheduled?: boolean
  scheduled_days?: number[]
  scheduled_time?: string
  timezone?: string
  is_active?: boolean
  is_favorite?: boolean
}

export interface StartRoutineSessionInput {
  routine_id: string
  mood_before?: number
  energy_before?: number
  location?: string
  weather?: string
}

export interface CompleteRoutineStepInput {
  session_id: string
  step_id: string
  duration_seconds?: number
  notes?: string
}

export interface SkipRoutineStepInput {
  session_id: string
  step_id: string
  reason?: string
}

export interface CompleteRoutineSessionInput {
  session_id: string
  mood_after?: number
  energy_after?: number
  focus_level?: number
  rating?: number
  notes?: string
  tags?: string[]
  interruptions_count?: number
}

// Filter and search types
export interface RoutineFilters {
  category?: RoutineCategory[]
  routine_type?: RoutineType[]
  difficulty_level?: number[]
  energy_required?: number[]
  duration_range?: [number, number] // [min, max] minutes
  is_scheduled?: boolean
  is_active?: boolean
  is_favorite?: boolean
  search?: string
  created_by_user?: boolean
  is_public?: boolean
}

export interface RoutineTemplateFilters {
  category?: RoutineCategory[]
  routine_type?: RoutineType[]
  difficulty_level?: number[]
  energy_required?: number[]
  duration_range?: [number, number]
  is_public?: boolean
  is_featured?: boolean
  search?: string
}

// Statistics and analytics
export interface RoutineStats {
  total_routines: number
  active_routines: number
  scheduled_routines: number
  favorite_routines: number

  // Completion stats
  total_completions: number
  completions_this_week: number
  completions_this_month: number
  average_completion_rate: number

  // Streaks
  current_streak: number
  longest_streak: number

  // Time stats
  total_time_practiced: number // minutes
  average_session_duration: number // minutes
  most_practiced_time_of_day: TimeOfDay

  // Popular categories
  most_used_category: RoutineCategory
  category_distribution: Record<RoutineCategory, number>

  // Performance
  average_mood_improvement: number
  average_energy_improvement: number
  average_session_rating: number
}

export interface RoutineInsight {
  type: 'streak' | 'consistency' | 'mood' | 'energy' | 'recommendation'
  title: string
  description: string
  routine_id?: string
  priority: 'high' | 'medium' | 'low'
  action_suggested?: string
  created_at: Date
}

export interface RoutineRecommendation {
  template_id: string
  template_name: string
  reason: string
  confidence: number // 0-1
  based_on: string[] // factors used for recommendation
}

// Timer and session management
export interface RoutineTimer {
  step_id: string
  duration: number // seconds
  elapsed: number // seconds
  is_running: boolean
  is_paused: boolean
  started_at?: Date
  paused_at?: Date
}

export interface RoutineSessionState {
  session: RoutineSession
  routine: UserRoutine
  current_step: RoutineStep
  timer?: RoutineTimer
  step_notes: Record<string, string>
  is_session_paused: boolean
}

// Progress tracking
export interface RoutineProgress {
  routine_id: string
  routine_name: string
  category: RoutineCategory
  current_streak: number
  total_completions: number
  last_completed: Date
  completion_rate_30_days: number
  average_rating: number
  mood_trend: number // positive/negative trend
  energy_trend: number
}

export interface WeeklyRoutineSchedule {
  monday: UserRoutine[]
  tuesday: UserRoutine[]
  wednesday: UserRoutine[]
  thursday: UserRoutine[]
  friday: UserRoutine[]
  saturday: UserRoutine[]
  sunday: UserRoutine[]
}

// Calendar integration
export interface RoutineCalendarEvent {
  id: string
  routine_id: string
  routine_name: string
  scheduled_time: string
  estimated_duration: number
  category: RoutineCategory
  is_completed: boolean
  completion_id?: string
}

// Export convenience types
export type RoutineWithStats = UserRoutine & {
  stats: Pick<RoutineStats, 'total_completions' | 'current_streak' | 'average_session_duration' | 'average_session_rating'>
  recent_completions: RoutineCompletion[]
}

export type RoutineTemplateWithUsage = RoutineTemplate & {
  user_routine_id?: string // if user has created routine from this template
  last_used?: Date
}