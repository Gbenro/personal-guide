// =============================================================================
// CHAT ENTITY CONTEXT MANAGER
// Context awareness and conversation state management for chat entity operations
// =============================================================================

import { ParsedEntityOperation, EntityType, OperationType } from './chatEntityParser'
import { ChatEntityError } from './chatEntityErrorHandler'

export interface ConversationContext {
  id: string
  userId: string
  sessionStartTime: string
  lastActivity: string
  messageCount: number

  // Current conversation state
  currentEntityType?: EntityType
  currentIntent?: OperationType
  pendingOperation?: ParsedEntityOperation
  awaitingDisambiguation?: boolean

  // Conversation history
  messageHistory: ConversationMessage[]
  operationHistory: ParsedEntityOperation[]
  errorHistory: ChatEntityError[]

  // User patterns and preferences
  userPreferences: UserPreferences
  conversationPatterns: ConversationPatterns

  // Context from other systems
  recentActivities: RecentActivity[]
  environmentContext: EnvironmentContext
}

export interface ConversationMessage {
  id: string
  timestamp: string
  role: 'user' | 'assistant'
  content: string
  type: 'command' | 'clarification' | 'error' | 'success' | 'disambiguation'
  parsedOperation?: ParsedEntityOperation
  error?: ChatEntityError
  metadata?: Record<string, any>
}

export interface UserPreferences {
  preferredEntityTypes: EntityType[]
  commonOperations: OperationType[]
  defaultParameters: Record<string, any>
  communicationStyle: 'formal' | 'casual' | 'brief' | 'detailed'
  errorTolerance: 'strict' | 'moderate' | 'lenient'
  ambiguityHandling: 'ask_always' | 'smart_guess' | 'use_defaults'
}

export interface ConversationPatterns {
  averageMessageLength: number
  commonPhrases: string[]
  entityFrequency: Record<EntityType, number>
  operationFrequency: Record<OperationType, number>
  timeOfDayPatterns: Record<string, EntityType[]>
  errorPatterns: string[]
}

export interface RecentActivity {
  id: string
  type: 'habit_completion' | 'goal_progress' | 'journal_entry' | 'mood_log'
  entityId: string
  entityName: string
  timestamp: string
  relevanceScore: number
}

export interface EnvironmentContext {
  currentTime: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  dayOfWeek: string
  isWeekend: boolean
  userTimezone: string
  recentEntityActivity: Record<EntityType, string> // last activity timestamp
}

export class ChatEntityContextManager {
  private contexts: Map<string, ConversationContext> = new Map()
  private maxContextAge = 24 * 60 * 60 * 1000 // 24 hours
  private maxHistoryLength = 100

  /**
   * Get or create conversation context for a user
   */
  getContext(userId: string, sessionId?: string): ConversationContext {
    const contextId = sessionId || `${userId}_default`

    if (this.contexts.has(contextId)) {
      const context = this.contexts.get(contextId)!
      this.updateLastActivity(context)
      return context
    }

    const newContext = this.createNewContext(contextId, userId)
    this.contexts.set(contextId, newContext)
    return newContext
  }

  /**
   * Update context with new message and parsed operation
   */
  updateContext(
    contextId: string,
    message: string,
    parsedOperation?: ParsedEntityOperation,
    error?: ChatEntityError
  ): ConversationContext {
    const context = this.contexts.get(contextId)
    if (!context) {
      throw new Error(`Context ${contextId} not found`)
    }

    // Add message to history
    const conversationMessage: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      role: 'user',
      content: message,
      type: this.determineMessageType(message, parsedOperation, error),
      parsedOperation,
      error
    }

    context.messageHistory.push(conversationMessage)
    context.messageCount++
    context.lastActivity = new Date().toISOString()

    // Update operation history
    if (parsedOperation) {
      context.operationHistory.push(parsedOperation)
      this.updateCurrentState(context, parsedOperation)
      this.updateUserPatterns(context, parsedOperation)
    }

