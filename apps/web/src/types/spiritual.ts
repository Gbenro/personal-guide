// Spiritual Module Types

// Synchronicity Tracking Types
export interface SynchronicityEntry {
  id: string
  title: string
  description: string
  date: Date
  tags: string[]
  significance: number // 1-10 scale
  context: string // where/when it happened
  emotions: string[]
  patterns?: string[] // discovered patterns
  createdAt: Date
  updatedAt: Date
}

export interface SynchronicityPattern {
  id: string
  name: string
  description: string
  entries: string[] // IDs of related entries
  frequency: number
  discoveredAt: Date
  significance: number
}

export interface SynchronicityStats {
  totalEntries: number
  averageSignificance: number
  mostCommonTags: string[]
  patternsDiscovered: number
  streak: number // days with entries
}

// Angel Numbers Types
export interface AngelNumberEntry {
  id: string
  number: string
  date: Date
  time: string
  location: string
  context: string
  personalSignificance: number // 1-10
  emotions: string[]
  notes?: string
  createdAt: Date
}

export interface AngelNumberMeaning {
  number: string
  generalMeaning: string
  spiritualMeaning: string
  numerologyMeaning: string
  actionGuidance: string
  affirmations: string[]
}

export interface AngelNumberStats {
  totalSightings: number
  uniqueNumbers: number
  mostFrequentNumber: string
  currentStreak: number
  averageSignificance: number
  weeklyFrequency: number
}

// Astrological Insights Types
export interface AstroTransit {
  id: string
  planet: string
  aspect: string
  targetPlanet?: string
  startDate: Date
  endDate: Date
  intensity: 'low' | 'medium' | 'high'
  theme: string
  description: string
  guidance: string
}

export interface LunarPhase {
  phase: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent'
  date: Date
  name: string
  significance: string
  intentions: string[]
  releaseAreas: string[]
}

export interface DailyAstroInsight {
  date: Date
  overview: string
  mainTheme: string
  opportunities: string[]
  challenges: string[]
  luckElement: string
  colorOfDay: string
  crystalRecommendation: string
  mantra: string
  lunarPhase: LunarPhase
  activeTransits: AstroTransit[]
}

export interface PersonalChart {
  sunSign: string
  moonSign: string
  risingSign: string
  birthDate: Date
  birthTime?: string
  birthLocation: string
  houses: Record<string, string>
  planets: Record<string, { sign: string; house: number; degree: number }>
}

// Shared Spiritual Types
export interface SpiritualInsight {
  id: string
  type: 'synchronicity' | 'angel-number' | 'astro'
  title: string
  description: string
  guidance: string
  relevance: number // 1-10
  generatedAt: Date
  relatedEntries: string[]
}

export interface SpiritualModule {
  id: 'synchronicity' | 'angel-numbers' | 'astrology'
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
  settings: Record<string, any>
}

export interface SpiritualDashboard {
  recentInsights: SpiritualInsight[]
  todaysGuidance: string
  activeModules: SpiritualModule[]
  weeklyHighlights: {
    synchronicities: number
    angelNumbers: number
    significantTransits: number
  }
}