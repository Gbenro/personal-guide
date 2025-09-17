'use client'

import { useState } from 'react'
import {
  PlusIcon,
  ChatBubbleLeftIcon,
  BookOpenIcon,
  FlagIcon,
  HeartIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

interface QuickActionsProps {
  onAddHabit: () => void
  onOpenChat: () => void
  onOpenJournal: () => void
  onViewGoals: () => void
  onViewBeliefs: () => void
}

export default function QuickActions({
  onAddHabit,
  onOpenChat,
  onOpenJournal,
  onViewGoals,
  onViewBeliefs
}: QuickActionsProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const actions = [
    {
      id: 'add-habit',
      label: 'Add Habit',
      description: 'Create a new habit to track',
      icon: PlusIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-300',
      onClick: onAddHabit,
      shortcut: 'A'
    },
    {
      id: 'chat',
      label: 'AI Chat',
      description: 'Get personalized guidance',
      icon: ChatBubbleLeftIcon,
      color: 'bg-green-500 hover:bg-green-600',
      borderColor: 'border-green-300',
      onClick: onOpenChat,
      shortcut: 'C'
    },
    {
      id: 'journal',
      label: 'Journal',
      description: 'Reflect on your progress',
      icon: BookOpenIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      borderColor: 'border-purple-300',
      onClick: onOpenJournal,
      shortcut: 'J'
    },
    {
      id: 'goals',
      label: 'Goals',
      description: 'Set and track objectives',
      icon: FlagIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      borderColor: 'border-orange-300',
      onClick: onViewGoals,
      shortcut: 'G'
    },
    {
      id: 'beliefs',
      label: 'Beliefs',
      description: 'Shape your mindset',
      icon: HeartIcon,
      color: 'bg-pink-500 hover:bg-pink-600',
      borderColor: 'border-pink-300',
      onClick: onViewBeliefs,
      shortcut: 'B'
    }
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4 lg:mb-6">
        <LightBulbIcon className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {actions.map((action) => {
          const isHovered = hoveredAction === action.id

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className={`${action.color} text-white p-3 lg:p-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md border-2 border-transparent hover:${action.borderColor} relative overflow-hidden group min-h-[80px] lg:min-h-[100px]`}
              title={`${action.description} (Shortcut: ${action.shortcut})`}
            >
              {/* Background animation */}
              <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <action.icon className={`h-5 w-5 lg:h-6 lg:w-6 mb-1 lg:mb-2 transition-transform duration-200 ${
                  isHovered ? 'scale-110' : ''
                }`} />
                <div className="text-xs lg:text-sm font-medium text-center leading-tight">
                  {action.label}
                </div>

                {/* Keyboard shortcut indicator */}
                <div className="absolute top-1 right-1 bg-black/20 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {action.shortcut}
                </div>
              </div>

              {/* Ripple effect on click */}
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-active:opacity-100 transition-opacity duration-100"></div>
            </button>
          )
        })}
      </div>

      {/* Enhanced tips section */}
      <div className="mt-4 lg:mt-6 space-y-3">
        {/* Keyboard shortcuts tip */}
        <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">💡 Pro Tips</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Keyboard shortcuts:</span> Press 'A' to add habit, 'C' for chat, 'J' for journal
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Quick start:</span> Begin with 1-2 habits and build consistency before adding more
            </p>
          </div>
        </div>

        {/* Contextual tip based on time of day */}
        <div className="p-2 bg-blue-50 rounded-md text-center">
          <p className="text-xs text-blue-700">
            {(() => {
              const hour = new Date().getHours()
              if (hour < 12) {
                return "🌅 Good morning! Start your day by checking in with your habits."
              } else if (hour < 17) {
                return "☀️ Afternoon check-in: How are your habits progressing today?"
              } else {
                return "🌙 Evening reflection: Review your progress and plan for tomorrow."
              }
            })()}
          </p>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        .group:active::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 100%;
          transform: scale(1);
          animation: ripple 0.6s linear;
        }

        @media (max-width: 640px) {
          .hover\\:scale-105:hover {
            transform: scale(1.02);
          }

          .group-hover\\:opacity-100 {
            opacity: 0;
          }
        }

        /* Ensure proper touch targets on mobile */
        @media (max-width: 640px) {
          button {
            min-height: 60px;
          }
        }
      `}</style>
    </div>
  )
}