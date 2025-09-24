'use client'

import { useState, useEffect, useRef } from 'react'
import { PaperAirplaneIcon, MicrophoneIcon, StopIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import AIProviderSelector from './AIProviderSelector'
import PersonalitySelector from './PersonalitySelector'
import PersonalitySuggestion from './PersonalitySuggestion'
import { Button } from './ui/button'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCurrentChatSession,
  saveMessage,
  loadChatHistory,
  convertDbMessageToUI,
  type ChatSession
} from '@/lib/chatService'
import { PersonalityMode, getPersonalityWelcomeMessage } from '@/lib/personalities'
import { processEntityMessage, type ChatEntityResponse } from '@/lib/chatEntityMaster'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  mood?: string
  moodConfidence?: number
  emotionalKeywords?: string[]
  personalityMode?: PersonalityMode
  entityOperation?: boolean
  operationResult?: ChatEntityResponse
  operationStatus?: 'processing' | 'success' | 'error' | 'confirmation_needed'
}

interface PendingOperation {
  id: string
  message: string
  operation: ChatEntityResponse
  timestamp: Date
}

export default function ChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [selectedAIProvider, setSelectedAIProvider] = useState<'openai' | 'claude' | 'fallback' | 'auto'>('auto')
  const [lastUsedProvider, setLastUsedProvider] = useState<string | null>(null)
  const [personalityMode, setPersonalityMode] = useState<PersonalityMode>('mentor')
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [suggestedPersonality, setSuggestedPersonality] = useState<PersonalityMode | null>(null)
  const [lastMood, setLastMood] = useState<string | null>(null)
  const [lastMoodConfidence, setLastMoodConfidence] = useState<number | null>(null)
  const [lastEmotionalKeywords, setLastEmotionalKeywords] = useState<string[]>([])
  const [pendingOperation, setPendingOperation] = useState<PendingOperation | null>(null)
  const [isProcessingEntity, setIsProcessingEntity] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handlePersonalityChange = (newMode: PersonalityMode) => {
    setPersonalityMode(newMode)
    setSuggestedPersonality(null) // Clear any suggestions when manually changed

    // Add a system message about the personality change if there are existing messages
    if (messages.length > 1) {
      const personalityChangeMessage: Message = {
        id: `personality-change-${Date.now()}`,
        content: `Personality switched to ${newMode}. ${getPersonalityWelcomeMessage(newMode)}`,
        role: 'assistant',
        timestamp: new Date(),
        personalityMode: newMode
      }
      setMessages(prev => [...prev, personalityChangeMessage])
    }
  }

  // Check if message is an entity operation
  const isEntityOperation = async (message: string): Promise<ChatEntityResponse | null> => {
    if (!user) return null

    try {
      setIsProcessingEntity(true)
      const result = await processEntityMessage(message, user.id, {
        useContext: true,
        sessionId: currentSession?.id
      })
      return result
    } catch (error) {
      console.error('Error checking entity operation:', error)
      return null
    } finally {
      setIsProcessingEntity(false)
    }
  }

  // Handle confirmed entity operations
  const executeConfirmedOperation = async (operation: PendingOperation) => {
    if (!user || !currentSession) return

    // Add processing message
    const processingMessage: Message = {
      id: `processing-${Date.now()}`,
      content: `⚡ Processing: ${operation.message}`,
      role: 'assistant',
      timestamp: new Date(),
      entityOperation: true,
      operationStatus: 'processing'
    }

    setMessages(prev => [...prev, processingMessage])

    try {
      // Execute the operation (already processed, just need to handle the result)
      const result = operation.operation

      // Create result message
      const resultMessage: Message = {
        id: `result-${Date.now()}`,
        content: result.success ?
          `✅ ${result.result?.message || 'Operation completed successfully!'}` :
          `❌ ${result.error?.message || 'Operation failed'}`,
        role: 'assistant',
        timestamp: new Date(),
        entityOperation: true,
        operationResult: result,
        operationStatus: result.success ? 'success' : 'error'
      }

      // Update messages - replace processing message with result
      setMessages(prev => prev.map(msg =>
        msg.id === processingMessage.id ? resultMessage : msg
      ))

      // Save to database if successful
      if (result.success && currentSession) {
        await saveMessage(
          currentSession.id,
          user.id,
          resultMessage.content,
          'assistant',
          {
            entity_operation: true,
            operation_result: result,
            ai_provider: 'entity_system'
          }
        )
      }

    } catch (error) {
      console.error('Error executing entity operation:', error)

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `❌ An error occurred while processing your request. Please try again.`,
        role: 'assistant',
        timestamp: new Date(),
        entityOperation: true,
        operationStatus: 'error'
      }

      setMessages(prev => prev.map(msg =>
        msg.id === processingMessage.id ? errorMessage : msg
      ))
    } finally {
      setPendingOperation(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isProcessingEntity || !user || !currentSession) return

    const userInput = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userInput,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Clear saved draft since message was sent
    localStorage.removeItem('pg-draft')
    setLastSaved(null)

    // First check if this is an entity operation
    const entityResult = await isEntityOperation(userInput)

    if (entityResult) {
      // This is an entity operation
      if (entityResult.needsDisambiguation) {
        // Handle disambiguation
        const disambiguationMessage: Message = {
          id: `disambiguation-${Date.now()}`,
          content: `I need clarification: ${entityResult.operation?.originalMessage}\n\n${entityResult.disambiguationOptions?.map((option, index) => `${index + 1}. ${option.entityType} - ${option.intent}`).join('\n') || 'Please clarify your request.'}`,
          role: 'assistant',
          timestamp: new Date(),
          entityOperation: true,
          operationStatus: 'confirmation_needed'
        }
        setMessages(prev => [...prev, disambiguationMessage])
        return
      }

      if (entityResult.success && entityResult.result?.needsConfirmation) {
        // Operation needs confirmation
        const pendingOp: PendingOperation = {
          id: `pending-${Date.now()}`,
          message: userInput,
          operation: entityResult,
          timestamp: new Date()
        }
        setPendingOperation(pendingOp)
        return
      }

      // Execute entity operation directly
      const processingMessage: Message = {
        id: `processing-${Date.now()}`,
        content: `⚡ Processing: ${userInput}`,
        role: 'assistant',
        timestamp: new Date(),
        entityOperation: true,
        operationStatus: 'processing'
      }

      setMessages(prev => [...prev, processingMessage])

      // Show result
      const resultMessage: Message = {
        id: `result-${Date.now()}`,
        content: entityResult.success ?
          `✅ ${entityResult.result?.message || 'Operation completed successfully!'}` :
          `❌ ${entityResult.error?.message || 'Operation failed'}`,
        role: 'assistant',
        timestamp: new Date(),
        entityOperation: true,
        operationResult: entityResult,
        operationStatus: entityResult.success ? 'success' : 'error'
      }

      setMessages(prev => prev.map(msg =>
        msg.id === processingMessage.id ? resultMessage : msg
      ))

      // Save entity operation result to database
      if (entityResult.success && currentSession) {
        await saveMessage(
          currentSession.id,
          user.id,
          resultMessage.content,
          'assistant',
          {
            entity_operation: true,
            operation_result: entityResult,
            ai_provider: 'entity_system'
          }
        )
      }

      return
    }

    // Not an entity operation, proceed with regular AI chat
    setIsLoading(true)

    try {
      // Save user message to database
      const savedUserMessage = await saveMessage(
        currentSession.id,
        user.id,
        userInput,
        'user'
      )

      if (!savedUserMessage) {
        console.error('Failed to save user message to database')
        // Continue anyway - don't block the user experience
      }

      // Enhanced AI response with personality and provider selection
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          messages: [...messages, userMessage].slice(-10), // Keep recent context
          personalityMode,
          aiProvider: selectedAIProvider === 'auto' ? undefined : selectedAIProvider
        })
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()
      const aiResponse: Message = {
        id: Date.now().toString(),
        content: data.response || data.message, // Handle both response formats
        role: 'assistant',
        timestamp: new Date(),
        mood: data.mood,
        moodConfidence: data.mood_confidence,
        emotionalKeywords: data.emotional_keywords,
        personalityMode: data.personalityMode
      }

      // Save AI response to database
      const savedAIMessage = await saveMessage(
        currentSession.id,
        user.id,
        aiResponse.content,
        'assistant',
        {
          mood: data.mood,
          mood_confidence: data.mood_confidence,
          emotional_keywords: data.emotional_keywords,
          personality_mode: data.personalityMode,
          ai_provider: data.provider
        }
      )

      if (!savedAIMessage) {
        console.error('Failed to save AI message to database')
        // Continue anyway - user can still see the response in UI
      }

      // Track which provider was actually used and mood data
      setLastUsedProvider(data.provider)
      setLastMood(data.mood)
      setLastMoodConfidence(data.mood_confidence)
      setLastEmotionalKeywords(data.emotional_keywords || [])
      setMessages(prev => [...prev, aiResponse])

      // Handle personality suggestions
      if (data.suggestedPersonality && data.suggestedPersonality !== personalityMode) {
        setSuggestedPersonality(data.suggestedPersonality)
      }

    } catch (error) {
      // Enhanced fallback response using personality system
      const fallbackContent = personalityMode === 'mentor'
        ? `I hear you sharing: "${userInput}". Let me take a moment to reflect on what you've offered. Sometimes the most meaningful insights emerge from these pauses. What aspect of this feels most important to explore together?`
        : personalityMode === 'coach'
        ? `I caught what you said: "${userInput}" - and I can sense there's energy behind those words! Even when my systems are taking a breather, your momentum doesn't have to stop. What's the one thing about this that you're most excited to take action on?`
        : `I heard you say: "${userInput}" and I want you to know I'm really listening. Even when I'm having a quiet moment, I'm still here with you. What's the most important thing you want me to understand about what you just shared?`

      const fallbackResponse: Message = {
        id: Date.now().toString(),
        content: fallbackContent,
        role: 'assistant',
        timestamp: new Date(),
        personalityMode
      }

      // Save fallback response to database
      try {
        if (currentSession) {
          await saveMessage(
            currentSession.id,
            user.id,
            fallbackResponse.content,
            'assistant',
            {
              mood: 'neutral',
              personality_mode: personalityMode,
              ai_provider: 'fallback'
            }
          )
        }
      } catch (dbError) {
        console.error('Error saving fallback message:', dbError)
      }

      setMessages(prev => [...prev, fallbackResponse])
      setLastUsedProvider('fallback')
      setLastMood('neutral')
      setLastMoodConfidence(0.5)
      setLastEmotionalKeywords([])
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load chat history when user is available
  useEffect(() => {
    async function initializeChatSession() {
      if (!user) return

      try {
        setIsLoadingHistory(true)

        // Get or create current chat session
        const session = await getCurrentChatSession(user)
        if (!session) {
          console.error('Failed to get chat session')
          setIsLoadingHistory(false)
          return
        }

        setCurrentSession(session)

        // Load chat history for this session
        const history = await loadChatHistory(session.id)
        const uiMessages = history.map(convertDbMessageToUI)

        // Add welcome message if no history exists
        if (uiMessages.length === 0) {
          const welcomeMessage: Message = {
            id: 'welcome',
            content: getPersonalityWelcomeMessage(personalityMode),
            role: 'assistant',
            timestamp: new Date(),
            personalityMode
          }
          setMessages([welcomeMessage])
        } else {
          setMessages(uiMessages)
        }
      } catch (error) {
        console.error('Error initializing chat session:', error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    initializeChatSession()
  }, [user])

  // Update welcome message when personality changes and no history exists
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([{
        id: 'welcome',
        content: getPersonalityWelcomeMessage(personalityMode),
        role: 'assistant',
        timestamp: new Date(),
        personalityMode
      }])
    }
  }, [personalityMode])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognitionInstance = new SpeechRecognition()

      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setInput(finalTranscript)
          setIsListening(false)
        } else {
          setInput(interimTranscript)
        }
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('pg-draft')
    if (savedDraft) {
      setInput(savedDraft)
    }
  }, [])

  // Auto-save draft while typing
  useEffect(() => {
    if (input.trim()) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('pg-draft', input)
        setLastSaved(new Date())
      }, 1000) // Save after 1 second of no typing

      return () => clearTimeout(timeoutId)
    } else {
      localStorage.removeItem('pg-draft')
      setLastSaved(null)
    }
  }, [input])

  const handleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition not supported in your browser. Try Chrome or Safari.')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  // Enhanced mood display function
  const getMoodDisplay = (mood: string, confidence?: number | null) => {
    const confidencePercent = confidence ? Math.round(confidence * 100) : 0
    const moodEmoji = mood === 'positive' ? '😊' :
                     mood === 'negative' ? '😔' :
                     mood === 'goal-focused' ? '🎯' :
                     mood === 'reflective' ? '🤔' :
                     mood === 'anxious' ? '😰' :
                     mood === 'happy' ? '😄' :
                     mood === 'sad' ? '😢' :
                     mood === 'energized' ? '⚡' : '😐'

    const moodLabel = mood === 'positive' ? 'Positive' :
                     mood === 'negative' ? 'Supportive' :
                     mood === 'goal-focused' ? 'Focused' :
                     mood === 'reflective' ? 'Thoughtful' :
                     mood === 'anxious' ? 'Anxious' :
                     mood === 'happy' ? 'Happy' :
                     mood === 'sad' ? 'Sad' :
                     mood === 'energized' ? 'Energized' : 'Neutral'

    return { emoji: moodEmoji, label: moodLabel, confidence: confidencePercent }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with AI Provider and Personality Selectors */}
      <div className="border-b border-gray-100 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-800">Personal Guide Chat</h3>
          <div className="flex items-center space-x-2">
            {lastUsedProvider && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {lastUsedProvider === 'anthropic' ? '🧠 Claude' :
                 lastUsedProvider === 'openai' ? '💭 ChatGPT' :
                 lastUsedProvider === 'fallback' ? '📝 Fallback' : lastUsedProvider}
              </span>
            )}
            {lastMood && lastMood !== 'neutral' && (
              <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 cursor-help"
                   title={`Mood: ${getMoodDisplay(lastMood, lastMoodConfidence).label}${lastMoodConfidence ? ` (${getMoodDisplay(lastMood, lastMoodConfidence).confidence}% confidence)` : ''}${lastEmotionalKeywords.length > 0 ? `\nKeywords: ${lastEmotionalKeywords.slice(0, 3).join(', ')}` : ''}`}>
                <span className="flex items-center space-x-1">
                  <span>{getMoodDisplay(lastMood, lastMoodConfidence).emoji}</span>
                  <span>{getMoodDisplay(lastMood, lastMoodConfidence).label}</span>
                  {lastMoodConfidence && lastMoodConfidence > 0.8 && (
                    <span className="text-green-600">•</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <PersonalitySelector
            selectedMode={personalityMode}
            onModeChange={handlePersonalityChange}
          />
          <AIProviderSelector
            selectedProvider={selectedAIProvider}
            onProviderChange={setSelectedAIProvider}
          />
        </div>
      </div>

      {/* Enhanced Mood Insights Panel */}
      {lastEmotionalKeywords.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-2 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Emotional insights:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {lastEmotionalKeywords.slice(0, 6).map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-white bg-opacity-70 rounded-full text-xs text-gray-700 border border-gray-200">
                  {keyword}
                </span>
              ))}
              {lastEmotionalKeywords.length > 6 && (
                <span className="text-xs text-gray-500">+{lastEmotionalKeywords.length - 6} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personality Suggestion */}
      {suggestedPersonality && (
        <div className="border-b border-gray-100 p-4">
          <PersonalitySuggestion
            suggestedPersonality={suggestedPersonality}
            currentPersonality={personalityMode}
            onAccept={() => handlePersonalityChange(suggestedPersonality)}
            onDismiss={() => setSuggestedPersonality(null)}
          />
        </div>
      )}

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="inline-flex space-x-1 mb-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-sm text-gray-600">Loading your conversation...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.entityOperation && message.operationStatus === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-900'
                      : message.entityOperation && message.operationStatus === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-900'
                      : message.entityOperation && message.operationStatus === 'processing'
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.entityOperation && (
                      <div className="flex-shrink-0 mt-0.5">
                        {message.operationStatus === 'success' && (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        )}
                        {message.operationStatus === 'error' && (
                          <XCircleIcon className="h-4 w-4 text-red-600" />
                        )}
                        {message.operationStatus === 'processing' && (
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>

                      {/* Show entity operation details */}
                      {message.entityOperation && message.operationResult?.result?.data && (
                        <div className="mt-2 text-xs opacity-75">
                          {message.operationResult.result.suggestedActions && (
                            <div className="mt-1">
                              <span className="font-medium">Suggestions: </span>
                              {message.operationResult.result.suggestedActions.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center justify-between mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <p className="text-xs">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center space-x-1">
                      {message.role === 'assistant' && message.personalityMode && (
                        <span className="text-xs">
                          {message.personalityMode === 'mentor' ? '🧙' :
                           message.personalityMode === 'coach' ? '💪' :
                           message.personalityMode === 'friend' ? '🤝' : ''}
                        </span>
                      )}
                      {message.role === 'assistant' && message.mood && message.mood !== 'neutral' && (
                        <span className="text-xs" title={`Detected mood: ${message.mood}${message.moodConfidence ? ` (${Math.round(message.moodConfidence * 100)}% confidence)` : ''}`}>
                          {getMoodDisplay(message.mood, message.moodConfidence).emoji}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Entity Processing Indicator */}
            {isProcessingEntity && (
              <div className="flex justify-start">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-2xl max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">Analyzing request...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Dialog */}
            {pendingOperation && (
              <div className="flex justify-start">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-2xl max-w-md">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Confirm Action</p>
                      <p className="text-sm mb-3">
                        {pendingOperation.operation.result?.confirmationPrompt ||
                         `Are you sure you want to: "${pendingOperation.message}"?`}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => executeConfirmedOperation(pendingOperation)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingOperation(null)}
                          className="border-yellow-300 hover:bg-yellow-50"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-100 p-4">
        {lastSaved && (
          <div className="text-xs text-gray-500 mb-2 text-center">
            Draft saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share what's on your mind..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            disabled={isLoading || isProcessingEntity}
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2 transition-colors ${
              isListening
                ? 'text-red-500 hover:text-red-600 animate-pulse'
                : 'text-gray-500 hover:text-blue-600'
            }`}
            title={isListening ? 'Stop recording' : 'Start voice input'}
          >
            {isListening ? (
              <StopIcon className="h-6 w-6" />
            ) : (
              <MicrophoneIcon className="h-6 w-6" />
            )}
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading || isProcessingEntity}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}