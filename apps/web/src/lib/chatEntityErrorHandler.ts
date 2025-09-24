// =============================================================================
// CHAT ENTITY ERROR HANDLER
// Comprehensive error handling and recovery system for chat entity operations
// =============================================================================

import { ParsedEntityOperation, EntityType, OperationType } from './chatEntityParser'

export enum ErrorType {
  PARSING_ERROR = 'parsing_error',
  VALIDATION_ERROR = 'validation_error',
  SERVICE_ERROR = 'service_error',
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum ErrorSeverity {
  LOW = 'low',       // User can continue with minor adjustment
  MEDIUM = 'medium', // Requires user intervention
  HIGH = 'high',     // Blocks operation, needs resolution
  CRITICAL = 'critical' // System-level issue
}

export interface ChatEntityError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userFriendlyMessage: string
  code: string
  context: {
    originalMessage?: string
    operation?: ParsedEntityOperation
    entityType?: EntityType
    intent?: OperationType
    timestamp: string
    userId?: string
  }
  suggestions: ErrorSuggestion[]
  recoveryActions: RecoveryAction[]
  metadata?: Record<string, any>
}

export interface ErrorSuggestion {
  id: string
  title: string
  description: string
  actionType: 'retry' | 'modify' | 'alternative' | 'help'
  confidence: number
  parameters?: Record<string, any>
}

export interface RecoveryAction {
  id: string
  label: string
  description: string
  actionType: 'automatic' | 'user_input' | 'fallback'
  handler: string // Function name or identifier
  priority: number
}

export class ChatEntityErrorHandler {
  private errorCounts: Map<string, number> = new Map()
  private userErrorHistory: Map<string, ChatEntityError[]> = new Map()
  private maxRetryCount = 3
  private errorCooldownMs = 60000 // 1 minute

  /**
   * Handle parsing errors with context-aware suggestions
   */
  handleParsingError(
    originalMessage: string,
    parsingAttempt?: Partial<ParsedEntityOperation>,
    userId?: string
  ): ChatEntityError {
    const errorCode = 'PARSE_001'
    const context = {
      originalMessage,
      operation: parsingAttempt as ParsedEntityOperation,
      timestamp: new Date().toISOString(),
      userId
    }

    const suggestions = this.generateParsingSuggestions(originalMessage, parsingAttempt)
    const recoveryActions = this.generateParsingRecoveryActions(originalMessage)

    const error: ChatEntityError = {
      type: ErrorType.PARSING_ERROR,
      severity: this.determineErrorSeverity(originalMessage, userId),
      message: `Failed to parse message: "${originalMessage}"`,
      userFriendlyMessage: this.generateUserFriendlyMessage(originalMessage, suggestions),
      code: errorCode,
      context,
      suggestions,
      recoveryActions
    }

    this.recordError(userId, error)
    return error
  }

  /**
   * Handle validation errors with specific field guidance
   */
  handleValidationError(
    operation: ParsedEntityOperation,
    validationErrors: string[],
    userId?: string
  ): ChatEntityError {
    const errorCode = 'VALID_001'
    const context = {
      originalMessage: operation.originalMessage,
      operation,
      entityType: operation.entityType,
      intent: operation.intent,
      timestamp: new Date().toISOString(),
      userId
    }

    const suggestions = this.generateValidationSuggestions(operation, validationErrors)
    const recoveryActions = this.generateValidationRecoveryActions(operation, validationErrors)

    const error: ChatEntityError = {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: `Validation failed: ${validationErrors.join(', ')}`,
      userFriendlyMessage: this.generateValidationUserMessage(operation, validationErrors),
      code: errorCode,
      context,
      suggestions,
      recoveryActions,
      metadata: { validationErrors }
    }

    this.recordError(userId, error)
    return error
  }

  /**
   * Handle service errors with fallback strategies
   */
  handleServiceError(
    operation: ParsedEntityOperation,
    serviceError: Error,
    serviceName: string,
    userId?: string
  ): ChatEntityError {
    const errorCode = this.categorizeServiceError(serviceError)
    const context = {
      originalMessage: operation.originalMessage,
      operation,
      entityType: operation.entityType,
      intent: operation.intent,
      timestamp: new Date().toISOString(),
      userId
    }

    const suggestions = this.generateServiceErrorSuggestions(operation, serviceError, serviceName)
    const recoveryActions = this.generateServiceRecoveryActions(operation, serviceError, serviceName)

    const error: ChatEntityError = {
      type: this.mapServiceErrorType(serviceError),
      severity: this.determineServiceErrorSeverity(serviceError, serviceName),
      message: `Service error in ${serviceName}: ${serviceError.message}`,
      userFriendlyMessage: this.generateServiceErrorUserMessage(operation, serviceError),
      code: errorCode,
      context,
      suggestions,
      recoveryActions,
      metadata: { serviceName, originalError: serviceError.message }
    }

    this.recordError(userId, error)
    return error
  }

