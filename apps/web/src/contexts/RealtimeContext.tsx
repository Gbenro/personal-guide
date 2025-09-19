'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { ConnectionStatus, realtimeService } from '@/lib/realtimeService'

interface RealtimeContextValue {
  connectionStatus: ConnectionStatus
  isConnected: boolean
  isConnecting: boolean
  hasError: boolean
  reconnect: () => Promise<void>
  getActiveSubscriptions: () => string[]
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined)

interface RealtimeProviderProps {
  children: ReactNode
  userId?: string
}

export function RealtimeProvider({ children, userId }: RealtimeProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    () => realtimeService.getConnectionStatus()
  )

  // Derived state for easier consumption
  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'
  const hasError = connectionStatus === 'error'

  // Manual reconnect function
  const reconnect = useCallback(async () => {
    if (!userId) return

    try {
      // Clear existing subscriptions and reconnect
      await realtimeService.unsubscribeAll()

      // The reconnection will be handled by the real-time sync hook
      // when it detects the user and sets up subscriptions again
    } catch (error) {
      console.error('Manual reconnect failed:', error)
    }
  }, [userId])

  // Get active subscriptions
  const getActiveSubscriptions = useCallback(() => {
    return realtimeService.getActiveSubscriptions()
  }, [])

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = realtimeService.onStatusChange((status) => {
      setConnectionStatus(status)
    })

    return unsubscribe
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't cleanup subscriptions on unmount as they should persist
      // across component re-renders. Only cleanup when user logs out.
    }
  }, [])

  // Cleanup when user changes (e.g., logout)
  useEffect(() => {
    if (!userId) {
      // User logged out, cleanup all subscriptions
      realtimeService.unsubscribeAll()
    }
  }, [userId])

  const value: RealtimeContextValue = {
    connectionStatus,
    isConnected,
    isConnecting,
    hasError,
    reconnect,
    getActiveSubscriptions,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeContext(): RealtimeContextValue {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider')
  }
  return context
}

// Custom hooks for specific connection states
export function useConnectionStatus(): ConnectionStatus {
  const { connectionStatus } = useRealtimeContext()
  return connectionStatus
}

export function useIsConnected(): boolean {
  const { isConnected } = useRealtimeContext()
  return isConnected
}

export function useConnectionHealth() {
  const { connectionStatus, isConnected, isConnecting, hasError, reconnect } = useRealtimeContext()

  return {
    status: connectionStatus,
    isConnected,
    isConnecting,
    hasError,
    reconnect,
    isHealthy: isConnected,
  }
}