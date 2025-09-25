import { z } from 'zod'

// =============================================================================
// ENTITY TYPES AND SCHEMAS
// =============================================================================

export type EntityType = 'habit' | 'goal' | 'journal' | 'mood' | 'routine' | 'belief' | 'synchronicity'
export type OperationType = 'create' | 'update' | 'delete' | 'view' | 'complete' | 'toggle'

export interface ParsedEntityOperation {
  intent: OperationType
  entityType: EntityType
  entityId?: string
  parameters: Record<string, any>
  confidence: number
  originalMessage: string
  suggestions?: string[]
}

// Entity schemas for validation
const HabitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  reminder_time: z.string().optional(),
  is_active: z.boolean().default(true)
})

const GoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  target_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  is_active: z.boolean().default(true)
})

const JournalSchema = z.object({
  content: z.string().min(1),
  mood_rating: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).optional(),
  is_private: z.boolean().default(false)
})

// =============================================================================
// NATURAL LANGUAGE PATTERNS
// =============================================================================

const INTENT_PATTERNS = {
  create: [
    /^(?:create|add|new|start|begin)\s+(?:a\s+)?(.+)/i,
    /^(?:i\s+want\s+to\s+)?(?:create|add|start)\s+(.+)/i,
    /^(?:let's\s+)?(?:create|add|make)\s+(.+)/i,
    // Belief creation patterns
    /^(?:i\s+believe|i\s+am|i\s+can|i\s+have|i\s+will)\s+(.+)/i,
    /^(?:belief|affirmation|statement)\s*:\s*(.+)/i,
    // Synchronicity logging patterns
    /^(?:log|record|note)\s+(?:synchronicity|synch|sign)\s*:?\s*(.+)/i,
    /^(?:amazing|incredible|wow|powerful)\s+(?:synchronicity|sign|coincidence)/i,
    /^(?:synchronicity|synch)\s*!\s*(.+)/i
  ],
  update: [
    /^(?:update|edit|change|modify)\s+(.+)/i,
    /^(?:i\s+want\s+to\s+)?(?:update|edit|change)\s+(.+)/i,
    /^(?:can\s+you\s+)?(?:update|edit|change)\s+(.+)/i,
    // Belief reinforcement patterns
    /^(?:reinforce|strengthen|affirm|practice)\s+(?:belief|mindset)\s*:?\s*(.+)/i,
    /^(?:challenge|question|examine)\s+(?:belief|mindset)\s*:?\s*(.+)/i
  ],
  delete: [
    /^(?:delete|remove|cancel|stop)\s+(.+)/i,
    /^(?:i\s+want\s+to\s+)?(?:delete|remove)\s+(.+)/i
  ],
  complete: [
    /^(?:complete|finish|done\s+with)\s+(.+)/i,
    /^(?:i\s+)?(?:completed|finished|did)\s+(.+)/i,
    /^(?:mark\s+)?(.+)\s+(?:as\s+)?(?:complete|done|finished)/i
  ],
  toggle: [
    /^(?:toggle|switch)\s+(.+)/i,
    /^(?:turn\s+(?:on|off))\s+(.+)/i
  ],
  view: [
    /^(?:show|display|view|list)\s+(.+)/i,
    /^(?:what\s+(?:are\s+)?(?:my|the))\s+(.+)/i,
    /^(?:i\s+want\s+to\s+see)\s+(.+)/i,
    // Enhanced mood trend viewing patterns
    /(?:show|display|view).*(?:my\s+)?mood.*(?:trends?|history|patterns?|over\s+time)/i,
    /(?:mood|feeling)\s+(?:trends?|history|patterns?|analytics?)/i,
    /(?:how\s+(?:has|is)\s+my\s+mood\s+(?:been|trending))/i,
    /(?:my\s+mood\s+(?:over\s+time|trends?|history))/i
  ]
}

const ENTITY_PATTERNS = {
  habit: [
    /\b(?:habit|routine|practice|activity)\b/i,
    /\b(?:daily|weekly|monthly)\s+(?:habit|routine|practice|activity)\b/i
  ],
  goal: [
    /\b(?:goal|objective|target|aim)\b/i,
    /\b(?:long[- ]?term|short[- ]?term)\s+goal\b/i
  ],
  journal: [
    /\b(?:journal|entry|note|reflection|thought)\b/i,
    /\b(?:daily|weekly)\s+(?:journal|entry|note)\b/i
  ],
  mood: [
    /\b(?:mood|feeling|emotion|energy)\b/i,
    /\b(?:mood\s+(?:rating|score|entry))\b/i,
    // Enhanced patterns for "Mood: excited about..." style
    /^mood\s*:/i,
    /\bi\s+am\s+feeling\b/i,
    /\bi\s+feel\b/i,
    /\bfeeling\s+\w+(?:\s+about|\s+today|\s+right\s+now)/i,
    // Show mood trends patterns
    /\bshow\s+(?:my\s+)?mood\s+trends?\b/i,
    /\bmood\s+trends?\b/i,
    /\bmy\s+mood\s+(?:over\s+time|history|pattern|trends?)/i,
    /\bshow.*mood.*(?:trends?|history|patterns?|over\s+time)/i
  ],
  routine: [
    /\b(?:routine|schedule|workflow|process)\b/i,
    /\b(?:morning|evening|workout)\s+routine\b/i
  ],
  belief: [
    /\b(?:belief|value|principle|mindset)\b/i,
    /\b(?:core\s+belief|limiting\s+belief)\b/i,
    /\b(?:i\s+believe|i\s+am|i\s+can|i\s+have)\b/i,
    /\b(?:affirmation|mantra|statement)\b/i,
    /\b(?:reinforce|strengthen|challenge)\s+(?:belief|mindset)\b/i
  ],
  synchronicity: [
    /\b(?:synchronicity|sign|pattern|symbol|synch)\b/i,
    /\b(?:meaningful\s+coincidence|coincidence)\b/i,
    /\blog\s+(?:synchronicity|synch|sign)\b/i,
    /\b(?:amazing|incredible)\s+(?:synchronicity|sign|coincidence)\b/i,
    /\b(?:11:?11|222|333|444|555|777|888|999)\b/i // Angel numbers
  ]
}

// =============================================================================
// ADVANCED PARAMETER EXTRACTION PATTERNS
// =============================================================================

interface ExtractionRule {
  patterns: RegExp[]
  transformer?: (value: string) => any
  validator?: (value: any) => boolean
  confidence?: number
}

const PARAMETER_EXTRACTION_RULES: Record<string, ExtractionRule> = {
  // Entity names and titles
  name: {
    patterns: [
      /(?:habit|routine|practice)\s+(?:called|named|for)\s+["']([^"']+)["']/i,
      /(?:habit|routine|practice)\s+(?:called|named|for)\s+([\w\s]+?)(?:\s+(?:daily|weekly|monthly|every)|$)/i,
      /(?:add|create|new)\s+(?:a\s+)?(?:habit|routine|practice)\s+["']([^"']+)["']/i,
      /(?:add|create|new)\s+(?:a\s+)?(?:habit|routine|practice)\s+([\w\s]+?)(?:\s+(?:daily|weekly|monthly|every)|$)/i,
      /["']([^"']+)["']\s+(?:habit|routine|practice)/i,
      // Routine-specific name patterns
      /(?:create|add|new)\s+([\w\s]+?)\s+routine(?:\s*:)?/i,
      /\b(morning|evening|bedtime|workout|study|work)\s+routine\b/i,
      /([\w\s]+)\s+routine(?:\s*:|\s+including|\s+with)/i
    ],
    transformer: (value: string) => value.trim(),
    validator: (value: string) => value.length > 0 && value.length < 100,
    confidence: 0.9
  },

  title: {
    patterns: [
      /(?:goal|objective|target)\s+(?:to|of)\s+["']([^"']+)["']/i,
      /(?:goal|objective|target)\s+(?:to|of)\s+([\w\s]+?)(?:\s+(?:by|before|until)|$)/i,
      /(?:add|create|new)\s+(?:a\s+)?goal\s+["']([^"']+)["']/i,
      /(?:add|create|new)\s+(?:a\s+)?goal\s+(?:to\s+)?([\w\s]+?)(?:\s+(?:by|before|until)|$)/i,
      /["']([^"']+)["']\s+goal/i,
      // Synchronicity title patterns
      /(?:log|record)\s+(?:synchronicity|synch|sign)\s*:\s*(.+?)(?:\s+(?:saw|met|happened)|$)/i,
      /(?:synchronicity|synch)\s*!\s*(.+?)(?:\s+(?:happened|occurred)|$)/i,
      /(?:amazing|incredible)\s+(?:synchronicity|sign|coincidence)\s*:?\s*(.+?)(?:\.|$)/i
    ],
    transformer: (value: string) => value.trim(),
    validator: (value: string) => value.length > 0 && value.length < 200,
    confidence: 0.9
  },

  content: {
    patterns: [
      /(?:journal|entry|note)\s+(?:about|that)\s+["']([^"']+)["']/i,
      /(?:journal|entry|note)\s+(?:about|that)\s+(.+?)(?:\s+(?:today|yesterday|with)|$)/i,
      /(?:write|record|add)\s+(?:journal|entry|note)\s+["']([^"']+)["']/i,
      /(?:write|record|add)\s+(?:journal|entry|note)\s+(.+)/i,
      /["']([^"']+)["']\s+(?:journal|entry|note)/i
    ],
    transformer: (value: string) => value.trim(),
    validator: (value: string) => value.length > 5,
    confidence: 0.8
  },

  // Frequencies and schedules
  frequency: {
    patterns: [
      /\b(daily|weekly|monthly|yearly)\b/i,
      /(?:every|each)\s+(day|week|month|year)/i,
      /(\d+)\s+times?\s+(?:per|a|each)\s+(day|week|month|year)/i,
      /(?:once|twice|thrice)\s+(?:per|a|each)\s+(day|week|month|year)/i
    ],
    transformer: (value: string) => {
      const normalized = value.toLowerCase()
      if (normalized.includes('day')) return 'daily'
      if (normalized.includes('week')) return 'weekly'
      if (normalized.includes('month')) return 'monthly'
      if (normalized.includes('year')) return 'yearly'
      return normalized
    },
    validator: (value: string) => ['daily', 'weekly', 'monthly', 'yearly'].includes(value),
    confidence: 0.95
  },

  // Priority levels
  priority: {
    patterns: [
      /\b(low|medium|high|urgent|critical)\s+priority\b/i,
      /priority\s+(?:of\s+|is\s+)?(low|medium|high|urgent|critical)/i,
      /\b(urgent|critical|important|high)\s+(?:goal|task|item)/i,
      /\b(?:not\s+)?(urgent|important|critical)/i
    ],
    transformer: (value: string) => {
      const normalized = value.toLowerCase()
      if (['urgent', 'critical'].includes(normalized)) return 'high'
      if (['important'].includes(normalized)) return 'medium'
      return normalized
    },
    validator: (value: string) => ['low', 'medium', 'high'].includes(value),
    confidence: 0.9
  },

  // Mood and energy ratings
  mood_rating: {
    patterns: [
      // Enhanced patterns for "I am feeling happy today (8/10)" style
      /(?:i\s+am\s+feeling|i\s+feel|feeling|mood)\s+(?:\w+\s+)*(?:today\s+)?\((\d+)\/10\)/i,
      /(?:i\s+am\s+feeling|i\s+feel|feeling|mood)\s+(?:\w+\s+)*(?:today\s+)?(\d+)\/10/i,
      /(?:mood|feeling)\s*:\s*(?:\w+\s*)*\((\d+)\/10\)/i,
      /(?:mood|feeling)\s*:\s*(?:\w+\s+)*(\d+)\/10/i,
      // Original patterns
      /(?:mood|feeling)\s+(?:of\s+|is\s+)?(\d+)(?:\/10|\s+out\s+of\s+10)?/i,
      /(\d+)\s+out\s+of\s+10\s+(?:mood|feeling)/i,
      /feeling\s+(\d+)/i,
      /mood\s+(\d+)/i,
      /\b(\d)\/(10)\b/i // Captures ratings like 7/10
    ],
    transformer: (value: string) => parseInt(value, 10),
    validator: (value: number) => value >= 1 && value <= 10,
    confidence: 0.95
  },

  energy_level: {
    patterns: [
      /(?:energy|energy\s+level)\s+(?:of\s+|is\s+)?(\d+)(?:\/10|\s+out\s+of\s+10)?/i,
      /(\d+)\s+out\s+of\s+10\s+energy/i,
      /energy\s+(\d+)/i
    ],
    transformer: (value: string) => parseInt(value, 10),
    validator: (value: number) => value >= 1 && value <= 10,
    confidence: 0.95
  },

  // Time-related parameters
  reminder_time: {
    patterns: [
      /(?:at|@)\s+(\d{1,2}:\d{2}(?:\s*(?:am|pm))?)/i,
      /(?:remind\s+me\s+at)\s+(\d{1,2}:\d{2}(?:\s*(?:am|pm))?)/i,
      /(\d{1,2})(?::|\s+)?(\d{2})\s*(am|pm)?/i,
      /(?:in\s+the\s+)?(morning|afternoon|evening|night)/i
    ],
    transformer: (value: string) => {
      // Convert common time expressions to actual times
      const timeMap: Record<string, string> = {
        'morning': '09:00',
        'afternoon': '14:00',
        'evening': '18:00',
        'night': '21:00'
      }
      return timeMap[value.toLowerCase()] || value
    },
    validator: (value: string) => /^\d{1,2}:\d{2}(\s*(am|pm))?$/i.test(value),
    confidence: 0.8
  },

  target_date: {
    patterns: [
      /(?:by|before|until|due)\s+(\d{4}-\d{2}-\d{2})/i,
      /(?:by|before|until|due)\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(?:by|before|until|due)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
      /(?:by|before|until|due)\s+(next\s+week|next\s+month|end\s+of\s+week|end\s+of\s+month)/i,
      /deadline\s+(.+?)(?:\s|$)/i
    ],
    transformer: (value: string) => {
      // Convert relative dates to absolute dates
      const now = new Date()
      const relative: Record<string, Date> = {
        'next week': new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        'next month': new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
        'end of week': new Date(now.getTime() + (7 - now.getDay()) * 24 * 60 * 60 * 1000),
        'end of month': new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }

      const normalized = value.toLowerCase()
      if (relative[normalized]) {
        return relative[normalized].toISOString().split('T')[0]
      }
      return value
    },
    confidence: 0.7
  },

  // Categories
  category: {
    patterns: [
      /(?:category|type)\s+(?:of\s+|is\s+)?["']([^"']+)["']/i,
      /(?:category|type)\s+(?:of\s+|is\s+)?([\w]+)/i,
      /(?:for|in)\s+(health|fitness|work|personal|spiritual|financial|social|learning|creative)/i,
      // Routine-specific category patterns
      /\b(morning|evening|bedtime)\s+routine\b/i,
      /\b(workout|exercise|fitness)\s+routine\b/i,
      /\b(meditation|mindfulness|spiritual)\s+routine\b/i,
      /\b(work|productivity|study)\s+routine\b/i
    ],
    transformer: (value: string) => {
      const normalized = value.toLowerCase().trim()
      // Map routine types to categories
      if (['morning', 'evening', 'bedtime'].includes(normalized)) return 'sleep'
      if (['workout', 'exercise', 'fitness'].includes(normalized)) return 'fitness'
      if (['meditation', 'mindfulness', 'spiritual'].includes(normalized)) return 'wellness'
      if (['work', 'productivity', 'study'].includes(normalized)) return 'productivity'
      if (['health', 'fitness', 'exercise', 'wellness'].includes(normalized)) return 'health'
      return normalized
    },
    validator: (value: string) => value.length > 0 && value.length < 50,
    confidence: 0.7
  },

  // Tags
  tags: {
    patterns: [
      /(?:tags?)\s+(?:are\s+)?["']([^"']+)["']/i,
      /(?:tags?)\s+(?:are\s+)?([\w,\s]+)/i,
      /#([\w]+)/g, // Hashtags
      /(?:tagged\s+as)\s+([\w,\s]+)/i
    ],
    transformer: (value: string) => {
      return value.split(/[,\s]+/).map(tag => tag.replace('#', '').trim()).filter(tag => tag.length > 0)
    },
    validator: (value: string[]) => Array.isArray(value) && value.length > 0,
    confidence: 0.8
  },

  // Routine-specific parameters
  routine_type: {
    patterns: [
      /(?:routine\s+type|type\s+of\s+routine)\s+(?:is\s+)?(daily|weekly|monthly|custom)/i,
      /\b(morning|evening|workout|bedtime|study|work|meditation)\s+routine\b/i,
      /\b(daily|weekly|monthly)\s+routine\b/i
    ],
    transformer: (value: string) => {
      const normalized = value.toLowerCase()
      if (['morning', 'evening', 'bedtime'].includes(normalized)) return 'daily'
      if (['workout', 'study', 'work', 'meditation'].includes(normalized)) return 'wellness'
      return normalized
    },
    validator: (value: string) => ['daily', 'weekly', 'monthly', 'wellness', 'custom'].includes(value),
    confidence: 0.85
  },

  steps: {
    patterns: [
      /(?:steps?|tasks?):\s*(.+?)(?:\n|$)/i,
      /(?:including|involves|contains):\s*(.+?)(?:\n|$)/i,
      /(?:routine|schedule)\s+(?:of|with):\s*(.+?)(?:\n|$)/i
    ],
    transformer: (value: string) => {
      return value.split(/[,;]/).map(step => step.trim()).filter(step => step.length > 0)
    },
    validator: (value: string[]) => Array.isArray(value) && value.length > 0,
    confidence: 0.8
  },

  estimated_duration: {
    patterns: [
      /(?:takes?|duration|lasts?|time)\s+(?:about\s+)?(\d+)\s+(?:minutes?|mins?)/i,
      /(\d+)\s+(?:minute|min)\s+(?:routine|session|workout)/i,
      /(?:for|in)\s+(\d+)\s+(?:minutes?|mins?)/i
    ],
    transformer: (value: string) => parseInt(value, 10),
    validator: (value: number) => value > 0 && value <= 480, // Max 8 hours
    confidence: 0.9
  },

  // Belief-specific parameters
  statement: {
    patterns: [
      /(?:i\s+believe|belief)\s+(?:that\s+)?(.+?)(?:\.|$)/i,
      /(?:i\s+am|i'm)\s+(.+?)(?:\.|$)/i,
      /(?:affirmation|statement):\s*(.+?)(?:\.|$)/i,
      /"([^"]+)"/i // Quoted statements
    ],
    transformer: (value: string) => value.trim().replace(/^that\s+/i, ''),
    validator: (value: string) => value.length > 3 && value.length < 500,
    confidence: 0.9
  },

  belief_type: {
    patterns: [
      /\b(?:i\s+am\s+(?:worthy|deserving|enough|capable|strong|confident|successful))/i,
      /\b(?:i\s+can\s+(?:achieve|accomplish|succeed|do|handle|overcome))/i,
      /\b(?:i\s+have\s+(?:abundance|wealth|health|love|support|strength))/i,
      /\b(?:good\s+things|opportunities|success|love|abundance)\s+(?:come\s+to\s+me|flow\s+to\s+me)/i
    ],
    transformer: (value: string) => {
      const normalized = value.toLowerCase()
      if (/worthy|deserving|enough/.test(normalized)) return 'self_worth'
      if (/capable|can|achieve|accomplish|succeed/.test(normalized)) return 'capability'
      if (/abundance|wealth|money|prosperity/.test(normalized)) return 'abundance'
      if (/health|strong|energy/.test(normalized)) return 'health'
      if (/love|relationship|connection/.test(normalized)) return 'relationships'
      return 'general'
    },
    validator: (value: string) => ['self_worth', 'capability', 'abundance', 'health', 'relationships', 'general'].includes(value),
    confidence: 0.8
  },

  action: {
    patterns: [
      /(?:reinforce|strengthen|affirm|practice)\s+(?:my\s+)?belief/i,
      /(?:challenge|question|examine)\s+(?:my\s+)?belief/i,
      /(?:complete|finish|done)\s+(?:my\s+)?(?:routine|goal|task)/i
    ],
    transformer: (value: string) => {
      const normalized = value.toLowerCase()
      if (/reinforce|strengthen|affirm|practice/.test(normalized)) return 'reinforce'
      if (/challenge|question|examine/.test(normalized)) return 'challenge'
      if (/complete|finish|done/.test(normalized)) return 'complete'
      return normalized
    },
    validator: (value: string) => ['reinforce', 'challenge', 'complete', 'update'].includes(value),
    confidence: 0.9
  },

  // Synchronicity-specific parameters
  significance: {
    patterns: [
      /(?:significance|important|meaningful)\s+(?:level\s+)?(?:of\s+)?(\d+)(?:\/10|\s+out\s+of\s+10)?/i,
      /(\d+)\/10\s+(?:significance|important|meaningful)/i,
      /(?:very|extremely|highly)\s+(?:significant|meaningful|important)/i,
      /(?:amazing|incredible|powerful)\s+(?:synchronicity|sign|coincidence)/i
    ],
    transformer: (value: string | number) => {
      if (typeof value === 'number') return value
      const normalized = value.toLowerCase()
      if (/very|extremely|highly|amazing|incredible|powerful/.test(normalized)) return 9
      if (/significant|meaningful|important/.test(normalized)) return 7
      return parseInt(String(value), 10) || 5
    },
    validator: (value: number) => value >= 1 && value <= 10,
    confidence: 0.85
  },

  emotions: {
    patterns: [
      /(?:feeling|felt|emotions?)\s+([^.]+?)(?:\.|$)/i,
      /(?:made\s+me\s+feel|i\s+feel)\s+([^.]+?)(?:\.|$)/i,
      /(?:emotional\s+response|reaction):\s*([^.]+?)(?:\.|$)/i
    ],
    transformer: (value: string) => {
      return value.split(/[,&]/).map(emotion => emotion.trim()).filter(emotion => emotion.length > 0)
    },
    validator: (value: string[]) => Array.isArray(value) && value.length > 0,
    confidence: 0.8
  },

  context: {
    patterns: [
      /(?:context|situation|circumstances?):\s*(.+?)(?:\n|$)/i,
      /(?:happened\s+when|occurred\s+while|during)\s+(.+?)(?:\.|$)/i,
      /(?:i\s+was)\s+(.+?)(?:\s+when|\s+and)/i
    ],
    transformer: (value: string) => value.trim(),
    validator: (value: string) => value.length > 3 && value.length < 500,
    confidence: 0.8
  }
}