  /**
   * Generate context-aware parsing suggestions
   */
  private generateParsingSuggestions(
    message: string,
    parsingAttempt?: Partial<ParsedEntityOperation>
  ): ErrorSuggestion[] {
    const suggestions: ErrorSuggestion[] = []

    // Analyze what might have gone wrong
    const messageLength = message.trim().length
    const words = message.trim().split(/\s+/)
    const hasActionWord = this.hasActionWords(message)
    const hasEntityWord = this.hasEntityWords(message)

    // Too short or vague
    if (messageLength < 10 || words.length < 3) {
      suggestions.push({
        id: 'be_more_specific',
        title: 'Be more specific',
        description: 'Try providing more details about what you want to do',
        actionType: 'modify',
        confidence: 0.9,
        parameters: {
          examples: [
            'Create habit to drink water daily',
            'Add goal to lose 10 pounds by March',
            'Show my journal entries from this week'
          ]
        }
      })
    }

    // Missing action word
    if (!hasActionWord) {
      suggestions.push({
        id: 'add_action',
        title: 'Specify what you want to do',
        description: 'Start with an action word like "add", "create", "show", "update", or "delete"',
        actionType: 'modify',
        confidence: 0.8,
        parameters: {
          actionWords: ['add', 'create', 'show', 'update', 'delete', 'complete']
        }
      })
    }

    // Missing entity word
    if (!hasEntityWord) {
      suggestions.push({
        id: 'specify_entity',
        title: 'Specify what type of item',
        description: 'Mention what you\'re working with: habit, goal, journal entry, mood, etc.',
        actionType: 'modify',
        confidence: 0.8,
        parameters: {
          entities: ['habit', 'goal', 'journal entry', 'mood', 'routine', 'belief']
        }
      })
    }

    // Offer alternatives based on partial parsing
    if (parsingAttempt?.entityType && !parsingAttempt.intent) {
      suggestions.push({
        id: 'suggest_actions',
        title: `What do you want to do with ${parsingAttempt.entityType}?`,
        description: `I can help you create, update, view, or delete ${parsingAttempt.entityType}s`,
        actionType: 'alternative',
        confidence: 0.7,
        parameters: {
          entityType: parsingAttempt.entityType,
          actions: ['create', 'update', 'view', 'delete']
        }
      })
    }

    // Common typo corrections
    const possibleTypos = this.detectPossibleTypos(message)
    if (possibleTypos.length > 0) {
      suggestions.push({
        id: 'typo_correction',
        title: 'Check for typos',
        description: 'Did you mean one of these?',
        actionType: 'modify',
        confidence: 0.6,
        parameters: { corrections: possibleTypos }
      })
    }

    return suggestions.slice(0, 4) // Limit to top 4 suggestions
  }

  /**
   * Generate recovery actions for parsing errors
   */
  private generateParsingRecoveryActions(message: string): RecoveryAction[] {
    const actions: RecoveryAction[] = [
      {
        id: 'guided_input',
        label: 'Get help with input',
        description: 'I\'ll ask you step-by-step questions to understand what you want',
        actionType: 'user_input',
        handler: 'startGuidedInput',
        priority: 1
      },
      {
        id: 'show_examples',
        label: 'Show examples',
        description: 'See examples of commands I understand',
        actionType: 'user_input',
        handler: 'showExamples',
        priority: 2
      },
      {
        id: 'manual_entry',
        label: 'Use form instead',
        description: 'Switch to a form-based interface',
        actionType: 'fallback',
        handler: 'switchToForm',
        priority: 3
      }
    ]

    // Add retry with modification if message has potential
    if (message.length > 5 && this.hasPartialMatch(message)) {
      actions.unshift({
        id: 'retry_modified',
        label: 'Try again with changes',
        description: 'Modify your message and try again',
        actionType: 'user_input',
        handler: 'retryWithModification',
        priority: 0
      })
    }

    return actions
  }

  /**
   * Generate suggestions for validation errors
   */
  private generateValidationSuggestions(
    operation: ParsedEntityOperation,
    errors: string[]
  ): ErrorSuggestion[] {
    const suggestions: ErrorSuggestion[] = []

    errors.forEach(error => {
      if (error.includes('name') || error.includes('title')) {
        suggestions.push({
          id: 'provide_name',
          title: 'Provide a name',
          description: `Give your ${operation.entityType} a descriptive name`,
          actionType: 'modify',
          confidence: 0.9,
          parameters: {
            field: 'name',
            examples: this.getNameExamples(operation.entityType)
          }
        })
      }

      if (error.includes('content')) {
        suggestions.push({
          id: 'add_content',
          title: 'Add content',
          description: 'Provide the main content or description',
          actionType: 'modify',
          confidence: 0.9,
          parameters: { field: 'content' }
        })
      }

      if (error.includes('mood_rating')) {
        suggestions.push({
          id: 'add_mood_rating',
          title: 'Rate your mood',
          description: 'Provide a mood rating from 1 (very bad) to 10 (excellent)',
          actionType: 'modify',
          confidence: 0.9,
          parameters: { field: 'mood_rating', range: [1, 10] }
        })
      }
    })

    return suggestions
  }

