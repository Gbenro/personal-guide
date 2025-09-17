'use client'

import { useState } from 'react'
import { PersonalityMode, getPersonalityConfig } from '@/lib/personalities'

interface PersonalityShowcaseProps {
  onPersonalitySelect?: (mode: PersonalityMode) => void
  currentPersonality?: PersonalityMode
}

export default function PersonalityShowcase({ onPersonalitySelect, currentPersonality }: PersonalityShowcaseProps) {
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityMode | null>(null)

  const personalities: PersonalityMode[] = ['mentor', 'coach', 'friend', 'mirror']

  const handlePersonalityClick = (mode: PersonalityMode) => {
    setSelectedPersonality(selectedPersonality === mode ? null : mode)
  }

  const handleSelectPersonality = (mode: PersonalityMode) => {
    if (onPersonalitySelect) {
      onPersonalitySelect(mode)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Your AI Companion</h3>
        <p className="text-sm text-gray-600">Each personality brings a unique approach to support your journey</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {personalities.map((mode) => {
          const config = getPersonalityConfig(mode)
          const isSelected = selectedPersonality === mode
          const isCurrent = currentPersonality === mode

          return (
            <div key={mode} className="relative">
              <div
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50'
                    : isSelected
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => handlePersonalityClick(mode)}
              >
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <h4 className="font-semibold text-gray-800">{config.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{config.shortDescription}</p>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 mb-3">{config.fullDescription}</p>

                    <div className="space-y-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Style:</span> {config.responseStyle.tone}
                      </div>
                      <div>
                        <span className="font-medium">Approach:</span> {config.responseStyle.engagement}
                      </div>
                      <div>
                        <span className="font-medium">Length:</span> {config.responseStyle.length} responses
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                      <div className="font-medium text-gray-700 mb-1">Example greeting:</div>
                      <div className="text-gray-600 italic">"{config.welcomeMessage}"</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectPersonality(mode)
                      }}
                      className={`mt-3 w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Currently Active' : `Chat with ${config.name}`}
                    </button>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Active
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-500 mt-0.5">💡</div>
          <div>
            <h4 className="font-medium text-blue-800">Adaptive Intelligence</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your AI companion automatically adapts its responses based on your mood and the context of your conversation.
              You can switch personalities anytime to get the type of support you need most.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}