// =============================================================================
// CONFIDENCE SCORING WEIGHTS
// =============================================================================

interface ConfidenceFactors {
  intentMatch: number
  entityMatch: number
  parameterCompleteness: number
  keywordDensity: number
  grammarQuality: number
  contextCoherence: number
}

const CONFIDENCE_WEIGHTS: ConfidenceFactors = {
  intentMatch: 0.25,          // 25% - Intent pattern confidence
  entityMatch: 0.25,          // 25% - Entity pattern confidence
  parameterCompleteness: 0.20, // 20% - Required parameters provided
  keywordDensity: 0.15,       // 15% - Domain-specific keywords
  grammarQuality: 0.10,       // 10% - Natural language quality
  contextCoherence: 0.05      // 5% - Message coherence
}

// =============================================================================
// ENHANCED KEYWORD DICTIONARY
// =============================================================================

const DOMAIN_KEYWORDS = {
  habit: ['daily', 'routine', 'practice', 'consistently', 'track', 'streak', 'reminder'],
  goal: ['achieve', 'target', 'deadline', 'milestone', 'progress', 'success', 'accomplish'],
  journal: ['reflect', 'thoughts', 'feelings', 'write', 'diary', 'experience', 'today'],
  mood: ['feeling', 'emotion', 'energy', 'happy', 'sad', 'stressed', 'calm', 'excited'],
  routine: ['schedule', 'sequence', 'workflow', 'process', 'order', 'steps'],
  belief: ['believe', 'think', 'value', 'principle', 'mindset', 'perspective'],
  synchronicity: ['coincidence', 'sign', 'pattern', 'meaning', 'symbol', 'synchronous']
}

