import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// =============================================================================
// TYPES
// =============================================================================

export interface JournalEntry {
  id: string
  user_id: string
  title?: string
  content: string
  mood_rating?: number // 1-10 scale
  tags: string[]
  created_at: string
  updated_at: string
  is_favorite?: boolean
  word_count?: number
}

export interface MoodEntry {
  id: string
  user_id: string
  rating: number // 1-10 scale
  notes?: string
  created_at: string
  journal_entry_id?: string // Optional link to journal entry
}

export interface MoodEnergyEntry {
  id: string
  user_id: string
  mood_rating: number // 1-10
  energy_level: number // 1-10
  notes?: string
  tags?: string[]
  context?: {
    weather?: string
    location?: string
    activities?: string[]
    sleep_hours?: number
    exercise?: boolean
  }
  created_at: string
  updated_at?: string
}

export interface HabitWithMetrics {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  target_frequency: number
  created_at: string
  updated_at: string
  archived_at?: string
  // Enhanced metrics
  current_streak: number
  longest_streak: number
  completion_rate: number
  total_completions: number
  last_completed?: string
  is_completed_today: boolean
}

export interface JournalFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  mood?: {
    min: number
    max: number
  }
  tags?: string[]
  searchQuery?: string
  sortBy: 'created_at' | 'updated_at' | 'mood_rating' | 'word_count'
  sortOrder: 'asc' | 'desc'
  showFavoritesOnly?: boolean
}

export interface AppInsights {
  totalJournalEntries: number
  averageMoodRating: number
  journalStreak: number
  topMoodTriggers: string[]
  habitCompletionTrend: 'improving' | 'declining' | 'stable'
  journalWordCount: number
  dailyReflectionScore: number
}

// =============================================================================
// STORE STATE INTERFACE
// =============================================================================

interface PersonalGuideState {
  // UI State
  isJournalModalOpen: boolean
  selectedJournalEntry?: JournalEntry
  journalFilters: JournalFilters

  // Data State
  journalEntries: JournalEntry[]
  recentMoodEntries: MoodEntry[]
  moodEnergyEntries: MoodEnergyEntry[]
  habitsWithMetrics: HabitWithMetrics[]
  insights: AppInsights

  // Loading States
  isLoadingJournal: boolean
  isLoadingHabits: boolean
  isLoadingInsights: boolean

  // Error States
  journalError?: string
  habitsError?: string

  // =============================================================================
  // JOURNAL ACTIONS
  // =============================================================================

  // Modal Management
  openJournalModal: (entry?: JournalEntry) => void
  closeJournalModal: () => void

  // Journal CRUD
  setJournalEntries: (entries: JournalEntry[]) => void
  addJournalEntry: (entry: JournalEntry) => void
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void
  deleteJournalEntry: (id: string) => void
  toggleJournalFavorite: (id: string) => void

  // Journal Filtering & Search
  setJournalFilters: (filters: Partial<JournalFilters>) => void
  resetJournalFilters: () => void
  searchJournalEntries: (query: string) => JournalEntry[]

  // =============================================================================
  // MOOD TRACKING ACTIONS
  // =============================================================================

  addMoodEntry: (mood: MoodEntry) => void
  setRecentMoodEntries: (moods: MoodEntry[]) => void
  getMoodTrend: (days: number) => number[]
  getAverageMood: (days?: number) => number

  // Mood & Energy Tracking
  addMoodEnergyEntry: (entry: MoodEnergyEntry) => void
  setMoodEnergyEntries: (entries: MoodEnergyEntry[]) => void
  getMoodEnergyStats: () => {
    avgMood: number
    avgEnergy: number
    moodTrend: 'improving' | 'stable' | 'declining'
    energyTrend: 'improving' | 'stable' | 'declining'
  }

  // =============================================================================
  // ENHANCED HABIT ACTIONS
  // =============================================================================

