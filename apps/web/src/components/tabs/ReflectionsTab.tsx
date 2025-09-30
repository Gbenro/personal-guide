'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import { reportError, trackUserAction } from '@/lib/monitoring'
import {
  getUserReflections,
  getReflectionStats,
  toggleReflectionFavorite,
  searchReflections,
  type Reflection,
  type ReflectionStats,
  type ReflectionFilters
} from '@/lib/reflectionService'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  ArrowsUpDownIcon,
  FaceSmileIcon,
  LightBulbIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface ReflectionCardProps {
  reflection: Reflection
  onToggleFavorite: (id: string) => void
  onEdit?: (reflection: Reflection) => void
}

function ReflectionCard({ reflection, onToggleFavorite, onEdit }: ReflectionCardProps) {
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

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'journal':
        return <BookOpenIcon className="w-4 h-4" />
      case 'chat':
        return <ChatBubbleLeftRightIcon className="w-4 h-4" />
      case 'habit':
        return <HeartIcon className="w-4 h-4" />
      case 'mood':
        return <FaceSmileIcon className="w-4 h-4" />
      default:
        return <LightBulbIcon className="w-4 h-4" />
    }
  }

  const getSourceColor = (sourceType: string) => {
    switch (sourceType) {
      case 'journal':
        return 'text-blue-600 bg-blue-50'
      case 'chat':
        return 'text-purple-600 bg-purple-50'
      case 'habit':
        return 'text-green-600 bg-green-50'
      case 'mood':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1 rounded ${getSourceColor(reflection.source_type)}`}>
              {getSourceIcon(reflection.source_type)}
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {reflection.source_type}
            </span>
            {reflection.mood_rating && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FaceSmileIcon className="w-3 h-3" />
                {reflection.mood_rating}/10
              </div>
            )}
          </div>

          {reflection.title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {reflection.title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(reflection.id)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            title={reflection.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {reflection.is_favorite ? (
              <HeartSolidIcon className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-700 line-clamp-3 leading-relaxed">
          {reflection.content}
        </p>
      </div>

      {/* Insights */}
      {reflection.insights && reflection.insights.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
            <SparklesIcon className="w-4 h-4" />
            Key Insights
          </h4>
          <div className="space-y-1">
            {reflection.insights.slice(0, 2).map((insight, index) => (
              <p key={index} className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                {insight}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tags and Themes */}
      <div className="flex flex-wrap gap-2 mb-4">
        {reflection.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
          >
            <TagIcon className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
        {reflection.themes?.slice(0, 2).map((theme) => (
          <span
            key={theme}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
          >
            {theme}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {formatDate(reflection.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {formatTime(reflection.created_at)}
          </div>
        </div>

        {onEdit && (
          <button
            onClick={() => onEdit(reflection)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  )
}

export default function ReflectionsTab() {
  const { user } = useAuth()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [stats, setStats] = useState<ReflectionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'favorites' | 'mood'>('date')
  const [showFilters, setShowFilters] = useState(false)


  useEffect(() => {
    loadReflections()
  }, [user])

  const loadReflections = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Build filters
      const filters: ReflectionFilters = {}
      if (selectedSource !== 'all') {
        filters.source_type = selectedSource
      }

      // Load reflections and stats
      const [reflectionsData, statsData] = await Promise.all([
        getUserReflections(user.id, filters),
        getReflectionStats(user.id)
      ])

      setReflections(reflectionsData)
      setStats(statsData)

      trackUserAction({
        action: 'reflections_viewed',
        target: 'reflections_tab',
        metadata: { userId: user.id, count: reflectionsData.length }
      })
    } catch (error) {
      reportError({
        message: 'Failed to load reflections',
        severity: 'medium',
        context: { userId: user.id }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = useCallback(async (reflectionId: string) => {
    try {
      const reflection = reflections.find(r => r.id === reflectionId)
      if (!reflection) return

      const newFavoriteStatus = await toggleReflectionFavorite(reflectionId, reflection.is_favorite || false)

      setReflections(prev => prev.map(r =>
        r.id === reflectionId
          ? { ...r, is_favorite: newFavoriteStatus }
          : r
      ))

      trackUserAction({
        action: 'reflection_favorited',
        target: reflectionId,
        metadata: { userId: user?.id, newStatus: newFavoriteStatus }
      })
    } catch (error) {
      reportError({
        message: 'Failed to toggle reflection favorite',
        severity: 'low',
        context: { reflectionId, userId: user?.id }
      })
    }
  }, [user, reflections])

  // Filter and sort reflections
  const filteredReflections = reflections
    .filter(reflection => {
      const matchesSearch = searchQuery === '' ||
        reflection.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reflection.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reflection.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesSource = selectedSource === 'all' || reflection.source_type === selectedSource
      const matchesTag = selectedTag === 'all' || reflection.tags.includes(selectedTag)

      return matchesSearch && matchesSource && matchesTag
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'favorites':
          if (a.is_favorite && !b.is_favorite) return -1
          if (!a.is_favorite && b.is_favorite) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'mood':
          const aMood = a.mood_rating || 0
          const bMood = b.mood_rating || 0
          if (aMood !== bMood) return bMood - aMood
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  // Get all unique tags for filter
  const allTags = Array.from(new Set(reflections.flatMap(r => r.tags)))

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-xl"></div>
            ))}
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
          context: { component: 'ReflectionsTab', userId: user?.id }
        })
      }}
    >
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LightBulbIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reflections</h1>
              <p className="text-gray-600">Your journey of insights and self-discovery</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reflections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'favorites' | 'mood')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="favorites">Sort by Favorites</option>
              <option value="mood">Sort by Mood</option>
            </select>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Type
                  </label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Sources</option>
                    <option value="journal">Journal</option>
                    <option value="chat">Chat</option>
                    <option value="habit">Habits</option>
                    <option value="mood">Mood</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Tags</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpenIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reflections</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats?.total_reflections || reflections.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <HeartSolidIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Favorites</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats?.favorite_count || reflections.filter(r => r.is_favorite).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaceSmileIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Mood</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats?.average_mood?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reflections Grid */}
        {filteredReflections.length === 0 ? (
          <div className="text-center py-12">
            <LightBulbIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reflections found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search or filters.' : 'Start journaling or chatting to generate reflections.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredReflections.map((reflection) => (
              <ReflectionCard
                key={reflection.id}
                reflection={reflection}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}