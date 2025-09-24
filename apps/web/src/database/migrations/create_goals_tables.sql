-- Goals Tracking System Database Schema
-- Hierarchical SMART goals with monthly/weekly/daily cascade

-- Create goals table with SMART goals structure
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic goal information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Career, Health, Personal, Financial, etc.

  -- SMART Goals Framework
  specific TEXT NOT NULL, -- What exactly will be accomplished?
  measurable TEXT NOT NULL, -- How will progress be measured?
  achievable TEXT NOT NULL, -- Is this goal realistic?
  relevant TEXT NOT NULL, -- Why is this goal important?
  time_bound DATE NOT NULL, -- When will this be completed?

  -- Hierarchy and Structure
  goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('monthly', 'weekly', 'daily', 'one-time', 'long-term')),
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL, -- Links to parent goal
  hierarchy_level INTEGER DEFAULT 0, -- 0=monthly, 1=weekly, 2=daily

  -- Progress Tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_value DECIMAL(10,2), -- Current measurement value
  target_value DECIMAL(10,2), -- Target measurement value
  unit VARCHAR(50), -- Unit of measurement (hours, pages, miles, etc.)

  -- Scheduling and Deadlines
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE NOT NULL,
  completion_date DATE,

  -- Metadata
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=highest, 5=lowest
  difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  energy_required INTEGER DEFAULT 3 CHECK (energy_required >= 1 AND energy_required <= 5),

  -- Additional fields
  notes TEXT,
  tags TEXT[], -- Array of tags for categorization
  milestones JSONB DEFAULT '[]', -- Array of milestone objects

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create goal_progress_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS goal_progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Progress entry details
  log_date DATE DEFAULT CURRENT_DATE,
  progress_value DECIMAL(10,2) NOT NULL, -- Progress made this entry
  cumulative_value DECIMAL(10,2) NOT NULL, -- Total progress so far
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),

  -- Context and notes
  notes TEXT,
  reflection TEXT, -- What worked/didn't work
  challenges TEXT, -- Obstacles faced
  next_actions TEXT, -- What to do next

  -- Metadata
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mood INTEGER CHECK (mood >= 1 AND mood <= 10), -- How did you feel during this progress
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10)
);

-- Create goal_alignments table to track parent-child relationships and alignment
CREATE TABLE IF NOT EXISTS goal_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  child_goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Alignment details
  alignment_strength INTEGER DEFAULT 5 CHECK (alignment_strength >= 1 AND alignment_strength <= 10),
  contribution_percentage INTEGER DEFAULT 25 CHECK (contribution_percentage >= 0 AND contribution_percentage <= 100),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,

  -- Ensure no circular references
  UNIQUE(parent_goal_id, child_goal_id)
);

-- Create goal_templates table for common goal patterns
CREATE TABLE IF NOT EXISTS goal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system templates

  -- Template details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  goal_type VARCHAR(20) NOT NULL,

  -- SMART template structure
  specific_template TEXT,
  measurable_template TEXT,
  achievable_template TEXT,
  relevant_template TEXT,
  time_bound_default_days INTEGER DEFAULT 30,

  -- Default values
  default_target_value DECIMAL(10,2),
  default_unit VARCHAR(50),
  default_priority INTEGER DEFAULT 3,
  suggested_milestones JSONB DEFAULT '[]',

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal_id ON goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_hierarchy_level ON goals(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);

CREATE INDEX IF NOT EXISTS idx_goal_progress_logs_goal_id ON goal_progress_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_logs_user_id ON goal_progress_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_logs_log_date ON goal_progress_logs(log_date);

CREATE INDEX IF NOT EXISTS idx_goal_alignments_parent_goal_id ON goal_alignments(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_alignments_child_goal_id ON goal_alignments(child_goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_alignments_user_id ON goal_alignments(user_id);

CREATE INDEX IF NOT EXISTS idx_goal_templates_user_id ON goal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_templates_category ON goal_templates(category);
CREATE INDEX IF NOT EXISTS idx_goal_templates_goal_type ON goal_templates(goal_type);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own goal progress logs" ON goal_progress_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own goal alignments" ON goal_alignments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own templates and public templates" ON goal_templates
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can only modify their own templates" ON goal_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own templates" ON goal_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own templates" ON goal_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_templates_updated_at BEFORE UPDATE ON goal_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default goal templates
INSERT INTO goal_templates (name, description, category, goal_type, specific_template, measurable_template, achievable_template, relevant_template, time_bound_default_days, default_target_value, default_unit, suggested_milestones) VALUES
  (
    'Read Books Monthly',
    'Template for monthly reading goals',
    'Personal Development',
    'monthly',
    'Read [X] books this month to expand knowledge and personal growth',
    'Complete reading [X] books, tracking pages and completion dates',
    'Choose books appropriate to reading speed and available time',
    'Reading builds knowledge, reduces stress, and improves cognitive function',
    30,
    4,
    'books',
    '[{"title": "Choose books", "target_date": 3}, {"title": "Read 25% of target", "target_date": 10}, {"title": "Read 50% of target", "target_date": 20}, {"title": "Complete reading goal", "target_date": 30}]'
  ),
  (
    'Exercise Weekly',
    'Template for weekly exercise goals',
    'Health & Fitness',
    'weekly',
    'Complete [X] workout sessions this week',
    'Track [X] workout sessions of at least [Y] minutes each',
    'Set realistic workout frequency based on current fitness level',
    'Regular exercise improves health, energy, and mental well-being',
    7,
    3,
    'sessions',
    '[{"title": "Plan workout schedule", "target_date": 1}, {"title": "Complete first workout", "target_date": 2}, {"title": "Complete mid-week workouts", "target_date": 4}, {"title": "Finish weekly goal", "target_date": 7}]'
  ),
  (
    'Daily Task Completion',
    'Template for daily productivity goals',
    'Productivity',
    'daily',
    'Complete [X] important tasks today',
    'Finish [X] tasks from priority task list',
    'Choose achievable number of tasks based on complexity and time available',
    'Daily task completion builds momentum and reduces stress',
    1,
    3,
    'tasks',
    '[{"title": "Review task list", "target_date": 0.25}, {"title": "Complete first task", "target_date": 0.5}, {"title": "Complete remaining tasks", "target_date": 1}]'
  );