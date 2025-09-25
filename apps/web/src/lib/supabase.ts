// Database connection (server-side only)
let db: any = null

// Only initialize PostgreSQL on server-side
if (typeof window === 'undefined') {
  const { Pool } = require('pg')
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
}

export { db }

// TEMPORARY: Legacy supabase export for build compatibility
// TODO: Migrate all service files to use PostgreSQL directly
export const supabase = {
  from: () => ({
    select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ data: null, error: null }) })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
}

// Database Types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  full_name?: string
  preferred_personality?: 'mentor' | 'coach' | 'friend'
}

export interface Message {
  id: string
  user_id: string
  content: string
  role: 'user' | 'assistant'
  mood?: 'positive' | 'negative' | 'neutral'
  personality_mode?: 'mentor' | 'coach' | 'friend'
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  user_id: string
  title?: string
  created_at: string
  updated_at: string
  last_message_at: string
}