    // Update error history
    if (error) {
      context.errorHistory.push(error)
      this.updateErrorPatterns(context, error)
    }

    // Update environment context
    this.updateEnvironmentContext(context)

    // Trim history if too long
    this.trimHistory(context)

    return context
  }

  /**
   * Get contextual suggestions based on conversation history
   */
  getContextualSuggestions(contextId: string, currentMessage?: string): ContextualSuggestion[] {
    const context = this.contexts.get(contextId)
    if (!context) return []

    const suggestions: ContextualSuggestion[] = []

    // Recent activity suggestions
    suggestions.push(...this.generateRecentActivitySuggestions(context))

    // Pattern-based suggestions
    suggestions.push(...this.generatePatternBasedSuggestions(context))

    // Time-based suggestions
    suggestions.push(...this.generateTimeBasedSuggestions(context))

    // Completion suggestions
    suggestions.push(...this.generateCompletionSuggestions(context))

    // Error recovery suggestions
    if (context.errorHistory.length > 0) {
      suggestions.push(...this.generateErrorRecoverySuggestions(context))
    }

    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
  }

  /**
   * Resolve references in user message using context
   */
  resolveReferences(contextId: string, message: string): string {
    const context = this.contexts.get(contextId)
    if (!context) return message

    let resolvedMessage = message

    // Resolve pronouns and references
    const references = [
      { pattern: /\bit\b/gi, replacement: this.getLastEntityReference(context) },
      { pattern: /\bthat\b/gi, replacement: this.getLastEntityReference(context) },
      { pattern: /\bthe last one\b/gi, replacement: this.getLastEntityReference(context) },
      { pattern: /\bmy last\b/gi, replacement: this.getLastEntityTypeReference(context) }
    ]

    references.forEach(({ pattern, replacement }) => {
      if (replacement) {
        resolvedMessage = resolvedMessage.replace(pattern, replacement)
      }
    })

    return resolvedMessage
  }

  /**
   * Predict user intent based on context
   */
  predictIntent(contextId: string, message: string): IntentPrediction {
    const context = this.contexts.get(contextId)
    if (!context) {
      return { intent: null, entityType: null, confidence: 0 }
    }

    const predictions: IntentPrediction[] = []

    // Pattern-based prediction
    const patternPrediction = this.predictFromPatterns(context, message)
    if (patternPrediction.confidence > 0.3) {
      predictions.push(patternPrediction)
    }

    // Time-based prediction
    const timePrediction = this.predictFromTimeContext(context, message)
    if (timePrediction.confidence > 0.3) {
      predictions.push(timePrediction)
    }

    // Recent activity prediction
    const activityPrediction = this.predictFromRecentActivity(context, message)
    if (activityPrediction.confidence > 0.3) {
      predictions.push(activityPrediction)
    }

    // Return the highest confidence prediction
    return predictions.length > 0
      ? predictions.sort((a, b) => b.confidence - a.confidence)[0]
      : { intent: null, entityType: null, confidence: 0 }
  }

  /**
   * Get conversation summary for user
   */
  getConversationSummary(contextId: string): ConversationSummary {
    const context = this.contexts.get(contextId)
    if (!context) {
      throw new Error(`Context ${contextId} not found`)
    }

    const recentMessages = context.messageHistory.slice(-10)
    const successfulOperations = context.operationHistory.filter(op => op.confidence > 0.7)
    const recentErrors = context.errorHistory.slice(-5)

    return {
      totalMessages: context.messageCount,
      sessionDuration: this.getSessionDuration(context),
      successfulOperations: successfulOperations.length,
      errorCount: context.errorHistory.length,
      mostUsedEntityType: this.getMostUsedEntityType(context),
      mostUsedOperation: this.getMostUsedOperation(context),
      recentMessages: recentMessages.map(msg => ({
        timestamp: msg.timestamp,
        content: msg.content,
        success: !!msg.parsedOperation
      })),
      suggestions: this.getContextualSuggestions(contextId),
      userMood: this.inferUserMood(context)
    }
  }

  /**
   * Clean up old contexts
   */
  cleanupOldContexts(): void {
    const now = Date.now()
    const expiredContexts: string[] = []

    this.contexts.forEach((context, id) => {
      const lastActivity = new Date(context.lastActivity).getTime()
      if (now - lastActivity > this.maxContextAge) {
        expiredContexts.push(id)
      }
    })

    expiredContexts.forEach(id => this.contexts.delete(id))
  }

  // Private helper methods

  private createNewContext(contextId: string, userId: string): ConversationContext {
    return {
      id: contextId,
      userId,
      sessionStartTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      messageHistory: [],
      operationHistory: [],
      errorHistory: [],
      userPreferences: this.getDefaultUserPreferences(),
      conversationPatterns: this.initializeConversationPatterns(),
      recentActivities: [],
      environmentContext: this.getCurrentEnvironmentContext()
    }
  }

  private updateLastActivity(context: ConversationContext): void {
    context.lastActivity = new Date().toISOString()
  }

  private determineMessageType(
    message: string,
    operation?: ParsedEntityOperation,
    error?: ChatEntityError
  ): ConversationMessage['type'] {
    if (error) return 'error'
    if (operation?.needsDisambiguation) return 'disambiguation'
    if (operation) return 'command'
    return 'clarification'
  }

  private updateCurrentState(context: ConversationContext, operation: ParsedEntityOperation): void {
    context.currentEntityType = operation.entityType
    context.currentIntent = operation.intent

    if (operation.needsDisambiguation) {
      context.awaitingDisambiguation = true
      context.pendingOperation = operation
    } else {
      context.awaitingDisambiguation = false
      context.pendingOperation = undefined
    }
  }

  private updateUserPatterns(context: ConversationContext, operation: ParsedEntityOperation): void {
    const patterns = context.conversationPatterns

    // Update entity frequency
    patterns.entityFrequency[operation.entityType] =
      (patterns.entityFrequency[operation.entityType] || 0) + 1

    // Update operation frequency
    patterns.operationFrequency[operation.intent] =
      (patterns.operationFrequency[operation.intent] || 0) + 1

    // Update time patterns
    const timeOfDay = this.getCurrentTimeOfDay()
    if (!patterns.timeOfDayPatterns[timeOfDay]) {
      patterns.timeOfDayPatterns[timeOfDay] = []
    }
    patterns.timeOfDayPatterns[timeOfDay].push(operation.entityType)
  }

  private updateErrorPatterns(context: ConversationContext, error: ChatEntityError): void {
    const patterns = context.conversationPatterns
    patterns.errorPatterns.push(error.type)
  }

  private updateEnvironmentContext(context: ConversationContext): void {
    context.environmentContext = this.getCurrentEnvironmentContext()
  }

  private getCurrentEnvironmentContext(): EnvironmentContext {
    const now = new Date()
    return {
      currentTime: now.toISOString(),
      timeOfDay: this.getCurrentTimeOfDay(),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      isWeekend: [0, 6].includes(now.getDay()),
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recentEntityActivity: {}
    }
  }

  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
  }

  private getDefaultUserPreferences(): UserPreferences {
    return {
      preferredEntityTypes: [],
      commonOperations: [],
      defaultParameters: {},
      communicationStyle: 'casual',
      errorTolerance: 'moderate',
      ambiguityHandling: 'smart_guess'
    }
  }

  private initializeConversationPatterns(): ConversationPatterns {
    return {
      averageMessageLength: 0,
      commonPhrases: [],
      entityFrequency: {} as Record<EntityType, number>,
      operationFrequency: {} as Record<OperationType, number>,
      timeOfDayPatterns: {},
      errorPatterns: []
    }
  }

  private trimHistory(context: ConversationContext): void {
    if (context.messageHistory.length > this.maxHistoryLength) {
      context.messageHistory = context.messageHistory.slice(-this.maxHistoryLength)
    }
    if (context.operationHistory.length > this.maxHistoryLength) {
      context.operationHistory = context.operationHistory.slice(-this.maxHistoryLength)
    }
    if (context.errorHistory.length > 50) {
      context.errorHistory = context.errorHistory.slice(-50)
    }
  }

  private generateRecentActivitySuggestions(context: ConversationContext): ContextualSuggestion[] {
    return context.recentActivities.slice(0, 3).map(activity => ({
      id: `recent_${activity.id}`,
      text: `Continue with ${activity.entityName}`,
      type: 'recent_activity',
      relevanceScore: activity.relevanceScore,
      entityType: this.mapActivityTypeToEntity(activity.type),
      metadata: { activityId: activity.id }
    }))
  }

  private generatePatternBasedSuggestions(context: ConversationContext): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = []
    const patterns = context.conversationPatterns

    // Most used entity type
    const topEntity = Object.entries(patterns.entityFrequency)
      .sort(([, a], [, b]) => b - a)[0]

    if (topEntity) {
      suggestions.push({
        id: 'pattern_entity',
        text: `Work with ${topEntity[0]}s`,
        type: 'pattern',
        relevanceScore: 0.6,
        entityType: topEntity[0] as EntityType
      })
    }

    return suggestions
  }

  private generateTimeBasedSuggestions(context: ConversationContext): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = []
    const timeOfDay = context.environmentContext.timeOfDay

    const timeBasedSuggestions: Record<string, string[]> = {
      morning: ['Check daily habits', 'Review goals', 'Set intentions'],
      afternoon: ['Log progress', 'Update status', 'Quick reflection'],
      evening: ['Complete daily review', 'Journal thoughts', 'Plan tomorrow'],
      night: ['Log mood', 'Gratitude entry', 'Evening routine']
    }

    const timeSuggestions = timeBasedSuggestions[timeOfDay] || []
    timeSuggestions.forEach((suggestion, index) => {
      suggestions.push({
        id: `time_${timeOfDay}_${index}`,
        text: suggestion,
        type: 'time_based',
        relevanceScore: 0.5,
        metadata: { timeOfDay }
      })
    })

    return suggestions
  }

  private generateCompletionSuggestions(context: ConversationContext): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = []

    // If there's a pending operation, suggest completing it
    if (context.pendingOperation) {
      suggestions.push({
        id: 'complete_pending',
        text: 'Complete the current request',
        type: 'completion',
        relevanceScore: 0.8,
        entityType: context.pendingOperation.entityType
      })
    }

    return suggestions
  }

  private generateErrorRecoverySuggestions(context: ConversationContext): ContextualSuggestion[] {
    const recentErrors = context.errorHistory.slice(-3)

    return recentErrors.map((error, index) => ({
      id: `error_recovery_${index}`,
      text: 'Try a different approach',
      type: 'error_recovery',
      relevanceScore: 0.4,
      metadata: { errorType: error.type }
    }))
  }

  private getLastEntityReference(context: ConversationContext): string | null {
    const lastOperation = context.operationHistory[context.operationHistory.length - 1]
    if (!lastOperation) return null

    return lastOperation.parameters.name ||
           lastOperation.parameters.title ||
           lastOperation.parameters.content ||
           `the ${lastOperation.entityType}`
  }

  private getLastEntityTypeReference(context: ConversationContext): string | null {
    const lastOperation = context.operationHistory[context.operationHistory.length - 1]
    return lastOperation ? lastOperation.entityType : null
  }

  private predictFromPatterns(context: ConversationContext, message: string): IntentPrediction {
    // Simple pattern-based prediction
    const patterns = context.conversationPatterns
    const mostUsedEntity = Object.entries(patterns.entityFrequency)
      .sort(([, a], [, b]) => b - a)[0]
    const mostUsedOperation = Object.entries(patterns.operationFrequency)
      .sort(([, a], [, b]) => b - a)[0]

    if (mostUsedEntity && mostUsedOperation) {
      return {
        intent: mostUsedOperation[0] as OperationType,
        entityType: mostUsedEntity[0] as EntityType,
        confidence: 0.4
      }
    }

    return { intent: null, entityType: null, confidence: 0 }
  }

  private predictFromTimeContext(context: ConversationContext, message: string): IntentPrediction {
    const timeOfDay = context.environmentContext.timeOfDay
    const timePatterns = context.conversationPatterns.timeOfDayPatterns[timeOfDay]

    if (timePatterns && timePatterns.length > 0) {
      const mostCommon = timePatterns[timePatterns.length - 1]
      return {
        intent: 'view' as OperationType,
        entityType: mostCommon,
        confidence: 0.3
      }
    }

    return { intent: null, entityType: null, confidence: 0 }
  }

  private predictFromRecentActivity(context: ConversationContext, message: string): IntentPrediction {
    if (context.recentActivities.length > 0) {
      const recentActivity = context.recentActivities[0]
      return {
        intent: 'view' as OperationType,
        entityType: this.mapActivityTypeToEntity(recentActivity.type),
        confidence: recentActivity.relevanceScore * 0.5
      }
    }

    return { intent: null, entityType: null, confidence: 0 }
  }

  private mapActivityTypeToEntity(activityType: string): EntityType {
    const mapping: Record<string, EntityType> = {
      'habit_completion': 'habit',
      'goal_progress': 'goal',
      'journal_entry': 'journal',
      'mood_log': 'mood'
    }
    return mapping[activityType] || 'habit'
  }

  private getSessionDuration(context: ConversationContext): string {
    const start = new Date(context.sessionStartTime).getTime()
    const end = new Date(context.lastActivity).getTime()
    const minutes = Math.floor((end - start) / 60000)
    return `${minutes} minutes`
  }

  private getMostUsedEntityType(context: ConversationContext): EntityType | null {
    const frequencies = context.conversationPatterns.entityFrequency
    const entries = Object.entries(frequencies)
    return entries.length > 0 ? entries.sort(([, a], [, b]) => b - a)[0][0] as EntityType : null
  }

  private getMostUsedOperation(context: ConversationContext): OperationType | null {
    const frequencies = context.conversationPatterns.operationFrequency
    const entries = Object.entries(frequencies)
    return entries.length > 0 ? entries.sort(([, a], [, b]) => b - a)[0][0] as OperationType : null
  }

  private inferUserMood(context: ConversationContext): 'positive' | 'neutral' | 'negative' {
    const recentErrors = context.errorHistory.slice(-5)
    const recentOperations = context.operationHistory.slice(-5)

    if (recentErrors.length > recentOperations.length) {
      return 'negative'
    }

    if (recentOperations.filter(op => op.confidence > 0.8).length > 3) {
      return 'positive'
    }

    return 'neutral'
  }
}

// Supporting interfaces

export interface ContextualSuggestion {
  id: string
  text: string
  type: 'recent_activity' | 'pattern' | 'time_based' | 'completion' | 'error_recovery'
  relevanceScore: number
  entityType?: EntityType
  intent?: OperationType
  metadata?: Record<string, any>
}

export interface IntentPrediction {
  intent: OperationType | null
  entityType: EntityType | null
  confidence: number
}

export interface ConversationSummary {
  totalMessages: number
  sessionDuration: string
  successfulOperations: number
  errorCount: number
  mostUsedEntityType: EntityType | null
  mostUsedOperation: OperationType | null
  recentMessages: Array<{
    timestamp: string
    content: string
    success: boolean
  }>
  suggestions: ContextualSuggestion[]
  userMood: 'positive' | 'neutral' | 'negative'
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const chatEntityContextManager = new ChatEntityContextManager()