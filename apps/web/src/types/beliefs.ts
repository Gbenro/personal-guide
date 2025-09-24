// Belief Installation System TypeScript Types
// 21-day reinforcement cycles with daily affirmations, visualization, and progress tracking

export type BeliefCategory = 'Self-Worth' | 'Confidence' | 'Success' | 'Health' | 'Abundance' | 'Love' | 'Peace' | 'Personal Growth' | 'Career' | 'Relationships'
export type BeliefCycleStatus = 'active' | 'completed' | 'paused' | 'abandoned'
export type MilestoneType = 'weekly_check' | 'breakthrough' | 'resistance_overcome' | 'completion' | 'custom'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime' | 'before challenges' | 'during stress' | 'during exercise'

export interface BeliefSystem {
  id: string
  user_id?: string // null for system beliefs
  title: string
  description?: string
  category: BeliefCategory
  belief_statement: string
  affirmations: string[]
  visualization_script?: string
  journaling_prompts: string[]
  daily_activities: BeliefActivity[]
  cycle_length: number // Usually 21 days
  times_started: number
  times_completed: number
  average_effectiveness: number
  is_public: boolean
  is_featured: boolean
  created_at: Date
  updated_at: Date
  created_by?: string
}

export interface BeliefActivity {
  name: string
  description: string
  duration: number // minutes
  required?: boolean
  order?: number
}

export interface UserBeliefCycle {
  id: string
  user_id: string
  belief_system_id: string
  title: string
  personal_belief_statement: string
  personal_reason?: string
  status: BeliefCycleStatus
  current_day: number
  start_date: Date
  target_completion_date?: Date
  actual_completion_date?: Date
  days_completed: number
  consecutive_days: number
  total_activities_completed: number
  initial_belief_strength?: number // 1-10
  current_belief_strength?: number // 1-10
  target_belief_strength?: number // 1-10
  preferred_reminder_time?: string // HH:MM format
  custom_affirmations: string[]
  custom_activities: BeliefActivity[]
  created_at: Date
  updated_at: Date
  archived_at?: Date
}

export interface DailyBeliefActivity {
  id: string
  user_id: string
  cycle_id: string
  day_number: number
  date: Date

  // Activity completions
  read_affirmation_completed: boolean
  speak_affirmation_completed: boolean
  visualization_completed: boolean
  journaling_completed: boolean

  // Activity data
  affirmations_read: string[]
  spoken_affirmation_count: number
  visualization_duration_minutes?: number
  visualization_notes?: string
  journal_entry?: string
  journal_insights?: string

  // Daily reflection
  belief_strength_rating?: number // 1-10
  mood_rating?: number // 1-10
  confidence_rating?: number // 1-10
  resistance_level?: number // 1-10

  // Daily notes
  daily_notes?: string
  challenges_faced?: string
  breakthroughs?: string
  gratitude_items: string[]

  // Completion tracking
  completion_percentage: number
  completed_at?: Date

  created_at: Date
  updated_at: Date
}

export interface BeliefMilestone {
  id: string
  user_id: string
  cycle_id: string
  day_number: number
  milestone_type: MilestoneType
  title: string
  description?: string
  belief_strength_before?: number
  belief_strength_after?: number
  confidence_change?: number
  insights?: string
  evidence_observed?: string
  behavior_changes?: string
  achieved_at: Date
  created_at: Date
}

export interface BeliefAffirmation {
  id: string
  category: BeliefCategory
  affirmation_text: string
  variation_texts: string[]
  best_for_times_of_day: TimeOfDay[]
  difficulty_level: number // 1-5
  usage_count: number
  average_rating: number
  is_public: boolean
  created_at: Date
  created_by?: string
}

export interface BeliefVisualizationScript {
  id: string
  category: BeliefCategory
  title: string
  script_text: string
  duration_minutes: number
  audio_url?: string
  background_music_url?: string
  image_url?: string
  usage_count: number
  average_rating: number
  difficulty_level: number // 1-5
  is_public: boolean
  created_at: Date
  created_by?: string
}

// Input types for creating/updating
export interface CreateBeliefSystemInput {
  title: string
  description?: string
  category: BeliefCategory
  belief_statement: string
  affirmations: string[]
  visualization_script?: string
  journaling_prompts?: string[]
  daily_activities?: BeliefActivity[]
  cycle_length?: number
  is_public?: boolean
}

export interface CreateBeliefCycleInput {
  belief_system_id: string
  title?: string
  personal_belief_statement?: string
  personal_reason?: string
  target_belief_strength?: number
  preferred_reminder_time?: string
  custom_affirmations?: string[]
  custom_activities?: BeliefActivity[]
}

export interface UpdateBeliefCycleInput {
  title?: string
  personal_belief_statement?: string
  personal_reason?: string
  status?: BeliefCycleStatus
  current_belief_strength?: number
  target_belief_strength?: number
  preferred_reminder_time?: string
  custom_affirmations?: string[]
  custom_activities?: BeliefActivity[]
}

