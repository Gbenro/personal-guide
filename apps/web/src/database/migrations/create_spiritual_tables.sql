-- Spiritual Modules Migration for Personal Guide
-- Creates tables for synchronicity tracking, angel numbers, and astrological insights

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Spiritual Modules Configuration Table
CREATE TABLE IF NOT EXISTS spiritual_modules (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, id)
);

-- Synchronicity Entries Table
CREATE TABLE IF NOT EXISTS synchronicity_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    significance INTEGER NOT NULL CHECK (significance >= 1 AND significance <= 10),
    context TEXT NOT NULL,
    emotions TEXT[] DEFAULT '{}',
    patterns TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Synchronicity Patterns Table
CREATE TABLE IF NOT EXISTS synchronicity_patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    entry_ids UUID[] DEFAULT '{}', -- Array of synchronicity_entries.id
    frequency INTEGER DEFAULT 1,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    significance INTEGER NOT NULL CHECK (significance >= 1 AND significance <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Angel Number Entries Table
CREATE TABLE IF NOT EXISTS angel_number_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME,
    location TEXT,
    context TEXT NOT NULL,
    personal_significance INTEGER NOT NULL CHECK (personal_significance >= 1 AND personal_significance <= 10),
    emotions TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Angel Number Meanings Table (system-wide reference data)
CREATE TABLE IF NOT EXISTS angel_number_meanings (
    number TEXT PRIMARY KEY,
    general_meaning TEXT NOT NULL,
    spiritual_meaning TEXT NOT NULL,
    numerology_meaning TEXT NOT NULL,
    action_guidance TEXT NOT NULL,
    affirmations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Personal Astrological Charts Table
CREATE TABLE IF NOT EXISTS personal_charts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sun_sign TEXT NOT NULL,
    moon_sign TEXT,
    rising_sign TEXT,
    birth_date DATE NOT NULL,
    birth_time TIME,
    birth_location TEXT NOT NULL,
    houses JSONB DEFAULT '{}', -- Store house positions as JSON
    planets JSONB DEFAULT '{}', -- Store planet positions as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id) -- One chart per user
);

-- Astrological Transits Table
CREATE TABLE IF NOT EXISTS astro_transits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    planet TEXT NOT NULL,
    aspect TEXT NOT NULL,
    target_planet TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    intensity TEXT NOT NULL CHECK (intensity IN ('low', 'medium', 'high')),
    theme TEXT NOT NULL,
    description TEXT NOT NULL,
    guidance TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Daily Astrological Insights Table
CREATE TABLE IF NOT EXISTS daily_astro_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    overview TEXT NOT NULL,
    main_theme TEXT NOT NULL,
    opportunities TEXT[] DEFAULT '{}',
    challenges TEXT[] DEFAULT '{}',
    luck_element TEXT,
    color_of_day TEXT,
    crystal_recommendation TEXT,
    mantra TEXT,
    lunar_phase JSONB NOT NULL, -- Store lunar phase data as JSON
    active_transit_ids UUID[] DEFAULT '{}', -- References to astro_transits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date)
);

-- Spiritual Insights Table (AI-generated insights combining all modules)
CREATE TABLE IF NOT EXISTS spiritual_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('synchronicity', 'angel-number', 'astro')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    guidance TEXT NOT NULL,
    relevance INTEGER NOT NULL CHECK (relevance >= 1 AND relevance <= 10),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    related_entry_ids TEXT[] DEFAULT '{}', -- References to entries from various tables
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for time-sensitive insights
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Spiritual Dashboard Settings Table
CREATE TABLE IF NOT EXISTS spiritual_dashboard_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    todays_guidance TEXT,
    active_modules TEXT[] DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spiritual_modules_user_id ON spiritual_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_synchronicity_entries_user_id ON synchronicity_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_synchronicity_entries_date ON synchronicity_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_synchronicity_entries_significance ON synchronicity_entries(significance DESC);
