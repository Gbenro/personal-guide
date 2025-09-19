import { supabase } from '@/lib/supabase'
import { SynchronicityEntry, SynchronicityPattern, SynchronicityStats } from '@/types/spiritual'
import { SynchronicityPatternService } from './synchronicityPatternService'
import { SynchronicityStatsService } from './synchronicityStatsService'
import { SynchronicityCorrelationService } from './synchronicityCorrelationService'

/**
 * Main service for synchronicity tracking functionality
 * Provides a unified interface for all synchronicity-related operations
 */
export class SynchronicityService {
  private patternService: SynchronicityPatternService
  private statsService: SynchronicityStatsService
  private correlationService: SynchronicityCorrelationService

  constructor(private userId: string) {
    this.patternService = new SynchronicityPatternService(userId)
    this.statsService = new SynchronicityStatsService(userId)
    this.correlationService = new SynchronicityCorrelationService(userId)
  }

  // Entry Management Methods

  /**
   * Create a new synchronicity entry
   */
  async createEntry(entryData: Omit<SynchronicityEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<SynchronicityEntry> {
    try {
      const { data: entry, error } = await supabase
        .from('synchronicity_entries')
        .insert({
          user_id: this.userId,
          title: entryData.title,
          description: entryData.description,
          date: entryData.date.toISOString().split('T')[0],
          tags: entryData.tags,
          significance: entryData.significance,
          context: entryData.context,
          emotions: entryData.emotions,
          patterns: entryData.patterns || []
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create synchronicity entry: ${error.message}`)
      }

      // After creating an entry, trigger pattern discovery if we have enough entries
      this.triggerPatternDiscoveryIfNeeded()

      return this.formatEntry(entry)

    } catch (error) {
      console.error('Error creating synchronicity entry:', error)
      throw error
    }
  }

  /**
   * Get entries with filtering and pagination
   */
  async getEntries(filters: {
    limit?: number
    offset?: number
    tags?: string[]
    minSignificance?: number
    maxSignificance?: number
    startDate?: Date
    endDate?: Date
    search?: string
  } = {}): Promise<{ entries: SynchronicityEntry[]; total: number; hasMore: boolean }> {
    try {
      const {
        limit = 50,
        offset = 0,
        tags = [],
        minSignificance = 1,
        maxSignificance = 10,
        startDate,
        endDate,
        search
      } = filters

      let query = supabase
        .from('synchronicity_entries')
        .select('*')
        .eq('user_id', this.userId)
        .gte('significance', minSignificance)
        .lte('significance', maxSignificance)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply filters
      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0])
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }
      if (tags.length > 0) {
        query = query.overlaps('tags', tags)
      }

      // Get paginated results
      const { data: entries, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        throw new Error(`Failed to fetch entries: ${error.message}`)
      }

      // Get total count
      let countQuery = supabase
        .from('synchronicity_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .gte('significance', minSignificance)
        .lte('significance', maxSignificance)

      if (startDate) countQuery = countQuery.gte('date', startDate.toISOString().split('T')[0])
      if (endDate) countQuery = countQuery.lte('date', endDate.toISOString().split('T')[0])
      if (search) countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      if (tags.length > 0) countQuery = countQuery.overlaps('tags', tags)

      const { count, error: countError } = await countQuery

      if (countError) {
        console.error('Error counting entries:', countError)
      }

      return {
        entries: (entries || []).map(this.formatEntry),
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }

    } catch (error) {
      console.error('Error fetching synchronicity entries:', error)
      throw error
    }
  }

  /**
   * Get a single entry by ID
   */
  async getEntry(entryId: string): Promise<SynchronicityEntry | null> {
    try {
      const { data: entry, error } = await supabase
        .from('synchronicity_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', this.userId)
        .single()

      if (error || !entry) {
        return null
      }

      return this.formatEntry(entry)

    } catch (error) {
      console.error('Error fetching synchronicity entry:', error)
      throw error
    }
  }

  /**
   * Update an existing entry
   */
  async updateEntry(entryId: string, updates: Partial<SynchronicityEntry>): Promise<SynchronicityEntry> {
    try {
      const updateData: any = {}

      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0]
      if (updates.tags !== undefined) updateData.tags = updates.tags
      if (updates.significance !== undefined) updateData.significance = updates.significance
      if (updates.context !== undefined) updateData.context = updates.context
      if (updates.emotions !== undefined) updateData.emotions = updates.emotions
      if (updates.patterns !== undefined) updateData.patterns = updates.patterns

      updateData.updated_at = new Date().toISOString()

      const { data: entry, error } = await supabase
        .from('synchronicity_entries')
        .update(updateData)
        .eq('id', entryId)
        .eq('user_id', this.userId)
        .select()
        .single()

      if (error || !entry) {
        throw new Error(`Failed to update entry: ${error?.message || 'Entry not found'}`)
      }

      return this.formatEntry(entry)

    } catch (error) {
      console.error('Error updating synchronicity entry:', error)
      throw error
    }
  }

  /**
   * Delete an entry
   */
  async deleteEntry(entryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('synchronicity_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', this.userId)

      if (error) {
        throw new Error(`Failed to delete entry: ${error.message}`)
      }

      return true

    } catch (error) {
      console.error('Error deleting synchronicity entry:', error)
      throw error
    }
  }

  // Pattern Management Methods

  /**
   * Discover patterns in user's entries
   */
  async discoverPatterns(): Promise<SynchronicityPattern[]> {
    return this.patternService.discoverPatterns()
  }

  /**
   * Get user's patterns
   */
  async getPatterns(filters: {
    limit?: number
    offset?: number
    minSignificance?: number
    minFrequency?: number
  } = {}): Promise<{ patterns: SynchronicityPattern[]; total: number; hasMore: boolean }> {
    try {
      const { limit = 20, offset = 0, minSignificance = 1, minFrequency = 1 } = filters

      const { data: patterns, error } = await supabase
        .from('synchronicity_patterns')
        .select('*')
        .eq('user_id', this.userId)
        .gte('significance', minSignificance)
        .gte('frequency', minFrequency)
        .order('discovered_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new Error(`Failed to fetch patterns: ${error.message}`)
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from('synchronicity_patterns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .gte('significance', minSignificance)
        .gte('frequency', minFrequency)

      if (countError) {
        console.error('Error counting patterns:', countError)
      }

      return {
        patterns: (patterns || []).map(this.formatPattern),
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }

    } catch (error) {
      console.error('Error fetching patterns:', error)
      throw error
    }
  }

  // Statistics and Analytics Methods

  /**
   * Get comprehensive statistics
   */
  async getStats(timeframe?: 'week' | 'month' | 'year' | 'all'): Promise<SynchronicityStats & { additionalMetrics: any }> {
    let startDate: Date | undefined

    if (timeframe) {
      const now = new Date()
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }
    }

    return this.statsService.getBasicStats(startDate)
  }

  /**
   * Get correlation analysis
   */
  async getCorrelations(analysisType: 'all' | 'tags' | 'emotions' | 'temporal' | 'significance' = 'all') {
    switch (analysisType) {
      case 'tags':
        return { tagCorrelations: await this.correlationService.analyzeTagCorrelations() }
      case 'emotions':
        return { emotionCorrelations: await this.correlationService.analyzeEmotionCorrelations() }
      case 'temporal':
        return { temporalPatterns: await this.correlationService.analyzeTemporalPatterns() }
      case 'significance':
        return { significancePatterns: await this.correlationService.analyzeSignificancePatterns() }
      case 'all':
      default:
        const [tagCorrelations, emotionCorrelations, temporalPatterns, significancePatterns] = await Promise.all([
          this.correlationService.analyzeTagCorrelations(),
          this.correlationService.analyzeEmotionCorrelations(),
          this.correlationService.analyzeTemporalPatterns(),
          this.correlationService.analyzeSignificancePatterns()
        ])
        return { tagCorrelations, emotionCorrelations, temporalPatterns, significancePatterns }
    }
  }

  /**
   * Get insights based on patterns and correlations
   */
  async getInsights(): Promise<{
    patterns: any[]
    correlations: any[]
    recommendations: string[]
    trends: any
  }> {
    try {
      // Get recent patterns
      const { patterns } = await this.getPatterns({ limit: 5 })

      // Get recent correlations
      const correlations = await this.getCorrelations('all')

      // Generate recommendations based on data
      const recommendations = await this.generateRecommendations(patterns, correlations)

      // Get trend analysis
      const stats = await this.getStats()
      const trends = stats.additionalMetrics.trends

      return {
        patterns,
        correlations: [
          ...(correlations.tagCorrelations || []).slice(0, 3),
          ...(correlations.emotionCorrelations || []).slice(0, 3)
        ],
        recommendations,
        trends
      }

    } catch (error) {
      console.error('Error generating insights:', error)
      throw error
    }
  }

  // Utility Methods

  /**
   * Format database entry to typed interface
   */
  private formatEntry(entry: any): SynchronicityEntry {
    return {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      date: new Date(entry.date),
      tags: entry.tags || [],
      significance: entry.significance,
      context: entry.context,
      emotions: entry.emotions || [],
      patterns: entry.patterns || [],
      createdAt: new Date(entry.created_at),
      updatedAt: new Date(entry.updated_at)
    }
  }

  /**
   * Format database pattern to typed interface
   */
  private formatPattern(pattern: any): SynchronicityPattern {
    return {
      id: pattern.id,
      name: pattern.name,
      description: pattern.description,
      entries: pattern.entry_ids || [],
      frequency: pattern.frequency,
      discoveredAt: new Date(pattern.discovered_at || pattern.created_at),
      significance: pattern.significance
    }
  }

  /**
   * Trigger pattern discovery if user has enough entries
   */
  private async triggerPatternDiscoveryIfNeeded() {
    try {
      const { count } = await supabase
        .from('synchronicity_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)

      // Trigger pattern discovery every 5 new entries
      if (count && count > 0 && count % 5 === 0) {
        // Run discovery in background (don't await)
        this.patternService.discoverPatterns().catch(error =>
          console.error('Background pattern discovery failed:', error)
        )
      }
    } catch (error) {
      console.error('Error checking for pattern discovery trigger:', error)
    }
  }

  /**
   * Generate personalized recommendations
   */
  private async generateRecommendations(patterns: SynchronicityPattern[], correlations: any): Promise<string[]> {
    const recommendations: string[] = []

    // Pattern-based recommendations
    if (patterns.length > 0) {
      const highSignificancePatterns = patterns.filter(p => p.significance >= 7)
      if (highSignificancePatterns.length > 0) {
        recommendations.push(
          `You have ${highSignificancePatterns.length} high-significance patterns. Pay attention to these recurring themes in your synchronicities.`
        )
      }
    }

    // Tag correlation recommendations
    if (correlations.tagCorrelations && correlations.tagCorrelations.length > 0) {
      const strongCorrelation = correlations.tagCorrelations[0]
      if (strongCorrelation.confidence > 0.7) {
        recommendations.push(
          `Strong connection detected between "${strongCorrelation.tag1}" and "${strongCorrelation.tag2}" themes. Consider exploring this relationship deeper.`
        )
      }
    }

    // Temporal pattern recommendations
    if (correlations.temporalPatterns && correlations.temporalPatterns.length > 0) {
      const strongTemporalPattern = correlations.temporalPatterns.find(p => p.confidence > 0.3)
      if (strongTemporalPattern) {
        recommendations.push(
          `You tend to experience synchronicities more frequently on ${strongTemporalPattern.pattern}. Consider being more mindful during these times.`
        )
      }
    }

    // Default recommendations if no patterns found
    if (recommendations.length === 0) {
      recommendations.push(
        "Continue documenting your synchronicities to discover meaningful patterns.",
        "Pay attention to recurring themes, emotions, and timing of your experiences.",
        "Consider the significance levels of your synchronicities to identify what resonates most with you."
      )
    }

    return recommendations
  }

  /**
   * Export user's synchronicity data
   */
  async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { entries } = await this.getEntries({ limit: 1000 })
      const { patterns } = await this.getPatterns({ limit: 100 })

      const exportData = {
        entries,
        patterns,
        exportedAt: new Date().toISOString(),
        userId: this.userId
      }

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2)
      } else {
        // Convert to CSV format
        let csv = 'Date,Title,Description,Significance,Context,Tags,Emotions\n'
        entries.forEach(entry => {
          const row = [
            entry.date.toISOString().split('T')[0],
            `"${entry.title.replace(/"/g, '""')}"`,
            `"${entry.description.replace(/"/g, '""')}"`,
            entry.significance,
            `"${entry.context.replace(/"/g, '""')}"`,
            `"${entry.tags.join(', ')}"`,
            `"${entry.emotions.join(', ')}"`,
          ]
          csv += row.join(',') + '\n'
        })
        return csv
      }

    } catch (error) {
      console.error('Error exporting synchronicity data:', error)
      throw error
    }
  }
}