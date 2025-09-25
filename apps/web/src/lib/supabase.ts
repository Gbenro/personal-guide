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

// Migration helper - converts Supabase-style queries to PostgreSQL
export function createPostgreSQLService(tableName: string) {
  return {
    from: () => ({
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          order: (orderBy: string, options: { ascending?: boolean } = {}) => ({
            limit: async (count: number) => {
              const order = options.ascending ? 'ASC' : 'DESC'
              const query = `SELECT ${columns} FROM ${tableName} WHERE ${column} = $1 ORDER BY ${orderBy} ${order} LIMIT $2`
              return await queryDatabase(query, [value, count])
            }
          }),
          single: async () => {
            const query = `SELECT ${columns} FROM ${tableName} WHERE ${column} = $1 LIMIT 1`
            const result = await queryDatabase(query, [value])
            return { data: result.data?.[0] || null, error: result.error }
          }
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const keys = Object.keys(data)
            const values = Object.values(data)
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
            const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`
            const result = await queryDatabase(query, values)
            return { data: result.data?.[0] || null, error: result.error }
          }
        })
      }),
      update: (data: any) => ({
        eq: async (column: string, value: any) => {
          const keys = Object.keys(data)
          const values = Object.values(data)
          const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')
          const query = `UPDATE ${tableName} SET ${setClause} WHERE ${column} = $${keys.length + 1} RETURNING *`
          return await queryDatabase(query, [...values, value])
        }
      })
    })
  }
}

// Legacy compatibility - will be removed after migration
export const supabase = createPostgreSQLService('temp')

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