  /**
   * Generate recovery actions for validation errors
   */
  private generateValidationRecoveryActions(
    operation: ParsedEntityOperation,
    errors: string[]
  ): RecoveryAction[] {
    return [
      {
        id: 'fix_validation',
        label: 'Fix the issues',
        description: 'Provide the missing or invalid information',
        actionType: 'user_input',
        handler: 'fixValidation',
        priority: 1
      },
      {
        id: 'use_defaults',
        label: 'Use default values',
        description: 'Fill in missing fields with reasonable defaults',
        actionType: 'automatic',
        handler: 'applyDefaults',
        priority: 2
      }
    ]
  }

  /**
   * Utility methods
   */
  private hasActionWords(message: string): boolean {
    const actionWords = ['add', 'create', 'new', 'make', 'update', 'edit', 'change', 'delete', 'remove', 'show', 'view', 'list', 'complete', 'done']
    return actionWords.some(word => message.toLowerCase().includes(word))
  }

  private hasEntityWords(message: string): boolean {
    const entityWords = ['habit', 'goal', 'journal', 'entry', 'mood', 'routine', 'belief', 'synchronicity']
    return entityWords.some(word => message.toLowerCase().includes(word))
  }

  private hasPartialMatch(message: string): boolean {
    return this.hasActionWords(message) || this.hasEntityWords(message)
  }

  private detectPossibleTypos(message: string): string[] {
    const corrections: Record<string, string> = {
      'habbit': 'habit',
      'goall': 'goal',
      'jurnal': 'journal',
      'creat': 'create',
      'updat': 'update',
      'delet': 'delete'
    }

    const words = message.toLowerCase().split(/\s+/)
    const typos: string[] = []

    words.forEach(word => {
      if (corrections[word]) {
        typos.push(message.replace(new RegExp(word, 'gi'), corrections[word]))
      }
    })

    return typos
  }

  private getNameExamples(entityType: EntityType): string[] {
    const examples: Record<EntityType, string[]> = {
      habit: ['Drink 8 glasses of water', 'Exercise for 30 minutes', 'Read before bed'],
      goal: ['Lose 10 pounds', 'Learn Spanish', 'Save $5000', 'Run a marathon'],
      journal: ['Today\'s thoughts', 'Weekend reflection', 'Work progress'],
      mood: ['Morning mood check', 'Post-workout feeling'],
      routine: ['Morning routine', 'Evening wind-down', 'Workout routine'],
      belief: ['I am capable', 'Growth mindset', 'Abundance thinking'],
      synchronicity: ['Meeting an old friend', 'Perfect timing', 'Meaningful coincidence']
    }
    return examples[entityType] || []
  }

  private determineErrorSeverity(message: string, userId?: string): ErrorSeverity {
    // Check user error history
    if (userId && this.userErrorHistory.has(userId)) {
      const userErrors = this.userErrorHistory.get(userId)!
      const recentErrors = userErrors.filter(
        error => Date.now() - new Date(error.context.timestamp).getTime() < this.errorCooldownMs
      )

      if (recentErrors.length > 3) {
        return ErrorSeverity.HIGH // User is struggling
      }
    }

    // Simple heuristics for severity
    if (message.length < 3) return ErrorSeverity.HIGH
    if (message.length < 10) return ErrorSeverity.MEDIUM
    return ErrorSeverity.LOW
  }

  private generateUserFriendlyMessage(message: string, suggestions: ErrorSuggestion[]): string {
    let friendlyMessage = `I couldn't understand "${message}". `

    if (suggestions.length > 0) {
      const topSuggestion = suggestions[0]
      friendlyMessage += topSuggestion.description
    } else {
      friendlyMessage += 'Could you please rephrase your request?'
    }

    return friendlyMessage
  }

  private generateValidationUserMessage(operation: ParsedEntityOperation, errors: string[]): string {
    const entityType = operation.entityType
    let message = `I understand you want to ${operation.intent} a ${entityType}, but `

    if (errors.length === 1) {
      message += `there's an issue: ${errors[0]}`
    } else {
      message += `there are a few issues: ${errors.join(', ')}`
    }

    return message
  }

