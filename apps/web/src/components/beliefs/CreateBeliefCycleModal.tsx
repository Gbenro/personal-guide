'use client'

import { useState, useEffect } from 'react'
import { useCreateBeliefSystem, useCreateBeliefCycle, useBeliefSystems } from '@/hooks/useBeliefs'
import { useAuth } from '@/hooks/useAuth'
import type { CreateBeliefSystemInput, CreateBeliefCycleInput, BeliefCategory } from '@/types/beliefs'
import { Button } from '@/components/ui/button'

interface CreateBeliefCycleModalProps {
  onClose: () => void
  onCreated: () => void
}

type CreationMode = 'choose' | 'system' | 'cycle'

export function CreateBeliefCycleModal({ onClose, onCreated }: CreateBeliefCycleModalProps) {
  const [mode, setMode] = useState<CreationMode>('choose')
  const [systemFormData, setSystemFormData] = useState<Partial<CreateBeliefSystemInput>>({
    category: 'Personal Growth',
    affirmations: [''],
    cycle_length: 21,
    is_public: false
  })
  const [cycleFormData, setCycleFormData] = useState<Partial<CreateBeliefCycleInput>>({
    target_belief_strength: 10
  })

  const { user } = useAuth()
  const createSystemMutation = useCreateBeliefSystem()
  const createCycleMutation = useCreateBeliefCycle()
  const { data: beliefSystems } = useBeliefSystems()

  const handleCreateSystem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!systemFormData.title || !systemFormData.belief_statement || !systemFormData.affirmations?.length) {
      alert('Please fill in title, belief statement, and at least one affirmation')
      return
    }

    try {
      await createSystemMutation.mutateAsync({
        ...systemFormData,
        title: systemFormData.title!,
        belief_statement: systemFormData.belief_statement!,
        category: systemFormData.category!,
        affirmations: systemFormData.affirmations!.filter(Boolean)
      } as CreateBeliefSystemInput)

      onCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create belief system:', error)
      alert('Failed to create belief system. Please try again.')
    }
  }

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cycleFormData.belief_system_id) {
      alert('Please select a belief system')
      return
    }

    try {
      await createCycleMutation.mutateAsync(cycleFormData as CreateBeliefCycleInput)
      onCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create belief cycle:', error)
      alert('Failed to create belief cycle. Please try again.')
    }
  }

  const addAffirmation = () => {
    setSystemFormData(prev => ({
      ...prev,
      affirmations: [...(prev.affirmations || []), '']
    }))
  }

  const updateAffirmation = (index: number, value: string) => {
    setSystemFormData(prev => ({
      ...prev,
      affirmations: prev.affirmations?.map((aff, i) => i === index ? value : aff) || []
    }))
  }

  const removeAffirmation = (index: number) => {
    setSystemFormData(prev => ({
      ...prev,
      affirmations: prev.affirmations?.filter((_, i) => i !== index) || []
    }))
  }

  if (mode === 'choose') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Belief</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setMode('cycle')}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Start a Belief Cycle</h3>
                    <p className="text-sm text-gray-600">Choose from existing belief systems and start your 21-day journey</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setMode('system')}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✨</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Custom Belief System</h3>
                    <p className="text-sm text-gray-600">Design your own belief system with custom affirmations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'system') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setMode('choose')} className="text-gray-400 hover:text-gray-600">←</button>
                <h2 className="text-xl font-semibold text-gray-900">✨ Create Belief System</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
          </div>

          <form onSubmit={handleCreateSystem} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={systemFormData.title || ''}
                  onChange={(e) => setSystemFormData({...systemFormData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., I Am Confident and Capable"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={systemFormData.category}
                  onChange={(e) => setSystemFormData({...systemFormData, category: e.target.value as BeliefCategory})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Self-Worth">💎 Self-Worth</option>
                  <option value="Confidence">💪 Confidence</option>
                  <option value="Success">🏆 Success</option>
                  <option value="Health">🌱 Health</option>
                  <option value="Abundance">💰 Abundance</option>
                  <option value="Love">❤️ Love</option>
                  <option value="Peace">🕊️ Peace</option>
                  <option value="Personal Growth">📈 Personal Growth</option>
                  <option value="Career">💼 Career</option>
                  <option value="Relationships">🤝 Relationships</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Core Belief Statement *</label>
              <textarea
                value={systemFormData.belief_statement || ''}
                onChange={(e) => setSystemFormData({...systemFormData, belief_statement: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="e.g., I am inherently worthy of love, success, and happiness"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={systemFormData.description || ''}
                onChange={(e) => setSystemFormData({...systemFormData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what this belief system will help you achieve..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Affirmations *</label>
              {systemFormData.affirmations?.map((affirmation, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={affirmation}
                    onChange={(e) => updateAffirmation(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Affirmation ${index + 1}`}
                  />
                  {systemFormData.affirmations!.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAffirmation(index)}
                      className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addAffirmation}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                + Add another affirmation
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Length (days)</label>
                <input
                  type="number"
                  min="7"
                  max="90"
                  value={systemFormData.cycle_length || 21}
                  onChange={(e) => setSystemFormData({...systemFormData, cycle_length: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={systemFormData.is_public || false}
                  onChange={(e) => setSystemFormData({...systemFormData, is_public: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
                  Make this belief system public for others to use
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={createSystemMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {createSystemMutation.isPending ? 'Creating...' : 'Create Belief System'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setMode('choose')}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (mode === 'cycle') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setMode('choose')} className="text-gray-400 hover:text-gray-600">←</button>
                <h2 className="text-xl font-semibold text-gray-900">🎯 Start Belief Cycle</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
          </div>

          <form onSubmit={handleCreateCycle} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Choose Belief System *</label>
              <select
                value={cycleFormData.belief_system_id || ''}
                onChange={(e) => setCycleFormData({...cycleFormData, belief_system_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a belief system...</option>
                {beliefSystems?.map(system => (
                  <option key={system.id} value={system.id}>
                    {system.title} ({system.cycle_length} days)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Title (optional)</label>
              <input
                type="text"
                value={cycleFormData.title || ''}
                onChange={(e) => setCycleFormData({...cycleFormData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customize the title for your cycle..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Belief Statement (optional)</label>
              <textarea
                value={cycleFormData.personal_belief_statement || ''}
                onChange={(e) => setCycleFormData({...cycleFormData, personal_belief_statement: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Personalize the core belief for your situation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Why is this important to you?</label>
              <textarea
                value={cycleFormData.personal_reason || ''}
                onChange={(e) => setCycleFormData({...cycleFormData, personal_reason: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe why changing this belief matters to you..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Belief Strength (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={cycleFormData.target_belief_strength || 10}
                  onChange={(e) => setCycleFormData({...cycleFormData, target_belief_strength: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Reminder Time</label>
                <input
                  type="time"
                  value={cycleFormData.preferred_reminder_time || ''}
                  onChange={(e) => setCycleFormData({...cycleFormData, preferred_reminder_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={createCycleMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {createCycleMutation.isPending ? 'Starting...' : 'Start Belief Cycle'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setMode('choose')}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return null
}