const ACTION_KEYWORDS = {
  create: ['add', 'new', 'start', 'begin', 'make', 'establish', 'set up'],
  update: ['change', 'modify', 'edit', 'adjust', 'revise', 'improve'],
  delete: ['remove', 'cancel', 'stop', 'end', 'eliminate', 'get rid of'],
  complete: ['done', 'finished', 'accomplished', 'completed', 'achieved'],
  view: ['show', 'display', 'see', 'list', 'view', 'check', 'look at']
}

// =============================================================================
// PARSER IMPLEMENTATION
// =============================================================================

export class ChatEntityParser {
  private confidenceThreshold = 0.6 // Lowered for testing new patterns
  private debugMode = false

  /**
   * Parse a natural language message for entity operations
   */
  async parseMessage(message: string): Promise<ParsedEntityOperation | null> {
    const normalizedMessage = message.trim().toLowerCase()

    // Detect intent
    const intent = this.detectIntent(normalizedMessage)
    if (!intent) return null

    // Detect entity type
    const entityType = this.detectEntityType(normalizedMessage)
    if (!entityType) return null

    // Extract parameters
    const parameters = this.extractParameters(normalizedMessage, entityType, intent)

    // Calculate confidence score
    const confidence = this.calculateConfidence(intent, entityType, parameters, message)

    if (confidence < this.confidenceThreshold) return null

    return {
      intent,
      entityType,
      parameters,
      confidence,
      originalMessage: message,
      suggestions: this.generateSuggestions(intent, entityType, parameters)
    }
  }

