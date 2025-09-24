'use client'

import { useState } from 'react'
import { useUserRoutines, useFeaturedTemplates, useCreateRoutineFromTemplate, useRoutineActions } from '../../hooks/useRoutines'
import { RoutineCard } from '../routines/RoutineCard'
import { RoutineTemplatesGrid } from '../routines/RoutineTemplatesGrid'
import { CreateRoutineModal } from '../routines/CreateRoutineModal'
import { RoutineStatsCard } from '../routines/RoutineStatsCard'

type TabView = 'my-routines' | 'templates' | 'insights'

export default function RoutinesTab() {
  const [activeTab, setActiveTab] = useState<TabView>('my-routines')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const { data: userRoutines, isLoading: routinesLoading } = useUserRoutines()
  const { data: featuredTemplates, isLoading: templatesLoading } = useFeaturedTemplates()
  const createFromTemplate = useCreateRoutineFromTemplate()

  const handleUseTemplate = async (templateId: string) => {
    try {
      await createFromTemplate.mutateAsync({ templateId })
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to create routine from template:', error)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'my-routines':
        return (
          <div className="space-y-6">
            {/* Stats Overview */}
            <RoutineStatsCard />

            {/* My Routines Grid */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Routines</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Routine
                </button>
              </div>

              {routinesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
                  ))}
                </div>
              ) : userRoutines && userRoutines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userRoutines.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      onStart={() => {/* TODO: Handle start */}}
                      onEdit={() => {/* TODO: Handle edit */}}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No routines yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first routine or start with a template
                  </p>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse Templates
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 'templates':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Featured Templates</h2>
              <p className="text-gray-600 mb-6">
                Start with proven routines or customize them to fit your needs
              </p>
            </div>

            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
                ))}
              </div>
            ) : featuredTemplates ? (
              <RoutineTemplatesGrid
                templates={featuredTemplates}
                onUseTemplate={handleUseTemplate}
                loading={createFromTemplate.isPending}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates available</h3>
                <p className="text-gray-600">
                  Check back later for routine templates
                </p>
              </div>
            )}
          </div>
        )

      case 'insights':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Routine Insights</h2>
              <p className="text-gray-600 mb-6">
                Track your progress and discover patterns in your routine practice
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg p-8 text-white text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Analytics Coming Soon</h3>
              <p className="text-lg opacity-90">
                Detailed insights into your routine effectiveness and patterns
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
          <h1 className="text-3xl font-bold text-gray-900">🔄 Routines</h1>
          <p className="text-gray-600 mt-2">
            Guided flows for morning, evening, and custom routines
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'my-routines', label: 'My Routines', icon: '🔄' },
              { id: 'templates', label: 'Templates', icon: '📋' },
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

        {/* Create Routine Modal */}
        {showCreateModal && (
          <CreateRoutineModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  )
}