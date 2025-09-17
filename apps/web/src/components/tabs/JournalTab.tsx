'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import { reportError, trackUserAction, measureAsyncExecutionTime } from '@/lib/monitoring'
import {
  usePersonalGuideStore,
  useJournalEntries,
  useFilteredJournalEntries,
  useJournalModal
} from '@/stores/personalGuideStore'
import { getUserJournalEntries, getUserJournalTags } from '@/lib/journalService'
import { JournalModal, JournalInsights } from '@/components/journal'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  HeartIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface JournalEntryCardProps {
  entry: any
  onEdit: (entry: any) => void
  onToggleFavorite: (id: string) => void
}

function JournalEntryCard({ entry, onEdit, onToggleFavorite }: JournalEntryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getMoodEmoji = (rating?: number) => {
    if (!rating) return null
    if (rating >= 9) return '🤩'
    if (rating >= 7) return '😄'
    if (rating >= 5) return '😊'
    if (rating >= 3) return '😐'
    return '😔'
  }

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-500">{formatDate(entry.created_at)}</span>
              <span className="text-sm text-gray-400">{formatTime(entry.created_at)}</span>
              {entry.mood_rating && (
                <div className="flex items-center space-x-1">
                  <span>{getMoodEmoji(entry.mood_rating)}</span>
                  <span className="text-sm text-gray-600">{entry.mood_rating}/10</span>
                </div>
              )}
            </div>
            {entry.title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {entry.title}
              </h3>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleFavorite(entry.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {entry.is_favorite ? (
                <HeartSolidIcon className="w-4 h-4 text-red-500" />
              ) : (
                <HeartIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
              )}
            </button>
            <button
              onClick={() => onEdit(entry)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Edit entry"
            >
              <PencilIcon className="w-4 h-4 text-gray-400 hover:text-blue-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {truncateContent(entry.content)}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {entry.word_count && (
              <span>{entry.word_count} words</span>
            )}
            {entry.created_at !== entry.updated_at && (
              <span>Edited {formatDate(entry.updated_at)}</span>
            )}
          </div>
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{entry.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JournalTab() {
  const { user } = useAuth()
  const journalEntries = useFilteredJournalEntries()
  const { open: openJournalModal } = useJournalModal()

  // Use individual selectors to avoid object creation
  const setJournalEntries = usePersonalGuideStore(state => state.setJournalEntries)
  const toggleJournalFavorite = usePersonalGuideStore(state => state.toggleJournalFavorite)
  const setJournalFilters = usePersonalGuideStore(state => state.setJournalFilters)
  const journalFilters = usePersonalGuideStore(state => state.journalFilters)
  const setJournalLoading = usePersonalGuideStore(state => state.setJournalLoading)
  const isLoadingJournal = usePersonalGuideStore(state => state.isLoadingJournal)

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])

  const loadJournalData = useCallback(async () => {
    if (!user) return

    setJournalLoading(true)
    try {
      const [entries, tags] = await Promise.all([
        getUserJournalEntries(user.id, { limit: 50 }),
        getUserJournalTags(user.id)
      ])

      setJournalEntries(entries)
      setAvailableTags(tags)
    } catch (error) {
      console.error('Error loading journal data:', error)
    } finally {
      setJournalLoading(false)
    }
  }, [user, setJournalEntries, setJournalLoading])

  useEffect(() => {
    loadJournalData()
  }, [loadJournalData])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setJournalFilters({ searchQuery: query })
  }

  const handleToggleFavorite = async (entryId: string) => {
    if (!user) return
    toggleJournalFavorite(entryId)
    // The optimistic update is handled by the store
  }

  const handleEditEntry = (entry: any) => {
    openJournalModal(entry)
  }

  const handleNewEntry = () => {
    openJournalModal()
  }

  const handleFilterChange = (filterType: string, value: any) => {
    setJournalFilters({ [filterType]: value })
  }

  if (isLoadingJournal) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gradient-to-r from-purple-200 to-blue-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        reportError({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack || undefined,
          severity: 'high',
          context: { component: 'JournalTab', userId: user?.id }
        })
      }}
    >
      <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-50/30 to-blue-50/20 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpenIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
                <p className="text-gray-600">Capture your thoughts and track your growth</p>
              </div>
            </div>
            <button
              onClick={handleNewEntry}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search your journal entries..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
              <select
                value={journalFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Last Modified</option>
                <option value="mood_rating">Mood Rating</option>
                <option value="word_count">Word Count</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Show Favorites Only
                  </label>
                  <button
                    onClick={() => handleFilterChange('showFavoritesOnly', !journalFilters.showFavoritesOnly)}
                    className={`w-full p-2 rounded-lg transition-colors ${
                      journalFilters.showFavoritesOnly
                        ? 'bg-red-100 text-red-600 border border-red-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {journalFilters.showFavoritesOnly ? 'Showing Favorites' : 'Show All Entries'}
                  </button>
                </div>
                {availableTags.length > 0 && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            const currentTags = journalFilters.tags || []
                            const newTags = currentTags.includes(tag)
                              ? currentTags.filter(t => t !== tag)
                              : [...currentTags, tag]
                            handleFilterChange('tags', newTags)
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            journalFilters.tags?.includes(tag)
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Journal Insights */}
        <div className="lg:hidden">
          <JournalInsights onOpenJournal={handleNewEntry} showActions={false} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Entries */}
          <div className="lg:col-span-3">
            {journalEntries.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {journalEntries.map((entry) => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEditEntry}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No entries found' : 'Start your journal journey'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                    : 'Begin documenting your thoughts, experiences, and personal growth. Every great journey starts with a single step.'
                  }
                </p>
                <button
                  onClick={handleNewEntry}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {searchQuery ? 'Create New Entry' : 'Write Your First Entry'}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            <JournalInsights onOpenJournal={handleNewEntry} showActions={true} />
          </div>
        </div>

        {/* Journal Modal */}
        <JournalModal onSuccess={loadJournalData} />
      </div>
      </div>
    </ErrorBoundary>
  )
}