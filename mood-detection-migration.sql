-- Migration: Add enhanced mood detection fields to messages table
-- Date: 2025-01-15
-- Description: Adds mood_confidence, emotional_keywords, and ai_provider columns to support comprehensive mood analysis

-- Add mood_confidence column (0-1 scale)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS mood_confidence DECIMAL(3,2) CHECK (mood_confidence >= 0 AND mood_confidence <= 1);

-- Add emotional_keywords column (JSON array of detected keywords)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS emotional_keywords TEXT[];

-- Add ai_provider column to track which AI service was used
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS ai_provider TEXT;

-- Update mood column to support additional mood categories
ALTER TABLE public.messages
ALTER COLUMN mood TYPE TEXT;

-- Add comment to document the enhanced mood categories
COMMENT ON COLUMN public.messages.mood IS 'Detected mood: positive, negative, neutral, goal-focused, reflective, happy, sad, anxious, energized';
COMMENT ON COLUMN public.messages.mood_confidence IS 'Confidence score for mood detection (0-1 scale)';
COMMENT ON COLUMN public.messages.emotional_keywords IS 'Array of emotional keywords detected in the message';
COMMENT ON COLUMN public.messages.ai_provider IS 'AI provider used for generating the response (openai, anthropic, fallback)';

-- Create index for mood analytics queries
CREATE INDEX IF NOT EXISTS idx_messages_mood_analytics
ON public.messages (user_id, role, mood, created_at)
WHERE mood IS NOT NULL;

-- Create index for emotional keywords search (if using PostgreSQL with GIN support)
CREATE INDEX IF NOT EXISTS idx_messages_emotional_keywords
ON public.messages USING GIN (emotional_keywords)
WHERE emotional_keywords IS NOT NULL;

-- Add some sample mood data for testing (optional - remove in production)
-- UPDATE public.messages
-- SET mood_confidence = 0.8,
--     emotional_keywords = ARRAY['happy', 'excited'],
--     ai_provider = 'openai'
-- WHERE mood = 'positive' AND mood_confidence IS NULL;

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages'
    AND table_schema = 'public'
    AND column_name IN ('mood', 'mood_confidence', 'emotional_keywords', 'ai_provider')
ORDER BY column_name;