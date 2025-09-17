import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import {
  PersonalityMode,
  getPersonalityConfig,
  getPersonalitySystemPrompt,
  getPersonalityTemperature,
  getPersonalityFallbackResponse,
  formatPersonalityResponse,
  getPersonalitySwitchSuggestion
} from '@/lib/personalities'

// Import mood analysis types
import type { MoodCategory, MoodAnalysisResponse } from '../analyze-mood/route'

// Import types
interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  messages?: Message[]
  personalityMode?: PersonalityMode
  aiProvider?: 'openai' | 'anthropic' | 'auto'
}

interface ChatResponse {
  response: string
  provider: string
  personalityMode: PersonalityMode
  timestamp: string
  message: string
  mood?: string
  mood_confidence?: number
  emotional_keywords?: string[]
  suggestedPersonality?: PersonalityMode
}

// Provider configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
}) : null

// Enhanced mood detection using the new mood analysis service
async function detectMoodWithService(message: string): Promise<{
  mood: string
  confidence: number
  emotionalKeywords: string[]
  details?: any
}> {
  try {
    // Call our internal mood analysis service
    const moodResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/analyze-mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    })

    if (moodResponse.ok) {
      const moodData: MoodAnalysisResponse = await moodResponse.json()

      // Map our detailed mood categories to simpler chat categories for backward compatibility
      const simplifiedMood = mapDetailedMoodToSimple(moodData.mood)

      return {
        mood: simplifiedMood,
        confidence: moodData.mood_confidence,
        emotionalKeywords: moodData.emotional_keywords,
        details: {
          detailedMood: moodData.mood,
          sentimentDetails: moodData.sentiment_details
        }
      }
    }
  } catch (error) {
    console.error('Mood service error, falling back to simple detection:', error)
  }

  // Fallback to simple mood detection
  return {
    mood: detectMoodSimple(message),
    confidence: 0.6,
    emotionalKeywords: [],
    details: { fallback: true }
  }
}

// Map detailed mood categories to simple chat categories for backward compatibility
function mapDetailedMoodToSimple(detailedMood: MoodCategory): string {
  switch (detailedMood) {
    case 'happy':
      return 'positive'
    case 'sad':
      return 'negative'
    case 'anxious':
      return 'negative'
    case 'energized':
      return 'goal-focused'
    case 'neutral':
    default:
      return 'neutral'
  }
}

// Simple fallback mood detection (original implementation)
function detectMoodSimple(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Positive emotions
  if (lowerMessage.match(/\b(happy|excited|great|awesome|amazing|wonderful|fantastic|good|positive|joy|celebrate|proud|accomplished|success)\b/)) {
    return 'positive'
  }

  // Negative emotions
  if (lowerMessage.match(/\b(sad|depressed|down|upset|angry|frustrated|anxious|worried|stressed|difficult|hard|struggle|problem|bad|terrible|awful)\b/)) {
    return 'negative'
  }

  // Goal-oriented
  if (lowerMessage.match(/\b(goal|plan|achieve|accomplish|productive|focus|work|task|project|deadline|progress|improve)\b/)) {
    return 'goal-focused'
  }

  // Reflective
  if (lowerMessage.match(/\b(think|reflect|understand|meaning|purpose|why|learn|insight|wisdom|growth|change)\b/)) {
    return 'reflective'
  }

  return 'neutral'
}

