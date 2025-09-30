'use client'

import { useState } from 'react'
import type { Goal, GoalType } from '@/types/goals'
import { useUpdateGoal, useLogGoalProgress, useDeleteGoal, useGoals } from '@/hooks/useGoals'
import { Button } from '@/components/ui/button'

interface GoalCardProps {
  goal: Goal
  level: number
  hasChildren: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onCreateChild: (goalType: GoalType) => void
  compact?: boolean
}

export function GoalCard({
  goal,
  level,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onCreateChild,
  compact = false
}: GoalCardProps) {
  const [showProgress, setShowProgress] = useState(false)
  const [progressValue, setProgressValue] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateGoalMutation = useUpdateGoal()
  const logProgressMutation = useLogGoalProgress()
  const deleteGoalMutation = useDeleteGoal()
  const { data: allGoals } = useGoals(goal.user_id)

  const levelColors = {
    0: 'border-blue-200 bg-blue-50', // Monthly
    1: 'border-green-200 bg-green-50', // Weekly
    2: 'border-purple-200 bg-purple-50' // Daily
  }

  const levelIcons = {
    0: '📅', // Monthly
    1: '📆', // Weekly
    2: '📋' // Daily
  }

  const statusColors = {
    active: 'border-l-blue-500 bg-blue-50',
    completed: 'border-l-green-500 bg-green-50',
    paused: 'border-l-yellow-500 bg-yellow-50',
    cancelled: 'border-l-red-500 bg-red-50'
  }

  const getTargetDateStatus = () => {
    const today = new Date()
    const target = new Date(goal.target_date)
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { status: 'overdue', text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' }
    if (diffDays === 0) return { status: 'today', text: 'Due today', color: 'text-orange-600' }
    if (diffDays <= 3) return { status: 'soon', text: `${diffDays} days left`, color: 'text-orange-500' }
    return { status: 'future', text: `${diffDays} days left`, color: 'text-gray-500' }
  }

  const handleProgressSubmit = async () => {
    if (!progressValue) return

    try {
      await logProgressMutation.mutateAsync({
        userId: goal.user_id,
        update: {
          goal_id: goal.id,
          progress_value: parseFloat(progressValue),
          notes: `Progress update: +${progressValue} ${goal.unit || 'units'}`
        }
      })
      setProgressValue('')
      setShowProgress(false)
    } catch (error) {
      console.error('Failed to log progress:', error)
    }
  }

  const handleStatusChange = async (newStatus: Goal['status']) => {
    try {
      await updateGoalMutation.mutateAsync({
        userId: goal.user_id,
        goalId: goal.id,
        updates: { status: newStatus }
      })
    } catch (error) {
      console.error('Failed to update goal status:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteGoalMutation.mutateAsync({
        userId: goal.user_id,
        goalId: goal.id
      })
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete goal:', error)
      alert('Failed to delete goal. Please try again.')
    }
  }

  const getParentGoal = () => {
    if (!goal.parent_goal_id || !allGoals) return null
    return allGoals.find(g => g.id === goal.parent_goal_id)
  }

  const parentGoal = getParentGoal()

  const targetDateStatus = getTargetDateStatus()

  if (compact) {
    return (
      <div className={`p-4 rounded-lg border-l-4 ${statusColors[goal.status]} hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm">{levelIcons[level]} {goal.title}</h4>
          <span className={`text-xs ${targetDateStatus.color}`}>
            {targetDateStatus.text}
          </span>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{goal.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${goal.progress_percentage}%` }}
            ></div>
          </div>
        </div>

        {goal.current_value && goal.target_value && (
          <div className="text-xs text-gray-600">
            {goal.current_value} / {goal.target_value} {goal.unit}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-lg ${levelColors[level]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{levelIcons[level]}</span>
            <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              goal.status === 'active' ? 'bg-blue-100 text-blue-800' :
              goal.status === 'completed' ? 'bg-green-100 text-green-800' :
              goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {goal.status}
            </span>
          </div>
          {parentGoal && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
              <span>🔗</span>
              <span>Child of:</span>
              <span className="font-medium text-blue-600">{parentGoal.title}</span>
            </div>
          )}
          {goal.description && (
            <p className="text-gray-600 text-sm">{goal.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-sm ${targetDateStatus.color}`}>
            {targetDateStatus.text}
          </span>
          {hasChildren && (
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-white/50 rounded transition-colors"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>
      </div>

      {/* SMART Criteria Summary */}
      <div className="bg-white/50 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div><strong>Specific:</strong> {goal.specific.substring(0, 50)}...</div>
          <div><strong>Measurable:</strong> {goal.measurable.substring(0, 50)}...</div>
          <div><strong>Time-bound:</strong> {goal.target_date.toLocaleDateString()}</div>
          <div><strong>Priority:</strong> {goal.priority}/5</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{goal.progress_percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${goal.progress_percentage}%` }}
          ></div>
        </div>
        {goal.current_value && goal.target_value && (
          <div className="text-sm text-gray-600 mt-1">
            {goal.current_value} / {goal.target_value} {goal.unit}
          </div>
        )}
      </div>

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Milestones</h4>
          <div className="space-y-1">
            {goal.milestones.slice(0, 3).map((milestone, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className={milestone.completed ? '✅' : '⭕'} />
                <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                  {milestone.title}
                </span>
              </div>
            ))}
            {goal.milestones.length > 3 && (
              <div className="text-xs text-gray-500">+{goal.milestones.length - 3} more...</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {goal.status === 'active' && (
          <>
            <Button
              size="sm"
              onClick={() => setShowProgress(!showProgress)}
              variant="outline"
            >
              📈 Log Progress
            </Button>
            <Button
              size="sm"
              onClick={() => handleStatusChange('completed')}
              className="bg-green-600 hover:bg-green-700"
            >
              ✅ Complete
            </Button>
          </>
        )}

        {goal.status === 'completed' && (
          <Button
            size="sm"
            onClick={() => handleStatusChange('active')}
            variant="outline"
          >
            🔄 Reactivate
          </Button>
        )}

        {level < 2 && (
          <Button
            size="sm"
            onClick={() => onCreateChild(level === 0 ? 'weekly' : 'daily')}
            variant="outline"
          >
            + Add {level === 0 ? 'Weekly' : 'Daily'} Goal
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          🗑️ Delete
        </Button>
      </div>

      {/* Progress Input */}
      {showProgress && (
        <div className="mt-4 p-3 bg-white rounded-lg border">
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
              placeholder={`Enter progress (${goal.unit || 'units'})`}
              className="flex-1 px-3 py-1 border rounded text-sm"
            />
            <Button size="sm" onClick={handleProgressSubmit}>
              Add
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowProgress(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Goal</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{goal.title}"? This action cannot be undone.
              {hasChildren && (
                <span className="text-red-600 font-medium">
                  <br />Warning: This will also delete all child goals.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteGoalMutation.isPending}
              >
                {deleteGoalMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}