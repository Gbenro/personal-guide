// Database setup script to create missing tables
import { supabase } from './supabase'

async function setupDatabase() {
  console.log('🔧 Setting up database tables...')
  
  try {
    // Check if habit_completions table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'habit_completions')

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      return
    }

    if (!tables || tables.length === 0) {
      console.log('❌ habit_completions table not found, creating it...')
      
      // Create the habit_completions table
      const { error: createError } = await supabase.rpc('create_habit_completions_table')
      
      if (createError) {
        console.error('Error creating table:', createError)
        
        // Try manual table creation
        console.log('Trying manual table creation...')
        const createSQL = `
          CREATE TABLE IF NOT EXISTS public.habit_completions (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY IF NOT EXISTS "Users can manage own habit completions" 
          ON public.habit_completions FOR ALL USING (auth.uid() = user_id);
        `
        
        console.log('SQL to run in Supabase:', createSQL)
      } else {
        console.log('✅ habit_completions table created successfully')
      }
    } else {
      console.log('✅ habit_completions table already exists')
    }

    // Test basic operations
    console.log('🧪 Testing database operations...')
    
    // Test fetching habits (this should work)
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .limit(1)

    if (habitsError) {
      console.error('❌ Error fetching habits:', habitsError)
    } else {
      console.log('✅ Habits table accessible:', habits?.length || 0, 'habits found')
    }

    // Test fetching completions
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .limit(1)

    if (completionsError) {
      console.error('❌ Error fetching completions:', completionsError)
    } else {
      console.log('✅ Completions table accessible:', completions?.length || 0, 'completions found')
    }

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run setup
setupDatabase()