  private detectIntent(message: string): OperationType | null {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          return intent as OperationType
        }
      }
    }
    return null
  }

  private detectEntityType(message: string): EntityType | null {
    const scores: Record<EntityType, number> = {
      habit: 0, goal: 0, journal: 0, mood: 0, routine: 0, belief: 0, synchronicity: 0
    }

    for (const [entityType, patterns] of Object.entries(ENTITY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          scores[entityType as EntityType] += 1
        }
      }
    }

    const maxScore = Math.max(...Object.values(scores))
    if (maxScore === 0) return null

    return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] as EntityType
  }

  private extractParameters(
    message: string,
    entityType: EntityType,
    intent: OperationType
  ): Record<string, any> {
    const parameters: Record<string, any> = {}
    const extractionResults: Record<string, { value: any; confidence: number }> = {}

    // Extract using advanced patterns
    for (const [paramName, rule] of Object.entries(PARAMETER_EXTRACTION_RULES)) {
      const extraction = this.extractParameterWithRule(message, rule)
      if (extraction.found) {
        extractionResults[paramName] = {
          value: extraction.value,
          confidence: extraction.confidence
        }
      }
    }

    // Entity-specific parameter extraction with fallbacks
    this.applyEntitySpecificExtraction(message, entityType, intent, extractionResults)

    // Apply contextual inference
    this.applyContextualInference(message, entityType, intent, extractionResults)

    // Filter and finalize parameters based on confidence
    for (const [paramName, result] of Object.entries(extractionResults)) {
      if (result.confidence >= 0.5) { // Minimum confidence threshold
        parameters[paramName] = result.value
      }
    }

    if (this.debugMode) {
      console.log('Parameter extraction results:', extractionResults)
      console.log('Final parameters:', parameters)
    }

    return parameters
  }

  private extractParameterWithRule(
    message: string,
    rule: ExtractionRule
  ): { found: boolean; value: any; confidence: number } {
    for (const pattern of rule.patterns) {
      const match = pattern.exec(message)
      if (match) {
        let value = match[1] || match[0]

        // Apply transformer if provided
        if (rule.transformer) {
          try {
            value = rule.transformer(value)
          } catch (error) {
            continue // Skip this match if transformation fails
          }
        }

        // Validate if validator provided
        if (rule.validator && !rule.validator(value)) {
          continue // Skip this match if validation fails
        }

        return {
          found: true,
          value,
          confidence: rule.confidence || 0.8
        }
      }
    }

    return { found: false, value: null, confidence: 0 }
  }

  private applyEntitySpecificExtraction(
    message: string,
    entityType: EntityType,
    intent: OperationType,
    results: Record<string, { value: any; confidence: number }>
  ): void {
    switch (entityType) {
      case 'habit':
        this.extractHabitSpecificParams(message, intent, results)
        break
      case 'goal':
        this.extractGoalSpecificParams(message, intent, results)
        break
      case 'journal':
        this.extractJournalSpecificParams(message, intent, results)
        break
      case 'mood':
        this.extractMoodSpecificParams(message, intent, results)
        break
      case 'routine':
        this.extractRoutineSpecificParams(message, intent, results)
        break
    }
  }

  private extractHabitSpecificParams(
    message: string,
    intent: OperationType,
    results: Record<string, { value: any; confidence: number }>
  ): void {
    // Extract habit name if not already found
    if (!results.name && intent === 'create') {
      const patterns = [
        /(?:habit|routine|practice)\s+(?:of|for)?\s+([\w\s]+?)(?:\s+(?:daily|weekly|monthly|every|at)|$)/i,
        /(?:add|create|start)\s+([\w\s]+?)\s+(?:habit|routine|practice)/i,
        /(?:i\s+want\s+to\s+)([\w\s]+?)(?:\s+(?:daily|weekly|monthly|every)|$)/i
      ]

      for (const pattern of patterns) {
        const match = pattern.exec(message)
        if (match) {
          const name = match[1].trim()
          if (name.length > 0 && name.length < 100) {
            results.name = { value: name, confidence: 0.7 }
            break
          }
        }
      }
    }

    // Extract frequency context
    if (!results.frequency) {
      const frequencyIndicators = [
        { pattern: /\bevery\s+day\b/i, value: 'daily', confidence: 0.9 },
        { pattern: /\bdaily\b/i, value: 'daily', confidence: 0.9 },
        { pattern: /\bevery\s+week\b/i, value: 'weekly', confidence: 0.9 },
        { pattern: /\bweekly\b/i, value: 'weekly', confidence: 0.9 },
        { pattern: /\bevery\s+month\b/i, value: 'monthly', confidence: 0.9 }
      ]

      for (const indicator of frequencyIndicators) {
        if (indicator.pattern.test(message)) {
          results.frequency = { value: indicator.value, confidence: indicator.confidence }
          break
        }
      }
    }
  }

  private extractGoalSpecificParams(
    message: string,
    intent: OperationType,
    results: Record<string, { value: any; confidence: number }>
  ): void {
    // Extract goal title if not already found
    if (!results.title && intent === 'create') {
      const patterns = [
        /(?:goal|objective|target)\s+(?:is\s+)?(?:to\s+)?([\w\s]+?)(?:\s+(?:by|before|until)|$)/i,
        /(?:want\s+to|need\s+to|plan\s+to)\s+([\w\s]+?)(?:\s+(?:by|before|until)|$)/i,
        /(?:achieve|accomplish|reach)\s+([\w\s]+?)(?:\s+(?:by|before|until)|$)/i
      ]

      for (const pattern of patterns) {
        const match = pattern.exec(message)
        if (match) {
          const title = match[1].trim()
          if (title.length > 0 && title.length < 200) {
            results.title = { value: title, confidence: 0.7 }
            break
          }
        }
      }
    }
  }

  private extractJournalSpecificParams(
    message: string,
    intent: OperationType,
    results: Record<string, { value: any; confidence: number }>
  ): void {
    // Extract journal content
    if (!results.content && intent === 'create') {
      // Try to extract everything after journal indicators
      const patterns = [
        /(?:journal|write|record|note)\s+(?:about\s+)?(?:that\s+)?(.+)/i,
        /(?:add\s+)?(?:journal\s+)?(?:entry\s+)?(?:about\s+)?(.+)/i
      ]

      for (const pattern of patterns) {
        const match = pattern.exec(message)
        if (match) {
          const content = match[1].trim()
          if (content.length > 5) {
            results.content = { value: content, confidence: 0.6 }
            break
          }
        }
      }
    }
  }

  private extractMoodSpecificParams(
    message: string,
    intent: OperationType,
    results: Record<string, { value: any; confidence: number }>
  ): void {
    // Extract mood descriptors with expanded vocabulary
    const moodWords = {
      10: ['ecstatic', 'euphoric', 'overjoyed', 'blissful'],
      9: ['elated', 'thrilled', 'incredible', 'on top of the world'],
      8: ['excited', 'amazing', 'fantastic', 'wonderful', 'great', 'excellent'],
      7: ['happy', 'good', 'positive', 'cheerful', 'upbeat', 'pleased'],
      6: ['content', 'satisfied', 'fine', 'alright', 'decent'],
      5: ['okay', 'meh', 'neutral', 'average', 'so-so'],
      4: ['slightly down', 'not great', 'off', 'blah'],
      3: ['sad', 'down', 'low', 'disappointed', 'upset', 'worried'],
      2: ['bad', 'poor', 'stressed', 'anxious', 'frustrated'],
      1: ['terrible', 'awful', 'very bad', 'horrible', 'depressed', 'devastated']
    }

    // Extract notes from mood context like "Mood: excited about the presentation"
    if (!results.notes && intent === 'create') {
      const contextPatterns = [
        /mood\s*:\s*\w+\s+about\s+(.+)/i,
        /(?:i\s+am\s+)?feeling\s+\w+\s+(?:about|because\s+of|due\s+to)\s+(.+)/i,
        /(?:mood|feeling)\s*:\s*(.+?)(?:\s*\(\d+\/10\))?$/i
      ]

      for (const pattern of contextPatterns) {
        const match = pattern.exec(message)
        if (match) {
          const notes = match[1].trim()
          // Remove any trailing ratings like (8/10)
          const cleanNotes = notes.replace(/\s*\(\d+\/10\)\s*$/i, '').trim()
          if (cleanNotes.length > 3) {
            results.notes = { value: cleanNotes, confidence: 0.8 }
            break
          }
        }
      }
    }

    // Extract mood rating from words
    if (!results.mood_rating) {
      for (const [rating, words] of Object.entries(moodWords)) {
        for (const word of words) {
          if (message.toLowerCase().includes(word)) {
            results.mood_rating = { value: parseInt(rating), confidence: 0.7 }
            break
          }
        }
        if (results.mood_rating) break
      }
    }

    // Extract energy level from context
    if (!results.energy_level) {
      const energyWords = {
        10: ['energized', 'pumped', 'charged', 'electrified'],
        9: ['high energy', 'buzzing', 'wired', 'dynamic'],
        8: ['energetic', 'active', 'vigorous', 'lively'],
        7: ['alert', 'focused', 'sharp', 'ready'],
        6: ['steady', 'stable', 'balanced'],
        5: ['normal', 'average', 'typical'],
        4: ['sluggish', 'slow', 'dull'],
        3: ['tired', 'weary', 'low energy', 'dragging'],
        2: ['exhausted', 'drained', 'wiped'],
        1: ['completely drained', 'dead tired', 'no energy']
      }

      for (const [level, words] of Object.entries(energyWords)) {
        for (const word of words) {
          if (message.toLowerCase().includes(word)) {
            results.energy_level = { value: parseInt(level), confidence: 0.6 }
            break
          }
        }
        if (results.energy_level) break
      }
    }
  }

  private extractRoutineSpecificParams(
    message: string,
    intent: OperationType,
    results: Record<string, { value: any; confidence: number }>
  ): void {
    // Extract routine time indicators
    const timeIndicators = [
      { pattern: /\bmorning\b/i, value: 'morning', confidence: 0.8 },
      { pattern: /\bevening\b/i, value: 'evening', confidence: 0.8 },
      { pattern: /\bnight\b/i, value: 'night', confidence: 0.8 },
      { pattern: /\bworkout\b/i, value: 'workout', confidence: 0.9 }
    ]

    for (const indicator of timeIndicators) {
      if (indicator.pattern.test(message)) {
        results.routine_type = { value: indicator.value, confidence: indicator.confidence }
        break
      }
    }
  }

  private applyContextualInference(
    message: string,
    entityType: EntityType,
    intent: OperationType,
    results: Record<string, { value: any; confidence: number }>
  ): void {
    // Apply smart defaults based on context
    if (entityType === 'habit' && intent === 'create') {
      // Default frequency if not specified but implied
      if (!results.frequency) {
        if (message.includes('every day') || message.includes('daily')) {
          results.frequency = { value: 'daily', confidence: 0.9 }
        } else if (message.includes('routine') || message.includes('habit')) {
          results.frequency = { value: 'daily', confidence: 0.6 } // Reasonable default
        }
      }
    }

    // Infer category from context
    if (!results.category) {
      const categoryKeywords = {
        'health': ['exercise', 'workout', 'meditation', 'sleep', 'diet', 'water', 'vitamins'],
        'work': ['project', 'meeting', 'deadline', 'task', 'email', 'report'],
        'personal': ['journal', 'read', 'learn', 'practice', 'hobby'],
        'spiritual': ['pray', 'meditation', 'gratitude', 'mindfulness', 'reflection']
      }

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
          results.category = { value: category, confidence: 0.7 }
          break
        }
      }
    }
  }

  // This method is now integrated into the extraction rules
  // Keeping for backward compatibility if needed
  private normalizeParameterValue(paramName: string, value: string): any {
    const rule = PARAMETER_EXTRACTION_RULES[paramName]
    if (rule && rule.transformer) {
      return rule.transformer(value)
    }

    // Fallback to original logic
    switch (paramName) {
      case 'mood_rating':
        return parseInt(value, 10)
      case 'frequency':
        return value.toLowerCase()
      case 'priority':
        return value.toLowerCase()
      case 'target_date':
        return value
      default:
        return value.trim()
    }
  }

  private calculateConfidence(
    intent: OperationType,
    entityType: EntityType,
    parameters: Record<string, any>,
    originalMessage: string
  ): number {
    const message = originalMessage.toLowerCase()
    const factors: ConfidenceFactors = {
      intentMatch: this.calculateIntentMatchConfidence(intent, message),
      entityMatch: this.calculateEntityMatchConfidence(entityType, message),
      parameterCompleteness: this.calculateParameterCompleteness(entityType, intent, parameters),
      keywordDensity: this.calculateKeywordDensity(intent, entityType, message),
      grammarQuality: this.calculateGrammarQuality(message),
      contextCoherence: this.calculateContextCoherence(message)
    }

    if (this.debugMode) {
      console.log('Confidence factors:', factors)
    }

    // Weighted sum of all factors
    const confidence = Object.entries(factors).reduce(
      (sum, [factor, score]) => {
        const weight = CONFIDENCE_WEIGHTS[factor as keyof ConfidenceFactors]
        return sum + (score * weight)
      },
      0
    )

    // Apply penalties for low-confidence indicators
    let finalConfidence = confidence

    // Penalty for very short messages (likely incomplete)
    if (message.split(' ').length < 3) {
      finalConfidence *= 0.8
    }

    // Penalty for questions without clear intent
    if (message.includes('?') && !this.hasActionWord(message)) {
      finalConfidence *= 0.7
    }

    // Bonus for complete sentences with clear structure
    if (this.isCompleteCommand(message)) {
      finalConfidence *= 1.1
    }

    return Math.min(Math.max(finalConfidence, 0), 1.0)
  }

  private calculateIntentMatchConfidence(intent: OperationType, message: string): number {
    const patterns = INTENT_PATTERNS[intent]
    let maxConfidence = 0

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        // Base confidence for pattern match
        let confidence = 0.8

        // Boost for exact keyword matches
        const actionKeywords = ACTION_KEYWORDS[intent] || []
        const keywordMatches = actionKeywords.filter(keyword =>
          message.includes(keyword)
        ).length

        confidence += (keywordMatches / actionKeywords.length) * 0.2
        maxConfidence = Math.max(maxConfidence, confidence)
      }
    }

    return Math.min(maxConfidence, 1.0)
  }

  private calculateEntityMatchConfidence(entityType: EntityType, message: string): number {
    const patterns = ENTITY_PATTERNS[entityType]
    let confidence = 0

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        confidence = Math.max(confidence, 0.8)
      }
    }

    // Additional confidence from domain keywords
    const domainKeywords = DOMAIN_KEYWORDS[entityType] || []
    const keywordMatches = domainKeywords.filter(keyword =>
      message.includes(keyword)
    ).length

    confidence += (keywordMatches / domainKeywords.length) * 0.3

    return Math.min(confidence, 1.0)
  }

  private calculateParameterCompleteness(
    entityType: EntityType,
    intent: OperationType,
    parameters: Record<string, any>
  ): number {
    const requiredParams = this.getRequiredParameters(entityType, intent)
    const optionalParams = this.getOptionalParameters(entityType, intent)

    if (requiredParams.length === 0) {
      return 1.0 // No required parameters = perfect score
    }

    const providedRequired = requiredParams.filter(param =>
      parameters[param] !== undefined && parameters[param] !== ''
    ).length

    const providedOptional = optionalParams.filter(param =>
      parameters[param] !== undefined && parameters[param] !== ''
    ).length

    // Base score from required parameters
    const requiredScore = providedRequired / requiredParams.length

    // Bonus for optional parameters (up to 20%)
    const optionalBonus = optionalParams.length > 0
      ? (providedOptional / optionalParams.length) * 0.2
      : 0

    return Math.min(requiredScore + optionalBonus, 1.0)
  }

  private calculateKeywordDensity(intent: OperationType, entityType: EntityType, message: string): number {
    const words = message.split(/\s+/)
    const totalWords = words.length

    if (totalWords === 0) return 0

    const actionKeywords = ACTION_KEYWORDS[intent] || []
    const domainKeywords = DOMAIN_KEYWORDS[entityType] || []
    const allKeywords = [...actionKeywords, ...domainKeywords]

    const keywordCount = words.filter(word =>
      allKeywords.some(keyword => word.includes(keyword))
    ).length

    return Math.min(keywordCount / totalWords * 5, 1.0) // Scale appropriately
  }

  private calculateGrammarQuality(message: string): number {
    let score = 0.5 // Base score

    // Check for proper sentence structure
    if (/^[A-Z]/.test(message.trim())) score += 0.1 // Starts with capital
    if (/[.!?]$/.test(message.trim())) score += 0.1 // Ends with punctuation

    // Check for reasonable word count
    const wordCount = message.split(/\s+/).length
    if (wordCount >= 3 && wordCount <= 20) score += 0.2 // Reasonable length

    // Penalty for excessive repetition
    const uniqueWords = new Set(message.toLowerCase().split(/\s+/)).size
    const repetitionRatio = uniqueWords / wordCount
    if (repetitionRatio < 0.5) score -= 0.2

    return Math.min(Math.max(score, 0), 1.0)
  }

  private calculateContextCoherence(message: string): number {
    // Simple coherence check - could be enhanced with NLP
    let score = 0.5

    // Check for logical word order patterns
    if (this.hasLogicalFlow(message)) score += 0.3

    // Check for contradictory statements
    if (this.hasContradictions(message)) score -= 0.2

    return Math.min(Math.max(score, 0), 1.0)
  }

  private hasActionWord(message: string): boolean {
    const actionWords = ['add', 'create', 'update', 'delete', 'show', 'complete', 'done', 'finish']
    return actionWords.some(word => message.includes(word))
  }

  private isCompleteCommand(message: string): boolean {
    // Check if message has subject + action + object structure
    const hasAction = this.hasActionWord(message)
    const hasObject = message.split(' ').length > 2
    const hasProperLength = message.length > 10 && message.length < 200

    return hasAction && hasObject && hasProperLength
  }

  private hasLogicalFlow(message: string): boolean {
    // Basic check for logical word ordering
    // This could be enhanced with actual NLP libraries
    const commonPatterns = [
      /\b(add|create)\s+.*\s+(habit|goal|journal)/,
      /\b(update|change)\s+.*\s+(to|with|for)/,
      /\b(delete|remove)\s+.*\s+(habit|goal|journal)/,
      /\b(show|display|view)\s+.*\s+(habits|goals|entries)/
    ]

    return commonPatterns.some(pattern => pattern.test(message))
  }

  private hasContradictions(message: string): boolean {
    // Check for obvious contradictions
    const contradictions = [
      /\b(add|create)\b.*\b(delete|remove)\b/,
      /\b(start|begin)\b.*\b(stop|end)\b/,
      /\b(yes)\b.*\b(no)\b/
    ]

    return contradictions.some(pattern => pattern.test(message))
  }

  private getOptionalParameters(entityType: EntityType, intent: OperationType): string[] {
    const commonOptional = ['description', 'notes', 'tags', 'category']

    switch (entityType) {
      case 'habit':
        return [...commonOptional, 'frequency', 'reminder_time', 'color']
      case 'goal':
        return [...commonOptional, 'target_date', 'priority', 'milestones']
      case 'journal':
        return [...commonOptional, 'mood_rating', 'is_private']
      case 'mood':
        return ['notes', 'energy_level', 'context']
      default:
        return commonOptional
    }
  }

  private getRequiredParameters(entityType: EntityType, intent: OperationType): string[] {
    if (intent === 'create') {
      switch (entityType) {
        case 'habit': return ['name']
        case 'goal': return ['title']
        case 'journal': return ['content']
        case 'mood': return ['mood_rating']
        default: return []
      }
    }
    return []
  }

  private generateSuggestions(
    intent: OperationType,
    entityType: EntityType,
    parameters: Record<string, any>
  ): string[] {
    const suggestions: string[] = []

    const requiredParams = this.getRequiredParameters(entityType, intent)
    const missingParams = requiredParams.filter(param => !parameters[param])

    if (missingParams.length > 0) {
      missingParams.forEach(param => {
        suggestions.push(`Please provide ${param} for the ${entityType}`)
      })
    }

    return suggestions
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateEntityParameters(
  entityType: EntityType,
  parameters: Record<string, any>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    switch (entityType) {
      case 'habit':
        HabitSchema.parse(parameters)
        break
      case 'goal':
        GoalSchema.parse(parameters)
        break
      case 'journal':
        JournalSchema.parse(parameters)
        break
      default:
        // Add other entity validations as needed
        break
    }
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { isValid: false, errors: ['Unknown validation error'] }
  }
}

