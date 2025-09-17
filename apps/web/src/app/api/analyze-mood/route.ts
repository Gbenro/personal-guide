import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Types for mood analysis
export type MoodCategory = 'happy' | 'neutral' | 'sad' | 'anxious' | 'energized'

export interface MoodAnalysisRequest {
  text: string
}

export interface MoodAnalysisResponse {
  mood: MoodCategory
  mood_confidence: number // 0-1 confidence score
  emotional_keywords: string[]
  sentiment_details?: {
    primary_emotion: string
    secondary_emotions: string[]
    emotional_intensity: number // 0-1 scale
    context_analysis: string
  }
}

// Initialize AI providers
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
}) : null

// Enhanced emotional keyword mapping
const EMOTIONAL_KEYWORDS = {
  happy: [
    'happy', 'joyful', 'excited', 'thrilled', 'elated', 'cheerful', 'delighted',
    'pleased', 'content', 'satisfied', 'grateful', 'optimistic', 'positive',
    'wonderful', 'amazing', 'fantastic', 'great', 'awesome', 'brilliant',
    'celebrate', 'success', 'achievement', 'accomplished', 'proud', 'blessed'
  ],
  sad: [
    'sad', 'depressed', 'down', 'blue', 'melancholy', 'heartbroken', 'grief',
    'sorrow', 'despair', 'hopeless', 'disappointed', 'devastated', 'crying',
    'tears', 'lonely', 'isolated', 'empty', 'lost', 'hurt', 'pain',
    'terrible', 'awful', 'horrible', 'miserable', 'upset', 'broken'
  ],
  anxious: [
    'anxious', 'worried', 'stressed', 'nervous', 'tense', 'fearful', 'afraid',
    'panic', 'overwhelmed', 'pressure', 'uncertain', 'doubt', 'concern',
    'apprehensive', 'uneasy', 'restless', 'agitated', 'troubled', 'bothered',
    'difficult', 'challenging', 'struggle', 'problem', 'issue', 'crisis'
  ],
  energized: [
    'energized', 'motivated', 'determined', 'focused', 'driven', 'passionate',
    'ambitious', 'goal', 'achieve', 'accomplish', 'productive', 'active',
    'dynamic', 'powerful', 'strong', 'confident', 'ready', 'inspired',
    'push', 'challenge', 'overcome', 'progress', 'improve', 'advance'
  ],
  neutral: [
    'okay', 'fine', 'normal', 'regular', 'usual', 'typical', 'average',
    'moderate', 'balanced', 'calm', 'peaceful', 'stable', 'steady',
    'thinking', 'considering', 'reflecting', 'wondering', 'planning'
  ]
}

// Advanced sentiment analysis using keyword matching and context
function analyzeSentimentKeywords(text: string): {
  detectedKeywords: { [mood: string]: string[] }
  scores: { [mood: string]: number }
} {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)
  const detectedKeywords: { [mood: string]: string[] } = {}
  const scores: { [mood: string]: number } = {}

  // Initialize scores
  Object.keys(EMOTIONAL_KEYWORDS).forEach(mood => {
    detectedKeywords[mood] = []
    scores[mood] = 0
  })

  // Check for keyword matches
  Object.entries(EMOTIONAL_KEYWORDS).forEach(([mood, keywords]) => {
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        detectedKeywords[mood].push(keyword)
        // Weight longer keywords higher
        const weight = keyword.length > 6 ? 2 : 1
        scores[mood] += weight
      }
    })
  })

  // Apply context modifiers
  const intensifiers = ['very', 'extremely', 'incredibly', 'really', 'so', 'quite', 'deeply']
  const diminishers = ['somewhat', 'slightly', 'kind of', 'sort of', 'a bit']

  intensifiers.forEach(intensifier => {
    if (lowerText.includes(intensifier)) {
      Object.keys(scores).forEach(mood => {
        if (scores[mood] > 0) scores[mood] *= 1.5
      })
    }
  })

  diminishers.forEach(diminisher => {
    if (lowerText.includes(diminisher)) {
      Object.keys(scores).forEach(mood => {
        if (scores[mood] > 0) scores[mood] *= 0.7
      })
    }
  })

  return { detectedKeywords, scores }
}

// Determine primary mood from analysis
function determinePrimaryMood(scores: { [mood: string]: number }): {
  mood: MoodCategory
  confidence: number
  allScores: { [mood: string]: number }
} {
  const moodEntries = Object.entries(scores).sort(([,a], [,b]) => b - a)
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)

  if (totalScore === 0) {
    return { mood: 'neutral', confidence: 0.5, allScores: scores }
  }

  const [primaryMood, primaryScore] = moodEntries[0]
  const confidence = Math.min(primaryScore / Math.max(totalScore, 1), 1)

  return {
    mood: primaryMood as MoodCategory,
    confidence: Math.max(confidence, 0.1), // Minimum confidence
    allScores: scores
  }
}

