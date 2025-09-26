// PostgreSQL Chat Service - replaces Supabase version
import type { User } from './simple-auth'

// Server-side only database connection
let db: any = null
if (typeof window === 'undefined') {
  try {
    // Dynamic import to avoid bundling server code on client
    const auth = require('./simple-auth')
    db = auth.db
  } catch (error) {
    console.warn('Database connection not available (client-side or missing):', error.message)
  }
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  content: string
  role: 'user' | 'assistant'
  mood?: string
  mood_confidence?: number
  emotional_keywords?: string[]
  personality_mode?: 'mentor' | 'coach' | 'friend'
  ai_provider?: string
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

// Get or create current chat session for user
export async function getCurrentChatSession(user: User): Promise<ChatSession | null> {
  if (!db) {
    console.error('Database not available')
    return null
  }

  try {
    console.log('Getting chat session for user:', user.id)

    // First, try to get the most recent session
    const result = await db.query(
      'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY last_message_at DESC LIMIT 1',
      [user.id]
    )

    const existingSessions = result.rows

    // If we have a recent session (within last 24 hours), use it
    if (existingSessions && existingSessions.length > 0) {
      const session = existingSessions[0]
      const lastMessageTime = new Date(session.last_message_at)
      const now = new Date()
      const hoursSinceLastMessage = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60)

      if (hoursSinceLastMessage < 24) {
        return session as ChatSession
      }
    }

    // Create a new session
    const newSessionResult = await db.query(
      `INSERT INTO chat_sessions (user_id, title, last_message_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user.id, `Chat ${new Date().toLocaleDateString()}`, new Date().toISOString()]
    )

    return newSessionResult.rows[0] as ChatSession
  } catch (error) {
    console.error('Error in getCurrentChatSession:', error)
    return null
  }
}

// Save a message to the database
export async function saveMessage(
  sessionId: string,
  userId: string,
  content: string,
  role: 'user' | 'assistant',
  metadata?: {
    mood?: string
    mood_confidence?: number
    emotional_keywords?: string[]
    personality_mode?: 'mentor' | 'coach' | 'friend'
    ai_provider?: string
  }
): Promise<ChatMessage | null> {
  if (!db) {
    console.error('Database not available')
    return null
  }

  try {
    const result = await db.query(
      `INSERT INTO messages (session_id, user_id, content, role, mood, mood_confidence, emotional_keywords, personality_mode, ai_provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        sessionId,
        userId,
        content,
        role,
        metadata?.mood,
        metadata?.mood_confidence,
        metadata?.emotional_keywords,
        metadata?.personality_mode,
        metadata?.ai_provider
      ]
    )

    // Update session's last_message_at
    await db.query(
      'UPDATE chat_sessions SET last_message_at = $1 WHERE id = $2',
      [new Date().toISOString(), sessionId]
    )

    return result.rows[0] as ChatMessage
  } catch (error) {
    console.error('Error in saveMessage:', error)
    return null
  }
}

// Load chat history for a session
export async function loadChatHistory(sessionId: string): Promise<ChatMessage[]> {
  if (!db) {
    console.error('Database not available')
    return []
  }

  try {
    const result = await db.query(
      'SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    )

    return result.rows as ChatMessage[]
  } catch (error) {
    console.error('Error in loadChatHistory:', error)
    return []
  }
}

// Get recent chat sessions for user
export async function getRecentChatSessions(userId: string, limit = 10): Promise<ChatSession[]> {
  if (!db) {
    console.error('Database not available')
    return []
  }

  try {
    const result = await db.query(
      'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY last_message_at DESC LIMIT $2',
      [userId, limit]
    )

    return result.rows as ChatSession[]
  } catch (error) {
    console.error('Error in getRecentChatSessions:', error)
    return []
  }
}

// Convert database message to UI message format
export function convertDbMessageToUI(dbMessage: ChatMessage) {
  return {
    id: dbMessage.id,
    content: dbMessage.content,
    role: dbMessage.role as 'user' | 'assistant',
    timestamp: new Date(dbMessage.created_at),
    mood: dbMessage.mood,
    moodConfidence: dbMessage.mood_confidence,
    emotionalKeywords: dbMessage.emotional_keywords,
    personalityMode: dbMessage.personality_mode
  }
}