import { supabase } from './supabase'
import type { JournalEntry, MoodEntry } from '@/stores/personalGuideStore'
import { validateJournalEntry, validateMoodEntry, type JournalEntryInput, type MoodEntryInput } from './validationSchemas'

// =============================================================================
// JOURNAL ENTRY OPERATIONS
// =============================================================================

/**
 * Get all journal entries for a user with optional filtering
 */
export async function getUserJournalEntries(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    sortBy?: 'created_at' | 'updated_at' | 'mood_rating'
    sortOrder?: 'asc' | 'desc'
    dateRange?: {
      start: string
      end: string
    }
  }
): Promise<JournalEntry[]> {
  try {
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)

    // Apply date range filter if provided
    if (options?.dateRange) {
      query = query
        .gte('created_at', options.dateRange.start)
        .lte('created_at', options.dateRange.end)
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'created_at'
    const sortOrder = options?.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination if provided
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching journal entries:', error)
      // Return empty array if table doesn't exist or other DB errors
      return []
    }

    return (data as JournalEntry[]) || []
  } catch (error) {
    console.error('Error in getUserJournalEntries:', error)
    return []
  }
}

/**
 * Create a new journal entry
 */
export async function createJournalEntry(
  userId: string,
  entry: {
    title?: string
    content: string
    mood_rating?: number
    tags?: string[]
  }
): Promise<JournalEntry | null> {
  try {
    // Validate input data
    const validationResult = validateJournalEntry(entry)

    if (!validationResult.success) {
      console.error('Journal entry validation failed:', validationResult.error.errors)
      throw new Error(`Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`)
    }
    // Calculate word count
    const wordCount = entry.content.trim().split(/\s+/).length

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        title: entry.title,
        content: entry.content,
        mood_rating: entry.mood_rating,
        tags: entry.tags || [],
        word_count: wordCount,
        is_favorite: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating journal entry:', error)
      return null
    }

    return data as JournalEntry
  } catch (error) {
    console.error('Error in createJournalEntry:', error)
    return null
  }
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(
  entryId: string,
  userId: string,
  updates: {
    title?: string
    content?: string
    mood_rating?: number
    tags?: string[]
    is_favorite?: boolean
  }
): Promise<JournalEntry | null> {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Recalculate word count if content is being updated
    if (updates.content) {
      updateData.word_count = updates.content.trim().split(/\s+/).length
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .update(updateData)
      .eq('id', entryId)
      .eq('user_id', userId) // Ensure user can only update their own entries
      .select()
      .single()

    if (error) {
      console.error('Error updating journal entry:', error)
      return null
    }

    return data as JournalEntry
  } catch (error) {
    console.error('Error in updateJournalEntry:', error)
    return null
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(
  entryId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId) // Ensure user can only delete their own entries

    if (error) {
      console.error('Error deleting journal entry:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteJournalEntry:', error)
    return false
  }
}

/**
 * Toggle favorite status of a journal entry
 */
export async function toggleJournalEntryFavorite(
  entryId: string,
  userId: string
): Promise<boolean> {
  try {
    // First get the current favorite status
    const { data: currentEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('is_favorite')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching journal entry for favorite toggle:', fetchError)
      return false
    }

    // Toggle the favorite status
    const { error } = await supabase
      .from('journal_entries')
      .update({
        is_favorite: !currentEntry.is_favorite,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error toggling journal entry favorite:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in toggleJournalEntryFavorite:', error)
    return false
  }
}

/**
 * Search journal entries by content, title, or tags
 */
export async function searchJournalEntries(
  userId: string,
  searchQuery: string,
  options?: {
    limit?: number
    includeContent?: boolean
    includeTags?: boolean
  }
): Promise<JournalEntry[]> {
  try {
    const { includeContent = true, includeTags = true, limit = 50 } = options || {}

    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)

    // Build search conditions
    const searchConditions = []

    // Search in title if it exists
    searchConditions.push(`title.ilike.%${searchQuery}%`)

    // Search in content if enabled
    if (includeContent) {
      searchConditions.push(`content.ilike.%${searchQuery}%`)
    }

    // Search in tags if enabled
    if (includeTags) {
      searchConditions.push(`tags.cs.{${searchQuery}}`)
    }

    // Apply OR conditions for search
    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','))
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Error searching journal entries:', error)
      return []
    }

    return (data as JournalEntry[]) || []
  } catch (error) {
    console.error('Error in searchJournalEntries:', error)
    return []
  }
}

// =============================================================================
// MOOD ENTRY OPERATIONS
// =============================================================================

/**
 * Create a mood entry
 */
