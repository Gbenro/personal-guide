import {
  getUserHabits,
  getTodayCompletions,
  calculateStreak,
  getHabitCompletionsRange,
  type Habit,
  type HabitEntry,
  type HabitStreak
} from './habitService'

export interface HabitWithStatus extends Habit {
  completedToday: boolean
  streak: HabitStreak
  isAtRisk: boolean
  daysSinceLastCompletion: number
}

export interface DashboardStats {
  dailyCompletionRate: number
  totalActiveHabits: number
  completedTodayCount: number
  pendingTodayCount: number
  longestCurrentStreak: number
  totalActiveStreaks: number
  atRiskHabitsCount: number
  weeklyCompletionRate: number
  monthlyTrend: 'up' | 'down' | 'stable'
}

export interface WeeklyStats {
  completionRates: number[]
  totalCompletions: number
  averageCompletionRate: number
  bestDay: string
  worstDay: string
}

export interface AIInsight {
  id: string
  type: 'success' | 'warning' | 'info' | 'tip'
  title: string
  message: string
  actionable?: boolean
  action?: string
}

// Get comprehensive dashboard data
export async function getDashboardData(userId: string): Promise<{
  habits: HabitWithStatus[]
  stats: DashboardStats
  weeklyStats: WeeklyStats
  insights: AIInsight[]
}> {
  try {
    // Fetch all required data in parallel
    const [userHabits, todayCompletions] = await Promise.all([
      getUserHabits(userId),
      getTodayCompletions(userId)
    ])

    // Calculate habits with status and streaks
    const habitsWithStatus: HabitWithStatus[] = await Promise.all(
      userHabits.map(async (habit) => {
        const streak = await calculateStreak(habit.id, userId)
        const completedToday = todayCompletions.some(c => c.habit_id === habit.id)

        // Calculate days since last completion
        const daysSinceLastCompletion = streak?.last_completed
          ? Math.floor((Date.now() - new Date(streak.last_completed).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity

        // Habit is at risk if not completed in 2+ days and has an active streak
        const isAtRisk = daysSinceLastCompletion >= 2 && (streak?.current_streak || 0) > 0

        return {
          ...habit,
          completedToday,
          streak,
          isAtRisk,
          daysSinceLastCompletion
        }
      })
    )

    // Calculate dashboard statistics
    const stats = calculateDashboardStats(habitsWithStatus, todayCompletions)

    // Get weekly statistics
    const weeklyStats = await calculateWeeklyStats(userId, userHabits)

    // Generate AI insights
    const insights = generateAIInsights(habitsWithStatus, stats, weeklyStats)

    return {
      habits: habitsWithStatus,
      stats,
      weeklyStats,
      insights
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)

    // Return empty state on error
    return {
      habits: [],
      stats: {
        dailyCompletionRate: 0,
        totalActiveHabits: 0,
        completedTodayCount: 0,
        pendingTodayCount: 0,
        longestCurrentStreak: 0,
        totalActiveStreaks: 0,
        atRiskHabitsCount: 0,
        weeklyCompletionRate: 0,
        monthlyTrend: 'stable'
      },
      weeklyStats: {
        completionRates: [0, 0, 0, 0, 0, 0, 0],
        totalCompletions: 0,
        averageCompletionRate: 0,
        bestDay: 'Monday',
        worstDay: 'Monday'
      },
      insights: []
    }
  }
}

// Calculate dashboard statistics
function calculateDashboardStats(
  habits: HabitWithStatus[],
  todayCompletions: HabitEntry[]
): DashboardStats {
  const totalActiveHabits = habits.length
  const completedTodayCount = habits.filter(h => h.completedToday).length
  const pendingTodayCount = totalActiveHabits - completedTodayCount
  const dailyCompletionRate = totalActiveHabits > 0 ? (completedTodayCount / totalActiveHabits) * 100 : 0

  const streaks = habits.map(h => h.streak?.current_streak || 0).filter(s => s > 0)
  const longestCurrentStreak = streaks.length > 0 ? Math.max(...streaks) : 0
  const totalActiveStreaks = streaks.length

  const atRiskHabitsCount = habits.filter(h => h.isAtRisk).length

  return {
    dailyCompletionRate: Math.round(dailyCompletionRate),
    totalActiveHabits,
    completedTodayCount,
    pendingTodayCount,
    longestCurrentStreak,
    totalActiveStreaks,
    atRiskHabitsCount,
    weeklyCompletionRate: 0, // Will be calculated in weekly stats
    monthlyTrend: 'stable' // Will be enhanced later
  }
}

// Calculate weekly completion statistics
async function calculateWeeklyStats(userId: string, habits: Habit[]): Promise<WeeklyStats> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 7)

  try {
    // Get completions for each habit over the past week
    const weeklyCompletions = await Promise.all(
      habits.map(habit => getHabitCompletionsRange(habit.id, userId, startDate, endDate))
    )

    // Calculate daily completion rates for the week
    const completionRates: number[] = []
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    let totalCompletions = 0
    let bestDayRate = 0
    let worstDayRate = 100
    let bestDay = 'Monday'
    let worstDay = 'Monday'

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      let dayCompletions = 0
      weeklyCompletions.forEach(habitCompletions => {
        dayCompletions += habitCompletions[dateStr] || 0
      })

      const dayRate = habits.length > 0 ? (dayCompletions / habits.length) * 100 : 0
      completionRates.push(Math.round(dayRate))
      totalCompletions += dayCompletions

      if (dayRate > bestDayRate) {
        bestDayRate = dayRate
        bestDay = dayNames[date.getDay()]
      }
      if (dayRate < worstDayRate) {
        worstDayRate = dayRate
        worstDay = dayNames[date.getDay()]
      }
    }

    const averageCompletionRate = completionRates.reduce((a, b) => a + b, 0) / 7

    return {
      completionRates,
      totalCompletions,
      averageCompletionRate: Math.round(averageCompletionRate),
      bestDay,
      worstDay
    }
  } catch (error) {
    console.error('Error calculating weekly stats:', error)
    return {
      completionRates: [0, 0, 0, 0, 0, 0, 0],
      totalCompletions: 0,
      averageCompletionRate: 0,
      bestDay: 'Monday',
      worstDay: 'Monday'
    }
  }
}