  private categorizeServiceError(error: Error): string {
    if (error.message.includes('network')) return 'NET_001'
    if (error.message.includes('timeout')) return 'NET_002'
    if (error.message.includes('unauthorized')) return 'AUTH_001'
    if (error.message.includes('forbidden')) return 'AUTH_002'
    if (error.message.includes('rate limit')) return 'RATE_001'
    return 'SVC_001'
  }

  private mapServiceErrorType(error: Error): ErrorType {
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return ErrorType.NETWORK_ERROR
    }
    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      return ErrorType.AUTHENTICATION_ERROR
    }
    if (error.message.includes('rate limit')) {
      return ErrorType.RATE_LIMIT_ERROR
    }
    return ErrorType.SERVICE_ERROR
  }

  private determineServiceErrorSeverity(error: Error, serviceName: string): ErrorSeverity {
    if (error.message.includes('critical') || serviceName === 'database') {
      return ErrorSeverity.CRITICAL
    }
    if (error.message.includes('timeout') || error.message.includes('network')) {
      return ErrorSeverity.MEDIUM
    }
    return ErrorSeverity.LOW
  }

  private generateServiceErrorSuggestions(
    operation: ParsedEntityOperation,
    error: Error,
    serviceName: string
  ): ErrorSuggestion[] {
    const suggestions: ErrorSuggestion[] = []

    if (error.message.includes('network') || error.message.includes('timeout')) {
      suggestions.push({
        id: 'retry_operation',
        title: 'Try again',
        description: 'The service might be temporarily unavailable. Try again in a moment.',
        actionType: 'retry',
        confidence: 0.8
      })
    }

    if (error.message.includes('rate limit')) {
      suggestions.push({
        id: 'wait_and_retry',
        title: 'Wait and try again',
        description: 'You\'ve made too many requests. Please wait a moment and try again.',
        actionType: 'retry',
        confidence: 0.9
      })
    }

    suggestions.push({
      id: 'use_fallback',
      title: 'Use alternative method',
      description: 'Try using the manual form instead of chat commands',
      actionType: 'alternative',
      confidence: 0.7
    })

    return suggestions
  }

  private generateServiceRecoveryActions(
    operation: ParsedEntityOperation,
    error: Error,
    serviceName: string
  ): RecoveryAction[] {
    const actions: RecoveryAction[] = []

    if (error.message.includes('network') || error.message.includes('timeout')) {
      actions.push({
        id: 'auto_retry',
        label: 'Retry automatically',
        description: 'I\'ll try the operation again in a few seconds',
        actionType: 'automatic',
        handler: 'autoRetry',
        priority: 1
      })
    }

    actions.push({
      id: 'fallback_storage',
      label: 'Save for later',
      description: 'Save your request and try it again when the service is available',
      actionType: 'fallback',
      handler: 'savePendingOperation',
      priority: 2
    })

    return actions
  }

  private generateServiceErrorUserMessage(operation: ParsedEntityOperation, error: Error): string {
    if (error.message.includes('network')) {
      return 'I\'m having trouble connecting to the service right now. Please try again in a moment.'
    }
    if (error.message.includes('rate limit')) {
      return 'You\'ve been making requests very quickly. Please wait a moment before trying again.'
    }
    return 'Something went wrong while processing your request. I\'ll try to help you resolve this.'
  }

  private recordError(userId: string | undefined, error: ChatEntityError): void {
    if (!userId) return

    if (!this.userErrorHistory.has(userId)) {
      this.userErrorHistory.set(userId, [])
    }

    const userErrors = this.userErrorHistory.get(userId)!
    userErrors.push(error)

    // Keep only recent errors (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    this.userErrorHistory.set(
      userId,
      userErrors.filter(e => new Date(e.context.timestamp).getTime() > oneDayAgo)
    )

    // Update error counts
    const errorKey = `${error.type}_${error.code}`
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1)
  }

  /**
   * Get error analytics for monitoring
   */
  getErrorAnalytics(): {
    totalErrors: number
    errorsByType: Record<ErrorType, number>
    topErrorCodes: Array<{ code: string; count: number }>
    userErrorPatterns: Array<{ userId: string; errorCount: number; lastError: string }>
  } {
    const errorsByType: Record<ErrorType, number> = {} as any
    Object.values(ErrorType).forEach(type => {
      errorsByType[type] = 0
    })

    const errorCodes: Record<string, number> = {}

    this.errorCounts.forEach((count, key) => {
      const [type, code] = key.split('_')
      errorsByType[type as ErrorType] += count
      errorCodes[code] = count
    })

    const topErrorCodes = Object.entries(errorCodes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }))

    const userErrorPatterns = Array.from(this.userErrorHistory.entries())
      .map(([userId, errors]) => ({
        userId,
        errorCount: errors.length,
        lastError: errors[errors.length - 1]?.context.timestamp || ''
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10)

    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorsByType,
      topErrorCodes,
      userErrorPatterns
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const chatEntityErrorHandler = new ChatEntityErrorHandler()