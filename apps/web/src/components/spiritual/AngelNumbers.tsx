'use client'

import { useState } from 'react'
import {
  PlusIcon,
  SparklesIcon,
  ClockIcon,
  MapPinIcon,
  HeartIcon,
  ChartBarIcon,
  BookOpenIcon,
  StarIcon,
  BoltIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { AngelNumberEntry, AngelNumberMeaning, AngelNumberStats } from '@/types/spiritual'

interface AngelNumbersProps {
  entries?: AngelNumberEntry[]
  stats?: AngelNumberStats
  onAddEntry?: (entry: Omit<AngelNumberEntry, 'id' | 'createdAt'>) => void
  onViewMeaning?: (number: string) => void
}

const mockStats: AngelNumberStats = {
  totalSightings: 47,
  uniqueNumbers: 12,
  mostFrequentNumber: '1111',
  currentStreak: 8,
  averageSignificance: 6.8,
  weeklyFrequency: 4.2
}

const mockEntries: AngelNumberEntry[] = [
  {
    id: '1',
    number: '1111',
    date: new Date(),
    time: '11:11 AM',
    location: 'Coffee shop',
    context: 'Looking at phone while thinking about career change',
    personalSignificance: 9,
    emotions: ['excited', 'guided', 'hopeful'],
    notes: 'Third time seeing this today! Feels like strong confirmation.',
    createdAt: new Date()
  },
  {
    id: '2',
    number: '333',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    time: '3:33 PM',
    location: 'Home',
    context: 'Working on creative project',
    personalSignificance: 7,
    emotions: ['inspired', 'creative', 'supported'],
    createdAt: new Date()
  }
]

const angelNumberMeanings: Record<string, AngelNumberMeaning> = {
  '111': {
    number: '111',
    generalMeaning: 'New beginnings and manifestation',
    spiritualMeaning: 'Your thoughts are rapidly manifesting into reality',
    numerologyMeaning: 'Gateway opening, fresh starts',
    actionGuidance: 'Focus on positive thoughts and intentions',
    affirmations: ['I am ready for new beginnings', 'My thoughts create my reality']
  },
  '222': {
    number: '222',
    generalMeaning: 'Balance, cooperation, and patience',
    spiritualMeaning: 'Trust the process and maintain faith',
    numerologyMeaning: 'Harmony and relationships',
    actionGuidance: 'Stay patient and trust divine timing',
    affirmations: ['I trust in divine timing', 'Balance flows naturally through my life']
  },
  '333': {
    number: '333',
    generalMeaning: 'Creativity and self-expression',
    spiritualMeaning: 'Ascended masters are near, offering guidance',
    numerologyMeaning: 'Communication and artistic expression',
    actionGuidance: 'Express your authentic self creatively',
    affirmations: ['I express my truth with confidence', 'My creativity flows freely']
  },
  '444': {
    number: '444',
    generalMeaning: 'Stability, hard work, and determination',
    spiritualMeaning: 'Angels surround you with love and guidance',
    numerologyMeaning: 'Foundation building and systematic progress',
    actionGuidance: 'Keep building steady foundations',
    affirmations: ['I am supported by divine love', 'My efforts create lasting results']
  },
  '555': {
    number: '555',
    generalMeaning: 'Change and transformation',
    spiritualMeaning: 'Major life changes are coming',
    numerologyMeaning: 'Freedom and adventure',
    actionGuidance: 'Embrace change with excitement',
    affirmations: ['I welcome positive change', 'Change brings new opportunities']
  },
  '1111': {
    number: '1111',
    generalMeaning: 'Spiritual awakening and intuition',
    spiritualMeaning: 'A powerful portal for manifestation',
    numerologyMeaning: 'Master number of enlightenment',
    actionGuidance: 'Make a wish and focus on your highest intentions',
    affirmations: ['I am awakening to my highest potential', 'The universe supports my dreams']
  }
}

export default function AngelNumbers({
  entries = mockEntries,
  stats = mockStats,
  onAddEntry,
  onViewMeaning
}: AngelNumbersProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState('')
  const [showMeaning, setShowMeaning] = useState<string | null>(null)
  const [quickNumber, setQuickNumber] = useState('')

  const commonNumbers = ['111', '222', '333', '444', '555', '666', '777', '888', '999', '1111', '1212', '1234']

  const handleQuickAdd = (number: string) => {
    const now = new Date()
    onAddEntry?.({
      number,
      date: now,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: '',
      context: '',
      personalSignificance: 5,
      emotions: []
    })
    setShowQuickAdd(false)
  }

  const getFrequencyColor = (number: string) => {
    const count = entries.filter(e => e.number === number).length
    if (count >= 5) return 'bg-purple-100 text-purple-700 border-purple-300'
    if (count >= 3) return 'bg-blue-100 text-blue-700 border-blue-300'
    if (count >= 1) return 'bg-green-100 text-green-700 border-green-300'
    return 'bg-gray-100 text-gray-700 border-gray-300'
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Add */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <StarIcon className="h-7 w-7" />
              Angel Numbers
            </h2>
            <p className="text-indigo-100 mt-1">
              Track divine messages through number sequences
            </p>
          </div>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors group"
            title="Quick add angel number"
          >
            <PlusIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.totalSightings}</div>
            <div className="text-sm text-indigo-100">Total Sightings</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.mostFrequentNumber}</div>
            <div className="text-sm text-indigo-100">Most Frequent</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-sm text-indigo-100">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Quick Add Panel */}
      {showQuickAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Quick Add Angel Number</h3>
            <button
              onClick={() => setShowQuickAdd(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
            {commonNumbers.map(number => (
              <button
                key={number}
                onClick={() => handleQuickAdd(number)}
                className={`p-3 rounded-lg border-2 font-bold transition-all hover:scale-105 ${getFrequencyColor(number)}`}
              >
                {number}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Custom number..."
              value={quickNumber}
              onChange={(e) => setQuickNumber(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (quickNumber) {
                  handleQuickAdd(quickNumber)
                  setQuickNumber('')
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Number Meanings Library */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpenIcon className="h-6 w-6 text-purple-600" />
          Angel Number Meanings
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {Object.keys(angelNumberMeanings).map(number => {
            const sightingCount = entries.filter(e => e.number === number).length
            return (
              <button
                key={number}
                onClick={() => setShowMeaning(showMeaning === number ? null : number)}
                className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  showMeaning === number
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-bold text-lg">{number}</div>
                {sightingCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {sightingCount}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {showMeaning && angelNumberMeanings[showMeaning] && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="mb-3">
              <h4 className="text-lg font-bold text-purple-900 mb-1">
                {angelNumberMeanings[showMeaning].number}
              </h4>
              <p className="text-purple-700 font-medium">
                {angelNumberMeanings[showMeaning].generalMeaning}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Spiritual Meaning: </span>
                <span className="text-gray-600">{angelNumberMeanings[showMeaning].spiritualMeaning}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Action Guidance: </span>
                <span className="text-gray-600">{angelNumberMeanings[showMeaning].actionGuidance}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Affirmations: </span>
                <div className="mt-1 space-y-1">
                  {angelNumberMeanings[showMeaning].affirmations.map((affirmation, index) => (
                    <div key={index} className="text-gray-600 italic">
                      "• {affirmation}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Sightings */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <ClockIcon className="h-6 w-6 text-purple-600" />
          Recent Sightings
        </h3>

        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-lg">
                      {entry.number}
                    </span>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {entry.date.toLocaleDateString()} at {entry.time}
                      </div>
                      {entry.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPinIcon className="h-4 w-4" />
                          {entry.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {entry.context && (
                    <p className="text-gray-700 mb-2">{entry.context}</p>
                  )}

                  {entry.emotions.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <HeartIcon className="h-4 w-4 text-pink-500" />
                      {entry.emotions.map(emotion => (
                        <span
                          key={emotion}
                          className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}

                  {entry.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 italic">
                      {entry.notes}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="text-lg font-bold text-purple-700">
                    {entry.personalSignificance}/10
                  </div>
                  <div className="flex">
                    {[...Array(Math.floor(entry.personalSignificance / 2))].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequency Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-purple-600" />
          Number Frequency
        </h3>

        {/* Simple frequency visualization */}
        <div className="space-y-3">
          {Object.entries(
            entries.reduce((acc, entry) => {
              acc[entry.number] = (acc[entry.number] || 0) + 1
              return acc
            }, {} as Record<string, number>)
          )
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6)
            .map(([number, count]) => (
              <div key={number} className="flex items-center gap-3">
                <div className="w-16 text-lg font-bold text-purple-700">
                  {number}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(count / Math.max(...Object.values(entries.reduce((acc, entry) => {
                      acc[entry.number] = (acc[entry.number] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)))) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-sm text-gray-600">
                  {count}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}