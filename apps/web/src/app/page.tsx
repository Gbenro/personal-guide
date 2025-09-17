'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import ChatInterface from '@/components/ChatInterface'
import HabitTracker from '@/components/HabitTracker'
import AuthForm from '@/components/AuthForm'
import TabNavigation from '@/components/TabNavigation'
import { TabType } from '@/types/navigation'
import DashboardTab from '@/components/tabs/DashboardTab'
import ChatTab from '@/components/tabs/ChatTab'
import HabitsTab from '@/components/tabs/HabitsTab'
import RoutinesTab from '@/components/tabs/RoutinesTab'
import BeliefsTab from '@/components/tabs/BeliefsTab'
import GoalsTab from '@/components/tabs/GoalsTab'
import SpiritualTab from '@/components/tabs/SpiritualTab'
import JournalTab from '@/components/tabs/JournalTab'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { QueryProvider } from '@/providers/QueryProvider'

function HomePage() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [pendingHabitsCount, setPendingHabitsCount] = useState(3) // Mock data for now

  // Handle tab changes from within components
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onTabChange={handleTabChange} />
      case 'chat':
        return <ChatTab />
      case 'habits':
        return <HabitsTab />
      case 'routines':
        return <RoutinesTab />
      case 'beliefs':
        return <BeliefsTab />
      case 'goals':
        return <GoalsTab />
      case 'spiritual':
        return <SpiritualTab />
      case 'journal':
        return <JournalTab />
      default:
        return <DashboardTab onTabChange={handleTabChange} />
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
        onTabChange={setActiveTab}
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
    </div>
  )
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    </QueryProvider>
  )
}