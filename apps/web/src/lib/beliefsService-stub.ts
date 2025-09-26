// Enhanced stub for beliefs service with localStorage persistence and 21-day cycle tracking
// TODO: Replace with full PostgreSQL implementation

// localStorage-based storage for beliefs and cycles
class BeliefStorage {
  private static BELIEF_SYSTEMS_KEY = 'pg_belief_systems'
  private static USER_CYCLES_KEY = 'pg_user_belief_cycles'
  private static DAILY_ACTIVITIES_KEY = 'pg_daily_belief_activities'

  static getBeliefSystems(userId: string): BeliefSystem[] {
    try {
      const systems = localStorage.getItem(`${this.BELIEF_SYSTEMS_KEY}_${userId}`)
      return systems ? JSON.parse(systems) : []
    } catch (error) {
      console.warn('Failed to load belief systems from localStorage:', error)
      return []
    }
  }

  static saveBeliefSystems(userId: string, systems: BeliefSystem[]): void {
    try {
      localStorage.setItem(`${this.BELIEF_SYSTEMS_KEY}_${userId}`, JSON.stringify(systems))
    } catch (error) {
      console.warn('Failed to save belief systems to localStorage:', error)
    }
  }

  static addBeliefSystem(userId: string, system: BeliefSystem): void {
    const existing = this.getBeliefSystems(userId)
    const updated = [...existing, system]
    this.saveBeliefSystems(userId, updated)
  }

  static getUserCycles(userId: string): UserBeliefCycle[] {
    try {
      const cycles = localStorage.getItem(`${this.USER_CYCLES_KEY}_${userId}`)
      return cycles ? JSON.parse(cycles) : []
    } catch (error) {
      console.warn('Failed to load belief cycles from localStorage:', error)
      return []
    }
  }

  static saveUserCycles(userId: string, cycles: UserBeliefCycle[]): void {
    try {
      localStorage.setItem(`${this.USER_CYCLES_KEY}_${userId}`, JSON.stringify(cycles))
    } catch (error) {
      console.warn('Failed to save belief cycles to localStorage:', error)
    }
  }

  static addUserCycle(userId: string, cycle: UserBeliefCycle): void {
    const existing = this.getUserCycles(userId)
    const updated = [...existing, cycle]
    this.saveUserCycles(userId, updated)
  }

  static updateUserCycle(userId: string, cycleId: string, updates: Partial<UserBeliefCycle>): UserBeliefCycle | null {
    const cycles = this.getUserCycles(userId)
    const index = cycles.findIndex(c => c.id === cycleId)
    if (index === -1) return null

    cycles[index] = { ...cycles[index], ...updates, updated_at: new Date() }
    this.saveUserCycles(userId, cycles)
    return cycles[index]
  }
}

import type {
  BeliefSystem,
  UserBeliefCycle,
  DailyBeliefActivity,
  BeliefMilestone,
  BeliefAffirmation,
  BeliefVisualizationScript,
  CreateBeliefSystemInput,
  CreateBeliefCycleInput,
  UpdateBeliefCycleInput,
  UpdateDailyActivityInput,
  CreateMilestoneInput,
  BeliefSystemFilters,
  BeliefCycleFilters,
  BeliefStats,
  BeliefInsight,
  BeliefProgress,
  BeliefRecommendation,
  BeliefCategory
} from '../types/beliefs'

export class BeliefsService {
  // ============================================================================
  // BELIEF SYSTEMS
  // ============================================================================

  static async getBeliefSystems(userId: string, filters: BeliefSystemFilters = {}): Promise<BeliefSystem[]> {
    console.log('🔥 [ENHANCED STUB] getBeliefSystems called for userId:', userId)

    if (typeof window === 'undefined') {
      return this.getSampleSystems()
    }

    // Get user's custom belief systems
    const userSystems = BeliefStorage.getBeliefSystems(userId)

    // Combine with sample public systems
    const allSystems = [...this.getSampleSystems(), ...userSystems]

    // Apply filters
    let filteredSystems = allSystems

    if (filters.category?.length) {
      filteredSystems = filteredSystems.filter(s => filters.category!.includes(s.category))
    }

    if (filters.is_public !== undefined) {
      filteredSystems = filteredSystems.filter(s => s.is_public === filters.is_public)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredSystems = filteredSystems.filter(s =>
        s.title.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        s.belief_statement.toLowerCase().includes(searchLower)
      )
    }

    console.log(`Returning ${filteredSystems.length} belief systems (${userSystems.length} user, ${this.getSampleSystems().length} public)`)
    return filteredSystems
  }

