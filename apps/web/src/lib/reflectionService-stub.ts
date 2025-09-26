// Enhanced stub for reflection service with localStorage persistence
// TODO: Replace with full PostgreSQL implementation

// Simple localStorage-based storage for reflections
class ReflectionStorage {
  private static REFLECTIONS_KEY = 'pg_user_reflections'

  static getUserReflections(userId: string): Reflection[] {
    try {
      const reflections = localStorage.getItem(`${this.REFLECTIONS_KEY}_${userId}`)
      return reflections ? JSON.parse(reflections) : []
    } catch (error) {
      console.warn('Failed to load reflections from localStorage:', error)
      return []
    }
  }

  static saveUserReflections(userId: string, reflections: Reflection[]): void {
    try {
      localStorage.setItem(`${this.REFLECTIONS_KEY}_${userId}`, JSON.stringify(reflections))
    } catch (error) {
      console.warn('Failed to save reflections to localStorage:', error)
    }
  }

  static addUserReflection(userId: string, reflection: Reflection): void {
    const existingReflections = this.getUserReflections(userId)
    const updatedReflections = [...existingReflections, reflection]
    this.saveUserReflections(userId, updatedReflections)
  }

  static updateUserReflection(userId: string, reflectionId: string, updates: Partial<Reflection>): Reflection | null {
    const existingReflections = this.getUserReflections(userId)
    const reflectionIndex = existingReflections.findIndex(r => r.id === reflectionId)

    if (reflectionIndex === -1) return null

    const updatedReflection = { ...existingReflections[reflectionIndex], ...updates, updated_at: new Date().toISOString() }
    existingReflections[reflectionIndex] = updatedReflection
    this.saveUserReflections(userId, existingReflections)
    return updatedReflection
  }

  static removeUserReflection(userId: string, reflectionId: string): void {
    const existingReflections = this.getUserReflections(userId)
    const updatedReflections = existingReflections.filter(r => r.id !== reflectionId)
    this.saveUserReflections(userId, updatedReflections)
  }
}

export interface Reflection {
  id: string
  user_id: string
  title?: string
  content: string
  source_type: 'journal' | 'chat' | 'habit' | 'mood' | 'manual'
  source_id?: string
  insights?: string[]
  mood_rating?: number // 1-10 scale
  tags: string[]
  created_at: string
  updated_at: string
  is_favorite?: boolean
  reflection_prompts?: string[]
  themes?: string[]
  word_count?: number
}

export interface ReflectionStats {
  total_reflections: number
  favorite_count: number
  average_mood: number
  most_common_tags: string[]
  most_common_themes: string[]
  source_breakdown: Record<string, number>
  recent_insights_count: number
}

export interface ReflectionFilters {
  source_type?: string
  tag?: string
  theme?: string
  date_range?: {
    start: string
    end: string
  }
  mood_range?: {
    min: number
    max: number
  }
  is_favorite?: boolean
}

