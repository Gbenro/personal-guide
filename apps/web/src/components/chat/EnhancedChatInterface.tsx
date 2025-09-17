'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  PhotoIcon,
  FaceSmileIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownCircleIcon,
  BookOpenIcon,
  LightBulbIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import AIProviderSelector from '../AIProviderSelector'
import PersonalitySelector from '../PersonalitySelector'
import PersonalitySuggestion from '../PersonalitySuggestion'
import ErrorBoundary from '../ErrorBoundary'
import { useAuth } from '@/contexts/AuthContext'
import { reportError, trackUserAction, measureAsyncExecutionTime } from '@/lib/monitoring'
import {
  getCurrentChatSession,
  saveMessage,
  loadChatHistory,
  convertDbMessageToUI,
  type ChatSession
} from '@/lib/chatService'
import { PersonalityMode, getPersonalityWelcomeMessage } from '@/lib/personalities'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  mood?: string
  moodConfidence?: number
  emotionalKeywords?: string[]
  personalityMode?: PersonalityMode
  isLiked?: boolean
  isFavorite?: boolean
}

interface ChatUIState {
  isCollapsed: boolean
  showMoodInsights: boolean
  showQuickActions: boolean
  typingIndicator: boolean
  isScrolledToBottom: boolean
}

const QUICK_ACTIONS = [
  { text: "How can I improve my mood today?", icon: "😊", category: "wellness" },
  { text: "What habits should I focus on?", icon: "🎯", category: "productivity" },
  { text: "Help me reflect on my day", icon: "🤔", category: "reflection" },
  { text: "I'm feeling overwhelmed", icon: "😓", category: "support" },
  { text: "Set a goal for tomorrow", icon: "🚀", category: "planning" },
  { text: "I want to celebrate something", icon: "🎉", category: "celebration" }
]

const MOOD_EMOJIS = {
  positive: '😊', negative: '😔', 'goal-focused': '🎯', reflective: '🤔',
  anxious: '😰', happy: '😄', sad: '😢', energized: '⚡', neutral: '😐'
}