  private static getSampleSystems(): BeliefSystem[] {
    return [
      {
        id: 'sample-1',
        user_id: 'system',
        created_by: 'system',
        title: 'I Am Worthy of Success',
        description: 'Build unwavering self-worth and confidence in your ability to achieve your goals',
        category: 'Self-Worth',
        belief_statement: 'I am inherently worthy of success and all the good things life has to offer',
        affirmations: [
          'I deserve success in all areas of my life',
          'My worth is not determined by my achievements',
          'I am enough exactly as I am',
          'Success flows to me naturally and easily'
        ],
        visualization_script: {
          title: 'Success Visualization',
          content: 'Imagine yourself achieving your biggest goal. See yourself celebrating, feeling proud and fulfilled. Notice how your success positively impacts others around you...',
          duration_minutes: 5
        },
        journaling_prompts: [
          'What does success mean to me personally?',
          'How do I sabotage my own success?',
          'What evidence do I have that I am worthy of good things?'
        ],
        daily_activities: [
          'Read affirmations aloud with conviction',
          'Practice success visualization',
          'Journal about personal worth',
          'List 3 things that prove your worthiness'
        ],
        cycle_length: 21,
        difficulty_level: 3,
        times_started: 1247,
        times_completed: 892,
        average_belief_strength_improvement: 6.8,
        is_public: true,
        is_featured: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        id: 'sample-2',
        user_id: 'system',
        created_by: 'system',
        title: 'Abundance Mindset',
        description: 'Transform scarcity thinking into abundant possibilities',
        category: 'Abundance',
        belief_statement: 'The universe is abundant and there is more than enough for everyone, including me',
        affirmations: [
          'Abundance flows to me from multiple sources',
          'There is always enough for everyone',
          'I attract opportunities effortlessly',
          'My possibilities are limitless'
        ],
        visualization_script: {
          title: 'Abundance Flow',
          content: 'Picture yourself surrounded by flowing golden light representing infinite abundance. Feel opportunities, resources, and support flowing toward you from all directions...',
          duration_minutes: 7
        },
        journaling_prompts: [
          'Where do I notice scarcity thinking in my life?',
          'What abundance do I already have?',
          'How would I act if I knew abundance was my natural state?'
        ],
        daily_activities: [
          'Express gratitude for current abundance',
          'Visualize abundant possibilities',
          'Challenge one scarcity thought',
          'Practice generous thinking'
        ],
        cycle_length: 28,
        difficulty_level: 4,
        times_started: 892,
        times_completed: 634,
        average_belief_strength_improvement: 7.2,
        is_public: true,
        is_featured: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      }
    ]
  }

  static async getFeaturedBeliefSystems(): Promise<BeliefSystem[]> {
    console.log('🔧 [STUB] getFeaturedBeliefSystems called')
    return this.getBeliefSystems('system', { is_featured: true })
  }

