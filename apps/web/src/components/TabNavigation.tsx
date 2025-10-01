'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import {
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ArrowPathIcon,
  LightBulbIcon,
  FlagIcon,
  SparklesIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { TabType, Tab, TabNavigationProps, TabA11yProps } from '@/types/navigation'

const tabs: Tab[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: ChartBarIcon,
    ariaLabel: 'Dashboard - Overview of your progress and insights',
    description: 'View your progress overview and AI insights'
  },
  {
    id: 'chat',
    name: 'Chat',
    icon: ChatBubbleLeftRightIcon,
    ariaLabel: 'Chat - Interact with your AI companion',
    description: 'Chat with your AI companion for journaling and reflection'
  },
  {
    id: 'habits',
    name: 'Habits',
    icon: HeartIcon,
    ariaLabel: 'Habits - Track and manage your daily habits',
    description: 'Track and build consistent daily habits'
  },
  {
    id: 'routines',
    name: 'Rituals',
    icon: ArrowPathIcon,
    ariaLabel: 'Rituals - Manage your daily rituals',
    description: 'Create and follow guided daily rituals'
  },
  {
    id: 'beliefs',
    name: 'Beliefs',
    icon: LightBulbIcon,
    ariaLabel: 'Beliefs - Transform your mindset with 21-day cycles',
    description: 'Install empowering beliefs through 21-day cycles'
  },
  {
    id: 'goals',
    name: 'Goals',
    icon: FlagIcon,
    ariaLabel: 'Goals - Set and track your aspirations',
    description: 'Set, track, and achieve your personal goals'
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: BookOpenIcon,
    ariaLabel: 'Journal - Write and reflect on your thoughts and experiences',
    description: 'Document your thoughts, track your mood, and reflect on your journey'
  },
  {
    id: 'reflections',
    name: 'Reflections',
    icon: LightBulbIcon,
    ariaLabel: 'Reflections - Browse and explore your insights and learnings',
    description: 'Review your insights, patterns, and personal growth journey'
  },
  {
    id: 'spiritual',
    name: 'Spiritual',
    icon: SparklesIcon,
    ariaLabel: 'Spiritual - Track synchronicities, angel numbers, and cosmic insights',
    description: 'Connect with spiritual patterns and divine guidance'
  },
]

export default function TabNavigation({ activeTab, onTabChange, pendingCount, className = '' }: TabNavigationProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [focusedTabIndex, setFocusedTabIndex] = useState<number>(() =>
    tabs.findIndex(tab => tab.id === activeTab)
  )

  // Update focused tab when active tab changes
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab)
    setFocusedTabIndex(activeIndex)
  }, [activeTab])

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = index === 0 ? tabs.length - 1 : index - 1
        tabRefs.current[prevIndex]?.focus()
        setFocusedTabIndex(prevIndex)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = index === tabs.length - 1 ? 0 : index + 1
        tabRefs.current[nextIndex]?.focus()
        setFocusedTabIndex(nextIndex)
        break
      case 'Home':
        event.preventDefault()
        tabRefs.current[0]?.focus()
        setFocusedTabIndex(0)
        break
      case 'End':
        event.preventDefault()
        const lastIndex = tabs.length - 1
        tabRefs.current[lastIndex]?.focus()
        setFocusedTabIndex(lastIndex)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onTabChange(tabs[index].id)
        break
    }
  }

  // Generate accessibility props for tab buttons
  const getTabA11yProps = (tab: Tab, index: number): TabA11yProps => ({
    'aria-label': tab.ariaLabel || `${tab.name} tab`,
    'aria-current': activeTab === tab.id ? 'page' : undefined,
    'aria-controls': `tabpanel-${tab.id}`,
    'aria-selected': activeTab === tab.id,
    'tabIndex': focusedTabIndex === index ? 0 : -1,
    'role': 'tab'
  })

  return (
    <div className={className}>
      {/* Desktop Tab Bar */}
      <div className="hidden md:block border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <nav
            className="flex space-x-8"
            aria-label="Personal Guide Navigation Tabs"
            role="tablist"
          >
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              const a11yProps = getTabA11yProps(tab, index)

              return (
                <button
                  key={tab.id}
                  ref={el => { if (el) tabRefs.current[index] = el }}
                  onClick={() => onTabChange(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-md
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  {...a11yProps}
                >
                  <Icon
                    className={`
                      mr-2 h-5 w-5 transition-colors
                      ${isActive
                        ? 'text-blue-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                      }
                    `}
                    aria-hidden="true"
                  />
                  <span>{tab.name}</span>
                  {tab.id === 'habits' && pendingCount && pendingCount > 0 && (
                    <span
                      className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-medium"
                      aria-label={`${pendingCount} pending habits`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <nav
          className="flex overflow-x-auto h-16 scrollbar-hide"
          aria-label="Personal Guide Mobile Navigation"
          role="tablist"
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            const a11yProps = getTabA11yProps(tab, index)

            return (
              <button
                key={tab.id}
                ref={el => { if (el) tabRefs.current[index + tabs.length] = el }}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`
                  flex flex-col items-center justify-center px-3 text-xs transition-colors relative min-w-0 flex-shrink-0
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                  ${isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                  }
                `}
                {...a11yProps}
              >
                <Icon className="h-5 w-5 mb-1" aria-hidden="true" />
                <span className="truncate max-w-full text-xs">{tab.name}</span>

                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                    aria-hidden="true"
                  />
                )}

                {/* Badge for pending items */}
                {tab.id === 'habits' && pendingCount && pendingCount > 0 && (
                  <div
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold"
                    aria-label={`${pendingCount} pending habits`}
                  >
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

// Export types for use in other components
export type { TabType, Tab, TabNavigationProps } from '@/types/navigation'