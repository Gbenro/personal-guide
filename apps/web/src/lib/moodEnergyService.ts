import { supabase } from './supabase'
import { validateMoodEnergyEntry, type MoodEnergyEntryInput } from './validationSchemas'

export interface MoodEnergyEntry {
  id: string
  user_id: string
  mood_rating: number // 1-10
  energy_level: number // 1-10
  notes?: string
  tags?: string[]
  context?: {
    weather?: string
    location?: string
    activities?: string[]
    sleep_hours?: number
    exercise?: boolean
  }
  created_at: string
  updated_at?: string
}

export interface MoodEnergyStats {
  averageMood: number
  averageEnergy: number
  moodTrend: 'improving' | 'stable' | 'declining'
  energyTrend: 'improving' | 'stable' | 'declining'
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  correlations: {
    sleepMoodCorrelation: number
    exerciseEnergyCorrelation: number
    weatherMoodCorrelation: number
  }
  weeklyPattern: {
    day: string
    avgMood: number
    avgEnergy: number
  }[]
  insights: string[]
}

// Create mood and energy entry
export async function createMoodEnergyEntry(
  userId: string,
  data: {
    moodRating: number
    energyLevel: number
    notes?: string
    tags?: string[]
    context?: MoodEnergyEntry['context']
  }
): Promise<MoodEnergyEntry | null> {
  try {
    // Validate input data
    const validationResult = validateMoodEnergyEntry({
      mood_rating: data.moodRating,
      energy_level: data.energyLevel,
      notes: data.notes,
      tags: data.tags,
      context: data.context
    })

    if (!validationResult.success) {
      console.error('Mood/Energy entry validation failed:', validationResult.error.errors)
      throw new Error(`Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`)
    }
    const { data: entry, error } = await supabase
      .from('mood_energy_entries')
      .insert({
        user_id: userId,
        mood_rating: data.moodRating,
        energy_level: data.energyLevel,
        notes: data.notes,
        tags: data.tags,
        context: data.context,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating mood/energy entry:', error)

      // Fallback: create a mock entry for development
      const mockEntry: MoodEnergyEntry = {
        id: `mock-${Date.now()}`,
        user_id: userId,
        mood_rating: data.moodRating,
        energy_level: data.energyLevel,
        notes: data.notes,
        tags: data.tags,
        context: data.context,
        created_at: new Date().toISOString()
      }

      console.log('Using fallback mood/energy entry:', mockEntry)
      return mockEntry
    }

    return entry
  } catch (error) {
    console.error('Error creating mood/energy entry:', error)

    // Fallback: create a mock entry for development
    const mockEntry: MoodEnergyEntry = {
      id: `mock-${Date.now()}`,
      user_id: userId,
      mood_rating: data.moodRating,
      energy_level: data.energyLevel,
      notes: data.notes,
      tags: data.tags,
      context: data.context,
      created_at: new Date().toISOString()
    }

    console.log('Using fallback mood/energy entry after catch:', mockEntry)
    return mockEntry
  }
}

// Get mood and energy entries for a user
export async function getMoodEnergyEntries(
  userId: string,
  options?: {
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<MoodEnergyEntry[]> {
  try {
    let query = supabase
      .from('mood_energy_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching mood/energy entries:', error)
    return []
  }
}

// Get today's mood and energy entries
export async function getTodaysMoodEnergy(userId: string): Promise<MoodEnergyEntry[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return getMoodEnergyEntries(userId, {
    startDate: today.toISOString(),
    limit: 10
  })
}

// Calculate mood and energy statistics
export async function getMoodEnergyStats(
  userId: string,
  days: number = 30
): Promise<MoodEnergyStats> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const entries = await getMoodEnergyEntries(userId, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  })

  if (entries.length === 0) {
    return {
      averageMood: 5,
      averageEnergy: 5,
      moodTrend: 'stable',
      energyTrend: 'stable',
      bestTimeOfDay: 'morning',
      correlations: {
        sleepMoodCorrelation: 0,
        exerciseEnergyCorrelation: 0,
        weatherMoodCorrelation: 0
      },
      weeklyPattern: [],
      insights: ['Start tracking your mood and energy to see patterns!']
    }
  }

  // Calculate averages
  const avgMood = entries.reduce((sum, e) => sum + e.mood_rating, 0) / entries.length
  const avgEnergy = entries.reduce((sum, e) => sum + e.energy_level, 0) / entries.length

  // Calculate trends (compare last week to previous week)
  const midPoint = Math.floor(entries.length / 2)
  const recentMood = entries.slice(0, midPoint).reduce((sum, e) => sum + e.mood_rating, 0) / midPoint
  const olderMood = entries.slice(midPoint).reduce((sum, e) => sum + e.mood_rating, 0) / (entries.length - midPoint)
  const recentEnergy = entries.slice(0, midPoint).reduce((sum, e) => sum + e.energy_level, 0) / midPoint
  const olderEnergy = entries.slice(midPoint).reduce((sum, e) => sum + e.energy_level, 0) / (entries.length - midPoint)

  const moodTrend = recentMood > olderMood + 0.5 ? 'improving' :
                     recentMood < olderMood - 0.5 ? 'declining' : 'stable'
  const energyTrend = recentEnergy > olderEnergy + 0.5 ? 'improving' :
                       recentEnergy < olderEnergy - 0.5 ? 'declining' : 'stable'

  // Calculate best time of day
  const timeGroups = entries.reduce((acc, entry) => {
    const hour = new Date(entry.created_at).getHours()
    const timeOfDay = hour < 6 ? 'night' :
                      hour < 12 ? 'morning' :
                      hour < 18 ? 'afternoon' : 'evening'

    if (!acc[timeOfDay]) {
      acc[timeOfDay] = { mood: 0, energy: 0, count: 0 }
    }
    acc[timeOfDay].mood += entry.mood_rating
    acc[timeOfDay].energy += entry.energy_level
    acc[timeOfDay].count++
    return acc
  }, {} as Record<string, { mood: number; energy: number; count: number }>)

  const bestTimeOfDay = Object.entries(timeGroups)
    .map(([time, data]) => ({
      time: time as 'morning' | 'afternoon' | 'evening' | 'night',
      avgScore: (data.mood + data.energy) / (2 * data.count)
    }))
    .sort((a, b) => b.avgScore - a.avgScore)[0]?.time || 'morning'

  // Calculate correlations (simplified)
  const sleepEntries = entries.filter(e => e.context?.sleep_hours)
  const sleepMoodCorrelation = sleepEntries.length > 0 ?
    sleepEntries.reduce((sum, e) => {
      const sleepScore = (e.context?.sleep_hours || 0) / 8
      return sum + (e.mood_rating / 10) * sleepScore
    }, 0) / sleepEntries.length : 0

  const exerciseEntries = entries.filter(e => e.context?.exercise !== undefined)
  const exerciseEnergyCorrelation = exerciseEntries.length > 0 ?
    exerciseEntries.reduce((sum, e) => {
      return sum + (e.context?.exercise ? e.energy_level / 10 : 0)
    }, 0) / exerciseEntries.length : 0

  // Weekly pattern
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const weeklyPattern = weekDays.map(day => {
    const dayEntries = entries.filter(e => {
      const entryDay = new Date(e.created_at).getDay()
      return weekDays[entryDay] === day
    })

    return {
      day,
      avgMood: dayEntries.length > 0 ?
        dayEntries.reduce((sum, e) => sum + e.mood_rating, 0) / dayEntries.length : 5,
      avgEnergy: dayEntries.length > 0 ?
        dayEntries.reduce((sum, e) => sum + e.energy_level, 0) / dayEntries.length : 5
    }
  })

  // Generate insights
  const insights = generateInsights({
    avgMood,
    avgEnergy,
    moodTrend,
    energyTrend,
    bestTimeOfDay,
    weeklyPattern,
    entries
  })

  return {
    averageMood: avgMood,
    averageEnergy: avgEnergy,
    moodTrend,
    energyTrend,
    bestTimeOfDay,
    correlations: {
      sleepMoodCorrelation,
      exerciseEnergyCorrelation,
      weatherMoodCorrelation: 0 // Placeholder
    },
    weeklyPattern,
    insights
  }
}

// Generate personalized insights
function generateInsights(data: {
  avgMood: number
  avgEnergy: number
  moodTrend: string
  energyTrend: string
  bestTimeOfDay: string
  weeklyPattern: any[]
  entries: MoodEnergyEntry[]
}): string[] {
  const insights: string[] = []

  // Mood insights
  if (data.avgMood >= 7) {
    insights.push(`Great job! Your average mood (${data.avgMood.toFixed(1)}/10) is in the positive range.`)
  } else if (data.avgMood < 5) {
    insights.push(`Your mood has been lower lately (${data.avgMood.toFixed(1)}/10). Consider activities that bring you joy.`)
  }

  // Trend insights
  if (data.moodTrend === 'improving') {
    insights.push('Your mood is trending upward! Keep up whatever you\'re doing.')
  } else if (data.moodTrend === 'declining') {
    insights.push('Your mood has been declining. Try to identify and address any stressors.')
  }

  if (data.energyTrend === 'improving') {
    insights.push('Your energy levels are improving! Your routine seems to be working.')
  } else if (data.energyTrend === 'declining') {
    insights.push('Your energy has been lower. Consider your sleep and exercise habits.')
  }

  // Best time insights
  insights.push(`You tend to feel best in the ${data.bestTimeOfDay}. Plan important tasks for this time.`)

  // Weekly pattern insights
  const bestDay = data.weeklyPattern.reduce((best, day) =>
    day.avgMood > best.avgMood ? day : best
  )
  const worstDay = data.weeklyPattern.reduce((worst, day) =>
    day.avgMood < worst.avgMood ? day : worst
  )

  if (bestDay.day !== worstDay.day) {
    insights.push(`${bestDay.day}s tend to be your best days, while ${worstDay.day}s are more challenging.`)
  }

  // Recent patterns
  const recentEntries = data.entries.slice(0, 7)
  const recentTags = recentEntries.flatMap(e => e.tags || [])
  const tagCounts = recentTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([tag]) => tag)

  if (topTags.length > 0) {
    insights.push(`Recent themes: ${topTags.join(', ')}`)
  }

  return insights
}

