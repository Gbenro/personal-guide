'use client'

import { useState, useRef } from 'react'
import {
  PlusIcon,
  SparklesIcon,
  TagIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { SynchronicityEntry, SynchronicityPattern, SynchronicityStats } from '@/types/spiritual'

interface SynchronicityTrackerProps {
  entries?: SynchronicityEntry[]
  patterns?: SynchronicityPattern[]
  stats?: SynchronicityStats
  onAddEntry?: (entry: Omit<SynchronicityEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  onViewPattern?: (patternId: string) => void
}

const mockStats: SynchronicityStats = {
  totalEntries: 12,
  averageSignificance: 7.3,
  mostCommonTags: ['repeated-numbers', 'meaningful-encounters', 'signs'],
  patternsDiscovered: 3,
  streak: 5
}

const mockEntries: SynchronicityEntry[] = [
  {
    id: '1',
    title: '11:11 During Important Decision',
    description: 'Saw 11:11 on the clock right as I was deciding whether to apply for that new job. Felt like a clear sign to move forward.',
    date: new Date(),
    tags: ['time-synchronicity', 'career', 'decision-making'],
    significance: 8,
    context: 'Home office, morning coffee',
    emotions: ['excited', 'hopeful', 'guided'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Butterfly Messenger',
    description: 'A butterfly landed on my shoulder while reading about transformation. It stayed for several minutes, completely unafraid.',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    tags: ['nature-signs', 'transformation', 'animals'],
    significance: 9,
    context: 'Garden, afternoon reading',
    emotions: ['wonder', 'peaceful', 'connected'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function SynchronicityTracker({
  entries = mockEntries,
  patterns = [],
  stats = mockStats,
  onAddEntry,
  onViewPattern
}: SynchronicityTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const formRef = useRef<HTMLDivElement>(null)

  const significanceColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-purple-100 text-purple-700',
    profound: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800'
  }

  const getSignificanceLevel = (score: number) => {
    if (score <= 3) return 'low'
    if (score <= 6) return 'medium'
    if (score <= 8) return 'high'
    return 'profound'
  }

  const getSignificanceIcon = (score: number) => {
    if (score <= 3) return EyeIcon
    if (score <= 6) return HeartIcon
    if (score <= 8) return StarIcon
    return BoltIcon
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.some(tag => entry.tags.includes(tag))
    return matchesSearch && matchesTags
  })

  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags)))

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <SparklesIcon className="h-7 w-7" />
              Synchronicity Tracker
            </h2>
            <p className="text-purple-100 mt-1">
              Document meaningful coincidences and discover patterns in your spiritual journey
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors"
            title="Add new synchronicity"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <div className="text-sm text-purple-100">Total Entries</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.averageSignificance.toFixed(1)}</div>
            <div className="text-sm text-purple-100">Avg Significance</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.patternsDiscovered}</div>
            <div className="text-sm text-purple-100">Patterns Found</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.streak}</div>
            <div className="text-sm text-purple-100">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search synchronicities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 5).map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-100 text-purple-700 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } border`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Entry Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
            Recent Synchronicities
          </h3>
          <span className="text-sm text-gray-500">
            {filteredEntries.length} of {entries.length} entries
          </span>
        </div>

        <div className="space-y-4">
          {filteredEntries.map((entry, index) => {
            const SignificanceIcon = getSignificanceIcon(entry.significance)
            const significanceLevel = getSignificanceLevel(entry.significance)
            const isSelected = selectedEntry === entry.id

            return (
              <div
                key={entry.id}
                className={`bg-white rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-300 shadow-lg transform scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedEntry(isSelected ? null : entry.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{entry.title}</h4>
                      <p className="text-gray-600 mt-1">{entry.description}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${significanceColors[significanceLevel]}`}>
                      <SignificanceIcon className="h-3 w-3" />
                      {entry.significance}/10
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>{entry.date.toLocaleDateString()}</span>
                      <span>{entry.context}</span>
                    </div>
                    <div className="flex gap-1">
                      {entry.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Emotions felt:</h5>
                        <div className="flex flex-wrap gap-2">
                          {entry.emotions.map(emotion => (
                            <span
                              key={emotion}
                              className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-sm"
                            >
                              {emotion}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">All tags:</h5>
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map(tag => (
                            <span
                              key={tag}
                              className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pattern Discovery Section */}
      {patterns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
            Discovered Patterns
          </h3>
          <div className="space-y-3">
            {patterns.map(pattern => (
              <div
                key={pattern.id}
                className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewPattern?.(pattern.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{pattern.name}</h4>
                    <p className="text-gray-600 text-sm mt-1">{pattern.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-700">{pattern.entries.length}</div>
                    <div className="text-xs text-purple-600">entries</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            ref={formRef}
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Add Synchronicity</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Form would go here - simplified for wireframe */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief description of the synchronicity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Full details of what happened..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Significance (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Handle form submission
                      setShowAddForm(false)
                    }}
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}