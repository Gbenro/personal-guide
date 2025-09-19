import { getUserHabits, getTodayCompletions, calculateStreak, type Habit, type HabitEntry } from './habitService'
import { getUserJournalEntries } from './journalService'
import { getDashboardData, type HabitWithStatus, type DashboardStats, type AIInsight } from './dashboardService'
import { JournalEntry as StoreJournalEntry, MoodEntry as StoreMoodEntry } from '@/stores/personalGuideStore'

// =============================================================================
// AI CONTEXT TYPES
// =============================================================================

export interface UserContext {
  // Core user data
  userId: string
  timeframe: 'recent' | 'week' | 'month'

  // Habit context
  habits: {
    active: HabitWithStatus[]
    recentCompletions: HabitEntry[]
    strugglingHabits: HabitWithStatus[]
    successfulHabits: HabitWithStatus[]
    patterns: HabitPattern[]
  }

  // Journal & mood context
  journal: {
    recentEntries: StoreJournalEntry[]
    moodTrend: MoodTrend
    keyThemes: string[]
    emotionalPatterns: EmotionalPattern[]
  }

  // Performance context
  performance: {
    stats: DashboardStats
    trends: PerformanceTrend[]
    insights: AIInsight[]
  }

  // Contextual metadata
  meta: {
    generatedAt: string
    dataPoints: number
    confidenceScore: number
  }
}

export interface HabitPattern {
  habitId: string
  habitName: string
  pattern: 'consistent' | 'struggling' | 'improving' | 'declining'
  confidence: number
  context: string
  recommendation?: string
}

export interface MoodTrend {
  direction: 'improving' | 'stable' | 'declining'
  currentAverage: number
  previousAverage: number
  volatility: 'low' | 'medium' | 'high'
  dominantMoods: Array<{ mood: number, frequency: number }>
}

export interface EmotionalPattern {
  trigger: string
  impact: 'positive' | 'negative' | 'neutral'
  frequency: number
  associatedActivities: string[]
}

export interface PerformanceTrend {
  metric: string
  direction: 'up' | 'down' | 'stable'
  change: number
  significance: 'high' | 'medium' | 'low'
}

export interface ContextualPrompt {
  userMessage: string
  context: UserContext
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
  intent?: 'help' | 'analysis' | 'planning' | 'motivation' | 'general'
}

// =============================================================================
// CONTEXT GATHERING FUNCTIONS
// =============================================================================

/**
 * Gather comprehensive user context for AI personalization
 */
