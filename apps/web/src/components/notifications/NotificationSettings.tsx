'use client'

import { useState } from 'react'
import { NotificationSettings as SettingsType } from '@/lib/notificationService'
import { animationPresets } from '@/config/animations'

interface NotificationSettingsProps {
  settings: SettingsType
  onUpdateSettings: (settings: Partial<SettingsType>) => void
  onRequestPermission: () => Promise<NotificationPermission>
  onClose: () => void
}

export default function NotificationSettings({
  settings,
  onUpdateSettings,
  onRequestPermission,
  onClose
}: NotificationSettingsProps) {
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const handleToggle = (key: keyof SettingsType) => {
    onUpdateSettings({ [key]: !settings[key] })
  }

  const handleReminderTimeChange = (time: string) => {
    onUpdateSettings({ reminderTime: time })
  }

  const handleReminderDayToggle = (day: number) => {
    const currentDays = settings.reminderDays || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort()

    onUpdateSettings({ reminderDays: newDays })
  }

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true)
    try {
      await onRequestPermission()
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <h4 className="font-medium text-gray-900 mb-4">Notification Settings</h4>

      <div className="space-y-4">
        {/* Completion Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Completion Celebrations
            </label>
            <p className="text-xs text-gray-500">
              Get notified when you complete habits
            </p>
          </div>
          <button
            onClick={() => handleToggle('enableCompletionNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enableCompletionNotifications
                ? 'bg-blue-600'
                : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enableCompletionNotifications
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Streak Milestones */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Streak Milestones
            </label>
            <p className="text-xs text-gray-500">
              Celebrate when you reach streak goals
            </p>
          </div>
          <button
            onClick={() => handleToggle('enableStreakMilestones')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enableStreakMilestones
                ? 'bg-blue-600'
                : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enableStreakMilestones
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Risk Alerts */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Streak Risk Alerts
            </label>
            <p className="text-xs text-gray-500">
              Get warned when streaks are at risk
            </p>
          </div>
          <button
            onClick={() => handleToggle('enableRiskAlerts')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enableRiskAlerts
                ? 'bg-blue-600'
                : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enableRiskAlerts
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Daily Reminders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Daily Reminders
              </label>
              <p className="text-xs text-gray-500">
                Get reminded about pending habits
              </p>
            </div>
            <button
              onClick={() => handleToggle('enableReminders')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableReminders
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableReminders
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.enableReminders && (
            <div className="ml-4 space-y-3">
              {/* Reminder Time */}
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => handleReminderTimeChange(e.target.value)}
                  className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Reminder Days */}
              <div>
                <label className="text-xs text-gray-600 block mb-2">
                  Reminder Days
                </label>
                <div className="flex gap-1">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleReminderDayToggle(index)}
                      className={`w-8 h-8 text-xs rounded-full transition-colors ${
                        (settings.reminderDays || []).includes(index)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Sound Effects
            </label>
            <p className="text-xs text-gray-500">
              Play sounds for notifications
            </p>
          </div>
          <button
            onClick={() => handleToggle('soundEnabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.soundEnabled
                ? 'bg-blue-600'
                : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.soundEnabled
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Browser Notifications */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Browser Notifications
              </label>
              <p className="text-xs text-gray-500">
                Show notifications even when app is closed
              </p>
            </div>
            <button
              onClick={() => handleToggle('pushNotificationsEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.pushNotificationsEnabled
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.pushNotificationsEnabled
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.pushNotificationsEnabled && (
            <button
              onClick={handleRequestPermission}
              disabled={isRequestingPermission}
              className={`mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 ${animationPresets.secondaryButton}`}
            >
              {isRequestingPermission ? 'Requesting...' : 'Grant Permission'}
            </button>
          )}
        </div>
      </div>

      {/* Close Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className={`w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${animationPresets.secondaryButton}`}
        >
          Done
        </button>
      </div>
    </div>
  )
}