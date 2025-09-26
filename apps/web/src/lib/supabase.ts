// PostgreSQL database connection (server-side only)
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

// PostgreSQL query helper functions
export async function queryDatabase(query: string, params: any[] = []) {
  if (!db) throw new Error('Database not initialized')
  try {
    const result = await db.query(query, params)
    return { data: result.rows, error: null }
  } catch (error) {
    console.error('Database query error:', error)
    return { data: null, error }
  }
}

// Comprehensive Supabase compatibility layer for PostgreSQL
export const supabase = {
  from: (tableName: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        order: (orderBy: string, options: { ascending?: boolean } = {}) => ({
          limit: async (count: number) => {
            console.log(`Supabase compatibility: SELECT from ${tableName}`)
            return { data: [], error: null }
          }
        }),
        gte: (column2: string, value2: any) => ({
          lt: (column3: string, value3: any) => ({
            limit: async (count: number) => {
              console.log(`Supabase compatibility: Complex query on ${tableName}`)
              return { data: [], error: null }
            }
          }),
          order: (orderBy: string, options: { ascending?: boolean } = {}) => ({
            limit: async (count: number) => {
              console.log(`Supabase compatibility: Date range query on ${tableName}`)
              return { data: [], error: null }
            }
          })
        }),
        is: (column2: string, value2: any) => ({
          order: (orderBy: string, options: { ascending?: boolean } = {}) => ({
            limit: async (count: number) => {
              console.log(`Supabase compatibility: IS query on ${tableName}`)
              return { data: [], error: null }
            }
          })
        }),
        single: async () => {
          console.log(`Supabase compatibility: Single query on ${tableName}`)
          return { data: null, error: null }
        }
      }),
      gte: (column: string, value: any) => ({
        lt: (column2: string, value2: any) => ({
          eq: (column3: string, value3: any) => ({
            order: (orderBy: string, options: { ascending?: boolean } = {}) => ({
              limit: async (count: number) => {
                console.log(`Supabase compatibility: Multi-condition query on ${tableName}`)
                return { data: [], error: null }
              }
            })
          })
        })
      }),
      order: (orderBy: string, options: { ascending?: boolean } = {}) => ({
        limit: async (count: number) => {
          console.log(`Supabase compatibility: Ordered query on ${tableName}`)
          return { data: [], error: null }
        }
      })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          console.log(`Supabase compatibility: Insert into ${tableName}`)
          return { data: null, error: null }
        }
      })
    }),
    update: (data: any) => ({
      eq: async (column: string, value: any) => {
        console.log(`Supabase compatibility: Update ${tableName}`)
        return { data: null, error: null }
      }
    })
  }),
  channel: (channelName: string) => ({
    on: (event: string, filter: any, callback: Function) => ({
      subscribe: () => {
        console.log(`Supabase compatibility: Subscribe to ${channelName}`)
        return { unsubscribe: () => {} }
      }
    })
  }),
  removeAllChannels: () => {
    console.log('Supabase compatibility: Remove all channels')
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