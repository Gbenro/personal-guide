-- Belief Installation System Database Schema
-- 21-day reinforcement cycles with daily affirmations, visualization, and progress tracking

-- Create belief_systems table for belief installation programs
CREATE TABLE IF NOT EXISTS belief_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system beliefs

  -- Belief details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Personal Growth', -- Self-Worth, Confidence, Health, Success, etc.

  -- Core belief statement
  belief_statement TEXT NOT NULL, -- "I am worthy of success and happiness"

  -- Supporting affirmations and activities
  affirmations JSONB DEFAULT '[]', -- Array of affirmation texts
  visualization_script TEXT, -- Guided visualization text
  journaling_prompts JSONB DEFAULT '[]', -- Array of daily journal prompts

  -- Program structure
  cycle_length INTEGER DEFAULT 21, -- Days in cycle (usually 21 for neuroplasticity)
  daily_activities JSONB DEFAULT '[]', -- Array of daily activity definitions

  -- Usage and effectiveness
  times_started INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 0,
  average_effectiveness DECIMAL(3,2) DEFAULT 0.0, -- User-reported effectiveness
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create user_belief_cycles table for individual user's belief installation cycles
CREATE TABLE IF NOT EXISTS user_belief_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belief_system_id UUID NOT NULL REFERENCES belief_systems(id) ON DELETE CASCADE,

  -- Cycle details
  title VARCHAR(255) NOT NULL,
  personal_belief_statement TEXT NOT NULL, -- User's personalized version
  personal_reason TEXT, -- Why this belief is important to the user

  -- Cycle status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  current_day INTEGER DEFAULT 1,
  start_date DATE DEFAULT CURRENT_DATE,
  target_completion_date DATE,
  actual_completion_date DATE,

  -- Progress tracking
  days_completed INTEGER DEFAULT 0,
  consecutive_days INTEGER DEFAULT 0,
  total_activities_completed INTEGER DEFAULT 0,

  -- Effectiveness tracking
  initial_belief_strength INTEGER CHECK (initial_belief_strength >= 1 AND initial_belief_strength <= 10),
  current_belief_strength INTEGER CHECK (current_belief_strength >= 1 AND current_belief_strength <= 10),
  target_belief_strength INTEGER CHECK (target_belief_strength >= 1 AND target_belief_strength <= 10),

  -- Custom settings
  preferred_reminder_time TIME,
  custom_affirmations JSONB DEFAULT '[]',
  custom_activities JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create daily_belief_activities table for tracking daily progress