  static async createBeliefSystem(userId: string, input: CreateBeliefSystemInput): Promise<BeliefSystem> {
    console.log('🔥 [ENHANCED STUB] createBeliefSystem called with:', { userId, input })

    if (typeof window === 'undefined') {
      throw new Error('Cannot create belief system on server-side')
    }

    // Create and save belief system
    const newSystem: BeliefSystem = {
      id: `belief-system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_by: userId,
      title: input.title,
      description: input.description,
      category: input.category,
      belief_statement: input.belief_statement,
      affirmations: input.affirmations,
      visualization_script: input.visualization_script,
      journaling_prompts: input.journaling_prompts || [],
      daily_activities: input.daily_activities || [
        'Read affirmations with conviction',
        'Practice visualization exercise',
        'Journal about belief progress',
        'Speak affirmation aloud 3 times'
      ],
      cycle_length: input.cycle_length || 21,
      difficulty_level: 3,
      times_started: 0,
      times_completed: 0,
      average_belief_strength_improvement: 0,
      is_public: input.is_public || false,
      is_featured: false,
      created_at: new Date(),
      updated_at: new Date()
    }

    // Save to localStorage
    BeliefStorage.addBeliefSystem(userId, newSystem)

    console.log('✅ [ENHANCED STUB] Created and saved belief system:', newSystem)
    return newSystem
  }

  // ============================================================================
  // USER BELIEF CYCLES
  // ============================================================================

  static async getUserBeliefCycles(userId: string, filters: BeliefCycleFilters = {}): Promise<UserBeliefCycle[]> {
    console.log('🔥 [ENHANCED STUB] getUserBeliefCycles called for userId:', userId)

    if (typeof window === 'undefined') {
      return []
    }

    const cycles = BeliefStorage.getUserCycles(userId)
    console.log(`Found ${cycles.length} belief cycles for user`)

    // Apply filters
    let filteredCycles = cycles.filter(c => !c.archived_at)

    if (filters.status?.length) {
      filteredCycles = filteredCycles.filter(c => filters.status!.includes(c.status))
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredCycles = filteredCycles.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        (c.personal_belief_statement && c.personal_belief_statement.toLowerCase().includes(searchLower))
      )
    }

    return filteredCycles
  }

  static async getUserBeliefCycle(userId: string, cycleId: string): Promise<UserBeliefCycle | null> {
    console.log('🔥 [ENHANCED STUB] getUserBeliefCycle called with:', { userId, cycleId })

    if (typeof window === 'undefined') {
      return null
    }

    const cycles = BeliefStorage.getUserCycles(userId)
    const cycle = cycles.find(c => c.id === cycleId)

    console.log(`Found cycle:`, cycle ? cycle.title : 'not found')
    return cycle || null
  }

  static async createBeliefCycle(userId: string, input: CreateBeliefCycleInput): Promise<UserBeliefCycle> {
    console.log('🔥 [ENHANCED STUB] createBeliefCycle called with:', { userId, input })

    if (typeof window === 'undefined') {
      throw new Error('Cannot create belief cycle on server-side')
    }

    // Get belief system to calculate cycle length
    const allSystems = await this.getBeliefSystems(userId)
    const beliefSystem = allSystems.find(s => s.id === input.belief_system_id)
    const cycleLength = beliefSystem?.cycle_length || 21

    // Create new belief cycle
    const newCycle: UserBeliefCycle = {
      id: `belief-cycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      belief_system_id: input.belief_system_id,
      title: input.title || beliefSystem?.title || 'New Belief Cycle',
      personal_belief_statement: input.personal_belief_statement || beliefSystem?.belief_statement || 'I am creating positive change',
      personal_reason: input.personal_reason,
      status: 'active',
      current_day: 1,
      start_date: new Date(),
      target_completion_date: this.calculateTargetDate(cycleLength),
      actual_completion_date: undefined,
      days_completed: 0,
      consecutive_days: 0,
      total_activities_completed: 0,
      initial_belief_strength: 3,
      current_belief_strength: 3,
      target_belief_strength: input.target_belief_strength || 10,
      preferred_reminder_time: input.preferred_reminder_time,
      custom_affirmations: input.custom_affirmations || [],
      custom_activities: input.custom_activities || [],
      belief_systems: beliefSystem, // Include the belief system data
      created_at: new Date(),
      updated_at: new Date(),
      archived_at: undefined
    }

    // Save to localStorage
    BeliefStorage.addUserCycle(userId, newCycle)

    // Update belief system usage count
    if (beliefSystem && beliefSystem.user_id === userId) {
      const systems = BeliefStorage.getBeliefSystems(userId)
      const systemIndex = systems.findIndex(s => s.id === input.belief_system_id)
      if (systemIndex !== -1) {
        systems[systemIndex].times_started += 1
        BeliefStorage.saveBeliefSystems(userId, systems)
      }
    }

    console.log('✅ [ENHANCED STUB] Created and saved belief cycle:', newCycle)
    return newCycle
  }

  static async updateBeliefCycle(userId: string, cycleId: string, updates: UpdateBeliefCycleInput): Promise<UserBeliefCycle> {
    console.log('🔥 [ENHANCED STUB] updateBeliefCycle called with:', { userId, cycleId, updates })

    if (typeof window === 'undefined') {
      throw new Error('Cannot update belief cycle on server-side')
    }

    const updatedCycle = BeliefStorage.updateUserCycle(userId, cycleId, updates)

    if (!updatedCycle) {
      throw new Error('Belief cycle not found')
    }

    console.log('✅ [ENHANCED STUB] Updated belief cycle:', updatedCycle)
    return updatedCycle
  }

  // ============================================================================
  // DAILY ACTIVITIES
  // ============================================================================

  static async getDailyActivity(userId: string, cycleId: string, dayNumber: number): Promise<DailyBeliefActivity | null> {
    console.log('🔧 [STUB] getDailyActivity called - returning null')
    return null
  }

  static async getRecentActivities(userId: string, cycleId: string, limit: number = 7): Promise<DailyBeliefActivity[]> {
    console.log('🔧 [STUB] getRecentActivities called - returning empty array')
    return []
  }