  setHabitsWithMetrics: (habits: HabitWithMetrics[]) => void
  updateHabitMetrics: (habitId: string, metrics: Partial<HabitWithMetrics>) => void
  markHabitCompleted: (habitId: string) => void

  // =============================================================================
  // INSIGHTS & ANALYTICS
  // =============================================================================

  setInsights: (insights: AppInsights) => void
  calculateInsights: () => void

  // =============================================================================
  // LOADING & ERROR MANAGEMENT
  // =============================================================================

  setJournalLoading: (loading: boolean) => void
  setHabitsLoading: (loading: boolean) => void
  setInsightsLoading: (loading: boolean) => void
  setJournalError: (error?: string) => void
  setHabitsError: (error?: string) => void
  clearErrors: () => void
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultFilters: JournalFilters = {
  sortBy: 'created_at',
  sortOrder: 'desc',
  showFavoritesOnly: false
}

const defaultInsights: AppInsights = {
  totalJournalEntries: 0,
  averageMoodRating: 5,
  journalStreak: 0,
  topMoodTriggers: [],
  habitCompletionTrend: 'stable',
  journalWordCount: 0,
  dailyReflectionScore: 0
}

// =============================================================================
// ZUSTAND STORE IMPLEMENTATION
// =============================================================================

export const usePersonalGuideStore = create<PersonalGuideState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        isJournalModalOpen: false,
        selectedJournalEntry: undefined,
        journalFilters: defaultFilters,
        journalEntries: [],
        recentMoodEntries: [],
        moodEnergyEntries: [],
        habitsWithMetrics: [],
        insights: defaultInsights,
        isLoadingJournal: false,
        isLoadingHabits: false,
        isLoadingInsights: false,
        journalError: undefined,
        habitsError: undefined,

        // =============================================================================
        // JOURNAL ACTIONS IMPLEMENTATION
        // =============================================================================

        openJournalModal: (entry) => set((state) => {
          state.isJournalModalOpen = true
          state.selectedJournalEntry = entry
        }),

        closeJournalModal: () => set((state) => {
          state.isJournalModalOpen = false
          state.selectedJournalEntry = undefined
        }),

        setJournalEntries: (entries) => set((state) => {
          state.journalEntries = entries
        }),

        addJournalEntry: (entry) => set((state) => {
          state.journalEntries.unshift(entry) // Add to beginning for recency
        }),

        updateJournalEntry: (id, updates) => set((state) => {
          const entryIndex = state.journalEntries.findIndex(e => e.id === id)
          if (entryIndex !== -1) {
            state.journalEntries[entryIndex] = {
              ...state.journalEntries[entryIndex],
              ...updates,
              updated_at: new Date().toISOString()
            }
          }
          // Update selected entry if it's the one being edited
          if (state.selectedJournalEntry?.id === id) {
            state.selectedJournalEntry = {
              ...state.selectedJournalEntry,
              ...updates,
              updated_at: new Date().toISOString()
            }
          }
        }),

        deleteJournalEntry: (id) => set((state) => {
          state.journalEntries = state.journalEntries.filter(e => e.id !== id)
          if (state.selectedJournalEntry?.id === id) {
            state.selectedJournalEntry = undefined
          }
        }),

        toggleJournalFavorite: (id) => set((state) => {
          const entryIndex = state.journalEntries.findIndex(e => e.id === id)
          if (entryIndex !== -1) {
            state.journalEntries[entryIndex].is_favorite = !state.journalEntries[entryIndex].is_favorite
            state.journalEntries[entryIndex].updated_at = new Date().toISOString()
          }
        }),

        setJournalFilters: (filters) => set((state) => {
          state.journalFilters = { ...state.journalFilters, ...filters }
        }),

        resetJournalFilters: () => set((state) => {
          state.journalFilters = defaultFilters
        }),

