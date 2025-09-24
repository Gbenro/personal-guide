// =============================================================================
// CHAT ENTITY MASTER INTEGRATION
// Complete integration layer for the chat-based entity parser system
// =============================================================================

import { chatEntityParser, resolveDisambiguation, isDisambiguationResponse } from './chatEntityParser'
import { chatEntityErrorHandler } from './chatEntityErrorHandler'
import { chatEntityContextManager } from './chatEntityContext'
import { EntityOperationHandler, createEntityOperationHandler } from './entityOperationHandler'

import type {
  ParsedEntityOperation,
  ChatEntityRequest,
  ChatEntityResponse,
  ExtendedOperationResult,
  ParsingOptions,
  ChatEntityConfig,
  MonitoringData,
  PerformanceMetrics
} from '../types/chatEntity'

export class ChatEntityMaster {
  private defaultConfig: ChatEntityConfig
  private operationHandlers: Map<string, EntityOperationHandler> = new Map()
  private performanceMetrics: PerformanceMetrics
  private monitoringEnabled = true

  constructor(config?: Partial<ChatEntityConfig>) {
    this.defaultConfig = this.createDefaultConfig()
    if (config) {
      this.defaultConfig = { ...this.defaultConfig, ...config }
    }

    this.performanceMetrics = this.initializeMetrics()
    this.setupConfiguration()
  }

  /**
   * Main entry point for processing chat entity requests
   */
  async processMessage(request: ChatEntityRequest): Promise<ChatEntityResponse> {
    const startTime = Date.now()
    const requestId = this.generateRequestId()

    try {
      // Track the request
      this.trackRequest(request, requestId)

      // Get or create context
      const context = this.defaultConfig.context.enabled
        ? chatEntityContextManager.getContext(request.userId, request.sessionId)
        : undefined

      // Resolve references using context
      let processedMessage = request.message
      if (context) {
        processedMessage = chatEntityContextManager.resolveReferences(
          context.id,
          request.message
        )
      }

      // Check if this is a disambiguation response
      if (context?.awaitingDisambiguation && isDisambiguationResponse(request.message)) {
        return await this.handleDisambiguationResponse(
          request,
          context,
          requestId,
          startTime
        )
      }

      // Parse the message
      const parseStartTime = Date.now()
      const parsedOperation = await chatEntityParser.parseMessage(processedMessage)
      const parseTime = Date.now() - parseStartTime

      // Update context with the message and result
      if (context) {
        chatEntityContextManager.updateContext(
          context.id,
          request.message,
          parsedOperation || undefined
        )
      }

      // Handle parsing failure
      if (!parsedOperation) {
        const error = chatEntityErrorHandler.handleParsingError(
          request.message,
          undefined,
          request.userId
        )

        return this.createErrorResponse(error, requestId, startTime)
      }

      // Handle disambiguation
      if (parsedOperation.needsDisambiguation) {
        return this.createDisambiguationResponse(
          parsedOperation,
          requestId,
          startTime
        )
      }

      // Execute the operation
      const executionResult = await this.executeOperation(
        parsedOperation,
        request.userId,
        request.options
      )

      // Create success response
      const response = this.createSuccessResponse(
        parsedOperation,
        executionResult,
        requestId,
        startTime,
        { parseTime }
      )

      // Update metrics
      this.updateMetrics(true, Date.now() - startTime, parsedOperation.confidence)

      return response

    } catch (error) {
      // Handle unexpected errors
      const chatError = chatEntityErrorHandler.handleServiceError(
        { originalMessage: request.message } as ParsedEntityOperation,
        error as Error,
        'ChatEntityMaster',
        request.userId
      )

      this.updateMetrics(false, Date.now() - startTime, 0)

      return this.createErrorResponse(chatError, requestId, startTime)
    }
  }

  /**
   * Execute a parsed operation using the appropriate service
   */
  private async executeOperation(
    operation: ParsedEntityOperation,
    userId: string,
    options?: ParsingOptions
  ): Promise<ExtendedOperationResult> {
    const startTime = Date.now()

    try {
      // Get or create operation handler for user
      let handler = this.operationHandlers.get(userId)
      if (!handler) {
        handler = createEntityOperationHandler(userId)
        this.operationHandlers.set(userId, handler)
      }

      // Execute the operation
      const result = await handler.executeOperation(operation)

      // Create extended result
      const extendedResult: ExtendedOperationResult = {
        ...result,
        operationId: this.generateOperationId(),
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        contextUsed: !!options?.useContext,
        confidenceScore: operation.confidence,
        alternatives: operation.alternatives
      }

      return extendedResult

    } catch (error) {
      // Convert to chat entity error and throw
      const chatError = chatEntityErrorHandler.handleServiceError(
        operation,
        error as Error,
        'OperationHandler',
        userId
      )
      throw chatError
    }
  }

