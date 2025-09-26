import { ParsedEntityOperation, EntityType, OperationType, validateEntityParameters } from './chatEntityParser'
import { createHabit, updateHabit, deleteHabit, getUserHabits, toggleHabitCompletion, getTodayCompletions, calculateStreak } from './habitService'
import { GoalsService } from './goalsService-stub'
import { createJournalEntry, updateJournalEntry, deleteJournalEntry, getUserJournalEntries } from './journalService'
import { createMoodEnergyEntry, getMoodEnergyEntries, updateMoodEnergyEntry, deleteMoodEnergyEntry, getMoodEnergyStats, getTodaysMoodEnergy, getMoodPatterns } from './moodEnergyService'
import { RoutinesService } from './routinesService-stub'
import { BeliefsService } from './beliefsService-stub'
import { SynchronicityService } from './synchronicityService'

// =============================================================================
// OPERATION RESULT TYPES
// =============================================================================

export interface OperationResult {
  success: boolean
  message: string
  data?: any
  needsConfirmation?: boolean
  confirmationPrompt?: string
  suggestedActions?: string[]
}

export interface ConfirmationContext {
  operation: ParsedEntityOperation
  previewData?: any
  alternatives?: any[]
}

// =============================================================================
// ENTITY OPERATION HANDLER
// =============================================================================

export class EntityOperationHandler {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Execute a parsed entity operation
   */
  async executeOperation(operation: ParsedEntityOperation): Promise<OperationResult> {
    try {
      // Validate parameters first
      const validation = validateEntityParameters(operation.entityType, operation.parameters)
      if (!validation.isValid) {
        return {
          success: false,
          message: `Invalid parameters: ${validation.errors.join(', ')}`,
          suggestedActions: this.getSuggestedCorrections(operation, validation.errors)
        }
      }

      // Route to appropriate handler
      switch (operation.entityType) {
        case 'habit':
          return await this.handleHabitOperation(operation)
        case 'goal':
          return await this.handleGoalOperation(operation)
        case 'journal':
          return await this.handleJournalOperation(operation)
        case 'mood':
          return await this.handleMoodOperation(operation)
        case 'routine':
          return await this.handleRoutineOperation(operation)
        case 'belief':
          return await this.handleBeliefOperation(operation)
        case 'synchronicity':
          return await this.handleSynchronicityOperation(operation)
        default:
          return {
            success: false,
            message: `Entity type '${operation.entityType}' is not yet supported for chat operations`
          }
      }
    } catch (error) {
      console.error('Error executing entity operation:', error)
      return {
        success: false,
        message: 'An unexpected error occurred while processing your request'
      }
    }
  }

  // =============================================================================
  // HABIT OPERATIONS
  // =============================================================================

  private async handleHabitOperation(operation: ParsedEntityOperation): Promise<OperationResult> {
    const { intent, parameters, entityId } = operation

    switch (intent) {
      case 'create':
        return await this.createHabitFromChat(parameters)

      case 'update':
        if (!entityId) {
          return await this.findAndUpdateHabit(parameters)
        }
        return await this.updateHabitFromChat(entityId, parameters)

      case 'delete':
        if (!entityId) {
          return await this.findAndDeleteHabit(parameters)
        }
        return await this.deleteHabitFromChat(entityId)

      case 'complete':
        return await this.completeHabitFromChat(parameters)

      case 'toggle':
        return await this.toggleHabitFromChat(parameters)

      case 'view':
        return await this.viewHabitsFromChat(parameters)

      default:
        return {
          success: false,
          message: `Habit operation '${intent}' is not supported`
        }
    }
  }

