'use client'

import EnhancedChatInterface from '../chat/EnhancedChatInterface'
import ErrorBoundary from '../ErrorBoundary'
import { reportError } from '@/lib/monitoring'
import { useAuth } from '@/contexts/AuthContext'
import { TabPerformanceWrapper } from '../performance/BundlePerformanceMonitor'

export default function ChatTab() {
  const { user } = useAuth()

  return (
    <TabPerformanceWrapper tabName="Chat">
      <ErrorBoundary
        onError={(error, errorInfo) => {
          reportError({
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack || undefined,
            severity: 'high',
            context: { component: 'ChatTab', userId: user?.id }
          })
        }}
      >
        <div className="h-full bg-gradient-to-br from-blue-50/30 to-purple-50/20 p-3 sm:p-4 lg:p-6">
          <div className="max-w-4xl mx-auto h-full">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI Chat & Guidance</h1>
                  <p className="text-gray-600">Your intelligent companion for reflection and personal growth</p>
                </div>
              </div>

              {/* Enhanced context indicators */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>AI Guide Active</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🎭</span>
                  <span>Adaptive Personality</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🧠</span>
                  <span>Personal Context AI</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>💭</span>
                  <span>Mood-Aware Responses</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🎤</span>
                  <span>Voice Input Ready</span>
                </div>
              </div>
            </div>

            <div className="h-[calc(100%-120px)]">
              <EnhancedChatInterface />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </TabPerformanceWrapper>
  )
}