CREATE TABLE IF NOT EXISTS daily_belief_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES user_belief_cycles(id) ON DELETE CASCADE,

  -- Activity details
  day_number INTEGER NOT NULL,
  date DATE DEFAULT CURRENT_DATE,

  -- Activity completions
  read_affirmation_completed BOOLEAN DEFAULT FALSE,
  speak_affirmation_completed BOOLEAN DEFAULT FALSE,
  visualization_completed BOOLEAN DEFAULT FALSE,
  journaling_completed BOOLEAN DEFAULT FALSE,

  -- Activity data
  affirmations_read JSONB DEFAULT '[]', -- Which affirmations were read
  spoken_affirmation_count INTEGER DEFAULT 0,
  visualization_duration_minutes INTEGER,
  visualization_notes TEXT,
  journal_entry TEXT,
  journal_insights TEXT,

  -- Daily reflection
  belief_strength_rating INTEGER CHECK (belief_strength_rating >= 1 AND belief_strength_rating <= 10),
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  confidence_rating INTEGER CHECK (confidence_rating >= 1 AND confidence_rating <= 10),
  resistance_level INTEGER CHECK (resistance_level >= 1 AND resistance_level <= 10), -- How much resistance felt

  -- Daily notes
  daily_notes TEXT,
  challenges_faced TEXT,
  breakthroughs TEXT,
  gratitude_items JSONB DEFAULT '[]',

  -- Completion tracking
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create belief_milestones table for tracking key moments in the cycle
CREATE TABLE IF NOT EXISTS belief_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES user_belief_cycles(id) ON DELETE CASCADE,

  -- Milestone details
  day_number INTEGER NOT NULL,
  milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN ('weekly_check', 'breakthrough', 'resistance_overcome', 'completion', 'custom')),
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Measurements
  belief_strength_before INTEGER CHECK (belief_strength_before >= 1 AND belief_strength_before <= 10),
  belief_strength_after INTEGER CHECK (belief_strength_after >= 1 AND belief_strength_after <= 10),
  confidence_change INTEGER, -- Can be negative for setbacks

  -- Notes and insights
  insights TEXT,
  evidence_observed TEXT, -- Real-world evidence of belief taking hold
  behavior_changes TEXT, -- Changes in behavior/actions

  -- Metadata
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create belief_affirmations table for reusable affirmation library
CREATE TABLE IF NOT EXISTS belief_affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,

  -- Affirmation content
  affirmation_text TEXT NOT NULL,
  variation_texts JSONB DEFAULT '[]', -- Alternative phrasings

  -- Usage context
  best_for_times_of_day JSONB DEFAULT '[]', -- morning, evening, etc.
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),

  -- Effectiveness
  usage_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,

  -- Metadata
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create belief_visualization_scripts table for guided visualizations
CREATE TABLE IF NOT EXISTS belief_visualization_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,

  -- Script content
  title VARCHAR(255) NOT NULL,
  script_text TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 10,

  -- Audio/media
  audio_url TEXT,
  background_music_url TEXT,
  image_url TEXT,

  -- Usage
  usage_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  difficulty_level INTEGER DEFAULT 2 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),

  -- Metadata
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_belief_systems_user_id ON belief_systems(user_id);
CREATE INDEX IF NOT EXISTS idx_belief_systems_category ON belief_systems(category);
CREATE INDEX IF NOT EXISTS idx_belief_systems_is_public ON belief_systems(is_public);
CREATE INDEX IF NOT EXISTS idx_belief_systems_is_featured ON belief_systems(is_featured);

CREATE INDEX IF NOT EXISTS idx_user_belief_cycles_user_id ON user_belief_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_belief_cycles_belief_system_id ON user_belief_cycles(belief_system_id);
CREATE INDEX IF NOT EXISTS idx_user_belief_cycles_status ON user_belief_cycles(status);
CREATE INDEX IF NOT EXISTS idx_user_belief_cycles_start_date ON user_belief_cycles(start_date);

CREATE INDEX IF NOT EXISTS idx_daily_belief_activities_user_id ON daily_belief_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_belief_activities_cycle_id ON daily_belief_activities(cycle_id);
CREATE INDEX IF NOT EXISTS idx_daily_belief_activities_date ON daily_belief_activities(date);
CREATE INDEX IF NOT EXISTS idx_daily_belief_activities_day_number ON daily_belief_activities(day_number);

CREATE INDEX IF NOT EXISTS idx_belief_milestones_user_id ON belief_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_belief_milestones_cycle_id ON belief_milestones(cycle_id);
CREATE INDEX IF NOT EXISTS idx_belief_milestones_milestone_type ON belief_milestones(milestone_type);

CREATE INDEX IF NOT EXISTS idx_belief_affirmations_category ON belief_affirmations(category);
CREATE INDEX IF NOT EXISTS idx_belief_visualization_scripts_category ON belief_visualization_scripts(category);

