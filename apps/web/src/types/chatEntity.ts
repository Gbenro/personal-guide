// =============================================================================
// COMPREHENSIVE CHAT ENTITY TYPE DEFINITIONS
// Complete type system for the chat-based entity parser infrastructure
// =============================================================================

// Re-export core types from other modules
export type {
  EntityType,
  OperationType,
  ParsedEntityOperation,
  EntityAlternative,
  DisambiguationContext
} from '../lib/chatEntityParser'

export type {
  ErrorType,
  ErrorSeverity,
  ChatEntityError,
  ErrorSuggestion,
  RecoveryAction
} from '../lib/chatEntityErrorHandler'

export type {
  ConversationContext,
  ConversationMessage,
  UserPreferences,
  ConversationPatterns,
  RecentActivity,
  EnvironmentContext,
  ContextualSuggestion,
  IntentPrediction,
  ConversationSummary
} from '../lib/chatEntityContext'

export type {
  OperationResult,
  ConfirmationContext
} from '../lib/entityOperationHandler'

// =============================================================================
// PARSER CONFIGURATION TYPES
// =============================================================================

export interface ParserConfig {
  confidenceThreshold: number
  debugMode: boolean
  enableDisambiguation: boolean
  enableContextAwareness: boolean
  maxAlternatives: number
  timeoutMs: number
}

export interface ParsingOptions {
  userId?: string
  sessionId?: string
  useContext?: boolean
  strictMode?: boolean
  retryOnFailure?: boolean
}

// =============================================================================
// ENHANCED OPERATION RESULT TYPES
// =============================================================================

export interface ExtendedOperationResult extends OperationResult {
  operationId: string
  timestamp: string
  executionTimeMs: number
  contextUsed: boolean
  confidenceScore: number
  alternatives?: EntityAlternative[]
  analytics?: OperationAnalytics
}

export interface OperationAnalytics {
  parsingTimeMs: number
  validationTimeMs: number
  executionTimeMs: number
  confidenceFactors: ConfidenceBreakdown
  userPatterns: PatternAnalysis
}

export interface ConfidenceBreakdown {
  intentMatch: number
  entityMatch: number
  parameterCompleteness: number
  keywordDensity: number
  grammarQuality: number
  contextCoherence: number
  finalScore: number
}

export interface PatternAnalysis {
  isTypicalForUser: boolean
  matchesPastBehavior: number // 0-1 score
  timeOfDayConsistency: number // 0-1 score
  complexityLevel: 'simple' | 'moderate' | 'complex'
}

// =============================================================================
// ENTITY-SPECIFIC TYPES
// =============================================================================

export interface HabitChatOperation {
  entityType: 'habit'
  intent: OperationType
  parameters: {
    name?: string
    description?: string
    frequency?: 'daily' | 'weekly' | 'monthly'
    category?: string
    reminder_time?: string
    target_count?: number
    color?: string
    is_active?: boolean
  }
}

export interface GoalChatOperation {
  entityType: 'goal'
  intent: OperationType
  parameters: {
    title?: string
    description?: string
    category?: string
    priority?: 'low' | 'medium' | 'high'
    target_date?: string
    milestones?: string[]
    success_criteria?: string
    is_active?: boolean
  }
}

export interface JournalChatOperation {
  entityType: 'journal'
  intent: OperationType
  parameters: {
    content?: string
    title?: string
    mood_rating?: number
    tags?: string[]
    is_private?: boolean
    template?: string
  }
}

export interface MoodChatOperation {
  entityType: 'mood'
  intent: OperationType
  parameters: {
    mood_rating?: number
    energy_level?: number
    notes?: string
    context?: {
      location?: string
      weather?: string
      activities?: string[]
    }
  }
}

export interface RoutineChatOperation {
  entityType: 'routine'
  intent: OperationType
  parameters: {
    name?: string
    description?: string
    steps?: string[]
    time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night'
    duration_minutes?: number
    category?: string
  }
}

export interface BeliefChatOperation {
  entityType: 'belief'
  intent: OperationType
  parameters: {
    statement?: string
    category?: 'core' | 'limiting' | 'empowering'
    confidence?: number
    evidence?: string[]
    created_date?: string
  }
}

export interface SynchronicityChatOperation {
  entityType: 'synchronicity'
  intent: OperationType
  parameters: {
    description?: string
    significance?: number
    interpretation?: string
    context?: string
    tags?: string[]
    date_occurred?: string
  }
}

export type EntityChatOperation =
  | HabitChatOperation
  | GoalChatOperation
  | JournalChatOperation
  | MoodChatOperation
  | RoutineChatOperation
  | BeliefChatOperation
  | SynchronicityChatOperation

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationRule {
  field: string
  type: 'required' | 'optional' | 'conditional'
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object'
  constraints?: ValidationConstraints
  errorMessage?: string
}

export interface ValidationConstraints {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  allowedValues?: string[]
  dependsOn?: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  impact: 'low' | 'medium' | 'high'
}

export interface ValidationSuggestion {
  field: string
  suggestion: string
  autoApplicable: boolean
}

// =============================================================================
// CHAT INTERFACE TYPES
// =============================================================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  type: ChatMessageType
  metadata?: ChatMessageMetadata
}

export type ChatMessageType =
  | 'command'
  | 'response'
  | 'error'
  | 'clarification'
  | 'disambiguation'
  | 'confirmation'
  | 'success'
  | 'warning'
  | 'info'

export interface ChatMessageMetadata {
  operationId?: string
  entityType?: EntityType
  intent?: OperationType
  confidence?: number
  needsAction?: boolean
  suggestedActions?: string[]
  relatedEntities?: string[]
}