  static async updateDailyActivity(userId: string, cycleId: string, dayNumber: number, updates: UpdateDailyActivityInput): Promise<DailyBeliefActivity> {
    console.log('🔧 [STUB] updateDailyActivity called - not implemented')
    throw new Error('Update daily activity not yet implemented')
  }

  // ============================================================================
  // STATISTICS AND INSIGHTS
  // ============================================================================

  static async getBeliefStats(userId: string): Promise<BeliefStats> {
    console.log('🔥 [ENHANCED STUB] getBeliefStats called for userId:', userId)

    if (typeof window === 'undefined') {
      return this.getEmptyStats()
    }

    const cycles = BeliefStorage.getUserCycles(userId)
    const systems = BeliefStorage.getBeliefSystems(userId)
    console.log(`Calculating stats for ${cycles.length} cycles and ${systems.length} systems`)

    const activeCycles = cycles.filter(c => c.status === 'active')
    const completedCycles = cycles.filter(c => c.status === 'completed')
    const pausedCycles = cycles.filter(c => c.status === 'paused')

    // Calculate category distribution from cycles
    const categoryDistribution = cycles.reduce((acc, cycle) => {
      const system = systems.find(s => s.id === cycle.belief_system_id)
      const category = system?.category || 'Personal Growth'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostPracticedCategory = Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as BeliefCategory || 'Personal Growth'

    const stats: BeliefStats = {
      total_cycles: cycles.length,
      active_cycles: activeCycles.length,
      completed_cycles: completedCycles.length,
      paused_cycles: pausedCycles.length,
      total_days_practiced: cycles.reduce((sum, c) => sum + c.days_completed, 0),
      current_streak: Math.max(...cycles.map(c => c.consecutive_days), 0),
      longest_streak: Math.max(...cycles.map(c => c.consecutive_days), 0), // Simplified
      average_cycle_completion_rate: cycles.length > 0 ?
        Math.round(cycles.reduce((sum, c) => {
          const cycleLength = 21 // Default cycle length
          return sum + (c.days_completed / cycleLength) * 100
        }, 0) / cycles.length) : 0,
      average_belief_strength_improvement: cycles.length > 0 ?
        cycles.reduce((sum, c) => sum + ((c.current_belief_strength || 3) - (c.initial_belief_strength || 3)), 0) / cycles.length : 0,
      average_mood_improvement: 0, // Would need daily activity tracking
      average_confidence_improvement: 0, // Would need daily activity tracking
      most_practiced_category: mostPracticedCategory,
      category_distribution: categoryDistribution as Record<BeliefCategory, number>,
      total_affirmations_spoken: cycles.reduce((sum, c) => sum + (c.total_activities_completed || 0), 0),
      total_visualization_minutes: cycles.reduce((sum, c) => sum + (c.days_completed * 5), 0), // Estimate 5 min per day
      total_journal_entries: cycles.reduce((sum, c) => sum + c.days_completed, 0), // Assume 1 entry per completed day
      average_daily_completion_rate: cycles.length > 0 ?
        Math.round(cycles.reduce((sum, c) => sum + (c.days_completed > 0 ? 100 : 0), 0) / cycles.length) : 0
    }

    console.log('✅ [ENHANCED STUB] Calculated belief stats:', stats)
    return stats
  }

  private static getEmptyStats(): BeliefStats {
    return {
      total_cycles: 0,
      active_cycles: 0,
      completed_cycles: 0,
      paused_cycles: 0,
      total_days_practiced: 0,
      current_streak: 0,
      longest_streak: 0,
      average_cycle_completion_rate: 0,
      average_belief_strength_improvement: 0,
      average_mood_improvement: 0,
      average_confidence_improvement: 0,
      most_practiced_category: 'Personal Growth',
      category_distribution: {},
      total_affirmations_spoken: 0,
      total_visualization_minutes: 0,
      total_journal_entries: 0,
      average_daily_completion_rate: 0
    }
  }

  static async generateBeliefInsights(userId: string): Promise<BeliefInsight[]> {
    console.log('🔧 [STUB] generateBeliefInsights called - returning empty insights')
    return []
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static calculateTargetDate(cycleLengthDays: number): Date {
    const target = new Date()
    target.setDate(target.getDate() + cycleLengthDays - 1)
    return target
  }
}

// Export individual functions for easier use
export const {
  getBeliefSystems,
  getFeaturedBeliefSystems,
  createBeliefSystem,
  getUserBeliefCycles,
  getUserBeliefCycle,
  createBeliefCycle,
  updateBeliefCycle,
  getDailyActivity,
  getRecentActivities,
  updateDailyActivity,
  getBeliefStats,
  generateBeliefInsights
} = BeliefsService