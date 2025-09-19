'use client'

import { useState, Suspense, useEffect } from 'react'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import ChatInterface from '@/components/ChatInterface'
import HabitTracker from '@/components/HabitTracker'
import AuthForm from '@/components/AuthForm'
import TabNavigation from '@/components/TabNavigation'
import { TabType } from '@/types/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AppProviders } from '@/providers/AppProviders'
import { FloatingConnectionStatus } from '@/components/ui/ConnectionStatus'
import { TabPreloader, useTabBehaviorTracking } from '@/components/performance/TabPreloader'

// Dynamic imports for code splitting - only load tabs when needed
// The dashboard is loaded immediately since it's the default view
const DashboardTab = dynamic(() => import('@/components/tabs/DashboardTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

const ChatTab = dynamic(() => import('@/components/tabs/ChatTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

const HabitsTab = dynamic(() => import('@/components/tabs/HabitsTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

const RoutinesTab = dynamic(() => import('@/components/tabs/RoutinesTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

const BeliefsTab = dynamic(() => import('@/components/tabs/BeliefsTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

const GoalsTab = dynamic(() => import('@/components/tabs/GoalsTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

const SpiritualTab = dynamic(() => import('@/components/tabs/SpiritualTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

const JournalTab = dynamic(() => import('@/components/tabs/JournalTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

const ReflectionsTab = dynamic(() => import('@/components/tabs/ReflectionsTab'), {
  loading: () => <TabLoadingSpinner />,
  ssr: false
})

// Loading spinner component for tab transitions
function TabLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64 bg-gradient-to-br from-blue-50/30 to-purple-50/20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Loading...</p>
      </div>
    </div>
  )
}

// Enhanced error fallback component
function TabErrorFallback({ tabName }: { tabName: string }) {
  return (
    <div className="flex items-center justify-center h-64 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to load {tabName}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          There was an issue loading this section. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}

function HomePage() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [pendingHabitsCount, setPendingHabitsCount] = useState(3) // Mock data for now
  const { getUserBehavior, updateTabUsage } = useTabBehaviorTracking()

  // Handle tab changes from within components
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    updateTabUsage(tab)
  }

  // Enhanced tab change handler with behavior tracking
  const handleDirectTabChange = (tab: TabType) => {
    setActiveTab(tab)
    updateTabUsage(tab)
  }

  // Render the active tab content with error boundaries
  const renderTabContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <DashboardTab onTabChange={handleTabChange} />
            </Suspense>
          )
        case 'chat':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <ChatTab />
            </Suspense>
          )
        case 'habits':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <HabitsTab />
            </Suspense>
          )
        case 'routines':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <RoutinesTab />
            </Suspense>
          )
        case 'beliefs':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <BeliefsTab />
            </Suspense>
          )
        case 'goals':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <GoalsTab />
            </Suspense>
          )
        case 'spiritual':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <SpiritualTab />
            </Suspense>
          )
        case 'journal':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <JournalTab />
            </Suspense>
          )
        case 'reflections':
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <ReflectionsTab />
            </Suspense>
          )
        default:
          return (
            <Suspense fallback={<TabLoadingSpinner />}>
              <DashboardTab onTabChange={handleTabChange} />
            </Suspense>
          )
      }
    } catch (error) {
      console.error('Error rendering tab content:', error)
      return <TabErrorFallback tabName={activeTab} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Personal Guide...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Tab Preloader for better performance */}
      <TabPreloader
        activeTab={activeTab}
        userBehavior={getUserBehavior()}
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Personal Guide
            </h1>
            <p className="text-sm text-gray-600 hidden sm:block">
              Your AI-powered companion for personal growth
            </p>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-gray-600 hover:text-gray-800 bg-white/60 hover:bg-white/80 px-3 py-2 rounded-lg transition-colors border border-gray-200"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleDirectTabChange}
        pendingCount={pendingHabitsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          {renderTabContent()}
        </div>
      </main>

      {/* Spacer for mobile bottom navigation */}
      <div className="h-16 md:h-0"></div>

      {/* Floating connection status for connectivity issues */}
      <FloatingConnectionStatus />
    </div>
  )
}

export default function App() {
  return (
    <AppProviders>
      <HomePage />
    </AppProviders>
  )
}