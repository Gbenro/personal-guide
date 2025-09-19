import { supabase } from '@/lib/supabase'

export interface TagCorrelation {
  tag1: string
  tag2: string
  coOccurrences: number
  totalTag1: number
  totalTag2: number
  confidence: number
  support: number
  lift: number
}

export interface EmotionCorrelation {
  emotion1: string
  emotion2: string
  coOccurrences: number
  confidence: number
  avgSignificanceTogether: number
  entriesWithBoth: string[]
}

export interface TemporalPattern {
  type: 'daily' | 'weekly' | 'monthly'
  pattern: string
  occurrences: number
  averageSignificance: number
  confidence: number
}

export interface SignificancePattern {
  range: string
  count: number
  avgEmotions: number
  commonTags: string[]
  temporalDistribution: Record<string, number>
}

export class SynchronicityCorrelationService {
  constructor(private userId: string) {}

  /**
   * Analyze tag correlations using market basket analysis
   */
  async analyzeTagCorrelations(minConfidence: number = 0.3, minOccurrences: number = 3): Promise<TagCorrelation[]> {
    try {
      const { data: entries, error } = await supabase
        .from('synchronicity_entries')
        .select('id, tags')
        .eq('user_id', this.userId)

      if (error || !entries) {
        throw new Error('Failed to fetch synchronicity entries')
      }

      // Filter entries with tags
      const entriesWithTags = entries.filter(e => e.tags && e.tags.length > 0)
      const totalTransactions = entriesWithTags.length

      if (totalTransactions === 0) return []

      // Count individual tag frequencies
      const tagCounts: Record<string, number> = {}
      entriesWithTags.forEach(entry => {
        entry.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      // Find tag pairs and their co-occurrences
      const tagPairs: Record<string, { count: number; entries: string[] }> = {}

      entriesWithTags.forEach(entry => {
        const tags = entry.tags || []
        for (let i = 0; i < tags.length; i++) {
          for (let j = i + 1; j < tags.length; j++) {
            const tag1 = tags[i]
            const tag2 = tags[j]
            const pairKey = [tag1, tag2].sort().join('|')

            if (!tagPairs[pairKey]) {
              tagPairs[pairKey] = { count: 0, entries: [] }
            }
            tagPairs[pairKey].count++
            tagPairs[pairKey].entries.push(entry.id)
          }
        }
      })

      // Calculate correlation metrics
      const correlations: TagCorrelation[] = []

      Object.entries(tagPairs).forEach(([pairKey, pairData]) => {
        if (pairData.count >= minOccurrences) {
          const [tag1, tag2] = pairKey.split('|')
          const coOccurrences = pairData.count
          const totalTag1 = tagCounts[tag1] || 0
          const totalTag2 = tagCounts[tag2] || 0

          // Calculate confidence: P(tag2|tag1) = coOccurrences / totalTag1
          const confidence1 = totalTag1 > 0 ? coOccurrences / totalTag1 : 0
          const confidence2 = totalTag2 > 0 ? coOccurrences / totalTag2 : 0
          const maxConfidence = Math.max(confidence1, confidence2)

          // Calculate support: coOccurrences / totalTransactions
          const support = coOccurrences / totalTransactions

          // Calculate lift: confidence / (totalTag2 / totalTransactions)
          const expectedFreq2 = totalTag2 / totalTransactions
          const lift = expectedFreq2 > 0 ? confidence1 / expectedFreq2 : 0

          if (maxConfidence >= minConfidence) {
            correlations.push({
              tag1,
              tag2,
              coOccurrences,
              totalTag1,
              totalTag2,
              confidence: Number(maxConfidence.toFixed(3)),
              support: Number(support.toFixed(3)),
              lift: Number(lift.toFixed(3))
            })
          }
        }
      })

      // Sort by confidence descending
      return correlations.sort((a, b) => b.confidence - a.confidence)

    } catch (error) {
      console.error('Error analyzing tag correlations:', error)
      throw error
    }
  }

  /**
   * Analyze emotion correlations
   */
  async analyzeEmotionCorrelations(minConfidence: number = 0.3, minOccurrences: number = 2): Promise<EmotionCorrelation[]> {
    try {
      const { data: entries, error } = await supabase
        .from('synchronicity_entries')
        .select('id, emotions, significance')
        .eq('user_id', this.userId)

      if (error || !entries) {
        throw new Error('Failed to fetch synchronicity entries')
      }

      // Filter entries with emotions
      const entriesWithEmotions = entries.filter(e => e.emotions && e.emotions.length > 0)

      if (entriesWithEmotions.length === 0) return []

      // Count individual emotion frequencies
      const emotionCounts: Record<string, number> = {}
      entriesWithEmotions.forEach(entry => {
        entry.emotions.forEach((emotion: string) => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
        })
      })

      // Find emotion pairs and their co-occurrences
      const emotionPairs: Record<string, {
        count: number
        entries: string[]
        totalSignificance: number
      }> = {}

      entriesWithEmotions.forEach(entry => {
        const emotions = entry.emotions || []
        const significance = entry.significance || 0

        for (let i = 0; i < emotions.length; i++) {
          for (let j = i + 1; j < emotions.length; j++) {
            const emotion1 = emotions[i]
            const emotion2 = emotions[j]
            const pairKey = [emotion1, emotion2].sort().join('|')

            if (!emotionPairs[pairKey]) {
              emotionPairs[pairKey] = { count: 0, entries: [], totalSignificance: 0 }
            }
            emotionPairs[pairKey].count++
            emotionPairs[pairKey].entries.push(entry.id)
            emotionPairs[pairKey].totalSignificance += significance
          }
        }
      })

      // Calculate correlation metrics
      const correlations: EmotionCorrelation[] = []

      Object.entries(emotionPairs).forEach(([pairKey, pairData]) => {
        if (pairData.count >= minOccurrences) {
          const [emotion1, emotion2] = pairKey.split('|')
          const coOccurrences = pairData.count
          const totalEmotion1 = emotionCounts[emotion1] || 0

          // Calculate confidence: P(emotion2|emotion1)
          const confidence = totalEmotion1 > 0 ? coOccurrences / totalEmotion1 : 0

          // Calculate average significance when both emotions appear together
          const avgSignificanceTogether = pairData.totalSignificance / coOccurrences

          if (confidence >= minConfidence) {
            correlations.push({
              emotion1,
              emotion2,
              coOccurrences,
              confidence: Number(confidence.toFixed(3)),
              avgSignificanceTogether: Number(avgSignificanceTogether.toFixed(2)),
              entriesWithBoth: pairData.entries
            })
          }
        }
      })

      // Sort by confidence descending
      return correlations.sort((a, b) => b.confidence - a.confidence)

    } catch (error) {
      console.error('Error analyzing emotion correlations:', error)
      throw error
    }
  }

  /**
   * Analyze temporal patterns
   */
  async analyzeTemporalPatterns(): Promise<TemporalPattern[]> {
    try {
      const { data: entries, error } = await supabase
        .from('synchronicity_entries')
        .select('date, significance')
        .eq('user_id', this.userId)

      if (error || !entries) {
        throw new Error('Failed to fetch synchronicity entries')
      }

      const patterns: TemporalPattern[] = []

      // Analyze daily patterns (day of week)
      const dayOfWeekCounts: Record<string, { count: number; totalSignificance: number }> = {}

      // Analyze weekly patterns (week of month)
      const weekOfMonthCounts: Record<string, { count: number; totalSignificance: number }> = {}

      // Analyze monthly patterns
      const monthCounts: Record<string, { count: number; totalSignificance: number }> = {}

      entries.forEach(entry => {
        const date = new Date(entry.date)
        const significance = entry.significance || 0

        // Day of week analysis
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
        if (!dayOfWeekCounts[dayOfWeek]) {
          dayOfWeekCounts[dayOfWeek] = { count: 0, totalSignificance: 0 }
        }
        dayOfWeekCounts[dayOfWeek].count++
        dayOfWeekCounts[dayOfWeek].totalSignificance += significance

        // Week of month analysis
        const weekOfMonth = Math.ceil(date.getDate() / 7)
        const weekKey = `Week ${weekOfMonth}`
        if (!weekOfMonthCounts[weekKey]) {
          weekOfMonthCounts[weekKey] = { count: 0, totalSignificance: 0 }
        }
        weekOfMonthCounts[weekKey].count++
        weekOfMonthCounts[weekKey].totalSignificance += significance

        // Month analysis
        const month = date.toLocaleDateString('en-US', { month: 'long' })
        if (!monthCounts[month]) {
          monthCounts[month] = { count: 0, totalSignificance: 0 }
        }
        monthCounts[month].count++
        monthCounts[month].totalSignificance += significance
      })

      const totalEntries = entries.length
      const minOccurrences = Math.max(2, Math.floor(totalEntries * 0.1)) // At least 10% of entries

      // Convert to patterns format
      Object.entries(dayOfWeekCounts).forEach(([day, data]) => {
        if (data.count >= minOccurrences) {
          const confidence = data.count / totalEntries
          const avgSignificance = data.totalSignificance / data.count

          patterns.push({
            type: 'daily',
            pattern: day,
            occurrences: data.count,
            averageSignificance: Number(avgSignificance.toFixed(2)),
            confidence: Number(confidence.toFixed(3))
          })
        }
      })

      Object.entries(weekOfMonthCounts).forEach(([week, data]) => {
        if (data.count >= minOccurrences) {
          const confidence = data.count / totalEntries
          const avgSignificance = data.totalSignificance / data.count

          patterns.push({
            type: 'weekly',
            pattern: week,
            occurrences: data.count,
            averageSignificance: Number(avgSignificance.toFixed(2)),
            confidence: Number(confidence.toFixed(3))
          })
        }
      })

      Object.entries(monthCounts).forEach(([month, data]) => {
        if (data.count >= minOccurrences) {
          const confidence = data.count / totalEntries
          const avgSignificance = data.totalSignificance / data.count

          patterns.push({
            type: 'monthly',
            pattern: month,
            occurrences: data.count,
            averageSignificance: Number(avgSignificance.toFixed(2)),
            confidence: Number(confidence.toFixed(3))
          })
        }
      })

      // Sort by confidence descending
      return patterns.sort((a, b) => b.confidence - a.confidence)

    } catch (error) {
      console.error('Error analyzing temporal patterns:', error)
      throw error
    }
  }

  /**
   * Analyze significance patterns
   */
  async analyzeSignificancePatterns(): Promise<SignificancePattern[]> {
    try {
      const { data: entries, error } = await supabase
        .from('synchronicity_entries')
        .select('significance, emotions, tags, date')
        .eq('user_id', this.userId)

      if (error || !entries) {
        throw new Error('Failed to fetch synchronicity entries')
      }

      // Define significance ranges
      const ranges = [
        { name: 'Low (1-3)', min: 1, max: 3 },
        { name: 'Medium (4-6)', min: 4, max: 6 },
        { name: 'High (7-8)', min: 7, max: 8 },
        { name: 'Profound (9-10)', min: 9, max: 10 }
      ]

      const patterns: SignificancePattern[] = []

      ranges.forEach(range => {
        const rangeEntries = entries.filter(e =>
          e.significance >= range.min && e.significance <= range.max
        )

        if (rangeEntries.length === 0) return

        // Calculate average emotions per entry
        const totalEmotions = rangeEntries.reduce((sum, e) =>
          sum + (e.emotions?.length || 0), 0
        )
        const avgEmotions = totalEmotions / rangeEntries.length

        // Find most common tags in this range
        const tagCounts: Record<string, number> = {}
        rangeEntries.forEach(entry => {
          (entry.tags || []).forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        })

        const commonTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([tag]) => tag)

        // Calculate temporal distribution
        const temporalDistribution: Record<string, number> = {}
        rangeEntries.forEach(entry => {
          const date = new Date(entry.date)
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
          temporalDistribution[dayOfWeek] = (temporalDistribution[dayOfWeek] || 0) + 1
        })

        patterns.push({
          range: range.name,
          count: rangeEntries.length,
          avgEmotions: Number(avgEmotions.toFixed(1)),
          commonTags,
          temporalDistribution
        })
      })

      return patterns

    } catch (error) {
      console.error('Error analyzing significance patterns:', error)
      throw error
    }
  }

