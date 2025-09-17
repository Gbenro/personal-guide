'use client'

import { useState } from 'react'
import { CogIcon } from '@heroicons/react/24/outline'

type AIProvider = 'openai' | 'claude' | 'fallback' | 'auto'

interface AIProviderSelectorProps {
  selectedProvider: AIProvider
  onProviderChange: (provider: AIProvider) => void
}

export default function AIProviderSelector({ selectedProvider, onProviderChange }: AIProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const providers = [
    { value: 'auto' as AIProvider, label: 'Auto (Best Available)', icon: '🤖' },
    { value: 'claude' as AIProvider, label: 'Claude (Anthropic)', icon: '🧠' },
    { value: 'openai' as AIProvider, label: 'ChatGPT (OpenAI)', icon: '💭' },
    { value: 'fallback' as AIProvider, label: 'Smart Templates', icon: '📝' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white/60 hover:bg-white/80 rounded-full transition-colors"
        title="Choose AI Provider"
      >
        <CogIcon className="h-4 w-4" />
        <span className="hidden sm:inline">
          {providers.find(p => p.value === selectedProvider)?.label || 'Auto'}
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
              AI Provider
            </div>
            
            {providers.map((provider) => (
              <button
                key={provider.value}
                onClick={() => {
                  onProviderChange(provider.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 ${
                  selectedProvider === provider.value 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                    : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{provider.icon}</span>
                <div>
                  <div className="font-medium">{provider.label}</div>
                  {provider.value === 'auto' && (
                    <div className="text-xs text-gray-500">Automatically chooses the best available AI</div>
                  )}
                  {provider.value === 'claude' && (
                    <div className="text-xs text-gray-500">Advanced reasoning and thoughtful responses</div>
                  )}
                  {provider.value === 'openai' && (
                    <div className="text-xs text-gray-500">Creative and conversational AI responses</div>
                  )}
                  {provider.value === 'fallback' && (
                    <div className="text-xs text-gray-500">Intelligent templates with mood detection</div>
                  )}
                </div>
              </button>
            ))}
            
            <div className="border-t border-gray-100 mt-2 pt-2 px-3">
              <div className="text-xs text-gray-500">
                The system will automatically fallback to available providers if your selection fails.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}