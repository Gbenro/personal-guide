import { createClient } from '@supabase/supabase-js'

// Force environment variable loading - updated for Railway deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    // Enable real-time for better performance
    params: {
      eventsPerSecond: 10,
    },
    // Set heartbeat interval for connection health
    heartbeatIntervalMs: 30000,
    // Reconnect automatically
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
  },
  auth: {
    // Persist auth state for better real-time experience
    persistSession: true,
    // Auto refresh tokens for long-running connections
    autoRefreshToken: true,
    // Detect session in URL for OAuth flows
    detectSessionInUrl: true,
  },
})

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://placeholder.supabase.co' &&
         supabaseAnonKey !== 'placeholder_key'
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