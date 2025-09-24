-- Routines/Rituals System Database Schema
-- Guided step-by-step flows with templates, timers, and completion tracking

-- Create routine_templates table for morning/evening/custom templates
CREATE TABLE IF NOT EXISTS routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system templates

  -- Template details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General', -- Morning, Evening, Workout, Meditation, etc.
  routine_type VARCHAR(50) DEFAULT 'custom' CHECK (routine_type IN ('morning', 'evening', 'custom', 'workout', 'meditation', 'work', 'study')),

  -- Template configuration
  estimated_duration INTEGER DEFAULT 30, -- minutes
  difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  energy_required INTEGER DEFAULT 3 CHECK (energy_required >= 1 AND energy_required <= 5),

  -- Template steps (ordered list)
  steps JSONB NOT NULL DEFAULT '[]', -- Array of step objects

  -- Usage and settings
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  times_used INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,

  -- Customization options
  allows_customization BOOLEAN DEFAULT TRUE,
  allows_step_reordering BOOLEAN DEFAULT TRUE,
  allows_timer_adjustment BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create user_routines table for personalized routine instances
CREATE TABLE IF NOT EXISTS user_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES routine_templates(id) ON DELETE SET NULL,

  -- Routine details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  routine_type VARCHAR(50),

  -- Personal configuration
  steps JSONB NOT NULL DEFAULT '[]', -- Customized steps array
  estimated_duration INTEGER DEFAULT 30,
  preferred_time_of_day VARCHAR(20), -- morning, afternoon, evening, night, anytime

  -- Schedule settings
  is_scheduled BOOLEAN DEFAULT FALSE,
  scheduled_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
  scheduled_time TIME,
  timezone VARCHAR(50),

  -- Progress and stats
  total_completions INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  average_completion_time INTEGER, -- actual minutes taken

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_favorite BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create routine_completions table for tracking each completion
CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES user_routines(id) ON DELETE CASCADE,

  -- Completion details
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- actual time taken
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

  -- Step completion tracking
  steps_completed JSONB DEFAULT '[]', -- Array of completed step IDs with timestamps
  steps_skipped JSONB DEFAULT '[]', -- Array of skipped step IDs with reasons

  -- Experience tracking
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
  energy_before INTEGER CHECK (energy_before >= 1 AND energy_before <= 10),
  energy_after INTEGER CHECK (energy_after >= 1 AND energy_after <= 10),
  focus_level INTEGER CHECK (focus_level >= 1 AND focus_level <= 10),

  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  tags TEXT[], -- Custom tags for this session

  -- Context
  location VARCHAR(100),
  weather VARCHAR(50),
  interruptions_count INTEGER DEFAULT 0,

  -- Metadata
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create routine_step_templates table for reusable step definitions
CREATE TABLE IF NOT EXISTS routine_step_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Step details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  category VARCHAR(100), -- breathwork, movement, mindfulness, etc.

  -- Timing
  default_duration INTEGER DEFAULT 60, -- seconds
  min_duration INTEGER DEFAULT 30,
  max_duration INTEGER DEFAULT 300,
  is_timed BOOLEAN DEFAULT TRUE,

  -- Step configuration
  requires_timer BOOLEAN DEFAULT FALSE,
  requires_music BOOLEAN DEFAULT FALSE,
  requires_guidance BOOLEAN DEFAULT FALSE,
  difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),

  -- Assets
  audio_url TEXT,
  video_url TEXT,
  image_url TEXT,
  guidance_text TEXT,

  -- Usage
  times_used INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  is_public BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create routine_sessions table for active/in-progress sessions
CREATE TABLE IF NOT EXISTS routine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES user_routines(id) ON DELETE CASCADE,
  completion_id UUID REFERENCES routine_completions(id) ON DELETE CASCADE,

  -- Session state
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  current_step_index INTEGER DEFAULT 0,
  current_step_started_at TIMESTAMP WITH TIME ZONE,

  -- Progress tracking
  total_steps INTEGER NOT NULL,
  completed_steps INTEGER DEFAULT 0,
  elapsed_time INTEGER DEFAULT 0, -- seconds

  -- Session data
  session_data JSONB DEFAULT '{}', -- Store step states, notes, etc.
  pause_count INTEGER DEFAULT 0,
  total_pause_time INTEGER DEFAULT 0, -- seconds

  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routine_templates_user_id ON routine_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_templates_category ON routine_templates(category);
