'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePersonalGuideStore } from '@/stores/personalGuideStore'
import { createMoodEntry } from '@/lib/journalService'
import { FaceSmileIcon, FaceFrownIcon } from '@heroicons/react/24/outline'

const QUICK_MOODS = [
  { value: 2, emoji: '😔', label: 'Bad', color: 'red' },
  { value: 4, emoji: '🙁', label: 'Low', color: 'orange' },
  { value: 6, emoji: '😌', label: 'Good', color: 'blue' },
  { value: 8, emoji: '😄', label: 'Great', color: 'green' },
  { value: 10, emoji: '🤩', label: 'Amazing', color: 'purple' }
]

interface QuickMoodTrackerProps {
  onMoodLogged?: (mood: number) => void
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function QuickMoodTracker({
  onMoodLogged,
  showLabel = true,
  size = 'md'
}: QuickMoodTrackerProps) {
  const { user } = useAuth()
  const { addMoodEntry } = usePersonalGuideStore()
  const [isLogging, setIsLogging] = useState(false)
  const [lastLogged, setLastLogged] = useState<number | null>(null)

  const handleMoodSelection = async (moodValue: number) => {
    if (!user || isLogging) return

    setIsLogging(true)

    try {
      const moodEntry = await createMoodEntry(user.id, {
        rating: moodValue,
        notes: `Quick mood check: ${QUICK_MOODS.find(m => m.value === moodValue)?.label}`
      })

      if (moodEntry) {
        addMoodEntry(moodEntry)
        setLastLogged(moodValue)
        onMoodLogged?.(moodValue)

        // Reset the logged state after a short delay
        setTimeout(() => setLastLogged(null), 3000)
      }
    } catch (error) {
      console.error('Error logging mood:', error)
    } finally {
      setIsLogging(false)
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'p-2 text-lg'
      case 'lg': return 'p-4 text-2xl'
      default: return 'p-3 text-xl'
    }
  }

  const getContainerClass = () => {
    switch (size) {
      case 'sm': return 'space-x-1'
      case 'lg': return 'space-x-3'
      default: return 'space-x-2'
    }
  }

  if (lastLogged) {
    const loggedMood = QUICK_MOODS.find(m => m.value === lastLogged)
    return (
      <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="text-center">
          <div className="text-2xl mb-1">{loggedMood?.emoji}</div>
          <p className="text-sm text-green-700 font-medium">
            Mood logged: {loggedMood?.label}
          </p>
          <p className="text-xs text-green-600">
            Thanks for checking in!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {showLabel && (
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            How are you feeling?
          </h3>
          <p className="text-xs text-gray-500">
            Quick mood check
          </p>
        </div>
      )}

      <div className={`flex justify-center ${getContainerClass()}`}>
        {QUICK_MOODS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => handleMoodSelection(mood.value)}
            disabled={isLogging}
            className={`
              ${getButtonSize()}
              rounded-lg border-2 border-gray-200
              hover:border-gray-300 hover:scale-110
              active:scale-95 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-white hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            `}
            title={`Feeling ${mood.label}`}
          >
            {isLogging ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              <span>{mood.emoji}</span>
            )}
          </button>
        ))}
      </div>

      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>Not great</span>
          <span>Amazing</span>
        </div>
      )}
    </div>
  )
}