class ReflectionService {
  // Get user's reflections with optional filtering
  async getUserReflections(
    userId: string,
    filters?: ReflectionFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<Reflection[]> {
    console.log('🔥 [ENHANCED STUB] getUserReflections called for userId:', userId)

    if (typeof window === 'undefined') {
      console.log('Server-side, returning empty array')
      return []
    }

    let reflections = ReflectionStorage.getUserReflections(userId)
    console.log(`Found ${reflections.length} reflections for user`)

    // Apply filters
    if (filters?.source_type) {
      reflections = reflections.filter(r => r.source_type === filters.source_type)
    }
    if (filters?.is_favorite !== undefined) {
      reflections = reflections.filter(r => r.is_favorite === filters.is_favorite)
    }
    if (filters?.date_range) {
      reflections = reflections.filter(r => {
        const createdAt = new Date(r.created_at)
        const start = new Date(filters.date_range!.start)
        const end = new Date(filters.date_range!.end)
        return createdAt >= start && createdAt <= end
      })
    }
    if (filters?.mood_range) {
      reflections = reflections.filter(r =>
        r.mood_rating !== undefined &&
        r.mood_rating >= filters.mood_range!.min &&
        r.mood_rating <= filters.mood_range!.max
      )
    }
    if (filters?.tag) {
      reflections = reflections.filter(r => r.tags.includes(filters.tag!))
    }
    if (filters?.theme) {
      reflections = reflections.filter(r => r.themes?.includes(filters.theme!))
    }

    // Sort by creation date (newest first)
    reflections.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply pagination
    const paginatedReflections = reflections.slice(offset, offset + limit)

    console.log(`Returning ${paginatedReflections.length} filtered reflections`)
    return paginatedReflections
  }

  // Get reflection statistics
  async getReflectionStats(userId: string): Promise<ReflectionStats> {
    console.log('🔥 [ENHANCED STUB] getReflectionStats called for userId:', userId)

    if (typeof window === 'undefined') {
      return this.getMockStats()
    }

    const reflections = ReflectionStorage.getUserReflections(userId)
    console.log(`Calculating stats for ${reflections.length} reflections`)

    return this.calculateStats(reflections)
  }

  // Create a new reflection
  async createReflection(reflection: Omit<Reflection, 'id' | 'created_at' | 'updated_at'>): Promise<Reflection> {
    console.log('🔥 [ENHANCED STUB] createReflection called with:', reflection)

    if (typeof window === 'undefined') {
      console.log('Server-side, cannot create reflection')
      throw new Error('Cannot create reflection on server-side')
    }

    const newReflection: Reflection = {
      ...reflection,
      id: `reflection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      word_count: reflection.content.split(' ').length,
      insights: reflection.insights || this.extractInsights(reflection.content),
      themes: reflection.themes || this.extractThemes(reflection.content)
    }

    // Save to localStorage
    ReflectionStorage.addUserReflection(reflection.user_id, newReflection)

    console.log('✅ [ENHANCED STUB] Created and saved reflection:', newReflection)
    return newReflection
  }

  // Update reflection
  async updateReflection(id: string, updates: Partial<Reflection>): Promise<Reflection> {
    console.log('🔥 [ENHANCED STUB] updateReflection called with:', { id, updates })

    if (typeof window === 'undefined') {
      throw new Error('Cannot update reflection on server-side')
    }

    const updateData = { ...updates }
    if (updates.content) {
      updateData.word_count = updates.content.split(' ').length
    }

    // Find the reflection first to get the user_id
    const allReflections = ReflectionStorage.getUserReflections(updates.user_id || '')
    const existingReflection = allReflections.find(r => r.id === id)

    if (!existingReflection) {
      throw new Error('Reflection not found')
    }

    const updatedReflection = ReflectionStorage.updateUserReflection(existingReflection.user_id, id, updateData)

    if (!updatedReflection) {
      throw new Error('Failed to update reflection')
    }

    console.log('✅ [ENHANCED STUB] Updated reflection:', updatedReflection)
    return updatedReflection
  }

  // Toggle favorite status
  async toggleFavorite(id: string, currentStatus: boolean): Promise<boolean> {
    console.log('🔥 [ENHANCED STUB] toggleFavorite called with:', { id, currentStatus })

    if (typeof window === 'undefined') {
      return !currentStatus // Mock toggle
    }

    // We need to find the reflection across all users to get the user_id
    // In a real implementation, we'd have better indexing
    const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('pg_user_reflections_'))

    for (const key of storageKeys) {
      const userId = key.replace('pg_user_reflections_', '')
      const reflections = ReflectionStorage.getUserReflections(userId)
      const reflection = reflections.find(r => r.id === id)

      if (reflection) {
        const updatedReflection = ReflectionStorage.updateUserReflection(userId, id, {
          is_favorite: !currentStatus
        })
        console.log('✅ [ENHANCED STUB] Toggled favorite status:', !currentStatus)
        return !currentStatus
      }
    }

    throw new Error('Reflection not found')
  }

  // Delete reflection
  async deleteReflection(id: string, userId: string): Promise<void> {
    console.log('🔥 [ENHANCED STUB] deleteReflection called with:', { id, userId })

    if (typeof window === 'undefined') {
      console.log('Server-side, cannot delete reflection')
      return
    }

    ReflectionStorage.removeUserReflection(userId, id)
    console.log('✅ [ENHANCED STUB] Deleted reflection:', id)
  }

  // Generate insights from journal entry
  async generateReflectionFromJournal(journalEntry: any): Promise<Reflection> {
    console.log('🔥 [ENHANCED STUB] generateReflectionFromJournal called')

    const insights = this.extractInsights(journalEntry.content)
    const themes = this.extractThemes(journalEntry.content)

    return await this.createReflection({
      user_id: journalEntry.user_id,
      title: journalEntry.title || undefined,
      content: journalEntry.content,
      source_type: 'journal',
      source_id: journalEntry.id,
      insights,
      themes,
      mood_rating: journalEntry.mood_rating,
      tags: journalEntry.tags || []
    })
  }

  // Generate insights from chat conversation
  async generateReflectionFromChat(chatMessage: any): Promise<Reflection> {
    console.log('🔥 [ENHANCED STUB] generateReflectionFromChat called')

    const insights = this.extractInsights(chatMessage.content)
    const themes = this.extractThemes(chatMessage.content)

    return await this.createReflection({
      user_id: chatMessage.user_id,
      content: chatMessage.content,
      source_type: 'chat',
      source_id: chatMessage.id,
      insights,
      themes,
      tags: this.extractTags(chatMessage.content)
    })
  }

  // Search reflections
  async searchReflections(userId: string, query: string, limit: number = 20): Promise<Reflection[]> {
    console.log('🔥 [ENHANCED STUB] searchReflections called with:', { userId, query, limit })

    if (typeof window === 'undefined') {
      return []
    }

    const reflections = ReflectionStorage.getUserReflections(userId)
    const lowerQuery = query.toLowerCase()

    const matchingReflections = reflections.filter(reflection =>
      reflection.content.toLowerCase().includes(lowerQuery) ||
      reflection.title?.toLowerCase().includes(lowerQuery) ||
      reflection.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      reflection.themes?.some(theme => theme.toLowerCase().includes(lowerQuery))
    ).slice(0, limit)

    console.log(`Found ${matchingReflections.length} matching reflections`)
    return matchingReflections
  }

  // Private helper methods
  private extractInsights(content: string): string[] {
    // Simple keyword-based insight extraction
    const insights = []
    const lowercaseContent = content.toLowerCase()

    if (lowercaseContent.includes('realize') || lowercaseContent.includes('understand')) {
      const sentences = content.split('.').filter(s => s.trim().length > 0)
      const realizationSentences = sentences.filter(s =>
        s.toLowerCase().includes('realize') || s.toLowerCase().includes('understand')
      )
      insights.push(...realizationSentences.map(s => s.trim()).slice(0, 2))
    }

    if (lowercaseContent.includes('feel') || lowercaseContent.includes('emotion')) {
      insights.push('Emotional awareness noted')
    }

    if (lowercaseContent.includes('pattern') || lowercaseContent.includes('habit')) {
      insights.push('Behavioral pattern observed')
    }

    return insights.slice(0, 3) // Limit to 3 insights
  }

  private extractThemes(content: string): string[] {
    const themes = []
    const lowercaseContent = content.toLowerCase()

    const themeKeywords = {
      'self-awareness': ['aware', 'realize', 'understand', 'notice'],
      'mindfulness': ['meditat', 'present', 'mindful', 'breath'],
      'relationships': ['friend', 'family', 'partner', 'relationship'],
      'growth': ['learn', 'grow', 'develop', 'improve'],
      'wellness': ['health', 'exercise', 'sleep', 'energy'],
      'work': ['job', 'career', 'work', 'professional'],
      'creativity': ['create', 'art', 'music', 'write'],
      'spirituality': ['spiritual', 'soul', 'purpose', 'meaning']
    }

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowercaseContent.includes(keyword))) {
        themes.push(theme)
      }
    }

    return themes.slice(0, 3) // Limit to 3 themes
  }

  private extractTags(content: string): string[] {
    // Simple tag extraction based on common words
    const words = content.toLowerCase().split(/\s+/)
    const commonTags = ['growth', 'mindfulness', 'awareness', 'gratitude', 'challenge', 'success', 'learning']

    return commonTags.filter(tag =>
      words.some(word => word.includes(tag.substring(0, 4)))
    ).slice(0, 5)
  }

  private calculateStats(reflections: Reflection[]): ReflectionStats {
    const moodRatings = reflections.filter(r => r.mood_rating).map(r => r.mood_rating!)
    const allTags = reflections.flatMap(r => r.tags)
    const allThemes = reflections.flatMap(r => r.themes || [])

    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const themeCounts = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sourceCounts = reflections.reduce((acc, reflection) => {
      acc[reflection.source_type] = (acc[reflection.source_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentInsights = reflections.filter(r =>
      r.insights && r.insights.length > 0 &&
      new Date(r.created_at) > oneWeekAgo
    )

    return {
      total_reflections: reflections.length,
      favorite_count: reflections.filter(r => r.is_favorite).length,
      average_mood: moodRatings.length > 0 ?
        Math.round((moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length) * 10) / 10 : 0,
      most_common_tags: Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag),
      most_common_themes: Object.entries(themeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([theme]) => theme),
      source_breakdown: sourceCounts,
      recent_insights_count: recentInsights.length
    }
  }

  private getMockStats(): ReflectionStats {
    return {
      total_reflections: 0,
      favorite_count: 0,
      average_mood: 0,
      most_common_tags: [],
      most_common_themes: [],
      source_breakdown: {},
      recent_insights_count: 0
    }
  }
}

// Export singleton instance
export const reflectionService = new ReflectionService()

// Helper functions for easy import
export async function getUserReflections(userId: string, filters?: ReflectionFilters) {
  return reflectionService.getUserReflections(userId, filters)
}

export async function getReflectionStats(userId: string) {
  return reflectionService.getReflectionStats(userId)
}

export async function createReflection(reflection: Omit<Reflection, 'id' | 'created_at' | 'updated_at'>) {
  return reflectionService.createReflection(reflection)
}

export async function updateReflection(id: string, updates: Partial<Reflection>) {
  return reflectionService.updateReflection(id, updates)
}

export async function toggleReflectionFavorite(id: string, currentStatus: boolean) {
  return reflectionService.toggleFavorite(id, currentStatus)
}

export async function deleteReflection(id: string, userId: string) {
  return reflectionService.deleteReflection(id, userId)
}

export async function searchReflections(userId: string, query: string) {
  return reflectionService.searchReflections(userId, query)
}

export async function generateReflectionFromJournal(journalEntry: any) {
  return reflectionService.generateReflectionFromJournal(journalEntry)
}

export async function generateReflectionFromChat(chatMessage: any) {
  return reflectionService.generateReflectionFromChat(chatMessage)
}