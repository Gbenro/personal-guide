// Goals System TypeScript Types
// Hierarchical SMART goals with monthly/weekly/daily cascade

export type GoalType = 'monthly' | 'weekly' | 'daily' | 'one-time' | 'long-term'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'
export type GoalCategory =
  | 'Career'
  | 'Health & Fitness'
  | 'Personal Development'
  | 'Financial'
  | 'Relationships'
  | 'Education'
  | 'Hobbies'
  | 'Spiritual'
  | 'Travel'
  | 'Other'

export interface GoalMilestone {
  id: string
  title: string
  description?: string
  target_date: number // Days from start
  completed: boolean
  completion_date?: Date
}

export interface SMARTCriteria {
  specific: string      // What exactly will be accomplished?
  measurable: string    // How will progress be measured?
  achievable: string    // Is this goal realistic?
  relevant: string      // Why is this goal important?
  time_bound: Date      // When will this be completed?
}

export interface Goal extends SMARTCriteria {
  id: string
  user_id: string

  // Basic information
  title: string
  description?: string
  category: GoalCategory

  // Hierarchy
  goal_type: GoalType
  parent_goal_id?: string
  hierarchy_level: number // 0=monthly, 1=weekly, 2=daily
  child_goals?: Goal[]
  parent_goal?: Goal

  // Progress tracking
  status: GoalStatus
  progress_percentage: number
  current_value?: number
  target_value?: number
  unit?: string

  // Scheduling
  start_date: Date
  target_date: Date
  completion_date?: Date

  // Metadata
  priority: number     // 1-5 (1=highest)
  difficulty: number   // 1-5 (1=easiest)
  energy_required: number // 1-5 (1=low energy)

  // Additional
  notes?: string
  tags: string[]
  milestones: GoalMilestone[]

  // Audit
  created_at: Date
  updated_at: Date
  archived_at?: Date
}

export interface GoalProgressLog {
  id: string
  goal_id: string
  user_id: string

  // Progress details
  log_date: Date
  progress_value: number
  cumulative_value: number
  percentage: number

  // Context
  notes?: string
  reflection?: string
  challenges?: string
  next_actions?: string

  // Metadata
  logged_at: Date
  mood?: number        // 1-10
  energy_level?: number // 1-10
}

export interface GoalAlignment {
  id: string
  parent_goal_id: string
  child_goal_id: string
  user_id: string

  // Alignment details
  alignment_strength: number    // 1-10 (how well aligned)
  contribution_percentage: number // 0-100 (how much child contributes to parent)

  // Metadata
  created_at: Date
  notes?: string
}

export interface GoalTemplate {
  id: string
  user_id?: string // null for system templates

  // Template details
  name: string
  description?: string
  category: GoalCategory
  goal_type: GoalType

  // SMART template
  specific_template: string
  measurable_template: string
  achievable_template: string
  relevant_template: string
  time_bound_default_days: number

  // Defaults
  default_target_value?: number
  default_unit?: string
  default_priority: number
  suggested_milestones: GoalMilestone[]

  // Usage
  times_used: number
  is_public: boolean

  // Metadata
  created_at: Date
  updated_at: Date
}

export interface CreateGoalInput {
  title: string
  description?: string
  category: GoalCategory
  goal_type: GoalType
  parent_goal_id?: string

  // SMART criteria
  specific: string
  measurable: string
  achievable: string
  relevant: string
  time_bound: Date

  // Progress
  target_value?: number
  unit?: string

  // Scheduling
  start_date?: Date
  target_date: Date

  // Metadata
  priority?: number
  difficulty?: number
  energy_required?: number
  notes?: string
  tags?: string[]
  milestones?: Omit<GoalMilestone, 'id' | 'completed' | 'completion_date'>[]
}

export interface UpdateGoalInput {
  title?: string
  description?: string
  category?: GoalCategory
  status?: GoalStatus

  // SMART criteria
  specific?: string
  measurable?: string
  achievable?: string
  relevant?: string
  time_bound?: Date

  // Progress
  current_value?: number
  target_value?: number
  unit?: string
  progress_percentage?: number

  // Scheduling
  start_date?: Date
  target_date?: Date
  completion_date?: Date

  // Metadata
  priority?: number
  difficulty?: number
  energy_required?: number
  notes?: string
  tags?: string[]
  milestones?: GoalMilestone[]
}

export interface GoalFilters {
  status?: GoalStatus[]
  goal_type?: GoalType[]
  category?: GoalCategory[]
  priority?: number[]
  due_soon?: boolean // Due within next 7 days
  overdue?: boolean
  parent_goal_id?: string
  search?: string
  tags?: string[]
}

export interface GoalStats {
  total_goals: number
  active_goals: number
  completed_goals: number
  paused_goals: number
  cancelled_goals: number

  // By type
  monthly_goals: number
  weekly_goals: number
  daily_goals: number

  // Progress
  average_progress: number
  on_track_goals: number
  behind_goals: number
  ahead_goals: number

  // Timing
  due_today: number
  due_this_week: number
  overdue_goals: number

  // Completion rates
  completion_rate_this_month: number
  completion_rate_last_month: number

  // Streaks
  current_daily_streak: number
  longest_daily_streak: number
}

export interface GoalInsight {
  type: 'achievement' | 'warning' | 'suggestion' | 'milestone'
  title: string
  description: string
  goal_id?: string
  priority: 'high' | 'medium' | 'low'
  action_required: boolean
  created_at: Date
}

export interface GoalHierarchyView {
  monthly_goals: Goal[]
  weekly_goals: Goal[]
  daily_goals: Goal[]
  alignments: GoalAlignment[]
}

export interface CreateGoalFromTemplateInput {
  template_id: string
  title?: string
  target_value?: number
  start_date?: Date
  target_date?: Date
  customizations?: {
    specific?: string
    measurable?: string
    achievable?: string
    relevant?: string
  }
}

// Progress tracking helper types
export interface GoalProgressUpdate {
  goal_id: string
  progress_value: number
  notes?: string
  reflection?: string
  challenges?: string
  next_actions?: string
  mood?: number
  energy_level?: number
}

export interface BulkGoalUpdate {
  goal_ids: string[]
  updates: Partial<UpdateGoalInput>
}

// AI insights and recommendations
export interface GoalRecommendation {
  type: 'break_down' | 'adjust_target' | 'add_milestone' | 'change_timeline' | 'align_with_parent'
  goal_id: string
  title: string
  description: string
  suggested_action: string
  confidence: number // 0-1
  reasoning: string
}

export interface GoalAnalytics {
  completion_trends: {
    date: Date
    completed: number
    started: number
  }[]
  category_performance: {
    category: GoalCategory
    completion_rate: number
    average_progress: number
    total_goals: number
  }[]
  time_allocation: {
    goal_type: GoalType
    total_hours_estimated: number
    total_hours_actual: number
  }[]
  difficulty_vs_completion: {
    difficulty: number
    completion_rate: number
    count: number
  }[]
}