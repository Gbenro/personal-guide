// Enhanced stub for journal service with localStorage persistence
// TODO: Replace with full PostgreSQL implementation

import type { JournalEntry, MoodEntry } from '@/stores/personalGuideStore'
import { validateJournalEntry, validateMoodEntry, type JournalEntryInput, type MoodEntryInput } from './validationSchemas'

// localStorage-based storage for journal entries and mood entries
class JournalStorage {
  private static JOURNAL_ENTRIES_KEY = 'pg_journal_entries'
  private static MOOD_ENTRIES_KEY = 'pg_mood_entries'

  static getJournalEntries(userId: string): JournalEntry[] {
    try {
      const entries = localStorage.getItem(`${this.JOURNAL_ENTRIES_KEY}_${userId}`)
      return entries ? JSON.parse(entries) : []
    } catch (error) {
      console.warn('Failed to load journal entries from localStorage:', error)
      return []
    }
  }

  static saveJournalEntries(userId: string, entries: JournalEntry[]): void {
    try {
      localStorage.setItem(`${this.JOURNAL_ENTRIES_KEY}_${userId}`, JSON.stringify(entries))
    } catch (error) {
      console.warn('Failed to save journal entries to localStorage:', error)
    }
  }

  static addJournalEntry(userId: string, entry: JournalEntry): void {
    const existing = this.getJournalEntries(userId)
    const updated = [entry, ...existing] // Add to beginning for reverse chronological order
    this.saveJournalEntries(userId, updated)
  }

  static updateJournalEntry(userId: string, entryId: string, updates: Partial<JournalEntry>): JournalEntry | null {
    const entries = this.getJournalEntries(userId)
    const index = entries.findIndex(e => e.id === entryId)
    if (index === -1) return null

    entries[index] = { ...entries[index], ...updates, updated_at: new Date().toISOString() }
    this.saveJournalEntries(userId, entries)
    return entries[index]
  }

  static deleteJournalEntry(userId: string, entryId: string): boolean {
    const entries = this.getJournalEntries(userId)
    const updated = entries.filter(e => e.id !== entryId)
    this.saveJournalEntries(userId, updated)
    return entries.length !== updated.length
  }

  static getMoodEntries(userId: string): MoodEntry[] {
    try {
      const entries = localStorage.getItem(`${this.MOOD_ENTRIES_KEY}_${userId}`)
      return entries ? JSON.parse(entries) : []
    } catch (error) {
      console.warn('Failed to load mood entries from localStorage:', error)
      return []
    }
  }

  static saveMoodEntries(userId: string, entries: MoodEntry[]): void {
    try {
      localStorage.setItem(`${this.MOOD_ENTRIES_KEY}_${userId}`, JSON.stringify(entries))
    } catch (error) {
      console.warn('Failed to save mood entries to localStorage:', error)
    }
  }