        searchJournalEntries: (query) => {
          const state = get()
          if (!query.trim()) return state.journalEntries

          const searchTerm = query.toLowerCase()
          return state.journalEntries.filter(entry =>
            entry.title?.toLowerCase().includes(searchTerm) ||
            entry.content.toLowerCase().includes(searchTerm) ||
            entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          )
        },

        // =============================================================================
        // MOOD TRACKING IMPLEMENTATION
        // =============================================================================

        addMoodEntry: (mood) => set((state) => {
          state.recentMoodEntries.unshift(mood)
          // Keep only last 30 entries for performance
          if (state.recentMoodEntries.length > 30) {
            state.recentMoodEntries = state.recentMoodEntries.slice(0, 30)
          }
        }),

        setRecentMoodEntries: (moods) => set((state) => {
          state.recentMoodEntries = moods
        }),

        getMoodTrend: (days) => {
          const state = get()
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - days)

          return state.recentMoodEntries
            .filter(mood => new Date(mood.created_at) >= cutoffDate)
            .map(mood => mood.rating)
            .reverse() // Chronological order
        },

        getAverageMood: (days = 7) => {
          const state = get()
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - days)

          const recentMoods = state.recentMoodEntries
            .filter(mood => new Date(mood.created_at) >= cutoffDate)

          if (recentMoods.length === 0) return 5 // Default neutral mood

          const sum = recentMoods.reduce((acc, mood) => acc + mood.rating, 0)
          return Math.round((sum / recentMoods.length) * 10) / 10 // Round to 1 decimal
        },

        // =============================================================================
        // MOOD & ENERGY TRACKING IMPLEMENTATION
        // =============================================================================

        addMoodEnergyEntry: (entry) => set((state) => {
          state.moodEnergyEntries.unshift(entry)
          // Keep only last 60 entries for performance
          if (state.moodEnergyEntries.length > 60) {
            state.moodEnergyEntries = state.moodEnergyEntries.slice(0, 60)
          }
        }),

        setMoodEnergyEntries: (entries) => set((state) => {
          state.moodEnergyEntries = entries
        }),

        getMoodEnergyStats: () => {
          const state = get()
          const entries = state.moodEnergyEntries

          if (entries.length === 0) {
            return {
              avgMood: 5,
              avgEnergy: 5,
              moodTrend: 'stable' as const,
              energyTrend: 'stable' as const
            }
          }

          // Calculate averages
          const avgMood = entries.reduce((sum, e) => sum + e.mood_rating, 0) / entries.length
          const avgEnergy = entries.reduce((sum, e) => sum + e.energy_level, 0) / entries.length

          // Calculate trends (compare recent half to older half)
          const midPoint = Math.floor(entries.length / 2)
          if (midPoint === 0) {
            return {
              avgMood: Math.round(avgMood * 10) / 10,
              avgEnergy: Math.round(avgEnergy * 10) / 10,
              moodTrend: 'stable' as const,
              energyTrend: 'stable' as const
            }
          }

          const recentMood = entries.slice(0, midPoint).reduce((sum, e) => sum + e.mood_rating, 0) / midPoint
          const olderMood = entries.slice(midPoint).reduce((sum, e) => sum + e.mood_rating, 0) / (entries.length - midPoint)
          const recentEnergy = entries.slice(0, midPoint).reduce((sum, e) => sum + e.energy_level, 0) / midPoint
          const olderEnergy = entries.slice(midPoint).reduce((sum, e) => sum + e.energy_level, 0) / (entries.length - midPoint)

          const moodTrend = recentMood > olderMood + 0.5 ? 'improving' :
                             recentMood < olderMood - 0.5 ? 'declining' : 'stable'
          const energyTrend = recentEnergy > olderEnergy + 0.5 ? 'improving' :
                               recentEnergy < olderEnergy - 0.5 ? 'declining' : 'stable'

          return {
            avgMood: Math.round(avgMood * 10) / 10,
            avgEnergy: Math.round(avgEnergy * 10) / 10,
            moodTrend,
            energyTrend
          }
        },

        // =============================================================================
        // ENHANCED HABIT ACTIONS IMPLEMENTATION
        // =============================================================================

        setHabitsWithMetrics: (habits) => set((state) => {
          state.habitsWithMetrics = habits
        }),

        updateHabitMetrics: (habitId, metrics) => set((state) => {
          const habitIndex = state.habitsWithMetrics.findIndex(h => h.id === habitId)
          if (habitIndex !== -1) {
            state.habitsWithMetrics[habitIndex] = {
              ...state.habitsWithMetrics[habitIndex],
              ...metrics
            }
          }
        }),

        markHabitCompleted: (habitId) => set((state) => {
          const habitIndex = state.habitsWithMetrics.findIndex(h => h.id === habitId)
          if (habitIndex !== -1) {
            const habit = state.habitsWithMetrics[habitIndex]
            habit.is_completed_today = true
            habit.total_completions += 1
            habit.last_completed = new Date().toISOString()
            // Streak calculation would be handled by the service layer
          }
        }),

        // =============================================================================
        // INSIGHTS & ANALYTICS IMPLEMENTATION
        // =============================================================================

        setInsights: (insights) => set((state) => {
          state.insights = insights
        }),

        calculateInsights: () => set((state) => {
          const { journalEntries, recentMoodEntries, habitsWithMetrics } = state

          // Calculate journal insights
          const totalJournalEntries = journalEntries.length
          const totalWordCount = journalEntries.reduce((sum, entry) =>
            sum + (entry.word_count || 0), 0)

          // Calculate mood insights
          const moodRatings = recentMoodEntries.map(m => m.rating)
          const averageMoodRating = moodRatings.length > 0
            ? moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length
            : 5

          // Calculate habit completion trend
          const totalHabits = habitsWithMetrics.length
          const completedToday = habitsWithMetrics.filter(h => h.is_completed_today).length
          const completionRate = totalHabits > 0 ? completedToday / totalHabits : 0

          let habitCompletionTrend: 'improving' | 'declining' | 'stable' = 'stable'
          if (completionRate > 0.8) habitCompletionTrend = 'improving'
          else if (completionRate < 0.4) habitCompletionTrend = 'declining'

          // Calculate journal streak (simplified)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          let journalStreak = 0
          for (const entry of journalEntries) {
            const entryDate = new Date(entry.created_at)
            entryDate.setHours(0, 0, 0, 0)
            const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
            if (daysDiff === journalStreak) {
              journalStreak++
            } else {
              break
            }
          }

          state.insights = {
            totalJournalEntries,
            averageMoodRating: Math.round(averageMoodRating * 10) / 10,
            journalStreak,
            topMoodTriggers: [], // Could be enhanced with tag analysis
            habitCompletionTrend,
            journalWordCount: totalWordCount,
            dailyReflectionScore: Math.min(10, (journalStreak * 2) + (averageMoodRating / 2))
          }
        }),

        // =============================================================================
        // LOADING & ERROR MANAGEMENT IMPLEMENTATION
        // =============================================================================

        setJournalLoading: (loading) => set((state) => {
          state.isLoadingJournal = loading
        }),

        setHabitsLoading: (loading) => set((state) => {
          state.isLoadingHabits = loading
        }),

        setInsightsLoading: (loading) => set((state) => {
          state.isLoadingInsights = loading
        }),

        setJournalError: (error) => set((state) => {
          state.journalError = error
        }),

        setHabitsError: (error) => set((state) => {
          state.habitsError = error
        }),

        clearErrors: () => set((state) => {
          state.journalError = undefined
          state.habitsError = undefined
        })
      })),
      {
        name: 'personal-guide-storage',
        // Only persist UI preferences and non-sensitive data
        partialize: (state) => ({
          journalFilters: state.journalFilters,
          // Don't persist sensitive data like entries, they should come from API
        })
      }
    ),
    {
      name: 'personal-guide-store'
    }
  )
)