  /**
   * Handle disambiguation responses
   */
  private async handleDisambiguationResponse(
    request: ChatEntityRequest,
    context: any,
    requestId: string,
    startTime: number
  ): Promise<ChatEntityResponse> {
    if (!context.pendingOperation) {
      const error = chatEntityErrorHandler.handleParsingError(
        request.message,
        undefined,
        request.userId
      )
      return this.createErrorResponse(error, requestId, startTime)
    }

    // Try to resolve the disambiguation
    const userChoice = request.message.trim()
    const resolvedOperation = resolveDisambiguation(
      {
        originalMessage: context.pendingOperation.originalMessage,
        primaryOption: context.pendingOperation,
        alternatives: context.pendingOperation.alternatives || [],
        suggestedQuestions: []
      },
      isNaN(Number(userChoice)) ? userChoice : Number(userChoice)
    )

    if (!resolvedOperation) {
      const error = chatEntityErrorHandler.handleParsingError(
        request.message,
        context.pendingOperation,
        request.userId
      )
      return this.createErrorResponse(error, requestId, startTime)
    }

    // Clear disambiguation state
    context.awaitingDisambiguation = false
    context.pendingOperation = undefined

    // Execute the resolved operation
    const executionResult = await this.executeOperation(
      resolvedOperation,
      request.userId,
      request.options
    )

    return this.createSuccessResponse(
      resolvedOperation,
      executionResult,
      requestId,
      startTime
    )
  }