export async function gatherUserContext(
  userId: string,
  timeframe: 'recent' | 'week' | 'month' = 'recent'
): Promise<UserContext> {
  try {
    const startTime = Date.now()

    // Gather all data in parallel for performance
    const [dashboardData, journalEntries] = await Promise.all([
      getDashboardData(userId),
      getUserJournalEntries(userId, {
        limit: timeframe === 'recent' ? 5 : timeframe === 'week' ? 10 : 20,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
    ])

    // For now, use empty mood entries until we implement the full mood service
    const moodEntries: StoreMoodEntry[] = []

    // Analyze patterns and trends
    const habitPatterns = analyzeHabitPatterns(dashboardData.habits)
    const moodTrend = analyzeMoodTrend(moodEntries)
    const emotionalPatterns = analyzeEmotionalPatterns(journalEntries, moodEntries)
    const performanceTrends = analyzePerformanceTrends(dashboardData.stats)
    const keyThemes = extractJournalThemes(journalEntries)

    // Calculate confidence score based on data availability
    const dataPoints = dashboardData.habits.length + journalEntries.length + moodEntries.length
    const confidenceScore = Math.min(100, (dataPoints / 10) * 100)

    const context: UserContext = {
      userId,
      timeframe,
      habits: {
        active: dashboardData.habits,
        recentCompletions: [], // Would need to fetch from habit service
        strugglingHabits: dashboardData.habits.filter(h => h.isAtRisk || h.streak.current_streak === 0),
        successfulHabits: dashboardData.habits.filter(h => h.streak.current_streak >= 7),
        patterns: habitPatterns
      },
      journal: {
        recentEntries: journalEntries,
        moodTrend,
        keyThemes,
        emotionalPatterns
      },
      performance: {
        stats: dashboardData.stats,
        trends: performanceTrends,
        insights: dashboardData.insights
      },
      meta: {
        generatedAt: new Date().toISOString(),
        dataPoints,
        confidenceScore: Math.round(confidenceScore)
      }
    }

    console.log(`Context gathered in ${Date.now() - startTime}ms for user ${userId}`)
    return context

  } catch (error) {
    console.error('Failed to gather user context:', error)

    // Return minimal context on error
    return {
      userId,
      timeframe,
      habits: {
        active: [],
        recentCompletions: [],
        strugglingHabits: [],
        successfulHabits: [],
        patterns: []
      },
      journal: {
        recentEntries: [],
        moodTrend: {
          direction: 'stable',
          currentAverage: 5,
          previousAverage: 5,
          volatility: 'low',
          dominantMoods: []
        },
        keyThemes: [],
        emotionalPatterns: []
      },
      performance: {
        stats: {
          dailyCompletionRate: 0,
          totalActiveHabits: 0,
          completedTodayCount: 0,
          pendingTodayCount: 0,
          longestCurrentStreak: 0,
          totalActiveStreaks: 0,
          atRiskHabitsCount: 0,
          weeklyCompletionRate: 0,
          monthlyTrend: 'stable'
        },
        trends: [],
        insights: []
      },
      meta: {
        generatedAt: new Date().toISOString(),
        dataPoints: 0,
        confidenceScore: 0
      }
    }
  }
}

/**
 * Summarize context into a concise format for AI prompts
 */
export function summarizeContext(context: UserContext): string {
  const { habits, journal, performance, meta } = context

  const summary = [
    `# User Context Summary (${meta.confidenceScore}% confidence)`,
    `Generated: ${new Date(meta.generatedAt).toLocaleString()}`,
    '',
    '## 📊 Current Performance',
    `- Active habits: ${performance.stats.totalActiveHabits}`,
    `- Daily completion rate: ${Math.round(performance.stats.dailyCompletionRate * 100)}%`,
    `- Completed today: ${performance.stats.completedTodayCount}/${performance.stats.totalActiveHabits}`,
    `- Longest streak: ${performance.stats.longestCurrentStreak} days`,
    '',
    '## 🎯 Habit Status',
  ]

  // Add struggling habits
  if (habits.strugglingHabits.length > 0) {
    summary.push(`### ⚠️ Needs attention (${habits.strugglingHabits.length}):`)
    habits.strugglingHabits.slice(0, 3).forEach(habit => {
      summary.push(`- ${habit.name}: ${habit.daysSinceLastCompletion} days since last completion`)
    })
    summary.push('')
  }

  // Add successful habits
  if (habits.successfulHabits.length > 0) {
    summary.push(`### ✅ Going strong (${habits.successfulHabits.length}):`)
    habits.successfulHabits.slice(0, 3).forEach(habit => {
      summary.push(`- ${habit.name}: ${habit.streak.current_streak} day streak`)
    })
    summary.push('')
  }

  // Add mood context if available
  if (journal.moodTrend.currentAverage > 0) {
    summary.push('## 😊 Mood & Wellbeing')
    summary.push(`- Current mood trend: ${journal.moodTrend.direction} (avg: ${journal.moodTrend.currentAverage}/10)`)
    summary.push(`- Mood volatility: ${journal.moodTrend.volatility}`)
    if (journal.keyThemes.length > 0) {
      summary.push(`- Recent journal themes: ${journal.keyThemes.slice(0, 3).join(', ')}`)
    }
    summary.push('')
  }

  // Add patterns and insights
  if (habits.patterns.length > 0) {
    summary.push('## 🔍 Key Patterns')
    habits.patterns.slice(0, 2).forEach(pattern => {
      summary.push(`- ${pattern.habitName}: ${pattern.pattern} (${pattern.confidence}% confidence)`)
    })
    summary.push('')
  }

  summary.push('---')
  summary.push('Use this context to provide personalized, relevant advice based on the user\'s actual data and patterns.')

  return summary.join('\n')
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

function analyzeHabitPatterns(habits: HabitWithStatus[]): HabitPattern[] {
  return habits.map(habit => {
    let pattern: HabitPattern['pattern'] = 'consistent'
    let confidence = 50
    let context = ''

    if (habit.isAtRisk) {
      pattern = 'struggling'
      confidence = 90
      context = `${habit.daysSinceLastCompletion} days without completion`
    } else if (habit.streak.current_streak >= 7) {
      pattern = 'consistent'
      confidence = 80
      context = `${habit.streak.current_streak} day active streak`
    } else if (habit.streak.current_streak > 0) {
      pattern = 'improving'
      confidence = 60
      context = `Building momentum with ${habit.streak.current_streak} day streak`
    }

    return {
      habitId: habit.id,
      habitName: habit.name,
      pattern,
      confidence,
      context
    }
  })
}

function analyzeMoodTrend(moodEntries: StoreMoodEntry[]): MoodTrend {
  if (moodEntries.length === 0) {
    return {
      direction: 'stable',
      currentAverage: 5,
      previousAverage: 5,
      volatility: 'low',
      dominantMoods: []
    }
  }

  const ratings = moodEntries.map(entry => 'rating' in entry ? entry.rating : entry.mood_rating || 5)
  const currentAverage = ratings.slice(0, Math.ceil(ratings.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(ratings.length / 2)
  const previousAverage = ratings.slice(Math.ceil(ratings.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(ratings.length / 2) || currentAverage

  const direction = currentAverage > previousAverage + 0.5 ? 'improving' :
                   currentAverage < previousAverage - 0.5 ? 'declining' : 'stable'

  // Calculate volatility based on standard deviation
  const variance = ratings.reduce((acc, rating) => acc + Math.pow(rating - currentAverage, 2), 0) / ratings.length
  const stdDev = Math.sqrt(variance)
  const volatility = stdDev > 2 ? 'high' : stdDev > 1 ? 'medium' : 'low'

  // Find dominant moods
  const moodCounts: { [key: number]: number } = {}
  ratings.forEach(rating => {
    moodCounts[Math.round(rating)] = (moodCounts[Math.round(rating)] || 0) + 1
  })

  const dominantMoods = Object.entries(moodCounts)
    .map(([mood, frequency]) => ({ mood: parseInt(mood), frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3)

  return {
    direction,
    currentAverage: Math.round(currentAverage * 10) / 10,
    previousAverage: Math.round(previousAverage * 10) / 10,
    volatility,
    dominantMoods
  }
}

function analyzeEmotionalPatterns(
  journalEntries: StoreJournalEntry[],
  moodEntries: StoreMoodEntry[]
): EmotionalPattern[] {
  // This is a simplified implementation - could be enhanced with NLP
  const patterns: EmotionalPattern[] = []

  // Analyze journal content for common themes
  const themes: { [key: string]: number } = {}
  journalEntries.forEach(entry => {
    const content = entry.content.toLowerCase()
    // Simple keyword extraction
    const keywords = ['work', 'family', 'exercise', 'stress', 'happy', 'tired', 'anxious', 'excited']
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        themes[keyword] = (themes[keyword] || 0) + 1
      }
    })
  })

  // Convert themes to patterns
  Object.entries(themes).forEach(([trigger, frequency]) => {
    if (frequency >= 2) {
      patterns.push({
        trigger,
        impact: ['happy', 'excited', 'exercise'].includes(trigger) ? 'positive' :
                ['stress', 'tired', 'anxious'].includes(trigger) ? 'negative' : 'neutral',
        frequency,
        associatedActivities: [] // Could be enhanced with more analysis
      })
    }
  })

  return patterns.slice(0, 5) // Return top 5 patterns
}

function analyzePerformanceTrends(stats: DashboardStats): PerformanceTrend[] {
  const trends: PerformanceTrend[] = []

  // Completion rate trend
  if (stats.dailyCompletionRate !== stats.weeklyCompletionRate) {
    const change = Math.round((stats.dailyCompletionRate - stats.weeklyCompletionRate) * 100)
    trends.push({
      metric: 'Completion Rate',
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change: Math.abs(change),
      significance: Math.abs(change) > 20 ? 'high' : Math.abs(change) > 10 ? 'medium' : 'low'
    })
  }

  return trends
}

function extractJournalThemes(entries: StoreJournalEntry[]): string[] {
  const themes: { [key: string]: number } = {}

  entries.forEach(entry => {
    // Extract themes from tags if available
    if ('tags' in entry && entry.tags) {
      entry.tags.forEach(tag => {
        themes[tag] = (themes[tag] || 0) + 1
      })
    }

    // Simple content analysis for themes
    const content = entry.content.toLowerCase()
    const commonThemes = ['growth', 'challenge', 'success', 'learning', 'relationship', 'health', 'career']
    commonThemes.forEach(theme => {
      if (content.includes(theme)) {
        themes[theme] = (themes[theme] || 0) + 1
      }
    })
  })

  return Object.entries(themes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme)
}

// =============================================================================
// CONTEXT OPTIMIZATION
// =============================================================================

/**
 * Create a compact context for token-limited AI models
 */
export function createCompactContext(context: UserContext): string {
  const { habits, performance, journal } = context

  return [
    `User has ${performance.stats.totalActiveHabits} active habits with ${Math.round(performance.stats.dailyCompletionRate * 100)}% completion rate.`,
    habits.strugglingHabits.length > 0 ? `Struggling with: ${habits.strugglingHabits.map(h => h.name).join(', ')}.` : '',
    habits.successfulHabits.length > 0 ? `Succeeding with: ${habits.successfulHabits.map(h => h.name).join(', ')}.` : '',
    journal.moodTrend.currentAverage > 0 ? `Mood trending ${journal.moodTrend.direction} (${journal.moodTrend.currentAverage}/10).` : '',
    journal.keyThemes.length > 0 ? `Recent themes: ${journal.keyThemes.join(', ')}.` : ''
  ].filter(Boolean).join(' ')
}

/**
 * Check if user has sufficient data for personalized responses
 */
export function hasPersonalizationData(context: UserContext): boolean {
  return context.meta.confidenceScore >= 30 && context.meta.dataPoints >= 3
}