// Function to enhance system prompt with conversation context and mood
function buildContextualSystemPrompt(
  basePrompt: string,
  personalityMode: PersonalityMode,
  conversationHistory: Message[] = [],
  moodData: { mood: string; confidence: number; emotionalKeywords: string[]; details?: any }
): string {
  const personalityConfig = getPersonalityConfig(personalityMode)
  let contextualAddition = ''

  // Add mood-specific guidance with confidence awareness
  if (moodData.confidence > 0.7) {
    // High confidence mood detection
    switch (moodData.mood) {
      case 'positive':
        switch (personalityMode) {
          case 'mentor':
            contextualAddition = `\n\nThe user is in a positive, uplifted state (confidence: ${Math.round(moodData.confidence * 100)}%). Help them reflect on and consolidate their positive experiences for deeper learning and growth.`
            break
          case 'coach':
            contextualAddition = `\n\nThe user is feeling positive and energized (confidence: ${Math.round(moodData.confidence * 100)}%). This is a perfect time to help them set ambitious goals and channel this energy into meaningful action.`
            break
          case 'friend':
            contextualAddition = `\n\nThe user is feeling good (confidence: ${Math.round(moodData.confidence * 100)}%)! Share genuinely in their joy and celebrate with them while being authentically happy for their positive state.`
            break
        }
        break

      case 'negative':
        switch (personalityMode) {
          case 'mentor':
            contextualAddition = `\n\nThe user is struggling emotionally (confidence: ${Math.round(moodData.confidence * 100)}%). Offer gentle wisdom and help them find meaning or lessons in their difficulty without dismissing their pain.`
            break
          case 'coach':
            contextualAddition = `\n\nThe user is facing emotional challenges (confidence: ${Math.round(moodData.confidence * 100)}%). Help them see obstacles as opportunities and provide concrete strategies to move forward while fully acknowledging their struggle.`
            break
          case 'friend':
            contextualAddition = `\n\nThe user needs emotional support (confidence: ${Math.round(moodData.confidence * 100)}%). Focus on listening, validating their feelings, and offering comfort without trying to immediately fix their problems.`
            break
        }
        break

      case 'goal-focused':
        if (personalityMode !== 'coach') {
          contextualAddition = `\n\nThe user is highly focused on goals and achievement (confidence: ${Math.round(moodData.confidence * 100)}%). Consider how your ${personalityMode} personality can support their goal-oriented mindset.`
        }
        break

      case 'reflective':
        if (personalityMode !== 'mentor') {
          contextualAddition = `\n\nThe user is in a deeply reflective mood (confidence: ${Math.round(moodData.confidence * 100)}%). Consider how your ${personalityMode} personality can support their desire for deeper understanding and introspection.`
        }
        break
    }
  } else if (moodData.confidence > 0.4) {
    // Moderate confidence - add subtle guidance
    contextualAddition = `\n\nThe user's emotional state suggests ${moodData.mood} sentiment (moderate confidence: ${Math.round(moodData.confidence * 100)}%). Be attuned to their emotional needs while maintaining your ${personalityMode} approach.`
  }

  // Add emotional keywords context if available
  if (moodData.emotionalKeywords && moodData.emotionalKeywords.length > 0) {
    contextualAddition += `\n\nKey emotional indicators detected: ${moodData.emotionalKeywords.slice(0, 5).join(', ')}. Use these insights to respond with appropriate emotional resonance.`
  }

  // Add conversation continuity context if there's history
  if (conversationHistory.length > 0) {
    contextualAddition += '\n\nConversation context: Maintain continuity with the ongoing conversation while staying true to your personality. Reference previous exchanges naturally when relevant.'
  }

  return basePrompt + contextualAddition
}

// Function to generate AI response with enhanced personality and mood logic
async function generateAIResponse(
  message: string,
  conversationHistory: Message[] = [],
  personalityMode: PersonalityMode = 'mentor',
  preferredProvider?: 'openai' | 'anthropic' | 'auto'
): Promise<{
  response: string
  provider: string
  mood: string
  moodConfidence: number
  emotionalKeywords: string[]
  suggestedPersonality?: PersonalityMode
}> {

  // Enhanced mood detection with service
  const moodData = await detectMoodWithService(message)
  const personalityConfig = getPersonalityConfig(personalityMode)
  const baseSystemPrompt = getPersonalitySystemPrompt(personalityMode)
  const temperature = getPersonalityTemperature(personalityMode)

  // Build contextual system prompt with mood insights
  const contextualSystemPrompt = buildContextualSystemPrompt(
    baseSystemPrompt,
    personalityMode,
    conversationHistory,
    moodData
  )

  // Prepare messages for the conversation
  const messages: Message[] = [
    { role: 'system', content: contextualSystemPrompt },
    ...conversationHistory,
    { role: 'user', content: message }
  ]

  // Provider selection logic
  const providers = []

  if (preferredProvider === 'openai' && openai) {
    providers.push('openai')
  } else if (preferredProvider === 'anthropic' && anthropic) {
    providers.push('anthropic')
  } else {
    // Auto mode or fallback - try both providers
    if (openai) providers.push('openai')
    if (anthropic) providers.push('anthropic')
  }

  if (providers.length === 0) {
    throw new Error('No AI providers configured. Please check your environment variables.')
  }

  // Try providers in order
  for (const provider of providers) {
    try {
      let rawResponse: string | null = null

      if (provider === 'openai' && openai) {
        console.log(`Attempting OpenAI request with ${personalityMode} personality and ${moodData.mood} mood...`)

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: temperature,
          max_tokens: 1000,
        })

        rawResponse = completion.choices[0]?.message?.content

      } else if (provider === 'anthropic' && anthropic) {
        console.log(`Attempting Anthropic request with ${personalityMode} personality and ${moodData.mood} mood...`)

        // Convert messages for Anthropic format
        const systemMessage = messages.find(m => m.role === 'system')?.content || contextualSystemPrompt
        const anthropicMessages = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))

        const completion = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          temperature: temperature,
          system: systemMessage,
          messages: anthropicMessages,
        })

        rawResponse = completion.content[0]?.type === 'text' ? completion.content[0].text : null
      }

      if (rawResponse) {
        // Format response according to personality style
        const formattedResponse = formatPersonalityResponse(rawResponse, personalityMode)

        // Check if a different personality might be more suitable
        const suggestedPersonality = getPersonalitySwitchSuggestion(personalityMode, message)

        return {
          response: formattedResponse,
          provider,
          mood: moodData.mood,
          moodConfidence: moodData.confidence,
          emotionalKeywords: moodData.emotionalKeywords,
          ...(suggestedPersonality && { suggestedPersonality })
        }
      }
    } catch (error) {
      console.error(`${provider.toUpperCase()} API error:`, error)

      // If this was the only provider or the last one, throw the error
      if (providers.length === 1 || provider === providers[providers.length - 1]) {
        throw error
      }
      // Otherwise, continue to the next provider
      continue
    }
  }

  throw new Error('All AI providers failed to generate a response')
}

