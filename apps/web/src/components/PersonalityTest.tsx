'use client'

import { useState } from 'react'
import { PersonalityMode, getPersonalityConfig, getPersonalityWelcomeMessage } from '@/lib/personalities'

export default function PersonalityTest() {
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityMode>('mentor')
  const [testMessage, setTestMessage] = useState('I\'m struggling with my goals and feeling overwhelmed.')

  const personalities: PersonalityMode[] = ['mentor', 'coach', 'friend', 'mirror']

  const handleTestAPI = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          personalityMode: selectedPersonality,
          aiProvider: 'auto'
        })
      })

      const data = await response.json()
      console.log('API Response:', data)
      alert(`Response from ${selectedPersonality}:\n\n${data.response || data.message}`)
    } catch (error) {
      console.error('Test error:', error)
      alert('Test failed - check console for details')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Personality System Test</h2>
        <p className="text-gray-600">Compare how different AI personalities respond to the same message.</p>
      </div>

      {/* Test Message Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Message:
        </label>
        <textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Enter a message to test with different personalities..."
        />
      </div>

      {/* Personality Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {personalities.map((mode) => {
          const config = getPersonalityConfig(mode)
          const isSelected = selectedPersonality === mode

          return (
            <div
              key={mode}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedPersonality(mode)}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{config.icon}</div>
                <h3 className="font-bold text-lg text-gray-800">{config.name}</h3>
                <p className="text-sm text-gray-600">{config.shortDescription}</p>
              </div>

              {/* Personality Details */}
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Approach:</span>
                  <p className="text-gray-600 mt-1">{config.responseStyle.engagement}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Style:</span>
                  <p className="text-gray-600 mt-1">
                    {config.responseStyle.tone} • {config.responseStyle.length} responses
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Welcome:</span>
                  <p className="text-gray-600 mt-1 italic text-xs">
                    "{getPersonalityWelcomeMessage(mode)}"
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTestAPI()
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  >
                    Test with {config.name}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* API Status Check */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-2">System Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Enhanced personality system active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Mood detection enabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Personality suggestions active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Contextual responses enabled</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Modify the test message above or use the default</li>
          <li>Click on a personality mode to select it</li>
          <li>Click "Test with [Personality]" to see the response</li>
          <li>Compare responses between different personalities</li>
          <li>Notice how each mode handles the same input differently</li>
        </ol>
      </div>
    </div>
  )
}