// AI-powered sentiment analysis as fallback/enhancement
async function aiSentimentAnalysis(text: string): Promise<{
  mood: MoodCategory
  confidence: number
  analysis: string
} | null> {
  const prompt = `Analyze the emotional sentiment of this text and respond with a JSON object containing:
- mood: one of "happy", "sad", "anxious", "energized", "neutral"
- confidence: a number between 0 and 1 indicating confidence in the assessment
- analysis: a brief explanation of the emotional context

Text to analyze: "${text}"

Respond only with valid JSON, no other text.`

  try {
    // Try Claude first (better at nuanced emotional analysis)
    if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })

      if (response.content[0]?.type === 'text') {
        const result = JSON.parse(response.content[0].text)
        return {
          mood: result.mood as MoodCategory,
          confidence: Math.min(Math.max(result.confidence, 0), 1),
          analysis: result.analysis
        }
      }
    }

    // Fallback to OpenAI
    if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200
      })

      if (response.choices[0]?.message?.content) {
        const result = JSON.parse(response.choices[0].message.content)
        return {
          mood: result.mood as MoodCategory,
          confidence: Math.min(Math.max(result.confidence, 0), 1),
          analysis: result.analysis
        }
      }
    }
  } catch (error) {
    console.error('AI sentiment analysis failed:', error)
  }

  return null
}

// Main mood analysis function
async function analyzeMood(text: string): Promise<MoodAnalysisResponse> {
  // First, analyze using keyword-based approach
  const { detectedKeywords, scores } = analyzeSentimentKeywords(text)
  const keywordAnalysis = determinePrimaryMood(scores)

  // Extract all detected emotional keywords
  const allEmotionalKeywords = Object.values(detectedKeywords)
    .flat()
    .filter((keyword, index, array) => array.indexOf(keyword) === index) // Remove duplicates

  // Try AI analysis for enhanced accuracy
  const aiAnalysis = await aiSentimentAnalysis(text)

  // Combine keyword and AI analysis
  let finalMood = keywordAnalysis.mood
  let finalConfidence = keywordAnalysis.confidence

  if (aiAnalysis) {
    // If AI analysis agrees with keyword analysis, boost confidence
    if (aiAnalysis.mood === keywordAnalysis.mood) {
      finalConfidence = Math.min((keywordAnalysis.confidence + aiAnalysis.confidence) / 2 + 0.2, 1)
    } else {
      // If they disagree, use the one with higher confidence
      if (aiAnalysis.confidence > keywordAnalysis.confidence) {
        finalMood = aiAnalysis.mood
        finalConfidence = aiAnalysis.confidence
      }
    }
  }

  // Build detailed response
  const response: MoodAnalysisResponse = {
    mood: finalMood,
    mood_confidence: Math.round(finalConfidence * 100) / 100, // Round to 2 decimal places
    emotional_keywords: allEmotionalKeywords,
    sentiment_details: {
      primary_emotion: finalMood,
      secondary_emotions: Object.entries(keywordAnalysis.allScores)
        .filter(([mood, score]) => mood !== finalMood && score > 0)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([mood]) => mood),
      emotional_intensity: finalConfidence,
      context_analysis: aiAnalysis?.analysis || `Detected ${finalMood} sentiment with ${allEmotionalKeywords.length} emotional indicators`
    }
  }

  return response
}

// Cache for mood analysis results
const moodCache = new Map<string, { result: MoodAnalysisResponse; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedMoodAnalysis(text: string): MoodAnalysisResponse | null {
  const cached = moodCache.get(text)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result
  }
  return null
}

function setCachedMoodAnalysis(text: string, result: MoodAnalysisResponse): void {
  moodCache.set(text, { result, timestamp: Date.now() })

  // Clean up old cache entries
  if (moodCache.size > 100) {
    const oldestEntries = Array.from(moodCache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)
      .slice(0, 20)

    oldestEntries.forEach(([key]) => moodCache.delete(key))
  }
}

// POST endpoint for mood analysis
export async function POST(request: NextRequest) {
  try {
    const body: MoodAnalysisRequest = await request.json()

    if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const text = body.text.trim()

    // Check cache first
    const cachedResult = getCachedMoodAnalysis(text)
    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true
      })
    }

    // Perform mood analysis
    const result = await analyzeMood(text)

    // Cache the result
    setCachedMoodAnalysis(text, result)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Mood analysis error:', error)

    // Provide fallback response
    return NextResponse.json({
      mood: 'neutral' as MoodCategory,
      mood_confidence: 0.5,
      emotional_keywords: [],
      sentiment_details: {
        primary_emotion: 'neutral',
        secondary_emotions: [],
        emotional_intensity: 0.5,
        context_analysis: 'Unable to analyze sentiment due to processing error'
      },
      error: 'Failed to analyze mood, using neutral fallback'
    })
  }
}

// GET endpoint for service info
export async function GET() {
  return NextResponse.json({
    service: 'Personal Guide Mood Detection',
    version: '1.0.0',
    capabilities: [
      'Text sentiment analysis',
      'Mood categorization (happy, neutral, sad, anxious, energized)',
      'Confidence scoring',
      'Emotional keyword extraction',
      'AI-powered sentiment enhancement',
      'Response caching'
    ],
    mood_categories: {
      happy: 'Positive emotions, joy, contentment, satisfaction',
      neutral: 'Balanced, calm, reflective states',
      sad: 'Sadness, disappointment, grief, melancholy',
      anxious: 'Worry, stress, fear, uncertainty',
      energized: 'Motivation, determination, enthusiasm, drive'
    },
    usage: {
      endpoint: 'POST /api/analyze-mood',
      body: { text: 'Text to analyze' },
      response: 'MoodAnalysisResponse object'
    }
  })
}