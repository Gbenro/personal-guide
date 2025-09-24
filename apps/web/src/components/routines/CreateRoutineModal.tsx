import { useState } from 'react'
import { useCreateUserRoutine } from '../../hooks/useRoutines'
import { CreateUserRoutineInput, RoutineCategory, RoutineType } from '../../types/routines'

interface CreateRoutineModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreateRoutineModal({ onClose, onCreated }: CreateRoutineModalProps) {
  const [formData, setFormData] = useState<Partial<CreateUserRoutineInput>>({
    name: '',
    description: '',
    category: 'General',
    routine_type: 'custom',
    steps: [],
    estimated_duration: 30,
    is_scheduled: false,
    scheduled_days: [1, 2, 3, 4, 5, 6, 7]
  })

  const [currentStep, setCurrentStep] = useState({
    name: '',
    description: '',
    instructions: '',
    duration: 60,
    is_timed: true
  })

  const createRoutine = useCreateUserRoutine()

  const categories: RoutineCategory[] = [
    'General', 'Morning', 'Evening', 'Midday', 'Workout', 'Meditation', 'Work', 'Study', 'Wellness'
  ]

  const routineTypes: RoutineType[] = [
    'custom', 'morning', 'evening', 'workout', 'meditation', 'work', 'study'
  ]

  const addStep = () => {
    if (currentStep.name.trim()) {
      setFormData(prev => ({
        ...prev,
        steps: [
          ...(prev.steps || []),
          {
            ...currentStep,
            id: crypto.randomUUID(),
            order: (prev.steps?.length || 0) + 1
          }
        ]
      }))
      setCurrentStep({
        name: '',
        description: '',
        instructions: '',
        duration: 60,
        is_timed: true
      })
    }
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index) || []
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name?.trim() || !formData.steps?.length) {
      return
    }

    try {
      await createRoutine.mutateAsync(formData as CreateUserRoutineInput)
      onCreated()
    } catch (error) {
      console.error('Failed to create routine:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Create New Routine</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Routine Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Morning Routine"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category || 'General'}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as RoutineCategory }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe your routine..."
              />
            </div>

            {/* Steps Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Routine Steps</h3>

              {/* Current Steps */}
              {formData.steps && formData.steps.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.steps.map((step: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{step.name}</div>
                          <div className="text-sm text-gray-600">
                            {step.duration ? `${Math.round(step.duration / 60)} min` : 'No timer'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Step Form */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Add Step</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={currentStep.name}
                    onChange={(e) => setCurrentStep(prev => ({ ...prev, name: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Step name"
                  />

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={Math.round(currentStep.duration / 60)}
                      onChange={(e) => setCurrentStep(prev => ({ ...prev, duration: parseInt(e.target.value) * 60 }))}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                  </div>
                </div>

                <textarea
                  value={currentStep.instructions}
                  onChange={(e) => setCurrentStep(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Step instructions..."
                />

                <button
                  type="button"
                  onClick={addStep}
                  disabled={!currentStep.name.trim()}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Step
                </button>
              </div>
            </div>

            {/* Schedule Settings */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="is_scheduled"
                  checked={formData.is_scheduled || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_scheduled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_scheduled" className="text-sm font-medium text-gray-700">
                  Schedule this routine
                </label>
              </div>

              {formData.is_scheduled && (
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <label key={day} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={formData.scheduled_days?.includes(index + 1) || false}
                        onChange={(e) => {
                          const days = formData.scheduled_days || []
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              scheduled_days: [...days, index + 1]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              scheduled_days: days.filter(d => d !== index + 1)
                            }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">{day}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name?.trim() || !formData.steps?.length || createRoutine.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createRoutine.isPending ? 'Creating...' : 'Create Routine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}