'use client'

import { useConnectionHealth, useRealtimeContext } from '@/contexts/RealtimeContext'
import { useState } from 'react'

interface ConnectionStatusProps {
  variant?: 'minimal' | 'detailed' | 'badge'
  showReconnectButton?: boolean
  className?: string
}

export function ConnectionStatus({
  variant = 'minimal',
  showReconnectButton = false,
  className = ''
}: ConnectionStatusProps) {
  const { status, isConnected, isConnecting, hasError, reconnect } = useConnectionHealth()
  const { getActiveSubscriptions } = useRealtimeContext()
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleReconnect = async () => {
    setIsReconnecting(true)
    try {
      await reconnect()
    } catch (error) {
      console.error('Manual reconnection failed:', error)
    } finally {
      setIsReconnecting(false)
    }
  }

  // Get status styling
  const getStatusConfig = () => {
    if (isConnected) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        dotColor: 'bg-green-500',
        text: 'Connected',
        description: 'Real-time sync active'
      }
    }

    if (isConnecting || isReconnecting) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        dotColor: 'bg-yellow-500',
        text: 'Connecting',
        description: 'Establishing connection...'
      }
    }

    if (hasError) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        dotColor: 'bg-red-500',
        text: 'Error',
        description: 'Connection failed'
      }
    }

    // Disconnected
    return {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      dotColor: 'bg-gray-400',
      text: 'Offline',
      description: 'No real-time sync'
    }
  }

  const config = getStatusConfig()
  const activeSubscriptions = getActiveSubscriptions()

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${config.dotColor}`}>
            {(isConnecting || isReconnecting) && (
              <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.dotColor} animate-ping`}></div>
            )}
          </div>
        </div>
        <span className={`text-xs ${config.color}`}>
          {config.text}
        </span>
      </div>
    )
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${config.borderColor} border ${className}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}>
          {(isConnecting || isReconnecting) && (
            <div className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${config.dotColor} animate-ping`}></div>
          )}
        </div>
        {config.text}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`p-3 rounded-lg ${config.bgColor} ${config.borderColor} border ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${config.dotColor}`}>
                {(isConnecting || isReconnecting) && (
                  <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.dotColor} animate-ping`}></div>
                )}
              </div>
            </div>
            <div>
              <div className={`text-sm font-medium ${config.color}`}>
                {config.text}
              </div>
              <div className={`text-xs ${config.color} opacity-75`}>
                {config.description}
              </div>
            </div>
          </div>

          {showReconnectButton && !isConnected && (
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className={`text-xs px-2 py-1 rounded ${config.color} hover:opacity-80 disabled:opacity-50 transition-opacity`}
            >
              {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
          )}
        </div>

        {activeSubscriptions.length > 0 && (
          <div className="mt-2 text-xs opacity-75">
            <div className={config.color}>
              Active: {activeSubscriptions.length} subscription{activeSubscriptions.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

// Compact status for headers/navigation
export function HeaderConnectionStatus() {
  return (
    <ConnectionStatus
      variant="minimal"
      className="hidden sm:flex"
    />
  )
}

// Status badge for dashboards
export function DashboardConnectionStatus() {
  return (
    <ConnectionStatus
      variant="badge"
      className="self-start"
    />
  )
}

// Detailed status for settings/admin pages
export function DetailedConnectionStatus() {
  return (
    <ConnectionStatus
      variant="detailed"
      showReconnectButton={true}
      className="max-w-sm"
    />
  )
}

// Floating connection status indicator
export function FloatingConnectionStatus() {
  const { isConnected, hasError } = useConnectionHealth()

  // Only show when there's an actual error, not just disconnected
  if (isConnected || !hasError) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
      <ConnectionStatus
        variant="detailed"
        showReconnectButton={true}
        className="shadow-lg max-w-xs"
      />
    </div>
  )
}