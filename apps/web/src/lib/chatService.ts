import { db } from './supabase'
import type { User } from './auth'

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  content: string
  role: 'user' | 'assistant'
  mood?: 'positive' | 'negative' | 'neutral' | 'goal-focused' | 'reflective' | 'happy' | 'sad' | 'anxious' | 'energized'
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
  try {
    // First, try to get the most recent session
    const { data: existingSessions, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching chat sessions:', {
        error: fetchError,
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        userId: user.id
      })
      return null
    }

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
    const { data: newSession, error: createError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: `Chat ${new Date().toLocaleDateString()}`,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating chat session:', {
        error: createError,
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        userId: user.id
      })
      return null
    }

    return newSession as ChatSession
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
  try {
    const messageData = {
      session_id: sessionId,
      user_id: userId,
      content,
      role,
      mood: metadata?.mood,
      mood_confidence: metadata?.mood_confidence,
      emotional_keywords: metadata?.emotional_keywords,
      personality_mode: metadata?.personality_mode,
      ai_provider: metadata?.ai_provider
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Error saving message:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        sessionId,
        userId,
        content: content.substring(0, 50) + '...',
        role,
        metadata
      })
      return null
    }

    // Update session's last_message_at
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', sessionId)

    return data as ChatMessage
  } catch (error) {
    console.error('Error in saveMessage:', error)
    return null
  }
}

// Load chat history for a session
export async function loadChatHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading chat history:', error)
      return []
    }

    return (data as ChatMessage[]) || []
  } catch (error) {
    console.error('Error in loadChatHistory:', error)
    return []
  }
}

// Get recent chat sessions for user
export async function getRecentChatSessions(userId: string, limit = 10): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent sessions:', error)
      return []
    }

    return (data as ChatSession[]) || []
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

// Mood analytics functions
export async function getMoodAnalytics(userId: string, days: number = 30): Promise<{
  moodDistribution: { [mood: string]: number }
  averageConfidence: number
  topEmotionalKeywords: string[]
  moodTrends: { date: string; mood: string; confidence: number }[]
}> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('messages')
      .select('mood, mood_confidence, emotional_keywords, created_at')
      .eq('user_id', userId)
      .eq('role', 'assistant')
      .gte('created_at', startDate.toISOString())
      .not('mood', 'is', null)

    if (error) {
      console.error('Error fetching mood analytics:', error)
      return {
        moodDistribution: {},
        averageConfidence: 0,
        topEmotionalKeywords: [],
        moodTrends: []
      }
    }

    const messages = data as ChatMessage[]

    // Calculate mood distribution
    const moodDistribution: { [mood: string]: number } = {}
    let totalConfidence = 0
    let confidenceCount = 0
    const allKeywords: string[] = []
    const moodTrends: { date: string; mood: string; confidence: number }[] = []

    messages.forEach(message => {
      if (message.mood) {
        moodDistribution[message.mood] = (moodDistribution[message.mood] || 0) + 1

        if (message.mood_confidence) {
          totalConfidence += message.mood_confidence
          confidenceCount++
        }

        if (message.emotional_keywords) {
          allKeywords.push(...message.emotional_keywords)
        }

        moodTrends.push({
          date: message.created_at,
          mood: message.mood,
          confidence: message.mood_confidence || 0
        })
      }
    })

    // Calculate top emotional keywords
    const keywordCounts: { [keyword: string]: number } = {}
    allKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1
    })

    const topEmotionalKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword)

    return {
      moodDistribution,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      topEmotionalKeywords,
      moodTrends: moodTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
  } catch (error) {
    console.error('Error in getMoodAnalytics:', error)
    return {
      moodDistribution: {},
      averageConfidence: 0,
      topEmotionalKeywords: [],
      moodTrends: []
    }
  }
}