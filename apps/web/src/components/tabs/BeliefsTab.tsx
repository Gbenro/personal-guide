'use client'

import { useState } from 'react'
import { useUserBeliefCycles, useFeaturedBeliefSystems, useCreateBeliefCycle, useBeliefStats, useTodaysBeliefWork } from '../../hooks/useBeliefs'
import { BeliefCycleCard } from '../beliefs/BeliefCycleCard'
import { BeliefSystemsGrid } from '../beliefs/BeliefSystemsGrid'
import { CreateBeliefCycleModal } from '../beliefs/CreateBeliefCycleModal'
import { BeliefStatsCard } from '../beliefs/BeliefStatsCard'
import { TodaysBeliefWork } from '../beliefs/TodaysBeliefWork'

type TabView = 'my-cycles' | 'systems' | 'insights'

export default function BeliefsTab() {
  const [activeTab, setActiveTab] = useState<TabView>('my-cycles')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: userCycles, isLoading: cyclesLoading } = useUserBeliefCycles()
  const { data: featuredSystems, isLoading: systemsLoading } = useFeaturedBeliefSystems()
  const { data: todaysWork } = useTodaysBeliefWork()
  const createCycle = useCreateBeliefCycle()

  const handleStartCycle = async (systemId: string, customizations?: any) => {
    try {
      await createCycle.mutateAsync({
        belief_system_id: systemId,
        ...customizations
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to start belief cycle:', error)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'my-cycles':
        return (
          <div className="space-y-6">
            {/* Today's Work Section */}
            {todaysWork && todaysWork.totalWork > 0 && (
              <TodaysBeliefWork
                pendingWork={todaysWork.pendingWork}
                completedWork={todaysWork.completedWork}
                completionRate={todaysWork.completionRate}
              />
            )}

            {/* Stats Overview */}
            <BeliefStatsCard />

            {/* My Cycles */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Belief Cycles</h2>
                <button
                  onClick={() => setActiveTab('systems')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Cycle
                </button>
              </div>

              {cyclesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
                  ))}
                </div>
              ) : userCycles && userCycles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userCycles.map((cycle) => (
                    <BeliefCycleCard
                      key={cycle.id}
                      cycle={cycle}
                      onViewDetails={() => {/* TODO: Handle view details */}}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🧠</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No belief cycles yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start your first 21-day belief installation cycle
                  </p>
                  <button
                    onClick={() => setActiveTab('systems')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse Belief Systems
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 'systems':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Belief Systems</h2>
              <p className="text-gray-600 mb-6">
                Choose a belief system to start your 21-day transformation cycle
              </p>
            </div>

            {systemsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
                ))}
              </div>
            ) : featuredSystems ? (
              <BeliefSystemsGrid
                systems={featuredSystems}
                onStartCycle={handleStartCycle}
                loading={createCycle.isPending}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">✨</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No belief systems available</h3>
                <p className="text-gray-600">
                  Check back later for belief systems
                </p>
              </div>
            )}
          </div>
        )

      case 'insights':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Belief Insights</h2>
              <p className="text-gray-600 mb-6">
                Track your belief transformation progress and patterns
              </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg p-8 text-white text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Analytics Coming Soon</h3>
              <p className="text-lg opacity-90">
                Detailed insights into your belief strength progression and transformation patterns
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🧠 Beliefs</h1>
          <p className="text-gray-600 mt-2">
            21-day belief installation cycles with daily reinforcement
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'my-cycles', label: 'My Cycles', icon: '🔄' },
              { id: 'systems', label: 'Belief Systems', icon: '✨' },
              { id: 'insights', label: 'Insights', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabView)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderContent()}

        {/* Create Cycle Modal */}
        {showCreateModal && (
          <CreateBeliefCycleModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  )
}