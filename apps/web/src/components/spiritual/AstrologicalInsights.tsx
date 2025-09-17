'use client'

import { useState } from 'react'
import {
  SunIcon,
  MoonIcon,
  StarIcon,
  SparklesIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  HeartIcon,
  LightBulbIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { DailyAstroInsight, LunarPhase, AstroTransit, PersonalChart } from '@/types/spiritual'

interface AstrologicalInsightsProps {
  dailyInsight?: DailyAstroInsight
  personalChart?: PersonalChart
  onUpdateChart?: (chart: Partial<PersonalChart>) => void
}

const mockLunarPhase: LunarPhase = {
  phase: 'waxing-gibbous',
  date: new Date(),
  name: 'Waxing Gibbous',
  significance: 'Time for refinement and persistence',
  intentions: ['Refining goals', 'Building momentum', 'Staying committed'],
  releaseAreas: ['Doubt', 'Perfectionism', 'Impatience']
}

const mockTransits: AstroTransit[] = [
  {
    id: '1',
    planet: 'Venus',
    aspect: 'conjunction',
    targetPlanet: 'Jupiter',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    intensity: 'high',
    theme: 'Love and Abundance',
    description: 'Venus conjunct Jupiter brings opportunities for love, creativity, and financial growth',
    guidance: 'Focus on relationships and creative pursuits. Be open to abundance in all forms.'
  },
  {
    id: '2',
    planet: 'Mercury',
    aspect: 'square',
    targetPlanet: 'Mars',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    intensity: 'medium',
    theme: 'Communication Challenges',
    description: 'Mercury square Mars may bring hasty words and misunderstandings',
    guidance: 'Think before speaking. Channel mental energy into productive activities.'
  }
]

const mockDailyInsight: DailyAstroInsight = {
  date: new Date(),
  overview: 'A day of emotional depth and creative inspiration awaits. The Moon\'s gentle energy supports introspection and artistic pursuits.',
  mainTheme: 'Creative Expression & Inner Wisdom',
  opportunities: [
    'Deep conversations with loved ones',
    'Artistic and creative breakthroughs',
    'Spiritual insights and meditation',
    'Financial planning and investment decisions'
  ],
  challenges: [
    'Overthinking situations',
    'Emotional sensitivity',
    'Tendency to be overly critical'
  ],
  luckElement: 'Water - trust your intuition',
  colorOfDay: 'Deep Blue',
  crystalRecommendation: 'Lapis Lazuli for wisdom and truth',
  mantra: 'I trust my inner wisdom and express my truth with love',
  lunarPhase: mockLunarPhase,
  activeTransits: mockTransits
}

const lunarPhaseEmojis = {
  'new': '🌑',
  'waxing-crescent': '🌒',
  'first-quarter': '🌓',
  'waxing-gibbous': '🌔',
  'full': '🌕',
  'waning-gibbous': '🌖',
  'last-quarter': '🌗',
  'waning-crescent': '🌘'
}

const intensityColors = {
  low: 'bg-green-100 text-green-700 border-green-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-red-100 text-red-700 border-red-300'
}

export default function AstrologicalInsights({
  dailyInsight = mockDailyInsight,
  personalChart,
  onUpdateChart
}: AstrologicalInsightsProps) {
  const [selectedView, setSelectedView] = useState<'daily' | 'lunar' | 'transits' | 'chart'>('daily')
  const [showChartSetup, setShowChartSetup] = useState(!personalChart)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Cosmic Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Cosmic background effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-8 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-6 left-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse delay-500"></div>
          <div className="absolute bottom-4 right-1/4 w-1 h-1 bg-pink-300 rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <SparklesIcon className="h-7 w-7" />
                Cosmic Weather
              </h2>
              <p className="text-indigo-200 mt-1">
                {formatDate(dailyInsight.date)}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-1">
                {lunarPhaseEmojis[dailyInsight.lunarPhase.phase]}
              </div>
              <div className="text-sm text-indigo-200">
                {dailyInsight.lunarPhase.name}
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold mb-2">{dailyInsight.mainTheme}</h3>
            <p className="text-indigo-100 leading-relaxed">{dailyInsight.overview}</p>
          </div>

          {/* Quick elements */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{dailyInsight.colorOfDay}</div>
              <div className="text-xs text-indigo-200">Color of Day</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{dailyInsight.luckElement}</div>
              <div className="text-xs text-indigo-200">Lucky Element</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center col-span-2 md:col-span-1">
              <div className="text-sm font-bold leading-tight">{dailyInsight.crystalRecommendation}</div>
              <div className="text-xs text-indigo-200">Crystal Guide</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'daily', label: 'Daily', icon: SunIcon },
            { id: 'lunar', label: 'Lunar', icon: MoonIcon },
            { id: 'transits', label: 'Transits', icon: StarIcon },
            { id: 'chart', label: 'Chart', icon: GlobeAltIcon }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                  selectedView === tab.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Daily Insights */}
      {selectedView === 'daily' && (
        <div className="space-y-6">
          {/* Mantra of the Day */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center justify-center gap-2">
                <HeartIcon className="h-5 w-5" />
                Today's Mantra
              </h3>
              <p className="text-purple-700 text-lg italic font-medium leading-relaxed">
                "{dailyInsight.mantra}"
              </p>
            </div>
          </div>

          {/* Opportunities & Challenges */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5 text-green-600" />
                Opportunities
              </h3>
              <ul className="space-y-3">
                {dailyInsight.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-orange-600" />
                Gentle Reminders
              </h3>
              <ul className="space-y-3">
                {dailyInsight.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Lunar Phase Details */}
      {selectedView === 'lunar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">
                {lunarPhaseEmojis[dailyInsight.lunarPhase.phase]}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{dailyInsight.lunarPhase.name}</h3>
              <p className="text-gray-600 mt-2">{dailyInsight.lunarPhase.significance}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <StarIcon className="h-5 w-5 text-purple-600" />
                  Focus Intentions On
                </h4>
                <ul className="space-y-2">
                  {dailyInsight.lunarPhase.intentions.map((intention, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700">{intention}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MoonIcon className="h-5 w-5 text-blue-600" />
                  Release & Let Go Of
                </h4>
                <ul className="space-y-2">
                  {dailyInsight.lunarPhase.releaseAreas.map((area, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Lunar Calendar Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Lunar Events</h3>
            <div className="text-sm text-gray-600">
              <p>• Full Moon in Gemini - {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              <p>• New Moon in Cancer - {new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Transits */}
      {selectedView === 'transits' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
            Active Planetary Transits
          </h3>

          {dailyInsight.activeTransits.map((transit) => (
            <div key={transit.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {transit.planet} {transit.aspect} {transit.targetPlanet}
                  </h4>
                  <p className="text-purple-700 font-medium">{transit.theme}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${intensityColors[transit.intensity]}`}>
                  {transit.intensity} intensity
                </span>
              </div>

              <p className="text-gray-600 mb-3">{transit.description}</p>

              <div className="bg-purple-50 rounded-lg p-3 mb-3">
                <h5 className="font-medium text-purple-900 mb-1">Guidance:</h5>
                <p className="text-purple-700 text-sm">{transit.guidance}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {transit.startDate.toLocaleDateString()} - {transit.endDate.toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {Math.ceil((transit.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Personal Chart */}
      {selectedView === 'chart' && (
        <div className="space-y-6">
          {showChartSetup ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Setup Your Birth Chart</h3>
              <p className="text-gray-600 mb-6">
                Enter your birth details to receive personalized astrological insights.
              </p>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birth Time (optional)</label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Location</label>
                  <input
                    type="text"
                    placeholder="City, Country"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowChartSetup(false)}
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Create Chart
                  </button>
                  <button
                    onClick={() => setShowChartSetup(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Birth Chart</h3>
              <div className="text-center py-8">
                <GlobeAltIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Birth chart visualization would appear here
                </p>
                <button
                  onClick={() => setShowChartSetup(true)}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                >
                  Update Chart Details
                </button>
              </div>
            </div>
          )}

          {/* Quick Astro Facts */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Astro Wisdom</h3>
            <div className="space-y-3 text-sm">
              <p className="text-indigo-700">
                <span className="font-medium">Did you know?</span> The Moon affects not just ocean tides, but also our emotions and intuition. Pay attention to how you feel during different lunar phases.
              </p>
              <p className="text-purple-700">
                <span className="font-medium">Mercury Retrograde:</span> Rather than fear it, use this time for reflection, reviewing, and reconnecting with past projects or relationships.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}