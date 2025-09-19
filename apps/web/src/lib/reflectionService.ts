// Reflection Service for Personal Guide
// Handles reflection data management and insights generation

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
  private supabase: any // Will be injected when Supabase is available

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient
  }

  // Get user's reflections with optional filtering
  async getUserReflections(
    userId: string,
    filters?: ReflectionFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<Reflection[]> {
    if (!this.supabase) {
      // Return mock data for now
      return this.getMockReflections(userId)
    }

    try {
      let query = this.supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (filters?.source_type) {
        query = query.eq('source_type', filters.source_type)
      }
      if (filters?.is_favorite !== undefined) {
        query = query.eq('is_favorite', filters.is_favorite)
      }
      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end)
      }
      if (filters?.mood_range) {
        query = query
          .gte('mood_rating', filters.mood_range.min)
          .lte('mood_rating', filters.mood_range.max)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching reflections:', error)
      throw error
    }
  }

  // Get reflection statistics
  async getReflectionStats(userId: string): Promise<ReflectionStats> {
    if (!this.supabase) {
      return this.getMockStats()
    }

    try {
      const { data: reflections, error } = await this.supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      return this.calculateStats(reflections || [])
    } catch (error) {
      console.error('Error fetching reflection stats:', error)
      throw error
    }
  }

  // Create a new reflection
  async createReflection(reflection: Omit<Reflection, 'id' | 'created_at' | 'updated_at'>): Promise<Reflection> {
    if (!this.supabase) {
      // Mock implementation
      const newReflection: Reflection = {
        ...reflection,
        id: `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        word_count: reflection.content.split(' ').length
      }
      return newReflection
    }

    try {
      const reflectionData = {
        ...reflection,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        word_count: reflection.content.split(' ').length
      }

      const { data, error } = await this.supabase
        .from('reflections')
        .insert([reflectionData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating reflection:', error)
      throw error
    }
  }

  // Update reflection
  async updateReflection(id: string, updates: Partial<Reflection>): Promise<Reflection> {
    if (!this.supabase) {
      throw new Error('Supabase not available for updates')
    }

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      if (updates.content) {
        updateData.word_count = updates.content.split(' ').length
      }

      const { data, error } = await this.supabase
        .from('reflections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating reflection:', error)
      throw error
    }
  }

  // Toggle favorite status
  async toggleFavorite(id: string, currentStatus: boolean): Promise<boolean> {
    if (!this.supabase) {
      return !currentStatus // Mock toggle
    }

    try {
      const { data, error } = await this.supabase
        .from('reflections')
        .update({
          is_favorite: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('is_favorite')
        .single()

      if (error) throw error
      return data.is_favorite
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  // Delete reflection
  async deleteReflection(id: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase not available for deletion')
    }

    try {
      const { error } = await this.supabase
        .from('reflections')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting reflection:', error)
      throw error
    }
  }

  // Generate insights from journal entry
  async generateReflectionFromJournal(journalEntry: any): Promise<Reflection> {
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
    if (!this.supabase) {
      // Mock search
      const mockData = this.getMockReflections(userId)
      const lowerQuery = query.toLowerCase()
      return mockData.filter(reflection =>
        reflection.content.toLowerCase().includes(lowerQuery) ||
        reflection.title?.toLowerCase().includes(lowerQuery) ||
        reflection.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ).slice(0, limit)
    }

    try {
      const { data, error } = await this.supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .or(`content.ilike.%${query}%,title.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching reflections:', error)
      throw error
    }
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

    return {
      total_reflections: reflections.length,
      favorite_count: reflections.filter(r => r.is_favorite).length,
      average_mood: moodRatings.length > 0 ?
        moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length : 0,
      most_common_tags: Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag),
      most_common_themes: Object.entries(themeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([theme]) => theme),
      source_breakdown: sourceCounts,
      recent_insights_count: reflections.filter(r =>
        r.insights && r.insights.length > 0 &&
        new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }
  }

  private getMockReflections(userId: string): Reflection[] {
    return [
      {
        id: '1',
        user_id: userId,
        title: 'Morning Meditation Insights',
        content: 'Today\'s meditation brought clarity about my priorities. I noticed how my mind keeps jumping to work tasks even in quiet moments. This awareness itself is progress - recognizing the pattern is the first step to changing it.',
        source_type: 'journal',
        insights: [
          'Mind tends to default to work thoughts during quiet time',
          'Awareness of mental patterns is developing',
          'Meditation helping with priority clarity'
        ],
        mood_rating: 7,
        tags: ['meditation', 'awareness', 'work-life-balance'],
        themes: ['mindfulness', 'self-awareness'],
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        is_favorite: true,
        word_count: 42
      },
      {
        id: '2',
        user_id: userId,
        content: 'Had an interesting conversation with the AI about goal setting. Realized I\'ve been setting goals based on what I think I should want rather than what I actually want. This disconnect might explain why I struggle with motivation.',
        source_type: 'chat',
        insights: [
          'Goals misaligned with authentic desires',
          'External expectations influencing goal setting',
          'Need to reconnect with personal values'
        ],
        mood_rating: 6,
        tags: ['goals', 'self-discovery', 'motivation'],
        themes: ['authenticity', 'self-awareness'],
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        is_favorite: false,
        word_count: 38
      },
      {
        id: '3',
        user_id: userId,
        title: 'Exercise Habit Breakthrough',
        content: 'After 10 days of consistent exercise, I\'m noticing significant changes not just physically but mentally. My mood is more stable, I\'m sleeping better, and I have more energy throughout the day. The compound effect of small daily actions is becoming evident.',
        source_type: 'habit',
        insights: [
          'Consistent exercise improving overall well-being',
          'Physical habits impact mental state significantly',
          'Small daily actions create compound benefits'
        ],
        mood_rating: 8,
        tags: ['exercise', 'habits', 'well-being'],
        themes: ['wellness', 'growth'],
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        is_favorite: true,
        word_count: 45
      }
    ]
  }

  private getMockStats(): ReflectionStats {
    return {
      total_reflections: 3,
      favorite_count: 2,
      average_mood: 7.0,
      most_common_tags: ['meditation', 'awareness', 'goals', 'exercise', 'habits'],
      most_common_themes: ['self-awareness', 'mindfulness', 'wellness', 'growth'],
      source_breakdown: {
        journal: 1,
        chat: 1,
        habit: 1
      },
      recent_insights_count: 3
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

export async function toggleReflectionFavorite(id: string, currentStatus: boolean) {
  return reflectionService.toggleFavorite(id, currentStatus)
}

export async function searchReflections(userId: string, query: string) {
  return reflectionService.searchReflections(userId, query)
}