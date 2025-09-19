'use client'

import { useEffect } from 'react'
import { TabType } from '@/types/navigation'

interface TabPreloaderProps {
  activeTab: TabType
  userBehavior?: {
    mostUsedTabs?: TabType[]
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
    lastSession?: TabType[]
  }
}

// Define tab preload priorities based on usage patterns
const TAB_PRELOAD_STRATEGIES = {
  // Preload tabs based on current active tab
  dashboard: ['habits', 'chat', 'journal'] as TabType[],
  chat: ['dashboard', 'journal', 'reflections'] as TabType[],
  habits: ['dashboard', 'routines', 'goals'] as TabType[],
  routines: ['habits', 'goals', 'dashboard'] as TabType[],
  journal: ['reflections', 'chat', 'dashboard'] as TabType[],
  reflections: ['journal', 'spiritual', 'dashboard'] as TabType[],
  goals: ['habits', 'beliefs', 'dashboard'] as TabType[],
  beliefs: ['goals', 'spiritual', 'dashboard'] as TabType[],
  spiritual: ['beliefs', 'reflections', 'journal'] as TabType[],
}

// Time-based preloading preferences
const TIME_BASED_PRELOADS = {
  morning: ['habits', 'goals', 'dashboard'] as TabType[],
  afternoon: ['chat', 'habits', 'dashboard'] as TabType[],
  evening: ['journal', 'reflections', 'spiritual'] as TabType[],
  night: ['reflections', 'journal', 'spiritual'] as TabType[],
}

export function TabPreloader({ activeTab, userBehavior }: TabPreloaderProps) {
  useEffect(() => {
    const preloadTab = (tabName: TabType) => {
      try {
        // Use dynamic import to preload the chunk
        switch (tabName) {
          case 'dashboard':
            import('@/components/tabs/DashboardTab')
            break
          case 'chat':
            import('@/components/tabs/ChatTab')
            break
          case 'habits':
            import('@/components/tabs/HabitsTab')
            break
          case 'routines':
            import('@/components/tabs/RoutinesTab')
            break
          case 'beliefs':
            import('@/components/tabs/BeliefsTab')
            break
          case 'goals':
            import('@/components/tabs/GoalsTab')
            break
          case 'spiritual':
            import('@/components/tabs/SpiritualTab')
            break
          case 'journal':
            import('@/components/tabs/JournalTab')
            break
          case 'reflections':
            import('@/components/tabs/ReflectionsTab')
            break
        }
      } catch (error) {
        console.warn(`Failed to preload ${tabName} tab:`, error)
      }
    }

    const getPreloadTabs = (): TabType[] => {
      const preloadSet = new Set<TabType>()

      // 1. Preload based on current active tab
      const currentTabPreloads = TAB_PRELOAD_STRATEGIES[activeTab] || []
      currentTabPreloads.forEach(tab => preloadSet.add(tab))

      // 2. Preload based on user's most used tabs
      if (userBehavior?.mostUsedTabs) {
        userBehavior.mostUsedTabs.slice(0, 3).forEach(tab => preloadSet.add(tab))
      }

      // 3. Preload based on time of day
      if (userBehavior?.timeOfDay) {
        const timeBasedTabs = TIME_BASED_PRELOADS[userBehavior.timeOfDay] || []
        timeBasedTabs.slice(0, 2).forEach(tab => preloadSet.add(tab))
      }

      // 4. Preload from last session
      if (userBehavior?.lastSession) {
        userBehavior.lastSession.slice(0, 2).forEach(tab => preloadSet.add(tab))
      }

      // Remove current active tab from preload list
      preloadSet.delete(activeTab)

      return Array.from(preloadSet).slice(0, 4) // Limit to 4 preloads
    }

    // Delay preloading to avoid interfering with current tab loading
    const preloadTimer = setTimeout(() => {
      const tabsToPreload = getPreloadTabs()

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Preloading tabs:', tabsToPreload)
      }

      // Stagger preloads to avoid overwhelming the network
      tabsToPreload.forEach((tab, index) => {
        setTimeout(() => preloadTab(tab), index * 500)
      })
    }, 2000) // Wait 2 seconds after tab switch

    return () => clearTimeout(preloadTimer)
  }, [activeTab, userBehavior])

  // This component doesn't render anything
  return null
}

// Hook to track user behavior for smarter preloading
export function useTabBehaviorTracking() {
  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
  }

  const getUserBehavior = () => {
    try {
      const stored = localStorage.getItem('pg_tab_behavior')
      if (stored) {
        const behavior = JSON.parse(stored)
        return {
          ...behavior,
          timeOfDay: getCurrentTimeOfDay()
        }
      }
    } catch (error) {
      console.warn('Failed to load user behavior data:', error)
    }

    return {
      timeOfDay: getCurrentTimeOfDay(),
      mostUsedTabs: ['dashboard', 'habits', 'chat'] as TabType[]
    }
  }

  const updateTabUsage = (tab: TabType) => {
    try {
      const current = getUserBehavior()
      const mostUsed = current.mostUsedTabs || []

      // Update tab usage frequency
      const updated = [tab, ...mostUsed.filter(t => t !== tab)].slice(0, 5)

      const newBehavior = {
        ...current,
        mostUsedTabs: updated,
        lastSession: [tab, ...(current.lastSession || [])].slice(0, 3),
        lastUpdated: Date.now()
      }

      localStorage.setItem('pg_tab_behavior', JSON.stringify(newBehavior))
    } catch (error) {
      console.warn('Failed to update tab behavior:', error)
    }
  }

  return { getUserBehavior, updateTabUsage }
}