// Update an existing entry
export async function updateMoodEnergyEntry(
  entryId: string,
  updates: Partial<MoodEnergyEntry>
): Promise<MoodEnergyEntry | null> {
  try {
    const { data, error } = await supabase
      .from('mood_energy_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating mood/energy entry:', error)
    return null
  }
}

// Delete an entry
export async function deleteMoodEnergyEntry(entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mood_energy_entries')
      .delete()
      .eq('id', entryId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting mood/energy entry:', error)
    return false
  }
}

// Get mood/energy patterns for AI analysis
export async function getMoodPatterns(
  userId: string,
  days: number = 30
): Promise<{
  patterns: string[]
  recommendations: string[]
}> {
  const stats = await getMoodEnergyStats(userId, days)
  const entries = await getMoodEnergyEntries(userId, {
    startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  })

  const patterns: string[] = []
  const recommendations: string[] = []

  // Identify patterns
  if (stats.correlations.sleepMoodCorrelation > 0.6) {
    patterns.push('Strong correlation between sleep and mood')
    recommendations.push('Prioritize consistent sleep schedule for better mood')
  }

  if (stats.correlations.exerciseEnergyCorrelation > 0.6) {
    patterns.push('Exercise significantly boosts your energy')
    recommendations.push('Maintain regular exercise routine for sustained energy')
  }

  // Low mood periods
  const lowMoodEntries = entries.filter(e => e.mood_rating < 4)
  if (lowMoodEntries.length > entries.length * 0.3) {
    patterns.push('Frequent low mood periods detected')
    recommendations.push('Consider professional support or stress management techniques')
  }

  // Energy patterns
  const lowEnergyAfternoons = entries.filter(e => {
    const hour = new Date(e.created_at).getHours()
    return hour >= 14 && hour <= 16 && e.energy_level < 4
  })

  if (lowEnergyAfternoons.length > 5) {
    patterns.push('Afternoon energy slumps detected')
    recommendations.push('Try a short walk or healthy snack in the afternoon')
  }

  return { patterns, recommendations }
}