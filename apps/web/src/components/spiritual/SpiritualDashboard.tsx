'use client'

import { useState } from 'react'
import {
  SparklesIcon,
  StarIcon,
  SunIcon,
  HeartIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { SpiritualInsight, SpiritualModule } from '@/types/spiritual'
import SynchronicityTracker from './SynchronicityTracker'
import AngelNumbers from './AngelNumbers'
import AstrologicalInsights from './AstrologicalInsights'

interface SpiritualDashboardProps {
  insights?: SpiritualInsight[]
  activeModules?: SpiritualModule[]
  todaysGuidance?: string
}

const mockInsights: SpiritualInsight[] = [
  {
    id: '1',
    type: 'synchronicity',
    title: 'Repeated Number Pattern',
    description: 'You\'ve been seeing 11:11 frequently - the universe is highlighting new beginnings',
    guidance: 'Trust your intuition and stay open to opportunities presenting themselves',
    relevance: 9,
    generatedAt: new Date(),
    relatedEntries: ['sync-1', 'angel-1']
  },
  {
    id: '2',
    type: 'astro',
    title: 'Venus Transit Influence',
    description: 'Venus conjunct Jupiter is amplifying your creative and romantic energy',
    guidance: 'This is an excellent time for artistic pursuits and deepening relationships',
    relevance: 8,
    generatedAt: new Date(),
    relatedEntries: ['astro-1']
  },
  {
    id: '3',
    type: 'angel-number',
    title: 'Angel Number 333 Guidance',
    description: 'The frequency of 333 suggests ascended masters are supporting your creative journey',
    guidance: 'Express your authentic self without fear. Your creative gifts are needed in the world',
    relevance: 7,
    generatedAt: new Date(),
    relatedEntries: ['angel-2']
  }
]

const mockModules: SpiritualModule[] = [
  {
    id: 'synchronicity',
    name: 'Synchronicity Tracker',
    description: 'Document meaningful coincidences and patterns',
    icon: '✨',
    color: 'purple',
    isActive: true,
    settings: {}
  },
  {
    id: 'angel-numbers',
    name: 'Angel Numbers',
    description: 'Track divine numeric messages',
    icon: '🔢',
    color: 'indigo',
    isActive: true,
    settings: {}
  },
  {
    id: 'astrology',
    name: 'Astrological Insights',
    description: 'Cosmic weather and personal transits',
    icon: '🌟',
    color: 'pink',
    isActive: true,
    settings: {}
  }
]

export default function SpiritualDashboard({
  insights = mockInsights,
  activeModules = mockModules,
  todaysGuidance = "Trust the synchronicities appearing in your life today. The universe is conspiring to guide you toward your highest path. Pay attention to repeated numbers, meaningful encounters, and your intuitive feelings."
}: SpiritualDashboardProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [showInsightDetail, setShowInsightDetail] = useState<string | null>(null)

  const getModuleColor = (color: string) => {
    const colors = {
      purple: 'from-purple-500 to-pink-500',
      indigo: 'from-indigo-500 to-purple-500',
      pink: 'from-pink-500 to-rose-500',
      blue: 'from-blue-500 to-indigo-500'
    }
    return colors[color as keyof typeof colors] || colors.purple
  }

  const getInsightTypeIcon = (type: SpiritualInsight['type']) => {
    switch (type) {
      case 'synchronicity':
        return SparklesIcon
      case 'angel-number':
        return StarIcon
      case 'astro':
        return SunIcon
      default:
        return HeartIcon
    }
  }

  const renderModuleContent = () => {
    switch (selectedModule) {
      case 'synchronicity':
        return <SynchronicityTracker />
      case 'angel-numbers':
        return <AngelNumbers />
      case 'astrology':
        return <AstrologicalInsights />
      default:
        return null
    }
  }

  if (selectedModule) {
    return (
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedModule(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Spiritual Dashboard
          </button>
        </div>

        {/* Module Content */}
        {renderModuleContent()}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Spiritual Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Mystical background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 border border-white/30 rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 border border-white/20 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-white/10 rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <SparklesIcon className="h-8 w-8" />
              Spiritual Journey
              <StarIcon className="h-8 w-8" />
            </h1>
            <p className="text-indigo-100 text-lg">
              Connect with the sacred patterns and divine guidance in your life
            </p>
          </div>

          {/* Today's Guidance */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <HeartIcon className="h-5 w-5" />
              Today's Spiritual Guidance
            </h3>
            <p className="text-white/90 leading-relaxed italic">
              "{todaysGuidance}"
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{insights.length}</div>
              <div className="text-sm text-indigo-200">Active Insights</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{activeModules.filter(m => m.isActive).length}</div>
              <div className="text-sm text-indigo-200">Active Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">7</div>
              <div className="text-sm text-indigo-200">Day Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Spiritual Modules Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {activeModules.map((module) => (
          <div
            key={module.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => setSelectedModule(module.id)}
          >
            <div className={`h-2 bg-gradient-to-r ${getModuleColor(module.color)}`}></div>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{module.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                  {module.name}
                </h3>
                <p className="text-gray-600 text-sm mt-1">{module.description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center justify-center gap-1 mx-auto">
                  <EyeIcon className="h-4 w-4" />
                  Open Module
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Spiritual Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-purple-600" />
          Recent Spiritual Insights
        </h3>

        <div className="space-y-4">
          {insights.map((insight) => {
            const IconComponent = getInsightTypeIcon(insight.type)
            const isExpanded = showInsightDetail === insight.id

            return (
              <div
                key={insight.id}
                className={`border rounded-lg transition-all cursor-pointer ${
                  isExpanded
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setShowInsightDetail(isExpanded ? null : insight.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="h-5 w-5 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          {insight.type.replace('-', ' ')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-gray-600 text-sm">{insight.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-700">{insight.relevance}/10</div>
                        <div className="text-xs text-gray-500">relevance</div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <div className="bg-white rounded-lg p-3">
                        <h5 className="font-medium text-purple-900 mb-2">Spiritual Guidance:</h5>
                        <p className="text-purple-700 italic leading-relaxed">
                          {insight.guidance}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sacred Practices Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Sacred Daily Practices</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🧘</div>
            <h4 className="font-semibold text-gray-900 mb-1">Morning Meditation</h4>
            <p className="text-gray-600 text-sm">Connect with your inner wisdom</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📝</div>
            <h4 className="font-semibold text-gray-900 mb-1">Gratitude Journal</h4>
            <p className="text-gray-600 text-sm">Document daily blessings</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🌙</div>
            <h4 className="font-semibold text-gray-900 mb-1">Evening Reflection</h4>
            <p className="text-gray-600 text-sm">Review spiritual experiences</p>
          </div>
        </div>
      </div>
    </div>
  )
}