  private async createHabitFromChat(parameters: any): Promise<OperationResult> {
    try {
      const result = await createHabit(
        this.userId,
        parameters.name,
        parameters.description || '',
        parameters.color || '#3B82F6',
        parameters.target_frequency || 1,
        parameters.frequency_period || 'daily'
      )

      return {
        success: true,
        message: `✅ Created habit "${parameters.name}" successfully!`,
        data: result,
        suggestedActions: [
          'Set a reminder time',
          'Add it to your daily routine',
          'Track your first completion'
        ]
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create habit: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async findAndUpdateHabit(parameters: any): Promise<OperationResult> {
    if (!parameters.name) {
      return {
        success: false,
        message: 'Please specify which habit you want to update',
        suggestedActions: ['Provide the habit name', 'Use "update habit called [name]"']
      }
    }

    const habits = await getUserHabits(this.userId)
    const searchTerm = parameters.name.toLowerCase()

    // Try exact match first
    let targetHabit = habits.find(h => h.name.toLowerCase() === searchTerm)

    // If no exact match, try partial match
    if (!targetHabit) {
      targetHabit = habits.find(h => h.name.toLowerCase().includes(searchTerm))
    }

    // If still no match, try keyword matching
    if (!targetHabit) {
      const searchWords = searchTerm.split(/\s+/)
      targetHabit = habits.find(h => {
        const habitWords = h.name.toLowerCase().split(/\s+/)
        return searchWords.some(word => habitWords.some(habitWord => habitWord.includes(word)))
      })
    }

    if (!targetHabit) {
      const similarHabits = habits.filter(h => {
        const similarity = this.calculateSimilarity(h.name.toLowerCase(), searchTerm)
        return similarity > 0.3
      }).slice(0, 3)

      return {
        success: false,
        message: `Could not find a habit matching "${parameters.name}"`,
        suggestedActions: similarHabits.length > 0
          ? similarHabits.map(h => `Update "${h.name}" instead?`)
          : ['Check your habit list', 'Create a new habit instead?']
      }
    }

    // If we have multiple potential matches, ask for confirmation
    const potentialMatches = habits.filter(h => h.name.toLowerCase().includes(searchTerm))
    if (potentialMatches.length > 1 && !parameters.confirmed) {
      return {
        success: false,
        message: `Found multiple habits matching "${parameters.name}". Which one did you mean?`,
        needsConfirmation: true,
        confirmationPrompt: 'Please specify which habit to update:',
        suggestedActions: potentialMatches.map(h => `Update "${h.name}"`)
      }
    }

    return await this.updateHabitFromChat(targetHabit.id, parameters)
  }

  private async updateHabitFromChat(habitId: string, parameters: any): Promise<OperationResult> {
    try {
      const updateData = Object.entries(parameters)
        .filter(([key, value]) => value !== undefined && key !== 'name')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

      const result = await updateHabit(habitId, updateData)

      return {
        success: true,
        message: `✅ Updated habit successfully!`,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update habit: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async completeHabitFromChat(parameters: any): Promise<OperationResult> {
    if (!parameters.name) {
      return {
        success: false,
        message: 'Please specify which habit you completed',
        suggestedActions: ['Use "I completed [habit name]"', 'Use "done with [habit name]"']
      }
    }

    const habits = await getUserHabits(this.userId)
    const targetHabit = habits.find(h =>
      h.name.toLowerCase().includes(parameters.name.toLowerCase())
    )

    if (!targetHabit) {
      return {
        success: false,
        message: `Could not find a habit matching "${parameters.name}"`,
        suggestedActions: habits.slice(0, 3).map(h => `Complete "${h.name}" instead?`)
      }
    }

    try {
      await toggleHabitCompletion(targetHabit.id, this.userId)
      return {
        success: true,
        message: `🎉 Great job completing "${targetHabit.name}"!`,
        data: { habitId: targetHabit.id, habitName: targetHabit.name }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to mark habit as complete: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // =============================================================================
  // GOAL OPERATIONS
  // =============================================================================

  private async handleGoalOperation(operation: ParsedEntityOperation): Promise<OperationResult> {
    const { intent, parameters, entityId } = operation

    switch (intent) {
      case 'create':
        return await this.createGoalFromChat(parameters)

      case 'update':
        if (!entityId) {
          return await this.findAndUpdateGoal(parameters)
        }
        return await this.updateGoalFromChat(entityId, parameters)

      case 'view':
        return await this.viewGoalsFromChat(parameters)

      case 'delete':
        if (!entityId) {
          return await this.findAndDeleteGoal(parameters)
        }
        return await this.deleteGoalFromChat(entityId)

      case 'complete':
        return await this.completeGoalFromChat(parameters)

      default:
        return {
          success: false,
          message: `Goal operation '${intent}' is not supported`
        }
    }
  }

  private async createGoalFromChat(parameters: any): Promise<OperationResult> {
    try {
      const goalData = {
        title: parameters.title,
        description: parameters.description || '',
        category: parameters.category || 'personal',
        target_date: parameters.target_date,
        priority: parameters.priority || 'medium',
        is_active: parameters.is_active !== false
      }

      const result = await GoalsService.createGoal(this.userId, goalData)

      return {
        success: true,
        message: `🎯 Created goal "${goalData.title}" successfully!`,
        data: result,
        suggestedActions: [
          'Set milestones',
          'Add to your weekly review',
          'Track progress regularly'
        ]
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create goal: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // =============================================================================
  // JOURNAL OPERATIONS
  // =============================================================================

  private async handleJournalOperation(operation: ParsedEntityOperation): Promise<OperationResult> {
    const { intent, parameters, entityId } = operation

    switch (intent) {
      case 'create':
        return await this.createJournalFromChat(parameters)

      case 'update':
        if (!entityId) {
          return await this.findAndUpdateJournal(parameters)
        }
        return await this.updateJournalFromChat(entityId, parameters)

      case 'delete':
        if (!entityId) {
          return await this.findAndDeleteJournal(parameters)
        }
        return await this.deleteJournalFromChat(entityId)

      case 'view':
        return await this.viewJournalFromChat(parameters)

      default:
        return {
          success: false,
          message: `Journal operation '${intent}' is not supported`
        }
    }
  }

  private async createJournalFromChat(parameters: any): Promise<OperationResult> {
    try {
      // Enhanced content analysis and processing
      const analyzedContent = this.analyzeJournalContent(parameters.content)

      const entryData = {
        title: parameters.title || this.generateTitleFromContent(parameters.content),
        content: parameters.content,
        mood_rating: parameters.mood_rating || analyzedContent.suggestedMood,
        tags: parameters.tags || analyzedContent.suggestedTags
      }

      const result = await createJournalEntry(this.userId, entryData)

      if (!result) {
        return {
          success: false,
          message: 'Failed to create journal entry. Please try again.'
        }
      }

      // Generate insights about the entry
      const insights = this.generateJournalInsights(analyzedContent)

      let message = `📝 Journal entry created successfully!`
      if (analyzedContent.category) {
        message += ` Categorized as: ${analyzedContent.category}`
      }
      if (analyzedContent.mood) {
        message += ` | Detected mood: ${analyzedContent.mood}`
      }

      return {
        success: true,
        message,
        data: {
          ...result,
          analysis: analyzedContent,
          insights
        },
        suggestedActions: [
          ...insights.recommendations,
          'Add more details if needed',
          'Review and edit if necessary'
        ]
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // =============================================================================
  // MOOD OPERATIONS
  // =============================================================================

  private async handleMoodOperation(operation: ParsedEntityOperation): Promise<OperationResult> {
    const { intent, parameters, entityId, originalMessage } = operation

    // Add originalMessage to parameters for context
    const enhancedParameters = { ...parameters, originalMessage }

    switch (intent) {
      case 'create':
        return await this.createMoodFromChat(enhancedParameters)

      case 'view':
        return await this.viewMoodFromChat(enhancedParameters)

      case 'update':
        if (!entityId) {
          return await this.findAndUpdateMood(enhancedParameters)
        }
        return await this.updateMoodFromChat(entityId, enhancedParameters)

      case 'delete':
        if (!entityId) {
          return await this.findAndDeleteMood(enhancedParameters)
        }
        return await this.deleteMoodFromChat(entityId)

      default:
        return {
          success: false,
          message: `Mood operation '${intent}' is not yet implemented`
        }
    }
  }

  private async createMoodFromChat(parameters: any): Promise<OperationResult> {
    try {
      // Enhanced mood detection from natural language
      const originalMessage = parameters.originalMessage || ''
      const analyzedMood = this.analyzeMoodFromMessage(originalMessage)

      const moodData = {
        mood_rating: parameters.mood_rating || analyzedMood.suggestedMood || 5,
        energy_level: parameters.energy_level || analyzedMood.suggestedEnergy || 5,
        notes: parameters.notes || analyzedMood.extractedNotes || '',
        tags: parameters.tags || analyzedMood.suggestedTags || [],
        context: this.extractMoodContext(originalMessage)
      }

      const result = await createMoodEnergyEntry(this.userId, {
        moodRating: moodData.mood_rating,
        energyLevel: moodData.energy_level,
        notes: moodData.notes,
        tags: moodData.tags,
        context: moodData.context
      })

      if (!result) {
        return {
          success: false,
          message: 'Failed to create mood entry. Please try again.'
        }
      }

      // Generate personalized insights
      const insights = this.generateMoodInsights(moodData, analyzedMood)

      let message = `😊 Mood entry recorded successfully! `
      message += `Mood: ${moodData.mood_rating}/10, Energy: ${moodData.energy_level}/10`

      if (analyzedMood.detectedEmotion) {
        message += ` | Detected: ${analyzedMood.detectedEmotion}`
      }

      return {
        success: true,
        message,
        data: {
          ...result,
          analysis: analyzedMood,
          insights
        },
        suggestedActions: [
          ...insights.recommendations,
          'View your mood trends',
          'Add context about what influenced your mood'
        ]
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to record mood: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // =============================================================================
  // MOOD OPERATION HELPERS
  // =============================================================================

  private async viewMoodFromChat(parameters: any): Promise<OperationResult> {
    try {
      // Check if this is a trend analysis request
      const isTrendQuery = this.isMoodTrendQuery(parameters.originalMessage || '')

      // Determine the timeframe for mood data
      let options: any = { limit: isTrendQuery ? 30 : 10 }

      if (parameters.timeframe) {
        const dateRange = this.parseDateRange(parameters.timeframe)
        if (dateRange) {
          options.startDate = dateRange.start
          options.endDate = dateRange.end
        }
      } else if (parameters.days) {
        const days = parseInt(parameters.days, 10)
        if (days > 0) {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - days)
          options.startDate = startDate.toISOString()
        }
      }

      const entries = await getMoodEnergyEntries(this.userId, options)

      if (entries.length === 0) {
        return {
          success: true,
          message: this.getNoMoodEntriesMessage(parameters),
          suggestedActions: [
            'Log your first mood entry',
            'Try "I\'m feeling happy today (8/10)"',
            'Add energy level with "Energy 6/10, mood 7/10"'
          ]
        }
      }

      // Get mood statistics and patterns
      const stats = await getMoodEnergyStats(this.userId, parameters.days || 30)
      const patterns = await getMoodPatterns(this.userId, parameters.days || 30)

      // Format entries for display
      const formattedEntries = entries.slice(0, 5).map(entry => this.formatMoodEntry(entry))

      let message

      if (isTrendQuery) {
        // Enhanced trend analysis response
        message = `📈 Mood Trend Analysis (${entries.length} entries)`
        if (parameters.timeframe) {
          message += ` from ${parameters.timeframe}`
        } else {
          message += ` over the last ${parameters.days || 30} days`
        }

        // Detailed trend statistics
        message += `\n\n📊 Trend Summary:`
        message += `\n• Overall Mood: ${stats.averageMood.toFixed(1)}/10 (${stats.moodTrend} ${this.getMoodTrendIcon(stats.moodTrend)})`
        message += `\n• Energy Levels: ${stats.averageEnergy.toFixed(1)}/10 (${stats.energyTrend} ${this.getMoodTrendIcon(stats.energyTrend)})`
        message += `\n• Peak Performance: ${stats.bestTimeOfDay}s`

        // Weekly pattern analysis
        if (stats.weeklyPattern && stats.weeklyPattern.length > 0) {
          const bestDay = stats.weeklyPattern.reduce((prev, current) =>
            (prev.avgMood > current.avgMood) ? prev : current
          )
          const worstDay = stats.weeklyPattern.reduce((prev, current) =>
            (prev.avgMood < current.avgMood) ? prev : current
          )

          message += `\n• Best Day: ${bestDay.day} (${bestDay.avgMood.toFixed(1)}/10)`
          message += `\n• Challenging Day: ${worstDay.day} (${worstDay.avgMood.toFixed(1)}/10)`
        }

        // Pattern insights
        if (patterns.patterns.length > 0) {
          message += `\n\n🔍 Patterns Detected:`
          patterns.patterns.slice(0, 3).forEach(pattern => {
            message += `\n• ${pattern}`
          })
        }

        // Recommendations for trends
        if (patterns.recommendations.length > 0) {
          message += `\n\n💡 Recommendations:`
          patterns.recommendations.slice(0, 3).forEach(rec => {
            message += `\n• ${rec}`
          })
        }

        // Recent trajectory
        const recentEntries = entries.slice(0, 5)
        if (recentEntries.length >= 3) {
          const recentAvg = recentEntries.slice(0, 3).reduce((sum, entry) => sum + entry.mood_rating, 0) / 3
          const olderAvg = entries.length > 5 ?
            entries.slice(5, Math.min(10, entries.length)).reduce((sum, entry) => sum + entry.mood_rating, 0) /
            Math.min(5, entries.length - 5) : recentAvg

          const trajectory = recentAvg > olderAvg + 0.5 ? 'improving' :
                           recentAvg < olderAvg - 0.5 ? 'declining' : 'stable'

          message += `\n\n🎯 Recent Trajectory: ${trajectory} ${this.getMoodTrendIcon(trajectory)}`
        }

      } else {
        // Standard mood view response
        message = `🎭 Found ${entries.length} mood entries`
        if (parameters.timeframe) {
          message += ` from ${parameters.timeframe}`
        }

        // Add summary statistics
        message += `\n\n📊 Mood Summary:`
        message += `\n• Average Mood: ${stats.averageMood.toFixed(1)}/10 ${this.getMoodTrendIcon(stats.moodTrend)}`
        message += `\n• Average Energy: ${stats.averageEnergy.toFixed(1)}/10 ${this.getMoodTrendIcon(stats.energyTrend)}`
        message += `\n• Best Time: ${stats.bestTimeOfDay}`
        message += `\n• Mood Trend: ${stats.moodTrend}`

        if (stats.insights.length > 0) {
          message += `\n\n💡 Insights:\n${stats.insights.slice(0, 3).map(insight => `• ${insight}`).join('\n')}`
        }

        message += '\n\n📝 Recent Entries:\n' + formattedEntries.join('\n\n')
      }

      if (entries.length > 5) {
        message += `\n\n... and ${entries.length - 5} more entries`
      }

      return {
        success: true,
        message,
        data: {
          entries,
          stats,
          patterns,
          totalFound: entries.length
        },
        suggestedActions: this.getMoodViewSuggestions(stats, patterns)
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve mood entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async findAndUpdateMood(parameters: any): Promise<OperationResult> {
    try {
      // Get today's mood entries by default, or recent entries
      let targetEntry = null

      if (parameters.date_reference === 'today' || !parameters.date_reference) {
        const todayEntries = await getTodaysMoodEnergy(this.userId)
        targetEntry = todayEntries[0] // Most recent today
      }

      if (!targetEntry) {
        // Get most recent entry
        const recentEntries = await getMoodEnergyEntries(this.userId, { limit: 5 })
        targetEntry = recentEntries[0]
      }

      if (!targetEntry) {
        return {
          success: false,
          message: 'No mood entries found to update',
          suggestedActions: ['Create your first mood entry', 'Log your current mood']
        }
      }

      return await this.updateMoodFromChat(targetEntry.id, parameters)
    } catch (error) {
      return {
        success: false,
        message: `Failed to find mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async updateMoodFromChat(entryId: string, parameters: any): Promise<OperationResult> {
    try {
      const updateData: any = {}

      // Extract new mood/energy values
      if (parameters.mood_rating !== undefined) {
        updateData.mood_rating = Math.max(1, Math.min(10, parameters.mood_rating))
      }

      if (parameters.energy_level !== undefined) {
        updateData.energy_level = Math.max(1, Math.min(10, parameters.energy_level))
      }

      // Update notes if provided
      if (parameters.notes) {
        updateData.notes = parameters.notes
      }

      // Update tags if provided
      if (parameters.tags) {
        updateData.tags = parameters.tags
      }

      // Extract context from message if provided
      if (parameters.originalMessage) {
        const contextUpdate = this.extractMoodContext(parameters.originalMessage)
        if (Object.keys(contextUpdate).length > 0) {
          updateData.context = contextUpdate
        }
      }

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          message: 'No valid updates provided. You can update mood rating, energy level, notes, or tags.'
        }
      }

      const result = await updateMoodEnergyEntry(entryId, updateData)

      if (!result) {
        return {
          success: false,
          message: 'Failed to update mood entry. Please check if the entry exists and try again.'
        }
      }

      let message = `✅ Updated mood entry successfully!`
      if (updateData.mood_rating) {
        message += ` Mood: ${updateData.mood_rating}/10`
      }
      if (updateData.energy_level) {
        message += ` Energy: ${updateData.energy_level}/10`
      }

      return {
        success: true,
        message,
        data: result,
        suggestedActions: [
          'View updated mood trends',
          'Add context about what changed',
          'Track patterns over time'
        ]
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async findAndDeleteMood(parameters: any): Promise<OperationResult> {
    try {
      // Get recent entries to choose from
      let targetEntry = null

      if (parameters.date_reference === 'today') {
        const todayEntries = await getTodaysMoodEnergy(this.userId)
        targetEntry = todayEntries[0]
      } else if (parameters.date_reference === 'latest' || parameters.date_reference === 'last') {
        const recentEntries = await getMoodEnergyEntries(this.userId, { limit: 1 })
        targetEntry = recentEntries[0]
      } else {
        // Default to most recent entry
        const recentEntries = await getMoodEnergyEntries(this.userId, { limit: 1 })
        targetEntry = recentEntries[0]
      }

      if (!targetEntry) {
        return {
          success: false,
          message: 'No mood entries found to delete',
          suggestedActions: ['Create a mood entry first']
        }
      }

      // Ask for confirmation before deleting
      if (!parameters.confirmed) {
        const entryPreview = this.formatMoodEntryPreview(targetEntry)
        return {
          success: false,
          message: `Are you sure you want to delete this mood entry?\n\n${entryPreview}\n\nThis action cannot be undone.`,
          needsConfirmation: true,
          confirmationPrompt: 'Type "yes" to confirm deletion:',
          suggestedActions: [`Delete mood entry`, 'Cancel deletion']
        }
      }

      return await this.deleteMoodFromChat(targetEntry.id)
    } catch (error) {
      return {
        success: false,
        message: `Failed to find mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async deleteMoodFromChat(entryId: string): Promise<OperationResult> {
    try {
      // Get entry details for confirmation message
      const entries = await getMoodEnergyEntries(this.userId, { limit: 50 })
      const entry = entries.find(e => e.id === entryId)
      const entryDate = entry ? new Date(entry.created_at).toLocaleDateString() : 'Unknown date'

      const success = await deleteMoodEnergyEntry(entryId)

      if (success) {
        return {
          success: true,
          message: `🗑️ Successfully deleted mood entry from ${entryDate}`,
          data: { entryId, entryDate }
        }
      } else {
        return {
          success: false,
          message: 'Failed to delete mood entry. Please try again.'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // =============================================================================
  // MOOD UTILITY METHODS
  // =============================================================================

  /**
   * Analyze mood information from natural language
   */
  private analyzeMoodFromMessage(message: string): {
    suggestedMood: number | null
    suggestedEnergy: number | null
    detectedEmotion: string | null
    extractedNotes: string | null
    suggestedTags: string[]
  } {
    const normalizedMessage = message.toLowerCase()

    // Emotion detection with mood mapping
    const emotionMoodMap: Record<string, number> = {
      // Very positive (8-10)
      'amazing': 9, 'fantastic': 9, 'incredible': 9, 'excellent': 9, 'wonderful': 9,
      'great': 8, 'awesome': 8, 'brilliant': 8, 'outstanding': 8,

      // Positive (6-7)
      'happy': 7, 'good': 7, 'positive': 7, 'cheerful': 7, 'pleased': 7,
      'content': 6, 'satisfied': 6, 'fine': 6, 'okay': 6,

      // Neutral (4-5)
      'neutral': 5, 'average': 5, 'normal': 5, 'meh': 5,

      // Negative (2-3)
      'sad': 3, 'down': 3, 'low': 3, 'disappointed': 3, 'upset': 3,
      'worried': 3, 'anxious': 3, 'stressed': 3, 'tired': 3,

      // Very negative (1-2)
      'terrible': 1, 'awful': 1, 'horrible': 2, 'depressed': 2, 'devastated': 2
    }

    const energyWordMap: Record<string, number> = {
      // High energy (7-10)
      'energetic': 9, 'hyper': 9, 'pumped': 8, 'excited': 8, 'motivated': 8,
      'alert': 7, 'active': 7, 'refreshed': 7,

      // Medium energy (4-6)
      'normal': 5, 'average': 5, 'steady': 5,

      // Low energy (1-3)
      'tired': 2, 'exhausted': 1, 'drained': 1, 'sleepy': 2, 'lethargic': 2,
      'sluggish': 3, 'low': 3
    }

    let suggestedMood: number | null = null
    let suggestedEnergy: number | null = null
    let detectedEmotion: string | null = null

    // Find the strongest emotion match
    for (const [emotion, moodValue] of Object.entries(emotionMoodMap)) {
      if (normalizedMessage.includes(emotion)) {
        suggestedMood = moodValue
        detectedEmotion = emotion
        break
      }
    }

    // Find energy level
    for (const [energyWord, energyValue] of Object.entries(energyWordMap)) {
      if (normalizedMessage.includes(energyWord)) {
        suggestedEnergy = energyValue
        break
      }
    }

    // Extract notes (everything that's not a rating)
    let extractedNotes = message
      .replace(/(?:mood|feeling|energy)\s+(?:of\s+|is\s+)?\d+(?:\/10|\s+out\s+of\s+10)?/gi, '')
      .replace(/\d+\/10/g, '')
      .replace(/(?:i\s+am\s+feeling|feeling|mood:|energy:)/gi, '')
      .trim()

    if (extractedNotes.length < 3) {
      extractedNotes = null
    }

    // Generate tags based on content
    const suggestedTags: string[] = []

    // Activity-based tags
    if (normalizedMessage.includes('work')) suggestedTags.push('work')
    if (normalizedMessage.includes('exercise') || normalizedMessage.includes('workout')) suggestedTags.push('exercise')
    if (normalizedMessage.includes('social') || normalizedMessage.includes('friends')) suggestedTags.push('social')
    if (normalizedMessage.includes('family')) suggestedTags.push('family')
    if (normalizedMessage.includes('health') || normalizedMessage.includes('sick')) suggestedTags.push('health')
    if (normalizedMessage.includes('sleep') || normalizedMessage.includes('rest')) suggestedTags.push('sleep')

    // Mood-based tags
    if (suggestedMood && suggestedMood >= 7) suggestedTags.push('positive')
    if (suggestedMood && suggestedMood <= 3) suggestedTags.push('challenging')
    if (normalizedMessage.includes('stress')) suggestedTags.push('stress')
    if (normalizedMessage.includes('calm') || normalizedMessage.includes('peaceful')) suggestedTags.push('calm')

    return {
      suggestedMood,
      suggestedEnergy,
      detectedEmotion,
      extractedNotes,
      suggestedTags: suggestedTags.slice(0, 5) // Limit to 5 tags
    }
  }

  /**
   * Extract mood context from message
   */
  private extractMoodContext(message: string): any {
    const context: any = {}
    const normalizedMessage = message.toLowerCase()

    // Extract sleep information
    const sleepMatch = normalizedMessage.match(/(\d+)\s*hours?\s*(?:of\s+)?sleep/)
    if (sleepMatch) {
      context.sleep_hours = parseInt(sleepMatch[1], 10)
    }

    // Detect exercise mentions
    if (normalizedMessage.includes('exercise') || normalizedMessage.includes('workout') ||
        normalizedMessage.includes('gym') || normalizedMessage.includes('run')) {
      context.exercise = true
    }

    // Extract activities
    const activities = []
    if (normalizedMessage.includes('work')) activities.push('work')
    if (normalizedMessage.includes('meeting')) activities.push('meeting')
    if (normalizedMessage.includes('presentation')) activities.push('presentation')
    if (normalizedMessage.includes('social')) activities.push('socializing')
    if (normalizedMessage.includes('travel')) activities.push('travel')

    if (activities.length > 0) {
      context.activities = activities
    }

    // Detect weather mentions
    const weatherKeywords = ['sunny', 'rainy', 'cloudy', 'cold', 'hot', 'nice weather', 'bad weather']
    for (const weather of weatherKeywords) {
      if (normalizedMessage.includes(weather)) {
        context.weather = weather
        break
      }
    }

    return context
  }

  /**
   * Generate insights about mood entry
   */
  private generateMoodInsights(moodData: any, analysis: any): { recommendations: string[], highlights: string[] } {
    const recommendations = []
    const highlights = []

    // Mood-based insights
    if (moodData.mood_rating >= 8) {
      highlights.push('Great mood! Consider what contributed to this positive state.')
      recommendations.push('Note what activities or thoughts led to this good mood')
    } else if (moodData.mood_rating <= 3) {
      recommendations.push('Consider what might help improve your mood')
      recommendations.push('Try a mood-boosting activity like a walk or calling a friend')
    }

    // Energy-based insights
    if (moodData.energy_level >= 8) {
      highlights.push('High energy detected! Great time for important tasks.')
    } else if (moodData.energy_level <= 3) {
      recommendations.push('Low energy - consider rest or light activities')
      recommendations.push('Check your sleep and hydration levels')
    }

    // Combination insights
    const moodEnergyGap = Math.abs(moodData.mood_rating - moodData.energy_level)
    if (moodEnergyGap >= 3) {
      if (moodData.mood_rating > moodData.energy_level) {
        highlights.push('High mood but low energy - consider gentle activities')
      } else {
        highlights.push('High energy but low mood - physical activity might help')
      }
    }

    // Context-based insights
    if (moodData.context?.exercise) {
      highlights.push('Exercise noted - great for both mood and energy!')
    }

    if (moodData.context?.sleep_hours) {
      if (moodData.context.sleep_hours < 6) {
        recommendations.push('Low sleep detected - consider prioritizing rest tonight')
      } else if (moodData.context.sleep_hours >= 8) {
        highlights.push('Good sleep noted - likely contributing to your well-being')
      }
    }

    return { recommendations, highlights }
  }

  /**
   * Format mood entry for display
   */
  private formatMoodEntry(entry: any): string {
    const date = new Date(entry.created_at).toLocaleDateString()
    const time = new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const moodIcon = this.getMoodIcon(entry.mood_rating)
    const energyIcon = this.getEnergyIcon(entry.energy_level)

    let formatted = `📅 ${date} ${time} | ${moodIcon} Mood: ${entry.mood_rating}/10 | ${energyIcon} Energy: ${entry.energy_level}/10`

    if (entry.notes) {
      formatted += `\n   "${entry.notes}"`
    }

    if (entry.tags && entry.tags.length > 0) {
      formatted += ` #${entry.tags.join(' #')}`
    }

    return formatted
  }

  /**
   * Format mood entry preview for deletion confirmation
   */
  private formatMoodEntryPreview(entry: any): string {
    const date = new Date(entry.created_at).toLocaleDateString()
    const moodIcon = this.getMoodIcon(entry.mood_rating)
    const energyIcon = this.getEnergyIcon(entry.energy_level)

    return `${date} | ${moodIcon} ${entry.mood_rating}/10 | ${energyIcon} ${entry.energy_level}/10${entry.notes ? ` | "${entry.notes}"` : ''}`
  }

  /**
   * Get mood icon based on rating
   */
  private getMoodIcon(rating: number): string {
    if (rating >= 9) return '😄'
    if (rating >= 7) return '😊'
    if (rating >= 6) return '🙂'
    if (rating >= 4) return '😐'
    if (rating >= 3) return '😔'
    return '😢'
  }

  /**
   * Get energy icon based on level
   */
  private getEnergyIcon(level: number): string {
    if (level >= 8) return '⚡'
    if (level >= 6) return '🔋'
    if (level >= 4) return '🔋'
    if (level >= 2) return '🪫'
    return '😴'
  }

  /**
   * Check if this is a mood trend analysis query
   */
  private isMoodTrendQuery(message: string): boolean {
    const trendKeywords = [
      'trend', 'trends', 'pattern', 'patterns', 'history', 'over time',
      'analytics', 'analysis', 'how has my mood', 'mood been', 'tracking',
      'progress', 'improvement', 'declining', 'getting better', 'getting worse'
    ]

    const normalizedMessage = message.toLowerCase()
    return trendKeywords.some(keyword => normalizedMessage.includes(keyword))
  }

  /**
   * Get trend icon for mood/energy trends
   */
  private getMoodTrendIcon(trend: string): string {
    switch (trend) {
      case 'improving': return '📈'
      case 'declining': return '📉'
      case 'stable': return '➡️'
      default: return ''
    }
  }

  /**
   * Get appropriate message when no mood entries found
   */
  private getNoMoodEntriesMessage(parameters: any): string {
    if (parameters.timeframe) {
      return `No mood entries found from ${parameters.timeframe}.`
    }
    if (parameters.days) {
      return `No mood entries found from the last ${parameters.days} days.`
    }
    return 'You have no mood entries yet.'
  }

  /**
   * Get suggestions for mood view actions
   */
  private getMoodViewSuggestions(stats: any, patterns: any): string[] {
    const suggestions = []

    // Based on mood trends
    if (stats.moodTrend === 'declining') {
      suggestions.push('Consider what might be affecting your mood lately')
      suggestions.push('Try mood-boosting activities')
    } else if (stats.moodTrend === 'improving') {
      suggestions.push('Keep doing what you\'re doing!')
    }

    // Based on energy trends
    if (stats.energyTrend === 'declining') {
      suggestions.push('Review your sleep and exercise habits')
    }

    // Based on patterns
    if (patterns.patterns.length > 0) {
      suggestions.push('Review the patterns identified in your mood data')
    }

    // General suggestions
    suggestions.push('Log your current mood and energy')
    suggestions.push('Track mood patterns over time')

    return suggestions.slice(0, 5)
  }

  // =============================================================================
  // ROUTINE OPERATIONS
  // =============================================================================

  private async handleRoutineOperation(operation: ParsedEntityOperation): Promise<OperationResult> {
    const { intent, parameters, entityId, originalMessage } = operation

    // Add originalMessage to parameters for context
    const enhancedParameters = { ...parameters, originalMessage }

    switch (intent) {
      case 'create':
        return await this.createRoutineFromChat(enhancedParameters)

      case 'view':
        return await this.viewRoutineFromChat(enhancedParameters)

      case 'update':
        if (!entityId) {
          return await this.findAndUpdateRoutine(enhancedParameters)
        }
        return await this.updateRoutineFromChat(entityId, enhancedParameters)

      case 'delete':
        if (!entityId) {
          return await this.findAndDeleteRoutine(enhancedParameters)
        }
        return await this.deleteRoutineFromChat(entityId)

      default:
        return {
          success: false,
          message: `Routine operation '${intent}' is not supported yet`
        }
    }
  }

  private async createRoutineFromChat(parameters: any): Promise<OperationResult> {
    try {
      const originalMessage = parameters.originalMessage || ''

      // Basic routine data with reasonable defaults
      const routineData = {
        name: parameters.name || this.extractRoutineNameFromMessage(originalMessage),
        description: parameters.description || `Custom routine created from: "${originalMessage}"`,
        category: parameters.category || this.inferRoutineCategory(originalMessage),
        routine_type: parameters.routine_type || 'daily',
        steps: parameters.steps || this.generateBasicSteps(originalMessage),
        estimated_duration: parameters.estimated_duration || 10, // 10 minutes default
        preferred_time_of_day: parameters.preferred_time_of_day
      }

      // Validate required fields
      if (!routineData.name) {
        return {
          success: false,
          message: 'I need a name for your routine. Try: "Create morning routine called Daily Energy"'
        }
      }

      const routine = await RoutinesService.createUserRoutine(this.userId, routineData)

      return {
        success: true,
        message: `✅ Created routine "${routine.name}" with ${routine.steps.length} steps`,
        data: routine,
        suggestedActions: [
          'Start your first session',
          'Customize the routine steps',
          'Set a daily schedule'
        ]
      }
    } catch (error) {
      console.error('Error creating routine from chat:', error)
      return {
        success: false,
        message: 'Failed to create routine. Please try again or check your input.'
      }
    }
  }

  private async viewRoutineFromChat(parameters: any): Promise<OperationResult> {
    try {
      const routines = await RoutinesService.getUserRoutines(this.userId, {
        is_active: true
      })

      if (routines.length === 0) {
        return {
          success: true,
          message: 'You have no routines yet. Create your first routine to get started!',
          suggestedActions: [
            'Create morning routine',
            'Add evening routine',
            'Try "Create routine for better sleep"'
          ]
        }
      }

      const routineList = routines.slice(0, 5).map(routine =>
        `📋 **${routine.name}** (${routine.steps.length} steps, ~${routine.estimated_duration}min)`
      ).join('\n')

      return {
        success: true,
        message: `🔄 Your Active Routines:\n\n${routineList}${routines.length > 5 ? `\n\n... and ${routines.length - 5} more routines` : ''}`,
        data: routines,
        suggestedActions: [
          'Start a routine session',
          'View routine details',
          'Create a new routine'
        ]
      }
    } catch (error) {
      console.error('Error viewing routines from chat:', error)
      return {
        success: false,
        message: 'Failed to retrieve routines. Please try again.'
      }
    }
  }

  private async updateRoutineFromChat(routineId: string, parameters: any): Promise<OperationResult> {
    try {
      const updates: any = {}

      if (parameters.name) updates.name = parameters.name
      if (parameters.description) updates.description = parameters.description
      if (parameters.steps) updates.steps = parameters.steps

      const routine = await RoutinesService.updateUserRoutine(this.userId, routineId, updates)

      return {
        success: true,
        message: `✅ Updated routine "${routine.name}"`,
        data: routine
      }
    } catch (error) {
      console.error('Error updating routine from chat:', error)
      return {
        success: false,
        message: 'Failed to update routine. Please try again.'
      }
    }
  }

  private async deleteRoutineFromChat(routineId: string): Promise<OperationResult> {
    try {
      await RoutinesService.deleteUserRoutine(this.userId, routineId)

      return {
        success: true,
        message: '🗑️ Routine deleted successfully',
        needsConfirmation: true,
        confirmationPrompt: 'Are you sure you want to delete this routine? This action cannot be undone.'
      }
    } catch (error) {
      console.error('Error deleting routine from chat:', error)
      return {
        success: false,
        message: 'Failed to delete routine. Please try again.'
      }
    }
  }

  private async findAndUpdateRoutine(parameters: any): Promise<OperationResult> {
    return {
      success: false,
      message: 'Please specify which routine to update. Try: "Update my morning routine"'
    }
  }

  private async findAndDeleteRoutine(parameters: any): Promise<OperationResult> {
    return {
      success: false,
      message: 'Please specify which routine to delete. Try: "Delete my evening routine"'
    }
  }

  // Helper methods for routine operations
  private extractRoutineNameFromMessage(message: string): string | null {
    const patterns = [
      /(?:create|add|new)\s+(?:a\s+)?(?:routine\s+)?(?:called|named)\s+["']([^"']+)["']/i,
      /(?:create|add|new)\s+(?:a\s+)?(.+?)\s+routine/i,
      /(?:routine\s+for\s+)(.+)/i,
      /(.+?)\s+routine/i
    ]

    for (const pattern of patterns) {
      const match = pattern.exec(message)
      if (match && match[1].trim().length > 2) {
        return match[1].trim()
      }
    }

    return null
  }

  private inferRoutineCategory(message: string): string {
    const categories = {
      'Morning': ['morning', 'wake up', 'start', 'begin'],
      'Evening': ['evening', 'night', 'sleep', 'bed', 'end'],
      'Exercise': ['workout', 'exercise', 'fitness', 'gym', 'run'],
      'Meditation': ['meditation', 'mindfulness', 'breathe', 'calm'],
      'Work': ['work', 'productivity', 'focus', 'study'],
      'Health': ['health', 'wellness', 'nutrition', 'eating']
    }

    const normalizedMessage = message.toLowerCase()

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => normalizedMessage.includes(keyword))) {
        return category
      }
    }

    return 'General'
  }

  private generateBasicSteps(message: string): any[] {
    // Generate basic steps based on routine type
    const normalizedMessage = message.toLowerCase()

    if (normalizedMessage.includes('morning')) {
      return [
        { id: crypto.randomUUID(), name: 'Wake up', duration: 60, order: 1 },
        { id: crypto.randomUUID(), name: 'Stretch or light exercise', duration: 300, order: 2 },
        { id: crypto.randomUUID(), name: 'Prepare for the day', duration: 600, order: 3 }
      ]
    }

    if (normalizedMessage.includes('evening')) {
      return [
        { id: crypto.randomUUID(), name: 'Reflect on the day', duration: 300, order: 1 },
        { id: crypto.randomUUID(), name: 'Prepare for tomorrow', duration: 300, order: 2 },
        { id: crypto.randomUUID(), name: 'Wind down', duration: 600, order: 3 }
      ]
    }

    // Generic routine steps
    return [
      { id: crypto.randomUUID(), name: 'Begin routine', duration: 60, order: 1 },
      { id: crypto.randomUUID(), name: 'Main activity', duration: 480, order: 2 },
      { id: crypto.randomUUID(), name: 'Complete routine', duration: 60, order: 3 }
    ]
  }

  // =============================================================================
  // BELIEF OPERATIONS
  // =============================================================================

  private async handleBeliefOperation(operation: ParsedEntityOperation): Promise<OperationResult> {
    const { intent, parameters, entityId, originalMessage } = operation

    // Add originalMessage to parameters for context
    const enhancedParameters = { ...parameters, originalMessage }

    switch (intent) {
      case 'create':
        return await this.createBeliefFromChat(enhancedParameters)

      case 'view':
        return await this.viewBeliefsFromChat(enhancedParameters)

      case 'update':
        if (!entityId) {
          return await this.findAndUpdateBelief(enhancedParameters)
        }
        return await this.updateBeliefFromChat(entityId, enhancedParameters)

      case 'delete':
        if (!entityId) {
          return await this.findAndDeleteBelief(enhancedParameters)
        }
        return await this.deleteBeliefFromChat(entityId)

      default:
        return {
          success: false,
          message: `Belief operation '${intent}' is not supported yet`
        }
    }
  }

  private async createBeliefFromChat(parameters: any): Promise<OperationResult> {
    try {
      const originalMessage = parameters.originalMessage || ''
      const beliefStatement = this.extractBeliefStatement(originalMessage)

      if (!beliefStatement) {
        return {
          success: false,
          message: 'I need a belief statement. Try: "Add belief: I am capable of achieving my goals"'
        }
      }

      // Create a custom belief system first
      const beliefSystem = await BeliefsService.createBeliefSystem(this.userId, {
        title: parameters.title || `Custom Belief: ${beliefStatement.substring(0, 50)}...`,
        description: `Belief system created from: "${originalMessage}"`,
        category: parameters.category || 'Personal Growth',
        belief_statement: beliefStatement,
        affirmations: [
          beliefStatement,
          `I believe ${beliefStatement.toLowerCase()}`,
          `Every day, ${beliefStatement.toLowerCase()}`
        ],
        visualization_script: this.generateVisualizationScript(beliefStatement),
        cycle_length: 21, // Standard 21-day belief installation
        is_public: false
      })

      // Create a belief cycle for the user
      const beliefCycle = await BeliefsService.createBeliefCycle(this.userId, {
        belief_system_id: beliefSystem.id,
        personal_belief_statement: beliefStatement,
        personal_reason: parameters.reason || 'Personal growth and empowerment',
        target_belief_strength: 10
      })

      return {
        success: true,
        message: `✅ Started belief work: "${beliefStatement}"\n🎯 21-day program created to strengthen this belief`,
        data: beliefCycle,
        suggestedActions: [
          'Start today\'s belief activities',
          'Set a daily reminder',
          'Track your progress'
        ]
      }
    } catch (error) {
      console.error('Error creating belief from chat:', error)
      return {
        success: false,
        message: 'Failed to create belief program. Please try again.'
      }
    }
  }

  private async viewBeliefsFromChat(parameters: any): Promise<OperationResult> {
    try {
      const beliefCycles = await BeliefsService.getUserBeliefCycles(this.userId, {
        status: ['active']
      })

      if (beliefCycles.length === 0) {
        return {
          success: true,
          message: 'You have no active belief programs yet. Start strengthening your mindset!',
          suggestedActions: [
            'Add belief: I am confident',
            'Create belief: I deserve success',
            'Try "Add belief: I am capable of growth"'
          ]
        }
      }

      const beliefList = beliefCycles.slice(0, 5).map(cycle =>
        `🧠 **${cycle.personal_belief_statement}**\n   Day ${cycle.current_day} of 21 • ${cycle.days_completed} days completed`
      ).join('\n\n')

      return {
        success: true,
        message: `💫 Your Active Belief Programs:\n\n${beliefList}${beliefCycles.length > 5 ? `\n\n... and ${beliefCycles.length - 5} more programs` : ''}`,
        data: beliefCycles,
        suggestedActions: [
          'Do today\'s belief activities',
          'Check belief progress',
          'Add a new belief'
        ]
      }
    } catch (error) {
      console.error('Error viewing beliefs from chat:', error)
      return {
        success: false,
        message: 'Failed to retrieve belief programs. Please try again.'
      }
    }
  }

  private async updateBeliefFromChat(cycleId: string, parameters: any): Promise<OperationResult> {
    try {
      const updates: any = {}

      if (parameters.personal_belief_statement) {
        updates.personal_belief_statement = parameters.personal_belief_statement
      }
      if (parameters.personal_reason) {
        updates.personal_reason = parameters.personal_reason
      }

      const cycle = await BeliefsService.updateBeliefCycle(this.userId, cycleId, updates)

      return {
        success: true,
        message: `✅ Updated belief program: "${cycle.personal_belief_statement}"`,
        data: cycle
      }
    } catch (error) {
      console.error('Error updating belief from chat:', error)
      return {
        success: false,
        message: 'Failed to update belief program. Please try again.'
      }
    }
  }

  private async deleteBeliefFromChat(cycleId: string): Promise<OperationResult> {
    return {
      success: true,
      message: '🗑️ Belief program archived successfully',
      needsConfirmation: true,
      confirmationPrompt: 'Are you sure you want to archive this belief program? Your progress will be saved but the program will be paused.'
    }
  }

  private async findAndUpdateBelief(parameters: any): Promise<OperationResult> {
    return {
      success: false,
      message: 'Please specify which belief to update. Try: "Update my confidence belief"'
    }
  }

  private async findAndDeleteBelief(parameters: any): Promise<OperationResult> {
    return {
      success: false,
      message: 'Please specify which belief to delete. Try: "Delete my success belief"'
    }
  }

  // Helper methods for belief operations
  private extractBeliefStatement(message: string): string | null {
    const patterns = [
      /(?:add|create|new)\s+belief\s*:\s*(.+)/i,
      /(?:belief\s+that\s+)(.+)/i,
      /(?:believe\s+that\s+)(.+)/i,
      /(?:i\s+am\s+)(.+)/i
    ]

    for (const pattern of patterns) {
      const match = pattern.exec(message)
      if (match && match[1].trim().length > 3) {
        let statement = match[1].trim()

        // Clean up the statement
        statement = statement.replace(/[.!?]+$/, '') // Remove trailing punctuation

        // Ensure it starts with "I am" or similar
        if (!statement.toLowerCase().startsWith('i ')) {
          statement = `I am ${statement}`
        }

        return statement
      }
    }

    return null
  }

  private generateVisualizationScript(beliefStatement: string): any {
    return {
      title: `Visualizing: ${beliefStatement}`,
      duration_minutes: 5,
      script: `Close your eyes and take three deep breaths. Imagine yourself fully embodying the belief: "${beliefStatement}". See yourself acting with complete confidence in this truth. Feel the positive emotions this brings. Notice how others respond to your authentic self. Hold this vision for a moment, knowing that this belief is becoming stronger within you each day.`,
      background_music: 'calm',
      guided_length: 'short'
    }
  }

  // =============================================================================
  // SYNCHRONICITY OPERATIONS
  // =============================================================================

  private async handleSynchronicityOperation(operation: ParsedEntityOperation): Promise<OperationResult> {
    const { intent, parameters, entityId, originalMessage } = operation

    // Add originalMessage to parameters for context
    const enhancedParameters = { ...parameters, originalMessage }

    switch (intent) {
      case 'create':
        return await this.createSynchronicityFromChat(enhancedParameters)

      case 'view':
        return await this.viewSynchronicitiesFromChat(enhancedParameters)

      default:
        return {
          success: false,
          message: `Synchronicity operation '${intent}' is not supported yet`
        }
    }
  }

  private async createSynchronicityFromChat(parameters: any): Promise<OperationResult> {
    try {
      const originalMessage = parameters.originalMessage || ''
      const synchronicityService = new SynchronicityService(this.userId)

      // Extract synchronicity details from the message
      const syncDetails = this.extractSynchronicityDetails(originalMessage)

      if (!syncDetails.title) {
        return {
          success: false,
          message: 'I need more details about the synchronicity. Try: "Log synch: saw 11:11 everywhere today"'
        }
      }

      const synchronicityData = {
        title: syncDetails.title,
        description: syncDetails.description || originalMessage,
        date: new Date(),
        tags: syncDetails.tags,
        significance: syncDetails.significance || 7, // Default significance
        context: syncDetails.context,
        emotions: syncDetails.emotions || ['wonder', 'curious'],
        patterns: []
      }

      const entry = await synchronicityService.createEntry(synchronicityData)

      return {
        success: true,
        message: `✨ Logged synchronicity: "${entry.title}"\n🎯 Significance: ${entry.significance}/10`,
        data: entry,
        suggestedActions: [
          'View your synchronicity patterns',
          'Log another synchronicity',
          'Reflect on the meaning'
        ]
      }
    } catch (error) {
      console.error('Error creating synchronicity from chat:', error)
      return {
        success: false,
        message: 'Failed to log synchronicity. Please try again.'
      }
    }
  }

  private async viewSynchronicitiesFromChat(parameters: any): Promise<OperationResult> {
    try {
      const synchronicityService = new SynchronicityService(this.userId)
      const entries = await synchronicityService.getRecentEntries(10)

      if (entries.length === 0) {
        return {
          success: true,
          message: 'You haven\'t logged any synchronicities yet. Start noticing the meaningful patterns in your life!',
          suggestedActions: [
            'Log synch: 11:11 everywhere',
            'Record synch: perfect timing',
            'Try "Log synchronicity about meeting someone special"'
          ]
        }
      }

      const syncList = entries.slice(0, 5).map(entry =>
        `✨ **${entry.title}** (${entry.significance}/10)\n   ${entry.description.substring(0, 100)}${entry.description.length > 100 ? '...' : ''}`
      ).join('\n\n')

      return {
        success: true,
        message: `🌟 Your Recent Synchronicities:\n\n${syncList}${entries.length > 5 ? `\n\n... and ${entries.length - 5} more synchronicities` : ''}`,
        data: entries,
        suggestedActions: [
          'Log a new synchronicity',
          'View synchronicity patterns',
          'Explore deeper meanings'
        ]
      }
    } catch (error) {
      console.error('Error viewing synchronicities from chat:', error)
      return {
        success: false,
        message: 'Failed to retrieve synchronicities. Please try again.'
      }
    }
  }

  // Helper methods for synchronicity operations
  private extractSynchronicityDetails(message: string): {
    title: string | null,
    description: string | null,
    tags: string[],
    significance: number | null,
    context: string | null,
    emotions: string[] | null
  } {
    const normalizedMessage = message.toLowerCase()

    // Extract title patterns
    let title = null
    const titlePatterns = [
      /(?:log|record|saw)\s+(?:synch|synchronicity)\s*:\s*(.+)/i,
      /(?:synch|synchronicity)\s+about\s+(.+)/i,
      /(?:noticed|saw|experienced)\s+(.+?)\s+(?:synchronicity|synch)/i
    ]

    for (const pattern of titlePatterns) {
      const match = pattern.exec(message)
      if (match && match[1].trim().length > 3) {
        title = match[1].trim()
        break
      }
    }

    // Extract significance (if mentioned)
    let significance = null
    const significancePattern = /(\d+)\/10/i
    const sigMatch = significancePattern.exec(message)
    if (sigMatch) {
      significance = parseInt(sigMatch[1], 10)
    }

    // Infer tags from common synchronicity types
    const tags = []
    if (normalizedMessage.includes('11:11') || normalizedMessage.includes('number')) {
      tags.push('numbers')
    }
    if (normalizedMessage.includes('dream') || normalizedMessage.includes('vision')) {
      tags.push('dreams')
    }
    if (normalizedMessage.includes('animal') || normalizedMessage.includes('bird')) {
      tags.push('animals')
    }
    if (normalizedMessage.includes('person') || normalizedMessage.includes('meeting')) {
      tags.push('people')
    }
    if (normalizedMessage.includes('timing') || normalizedMessage.includes('perfect')) {
      tags.push('timing')
    }

    // Infer emotions
    let emotions = null
    if (normalizedMessage.includes('amazed') || normalizedMessage.includes('wow')) {
      emotions = ['amazed', 'wonder']
    } else if (normalizedMessage.includes('weird') || normalizedMessage.includes('strange')) {
      emotions = ['curious', 'puzzled']
    }

    return {
      title,
      description: title ? message : null,
      tags,
      significance,
      context: null, // Could be extracted from more complex patterns
      emotions
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private getSuggestedCorrections(operation: ParsedEntityOperation, errors: string[]): string[] {
    const suggestions: string[] = []

    errors.forEach(error => {
      if (error.includes('name') || error.includes('title')) {
        suggestions.push('Please provide a name for your ' + operation.entityType)
      }
      if (error.includes('content')) {
        suggestions.push('Please provide content for your journal entry')
      }
      if (error.includes('mood_rating')) {
        suggestions.push('Please provide a mood rating from 1-10')
      }
    })

    return suggestions
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = []
    const len1 = str1.length
    const len2 = str2.length

    // If one string is empty, return similarity based on the other's length
    if (len1 === 0) return len2 === 0 ? 1 : 0
    if (len2 === 0) return 0

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + cost // substitution
        )
      }
    }

    // Convert distance to similarity (0-1 scale)
    const maxLen = Math.max(len1, len2)
    return 1 - (matrix[len1][len2] / maxLen)
  }

  private async toggleHabitFromChat(parameters: any): Promise<OperationResult> {
    if (!parameters.name) {
      return {
        success: false,
        message: 'Please specify which habit you want to toggle',
        suggestedActions: ['Provide the habit name', 'Use "toggle [habit name]"']
      }
    }

    const habits = await getUserHabits(this.userId)
    const searchTerm = parameters.name.toLowerCase()

    // Try exact match first
    let targetHabit = habits.find(h => h.name.toLowerCase() === searchTerm)

    // If no exact match, try partial match
    if (!targetHabit) {
      targetHabit = habits.find(h => h.name.toLowerCase().includes(searchTerm))
    }

    // If still no match, try keyword matching
    if (!targetHabit) {
      const searchWords = searchTerm.split(/\s+/)
      targetHabit = habits.find(h => {
        const habitWords = h.name.toLowerCase().split(/\s+/)
        return searchWords.some(word => habitWords.some(habitWord => habitWord.includes(word)))
      })
    }

    if (!targetHabit) {
      const similarHabits = habits.filter(h => {
        const similarity = this.calculateSimilarity(h.name.toLowerCase(), searchTerm)
        return similarity > 0.3
      }).slice(0, 3)

      return {
        success: false,
        message: `Could not find a habit matching "${parameters.name}"`,
        suggestedActions: similarHabits.length > 0
          ? similarHabits.map(h => `Toggle "${h.name}" instead?`)
          : ['Check your habit list', 'View all habits first']
      }
    }

    try {
      const success = await toggleHabitCompletion(targetHabit.id, this.userId)

      if (success) {
        // Check current completion status to provide appropriate message
        const completions = await getTodayCompletions(this.userId)
        const isCompleted = completions.some(c => c.habit_id === targetHabit.id)

        return {
          success: true,
          message: isCompleted
            ? `✅ Marked "${targetHabit.name}" as completed for today!`
            : `↩️ Undid today's completion for "${targetHabit.name}"`,
          data: {
            habitId: targetHabit.id,
            habitName: targetHabit.name,
            isCompleted
          }
        }
      } else {
        return {
          success: false,
          message: `Failed to toggle completion for "${targetHabit.name}". Please try again.`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to toggle habit completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async viewHabitsFromChat(parameters: any): Promise<OperationResult> {
    try {
      const habits = await getUserHabits(this.userId)

      if (habits.length === 0) {
        return {
          success: true,
          message: 'You have no habits yet. Create your first habit to get started!',
          suggestedActions: [
            'Add a new habit like "Add habit drink water daily"',
            'Create a morning routine habit',
            'Start with a simple habit'
          ]
        }
      }

      // Get today's completions
      const todayCompletions = await getTodayCompletions(this.userId)
      const completedHabitIds = new Set(todayCompletions.map(c => c.habit_id))

      // Get streak data for each habit
      const habitsWithStreaks = await Promise.all(
        habits.map(async (habit) => {
          const streak = await calculateStreak(habit.id, this.userId)
          const isCompletedToday = completedHabitIds.has(habit.id)

          return {
            ...habit,
            streak,
            isCompletedToday,
            streakDisplay: this.formatStreakDisplay(streak, isCompletedToday)
          }
        })
      )

      // Sort by streak health and completion status
      habitsWithStreaks.sort((a, b) => {
        // Completed habits first
        if (a.isCompletedToday !== b.isCompletedToday) {
          return a.isCompletedToday ? -1 : 1
        }
        // Then by current streak (highest first)
        return b.streak.current_streak - a.streak.current_streak
      })

      // Create a formatted summary
      const completedToday = habitsWithStreaks.filter(h => h.isCompletedToday).length
      const totalHabits = habits.length
      const completionRate = Math.round((completedToday / totalHabits) * 100)

      // Generate insights
      const insights = this.generateHabitInsights(habitsWithStreaks)

      let message = `📊 Your Habits (${completedToday}/${totalHabits} completed today - ${completionRate}%)\n\n`

      if (parameters.showStreaks || parameters.detailed) {
        message += habitsWithStreaks.map(habit => {
          const status = habit.isCompletedToday ? '✅' : '⭕'
          const streakIcon = this.getStreakIcon(habit.streak)
          return `${status} ${habit.name} ${streakIcon} ${habit.streakDisplay}`
        }).join('\n')
      } else {
        message += habitsWithStreaks.slice(0, 5).map(habit => {
          const status = habit.isCompletedToday ? '✅' : '⭕'
          return `${status} ${habit.name} (${habit.streak.current_streak} day streak)`
        }).join('\n')

        if (habits.length > 5) {
          message += `\n... and ${habits.length - 5} more habits`
        }
      }

      return {
        success: true,
        message,
        data: {
          habits: habitsWithStreaks,
          summary: {
            total: totalHabits,
            completed_today: completedToday,
            completion_rate: completionRate
          },
          insights
        },
        suggestedActions: insights.recommendations
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve habits: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Format streak display for a habit
   */
  private formatStreakDisplay(streak: any, isCompletedToday: boolean): string {
    const { current_streak, longest_streak, streak_health, next_milestone } = streak

    let display = `${current_streak} day streak`

    if (longest_streak > current_streak) {
      display += ` (best: ${longest_streak})`
    }

    if (next_milestone && next_milestone <= current_streak + 7) {
      display += ` • ${next_milestone - current_streak} to milestone`
    }

    const healthIcon = {
      'excellent': '🔥',
      'good': '👍',
      'warning': '⚠️',
      'critical': '🆘'
    }[streak_health] || ''

    return `${display} ${healthIcon}`
  }

  /**
   * Get appropriate streak icon based on streak data
   */
  private getStreakIcon(streak: any): string {
    if (streak.current_streak >= 30) return '🏆'
    if (streak.current_streak >= 14) return '🔥'
    if (streak.current_streak >= 7) return '⭐'
    if (streak.current_streak >= 3) return '💪'
    return '🌱'
  }

  /**
   * Generate insights about user's habit performance
   */
  private generateHabitInsights(habitsWithStreaks: any[]): { recommendations: string[], highlights: string[] } {
    const recommendations = []
    const highlights = []

    const totalHabits = habitsWithStreaks.length
    const completedToday = habitsWithStreaks.filter(h => h.isCompletedToday).length
    const atRiskHabits = habitsWithStreaks.filter(h => h.streak.is_at_risk).length
    const excellentHabits = habitsWithStreaks.filter(h => h.streak.streak_health === 'excellent').length

    // Completion rate insights
    const completionRate = (completedToday / totalHabits) * 100
    if (completionRate === 100) {
      highlights.push('Perfect day! All habits completed')
    } else if (completionRate >= 80) {
      highlights.push('Great progress today!')
      recommendations.push('Just a few more habits to complete the day')
    } else if (completionRate >= 50) {
      recommendations.push('Good start! Try to complete a few more habits')
    } else {
      recommendations.push('Focus on completing at least one more habit today')
    }

    // Streak insights
    if (excellentHabits > 0) {
      highlights.push(`${excellentHabits} habits with excellent streaks`)
    }

    if (atRiskHabits > 0) {
      recommendations.push(`${atRiskHabits} habits need attention to maintain streaks`)
    }

    // Best performing habit
    const bestStreak = Math.max(...habitsWithStreaks.map(h => h.streak.current_streak))
    if (bestStreak >= 7) {
      const bestHabit = habitsWithStreaks.find(h => h.streak.current_streak === bestStreak)
      highlights.push(`${bestHabit.name} has your best streak (${bestStreak} days)`)
    }

    return { recommendations, highlights }
  }

  private async findAndDeleteHabit(parameters: any): Promise<OperationResult> {
    if (!parameters.name) {
      return {
        success: false,
        message: 'Please specify which habit you want to delete',
        suggestedActions: ['Provide the habit name', 'Use "delete habit called [name]"']
      }
    }

    const habits = await getUserHabits(this.userId)
    const searchTerm = parameters.name.toLowerCase()

    // Try exact match first
    let targetHabit = habits.find(h => h.name.toLowerCase() === searchTerm)

    // If no exact match, try partial match
    if (!targetHabit) {
      targetHabit = habits.find(h => h.name.toLowerCase().includes(searchTerm))
    }

    // If still no match, try keyword matching
    if (!targetHabit) {
      const searchWords = searchTerm.split(/\s+/)
      targetHabit = habits.find(h => {
        const habitWords = h.name.toLowerCase().split(/\s+/)
        return searchWords.some(word => habitWords.some(habitWord => habitWord.includes(word)))
      })
    }

    if (!targetHabit) {
      const similarHabits = habits.filter(h => {
        const similarity = this.calculateSimilarity(h.name.toLowerCase(), searchTerm)
        return similarity > 0.3
      }).slice(0, 3)

      return {
        success: false,
        message: `Could not find a habit matching "${parameters.name}"`,
        suggestedActions: similarHabits.length > 0
          ? similarHabits.map(h => `Delete "${h.name}" instead?`)
          : ['Check your habit list', 'View all habits first']
      }
    }

    // Ask for confirmation before deleting (since this is destructive)
    if (!parameters.confirmed) {
      return {
        success: false,
        message: `Are you sure you want to delete "${targetHabit.name}"? This action cannot be undone.`,
        needsConfirmation: true,
        confirmationPrompt: 'Type "yes" to confirm deletion:',
        suggestedActions: [`Delete "${targetHabit.name}"`, 'Cancel deletion']
      }
    }

    return await this.deleteHabitFromChat(targetHabit.id)
  }

  private async deleteHabitFromChat(habitId: string): Promise<OperationResult> {
    try {
      // Get habit name for confirmation message
      const habits = await getUserHabits(this.userId)
      const habit = habits.find(h => h.id === habitId)
      const habitName = habit ? habit.name : 'Unknown habit'

      const success = await deleteHabit(habitId)

      if (success) {
        return {
          success: true,
          message: `🗑️ Successfully deleted habit "${habitName}"`,
          data: { habitId, habitName }
        }
      } else {
        return {
          success: false,
          message: 'Failed to delete habit. Please try again.'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete habit: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async findAndUpdateGoal(parameters: any): Promise<OperationResult> {
    if (!parameters.title && !parameters.name) {
      return {
        success: false,
        message: 'Please specify which goal you want to update',
        suggestedActions: ['Provide the goal title', 'Use "update goal called [name]"']
      }
    }

    const goals = await GoalsService.getGoals(this.userId, {})
    const searchTerm = (parameters.title || parameters.name).toLowerCase()

    // Try exact match first
    let targetGoal = goals.find(g => g.title.toLowerCase() === searchTerm)

    // If no exact match, try partial match
    if (!targetGoal) {
      targetGoal = goals.find(g => g.title.toLowerCase().includes(searchTerm))
    }

    // If still no match, try keyword matching
    if (!targetGoal) {
      const searchWords = searchTerm.split(/\s+/)
      targetGoal = goals.find(g => {
        const goalWords = g.title.toLowerCase().split(/\s+/)
        return searchWords.some(word => goalWords.some(goalWord => goalWord.includes(word)))
      })
    }

    if (!targetGoal) {
      const similarGoals = goals.filter(g => {
        const similarity = this.calculateSimilarity(g.title.toLowerCase(), searchTerm)
        return similarity > 0.3
      }).slice(0, 3)

      return {
        success: false,
        message: `Could not find a goal matching "${parameters.title || parameters.name}"`,
        suggestedActions: similarGoals.length > 0
          ? similarGoals.map(g => `Update "${g.title}" instead?`)
          : ['Check your goal list', 'Create a new goal instead?']
      }
    }

    // If we have multiple potential matches, ask for confirmation
    const potentialMatches = goals.filter(g => g.title.toLowerCase().includes(searchTerm))
    if (potentialMatches.length > 1 && !parameters.confirmed) {
      return {
        success: false,
        message: `Found multiple goals matching "${parameters.title || parameters.name}". Which one did you mean?`,
        needsConfirmation: true,
        confirmationPrompt: 'Please specify which goal to update:',
        suggestedActions: potentialMatches.map(g => `Update "${g.title}"`)
      }
    }

    return await this.updateGoalFromChat(targetGoal.id, parameters)
  }

  private async updateGoalFromChat(goalId: string, parameters: any): Promise<OperationResult> {
    try {
      // Build update data, excluding search terms
      const updateData: any = {}

      // Progress percentage update
      if (parameters.progress_percentage !== undefined) {
        updateData.progress_percentage = Math.max(0, Math.min(100, parameters.progress_percentage))
      }

      // Progress value update (if target_value exists)
      if (parameters.progress_value !== undefined) {
        const goal = await GoalsService.getGoal(this.userId, goalId)
        if (goal && goal.target_value) {
          const newCurrentValue = (goal.current_value || 0) + parameters.progress_value
          updateData.current_value = newCurrentValue
          updateData.progress_percentage = Math.min(100, Math.round((newCurrentValue / goal.target_value) * 100))
        }
      }

      // Direct field updates
      if (parameters.target_date) updateData.target_date = new Date(parameters.target_date)
      if (parameters.priority) updateData.priority = parameters.priority
      if (parameters.status) updateData.status = parameters.status
      if (parameters.description) updateData.description = parameters.description
      if (parameters.notes) updateData.notes = parameters.notes

      // Milestone updates
      if (parameters.milestones) updateData.milestones = parameters.milestones

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          message: 'No valid updates provided. You can update progress, target date, priority, status, description, or notes.'
        }
      }

      const result = await GoalsService.updateGoal(this.userId, goalId, updateData)

      // Generate progress insights
      const progressInsight = this.generateProgressInsight(result)

      return {
        success: true,
        message: `🎯 Updated goal "${result.title}" successfully! ${progressInsight}`,
        data: result,
        suggestedActions: this.getGoalSuggestedActions(result)
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update goal: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async viewGoalsFromChat(parameters: any): Promise<OperationResult> {
    try {
      // Build filters based on parameters
      const filters: any = {}

      if (parameters.status) {
        filters.status = Array.isArray(parameters.status) ? parameters.status : [parameters.status]
      } else {
        // Show active goals by default
        filters.status = ['active']
      }

      if (parameters.category) {
        filters.category = Array.isArray(parameters.category) ? parameters.category : [parameters.category]
      }

      if (parameters.goal_type) {
        filters.goal_type = Array.isArray(parameters.goal_type) ? parameters.goal_type : [parameters.goal_type]
      }

      if (parameters.due_soon) {
        filters.due_soon = true
      }

      if (parameters.overdue) {
        filters.overdue = true
      }

      const goals = await GoalsService.getGoals(this.userId, filters)

      if (goals.length === 0) {
        const statusText = filters.status?.join(', ') || 'active'
        return {
          success: true,
          message: `You have no ${statusText} goals yet. Create your first goal to get started!`,
          suggestedActions: [
            'Add a new goal like "Create goal to lose 10 pounds by March"',
            'Set a weekly reading goal',
            'Start with a simple achievable goal'
          ]
        }
      }

      // Get goal statistics
      const stats = await GoalsService.getGoalStats(this.userId)

      // Generate goal insights
      const insights = this.generateGoalInsights(goals, stats)

      // Create formatted display
      let message = `🎯 Your Goals (${goals.length} ${filters.status?.join(', ') || 'active'})\n\n`

      if (parameters.detailed || parameters.showProgress) {
        message += goals.map(goal => {
          const progressBar = this.createProgressBar(goal.progress_percentage)
          const statusIcon = this.getGoalStatusIcon(goal)
          const daysToTarget = this.getDaysToTarget(goal)

          return `${statusIcon} ${goal.title} ${progressBar} ${goal.progress_percentage}%${daysToTarget ? ` (${daysToTarget})` : ''}`
        }).join('\n')
      } else {
        message += goals.slice(0, 5).map(goal => {
          const statusIcon = this.getGoalStatusIcon(goal)
          const urgencyFlag = this.getUrgencyFlag(goal)

          return `${statusIcon} ${goal.title} (${goal.progress_percentage}%) ${urgencyFlag}`
        }).join('\n')

        if (goals.length > 5) {
          message += `\n... and ${goals.length - 5} more goals`
        }
      }

      // Add statistics summary
      message += `\n\n📊 Quick Stats: ${stats.completion_rate_this_month}% completion rate this month`
      if (stats.overdue_goals > 0) {
        message += ` | ⚠️ ${stats.overdue_goals} overdue`
      }
      if (stats.due_this_week > 0) {
        message += ` | 📅 ${stats.due_this_week} due this week`
      }

      return {
        success: true,
        message,
        data: {
          goals,
          stats,
          insights
        },
        suggestedActions: insights.recommendations
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve goals: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async viewJournalFromChat(parameters: any): Promise<OperationResult> {
    try {
      // Build query options based on parameters
      const queryOptions: any = {
        limit: parameters.limit || 10
      }

      // Handle date range filtering
      if (parameters.timeframe) {
        const dateRange = this.parseDateRange(parameters.timeframe)
        if (dateRange) {
          queryOptions.dateRange = dateRange
        }
      }

      // Handle tag filtering
      let entries: any[]
      if (parameters.tag) {
        entries = await this.getJournalEntriesByTag(parameters.tag)
      } else if (parameters.search) {
        entries = await this.searchJournalEntries(parameters.search)
      } else {
        entries = await getUserJournalEntries(this.userId, queryOptions)
      }

      if (entries.length === 0) {
        return {
          success: true,
          message: this.getNoEntriesMessage(parameters),
          suggestedActions: [
            'Write your first journal entry',
            'Try "Journal: Had a great day today"',
            'Add a note about your current mood'
          ]
        }
      }

      // Get journal statistics for context
      const stats = await this.getJournalStats()

      // Format entries for display
      const formattedEntries = entries.map(entry => this.formatJournalEntry(entry))

      let message = `📚 Found ${entries.length} journal entries`
      if (parameters.timeframe) {
        message += ` from ${parameters.timeframe}`
      }
      if (parameters.tag) {
        message += ` tagged with "${parameters.tag}"`
      }

      // Add summary statistics
      if (stats) {
        message += `\n\n📊 Journal Stats: ${stats.totalEntries} total entries | ${stats.currentStreak} day writing streak`
        if (stats.averageMoodRating) {
          message += ` | Avg mood: ${stats.averageMoodRating}/10`
        }
      }

      message += '\n\n' + formattedEntries.join('\n\n')

      return {
        success: true,
        message,
        data: {
          entries,
          stats,
          totalFound: entries.length
        },
        suggestedActions: this.getJournalViewSuggestions(entries, parameters)
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve journal entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // =============================================================================
  // JOURNAL OPERATION HELPERS
  // =============================================================================

  private async updateJournalFromChat(entryId: string, parameters: any): Promise<OperationResult> {
    try {
      const updateData: any = {}

      // Update content and re-analyze if provided
      if (parameters.content) {
        updateData.content = parameters.content
        const analysis = this.analyzeJournalContent(parameters.content)
        updateData.title = parameters.title || this.generateTitleFromContent(parameters.content)

        // Update auto-detected fields if not explicitly provided
        if (!parameters.tags && analysis.suggestedTags.length > 0) {
          updateData.tags = analysis.suggestedTags
        }
        if (!parameters.mood_rating && analysis.suggestedMood) {
          updateData.mood_rating = analysis.suggestedMood
        }
      }

      // Direct field updates
      if (parameters.title) updateData.title = parameters.title
      if (parameters.mood_rating) updateData.mood_rating = parameters.mood_rating
      if (parameters.tags) updateData.tags = parameters.tags
      if (parameters.is_favorite !== undefined) updateData.is_favorite = parameters.is_favorite

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          message: 'No valid updates provided. You can update content, title, mood rating, tags, or favorite status.'
        }
      }

      const result = await updateJournalEntry(entryId, this.userId, updateData)

      if (!result) {
        return {
          success: false,
          message: 'Failed to update journal entry. Please check if the entry exists and try again.'
        }
      }

      return {
        success: true,
        message: `📝 Updated journal entry successfully!`,
        data: result,
        suggestedActions: [
          'Review the updated entry',
          'Add more details if needed',
          'Update tags for better organization'
        ]
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async findAndUpdateJournal(parameters: any): Promise<OperationResult> {
    try {
      // Get recent entries to search from
      const entries = await getUserJournalEntries(this.userId, { limit: 20 })

      if (entries.length === 0) {
        return {
          success: false,
          message: 'No journal entries found to update',
          suggestedActions: ['Create your first journal entry', 'Write a new entry instead']
        }
      }

      // Find entry by various criteria
      let targetEntry = null

      // Search by date reference (e.g., "today", "yesterday", "last entry")
      if (parameters.date_reference) {
        targetEntry = this.findEntryByDateReference(entries, parameters.date_reference)
      }

      // Search by content or title keywords
      if (!targetEntry && (parameters.search || parameters.title)) {
        const searchTerm = (parameters.search || parameters.title).toLowerCase()
        targetEntry = entries.find(e =>
          e.title?.toLowerCase().includes(searchTerm) ||
          e.content.toLowerCase().includes(searchTerm)
        )
      }

      // Default to most recent entry
      if (!targetEntry) {
        targetEntry = entries[0]
      }

      return await this.updateJournalFromChat(targetEntry.id, parameters)
    } catch (error) {
      return {
        success: false,
        message: `Failed to find and update journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async findAndDeleteJournal(parameters: any): Promise<OperationResult> {
    try {
      // Get recent entries to search from
      const entries = await getUserJournalEntries(this.userId, { limit: 20 })

      if (entries.length === 0) {
        return {
          success: false,
          message: 'No journal entries found to delete',
          suggestedActions: ['Create a journal entry first']
        }
      }

      // Find entry by various criteria
      let targetEntry = null

      // Search by date reference
      if (parameters.date_reference) {
        targetEntry = this.findEntryByDateReference(entries, parameters.date_reference)
      }

      // Search by content or title keywords
      if (!targetEntry && (parameters.search || parameters.title)) {
        const searchTerm = (parameters.search || parameters.title).toLowerCase()
        targetEntry = entries.find(e =>
          e.title?.toLowerCase().includes(searchTerm) ||
          e.content.toLowerCase().includes(searchTerm)
        )
      }

      // Default to most recent entry if no specific criteria
      if (!targetEntry) {
        targetEntry = entries[0]
      }

      // Ask for confirmation before deleting
      if (!parameters.confirmed) {
        const preview = targetEntry.content.substring(0, 100) + (targetEntry.content.length > 100 ? '...' : '')
        return {
          success: false,
          message: `Are you sure you want to delete this journal entry?\\n\\n"${preview}"\\n\\nThis action cannot be undone.`,
          needsConfirmation: true,
          confirmationPrompt: 'Type "yes" to confirm deletion:',
          suggestedActions: [`Delete entry "${targetEntry.title || 'Untitled'}"`, 'Cancel deletion']
        }
      }

      return await this.deleteJournalFromChat(targetEntry.id)
    } catch (error) {
      return {
        success: false,
        message: `Failed to find and delete journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async deleteJournalFromChat(entryId: string): Promise<OperationResult> {
    try {
      // Get entry details for confirmation message
      const entries = await getUserJournalEntries(this.userId, { limit: 100 })
      const entry = entries.find(e => e.id === entryId)
      const entryTitle = entry?.title || 'Untitled entry'

      const success = await deleteJournalEntry(entryId, this.userId)

      if (success) {
        return {
          success: true,
          message: `🗑️ Successfully deleted journal entry "${entryTitle}"`,
          data: { entryId, entryTitle }
        }
      } else {
        return {
          success: false,
          message: 'Failed to delete journal entry. Please try again.'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // =============================================================================
  // GOAL OPERATION HELPERS
  // =============================================================================

  private async findAndDeleteGoal(parameters: any): Promise<OperationResult> {
    if (!parameters.title && !parameters.name) {
      return {
        success: false,
        message: 'Please specify which goal you want to delete',
        suggestedActions: ['Provide the goal title', 'Use "delete goal called [name]"']
      }
    }

    const goals = await GoalsService.getGoals(this.userId, {})
    const searchTerm = (parameters.title || parameters.name).toLowerCase()

    // Try exact match first
    let targetGoal = goals.find(g => g.title.toLowerCase() === searchTerm)

    // If no exact match, try partial match
    if (!targetGoal) {
      targetGoal = goals.find(g => g.title.toLowerCase().includes(searchTerm))
    }

    // If still no match, try keyword matching
    if (!targetGoal) {
      const searchWords = searchTerm.split(/\s+/)
      targetGoal = goals.find(g => {
        const goalWords = g.title.toLowerCase().split(/\s+/)
        return searchWords.some(word => goalWords.some(goalWord => goalWord.includes(word)))
      })
    }

    if (!targetGoal) {
      const similarGoals = goals.filter(g => {
        const similarity = this.calculateSimilarity(g.title.toLowerCase(), searchTerm)
        return similarity > 0.3
      }).slice(0, 3)

      return {
        success: false,
        message: `Could not find a goal matching "${parameters.title || parameters.name}"`,
        suggestedActions: similarGoals.length > 0
          ? similarGoals.map(g => `Delete "${g.title}" instead?`)
          : ['Check your goal list', 'View all goals first']
      }
    }

    // Ask for confirmation before deleting (since this is destructive)
    if (!parameters.confirmed) {
      return {
        success: false,
        message: `Are you sure you want to delete "${targetGoal.title}"? This action cannot be undone.`,
        needsConfirmation: true,
        confirmationPrompt: 'Type "yes" to confirm deletion:',
        suggestedActions: [`Delete "${targetGoal.title}"`, 'Cancel deletion']
      }
    }

    return await this.deleteGoalFromChat(targetGoal.id)
  }

  private async deleteGoalFromChat(goalId: string): Promise<OperationResult> {
    try {
      // Get goal name for confirmation message
      const goal = await GoalsService.getGoal(this.userId, goalId)
      const goalTitle = goal ? goal.title : 'Unknown goal'

      await GoalsService.deleteGoal(this.userId, goalId)

      return {
        success: true,
        message: `🗑️ Successfully deleted goal "${goalTitle}"`,
        data: { goalId, goalTitle }
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete goal: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async completeGoalFromChat(parameters: any): Promise<OperationResult> {
    if (!parameters.title && !parameters.name) {
      return {
        success: false,
        message: 'Please specify which goal you completed',
        suggestedActions: ['Use "I completed [goal name]"', 'Use "mark [goal name] as completed"']
      }
    }

    const goals = await GoalsService.getGoals(this.userId, { status: ['active'] })
    const searchTerm = (parameters.title || parameters.name).toLowerCase()

    // Try exact match first
    let targetGoal = goals.find(g => g.title.toLowerCase() === searchTerm)

    // If no exact match, try partial match
    if (!targetGoal) {
      targetGoal = goals.find(g => g.title.toLowerCase().includes(searchTerm))
    }

    if (!targetGoal) {
      return {
        success: false,
        message: `Could not find an active goal matching "${parameters.title || parameters.name}"`,
        suggestedActions: goals.slice(0, 3).map(g => `Complete "${g.title}" instead?`)
      }
    }

    try {
      const result = await GoalsService.updateGoal(this.userId, targetGoal.id, {
        status: 'completed',
        progress_percentage: 100,
        completion_date: new Date()
      })

      return {
        success: true,
        message: `🎉 Congratulations! You've completed "${result.title}"!`,
        data: { goalId: result.id, goalTitle: result.title },
        suggestedActions: [
          'Set a new goal',
          'Celebrate your achievement',
          'Reflect on what you learned'
        ]
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to mark goal as complete: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // =============================================================================
  // GOAL UTILITY METHODS
  // =============================================================================

  private generateProgressInsight(goal: any): string {
    const progress = goal.progress_percentage
    if (progress === 100) {
      return 'Goal completed! 🎉'
    } else if (progress >= 80) {
      return 'Almost there! 💪'
    } else if (progress >= 60) {
      return 'Great progress! 👍'
    } else if (progress >= 40) {
      return 'Making steady progress 📈'
    } else if (progress >= 20) {
      return 'Good start! Keep going 🚀'
    } else {
      return 'Just getting started 🌱'
    }
  }

  private getGoalSuggestedActions(goal: any): string[] {
    const actions = []

    if (goal.progress_percentage < 100) {
      actions.push('Log progress update')
      actions.push('Add milestone if needed')
    }

    if (goal.progress_percentage === 0) {
      actions.push('Break into smaller tasks')
      actions.push('Set first milestone')
    }

    if (this.isOverdue(goal)) {
      actions.push('Adjust target date')
      actions.push('Review goal feasibility')
    }

    return actions
  }

  private generateGoalInsights(goals: any[], stats: any): { recommendations: string[], highlights: string[] } {
    const recommendations = []
    const highlights = []

    const activeGoals = goals.filter(g => g.status === 'active')
    const overdueGoals = activeGoals.filter(g => this.isOverdue(g))
    const highProgressGoals = activeGoals.filter(g => g.progress_percentage >= 80)

    // Completion insights
    if (stats.completion_rate_this_month >= 80) {
      highlights.push('Excellent goal completion rate this month!')
    } else if (stats.completion_rate_this_month >= 60) {
      highlights.push('Good progress on goals this month')
    }

    // Overdue warnings
    if (overdueGoals.length > 0) {
      recommendations.push(`${overdueGoals.length} goals are overdue - consider updating target dates`)
    }

    // Near completion
    if (highProgressGoals.length > 0) {
      recommendations.push(`${highProgressGoals.length} goals are almost complete - push for the finish!`)
    }

    // Goal load
    if (activeGoals.length > 10) {
      recommendations.push('Consider focusing on fewer goals for better results')
    } else if (activeGoals.length < 3) {
      recommendations.push('Consider setting more goals to drive progress')
    }

    return { recommendations, highlights }
  }

  private createProgressBar(percentage: number): string {
    const filled = Math.round(percentage / 10)
    const empty = 10 - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
  }

  private getGoalStatusIcon(goal: any): string {
    switch (goal.status) {
      case 'completed':
        return '✅'
      case 'active':
        if (this.isOverdue(goal)) return '🔴'
        if (this.isDueThisWeek(goal)) return '🟡'
        return '🟢'
      case 'paused':
        return '⏸️'
      case 'cancelled':
        return '❌'
      default:
        return '⭕'
    }
  }

  private getDaysToTarget(goal: any): string | null {
    if (goal.status !== 'active') return null

    const today = new Date()
    const targetDate = new Date(goal.target_date)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'due today'
    if (diffDays === 1) return 'due tomorrow'
    if (diffDays <= 7) return `${diffDays} days left`
    return null
  }

  private getUrgencyFlag(goal: any): string {
    if (this.isOverdue(goal)) return '🚨'
    if (this.isDueToday(goal)) return '⏰'
    if (this.isDueThisWeek(goal)) return '📅'
    return ''
  }

  private isOverdue(goal: any): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(goal.target_date)
    targetDate.setHours(0, 0, 0, 0)
    return targetDate < today && goal.status === 'active'
  }

  private isDueToday(goal: any): boolean {
    const today = new Date().toISOString().split('T')[0]
    const targetDate = new Date(goal.target_date).toISOString().split('T')[0]
    return targetDate === today && goal.status === 'active'
  }

  private isDueThisWeek(goal: any): boolean {
    const now = new Date()
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
    const targetDate = new Date(goal.target_date)
    return targetDate <= endOfWeek && goal.status === 'active'
  }

  // =============================================================================
  // JOURNAL UTILITY METHODS
  // =============================================================================

  /**
   * Analyze journal content for mood, category, and tags
   */
  private analyzeJournalContent(content: string): {
    suggestedMood: number | null
    suggestedTags: string[]
    category: string | null
    mood: string | null
    sentiment: 'positive' | 'negative' | 'neutral'
  } {
    const normalizedContent = content.toLowerCase()

    // Sentiment and mood analysis
    const positiveWords = ['happy', 'great', 'awesome', 'amazing', 'wonderful', 'fantastic', 'excited', 'grateful', 'blessed', 'proud', 'accomplished', 'successful', 'joy', 'love', 'peaceful', 'calm', 'relaxed']
    const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'anxious', 'stressed', 'terrible', 'awful', 'depressed', 'upset', 'disappointed', 'tired', 'exhausted', 'overwhelmed', 'lonely']
    const neutralWords = ['okay', 'fine', 'normal', 'regular', 'average', 'nothing special']

    let positiveScore = 0
    let negativeScore = 0
    let neutralScore = 0

    positiveWords.forEach(word => {
      if (normalizedContent.includes(word)) positiveScore++
    })
    negativeWords.forEach(word => {
      if (normalizedContent.includes(word)) negativeScore++
    })
    neutralWords.forEach(word => {
      if (normalizedContent.includes(word)) neutralScore++
    })

    // Determine sentiment and suggested mood
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    let suggestedMood: number | null = null
    let mood: string | null = null

    if (positiveScore > negativeScore) {
      sentiment = 'positive'
      suggestedMood = Math.min(10, 6 + positiveScore)
      mood = 'positive'
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative'
      suggestedMood = Math.max(1, 5 - negativeScore)
      mood = 'challenging'
    } else {
      sentiment = 'neutral'
      suggestedMood = 5
      mood = 'neutral'
    }

    // Auto-categorization
    const categoryKeywords = {
      'work': ['work', 'job', 'meeting', 'project', 'deadline', 'boss', 'colleague', 'office', 'business', 'client', 'presentation'],
      'health': ['exercise', 'workout', 'gym', 'run', 'walk', 'diet', 'health', 'doctor', 'medicine', 'sleep', 'tired'],
      'relationships': ['family', 'friend', 'partner', 'date', 'spouse', 'child', 'parent', 'relationship', 'love', 'conversation'],
      'personal': ['learning', 'reading', 'hobby', 'creative', 'art', 'music', 'movie', 'book', 'game', 'meditation'],
      'travel': ['trip', 'vacation', 'travel', 'flight', 'hotel', 'explore', 'adventure', 'journey', 'destination'],
      'spiritual': ['prayer', 'meditation', 'gratitude', 'blessing', 'faith', 'church', 'spiritual', 'mindfulness', 'reflection']
    }

    let category: string | null = null
    let maxMatches = 0

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => normalizedContent.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        category = cat
      }
    }

    // Auto-tag extraction
    const suggestedTags: string[] = []

    // Add category as tag if found
    if (category) {
      suggestedTags.push(category)
    }

    // Add mood-based tags
    if (mood && mood !== 'neutral') {
      suggestedTags.push(mood)
    }

    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g
    let match
    while ((match = hashtagRegex.exec(content)) !== null) {
      suggestedTags.push(match[1].toLowerCase())
    }

    // Extract common topics
    const topicKeywords = {
      'morning': ['morning', 'breakfast', 'wake up', 'start day'],
      'evening': ['evening', 'dinner', 'end day', 'night'],
      'weekend': ['weekend', 'saturday', 'sunday'],
      'achievement': ['accomplished', 'finished', 'completed', 'success', 'proud'],
      'reflection': ['thinking', 'reflecting', 'contemplating', 'wondering', 'realizing']
    }

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => normalizedContent.includes(keyword))) {
        suggestedTags.push(topic)
      }
    }

    // Remove duplicates and limit to 5 tags
    const uniqueTags = [...new Set(suggestedTags)].slice(0, 5)

    return {
      suggestedMood,
      suggestedTags: uniqueTags,
      category,
      mood,
      sentiment
    }
  }

  /**
   * Generate a title from journal content
   */
  private generateTitleFromContent(content: string): string {
    // Extract first sentence or meaningful phrase
    const sentences = content.split(/[.!?]+/)
    const firstSentence = sentences[0]?.trim()

    if (!firstSentence) return 'Journal Entry'

    // Clean up and truncate
    let title = firstSentence.replace(/^(journal|note|today|yesterday|i)/i, '').trim()

    // Remove common starting words
    title = title.replace(/^(had a|went to|did|was|am|felt|think|thought|just|really)/i, '').trim()

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1)

    // Truncate if too long
    if (title.length > 50) {
      title = title.substring(0, 47) + '...'
    }

    return title || 'Journal Entry'
  }

  /**
   * Generate insights about journal entry
   */
  private generateJournalInsights(analysis: any): { recommendations: string[], highlights: string[] } {
    const recommendations = []
    const highlights = []

    // Mood-based insights
    if (analysis.suggestedMood) {
      if (analysis.suggestedMood >= 8) {
        highlights.push('Great mood detected! Consider what contributed to this positive state.')
        recommendations.push('Reflect on what made today special')
      } else if (analysis.suggestedMood <= 3) {
        recommendations.push('Consider what might help improve your mood')
        recommendations.push('Practice self-care or reach out to someone')
      }
    }

    // Category-based insights
    if (analysis.category) {
      highlights.push(`Entry categorized as: ${analysis.category}`)

      if (analysis.category === 'work') {
        recommendations.push('Balance work reflections with personal insights')
      } else if (analysis.category === 'health') {
        recommendations.push('Track your health journey consistently')
      } else if (analysis.category === 'relationships') {
        recommendations.push('Consider the quality of your connections')
      }
    }

    // Content length insights
    const wordCount = analysis.content?.split(' ').length || 0
    if (wordCount < 50) {
      recommendations.push('Consider adding more details to capture the full experience')
    } else if (wordCount > 300) {
      highlights.push('Detailed entry - great for future reflection!')
    }

    return { recommendations, highlights }
  }

  /**
   * Parse date range from natural language
   */
  private parseDateRange(timeframe: string): { start: string; end: string } | null {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    switch (timeframe.toLowerCase()) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }

      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        return {
          start: yesterday.toISOString(),
          end: today.toISOString()
        }

      case 'this week':
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        return {
          start: startOfWeek.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }

      case 'this month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        return {
          start: startOfMonth.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }

      default:
        return null
    }
  }

  /**
   * Find entry by date reference
   */
  private findEntryByDateReference(entries: any[], dateRef: string): any | null {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateRef.toLowerCase()) {
      case 'today':
      case 'latest':
      case 'recent':
      case 'last':
        return entries[0] // Most recent entry

      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        return entries.find(e => {
          const entryDate = new Date(e.created_at)
          entryDate.setHours(0, 0, 0, 0)
          return entryDate.getTime() === yesterday.getTime()
        })

      default:
        return null
    }
  }

  /**
   * Get journal entries by tag using the service
   */
  private async getJournalEntriesByTag(tag: string): Promise<any[]> {
    const { getJournalEntriesByTag } = await import('./journalService')
    return await getJournalEntriesByTag(this.userId, tag)
  }

  /**
   * Search journal entries using the service
   */
  private async searchJournalEntries(query: string): Promise<any[]> {
    const { searchJournalEntries } = await import('./journalService')
    return await searchJournalEntries(this.userId, query)
  }

  /**
   * Get journal statistics
   */
  private async getJournalStats(): Promise<any> {
    const { getJournalStats } = await import('./journalService')
    return await getJournalStats(this.userId)
  }

  /**
   * Format journal entry for display
   */
  private formatJournalEntry(entry: any): string {
    const date = new Date(entry.created_at).toLocaleDateString()
    const title = entry.title || 'Untitled'
    const preview = entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '')
    const moodIcon = entry.mood_rating ? this.getMoodIcon(entry.mood_rating) : ''
    const tags = entry.tags && entry.tags.length > 0 ? ` #${entry.tags.join(' #')}` : ''

    return `📅 ${date} | ${title} ${moodIcon}\n${preview}${tags}`
  }

  /**
   * Get mood icon based on rating
   */
  private getMoodIcon(rating: number): string {
    if (rating >= 9) return '😄'
    if (rating >= 7) return '😊'
    if (rating >= 6) return '🙂'
    if (rating >= 4) return '😐'
    if (rating >= 3) return '😔'
    return '😢'
  }

  /**
   * Get appropriate message when no entries found
   */
  private getNoEntriesMessage(parameters: any): string {
    if (parameters.tag) {
      return `No journal entries found with tag "${parameters.tag}".`
    }
    if (parameters.timeframe) {
      return `No journal entries found from ${parameters.timeframe}.`
    }
    if (parameters.search) {
      return `No journal entries found matching "${parameters.search}".`
    }
    return 'You have no journal entries yet.'
  }

  /**
   * Get suggestions for journal view actions
   */
  private getJournalViewSuggestions(entries: any[], parameters: any): string[] {
    const suggestions = []

    if (entries.length > 0) {
      suggestions.push('Write a new journal entry')
      suggestions.push('Search entries by keyword')

      if (!parameters.tag) {
        const commonTags = this.extractCommonTags(entries)
        if (commonTags.length > 0) {
          suggestions.push(`View entries tagged "${commonTags[0]}"`)
        }
      }

      if (!parameters.timeframe) {
        suggestions.push('View entries from this week')
      }
    } else {
      suggestions.push('Write your first journal entry')
      suggestions.push('Try "Journal: Had a great day today"')
    }

    return suggestions
  }

  /**
   * Extract common tags from entries
   */
  private extractCommonTags(entries: any[]): string[] {
    const tagCounts: { [key: string]: number } = {}

    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag)
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createEntityOperationHandler(userId: string): EntityOperationHandler {
  return new EntityOperationHandler(userId)
}