export async function createMoodEntry(
  userId: string,
  mood: {
    rating: number
    notes?: string
    journal_entry_id?: string
  }
): Promise<MoodEntry | null> {
  try {
    // Validate input data
    const validationResult = validateMoodEntry(mood)

    if (!validationResult.success) {
      console.error('Mood entry validation failed:', validationResult.error.errors)
      throw new Error(`Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`)
    }
    const { data, error } = await supabase
      .from('mood_entries')
      .insert({
        user_id: userId,
        rating: mood.rating,
        notes: mood.notes,
        journal_entry_id: mood.journal_entry_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating mood entry:', error)

      // Fallback: create a mock entry for development
      const mockEntry: MoodEntry = {
        id: `mock-${Date.now()}`,
        user_id: userId,
        rating: mood.rating,
        notes: mood.notes,
        created_at: new Date().toISOString(),
        journal_entry_id: mood.journal_entry_id
      }

      console.log('Using fallback mood entry:', mockEntry)
      return mockEntry
    }

    return data as MoodEntry
  } catch (error) {
    console.error('Error in createMoodEntry:', error)

    // Fallback: create a mock entry for development
    const mockEntry: MoodEntry = {
      id: `mock-${Date.now()}`,
      user_id: userId,
      rating: mood.rating,
      notes: mood.notes,
      created_at: new Date().toISOString(),
      journal_entry_id: mood.journal_entry_id
    }

    console.log('Using fallback mood entry after catch:', mockEntry)
    return mockEntry
  }
}

/**
 * Get recent mood entries for a user
 */
export async function getRecentMoodEntries(
  userId: string,
  days: number = 30
): Promise<MoodEntry[]> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recent mood entries:', error)
      return []
    }

    return (data as MoodEntry[]) || []
  } catch (error) {
    console.error('Error in getRecentMoodEntries:', error)
    return []
  }
}

/**
 * Get mood entries for a specific date range
 */
export async function getMoodEntriesRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MoodEntry[]> {
  try {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching mood entries range:', error)
      return []
    }

    return (data as MoodEntry[]) || []
  } catch (error) {
    console.error('Error in getMoodEntriesRange:', error)
    return []
  }
}

/**
 * Calculate average mood for a user over a period
 */
export async function getAverageMood(
  userId: string,
  days: number = 7
): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('mood_entries')
      .select('rating')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())

    if (error || !data || data.length === 0) {
      return 5 // Default neutral mood
    }

    const sum = data.reduce((acc, entry) => acc + entry.rating, 0)
    return Math.round((sum / data.length) * 10) / 10 // Round to 1 decimal place
  } catch (error) {
    console.error('Error in getAverageMood:', error)
    return 5
  }
}

// =============================================================================
// JOURNAL ANALYTICS & INSIGHTS
// =============================================================================

/**
 * Get journal writing statistics
 */
export async function getJournalStats(userId: string): Promise<{
  totalEntries: number
  totalWords: number
  averageWordsPerEntry: number
  entriesThisWeek: number
  entriesThisMonth: number
  currentStreak: number
  longestStreak: number
  averageMoodRating: number
  topTags: Array<{ tag: string; count: number }>
}> {
  try {
    // Get all journal entries for the user
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('created_at, word_count, tags, mood_rating')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !entries) {
      return {
        totalEntries: 0,
        totalWords: 0,
        averageWordsPerEntry: 0,
        entriesThisWeek: 0,
        entriesThisMonth: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageMoodRating: 5,
        topTags: []
      }
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Calculate basic stats
    const totalEntries = entries.length
    const totalWords = entries.reduce((sum, entry) => sum + (entry.word_count || 0), 0)
    const averageWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0

    // Count entries by time period
    const entriesThisWeek = entries.filter(entry =>
      new Date(entry.created_at) >= oneWeekAgo
    ).length

    const entriesThisMonth = entries.filter(entry =>
      new Date(entry.created_at) >= oneMonthAgo
    ).length

    // Calculate mood average
    const moodEntries = entries.filter(entry => entry.mood_rating !== null)
    const averageMoodRating = moodEntries.length > 0
      ? Math.round((moodEntries.reduce((sum, entry) => sum + (entry.mood_rating || 0), 0) / moodEntries.length) * 10) / 10
      : 5

    // Calculate streaks (simplified version)
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].created_at)
      entryDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === i) {
        if (i === 0) currentStreak = 1
        else currentStreak++
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

    // Calculate top tags
    const tagCounts: { [tag: string]: number } = {}
    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEntries,
      totalWords,
      averageWordsPerEntry,
      entriesThisWeek,
      entriesThisMonth,
      currentStreak,
      longestStreak,
      averageMoodRating,
      topTags
    }
  } catch (error) {
    console.error('Error in getJournalStats:', error)
    return {
      totalEntries: 0,
      totalWords: 0,
      averageWordsPerEntry: 0,
      entriesThisWeek: 0,
      entriesThisMonth: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageMoodRating: 5,
      topTags: []
    }
  }
}

/**
 * Get journal entries by tag
 */
export async function getJournalEntriesByTag(
  userId: string,
  tag: string
): Promise<JournalEntry[]> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .contains('tags', [tag])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching journal entries by tag:', error)
      return []
    }

    return (data as JournalEntry[]) || []
  } catch (error) {
    console.error('Error in getJournalEntriesByTag:', error)
    return []
  }
}

/**
 * Get all unique tags used by a user
 */
export async function getUserJournalTags(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('tags')
      .eq('user_id', userId)

    if (error || !data) {
      return []
    }

    const allTags = new Set<string>()
    data.forEach((entry) => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    return Array.from(allTags).sort()
  } catch (error) {
    console.error('Error in getUserJournalTags:', error)
    return []
  }
}