// =============================================================================
// DISAMBIGUATION HELPERS
// =============================================================================

/**
 * Resolve disambiguation based on user selection
 */
export function resolveDisambiguation(
  context: DisambiguationContext,
  userChoice: number | string
): ParsedEntityOperation | null {
  if (typeof userChoice === 'number') {
    if (userChoice === 1) {
      return context.primaryOption
    }

    const alternativeIndex = userChoice - 2
    if (alternativeIndex >= 0 && alternativeIndex < context.alternatives.length) {
      const alternative = context.alternatives[alternativeIndex]
      return {
        intent: alternative.intent,
        entityType: alternative.entityType,
        parameters: alternative.parameters,
        confidence: alternative.confidence,
        originalMessage: context.originalMessage
      }
    }
  }

  // Handle text-based clarification
  if (typeof userChoice === 'string') {
    // Try to re-parse the clarification
    const parser = new ChatEntityParser()
    return parser.parseMessage(userChoice)
  }

  return null
}

/**
 * Check if a message is a disambiguation response
 */
export function isDisambiguationResponse(message: string): boolean {
  const cleanMessage = message.trim().toLowerCase()

  // Check for numbered responses
  if (/^\d+$/.test(cleanMessage)) {
    const num = parseInt(cleanMessage)
    return num >= 1 && num <= 5
  }

  // Check for confirmation phrases
  const confirmationPhrases = [
    'yes, that\'s right',
    'that\'s correct',
    'exactly',
    'yes',
    'correct',
    'option 1',
    'option 2',
    'option 3',
    'the first one',
    'the second one'
  ]

  return confirmationPhrases.some(phrase => cleanMessage.includes(phrase))
}

// =============================================================================
// EXPORT
// =============================================================================

export const chatEntityParser = new ChatEntityParser()