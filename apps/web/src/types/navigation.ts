// Tab Navigation Types
export type TabType = 'dashboard' | 'chat' | 'habits' | 'routines' | 'beliefs' | 'goals' | 'spiritual' | 'journal' | 'reflections'

export interface Tab {
  id: TabType
  name: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  ariaLabel?: string
  description?: string
}

export interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  pendingCount?: number
  className?: string
}

export interface TabContentProps {
  isActive: boolean
  tabId: TabType
}

// Tab State Management
export interface TabState {
  activeTab: TabType
  previousTab?: TabType
  tabHistory: TabType[]
  pendingCounts: Record<TabType, number>
}

export interface TabActions {
  setActiveTab: (tab: TabType) => void
  goBack: () => void
  clearHistory: () => void
  updatePendingCount: (tab: TabType, count: number) => void
}

// Accessibility Types
export interface TabA11yProps {
  'aria-label': string
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean
  'aria-controls'?: string
  'aria-selected'?: boolean
  'tabIndex'?: number
  role?: string
}

export interface TabNavigationA11yConfig {
  enableKeyboardNavigation: boolean
  announceTabChanges: boolean
  focusOnTabChange: boolean
  reducedMotion: boolean
}