export default function EnhancedChatInterface() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [selectedAIProvider, setSelectedAIProvider] = useState<'openai' | 'claude' | 'fallback' | 'auto'>('auto')
  const [personalityMode, setPersonalityMode] = useState<PersonalityMode>('mentor')
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [suggestedPersonality, setSuggestedPersonality] = useState<PersonalityMode | null>(null)
  const [lastMood, setLastMood] = useState<string | null>(null)
  const [lastMoodConfidence, setLastMoodConfidence] = useState<number | null>(null)
  const [lastEmotionalKeywords, setLastEmotionalKeywords] = useState<string[]>([])
  const [uiState, setUIState] = useState<ChatUIState>({
    isCollapsed: false,
    showMoodInsights: true,
    showQuickActions: false,
    typingIndicator: false,
    isScrolledToBottom: true
  })

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Enhanced auto-scroll with better UX
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }, [])

  // Monitor scroll position
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setUIState(prev => ({ ...prev, isScrolledToBottom: isAtBottom }))
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (uiState.isScrolledToBottom) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom, uiState.isScrolledToBottom])

  // Enhanced message interaction handlers
  const handleMessageAction = async (messageId: string, action: 'like' | 'favorite' | 'copy') => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    try {
      switch (action) {
        case 'like':
          setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, isLiked: !m.isLiked } : m
          ))
          trackUserAction({
            action: 'message_liked',
            target: messageId,
            metadata: { role: message.role, liked: !message.isLiked }
          })
          break
        case 'favorite':
          setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, isFavorite: !m.isFavorite } : m
          ))
          trackUserAction({
            action: 'message_favorited',
            target: messageId,
            metadata: { role: message.role, favorited: !message.isFavorite }
          })
          break
        case 'copy':
          await navigator.clipboard.writeText(message.content)
          trackUserAction({
            action: 'message_copied',
            target: messageId,
            metadata: { role: message.role }
          })
          // Could add a toast notification here
          break
      }
    } catch (error) {
      reportError({
        message: `Failed to ${action} message`,
        severity: 'low',
        context: { messageId, action }
      })
    }
  }

  // Enhanced personality change with better UX
  const handlePersonalityChange = useCallback((newMode: PersonalityMode) => {
    setPersonalityMode(newMode)
    setSuggestedPersonality(null)

    // Smooth transition effect
    setUIState(prev => ({ ...prev, typingIndicator: true }))

    if (messages.length > 1) {
      setTimeout(() => {
        const personalityChangeMessage: Message = {
          id: `personality-change-${Date.now()}`,
          content: `Switching to ${newMode} mode. ${getPersonalityWelcomeMessage(newMode)}`,
          role: 'assistant',
          timestamp: new Date(),
          personalityMode: newMode
        }
        setMessages(prev => [...prev, personalityChangeMessage])
        setUIState(prev => ({ ...prev, typingIndicator: false }))
      }, 1000)
    } else {
      setUIState(prev => ({ ...prev, typingIndicator: false }))
    }

    trackUserAction({
      action: 'personality_changed',
      target: newMode,
      metadata: { previousMode: personalityMode }
    })
  }, [messages.length, personalityMode])

  // Enhanced submit with better loading states
  const handleSubmit = async (e: React.FormEvent, quickAction?: string) => {
    e.preventDefault()
    const messageText = quickAction || input.trim()
    if (!messageText || isLoading || !user || !currentSession) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setUIState(prev => ({ ...prev, showQuickActions: false, typingIndicator: true }))

    // Clear saved draft
    localStorage.removeItem('pg-draft')

    try {
      // Track user message
      trackUserAction({
        action: quickAction ? 'quick_action_sent' : 'message_sent',
        target: 'chat',
        metadata: {
          messageLength: messageText.length,
          isQuickAction: !!quickAction,
          personalityMode
        }
      })

      // Save user message
      await saveMessage(currentSession.id, user.id, messageText, 'user')

      // Get AI response with performance tracking
      const response = await measureAsyncExecutionTime('chat_api_call', async () => {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            messages: [...messages, userMessage].slice(-10),
            personalityMode,
            aiProvider: selectedAIProvider === 'auto' ? undefined : selectedAIProvider
          })
        })

        if (!res.ok) throw new Error('Failed to get AI response')
        return res.json()
      })

      const aiResponse: Message = {
        id: Date.now().toString(),
        content: response.response || response.message,
        role: 'assistant',
        timestamp: new Date(),
        mood: response.mood,
        moodConfidence: response.mood_confidence,
        emotionalKeywords: response.emotional_keywords,
        personalityMode: response.personalityMode
      }

      // Save AI response
      await saveMessage(
        currentSession.id,
        user.id,
        aiResponse.content,
        'assistant',
        {
          mood: response.mood,
          mood_confidence: response.mood_confidence,
          emotional_keywords: response.emotional_keywords,
          personality_mode: response.personalityMode,
          ai_provider: response.provider
        }
      )

      // Update state
      setLastMood(response.mood)
      setLastMoodConfidence(response.mood_confidence)
      setLastEmotionalKeywords(response.emotional_keywords || [])
      setMessages(prev => [...prev, aiResponse])

      // Handle personality suggestions
      if (response.suggestedPersonality && response.suggestedPersonality !== personalityMode) {
        setSuggestedPersonality(response.suggestedPersonality)
      }

    } catch (error) {
      // Enhanced fallback with personality-aware responses
      const fallbackContent = getFallbackResponse(messageText, personalityMode)

      const fallbackResponse: Message = {
        id: Date.now().toString(),
        content: fallbackContent,
        role: 'assistant',
        timestamp: new Date(),
        personalityMode
      }

      setMessages(prev => [...prev, fallbackResponse])
      setLastMood('neutral')

      reportError({
        message: 'Chat API request failed',
        severity: 'medium',
        context: { messageText, personalityMode }
      })
    } finally {
      setIsLoading(false)
      setUIState(prev => ({ ...prev, typingIndicator: false }))
      inputRef.current?.focus()
    }
  }

  // Quick action handler
  const handleQuickAction = (actionText: string) => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent
    handleSubmit(fakeEvent, actionText)
  }

  // Enhanced fallback responses
  const getFallbackResponse = (userInput: string, personality: PersonalityMode): string => {
    const responses = {
      mentor: [
        `I hear you sharing: "${userInput}". Let me take a moment to reflect on what you've offered. Sometimes the most meaningful insights emerge from these pauses. What aspect of this feels most important to explore together?`,
        `Thank you for trusting me with: "${userInput}". Even when my systems are quiet, I'm holding space for your thoughts. What would be most helpful for you right now?`
      ],
      coach: [
        `I caught what you said: "${userInput}" - and I can sense there's energy behind those words! Even when my systems are taking a breather, your momentum doesn't have to stop. What's the one thing about this that you're most excited to take action on?`,
        `Great share: "${userInput}"! While I'm having a technical timeout, you're still moving forward. What's your next power move?`
      ],
      friend: [
        `I heard you say: "${userInput}" and I want you to know I'm really listening. Even when I'm having a quiet moment, I'm still here with you. What's the most important thing you want me to understand about what you just shared?`,
        `Thanks for sharing: "${userInput}". I'm having a tech hiccup, but I'm still here for you. What's on your heart right now?`
      ]
    }

    const options = responses[personality] || responses.friend
    return options[Math.floor(Math.random() * options.length)]
  }

  // Voice input setup (enhanced)
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
          trackUserAction({
            action: 'voice_input_completed',
            target: 'chat',
            metadata: { transcriptLength: finalTranscript.length }
          })
        } else {
          setInput(interimTranscript)
        }
      }

      recognitionInstance.onerror = (event) => {
        reportError({
          message: `Speech recognition error: ${event.error}`,
          severity: 'low',
          context: { error: event.error }
        })
        setIsListening(false)
      }

      recognitionInstance.onend = () => setIsListening(false)
      setRecognition(recognitionInstance)
    }
  }, [])

  // Initialize chat session
  useEffect(() => {
    async function initializeChatSession() {
      if (!user) return

      try {
        setIsLoadingHistory(true)
        const session = await getCurrentChatSession(user)
        if (!session) {
          reportError({
            message: 'Failed to get chat session',
            severity: 'high',
            context: { userId: user.id }
          })
          return
        }

        setCurrentSession(session)
        const history = await loadChatHistory(session.id)
        const uiMessages = history.map(convertDbMessageToUI)

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
        reportError({
          message: 'Error initializing chat session',
          severity: 'high',
          context: { userId: user?.id }
        })
      } finally {
        setIsLoadingHistory(false)
      }
    }

    initializeChatSession()
  }, [user, personalityMode])

  // Enhanced voice input handler
  const handleVoiceInput = () => {
    if (!recognition) {
      // Show user-friendly error
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      trackUserAction({
        action: 'voice_input_stopped',
        target: 'chat'
      })
    } else {
      recognition.start()
      setIsListening(true)
      trackUserAction({
        action: 'voice_input_started',
        target: 'chat'
      })
    }
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        reportError({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack || undefined,
          severity: 'high',
          context: { component: 'EnhancedChatInterface', userId: user?.id }
        })
      }}
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-full flex flex-col">
        {/* Enhanced Header */}
        <div className="border-b border-gray-100 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"
                     title="AI Guide is active"></div>
                <h3 className="font-semibold text-gray-800">Personal Guide Chat</h3>
              </div>
              {lastMood && lastMood !== 'neutral' && (
                <div className="px-3 py-1 bg-white bg-opacity-70 rounded-full border border-gray-200">
                  <span className="text-sm flex items-center space-x-1">
                    <span>{MOOD_EMOJIS[lastMood as keyof typeof MOOD_EMOJIS] || '😐'}</span>
                    <span className="text-gray-600">
                      {lastMoodConfidence && lastMoodConfidence > 0.8 ? 'High confidence' : 'Detected'}
                    </span>
                  </span>
                </div>
              )}
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
              <button
                onClick={() => setUIState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }))}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={uiState.isCollapsed ? 'Expand chat' : 'Minimize chat'}
              >
                {uiState.isCollapsed ?
                  <ChevronUpIcon className="w-4 h-4" /> :
                  <ChevronDownIcon className="w-4 h-4" />
                }
              </button>
            </div>
          </div>

          {/* Enhanced Mood Insights */}
          {lastEmotionalKeywords.length > 0 && uiState.showMoodInsights && !uiState.isCollapsed && (
            <div className="mt-3 p-3 bg-white bg-opacity-60 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Emotional Insights</span>
                <button
                  onClick={() => setUIState(prev => ({ ...prev, showMoodInsights: false }))}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Hide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {lastEmotionalKeywords.slice(0, 6).map((keyword, index) => (
                  <span key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Personality Suggestion */}
        {suggestedPersonality && !uiState.isCollapsed && (
          <div className="border-b border-gray-100 p-4 bg-yellow-50">
            <PersonalitySuggestion
              suggestedPersonality={suggestedPersonality}
              currentPersonality={personalityMode}
              onAccept={() => handlePersonalityChange(suggestedPersonality)}
              onDismiss={() => setSuggestedPersonality(null)}
            />
          </div>
        )}

        {/* Messages Container */}
        {!uiState.isCollapsed && (
          <>
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/30 to-white"
            >
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center">
                    <div className="inline-flex space-x-1 mb-3">
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
                      <div className="group max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm relative ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>

                          {/* Message metadata */}
                          <div className={`flex items-center justify-between mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>

                            <div className="flex items-center space-x-1">
                              {message.role === 'assistant' && message.personalityMode && (
                                <span className="text-xs">
                                  {message.personalityMode === 'mentor' ? '🧙' :
                                   message.personalityMode === 'coach' ? '💪' :
                                   message.personalityMode === 'friend' ? '🤝' : ''}
                                </span>
                              )}
                              {message.role === 'assistant' && message.mood && message.mood !== 'neutral' && (
                                <span className="text-xs">
                                  {MOOD_EMOJIS[message.mood as keyof typeof MOOD_EMOJIS] || '😐'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message actions (show on hover) */}
                          {message.role === 'assistant' && (
                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleMessageAction(message.id, 'like')}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    message.isLiked
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                  }`}
                                  title="Like message"
                                >
                                  {message.isLiked ? <HeartSolid className="w-3 h-3" /> : <HeartIcon className="w-3 h-3" />}
                                </button>
                                <button
                                  onClick={() => handleMessageAction(message.id, 'favorite')}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    message.isFavorite
                                      ? 'bg-yellow-500 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'
                                  }`}
                                  title="Bookmark message"
                                >
                                  <BookOpenIcon className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Enhanced typing indicator */}
                  {(isLoading || uiState.typingIndicator) && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Scroll to bottom button */}
            {!uiState.isScrolledToBottom && (
              <div className="absolute bottom-20 right-4">
                <button
                  onClick={() => scrollToBottom()}
                  className="w-8 h-8 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  title="Scroll to bottom"
                >
                  <ArrowDownCircleIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Actions */}
            {uiState.showQuickActions && !isLoading && (
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Quick Actions</span>
                  <button
                    onClick={() => setUIState(prev => ({ ...prev, showQuickActions: false }))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.text)}
                      className="flex items-center space-x-2 p-2 text-left text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span>{action.icon}</span>
                      <span className="text-gray-700 truncate">{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Input Form */}
            <div className="border-t border-gray-100 p-4 bg-white">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Input row */}
                <div className="flex space-x-2 items-end">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Share what's on your mind..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 pr-20"
                      disabled={isLoading}
                      maxLength={2000}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <span className="text-xs text-gray-400">{input.length}/2000</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`p-3 transition-colors rounded-2xl ${
                        isListening
                          ? 'text-red-500 bg-red-50 animate-pulse'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={isListening ? 'Stop recording' : 'Start voice input'}
                      disabled={isLoading}
                    >
                      {isListening ? (
                        <StopIcon className="h-5 w-5" />
                      ) : (
                        <MicrophoneIcon className="h-5 w-5" />
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Send message"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Secondary actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setUIState(prev => ({ ...prev, showQuickActions: !prev.showQuickActions }))}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <LightBulbIcon className="w-4 h-4" />
                      <span>Quick Actions</span>
                    </button>

                    {!uiState.showMoodInsights && lastEmotionalKeywords.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUIState(prev => ({ ...prev, showMoodInsights: true }))}
                        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <FaceSmileIcon className="w-4 h-4" />
                        <span>Show Insights</span>
                      </button>
                    )}
                  </div>

                  {isListening && (
                    <div className="flex items-center space-x-2 text-xs text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Listening...</span>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}