export interface UpdateDailyActivityInput {
  read_affirmation_completed?: boolean
  speak_affirmation_completed?: boolean
  visualization_completed?: boolean
  journaling_completed?: boolean
  affirmations_read?: string[]
  spoken_affirmation_count?: number
  visualization_duration_minutes?: number
  visualization_notes?: string
  journal_entry?: string
  journal_insights?: string
  belief_strength_rating?: number
  mood_rating?: number
  confidence_rating?: number
  resistance_level?: number
  daily_notes?: string
  challenges_faced?: string
  breakthroughs?: string
  gratitude_items?: string[]
}

export interface CreateMilestoneInput {
  cycle_id: string
  day_number: number
  milestone_type: MilestoneType
  title: string
  description?: string
  belief_strength_before?: number
  belief_strength_after?: number
  confidence_change?: number
  insights?: string
  evidence_observed?: string
  behavior_changes?: string
}

// Filter and search types
export interface BeliefSystemFilters {
  category?: BeliefCategory[]
  difficulty_level?: number[]
  cycle_length?: [number, number] // [min, max] days
  is_public?: boolean
  is_featured?: boolean
  search?: string
}

export interface BeliefCycleFilters {
  status?: BeliefCycleStatus[]
  category?: BeliefCategory[]
  start_date_range?: [Date, Date]
  search?: string
}

// Statistics and analytics
export interface BeliefStats {
  total_cycles: number
  active_cycles: number
  completed_cycles: number
  paused_cycles: number

  // Completion stats
  total_days_practiced: number
  current_streak: number
  longest_streak: number
  average_cycle_completion_rate: number

  // Effectiveness
  average_belief_strength_improvement: number
  average_mood_improvement: number
  average_confidence_improvement: number

  // Popular categories
  most_practiced_category: BeliefCategory
  category_distribution: Record<BeliefCategory, number>

  // Daily activity stats
  total_affirmations_spoken: number
  total_visualization_minutes: number
  total_journal_entries: number
  average_daily_completion_rate: number
}

export interface BeliefInsight {
  type: 'progress' | 'breakthrough' | 'resistance' | 'suggestion' | 'milestone'
  title: string
  description: string
  cycle_id?: string
  priority: 'high' | 'medium' | 'low'
  action_suggested?: string
  created_at: Date
}

export interface BeliefProgress {
  cycle_id: string
  cycle_title: string
  belief_statement: string
  current_day: number
  total_days: number
  days_completed: number
  consecutive_days: number
  completion_percentage: number
  belief_strength_progress: number // positive/negative change
  recent_activities: DailyBeliefActivity[]
  next_milestone?: BeliefMilestone
}

export interface BeliefRecommendation {
  belief_system_id: string
  title: string
  category: BeliefCategory
  reason: string
  confidence: number // 0-1
  based_on: string[] // factors used for recommendation
}

// Calendar and scheduling
export interface BeliefCalendarEvent {
  id: string
  cycle_id: string
  belief_title: string
  day_number: number
  scheduled_time?: string
  activities: BeliefActivity[]
  is_completed: boolean
  completion_percentage: number
}

export interface DailyBeliefSummary {
  date: Date
  cycles: UserBeliefCycle[]
  activities: DailyBeliefActivity[]
  total_activities: number
  completed_activities: number
  average_belief_strength: number
  mood_average: number
}

// Gamification and achievements
export interface BeliefAchievement {
  id: string
  title: string
  description: string
  icon: string
  criteria: {
    type: 'streak' | 'cycles_completed' | 'days_practiced' | 'belief_strength' | 'specific_milestone'
    value: number
    category?: BeliefCategory
  }
  is_unlocked: boolean
  unlocked_at?: Date
}

export interface BeliefStreak {
  current_streak: number
  longest_streak: number
  streak_type: 'daily_practice' | 'cycle_completion' | 'affirmation_speaking' | 'visualization'
  last_activity_date: Date
}

// Session state for active belief work
export interface BeliefSessionState {
  cycle: UserBeliefCycle
  daily_activity: DailyBeliefActivity
  current_activity_index: number
  session_start_time: Date
  is_session_active: boolean
  completed_activities: string[]
}

// Analytics and trends
export interface BeliefTrend {
  cycle_id: string
  metric: 'belief_strength' | 'mood' | 'confidence' | 'resistance'
  data_points: Array<{
    day: number
    value: number
    date: Date
  }>
  trend_direction: 'improving' | 'declining' | 'stable'
  confidence_level: number
}

export interface BeliefEffectivenessReport {
  cycle_id: string
  cycle_title: string
  start_date: Date
  end_date?: Date
  initial_belief_strength: number
  final_belief_strength: number
  improvement_percentage: number
  most_effective_activities: string[]
  challenges_overcome: string[]
  key_breakthroughs: BeliefMilestone[]
  overall_rating: number
}

// Export convenience types
export type BeliefSystemWithUsage = BeliefSystem & {
  user_cycle_id?: string // if user has active cycle from this system
  last_used?: Date
  user_effectiveness_rating?: number
}

export type UserBeliefCycleWithStats = UserBeliefCycle & {
  belief_system: BeliefSystem
  recent_activities: DailyBeliefActivity[]
  milestones: BeliefMilestone[]
  progress_trend: BeliefTrend[]
}