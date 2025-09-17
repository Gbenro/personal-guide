'use client'

import { PersonalityMode, getPersonalityConfig } from '@/lib/personalities'

interface PersonalitySuggestionProps {
  suggestedPersonality: PersonalityMode
  currentPersonality: PersonalityMode
  onAccept: () => void
  onDismiss: () => void
}

export default function PersonalitySuggestion({
  suggestedPersonality,
  currentPersonality,
  onAccept,
  onDismiss
}: PersonalitySuggestionProps) {
  const suggestedConfig = getPersonalityConfig(suggestedPersonality)
  const currentConfig = getPersonalityConfig(currentPersonality)

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-yellow-500 text-xl mt-0.5">✨</div>
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800 text-sm">
              Personality Switch Suggestion
            </h4>
            <p className="text-yellow-700 text-sm mt-1">
              Based on your message, you might benefit from switching from{' '}
              <span className="font-medium">
                {currentConfig.icon} {currentConfig.name}
              </span>
              {' '}to{' '}
              <span className="font-medium">
                {suggestedConfig.icon} {suggestedConfig.name}
              </span>
              {' '}for this conversation.
            </p>
            <p className="text-yellow-600 text-xs mt-2">
              <span className="font-medium">{suggestedConfig.name}:</span> {suggestedConfig.shortDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-3">
          <button
            onClick={onAccept}
            className="px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Switch
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 text-xs font-medium text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            Keep {currentConfig.name}
          </button>
        </div>
      </div>
    </div>
  )
}