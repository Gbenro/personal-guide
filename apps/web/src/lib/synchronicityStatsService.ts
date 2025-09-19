import { supabase } from '@/lib/supabase'
import { SynchronicityStats } from '@/types/spiritual'

export class SynchronicityStatsService {
  constructor(private userId: string) {}

  /**
   * Get basic synchronicity statistics for the user
   */
  async getBasicStats(startDate?: Date): Promise<SynchronicityStats & { additionalMetrics: any }> {
    try {
      // Build date filter if provided
      let dateFilter = ''
      if (startDate) {
        dateFilter = ` AND date >= '${startDate.toISOString().split('T')[0]}'`
      }

      // Get entry statistics
      const { data: entries, error: entriesError } = await supabase
        .from('synchronicity_entries')
        .select('*')
        .eq('user_id', this.userId)
        .gte(startDate ? 'date' : undefined, startDate ? startDate.toISOString().split('T')[0] : undefined)

      if (entriesError) {
        throw new Error('Failed to fetch synchronicity entries')
      }

      const totalEntries = entries?.length || 0

      // Calculate basic metrics
      const significanceValues = entries?.map(e => e.significance).filter(s => s != null) || []
      const averageSignificance = significanceValues.length > 0
        ? significanceValues.reduce((sum, val) => sum + val, 0) / significanceValues.length
        : 0

      // Get all unique tags and their frequencies
      const allTags = entries?.flatMap(e => e.tags || []) || []
      const tagFrequency: Record<string, number> = {}
      allTags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
      })

      const mostCommonTags = Object.entries(tagFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag)

      // Get pattern count
      const { data: patterns, error: patternsError } = await supabase
        .from('synchronicity_patterns')
        .select('id')
        .eq('user_id', this.userId)

      if (patternsError) {
        console.error('Error fetching patterns:', patternsError)
      }

      const patternsDiscovered = patterns?.length || 0

      // Calculate streak (consecutive days with entries)
      const streak = this.calculateStreak(entries || [])

      // Calculate additional metrics
      const additionalMetrics = await this.calculateAdditionalMetrics(entries || [])

