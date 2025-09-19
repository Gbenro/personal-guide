// Notification Service for Personal Guide
// Handles habit completion notifications, reminders, and celebrations

export interface HabitNotification {
  id: string
  habitId: string
  habitName: string
  type: 'completion' | 'reminder' | 'streak_milestone' | 'streak_risk' | 'encouragement'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
  actionText?: string
  icon?: string
  color?: string
  duration?: number // Auto-dismiss time in milliseconds
}

export interface NotificationSettings {
  userId: string
  enableCompletionNotifications: boolean
  enableReminders: boolean
  enableStreakMilestones: boolean
  enableRiskAlerts: boolean
  reminderTime: string // HH:MM format
  reminderDays: number[] // 0-6 (Sunday-Saturday)
  soundEnabled: boolean
  vibrationEnabled: boolean
  pushNotificationsEnabled: boolean
}

class NotificationService {
  private notifications: HabitNotification[] = []
  private subscribers: Array<(notifications: HabitNotification[]) => void> = []
  private settings: NotificationSettings | null = null

  // Subscribe to notification updates
  subscribe(callback: (notifications: HabitNotification[]) => void) {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.notifications))
  }

  // Add a new notification
  addNotification(notification: Omit<HabitNotification, 'id' | 'timestamp' | 'isRead'>) {
    const newNotification: HabitNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false
    }

    this.notifications.unshift(newNotification)

    // Keep only last 50 notifications
    this.notifications = this.notifications.slice(0, 50)

    this.notifySubscribers()

    // Auto-dismiss if duration is set
    if (newNotification.duration) {
      setTimeout(() => {
        this.removeNotification(newNotification.id)
      }, newNotification.duration)
    }

    return newNotification
  }

  // Remove a notification
  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notifySubscribers()
  }

  // Mark notification as read
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.isRead = true
      this.notifySubscribers()
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(n => n.isRead = true)
    this.notifySubscribers()
  }

  // Get all notifications
  getNotifications() {
    return this.notifications
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.isRead).length
  }

  // Clear all notifications
  clearAll() {
    this.notifications = []
    this.notifySubscribers()
  }

  // Habit completion celebration
  celebrateHabitCompletion(habitId: string, habitName: string, streak: number, isNewRecord: boolean) {
    let title = '🎉 Great job!'
    let message = `You completed "${habitName}"`
    let priority: 'low' | 'medium' | 'high' = 'medium'
    let color = 'green'

    // Customize message based on streak
    if (isNewRecord && streak > 1) {
      title = '🏆 New Personal Record!'
      message = `"${habitName}" - ${streak} day streak! Your best yet!`
      priority = 'high'
      color = 'gold'
    } else if (streak >= 100) {
      title = '🌟 Century Club!'
      message = `"${habitName}" - Amazing ${streak} day streak!`
      priority = 'high'
      color = 'purple'
    } else if (streak >= 50) {
      title = '💎 Diamond Streak!'
      message = `"${habitName}" - Incredible ${streak} day streak!`
      priority = 'high'
      color = 'blue'
    } else if (streak >= 30) {
      title = '🔥 On Fire!'
      message = `"${habitName}" - ${streak} day streak!`
      priority = 'high'
      color = 'orange'
    } else if (streak >= 7) {
      title = '⭐ Week Champion!'
      message = `"${habitName}" - ${streak} day streak!`
      priority = 'medium'
      color = 'green'
    } else if (streak >= 3) {
      title = '🚀 Building Momentum!'
      message = `"${habitName}" - ${streak} day streak!`
      priority = 'medium'
      color = 'green'
    }

    this.addNotification({
      habitId,
      habitName,
      type: 'completion',
      title,
      message,
      priority,
      color,
      duration: 5000, // 5 seconds
      icon: '🎉'
    })

    // Play sound if enabled
    if (this.settings?.soundEnabled) {
      this.playNotificationSound('success')
    }

    // Show browser notification if enabled
    if (this.settings?.pushNotificationsEnabled) {
      this.showBrowserNotification(title, message)
    }
  }

  // Streak milestone notification
  notifyStreakMilestone(habitId: string, habitName: string, milestone: number) {
    if (!this.settings?.enableStreakMilestones) return

    const milestoneEmojis = {
      7: '🌟',
      14: '💎',
      21: '🏆',
      30: '🔥',
      50: '⚡',
      75: '🎯',
      100: '👑',
      200: '🦄',
      365: '🎊'
    }

    const emoji = milestoneEmojis[milestone as keyof typeof milestoneEmojis] || '🎉'

    this.addNotification({
      habitId,
      habitName,
      type: 'streak_milestone',
      title: `${emoji} ${milestone} Day Milestone!`,
      message: `You've reached ${milestone} consecutive days for "${habitName}"!`,
      priority: 'high',
      color: 'purple',
      duration: 8000,
      icon: emoji
    })

    if (this.settings?.soundEnabled) {
      this.playNotificationSound('celebration')
    }
  }

  // Streak at risk notification
  notifyStreakAtRisk(habitId: string, habitName: string, currentStreak: number, daysMissed: number) {
    if (!this.settings?.enableRiskAlerts) return

    this.addNotification({
      habitId,
      habitName,
      type: 'streak_risk',
      title: '⚠️ Streak at Risk',
      message: `Your ${currentStreak}-day streak for "${habitName}" is at risk. Complete it today!`,
      priority: 'high',
      color: 'red',
      actionText: 'Complete Now',
      actionUrl: `/habits?focus=${habitId}`,
      icon: '⚠️'
    })
  }

  // Daily reminder notification
  sendDailyReminder(pendingHabits: Array<{ id: string; name: string }>) {
    if (!this.settings?.enableReminders || pendingHabits.length === 0) return

    const habitNames = pendingHabits.slice(0, 3).map(h => h.name).join(', ')
    const remaining = pendingHabits.length - 3

    let message = `You have ${pendingHabits.length} habit${pendingHabits.length > 1 ? 's' : ''} to complete: ${habitNames}`
    if (remaining > 0) {
      message += ` and ${remaining} more`
    }

    this.addNotification({
      habitId: 'daily_reminder',
      habitName: 'Daily Reminder',
      type: 'reminder',
      title: '📅 Daily Habit Reminder',
      message,
      priority: 'medium',
      color: 'blue',
      actionText: 'View Habits',
      actionUrl: '/habits',
      icon: '📅'
    })
  }

  // Encouragement notification
  sendEncouragement(habitId: string, habitName: string, encouragementType: 'comeback' | 'keep_going' | 'almost_there') {
    const encouragements = {
      comeback: {
        title: '💪 Comeback Time!',
        messages: [
          `Ready to get back on track with "${habitName}"?`,
          `Every expert was once a beginner. Restart "${habitName}" today!`,
          `It's not about falling down, it's about getting back up. Let's do "${habitName}"!`
        ]
      },
      keep_going: {
        title: '🚀 Keep the Momentum!',
        messages: [
          `You're doing great with "${habitName}"! Keep it up!`,
          `Consistency is key - you're building something amazing with "${habitName}"!`,
          `Every day counts. You're making progress with "${habitName}"!`
        ]
      },
      almost_there: {
        title: '🎯 Almost There!',
        messages: [
          `You're so close to your next milestone with "${habitName}"!`,
          `Just a few more days to reach your goal with "${habitName}"!`,
          `The finish line is in sight for "${habitName}"!`
        ]
      }
    }

    const type = encouragements[encouragementType]
    const message = type.messages[Math.floor(Math.random() * type.messages.length)]

    this.addNotification({
      habitId,
      habitName,
      type: 'encouragement',
      title: type.title,
      message,
      priority: 'low',
      color: 'blue',
      duration: 6000,
      icon: '💪'
    })
  }

  // Play notification sound
  private playNotificationSound(type: 'success' | 'celebration' | 'reminder') {
    if (typeof window === 'undefined') return

    try {
      // Create audio context for sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      const frequencies = {
        success: [523.25, 659.25, 783.99], // C5, E5, G5
        celebration: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
        reminder: [440, 523.25] // A4, C5
      }

      const notes = frequencies[type]

      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          oscillator.type = 'sine'

          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        }, index * 150)
      })
    } catch (error) {
      console.log('Audio not supported:', error)
    }
  }

  // Show browser notification
  private async showBrowserNotification(title: string, body: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'habit-notification',
        renotify: true
      })
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon-192x192.png'
        })
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission()
    }

    return Notification.permission
  }

  // Update notification settings
  updateSettings(settings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...settings } as NotificationSettings

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('habitNotificationSettings', JSON.stringify(this.settings))
    }
  }

  // Load notification settings
  loadSettings(userId: string) {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('habitNotificationSettings')
    if (stored) {
      this.settings = JSON.parse(stored)
    } else {
      // Default settings
      this.settings = {
        userId,
        enableCompletionNotifications: true,
        enableReminders: true,
        enableStreakMilestones: true,
        enableRiskAlerts: true,
        reminderTime: '09:00',
        reminderDays: [1, 2, 3, 4, 5, 6, 0], // All days
        soundEnabled: true,
        vibrationEnabled: true,
        pushNotificationsEnabled: false
      }
    }
  }

  // Get current settings
  getSettings() {
    return this.settings
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Helper function to initialize notifications for a user
export function initializeNotifications(userId: string) {
  notificationService.loadSettings(userId)
  return notificationService
}