// =============================================================================
// SELECTORS FOR OPTIMIZED ACCESS
// =============================================================================

// Journal Selectors
export const useJournalEntries = () => usePersonalGuideStore(state => state.journalEntries)
// Create a memoized selector for filtered journal entries
const selectFilteredJournalEntries = (state: PersonalGuideState) => {
  const { journalEntries, journalFilters } = state

  // Early return if no filters applied - return original array reference
  const hasFilters = journalFilters.searchQuery ||
                     journalFilters.showFavoritesOnly ||
                     journalFilters.mood ||
                     (journalFilters.tags && journalFilters.tags.length > 0) ||
                     journalFilters.dateRange ||
                     journalFilters.sortBy !== 'created_at' ||
                     journalFilters.sortOrder !== 'desc'

  if (!hasFilters) {
    return journalEntries // Return original reference when no filtering needed
  }

  let filtered = [...journalEntries]

  // Apply filters
  if (journalFilters.searchQuery) {
    const query = journalFilters.searchQuery.toLowerCase()
    filtered = filtered.filter(entry =>
      entry.title?.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  if (journalFilters.showFavoritesOnly) {
    filtered = filtered.filter(entry => entry.is_favorite)
  }

  if (journalFilters.mood) {
    filtered = filtered.filter(entry =>
      entry.mood_rating &&
      entry.mood_rating >= journalFilters.mood!.min &&
      entry.mood_rating <= journalFilters.mood!.max
    )
  }

  if (journalFilters.tags && journalFilters.tags.length > 0) {
    filtered = filtered.filter(entry =>
      journalFilters.tags!.some(tag => entry.tags.includes(tag))
    )
  }

  if (journalFilters.dateRange) {
    const { start, end } = journalFilters.dateRange
    filtered = filtered.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= start && entryDate <= end
    })
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const aValue = a[journalFilters.sortBy] || ''
    const bValue = b[journalFilters.sortBy] || ''

    if (journalFilters.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return filtered
}

export const useFilteredJournalEntries = () => {
  return usePersonalGuideStore(
    selectFilteredJournalEntries,
    // Use shallow comparison to prevent infinite loops
    (prev, curr) => {
      if (!prev || !curr) return false
      if (prev.length !== curr.length) return false

      // Quick check if arrays are reference equal
      if (prev === curr) return true

      // Compare each entry by ID to see if the selection actually changed
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== curr[i].id) return false
      }
      return true
    }
  )
}