export interface ChatSession {
  id: string
  userId: string
  startTime: string
  endTime?: string
  messageCount: number
  operationCount: number
  successRate: number
  averageConfidence: number
  primaryEntityTypes: EntityType[]
  mood: 'positive' | 'neutral' | 'negative'
}

// =============================================================================
// PERFORMANCE AND MONITORING TYPES
// =============================================================================

export interface PerformanceMetrics {
  totalOperations: number
  successfulOperations: number
  averageParsingTime: number
  averageExecutionTime: number
  averageConfidence: number
  errorRate: number
  disambiguationRate: number
  userSatisfactionScore?: number
}

export interface ParseMetrics {
  parseTime: number
  confidenceScore: number
  alternativeCount: number
  disambiguationRequired: boolean
  contextUsed: boolean
  errorOccurred: boolean
}

export interface MonitoringData {
  timestamp: string
  userId: string
  operation: string
  entityType: EntityType
  intent: OperationType
  success: boolean
  confidence: number
  executionTime: number
  errorType?: string
  contextData: {
    sessionLength: number
    messageCount: number
    timeOfDay: string
    recentOperations: string[]
  }
}

// =============================================================================
// INTEGRATION TYPES
// =============================================================================

export interface ServiceIntegration {
  serviceName: string
  operations: OperationType[]
  entityTypes: EntityType[]
  healthStatus: 'healthy' | 'degraded' | 'unhealthy'
  lastHealthCheck: string
  responseTime: number
  errorRate: number
}

export interface ExternalServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata: {
    requestId: string
    timestamp: string
    service: string
    operation: string
    duration: number
  }
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface ChatEntityConfig {
  parser: ParserConfig
  errorHandling: ErrorHandlingConfig
  context: ContextConfig
  validation: ValidationConfig
  monitoring: MonitoringConfig
  integrations: IntegrationConfig
}

export interface ErrorHandlingConfig {
  maxRetries: number
  retryDelay: number
  escalationThreshold: number
  userNotificationThreshold: number
  errorReportingEnabled: boolean
}

export interface ContextConfig {
  enabled: boolean
  maxHistoryLength: number
  sessionTimeout: number
  patternAnalysisEnabled: boolean
  predictionEnabled: boolean
}

export interface ValidationConfig {
  strictMode: boolean
  autoCorrectEnabled: boolean
  warningsEnabled: boolean
  customRules: ValidationRule[]
}

export interface MonitoringConfig {
  enabled: boolean
  metricsInterval: number
  alerting: {
    errorRateThreshold: number
    confidenceThreshold: number
    responseTimeThreshold: number
  }
}

export interface IntegrationConfig {
  enabledServices: string[]
  timeouts: Record<string, number>
  fallbackStrategies: Record<string, 'retry' | 'degrade' | 'fail'>
}

// =============================================================================
// API TYPES
// =============================================================================

export interface ChatEntityRequest {
  message: string
  userId: string
  sessionId?: string
  options?: ParsingOptions
}

export interface ChatEntityResponse {
  success: boolean
  operation?: ParsedEntityOperation
  result?: ExtendedOperationResult
  error?: ChatEntityError
  suggestions?: ContextualSuggestion[]
  needsDisambiguation?: boolean
  disambiguationOptions?: EntityAlternative[]
  metadata: {
    requestId: string
    timestamp: string
    processingTime: number
    confidenceScore?: number
  }
}

export interface BatchChatEntityRequest {
  messages: Array<{
    id: string
    message: string
    userId: string
    sessionId?: string
  }>
  options?: ParsingOptions
}

export interface BatchChatEntityResponse {
  results: Array<{
    id: string
    response: ChatEntityResponse
  }>
  summary: {
    totalRequests: number
    successfulRequests: number
    averageProcessingTime: number
    averageConfidence: number
  }
}

// =============================================================================
// TESTING TYPES
// =============================================================================

export interface TestCase {
  id: string
  description: string
  input: string
  expectedIntent: OperationType
  expectedEntityType: EntityType
  expectedParameters: Record<string, any>
  minimumConfidence: number
  context?: Partial<ConversationContext>
}

export interface TestResult {
  testId: string
  passed: boolean
  actualResult?: ParsedEntityOperation
  confidence: number
  errors: string[]
  executionTime: number
}

export interface TestSuite {
  name: string
  description: string
  testCases: TestCase[]
  results?: TestResult[]
  summary?: {
    totalTests: number
    passedTests: number
    failedTests: number
    averageConfidence: number
    averageExecutionTime: number
  }
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface UsageAnalytics {
  timeframe: 'hour' | 'day' | 'week' | 'month'
  totalOperations: number
  uniqueUsers: number
  operationBreakdown: Record<OperationType, number>
  entityBreakdown: Record<EntityType, number>
  averageConfidence: number
  successRate: number
  topErrorTypes: Array<{ type: string; count: number }>
  performanceTrends: PerformanceTrend[]
}

export interface PerformanceTrend {
  timestamp: string
  avgParsingTime: number
  avgExecutionTime: number
  avgConfidence: number
  operationCount: number
  errorRate: number
}

export interface UserBehaviorAnalytics {
  userId: string
  totalSessions: number
  totalOperations: number
  preferredEntityTypes: EntityType[]
  preferredOperations: OperationType[]
  averageSessionLength: number
  successRate: number
  learningCurve: Array<{
    week: number
    confidence: number
    errorRate: number
  }>
  commonPatterns: string[]
  improvementSuggestions: string[]
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type ChatEntityTypeUnion =
  | ParsedEntityOperation
  | ChatEntityError
  | ConversationContext
  | ExtendedOperationResult
  | EntityChatOperation
  | ChatMessage
  | TestCase
  | UsageAnalytics