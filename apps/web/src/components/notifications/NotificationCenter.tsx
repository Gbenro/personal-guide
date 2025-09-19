'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { BellIcon, XMarkIcon, CheckIcon, CogIcon } from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'
import { animationPresets, animations } from '@/config/animations'
import NotificationSettings from './NotificationSettings'

interface NotificationCenterProps {
  userId: string
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    settings,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSettings,
    requestPermission
  } = useNotifications(userId)

  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Auto-close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isOpen && !target.closest('.notification-center')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const getNotificationColor = (color?: string) => {
    const colors = {
      green: 'border-l-green-500 bg-green-50',
      blue: 'border-l-blue-500 bg-blue-50',
      orange: 'border-l-orange-500 bg-orange-50',
      red: 'border-l-red-500 bg-red-50',
      purple: 'border-l-purple-500 bg-purple-50',
      gold: 'border-l-yellow-500 bg-yellow-50'
    }
    return colors[color as keyof typeof colors] || 'border-l-gray-500 bg-gray-50'
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="notification-center relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full ${animations.buttons.icon} ${animationPresets.iconButton}`}
        title={`${unreadCount} unread notifications`}
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6 text-gray-600" />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden ${animations.effects.fadeIn}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <BellIcon className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1 rounded-md ${animations.transitions.normal.colors} hover:bg-gray-200`}
                  title="Notification Settings"
                >
                  <CogIcon className="h-4 w-4 text-gray-600" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1 rounded-md ${animations.transitions.normal.colors} hover:bg-gray-200`}
                >
                  <XMarkIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={`text-xs px-3 py-1 bg-blue-600 text-white rounded-md ${animationPresets.secondaryButton}`}
                  >
                    Mark all read
                  </button>
                )}

                <button
                  onClick={clearAll}
                  className={`text-xs px-3 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md ${animationPresets.secondaryButton}`}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && settings && (
            <NotificationSettings
              settings={settings}
              onUpdateSettings={updateSettings}
              onRequestPermission={requestPermission}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Complete a habit to see celebrations here!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.color)} ${
                      notification.isRead ? 'opacity-75' : ''
                    } ${animations.transitions.normal.colors} hover:bg-opacity-75`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-lg">
                          {notification.icon || getPriorityIcon(notification.priority)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              notification.isRead ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>

                            {/* Action Button */}
                            {notification.actionText && notification.actionUrl && (
                              <button
                                onClick={() => {
                                  // Handle navigation
                                  window.location.href = notification.actionUrl!
                                  markAsRead(notification.id)
                                }}
                                className="mt-2 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                {notification.actionText}
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-3 w-3 text-gray-500" />
                              </button>
                            )}

                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 rounded hover:bg-white hover:bg-opacity-50 transition-colors"
                              title="Remove"
                            >
                              <XMarkIcon className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}