// Function to get available providers
function getAvailableProviders(): string[] {
  const providers = []
  if (openai) providers.push('openai')
  if (anthropic) providers.push('anthropic')
  return providers
}

// GET endpoint to check available providers and personalities
export async function GET() {
  const availableProviders = getAvailableProviders()

  return NextResponse.json({
    availableProviders,
    defaultProvider: availableProviders[0] || null,
    personalities: ['mentor', 'coach', 'friend'],
    personalityDetails: {
      mentor: {
        name: 'Mentor',
        icon: '🧙',
        description: 'Wise guidance and deep reflection'
      },
      coach: {
        name: 'Coach',
        icon: '💪',
        description: 'Motivation and goal achievement'
      },
      friend: {
        name: 'Friend',
        icon: '🤝',
        description: 'Supportive listening and comfort'
      }
    },
    moodDetection: {
      enabled: true,
      categories: ['positive', 'negative', 'neutral', 'goal-focused', 'reflective'],
      service: 'Enhanced mood detection with AI-powered sentiment analysis'
    }
  })
}

// POST endpoint for chat
export async function POST(request: NextRequest) {
  let body: ChatRequest | undefined

  try {
    body = await request.json()

    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
    }

    const { message, messages = [], personalityMode = 'mentor', aiProvider } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    console.log(`Processing message with ${aiProvider || 'auto'} provider and ${personalityMode} personality`)

    // Generate AI response using enhanced personality and mood system
    const {
      response: aiResponse,
      provider: usedProvider,
      mood,
      moodConfidence,
      emotionalKeywords,
      suggestedPersonality
    } = await generateAIResponse(
      message.trim(),
      messages,
      personalityMode,
      aiProvider
    )

    // Build response object
    const responseData: ChatResponse = {
      response: aiResponse,
      message: aiResponse, // For backward compatibility
      provider: usedProvider,
      personalityMode,
      mood,
      mood_confidence: moodConfidence,
      emotional_keywords: emotionalKeywords,
      timestamp: new Date().toISOString()
    }

    // Add personality suggestion if applicable
    if (suggestedPersonality) {
      responseData.suggestedPersonality = suggestedPersonality
    }

    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error('Chat API error:', error)

    // Generate personality-appropriate fallback response
    const personalityMode = body?.personalityMode || 'mentor'
    const userMessage = body?.message || ''
    const fallbackResponse = getPersonalityFallbackResponse(personalityMode, userMessage)

    // Handle specific error types
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your AI provider configuration.' },
        { status: 401 }
      )
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'API quota exceeded. Please check your account limits.' },
        { status: 402 }
      )
    }

    // Return personality-appropriate fallback response for general errors
    return NextResponse.json({
      response: fallbackResponse,
      message: fallbackResponse,
      provider: 'fallback',
      personalityMode,
      mood: 'neutral',
      mood_confidence: 0.5,
      emotional_keywords: [],
      timestamp: new Date().toISOString(),
      fallback: true
    })
  }
}