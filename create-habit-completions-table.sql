-- SQL to run in Supabase SQL Editor to create the missing habit_completions table

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own habit completions" 
ON public.habit_completions FOR ALL 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS habit_completions_habit_id_idx ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS habit_completions_user_id_idx ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS habit_completions_completed_at_idx ON public.habit_completions(completed_at);

-- Test the table
SELECT 'habit_completions table created successfully' as status;