CREATE INDEX IF NOT EXISTS idx_routine_templates_routine_type ON routine_templates(routine_type);
CREATE INDEX IF NOT EXISTS idx_routine_templates_is_public ON routine_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_routine_templates_is_featured ON routine_templates(is_featured);

CREATE INDEX IF NOT EXISTS idx_user_routines_user_id ON user_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_routines_template_id ON user_routines(template_id);
CREATE INDEX IF NOT EXISTS idx_user_routines_category ON user_routines(category);
CREATE INDEX IF NOT EXISTS idx_user_routines_routine_type ON user_routines(routine_type);
CREATE INDEX IF NOT EXISTS idx_user_routines_is_active ON user_routines(is_active);
CREATE INDEX IF NOT EXISTS idx_user_routines_is_scheduled ON user_routines(is_scheduled);

CREATE INDEX IF NOT EXISTS idx_routine_completions_user_id ON routine_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_completions_routine_id ON routine_completions(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_completions_date ON routine_completions(date);
CREATE INDEX IF NOT EXISTS idx_routine_completions_completed_at ON routine_completions(completed_at);

CREATE INDEX IF NOT EXISTS idx_routine_step_templates_category ON routine_step_templates(category);
CREATE INDEX IF NOT EXISTS idx_routine_step_templates_is_public ON routine_step_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_routine_sessions_user_id ON routine_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_sessions_routine_id ON routine_sessions(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_sessions_status ON routine_sessions(status);

-- Enable Row Level Security
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access their own routines and public templates" ON routine_templates
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own routine templates" ON routine_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine templates" ON routine_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine templates" ON routine_templates
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own user routines" ON user_routines
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own routine completions" ON routine_completions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access public step templates and their own" ON routine_step_templates
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create step templates" ON routine_step_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own step templates" ON routine_step_templates
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own step templates" ON routine_step_templates
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can only access their own routine sessions" ON routine_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_routine_templates_updated_at BEFORE UPDATE ON routine_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_routines_updated_at BEFORE UPDATE ON user_routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_step_templates_updated_at BEFORE UPDATE ON routine_step_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_sessions_updated_at BEFORE UPDATE ON routine_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default routine templates
INSERT INTO routine_templates (name, description, category, routine_type, estimated_duration, steps, is_public, is_featured) VALUES
  (
    'Energizing Morning Flow',
    'A gentle 15-minute morning routine to wake up your body and mind',
    'Morning',
    'morning',
    15,
    '[
      {"id": "hydration", "name": "Hydration", "description": "Drink a full glass of water", "duration": 60, "instructions": "Slowly drink 16-20oz of room temperature water to rehydrate after sleep", "order": 1},
      {"id": "stretching", "name": "Gentle Stretching", "description": "Light body stretches", "duration": 300, "instructions": "Perform gentle neck, shoulder, and back stretches. Focus on releasing tension from sleep", "order": 2},
      {"id": "breathing", "name": "Deep Breathing", "description": "Energizing breath work", "duration": 180, "instructions": "Take 10 deep breaths: inhale for 4 counts, hold for 4, exhale for 6", "order": 3},
      {"id": "intention", "name": "Set Daily Intention", "description": "Choose your focus for the day", "duration": 120, "instructions": "Reflect on what you want to accomplish and how you want to feel today", "order": 4},
      {"id": "affirmation", "name": "Positive Affirmation", "description": "Speak your morning affirmation", "duration": 60, "instructions": "Say: I am energized, focused, and ready for a productive day", "order": 5}
    ]',
    true,
    true
  ),
  (
    'Peaceful Evening Wind-Down',
    'A calming 20-minute evening routine to prepare for restful sleep',
    'Evening',
    'evening',
    20,
    '[
      {"id": "reflection", "name": "Daily Reflection", "description": "Review your day", "duration": 300, "instructions": "Think about 3 things you accomplished and 3 things you are grateful for", "order": 1},
      {"id": "stretching", "name": "Relaxing Stretches", "description": "Gentle evening stretches", "duration": 420, "instructions": "Perform gentle yoga stretches focusing on hips, back, and shoulders", "order": 2},
      {"id": "breathing", "name": "Calming Breath Work", "description": "Relaxing breathing exercise", "duration": 240, "instructions": "Practice 4-7-8 breathing: inhale for 4, hold for 7, exhale for 8", "order": 3},
      {"id": "gratitude", "name": "Gratitude Practice", "description": "Express gratitude", "duration": 120, "instructions": "Write or think about 3 specific things you are grateful for today", "order": 4},
      {"id": "preparation", "name": "Sleep Preparation", "description": "Prepare for sleep", "duration": 120, "instructions": "Dim lights, put away devices, and set out clothes for tomorrow", "order": 5}
    ]',
    true,
    true
  ),
  (
    'Quick Midday Reset',
    'A 10-minute routine to recharge during busy days',
    'Midday',
    'custom',
    10,
    '[
      {"id": "pause", "name": "Mindful Pause", "description": "Take a moment to center", "duration": 60, "instructions": "Stop what you are doing and take 3 conscious breaths", "order": 1},
      {"id": "movement", "name": "Body Movement", "description": "Get your body moving", "duration": 240, "instructions": "Do light stretching, walk around, or do jumping jacks", "order": 2},
      {"id": "hydration", "name": "Hydrate", "description": "Drink water mindfully", "duration": 60, "instructions": "Drink water slowly while focusing on the sensation", "order": 3},
      {"id": "breathing", "name": "Energy Reset", "description": "Energizing breathing", "duration": 180, "instructions": "Take 5 deep, energizing breaths to reset your energy", "order": 4},
      {"id": "intention", "name": "Refocus Intention", "description": "Set intention for rest of day", "duration": 60, "instructions": "Choose your priority focus for the remainder of the day", "order": 5}
    ]',
    true,
    true
  ),
  (
    'Meditation Foundation',
    'A simple 15-minute meditation routine for beginners',
    'Meditation',
    'meditation',
    15,
    '[
      {"id": "setup", "name": "Setup Space", "description": "Prepare your meditation space", "duration": 120, "instructions": "Find a quiet spot, sit comfortably, and close your eyes", "order": 1},
      {"id": "body_scan", "name": "Body Scan", "description": "Check in with your body", "duration": 300, "instructions": "Starting from your head, notice sensations in each part of your body", "order": 2},
      {"id": "breath_focus", "name": "Breath Focus", "description": "Focus on your breathing", "duration": 480, "instructions": "Focus on the sensation of breathing. When mind wanders, gently return to breath", "order": 3},
      {"id": "loving_kindness", "name": "Loving Kindness", "description": "Send good wishes", "duration": 180, "instructions": "Send kind thoughts to yourself, loved ones, and all beings", "order": 4},
      {"id": "transition", "name": "Gentle Transition", "description": "Return to awareness", "duration": 120, "instructions": "Slowly wiggle fingers and toes, open eyes, and take a moment before continuing", "order": 5}
    ]',
    true,
    true
  );