  static addMoodEntry(userId: string, entry: MoodEntry): void {
    const existing = this.getMoodEntries(userId)
    const updated = [entry, ...existing]
    this.saveMoodEntries(userId, updated)
  }
}

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
  console.log('🔥 [ENHANCED STUB] getUserJournalEntries called for userId:', userId)

  if (typeof window === 'undefined') {
    return []
  }

  let entries = JournalStorage.getJournalEntries(userId)
  console.log(`Found ${entries.length} journal entries for user`)

  // Apply date range filter if provided
  if (options?.dateRange) {
    const startDate = new Date(options.dateRange.start)
    const endDate = new Date(options.dateRange.end)
    entries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= startDate && entryDate <= endDate
    })
  }

  // Apply sorting
  const sortBy = options?.sortBy || 'created_at'
  const sortOrder = options?.sortOrder || 'desc'
  entries.sort((a, b) => {
    const aValue = a[sortBy as keyof JournalEntry] as string | number
    const bValue = b[sortBy as keyof JournalEntry] as string | number

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Apply pagination
  if (options?.offset) {
    const start = options.offset
    const end = start + (options.limit || 50)
    entries = entries.slice(start, end)
  } else if (options?.limit) {
    entries = entries.slice(0, options.limit)
  }

  return entries
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
  console.log('🔥 [ENHANCED STUB] createJournalEntry called with:', { userId, title: entry.title, contentLength: entry.content.length })

  if (typeof window === 'undefined') {
    throw new Error('Cannot create journal entry on server-side')
  }

  try {
    // Validate input data
    const validationResult = validateJournalEntry(entry)

    if (!validationResult.success) {
      console.error('Journal entry validation failed:', validationResult.error.errors)
      throw new Error(`Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`)
    }

    // Calculate word count
    const wordCount = entry.content.trim().split(/\s+/).length

    // Create new journal entry
    const newEntry: JournalEntry = {
      id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      title: entry.title,
      content: entry.content,
      mood_rating: entry.mood_rating,
      tags: entry.tags || [],
      word_count: wordCount,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save to localStorage
    JournalStorage.addJournalEntry(userId, newEntry)

    console.log('✅ [ENHANCED STUB] Created and saved journal entry:', newEntry.id)
    return newEntry
  } catch (error) {
    console.error('Error in createJournalEntry:', error)
    throw error
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
  console.log('🔥 [ENHANCED STUB] updateJournalEntry called with:', { entryId, userId, updates })

  if (typeof window === 'undefined') {
    throw new Error('Cannot update journal entry on server-side')
  }

  try {
    const updateData: any = { ...updates }

    // Recalculate word count if content is being updated
    if (updates.content) {
      updateData.word_count = updates.content.trim().split(/\s+/).length
    }

    const updatedEntry = JournalStorage.updateJournalEntry(userId, entryId, updateData)

    if (!updatedEntry) {
      console.error('Journal entry not found:', entryId)
      return null
    }

    console.log('✅ [ENHANCED STUB] Updated journal entry:', updatedEntry.id)
    return updatedEntry
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
  console.log('🔥 [ENHANCED STUB] deleteJournalEntry called with:', { entryId, userId })

  if (typeof window === 'undefined') {
    return false
  }

  try {
    const deleted = JournalStorage.deleteJournalEntry(userId, entryId)
    console.log(`${deleted ? '✅' : '❌'} [ENHANCED STUB] Delete journal entry result:`, deleted)
    return deleted
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
  console.log('🔥 [ENHANCED STUB] toggleJournalEntryFavorite called with:', { entryId, userId })

  if (typeof window === 'undefined') {
    return false
  }

  try {
    const entries = JournalStorage.getJournalEntries(userId)
    const entry = entries.find(e => e.id === entryId)

    if (!entry) {
      console.error('Journal entry not found for favorite toggle:', entryId)
      return false
    }

    const updatedEntry = JournalStorage.updateJournalEntry(userId, entryId, {
      is_favorite: !entry.is_favorite
    })

    console.log('✅ [ENHANCED STUB] Toggled favorite status:', updatedEntry?.is_favorite)
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
  console.log('🔥 [ENHANCED STUB] searchJournalEntries called with:', { userId, searchQuery, options })

  if (typeof window === 'undefined') {
    return []
  }

  const { includeContent = true, includeTags = true, limit = 50 } = options || {}
  const entries = JournalStorage.getJournalEntries(userId)
  const searchLower = searchQuery.toLowerCase()

  const filteredEntries = entries.filter(entry => {
    // Search in title
    if (entry.title && entry.title.toLowerCase().includes(searchLower)) {
      return true
    }

    // Search in content if enabled
    if (includeContent && entry.content.toLowerCase().includes(searchLower)) {
      return true
    }

    // Search in tags if enabled
    if (includeTags && entry.tags) {
      return entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
    }

    return false
  })

  const results = filteredEntries.slice(0, limit)
  console.log(`Found ${results.length} entries matching search query`)
  return results
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
  console.log('🔥 [ENHANCED STUB] createMoodEntry called with:', { userId, mood })

  if (typeof window === 'undefined') {
    throw new Error('Cannot create mood entry on server-side')
  }

  try {
    // Validate input data
    const validationResult = validateMoodEntry(mood)

    if (!validationResult.success) {
      console.error('Mood entry validation failed:', validationResult.error.errors)
      throw new Error(`Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`)
    }

    const newMoodEntry: MoodEntry = {
      id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      rating: mood.rating,
      notes: mood.notes,
      journal_entry_id: mood.journal_entry_id,
      created_at: new Date().toISOString()
    }

    // Save to localStorage
    JournalStorage.addMoodEntry(userId, newMoodEntry)

    console.log('✅ [ENHANCED STUB] Created and saved mood entry:', newMoodEntry.id)
    return newMoodEntry
  } catch (error) {
    console.error('Error in createMoodEntry:', error)
    throw error
  }
}

/**
 * Get recent mood entries for a user
 */
export async function getRecentMoodEntries(
  userId: string,
  days: number = 30
): Promise<MoodEntry[]> {
  console.log('🔥 [ENHANCED STUB] getRecentMoodEntries called for userId:', userId, 'days:', days)

  if (typeof window === 'undefined') {
    return []
  }

  const entries = JournalStorage.getMoodEntries(userId)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const recentEntries = entries.filter(entry =>
    new Date(entry.created_at) >= cutoffDate
  )

  console.log(`Found ${recentEntries.length} recent mood entries`)
  return recentEntries
}

/**
 * Get mood entries for a specific date range
 */
export async function getMoodEntriesRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MoodEntry[]> {
  console.log('🔥 [ENHANCED STUB] getMoodEntriesRange called with:', { userId, startDate, endDate })

  if (typeof window === 'undefined') {
    return []
  }

  const entries = JournalStorage.getMoodEntries(userId)

  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.created_at)
    return entryDate >= startDate && entryDate <= endDate
  })

  console.log(`Found ${filteredEntries.length} mood entries in date range`)
  return filteredEntries
}

/**
 * Calculate average mood for a user over a period
 */
export async function getAverageMood(
  userId: string,
  days: number = 7
): Promise<number> {
  console.log('🔥 [ENHANCED STUB] getAverageMood called for userId:', userId, 'days:', days)

  if (typeof window === 'undefined') {
    return 5
  }

  const recentEntries = await getRecentMoodEntries(userId, days)

  if (recentEntries.length === 0) {
    return 5 // Default neutral mood
  }

  const sum = recentEntries.reduce((acc, entry) => acc + entry.rating, 0)
  const average = Math.round((sum / recentEntries.length) * 10) / 10

  console.log(`Calculated average mood: ${average} from ${recentEntries.length} entries`)
  return average
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
  console.log('🔥 [ENHANCED STUB] getJournalStats called for userId:', userId)

  if (typeof window === 'undefined') {
    return this.getEmptyJournalStats()
  }

  const entries = JournalStorage.getJournalEntries(userId)
  console.log(`Calculating journal stats for ${entries.length} entries`)

  if (entries.length === 0) {
    return this.getEmptyJournalStats()
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
  const moodEntries = entries.filter(entry => entry.mood_rating !== null && entry.mood_rating !== undefined)
  const averageMoodRating = moodEntries.length > 0
    ? Math.round((moodEntries.reduce((sum, entry) => sum + (entry.mood_rating || 0), 0) / moodEntries.length) * 10) / 10
    : 5

  // Calculate streaks (simplified version)
  let currentStreak = 0
  let longestStreak = 0

  // Sort entries by date for streak calculation
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Calculate current streak
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].created_at)
    entryDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)

    if (entryDate.getTime() === expectedDate.getTime()) {
      currentStreak++
    } else {
      break
    }
  }

  // Calculate longest streak (simplified - would need more complex logic for perfect accuracy)
  longestStreak = Math.max(currentStreak, Math.ceil(totalEntries / 7)) // Rough estimate

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

  const stats = {
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

  console.log('✅ [ENHANCED STUB] Calculated journal stats:', stats)
  return stats
}

/**
 * Get journal entries by tag
 */
export async function getJournalEntriesByTag(
  userId: string,
  tag: string
): Promise<JournalEntry[]> {
  console.log('🔥 [ENHANCED STUB] getJournalEntriesByTag called with:', { userId, tag })

  if (typeof window === 'undefined') {
    return []
  }

  const entries = JournalStorage.getJournalEntries(userId)
  const taggedEntries = entries.filter(entry =>
    entry.tags && entry.tags.includes(tag)
  )

  console.log(`Found ${taggedEntries.length} entries with tag "${tag}"`)
  return taggedEntries
}

/**
 * Get all unique tags used by a user
 */
export async function getUserJournalTags(userId: string): Promise<string[]> {
  console.log('🔥 [ENHANCED STUB] getUserJournalTags called for userId:', userId)

  if (typeof window === 'undefined') {
    return []
  }

  const entries = JournalStorage.getJournalEntries(userId)
  const allTags = new Set<string>()

  entries.forEach((entry) => {
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach((tag: string) => allTags.add(tag))
    }
  })

  const uniqueTags = Array.from(allTags).sort()
  console.log(`Found ${uniqueTags.length} unique tags`)
  return uniqueTags
}

// Helper function for empty stats
function getEmptyJournalStats() {
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