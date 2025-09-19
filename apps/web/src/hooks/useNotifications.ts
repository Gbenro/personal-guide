'use client'

import { useState, useEffect, useCallback } from 'react'
import { notificationService, HabitNotification, NotificationSettings, initializeNotifications } from '@/lib/notificationService'

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<HabitNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)

  // Initialize notifications when userId is available
  useEffect(() => {
    if (userId) {
      initializeNotifications(userId)
      setSettings(notificationService.getSettings())
      setNotifications(notificationService.getNotifications())
    }
  }, [userId])

  // Subscribe to notification updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications)
    })

    return unsubscribe
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id)
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead()
  }, [])

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    notificationService.removeNotification(id)
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    notificationService.clearAll()
  }, [])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    notificationService.updateSettings(newSettings)
    setSettings(notificationService.getSettings())
  }, [])

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    const permission = await notificationService.requestPermission()
    if (permission === 'granted') {
      updateSettings({ pushNotificationsEnabled: true })
    }
    return permission
  }, [updateSettings])

  // Celebrate habit completion
  const celebrateCompletion = useCallback((habitId: string, habitName: string, streak: number, isNewRecord: boolean) => {
    notificationService.celebrateHabitCompletion(habitId, habitName, streak, isNewRecord)
  }, [])

  // Send streak milestone notification
  const notifyMilestone = useCallback((habitId: string, habitName: string, milestone: number) => {
    notificationService.notifyStreakMilestone(habitId, habitName, milestone)
  }, [])

  // Send streak at risk notification
  const notifyAtRisk = useCallback((habitId: string, habitName: string, currentStreak: number, daysMissed: number) => {
    notificationService.notifyStreakAtRisk(habitId, habitName, currentStreak, daysMissed)
  }, [])

  // Send daily reminder
  const sendReminder = useCallback((pendingHabits: Array<{ id: string; name: string }>) => {
    notificationService.sendDailyReminder(pendingHabits)
  }, [])

  // Send encouragement
  const sendEncouragement = useCallback((habitId: string, habitName: string, type: 'comeback' | 'keep_going' | 'almost_there') => {
    notificationService.sendEncouragement(habitId, habitName, type)
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSettings,
    requestPermission,
    celebrateCompletion,
    notifyMilestone,
    notifyAtRisk,
    sendReminder,
    sendEncouragement
  }
}

// Hook for quick notification actions
export function useQuickNotifications() {
  return {
    celebrate: (habitId: string, habitName: string, streak: number, isNewRecord: boolean) => {
      notificationService.celebrateHabitCompletion(habitId, habitName, streak, isNewRecord)
    },
    milestone: (habitId: string, habitName: string, milestone: number) => {
      notificationService.notifyStreakMilestone(habitId, habitName, milestone)
    },
    atRisk: (habitId: string, habitName: string, currentStreak: number, daysMissed: number) => {
      notificationService.notifyStreakAtRisk(habitId, habitName, currentStreak, daysMissed)
    },
    encourage: (habitId: string, habitName: string, type: 'comeback' | 'keep_going' | 'almost_there') => {
      notificationService.sendEncouragement(habitId, habitName, type)
    }
  }
}