CREATE INDEX IF NOT EXISTS idx_synchronicity_patterns_user_id ON synchronicity_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_angel_number_entries_user_id ON angel_number_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_angel_number_entries_date ON angel_number_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_angel_number_entries_number ON angel_number_entries(number);
CREATE INDEX IF NOT EXISTS idx_personal_charts_user_id ON personal_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_astro_transits_date_range ON astro_transits(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_daily_astro_insights_date ON daily_astro_insights(date DESC);
CREATE INDEX IF NOT EXISTS idx_spiritual_insights_user_id ON spiritual_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_insights_type ON spiritual_insights(type);
CREATE INDEX IF NOT EXISTS idx_spiritual_insights_relevance ON spiritual_insights(relevance DESC);
CREATE INDEX IF NOT EXISTS idx_spiritual_insights_generated_at ON spiritual_insights(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_spiritual_dashboard_settings_user_id ON spiritual_dashboard_settings(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE spiritual_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchronicity_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE synchronicity_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE angel_number_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Angel number meanings and daily astro insights are public/system data (no RLS)

-- Spiritual Modules Policies
CREATE POLICY IF NOT EXISTS "Users can view their own spiritual modules" ON spiritual_modules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own spiritual modules" ON spiritual_modules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own spiritual modules" ON spiritual_modules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own spiritual modules" ON spiritual_modules
    FOR DELETE USING (auth.uid() = user_id);

-- Synchronicity Entries Policies
CREATE POLICY IF NOT EXISTS "Users can view their own synchronicity entries" ON synchronicity_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own synchronicity entries" ON synchronicity_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own synchronicity entries" ON synchronicity_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own synchronicity entries" ON synchronicity_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Synchronicity Patterns Policies
CREATE POLICY IF NOT EXISTS "Users can view their own synchronicity patterns" ON synchronicity_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own synchronicity patterns" ON synchronicity_patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own synchronicity patterns" ON synchronicity_patterns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own synchronicity patterns" ON synchronicity_patterns
    FOR DELETE USING (auth.uid() = user_id);

-- Angel Number Entries Policies
CREATE POLICY IF NOT EXISTS "Users can view their own angel number entries" ON angel_number_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own angel number entries" ON angel_number_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own angel number entries" ON angel_number_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own angel number entries" ON angel_number_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Personal Charts Policies
CREATE POLICY IF NOT EXISTS "Users can view their own personal chart" ON personal_charts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own personal chart" ON personal_charts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own personal chart" ON personal_charts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own personal chart" ON personal_charts
    FOR DELETE USING (auth.uid() = user_id);

-- Spiritual Insights Policies
CREATE POLICY IF NOT EXISTS "Users can view their own spiritual insights" ON spiritual_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own spiritual insights" ON spiritual_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own spiritual insights" ON spiritual_insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own spiritual insights" ON spiritual_insights
    FOR DELETE USING (auth.uid() = user_id);

-- Spiritual Dashboard Settings Policies
CREATE POLICY IF NOT EXISTS "Users can view their own dashboard settings" ON spiritual_dashboard_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own dashboard settings" ON spiritual_dashboard_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own dashboard settings" ON spiritual_dashboard_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own dashboard settings" ON spiritual_dashboard_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Public policies for system-wide data
CREATE POLICY IF NOT EXISTS "Angel number meanings are publicly readable" ON angel_number_meanings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Daily astro insights are publicly readable" ON daily_astro_insights
    FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Astro transits are publicly readable" ON astro_transits
    FOR SELECT TO authenticated USING (true);

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_spiritual_modules_updated_at
    BEFORE UPDATE ON spiritual_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_synchronicity_entries_updated_at
    BEFORE UPDATE ON synchronicity_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_synchronicity_patterns_updated_at
    BEFORE UPDATE ON synchronicity_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_angel_number_meanings_updated_at
    BEFORE UPDATE ON angel_number_meanings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_personal_charts_updated_at
    BEFORE UPDATE ON personal_charts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_spiritual_dashboard_settings_updated_at
    BEFORE UPDATE ON spiritual_dashboard_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON spiritual_modules TO authenticated;
GRANT ALL ON synchronicity_entries TO authenticated;
GRANT ALL ON synchronicity_patterns TO authenticated;
GRANT ALL ON angel_number_entries TO authenticated;
GRANT SELECT ON angel_number_meanings TO authenticated;
GRANT ALL ON personal_charts TO authenticated;
GRANT SELECT ON astro_transits TO authenticated;
GRANT SELECT ON daily_astro_insights TO authenticated;
GRANT ALL ON spiritual_insights TO authenticated;
GRANT ALL ON spiritual_dashboard_settings TO authenticated;

-- Insert default angel number meanings
INSERT INTO angel_number_meanings (number, general_meaning, spiritual_meaning, numerology_meaning, action_guidance, affirmations) VALUES
('111', 'New beginnings and manifestation', 'Gateway to higher consciousness', 'Leadership and independence', 'Focus on positive thoughts as they manifest quickly', ARRAY['I am manifesting my highest good', 'My thoughts create my reality']),
('222', 'Balance and cooperation', 'Trust in divine timing', 'Partnership and diplomacy', 'Have patience and trust the process', ARRAY['Everything is working out for my highest good', 'I trust in divine timing']),
('333', 'Spiritual growth and creativity', 'Ascended masters are near', 'Creative expression and communication', 'Express your authentic self', ARRAY['I am supported by divine beings', 'My creativity flows freely']),
('444', 'Foundation and stability', 'Angels surround you with love', 'Hard work and determination', 'Build solid foundations for your dreams', ARRAY['I am protected and guided', 'I create lasting stability']),
('555', 'Change and transformation', 'Major life shifts approaching', 'Freedom and adventure', 'Embrace positive changes coming your way', ARRAY['I welcome positive change', 'I trust my journey of transformation']),
('666', 'Balance material and spiritual', 'Refocus on spiritual matters', 'Nurturing and responsibility', 'Find harmony between earthly and spiritual pursuits', ARRAY['I balance my material and spiritual life', 'I choose love over fear']),
('777', 'Spiritual awakening', 'You are on the right path', 'Mysticism and inner wisdom', 'Continue your spiritual journey with confidence', ARRAY['I am spiritually awakening', 'I trust my inner wisdom']),
('888', 'Abundance and success', 'Infinite possibilities', 'Material mastery and achievement', 'Financial and material abundance is flowing to you', ARRAY['Abundance flows to me easily', 'I am worthy of success']),
('999', 'Completion and service', 'End of a major life phase', 'Universal love and completion', 'Prepare for new beginnings by completing current cycles', ARRAY['I release what no longer serves me', 'I embrace new chapters with love']),
('000', 'Infinite potential', 'Connection to source energy', 'The void and pure potential', 'You are one with the universe', ARRAY['I am connected to infinite potential', 'I am one with the universe']),
('1010', 'Spiritual awakening and enlightenment', 'Twin flame or soulmate connection', 'Leadership in spiritual matters', 'Trust your intuition and spiritual insights', ARRAY['I trust my spiritual awakening', 'I am open to divine guidance']),
('1111', 'Manifestation portal', 'Make a wish - manifestation is amplified', 'Master number of intuition', 'Your thoughts are manifesting rapidly', ARRAY['I manifest my desires with ease', 'I am aligned with my highest purpose']),
('1212', 'Spiritual growth and positive energy', 'Angels are helping manifest your dreams', 'Balance between giving and receiving', 'Stay positive and focused on your goals', ARRAY['I maintain positive thoughts and actions', 'I am supported in my dreams']),
('1313', 'Spiritual evolution and growth', 'Ascended masters guide your transformation', 'Creative manifestation power', 'Express your truth with love and compassion', ARRAY['I express my truth with love', 'I trust my spiritual evolution'])
ON CONFLICT (number) DO NOTHING;

-- Insert sample daily astrological insight (can be updated by admin)
INSERT INTO daily_astro_insights (
    date,
    overview,
    main_theme,
    opportunities,
    challenges,
    luck_element,
    color_of_day,
    crystal_recommendation,
    mantra,
    lunar_phase
) VALUES (
    CURRENT_DATE,
    'A day of spiritual awakening and manifestation energy',
    'Spiritual Growth',
    ARRAY['Meditation practice', 'Creative expression', 'Intuitive insights'],
    ARRAY['Mental overwhelm', 'Scattered energy'],
    'Water',
    'Deep Blue',
    'Amethyst',
    'I trust my intuition and embrace my spiritual path',
    '{"phase": "waxing-crescent", "name": "Crescent Moon", "significance": "A time for setting intentions and new beginnings"}'::jsonb
) ON CONFLICT (date) DO NOTHING;

-- Comments on tables
COMMENT ON TABLE spiritual_modules IS 'Configuration for user spiritual tracking modules';
COMMENT ON TABLE synchronicity_entries IS 'User entries for meaningful coincidences and synchronicities';
COMMENT ON TABLE synchronicity_patterns IS 'Discovered patterns in synchronicity entries';
COMMENT ON TABLE angel_number_entries IS 'User sightings of angel numbers';
COMMENT ON TABLE angel_number_meanings IS 'System-wide reference for angel number interpretations';
COMMENT ON TABLE personal_charts IS 'User astrological birth charts';
COMMENT ON TABLE astro_transits IS 'Current astrological transits affecting everyone';
COMMENT ON TABLE daily_astro_insights IS 'Daily astrological guidance and insights';
COMMENT ON TABLE spiritual_insights IS 'AI-generated spiritual insights for users';
COMMENT ON TABLE spiritual_dashboard_settings IS 'User preferences for spiritual dashboard';