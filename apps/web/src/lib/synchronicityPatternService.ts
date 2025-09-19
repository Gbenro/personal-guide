import { supabase } from '@/lib/supabase'
import { SynchronicityEntry, SynchronicityPattern } from '@/types/spiritual'

export class SynchronicityPatternService {
  constructor(private userId: string) {}

  /**
   * Auto-discover patterns in user's synchronicity entries
   */
  async discoverPatterns(): Promise<SynchronicityPattern[]> {
    try {
      // Get all user's synchronicity entries
      const { data: entries, error } = await supabase
        .from('synchronicity_entries')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: false })

      if (error || !entries) {
        throw new Error('Failed to fetch synchronicity entries')
      }

      const discoveredPatterns: SynchronicityPattern[] = []

      // Pattern 1: Tag co-occurrence patterns
      const tagPatterns = this.findTagPatterns(entries)
      discoveredPatterns.push(...tagPatterns)

      // Pattern 2: Emotion clustering patterns
      const emotionPatterns = this.findEmotionPatterns(entries)
      discoveredPatterns.push(...emotionPatterns)

      // Pattern 3: Temporal patterns (time-based clustering)
      const temporalPatterns = this.findTemporalPatterns(entries)
      discoveredPatterns.push(...temporalPatterns)

      // Pattern 4: Significance clustering
      const significancePatterns = this.findSignificancePatterns(entries)
      discoveredPatterns.push(...significancePatterns)

      // Save discovered patterns to database
      const savedPatterns = await this.savePatterns(discoveredPatterns)