-- Enable Row Level Security
ALTER TABLE belief_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_belief_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_belief_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE belief_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE belief_affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE belief_visualization_scripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access their own belief systems and public ones" ON belief_systems
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own belief systems" ON belief_systems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own belief systems" ON belief_systems
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own belief systems" ON belief_systems
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own belief cycles" ON user_belief_cycles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own daily activities" ON daily_belief_activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own belief milestones" ON belief_milestones
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access public affirmations and their own" ON belief_affirmations
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create affirmations" ON belief_affirmations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can access public visualization scripts and their own" ON belief_visualization_scripts
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create visualization scripts" ON belief_visualization_scripts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create updated_at triggers
CREATE TRIGGER update_belief_systems_updated_at BEFORE UPDATE ON belief_systems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_belief_cycles_updated_at BEFORE UPDATE ON user_belief_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_belief_activities_updated_at BEFORE UPDATE ON daily_belief_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default belief systems
INSERT INTO belief_systems (title, description, category, belief_statement, affirmations, visualization_script, journaling_prompts, daily_activities, is_public, is_featured) VALUES
  (
    'Self-Worth & Confidence Builder',
    'A 21-day program to build unshakeable self-worth and confidence',
    'Self-Worth',
    'I am worthy of love, success, and happiness exactly as I am',
    '[
      "I am inherently valuable and worthy of respect",
      "I trust my abilities and make decisions with confidence",
      "I deserve all the good things that come into my life",
      "My self-worth is not dependent on others approval",
      "I am enough, exactly as I am right now"
    ]',
    'Close your eyes and imagine yourself standing in front of a mirror. Look into your own eyes with love and acceptance. See yourself as the capable, worthy person you truly are. Notice your strengths, your kindness, your unique gifts. Feel the warmth of self-love filling your heart. Speak to yourself with the same compassion you would show a dear friend. You are worthy. You are enough. You are loved.',
    '[
      "What are three things I appreciate about myself today?",
      "When did I feel most confident this week? What contributed to that feeling?",
      "What would I do if I truly believed I was worthy of success?",
      "How can I show myself more compassion today?",
      "What evidence do I have that contradicts negative self-talk?"
    ]',
    '[
      {"name": "Morning Affirmation", "description": "Read and speak your affirmation", "duration": 5},
      {"name": "Mirror Work", "description": "Look in mirror and affirm your worth", "duration": 3},
      {"name": "Visualization", "description": "Guided self-worth visualization", "duration": 10},
      {"name": "Journaling", "description": "Write about self-appreciation", "duration": 10}
    ]',
    true,
    true
  ),
  (
    'Abundance & Success Mindset',
    'Transform scarcity thinking into abundance consciousness over 21 days',
    'Success',
    'I live in an abundant universe and attract success naturally',
    '[
      "Opportunities flow to me easily and effortlessly",
      "I am a magnet for prosperity and success",
      "There is more than enough for everyone, including me",
      "I create value and receive abundance in return",
      "Success comes naturally when I align with my purpose"
    ]',
    'Imagine yourself surrounded by golden light representing infinite abundance. Feel this energy of prosperity flowing through you. See opportunities appearing in your life like flowers blooming in a garden. Notice how natural and effortless success feels when you align with abundance. You are part of an infinitely abundant universe that wants to support your highest good.',
    '[
      "What abundance do I already have in my life that I can appreciate?",
      "What opportunities am I noticing that I might have missed before?",
      "How can I add more value to others lives today?",
      "What would I create if I knew success was guaranteed?",
      "What limiting beliefs about money or success am I ready to release?"
    ]',
    '[
      {"name": "Abundance Affirmation", "description": "Speak abundance statements", "duration": 5},
      {"name": "Gratitude Practice", "description": "List 5 things you are grateful for", "duration": 5},
      {"name": "Success Visualization", "description": "Visualize achieving your goals", "duration": 12},
      {"name": "Opportunity Journaling", "description": "Write about opportunities you notice", "duration": 8}
    ]',
    true,
    true
  ),
  (
    'Health & Vitality Beliefs',
    'Cultivate beliefs that support optimal health and energy',
    'Health',
    'My body is strong, healthy, and naturally heals itself',
    '[
      "Every cell in my body vibrates with health and vitality",
      "I make choices that nourish and strengthen my body",
      "My body knows how to heal and I trust its wisdom",
      "I have abundant energy to do what I love",
      "I am grateful for my bodys incredible capabilities"
    ]',
    'Visualize healing light flowing through every cell of your body. See your body as the amazing, self-healing organism it is. Feel gratitude for all the ways your body serves you every day. Imagine yourself feeling vibrant, energetic, and healthy. Your body is your ally in creating the life you desire.',
    '[
      "What is my body telling me it needs today?",
      "How can I show appreciation for my body today?",
      "What healthy choice can I make that will energize me?",
      "What does optimal health look and feel like for me?",
      "How has my body shown its strength and resilience?"
    ]',
    '[
      {"name": "Body Appreciation", "description": "Thank your body for serving you", "duration": 3},
      {"name": "Health Affirmations", "description": "Speak statements of health", "duration": 5},
      {"name": "Healing Visualization", "description": "Visualize your body healing and thriving", "duration": 10},
      {"name": "Wellness Journaling", "description": "Write about your relationship with health", "duration": 12}
    ]',
    true,
    true
  );