// Mood Selectors
export const useRecentMoodEntries = () => usePersonalGuideStore(state => state.recentMoodEntries)
export const useAverageMood = (days = 7) => usePersonalGuideStore(state => state.getAverageMood(days))

// Habit Selectors
export const useHabitsWithMetrics = () => usePersonalGuideStore(state => state.habitsWithMetrics)
export const useTodayHabits = () => usePersonalGuideStore(state =>
  state.habitsWithMetrics.filter(habit => !habit.archived_at)
)

// Insights Selectors
export const useInsights = () => usePersonalGuideStore(state => state.insights)

// UI Selectors with proper memoization
export const useJournalModal = () => {
  const isOpen = usePersonalGuideStore(state => state.isJournalModalOpen)
  const selectedEntry = usePersonalGuideStore(state => state.selectedJournalEntry)
  const open = usePersonalGuideStore(state => state.openJournalModal)
  const close = usePersonalGuideStore(state => state.closeJournalModal)

  return { isOpen, selectedEntry, open, close }
}

// Loading Selectors with proper memoization
export const useLoadingStates = () => {
  const journal = usePersonalGuideStore(state => state.isLoadingJournal)
  const habits = usePersonalGuideStore(state => state.isLoadingHabits)
  const insights = usePersonalGuideStore(state => state.isLoadingInsights)

  return { journal, habits, insights }
}