      return {
        totalEntries,
        averageSignificance: Number(averageSignificance.toFixed(1)),
        mostCommonTags,
        patternsDiscovered,
        streak,
        additionalMetrics
      }

    } catch (error) {
      console.error('Error calculating synchronicity stats:', error)
      throw error
    }
  }

  /**
   * Calculate consecutive days streak
   */
  private calculateStreak(entries: any[]): number {
    if (entries.length === 0) return 0

    // Sort entries by date (most recent first)
    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Get unique dates
    const uniqueDates = Array.from(new Set(sortedEntries.map(e => e.date)))
      .map(date => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime())

    if (uniqueDates.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if we have an entry today or yesterday (to allow for timezone differences)
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const mostRecentDate = uniqueDates[0]
    mostRecentDate.setHours(0, 0, 0, 0)

    // If the most recent entry is not today or yesterday, streak is 0
    if (mostRecentDate.getTime() < yesterday.getTime()) {
      return 0
    }

    // Start counting from the most recent date
    let currentDate = new Date(mostRecentDate)
    let dateIndex = 0

    while (dateIndex < uniqueDates.length) {
      const entryDate = new Date(uniqueDates[dateIndex])
      entryDate.setHours(0, 0, 0, 0)

      if (entryDate.getTime() === currentDate.getTime()) {
        streak++
        dateIndex++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Calculate additional metrics for deeper insights
   */
  private async calculateAdditionalMetrics(entries: any[]) {
    try {
      // Emotion analysis
      const allEmotions = entries.flatMap(e => e.emotions || [])
      const emotionFrequency: Record<string, number> = {}
      allEmotions.forEach(emotion => {
        emotionFrequency[emotion] = (emotionFrequency[emotion] || 0) + 1
      })

      const topEmotions = Object.entries(emotionFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([emotion, count]) => ({ emotion, count }))

      // Temporal analysis
      const entriesByMonth = this.groupEntriesByPeriod(entries, 'month')
      const entriesByDayOfWeek = this.groupEntriesByPeriod(entries, 'dayOfWeek')

      // Significance distribution
      const significanceDistribution = this.calculateSignificanceDistribution(entries)

      // Context analysis
      const contextWords = entries
        .map(e => e.context || '')
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)

      const contextFrequency: Record<string, number> = {}
      contextWords.forEach(word => {
        contextFrequency[word] = (contextFrequency[word] || 0) + 1
      })

      const topContextWords = Object.entries(contextFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }))

      return {
        emotionAnalysis: {
          totalUniqueEmotions: Object.keys(emotionFrequency).length,
          topEmotions
        },
        temporalAnalysis: {
          entriesByMonth,
          entriesByDayOfWeek,
          mostActiveMonth: this.findMostActiveMonth(entriesByMonth),
          mostActiveDayOfWeek: this.findMostActiveDayOfWeek(entriesByDayOfWeek)
        },
        significanceDistribution,
        contextAnalysis: {
          topContextWords,
          averageContextLength: entries.reduce((sum, e) => sum + (e.context?.length || 0), 0) / (entries.length || 1)
        },
        trends: {
          recentActivity: this.calculateRecentActivity(entries),
          significanceTrend: this.calculateSignificanceTrend(entries)
        }
      }

    } catch (error) {
      console.error('Error calculating additional metrics:', error)
      return {}
    }
  }

  /**
   * Group entries by time period
   */
  private groupEntriesByPeriod(entries: any[], period: 'month' | 'dayOfWeek'): Record<string, number> {
    const groups: Record<string, number> = {}

    entries.forEach(entry => {
      const date = new Date(entry.date)
      let key: string

      if (period === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      } else if (period === 'dayOfWeek') {
        key = date.toLocaleDateString('en-US', { weekday: 'long' })
      } else {
        return
      }

      groups[key] = (groups[key] || 0) + 1
    })

    return groups
  }

  /**
   * Calculate significance distribution
   */
  private calculateSignificanceDistribution(entries: any[]) {
    const distribution = {
      low: 0,    // 1-3
      medium: 0, // 4-6
      high: 0,   // 7-8
      profound: 0 // 9-10
    }

    entries.forEach(entry => {
      const significance = entry.significance || 1
      if (significance <= 3) distribution.low++
      else if (significance <= 6) distribution.medium++
      else if (significance <= 8) distribution.high++
      else distribution.profound++
    })

    return distribution
  }

  /**
   * Find most active month
   */
  private findMostActiveMonth(entriesByMonth: Record<string, number>): string | null {
    const entries = Object.entries(entriesByMonth)
    if (entries.length === 0) return null

    return entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    )[0]
  }

  /**
   * Find most active day of week
   */
  private findMostActiveDayOfWeek(entriesByDayOfWeek: Record<string, number>): string | null {
    const entries = Object.entries(entriesByDayOfWeek)
    if (entries.length === 0) return null

    return entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    )[0]
  }

  /**
   * Calculate recent activity (last 30 days vs previous 30 days)
   */
  private calculateRecentActivity(entries: any[]) {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentEntries = entries.filter(e => new Date(e.date) >= thirtyDaysAgo)
    const previousEntries = entries.filter(e => {
      const date = new Date(e.date)
      return date >= sixtyDaysAgo && date < thirtyDaysAgo
    })

    const recentCount = recentEntries.length
    const previousCount = previousEntries.length

    const change = previousCount === 0 ? 0 : ((recentCount - previousCount) / previousCount) * 100

    return {
      recent30Days: recentCount,
      previous30Days: previousCount,
      percentageChange: Number(change.toFixed(1))
    }
  }

  /**
   * Calculate significance trend over time
   */
  private calculateSignificanceTrend(entries: any[]) {
    if (entries.length < 2) return { trend: 'stable', change: 0 }

    // Sort by date
    const sortedEntries = entries
      .filter(e => e.significance != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (sortedEntries.length < 2) return { trend: 'stable', change: 0 }

    // Calculate moving average for first and last quarter
    const quarterSize = Math.max(1, Math.floor(sortedEntries.length / 4))
    const firstQuarter = sortedEntries.slice(0, quarterSize)
    const lastQuarter = sortedEntries.slice(-quarterSize)

    const firstAvg = firstQuarter.reduce((sum, e) => sum + e.significance, 0) / firstQuarter.length
    const lastAvg = lastQuarter.reduce((sum, e) => sum + e.significance, 0) / lastQuarter.length

    const change = Number((lastAvg - firstAvg).toFixed(2))
    let trend = 'stable'

    if (change > 0.5) trend = 'increasing'
    else if (change < -0.5) trend = 'decreasing'

    return { trend, change }
  }

  /**
   * Get pattern analysis metrics
   */
  async getPatternAnalysis() {
    try {
      const { data: patterns, error } = await supabase
        .from('synchronicity_patterns')
        .select('*')
        .eq('user_id', this.userId)

      if (error || !patterns) {
        return {
          totalPatterns: 0,
          averagePatternFrequency: 0,
          patternsBySignificance: { low: 0, medium: 0, high: 0 }
        }
      }

      const totalPatterns = patterns.length
      const averagePatternFrequency = patterns.reduce((sum, p) => sum + (p.frequency || 0), 0) / (totalPatterns || 1)

      const patternsBySignificance = patterns.reduce((acc, pattern) => {
        const significance = pattern.significance || 1
        if (significance <= 4) acc.low++
        else if (significance <= 7) acc.medium++
        else acc.high++
        return acc
      }, { low: 0, medium: 0, high: 0 })

      return {
        totalPatterns,
        averagePatternFrequency: Number(averagePatternFrequency.toFixed(1)),
        patternsBySignificance,
        mostFrequentPattern: patterns.sort((a, b) => (b.frequency || 0) - (a.frequency || 0))[0]?.name || null
      }

    } catch (error) {
      console.error('Error analyzing patterns:', error)
      return {
        totalPatterns: 0,
        averagePatternFrequency: 0,
        patternsBySignificance: { low: 0, medium: 0, high: 0 }
      }
    }
  }

  /**
   * Get correlation analysis
   */
  async getCorrelationAnalysis() {
    try {
      // This would be implemented with the correlation service
      // For now, return a placeholder structure
      return {
        strongCorrelations: [],
        tagCorrelations: {},
        emotionCorrelations: {},
        temporalCorrelations: {}
      }
    } catch (error) {
      console.error('Error analyzing correlations:', error)
      return {
        strongCorrelations: [],
        tagCorrelations: {},
        emotionCorrelations: {},
        temporalCorrelations: {}
      }
    }
  }
}