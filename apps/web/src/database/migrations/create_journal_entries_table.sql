-- Create journal_entries table for Personal Guide app
-- This table stores user journal entries with mood tracking and tagging capabilities

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 10),
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_favorite boolean DEFAULT false,
  word_count integer,

  -- Add foreign key constraint if users table exists
  CONSTRAINT fk_journal_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood_rating ON journal_entries(mood_rating);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_journal_entries_is_favorite ON journal_entries(is_favorite) WHERE is_favorite = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_entries_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for journal entries
-- Users can only access their own journal entries
CREATE POLICY "Users can view own journal entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON journal_entries TO authenticated;
GRANT ALL ON journal_entries TO service_role;

-- Add comments for documentation
COMMENT ON TABLE journal_entries IS 'Stores user journal entries with mood tracking and tagging';
COMMENT ON COLUMN journal_entries.mood_rating IS 'User mood rating on a scale of 1-10';
COMMENT ON COLUMN journal_entries.tags IS 'Array of tags for categorizing journal entries';
COMMENT ON COLUMN journal_entries.word_count IS 'Cached word count for analytics and search';