  /**
   * Perform custom correlation analysis on specific entries
   */
  async performCustomAnalysis(
    entryIds: string[],
    analysisTypes: string[],
    customParameters: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const { data: entries, error } = await supabase
        .from('synchronicity_entries')
        .select('*')
        .eq('user_id', this.userId)
        .in('id', entryIds)

      if (error || !entries) {
        throw new Error('Failed to fetch specified entries')
      }

      const results: Record<string, any> = {}

      // Perform requested analysis types
      for (const analysisType of analysisTypes) {
        switch (analysisType) {
          case 'tags':
            results.tagAnalysis = await this.customTagAnalysis(entries, customParameters)
            break

          case 'emotions':
            results.emotionAnalysis = await this.customEmotionAnalysis(entries, customParameters)
            break

          case 'temporal':
            results.temporalAnalysis = await this.customTemporalAnalysis(entries, customParameters)
            break

          case 'significance':
            results.significanceAnalysis = await this.customSignificanceAnalysis(entries, customParameters)
            break

          default:
            console.warn(`Unknown analysis type: ${analysisType}`)
        }
      }

      return results

    } catch (error) {
      console.error('Error performing custom analysis:', error)
      throw error
    }
  }

  /**
   * Custom tag analysis for specific entries
   */
  private async customTagAnalysis(entries: any[], params: Record<string, any>) {
    const allTags = entries.flatMap(e => e.tags || [])
    const tagFrequency: Record<string, number> = {}

    allTags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
    })

    const sortedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count, percentage: (count / entries.length) * 100 }))

    return {
      totalUniqueTags: Object.keys(tagFrequency).length,
      mostFrequentTags: sortedTags.slice(0, params.topCount || 10),
      tagDistribution: tagFrequency
    }
  }

  /**
   * Custom emotion analysis for specific entries
   */
  private async customEmotionAnalysis(entries: any[], params: Record<string, any>) {
    const allEmotions = entries.flatMap(e => e.emotions || [])
    const emotionFrequency: Record<string, number> = {}

    allEmotions.forEach(emotion => {
      emotionFrequency[emotion] = (emotionFrequency[emotion] || 0) + 1
    })

    // Calculate emotion-significance correlation
    const emotionSignificance: Record<string, number[]> = {}
    entries.forEach(entry => {
      (entry.emotions || []).forEach((emotion: string) => {
        if (!emotionSignificance[emotion]) {
          emotionSignificance[emotion] = []
        }
        emotionSignificance[emotion].push(entry.significance || 0)
      })
    })

    const emotionAvgSignificance = Object.entries(emotionSignificance).map(([emotion, significances]) => ({
      emotion,
      averageSignificance: significances.reduce((sum, s) => sum + s, 0) / significances.length,
      occurrences: significances.length
    }))

    return {
      totalUniqueEmotions: Object.keys(emotionFrequency).length,
      emotionFrequency,
      emotionSignificanceCorrelation: emotionAvgSignificance.sort((a, b) => b.averageSignificance - a.averageSignificance)
    }
  }

  /**
   * Custom temporal analysis for specific entries
   */
  private async customTemporalAnalysis(entries: any[], params: Record<string, any>) {
    const dateGroups: Record<string, number> = {}
    const timeGroups: Record<string, number> = {}

    entries.forEach(entry => {
      const date = new Date(entry.date)

      // Group by day of week
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
      dateGroups[dayOfWeek] = (dateGroups[dayOfWeek] || 0) + 1

      // Group by month if we have multiple months
      const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      timeGroups[month] = (timeGroups[month] || 0) + 1
    })

    return {
      dayOfWeekDistribution: dateGroups,
      monthlyDistribution: timeGroups,
      dateRange: {
        earliest: Math.min(...entries.map(e => new Date(e.date).getTime())),
        latest: Math.max(...entries.map(e => new Date(e.date).getTime())),
        span: entries.length > 1 ?
          Math.max(...entries.map(e => new Date(e.date).getTime())) -
          Math.min(...entries.map(e => new Date(e.date).getTime())) : 0
      }
    }
  }

  /**
   * Custom significance analysis for specific entries
   */
  private async customSignificanceAnalysis(entries: any[], params: Record<string, any>) {
    const significances = entries.map(e => e.significance || 0).filter(s => s > 0)

    if (significances.length === 0) {
      return { message: 'No significance data available' }
    }

    const average = significances.reduce((sum, s) => sum + s, 0) / significances.length
    const median = significances.sort((a, b) => a - b)[Math.floor(significances.length / 2)]
    const min = Math.min(...significances)
    const max = Math.max(...significances)

    // Distribution by ranges
    const distribution = {
      low: significances.filter(s => s <= 3).length,
      medium: significances.filter(s => s > 3 && s <= 6).length,
      high: significances.filter(s => s > 6 && s <= 8).length,
      profound: significances.filter(s => s > 8).length
    }

    return {
      statistics: {
        average: Number(average.toFixed(2)),
        median,
        min,
        max,
        count: significances.length
      },
      distribution
    }
  }
}