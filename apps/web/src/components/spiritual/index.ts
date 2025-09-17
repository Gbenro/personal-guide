// Spiritual Module Components
export { default as SpiritualDashboard } from './SpiritualDashboard'
export { default as SynchronicityTracker } from './SynchronicityTracker'
export { default as AngelNumbers } from './AngelNumbers'
export { default as AstrologicalInsights } from './AstrologicalInsights'

// Re-export types for convenience
export type {
  SynchronicityEntry,
  SynchronicityPattern,
  SynchronicityStats,
  AngelNumberEntry,
  AngelNumberMeaning,
  AngelNumberStats,
  DailyAstroInsight,
  LunarPhase,
  AstroTransit,
  PersonalChart,
  SpiritualInsight,
  SpiritualModule,
  SpiritualDashboard as SpiritualDashboardType
} from '@/types/spiritual'