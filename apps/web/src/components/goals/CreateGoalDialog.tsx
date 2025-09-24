'use client'

import { useState, useEffect } from 'react'
import { useCreateGoal, useGoalTemplates } from '@/hooks/useGoals'
import type { CreateGoalInput, GoalType, GoalCategory } from '@/types/goals'
import { Button } from '@/components/ui/button'

interface CreateGoalDialogProps {
  open: boolean
  onClose: () => void
  userId: string
  defaultGoalType?: GoalType
  parentGoalId?: string
}

export function CreateGoalDialog({
  open,
  onClose,
  userId,
  defaultGoalType = 'monthly',
  parentGoalId
}: CreateGoalDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateGoalInput>>({
    goal_type: defaultGoalType,
    parent_goal_id: parentGoalId,
    priority: 3,
    difficulty: 3,
    energy_required: 3,
    tags: []
  })

  const createGoalMutation = useCreateGoal()
  const { data: templates } = useGoalTemplates(userId)

  useEffect(() => {
    if (open) {
      setFormData({
        goal_type: defaultGoalType,
        parent_goal_id: parentGoalId,
        priority: 3,
        difficulty: 3,
        energy_required: 3,
        tags: []
      })
    }
  }, [open, defaultGoalType, parentGoalId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.title || !formData.specific || !formData.measurable ||
        !formData.achievable || !formData.relevant || !formData.target_date) {
      alert('Please fill in all required SMART criteria fields')
      return
    }

    try {
      await createGoalMutation.mutateAsync({
        userId,
        input: {
          ...formData,
          title: formData.title!,
          category: formData.category || 'Other',
          specific: formData.specific!,
          measurable: formData.measurable!,
          achievable: formData.achievable!,
          relevant: formData.relevant!,
          time_bound: new Date(formData.target_date!),
          target_date: new Date(formData.target_date!)
        } as CreateGoalInput
      })
      onClose()
    } catch (error) {
      console.error('Failed to create goal:', error)
      alert('Failed to create goal. Please try again.')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">🎯 Create SMART Goal</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Create a goal using the SMART framework: Specific, Measurable, Achievable, Relevant, Time-bound
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Title *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Complete Marathon Training"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category || 'Other'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Career">💼 Career</option>
                <option value="Health & Fitness">🏃‍♀️ Health & Fitness</option>
                <option value="Personal Development">📚 Personal Development</option>
                <option value="Financial">💰 Financial</option>
                <option value="Relationships">❤️ Relationships</option>
                <option value="Education">🎓 Education</option>
                <option value="Hobbies">🎨 Hobbies</option>
                <option value="Spiritual">🧘 Spiritual</option>
                <option value="Travel">✈️ Travel</option>
                <option value="Other">📝 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Type
              </label>
              <select
                value={formData.goal_type}
                onChange={(e) => setFormData({ ...formData, goal_type: e.target.value as GoalType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">📅 Monthly Goal</option>
                <option value="weekly">📆 Weekly Goal</option>
                <option value="daily">📋 Daily Goal</option>
                <option value="one-time">🎯 One-time Goal</option>
                <option value="long-term">🌟 Long-term Goal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date *
              </label>
              <input
                type="date"
                value={formData.target_date || ''}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* SMART Criteria */}
          <div className="bg-blue-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">🎯 SMART Criteria</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <strong>S</strong>pecific: What exactly will you accomplish? *
              </label>
              <textarea
                value={formData.specific || ''}
                onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Describe exactly what you want to achieve..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <strong>M</strong>easurable: How will you measure progress? *
              </label>
              <textarea
                value={formData.measurable || ''}
                onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Define how you'll track and measure progress..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <strong>A</strong>chievable: Is this goal realistic and attainable? *
              </label>
              <textarea
                value={formData.achievable || ''}
                onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Explain why this goal is realistic for you..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <strong>R</strong>elevant: Why is this goal important to you? *
              </label>
              <textarea
                value={formData.relevant || ''}
                onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Describe why this goal matters and aligns with your values..."
                required
              />
            </div>
          </div>

          {/* Measurement Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Value
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.target_value || ''}
                onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., books, miles, hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-5)
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 - Highest</option>
                <option value={2}>2 - High</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Low</option>
                <option value={5}>5 - Lowest</option>
              </select>
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional details about your goal..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., health, fitness, running"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={createGoalMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}