-- Insert default affirmations
INSERT INTO belief_affirmations (category, affirmation_text, variation_texts, best_for_times_of_day, difficulty_level) VALUES
  ('Self-Worth', 'I am worthy of love and respect', '["I deserve to be treated with kindness", "I am valuable exactly as I am", "My worth is inherent and unchanging"]', '["morning", "evening"]', 1),
  ('Confidence', 'I trust my abilities and make good decisions', '["I have everything I need within me", "I am capable and resourceful", "I trust my inner wisdom"]', '["morning", "before challenges"]', 2),
  ('Success', 'Success flows to me naturally and easily', '["I am aligned with prosperity", "Opportunities come to me effortlessly", "I attract what I need for success"]', '["morning", "before work"]', 2),
  ('Health', 'My body is strong, healthy, and vibrant', '["Every cell in my body radiates health", "I am grateful for my healthy body", "My body knows how to heal itself"]', '["morning", "during exercise"]', 1),
  ('Abundance', 'I live in an abundant universe full of possibilities', '["There is more than enough for everyone", "Abundance is my natural state", "I attract prosperity in all forms"]', '["morning", "evening"]', 3),
  ('Peace', 'I am calm, centered, and at peace', '["Peace flows through me naturally", "I choose peace in every moment", "I am a source of calm energy"]', '["evening", "during stress"]', 1),
  ('Love', 'I give and receive love freely and openly', '["Love surrounds me always", "I am loveable and loving", "My heart is open to love"]', '["morning", "evening"]', 2);

-- Insert default visualization scripts
INSERT INTO belief_visualization_scripts (category, title, script_text, duration_minutes, difficulty_level) VALUES
  (
    'Self-Worth',
    'Inner Light Meditation',
    'Sit comfortably and close your eyes. Take three deep breaths. Imagine a warm, golden light in your heart center. This light represents your inherent worth and value. With each breath, feel this light growing brighter and stronger. Let it fill your entire being with warmth and love. This light has always been within you - it is your true essence. No external circumstances can dim this light. You are worthy. You are valuable. You are enough. Feel this truth in every cell of your body. When you are ready, open your eyes and carry this light with you throughout your day.',
    8,
    1
  ),
  (
    'Success',
    'Future Self Visualization',
    'Close your eyes and take several deep breaths. Imagine yourself one year from now, having achieved the success you desire. See yourself clearly - how do you look? How do you feel? What are you wearing? Where are you? Notice the confidence in your posture, the joy in your smile. Feel the satisfaction of having reached your goals. What steps did this successful version of you take? What beliefs did they hold? Feel yourself merging with this future self, bringing their confidence and success energy into your present moment. You have everything within you to create this reality.',
    12,
    3
  ),
  (
    'Health',
    'Healing Light Body Scan',
    'Lie down comfortably and close your eyes. Take deep, healing breaths. Imagine a brilliant white healing light above your head. As you breathe in, draw this light down through the top of your head. Feel it flowing through your brain, healing and energizing every cell. Continue to breathe the light down through your neck, shoulders, arms, and chest. Feel it healing your heart and lungs. Breathe the light into your abdomen, healing your digestive system. Let it flow down through your hips, legs, and feet. Your entire body is now filled with healing light. Feel gratitude for your bodys amazing ability to heal and regenerate. You are healthy, whole, and vibrant.',
    15,
    2
  );