      return savedPatterns

    } catch (error) {
      console.error('Error discovering patterns:', error)
      throw error
    }
  }

  /**
   * Find patterns based on tag co-occurrence
   */
  private findTagPatterns(entries: any[]): SynchronicityPattern[] {
    const patterns: SynchronicityPattern[] = []
    const tagCombinations: Map<string, string[]> = new Map()

    // Analyze tag combinations that appear together frequently
    entries.forEach(entry => {
      if (entry.tags && entry.tags.length >= 2) {
        // Sort tags to ensure consistent combination keys
        const sortedTags = [...entry.tags].sort()

        for (let i = 0; i < sortedTags.length; i++) {
          for (let j = i + 1; j < sortedTags.length; j++) {
            const combination = `${sortedTags[i]}+${sortedTags[j]}`
            if (!tagCombinations.has(combination)) {
              tagCombinations.set(combination, [])
            }
            tagCombinations.get(combination)!.push(entry.id)
          }
        }
      }
    })

    // Convert frequent combinations to patterns
    tagCombinations.forEach((entryIds, combination) => {
      if (entryIds.length >= 3) { // Minimum 3 occurrences to be considered a pattern
        const [tag1, tag2] = combination.split('+')
        patterns.push({
          id: `tag-pattern-${combination}`,
          name: `${tag1} & ${tag2} Connection`,
          description: `Synchronicities involving both ${tag1} and ${tag2} themes`,
          entries: entryIds,
          frequency: entryIds.length,
          discoveredAt: new Date(),
          significance: Math.min(10, Math.floor(entryIds.length * 1.5) + 3)
        })
      }
    })

    return patterns
  }

  /**
   * Find patterns based on emotional clustering
   */
  private findEmotionPatterns(entries: any[]): SynchronicityPattern[] {
    const patterns: SynchronicityPattern[] = []
    const emotionGroups: Map<string, string[]> = new Map()

    // Group entries by emotional themes
    entries.forEach(entry => {
      if (entry.emotions && entry.emotions.length > 0) {
        const emotionKey = entry.emotions.sort().join(',')
        if (!emotionGroups.has(emotionKey)) {
          emotionGroups.set(emotionKey, [])
        }
        emotionGroups.get(emotionKey)!.push(entry.id)
      }
    })

    // Convert frequent emotion combinations to patterns
    emotionGroups.forEach((entryIds, emotions) => {
      if (entryIds.length >= 2) {
        const emotionList = emotions.split(',')
        patterns.push({
          id: `emotion-pattern-${emotions.replace(/,/g, '-')}`,
          name: `${emotionList.join(' & ')} Emotional Pattern`,
          description: `Synchronicities experienced with ${emotionList.join(', ')} emotions`,
          entries: entryIds,
          frequency: entryIds.length,
          discoveredAt: new Date(),
          significance: Math.min(10, entryIds.length + 2)
        })
      }
    })

    return patterns
  }

  /**
   * Find temporal patterns (clustering by time periods)
   */
  private findTemporalPatterns(entries: any[]): SynchronicityPattern[] {
    const patterns: SynchronicityPattern[] = []

    // Group by time periods
    const timeGroups: Map<string, string[]> = new Map()

    entries.forEach(entry => {
      const date = new Date(entry.date)
      const dayOfWeek = date.getDay()
      const hour = date.getHours ? date.getHours() : 12 // Default to noon if no time

      // Weekly patterns
      const weeklyKey = `day-${dayOfWeek}`
      if (!timeGroups.has(weeklyKey)) {
        timeGroups.set(weeklyKey, [])
      }
      timeGroups.get(weeklyKey)!.push(entry.id)

      // Time-of-day patterns (morning, afternoon, evening, night)
      let timeOfDay = 'unknown'
      if (hour >= 6 && hour < 12) timeOfDay = 'morning'
      else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon'
      else if (hour >= 18 && hour < 22) timeOfDay = 'evening'
      else if (hour >= 22 || hour < 6) timeOfDay = 'night'

      const timeOfDayKey = `time-${timeOfDay}`
      if (!timeGroups.has(timeOfDayKey)) {
        timeGroups.set(timeOfDayKey, [])
      }
      timeGroups.get(timeOfDayKey)!.push(entry.id)
    })

    // Convert temporal clusters to patterns
    timeGroups.forEach((entryIds, timeKey) => {
      if (entryIds.length >= 3) {
        const [type, value] = timeKey.split('-')
        let description = ''

        if (type === 'day') {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          description = `Synchronicities that frequently occur on ${dayNames[parseInt(value)]}`
        } else if (type === 'time') {
          description = `Synchronicities that frequently occur in the ${value}`
        }

        patterns.push({
          id: `temporal-pattern-${timeKey}`,
          name: `${type === 'day' ? 'Weekly' : 'Daily'} ${value} Pattern`,
          description,
          entries: entryIds,
          frequency: entryIds.length,
          discoveredAt: new Date(),
          significance: Math.min(10, Math.floor(entryIds.length * 1.2) + 2)
        })
      }
    })

    return patterns
  }

  /**
   * Find patterns based on significance clustering
   */
  private findSignificancePatterns(entries: any[]): SynchronicityPattern[] {
    const patterns: SynchronicityPattern[] = []

    // Group by significance levels
    const significanceGroups: Map<string, string[]> = new Map()

    entries.forEach(entry => {
      let significanceLevel = 'medium'
      if (entry.significance >= 8) significanceLevel = 'high'
      else if (entry.significance <= 4) significanceLevel = 'low'

      if (!significanceGroups.has(significanceLevel)) {
        significanceGroups.set(significanceLevel, [])
      }
      significanceGroups.get(significanceLevel)!.push(entry.id)
    })

    // Convert significance clusters to patterns
    significanceGroups.forEach((entryIds, level) => {
      if (entryIds.length >= 4) {
        patterns.push({
          id: `significance-pattern-${level}`,
          name: `${level.charAt(0).toUpperCase() + level.slice(1)} Significance Pattern`,
          description: `Pattern of synchronicities with ${level} significance levels`,
          entries: entryIds,
          frequency: entryIds.length,
          discoveredAt: new Date(),
          significance: level === 'high' ? 9 : level === 'medium' ? 6 : 4
        })
      }
    })

    return patterns
  }

  /**
   * Save discovered patterns to database
   */
  private async savePatterns(patterns: SynchronicityPattern[]): Promise<SynchronicityPattern[]> {
    const savedPatterns: SynchronicityPattern[] = []

    for (const pattern of patterns) {
      // Check if pattern already exists
      const { data: existingPattern } = await supabase
        .from('synchronicity_patterns')
        .select('id')
        .eq('user_id', this.userId)
        .eq('name', pattern.name)
        .single()

      if (!existingPattern) {
        // Save new pattern
        const { data: savedPattern, error } = await supabase
          .from('synchronicity_patterns')
          .insert({
            user_id: this.userId,
            name: pattern.name,
            description: pattern.description,
            entry_ids: pattern.entries,
            frequency: pattern.frequency,
            significance: pattern.significance
          })
          .select()
          .single()

        if (savedPattern && !error) {
          savedPatterns.push(savedPattern)
        }
      }
    }

    return savedPatterns
  }

  /**
   * Update pattern with new entries
   */
  async updatePattern(patternId: string, entryIds: string[]): Promise<SynchronicityPattern | null> {
    try {
      const { data: pattern, error } = await supabase
        .from('synchronicity_patterns')
        .update({
          entry_ids: entryIds,
          frequency: entryIds.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', patternId)
        .eq('user_id', this.userId)
        .select()
        .single()

      if (error || !pattern) {
        throw new Error('Failed to update pattern')
      }

      return pattern

    } catch (error) {
      console.error('Error updating pattern:', error)
      throw error
    }
  }

  /**
   * Delete pattern
   */
  async deletePattern(patternId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('synchronicity_patterns')
        .delete()
        .eq('id', patternId)
        .eq('user_id', this.userId)

      if (error) {
        throw new Error('Failed to delete pattern')
      }

      return true

    } catch (error) {
      console.error('Error deleting pattern:', error)
      throw error
    }
  }
}