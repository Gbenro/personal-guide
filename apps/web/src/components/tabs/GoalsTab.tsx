'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  useGoalHierarchy,
  useGoalStats,
  useGoalInsights,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useLogGoalProgress,
  useGoalTemplates,
  useCreateGoalFromTemplate
} from '@/hooks/useGoals'
import { GoalHierarchyView } from '@/components/goals/GoalHierarchyView'
import { GoalStatsOverview } from '@/components/goals/GoalStatsOverview'
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog'
import { GoalInsights } from '@/components/goals/GoalInsights'
import { Button } from '@/components/ui/button'
import type { GoalType } from '@/types/goals'

export default function GoalsTab() {
  const { user } = useAuth()
  const [selectedView, setSelectedView] = useState<'hierarchy' | 'list' | 'calendar'>('hierarchy')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedGoalType, setSelectedGoalType] = useState<GoalType>('monthly')

  const { data: hierarchy, isLoading: hierarchyLoading } = useGoalHierarchy(user?.id || '')
  const { data: stats, isLoading: statsLoading } = useGoalStats(user?.id || '')
  const { data: insights } = useGoalInsights(user?.id || '')

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please sign in to view your goals.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                🎯 SMART Goals & Objectives
              </h1>
              <p className="text-gray-600 mt-2">
                Hierarchical goal tracking with monthly → weekly → daily cascade
              </p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              + Create Goal
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setSelectedView('hierarchy')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedView === 'hierarchy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Hierarchy View
            </button>
            <button
              onClick={() => setSelectedView('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setSelectedView('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedView === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Calendar View
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {!statsLoading && stats && (
          <GoalStatsOverview stats={stats} />
        )}

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="mb-8">
            <GoalInsights insights={insights} />
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {selectedView === 'hierarchy' && hierarchy && (
            <GoalHierarchyView
              hierarchy={hierarchy}
              userId={user.id}
              onCreateGoal={(parentId, goalType) => {
                setSelectedGoalType(goalType)
                setShowCreateDialog(true)
              }}
            />
          )}

          {selectedView === 'list' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-6">📋 All Goals</h2>
              <p className="text-gray-500">List view coming soon...</p>
            </div>
          )}

          {selectedView === 'calendar' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-6">📅 Calendar View</h2>
              <p className="text-gray-500">Calendar view coming soon...</p>
            </div>
          )}
        </div>

        {/* Create Goal Dialog */}
        <CreateGoalDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          userId={user.id}
          defaultGoalType={selectedGoalType}
        />
      </div>
    </div>
  )
}