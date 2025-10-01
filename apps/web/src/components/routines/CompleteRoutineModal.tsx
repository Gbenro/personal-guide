'use client'

import { useState } from 'react'
import { UserRoutine, RoutineSession, CompleteRoutineSessionInput } from '@/types/routines'
import { Button } from '@/components/ui/button'

interface CompleteRoutineModalProps {
  open: boolean
  onClose: () => void
  onComplete: (input: CompleteRoutineSessionInput) => Promise<void>
  routine: UserRoutine
  session: RoutineSession
  actualDurationMinutes: number
}

export function CompleteRoutineModal({
  open,
  onClose,
  onComplete,
  routine,
  session,
  actualDurationMinutes
}: CompleteRoutineModalProps) {
  const [formData, setFormData] = useState({
    mood_before: 5,
    mood_after: 5,
    energy_before: 5,
    energy_after: 5,
    focus_level: 5,
    rating: 5,
    notes: '',
    interruptions_count: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const completionInput: CompleteRoutineSessionInput = {
        session_id: session.id,
        steps_completed: [], // TODO: Track individual steps
        steps_skipped: [],
        mood_before: formData.mood_before,
        mood_after: formData.mood_after,
        energy_before: formData.energy_before,
        energy_after: formData.energy_after,
        focus_level: formData.focus_level,
        rating: formData.rating,
        notes: formData.notes.trim() || undefined,
        tags: ['Routine', routine.category, routine.name],
        interruptions_count: formData.interruptions_count
      }

      await onComplete(completionInput)
      onClose()
    } catch (error) {
      console.error('Failed to complete routine:', error)
      alert('Failed to complete routine. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">🏁 Complete Routine</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <p className="text-gray-600 mt-2">
            How did your <strong>{routine.name}</strong> routine go?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Time Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">⏱️ Session Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Planned Duration:</span>
                <span className="ml-2 font-medium">{routine.estimated_duration} minutes</span>
              </div>
              <div>
                <span className="text-gray-600">Actual Duration:</span>
                <span className="ml-2 font-medium">{actualDurationMinutes} minutes</span>
              </div>
            </div>
          </div>

          {/* Mood & Energy Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">😊 Mood</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Before (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.mood_before}
                    onChange={(e) => setFormData({...formData, mood_before: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{formData.mood_before}/10</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    After (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.mood_after}
                    onChange={(e) => setFormData({...formData, mood_after: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{formData.mood_after}/10</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">⚡ Energy</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Before (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energy_before}
                    onChange={(e) => setFormData({...formData, energy_before: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{formData.energy_before}/10</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    After (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.energy_after}
                    onChange={(e) => setFormData({...formData, energy_after: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{formData.energy_after}/10</div>
                </div>
              </div>
            </div>
          </div>

          {/* Focus & Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Focus Level (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.focus_level}
                onChange={(e) => setFormData({...formData, focus_level: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">{formData.focus_level}/10</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⭐ Overall Rating (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">
                {'⭐'.repeat(formData.rating)} ({formData.rating}/5)
              </div>
            </div>
          </div>

          {/* Interruptions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🚫 Interruptions Count
            </label>
            <input
              type="number"
              min="0"
              value={formData.interruptions_count}
              onChange={(e) => setFormData({...formData, interruptions_count: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="How many times were you interrupted?"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Notes (will be saved to journal)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="How did the routine feel? Any insights, challenges, or thoughts to remember..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This will create a journal entry tagged with "Routine", "{routine.category}", and "{routine.name}"
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {isSubmitting ? 'Completing...' : '🏁 Complete Routine'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}