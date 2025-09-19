import { RealtimeChannel, RealtimeClient, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface RealtimeSubscription {
  id: string
  channel: RealtimeChannel
  table: string
  filter?: string
  onUpdate?: (payload: any) => void
  onInsert?: (payload: any) => void
  onDelete?: (payload: any) => void
}

export interface RealtimeServiceConfig {
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

type SubscriptionCallback = (payload: any) => void

export class RealtimeService {
  private client: SupabaseClient
  private subscriptions: Map<string, RealtimeSubscription> = new Map()
  private connectionStatus: ConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private reconnectTimer?: NodeJS.Timeout
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set()
  private config: Required<RealtimeServiceConfig>

  constructor(client: SupabaseClient, config: RealtimeServiceConfig = {}) {
    this.client = client
    this.config = {
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
    }

    this.setupConnectionMonitoring()
  }

  private setupConnectionMonitoring() {
    // Monitor connection status through the client's channel events
    // Supabase v2 handles connection state internally, we'll track our subscription health
    setInterval(() => {
      this.checkConnectionHealth()
    }, this.config.heartbeatInterval)
  }

  private checkConnectionHealth() {
    // If we have subscriptions but they seem inactive, trigger reconnect logic
    if (this.subscriptions.size > 0 && this.connectionStatus === 'connected') {
      // Connection seems healthy if we have active subscriptions
      return
    }

    if (this.subscriptions.size > 0 && this.connectionStatus !== 'connecting') {
      this.handleConnectionLoss()
    }
  }

  private handleConnectionLoss() {
    this.setConnectionStatus('disconnected')
    this.attemptReconnect()
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setConnectionStatus('error')
      return
    }

    this.setConnectionStatus('connecting')
    this.reconnectAttempts++

    try {
      // Resubscribe to all existing subscriptions
      const subscriptionEntries = Array.from(this.subscriptions.entries())
      this.subscriptions.clear()

      for (const [id, subscription] of subscriptionEntries) {
        await this.subscribe({
          id,
          table: subscription.table,
          filter: subscription.filter,
          onUpdate: subscription.onUpdate,
          onInsert: subscription.onInsert,
          onDelete: subscription.onDelete,
        })
      }

      this.setConnectionStatus('connected')
      this.reconnectAttempts = 0
    } catch (error) {
      console.error('Reconnection failed:', error)

      this.reconnectTimer = setTimeout(() => {
        this.attemptReconnect()
      }, this.config.reconnectInterval * Math.pow(2, Math.min(this.reconnectAttempts, 5))) // Exponential backoff
    }
  }

  private setConnectionStatus(status: ConnectionStatus) {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status
      this.statusListeners.forEach(listener => listener(status))
    }
  }

  async subscribe(options: {
    id: string
    table: string
    filter?: string
    onUpdate?: SubscriptionCallback
    onInsert?: SubscriptionCallback
    onDelete?: SubscriptionCallback
  }): Promise<RealtimeSubscription> {
    const { id, table, filter, onUpdate, onInsert, onDelete } = options

    // Remove existing subscription with same ID
    await this.unsubscribe(id)

    try {
      let channelName = `realtime:${table}`
      if (filter) {
        channelName += `:${filter}`
      }

      const channel = this.client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: filter || undefined,
          },
          (payload) => {
            switch (payload.eventType) {
              case 'INSERT':
                onInsert?.(payload)
                break
              case 'UPDATE':
                onUpdate?.(payload)
                break
              case 'DELETE':
                onDelete?.(payload)
                break
            }
          }
        )

      // Subscribe to the channel
      const subscribeResponse = await new Promise<'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED'>((resolve) => {
        channel.subscribe((status) => {
          resolve(status)
        })
      })

      if (subscribeResponse !== 'SUBSCRIBED') {
        throw new Error(`Failed to subscribe to ${table}: ${subscribeResponse}`)
      }

      const subscription: RealtimeSubscription = {
        id,
        channel,
        table,
        filter,
        onUpdate,
        onInsert,
        onDelete,
      }

      this.subscriptions.set(id, subscription)
      this.setConnectionStatus('connected')

      return subscription
    } catch (error) {
      console.error(`Failed to subscribe to ${table}:`, error)
      this.setConnectionStatus('error')
      throw error
    }
  }

  async unsubscribe(id: string): Promise<void> {
    const subscription = this.subscriptions.get(id)
    if (subscription) {
      try {
        await this.client.removeChannel(subscription.channel)
      } catch (error) {
        console.warn(`Error unsubscribing from ${id}:`, error)
      }
      this.subscriptions.delete(id)
    }

    if (this.subscriptions.size === 0) {
      this.setConnectionStatus('disconnected')
    }
  }

  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.keys()).map(id =>
      this.unsubscribe(id)
    )
    await Promise.all(unsubscribePromises)

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)

    // Return cleanup function
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  isSubscribed(id: string): boolean {
    return this.subscriptions.has(id)
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService(supabase, {
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
})

// Utility functions for common subscription patterns
export const createHabitsSubscription = (
  userId: string,
  callbacks: {
    onInsert?: SubscriptionCallback
    onUpdate?: SubscriptionCallback
    onDelete?: SubscriptionCallback
  }
) => {
  return realtimeService.subscribe({
    id: `habits:${userId}`,
    table: 'habits',
    filter: `user_id=eq.${userId}`,
    ...callbacks,
  })
}

export const createHabitCompletionsSubscription = (
  userId: string,
  callbacks: {
    onInsert?: SubscriptionCallback
    onUpdate?: SubscriptionCallback
    onDelete?: SubscriptionCallback
  }
) => {
  return realtimeService.subscribe({
    id: `habit_completions:${userId}`,
    table: 'habit_completions',
    filter: `user_id=eq.${userId}`,
    ...callbacks,
  })
}

export default realtimeService