  /**
   * Create response objects
   */
  private createSuccessResponse(
    operation: ParsedEntityOperation,
    result: ExtendedOperationResult,
    requestId: string,
    startTime: number,
    additionalMetrics?: Record<string, any>
  ): ChatEntityResponse {
    return {
      success: true,
      operation,
      result,
      suggestions: this.getContextualSuggestions(operation),
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        confidenceScore: operation.confidence,
        ...additionalMetrics
      }
    }
  }

  private createErrorResponse(
    error: any,
    requestId: string,
    startTime: number
  ): ChatEntityResponse {
    return {
      success: false,
      error,
      suggestions: error.suggestions || [],
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    }
  }

  private createDisambiguationResponse(
    operation: ParsedEntityOperation,
    requestId: string,
    startTime: number
  ): ChatEntityResponse {
    return {
      success: false,
      operation,
      needsDisambiguation: true,
      disambiguationOptions: operation.alternatives || [],
      suggestions: operation.suggestions || [],
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        confidenceScore: operation.confidence
      }
    }
  }

  /**
   * Utility methods
   */
  private getContextualSuggestions(operation: ParsedEntityOperation): any[] {
    // This would typically get suggestions from the context manager
    // For now, return basic suggestions
    return operation.suggestions || []
  }

  private trackRequest(request: ChatEntityRequest, requestId: string): void {
    if (!this.monitoringEnabled) return

    const monitoringData: MonitoringData = {
      timestamp: new Date().toISOString(),
      userId: request.userId,
      operation: 'process_message',
      entityType: 'unknown' as any, // Will be updated after parsing
      intent: 'unknown' as any, // Will be updated after parsing
      success: false, // Will be updated
      confidence: 0, // Will be updated
      executionTime: 0, // Will be updated
      contextData: {
        sessionLength: 0, // Would come from context
        messageCount: 0, // Would come from context
        timeOfDay: new Date().getHours().toString(),
        recentOperations: []
      }
    }

    // Store or send monitoring data
    this.storeMonitoringData(monitoringData)
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createDefaultConfig(): ChatEntityConfig {
    return {
      parser: {
        confidenceThreshold: 0.75,
        debugMode: false,
        enableDisambiguation: true,
        enableContextAwareness: true,
        maxAlternatives: 3,
        timeoutMs: 5000
      },
      errorHandling: {
        maxRetries: 3,
        retryDelay: 1000,
        escalationThreshold: 5,
        userNotificationThreshold: 3,
        errorReportingEnabled: true
      },
      context: {
        enabled: true,
        maxHistoryLength: 100,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        patternAnalysisEnabled: true,
        predictionEnabled: true
      },
      validation: {
        strictMode: false,
        autoCorrectEnabled: true,
        warningsEnabled: true,
        customRules: []
      },
      monitoring: {
        enabled: true,
        metricsInterval: 60000, // 1 minute
        alerting: {
          errorRateThreshold: 0.1,
          confidenceThreshold: 0.6,
          responseTimeThreshold: 2000
        }
      },
      integrations: {
        enabledServices: ['habitService', 'goalsService', 'journalService', 'moodEnergyService'],
        timeouts: {
          habitService: 5000,
          goalsService: 5000,
          journalService: 5000,
          moodEnergyService: 5000
        },
        fallbackStrategies: {
          habitService: 'retry',
          goalsService: 'retry',
          journalService: 'degrade',
          moodEnergyService: 'degrade'
        }
      }
    }
  }

  private setupConfiguration(): void {
    // Apply parser configuration
    const parserConfig = this.defaultConfig.parser
    chatEntityParser.setConfidenceThreshold(parserConfig.confidenceThreshold)
    chatEntityParser.setDebugMode(parserConfig.debugMode)

    // Set up error handling configuration
    // (Would configure the error handler with the settings)

    // Set up context configuration
    // (Would configure the context manager with the settings)
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      totalOperations: 0,
      successfulOperations: 0,
      averageParsingTime: 0,
      averageExecutionTime: 0,
      averageConfidence: 0,
      errorRate: 0,
      disambiguationRate: 0
    }
  }

  private updateMetrics(success: boolean, executionTime: number, confidence: number): void {
    this.performanceMetrics.totalOperations++

    if (success) {
      this.performanceMetrics.successfulOperations++
    }

    // Update averages (simplified - in practice would use a rolling window)
    const total = this.performanceMetrics.totalOperations
    this.performanceMetrics.averageExecutionTime =
      (this.performanceMetrics.averageExecutionTime * (total - 1) + executionTime) / total

    if (confidence > 0) {
      this.performanceMetrics.averageConfidence =
        (this.performanceMetrics.averageConfidence * (total - 1) + confidence) / total
    }

    this.performanceMetrics.errorRate = 1 - (this.performanceMetrics.successfulOperations / total)
  }

  private storeMonitoringData(data: MonitoringData): void {
    // In a real implementation, this would store to a monitoring system
    // For now, just log if debug mode is enabled
    if (this.defaultConfig.parser.debugMode) {
      console.log('Monitoring Data:', data)
    }
  }

  /**
   * Public API methods
   */

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  } {
    const errorRate = this.performanceMetrics.errorRate
    const avgConfidence = this.performanceMetrics.averageConfidence
    const avgResponseTime = this.performanceMetrics.averageExecutionTime

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (errorRate > 0.2 || avgConfidence < 0.5 || avgResponseTime > 3000) {
      status = 'unhealthy'
    } else if (errorRate > 0.1 || avgConfidence < 0.7 || avgResponseTime > 2000) {
      status = 'degraded'
    }

    return {
      status,
      details: {
        errorRate,
        averageConfidence: avgConfidence,
        averageResponseTime: avgResponseTime,
        totalOperations: this.performanceMetrics.totalOperations,
        successRate: this.performanceMetrics.successfulOperations / this.performanceMetrics.totalOperations
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ChatEntityConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
    this.setupConfiguration()
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.performanceMetrics = this.initializeMetrics()
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.operationHandlers.clear()
    chatEntityContextManager.cleanupOldContexts()
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Simple function for one-off message processing
 */
export async function processEntityMessage(
  message: string,
  userId: string,
  options?: ParsingOptions
): Promise<ChatEntityResponse> {
  const master = new ChatEntityMaster()
  return master.processMessage({
    message,
    userId,
    sessionId: options?.sessionId,
    options
  })
}

/**
 * Create a pre-configured master instance
 */
export function createChatEntityMaster(config?: Partial<ChatEntityConfig>): ChatEntityMaster {
  return new ChatEntityMaster(config)
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const chatEntityMaster = new ChatEntityMaster()