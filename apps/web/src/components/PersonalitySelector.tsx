'use client'

import { useState } from 'react'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { type PersonalityMode } from '@/lib/personalities'

interface PersonalitySelectorProps {
  selectedMode: PersonalityMode
  onModeChange: (mode: PersonalityMode) => void
}

export default function PersonalitySelector({ selectedMode, onModeChange }: PersonalitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const personalities = [
    {
      value: 'mentor' as PersonalityMode,
      label: 'Mentor',
      icon: '🧙',
      description: 'Wise guidance and deep reflection'
    },
    {
      value: 'coach' as PersonalityMode,
      label: 'Coach',
      icon: '💪',
      description: 'Motivation and goal achievement'
    },
    {
      value: 'friend' as PersonalityMode,
      label: 'Friend',
      icon: '🤝',
      description: 'Supportive listening and comfort'
    },
    {
      value: 'mirror' as PersonalityMode,
      label: 'Mirror',
      icon: '🪞',
      description: 'Pure reflection and self-awareness'
    },
  ]

  const currentPersonality = personalities.find(p => p.value === selectedMode)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white/60 hover:bg-white/80 rounded-full transition-colors"
        title="Choose AI Personality"
      >
        <UserCircleIcon className="h-4 w-4" />
        <span className="hidden sm:inline flex items-center space-x-1">
          <span>{currentPersonality?.icon}</span>
          <span>{currentPersonality?.label}</span>
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              AI Personality Mode
            </div>
            
            {personalities.map((personality) => (
              <button
                key={personality.value}
                onClick={() => {
                  onModeChange(personality.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-3 text-sm hover:bg-gray-50 flex items-start space-x-3 ${
                  selectedMode === personality.value 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                    : 'text-gray-700'
                }`}
              >
                <span className="text-xl mt-0.5">{personality.icon}</span>
                <div>
                  <div className="font-medium">{personality.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{personality.description}</div>
                </div>
              </button>
            ))}
            
            <div className="border-t border-gray-100 mt-2 pt-2 px-3">
              <div className="text-xs text-gray-500">
                Your AI companion adapts its personality to best support your current needs.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}