// Generate AI insights based on user data
function generateAIInsights(
  habits: HabitWithStatus[],
  stats: DashboardStats,
  weeklyStats: WeeklyStats
): AIInsight[] {
  const insights: AIInsight[] = []

  // Celebration insights
  if (stats.longestCurrentStreak >= 7) {
    insights.push({
      id: 'streak-celebration',
      type: 'success',
      title: 'Amazing streak!',
      message: `You've maintained a ${stats.longestCurrentStreak}-day streak! Consistency is building powerful habits.`,
      actionable: false
    })
  }

  if (stats.dailyCompletionRate >= 80) {
    insights.push({
      id: 'high-completion',
      type: 'success',
      title: 'Excellent progress',
      message: `${stats.dailyCompletionRate}% completion rate today. You're crushing your goals!`,
      actionable: false
    })
  }

  // Warning insights
  if (stats.atRiskHabitsCount > 0) {
    const atRiskHabits = habits.filter(h => h.isAtRisk)
    insights.push({
      id: 'at-risk-habits',
      type: 'warning',
      title: 'Streaks at risk',
      message: `${stats.atRiskHabitsCount} habit${stats.atRiskHabitsCount > 1 ? 's' : ''} haven't been completed recently. Complete them today to maintain your progress!`,
      actionable: true,
      action: 'Complete pending habits'
    })
  }

  // Motivational insights
  if (stats.pendingTodayCount > 0 && stats.dailyCompletionRate < 50) {
    insights.push({
      id: 'motivation-boost',
      type: 'info',
      title: 'Great start, keep going!',
      message: `You still have ${stats.pendingTodayCount} habit${stats.pendingTodayCount > 1 ? 's' : ''} to complete today. Every small step counts toward building lasting change.`,
      actionable: true,
      action: 'View pending habits'
    })
  }

  // Pattern recognition insights
  if (weeklyStats.bestDay && weeklyStats.averageCompletionRate > 60) {
    insights.push({
      id: 'best-day-pattern',
      type: 'tip',
      title: 'Pattern detected',
      message: `${weeklyStats.bestDay} is your strongest day for habit completion. Consider scheduling challenging habits on this day.`,
      actionable: false
    })
  }

  // Consistency insights
  if (stats.totalActiveStreaks >= 3) {
    insights.push({
      id: 'multi-streak',
      type: 'success',
      title: 'Multiple streaks active',
      message: `You're maintaining ${stats.totalActiveStreaks} active streaks simultaneously. This shows incredible consistency!`,
      actionable: false
    })
  }

  return insights.slice(0, 3) // Limit to 3 insights to avoid overwhelming
}

// Get dynamic greeting based on time of day
export function getDynamicGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 6) return "Still up? Take care of yourself"
  if (hour < 12) return "Good morning! Ready to start strong?"
  if (hour < 17) return "Good afternoon! How's your progress?"
  if (hour < 22) return "Good evening! Time to wrap up the day"
  return "Good night! Rest well for tomorrow"
}

// Get mood emoji options for quick logging
export function getMoodOptions(): Array<{ emoji: string; label: string; value: number }> {
  return [
    { emoji: '😴', label: 'Tired', value: 2 },
    { emoji: '😔', label: 'Down', value: 3 },
    { emoji: '😐', label: 'Neutral', value: 5 },
    { emoji: '😊', label: 'Good', value: 7 },
    { emoji: '🤩', label: 'Amazing', value: 9 }
  ]
}