'use client'

import { useState } from 'react'
import type { GoalHierarchyView as GoalHierarchyViewType, Goal, GoalType } from '@/types/goals'
import { GoalCard } from './GoalCard'
import { Button } from '@/components/ui/button'

interface GoalHierarchyViewProps {
  hierarchy: GoalHierarchyViewType
  userId: string
  onCreateGoal: (parentId?: string, goalType?: GoalType) => void
}

export function GoalHierarchyView({ hierarchy, userId, onCreateGoal }: GoalHierarchyViewProps) {
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())

  const toggleExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals)
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId)
    } else {
      newExpanded.add(goalId)
    }
    setExpandedGoals(newExpanded)
  }

  const getChildGoals = (parentId: string, type: GoalType): Goal[] => {
    if (type === 'weekly') {
      return hierarchy.weekly_goals.filter(g => g.parent_goal_id === parentId)
    }
    if (type === 'daily') {
      return hierarchy.daily_goals.filter(g => g.parent_goal_id === parentId)
    }
    return []
  }

  const renderGoalWithChildren = (goal: Goal, level = 0) => {
    const hasChildren = getChildGoals(goal.id, level === 0 ? 'weekly' : 'daily').length > 0
    const isExpanded = expandedGoals.has(goal.id)
    const children = hasChildren ? getChildGoals(goal.id, level === 0 ? 'weekly' : 'daily') : []

    return (
      <div key={goal.id} className={`${level > 0 ? 'ml-8 mt-4' : ''}`}>
        <GoalCard
          goal={goal}
          level={level}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleExpanded(goal.id)}
          onCreateChild={(goalType) => onCreateGoal(goal.id, goalType)}
        />

        {isExpanded && children.length > 0 && (
          <div className="mt-4">
            {children.map(child => renderGoalWithChildren(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hierarchy Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Goal Hierarchy</h2>
        <p className="text-gray-600 mb-4">
          Organize your goals in a cascading structure: Monthly goals break down into weekly goals, which break down into daily actions.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => onCreateGoal(undefined, 'monthly')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Add Monthly Goal
          </Button>
          <Button
            onClick={() => onCreateGoal(undefined, 'weekly')}
            variant="outline"
          >
            + Add Weekly Goal
          </Button>
          <Button
            onClick={() => onCreateGoal(undefined, 'daily')}
            variant="outline"
          >
            + Add Daily Goal
          </Button>
        </div>
      </div>

      {/* Monthly Goals */}
      {hierarchy.monthly_goals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">📅 Monthly Goals</h3>
            <span className="text-sm text-gray-500">
              {hierarchy.monthly_goals.length} goal{hierarchy.monthly_goals.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-6">
            {hierarchy.monthly_goals.map(goal => renderGoalWithChildren(goal, 0))}
          </div>
        </div>
      )}

      {/* Standalone Weekly Goals */}
      {hierarchy.weekly_goals.filter(g => !g.parent_goal_id).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">📆 Standalone Weekly Goals</h3>
            <span className="text-sm text-gray-500">
              {hierarchy.weekly_goals.filter(g => !g.parent_goal_id).length} goal{hierarchy.weekly_goals.filter(g => !g.parent_goal_id).length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-4">
            {hierarchy.weekly_goals
              .filter(g => !g.parent_goal_id)
              .map(goal => renderGoalWithChildren(goal, 1))}
          </div>
        </div>
      )}

      {/* Standalone Daily Goals */}
      {hierarchy.daily_goals.filter(g => !g.parent_goal_id).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">📋 Standalone Daily Goals</h3>
            <span className="text-sm text-gray-500">
              {hierarchy.daily_goals.filter(g => !g.parent_goal_id).length} goal{hierarchy.daily_goals.filter(g => !g.parent_goal_id).length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hierarchy.daily_goals
              .filter(g => !g.parent_goal_id)
              .map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  level={2}
                  hasChildren={false}
                  isExpanded={false}
                  onToggleExpand={() => {}}
                  onCreateChild={() => {}}
                  compact={true}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {hierarchy.monthly_goals.length === 0 &&
       hierarchy.weekly_goals.length === 0 &&
       hierarchy.daily_goals.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Goals Yet</h3>
          <p className="text-gray-600 mb-6">
            Start by creating your first SMART goal. You can begin with a monthly goal and break it down into smaller weekly and daily objectives.
          </p>
          <Button
            onClick={() => onCreateGoal(undefined, 'monthly')}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
          >
            Create Your First Goal
          </Button>
        </div>
      )}
    </div>
  )
}