-- Insert default step templates
INSERT INTO routine_step_templates (name, description, instructions, category, default_duration, is_timed, requires_timer, difficulty_level, is_public) VALUES
  ('Deep Breathing', 'Focus on slow, deep breaths', 'Inhale slowly through nose for 4 counts, hold for 4, exhale through mouth for 6 counts', 'Breathwork', 180, true, true, 1, true),
  ('Gentle Stretching', 'Light stretching to release tension', 'Perform gentle neck rolls, shoulder shrugs, and spinal twists', 'Movement', 300, true, false, 2, true),
  ('Mindful Hydration', 'Conscious water drinking', 'Slowly drink water while focusing on the sensation and your body''s need for hydration', 'Wellness', 60, false, false, 1, true),
  ('Gratitude Reflection', 'Think about what you''re grateful for', 'Identify 3 specific things you appreciate about your life right now', 'Mindfulness', 120, false, false, 1, true),
  ('Body Scan', 'Notice sensations throughout your body', 'Starting from the top of your head, slowly scan down noticing any sensations or tension', 'Mindfulness', 300, true, false, 2, true),
  ('Intention Setting', 'Choose your focus for the day', 'Reflect on what you want to accomplish and how you want to show up today', 'Planning', 120, false, false, 1, true),
  ('Progressive Relaxation', 'Systematically relax each muscle group', 'Tense and release each muscle group starting from toes and moving up to your head', 'Relaxation', 600, true, true, 3, true),
  ('Visualization', 'Create positive mental imagery', 'Visualize yourself successfully completing your goals with confidence and ease', 'Mindfulness', 240, true, false, 2, true);