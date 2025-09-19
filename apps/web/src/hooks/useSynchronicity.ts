'use client'

import { useState, useEffect, useCallback } from 'react'
import { SynchronicityEntry, SynchronicityPattern, SynchronicityStats } from '@/types/spiritual'

export interface SynchronicityFilters {
  limit?: number
  offset?: number
  tags?: string[]
  minSignificance?: number
  maxSignificance?: number
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface CreateEntryData {
  title: string
  description: string
  date: Date
  tags: string[]
  significance: number
  context: string
  emotions: string[]
  patterns?: string[]
}

export function useSynchronicity() {
  const [entries, setEntries] = useState<SynchronicityEntry[]>([])
  const [patterns, setPatterns] = useState<SynchronicityPattern[]>([])
  const [stats, setStats] = useState<SynchronicityStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch entries with optional filters
  const fetchEntries = useCallback(async (filters: SynchronicityFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()

      if (filters.limit) searchParams.set('limit', filters.limit.toString())
      if (filters.offset) searchParams.set('offset', filters.offset.toString())
      if (filters.tags && filters.tags.length > 0) searchParams.set('tags', filters.tags.join(','))
      if (filters.minSignificance) searchParams.set('minSignificance', filters.minSignificance.toString())
      if (filters.maxSignificance) searchParams.set('maxSignificance', filters.maxSignificance.toString())
      if (filters.startDate) searchParams.set('startDate', filters.startDate.toISOString().split('T')[0])
      if (filters.endDate) searchParams.set('endDate', filters.endDate.toISOString().split('T')[0])
      if (filters.search) searchParams.set('search', filters.search)

      const response = await fetch(`/api/synchronicity/entries?${searchParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch entries')
      }

      const data = await response.json()

      // Convert date strings back to Date objects
      const formattedEntries = data.entries.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }))

      setEntries(formattedEntries)
      return { entries: formattedEntries, pagination: data.pagination }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch entries'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new entry
  const createEntry = useCallback(async (entryData: CreateEntryData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/synchronicity/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...entryData,
          date: entryData.date.toISOString().split('T')[0]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create entry')
      }

      const data = await response.json()
      const newEntry = {
        ...data.entry,
        date: new Date(data.entry.date),
        createdAt: new Date(data.entry.created_at),
        updatedAt: new Date(data.entry.updated_at)
      }

      // Add to current entries list
      setEntries(prev => [newEntry, ...prev])

      return newEntry

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create entry'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Update an existing entry
  const updateEntry = useCallback(async (entryId: string, updates: Partial<CreateEntryData>) => {
    setLoading(true)
    setError(null)

    try {
      const updateData = { ...updates }
      if (updates.date) {
        updateData.date = updates.date.toISOString().split('T')[0] as any
      }

      const response = await fetch(`/api/synchronicity/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update entry')
      }

      const data = await response.json()
      const updatedEntry = {
        ...data.entry,
        date: new Date(data.entry.date),
        createdAt: new Date(data.entry.created_at),
        updatedAt: new Date(data.entry.updated_at)
      }

      // Update in current entries list
      setEntries(prev => prev.map(entry =>
        entry.id === entryId ? updatedEntry : entry
      ))

      return updatedEntry

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update entry'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete an entry
  const deleteEntry = useCallback(async (entryId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/synchronicity/entries/${entryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete entry')
      }

      // Remove from current entries list
      setEntries(prev => prev.filter(entry => entry.id !== entryId))

      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch patterns
  const fetchPatterns = useCallback(async (filters: {
    limit?: number
    offset?: number
    minSignificance?: number
    minFrequency?: number
  } = {}) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()

      if (filters.limit) searchParams.set('limit', filters.limit.toString())
      if (filters.offset) searchParams.set('offset', filters.offset.toString())
      if (filters.minSignificance) searchParams.set('minSignificance', filters.minSignificance.toString())
      if (filters.minFrequency) searchParams.set('minFrequency', filters.minFrequency.toString())

      const response = await fetch(`/api/synchronicity/patterns?${searchParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch patterns')
      }

      const data = await response.json()

      // Convert date strings back to Date objects
      const formattedPatterns = data.patterns.map((pattern: any) => ({
        ...pattern,
        discoveredAt: new Date(pattern.discovered_at || pattern.discoveredAt)
      }))

      setPatterns(formattedPatterns)
      return { patterns: formattedPatterns, pagination: data.pagination }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patterns'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Discover new patterns
  const discoverPatterns = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/synchronicity/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'discover' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to discover patterns')
      }

      const data = await response.json()

      // Convert date strings back to Date objects
      const newPatterns = data.patterns.map((pattern: any) => ({
        ...pattern,
        discoveredAt: new Date(pattern.discovered_at || pattern.discoveredAt)
      }))

      // Add to current patterns list
      setPatterns(prev => [...newPatterns, ...prev])

      return newPatterns

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to discover patterns'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch statistics
  const fetchStats = useCallback(async (timeframe?: 'week' | 'month' | 'year' | 'all') => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      if (timeframe) searchParams.set('timeframe', timeframe)

      const response = await fetch(`/api/synchronicity/stats?${searchParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data)
      return data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch correlations
  const fetchCorrelations = useCallback(async (analysisType: 'all' | 'tags' | 'emotions' | 'temporal' | 'significance' = 'all') => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      searchParams.set('type', analysisType)

      const response = await fetch(`/api/synchronicity/correlations?${searchParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch correlations')
      }

      const data = await response.json()
      return data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch correlations'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get a single entry
  const getEntry = useCallback(async (entryId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/synchronicity/entries/${entryId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch entry')
      }

      const data = await response.json()
      const entry = {
        ...data.entry,
        date: new Date(data.entry.date),
        createdAt: new Date(data.entry.created_at),
        updatedAt: new Date(data.entry.updated_at)
      }

      return entry

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch entry'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get insights
  const getInsights = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch stats, patterns, and correlations in parallel
      const [statsResponse, patternsResponse, correlationsResponse] = await Promise.all([
        fetch('/api/synchronicity/stats?includePatterns=true&includeCorrelations=true'),
        fetch('/api/synchronicity/patterns?limit=5'),
        fetch('/api/synchronicity/correlations?type=all')
      ])

      if (!statsResponse.ok || !patternsResponse.ok || !correlationsResponse.ok) {
        throw new Error('Failed to fetch insights')
      }

      const [statsData, patternsData, correlationsData] = await Promise.all([
        statsResponse.json(),
        patternsResponse.json(),
        correlationsResponse.json()
      ])

      const insights = {
        stats: statsData,
        recentPatterns: patternsData.patterns || [],
        correlations: correlationsData,
        recommendations: generateRecommendations(statsData, patternsData.patterns || [], correlationsData)
      }

      return insights

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch insights'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    // State
    entries,
    patterns,
    stats,
    loading,
    error,

    // Entry operations
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntry,

    // Pattern operations
    fetchPatterns,
    discoverPatterns,

    // Analytics operations
    fetchStats,
    fetchCorrelations,
    getInsights,

    // Utility
    clearError: () => setError(null)
  }
}

// Helper function to generate recommendations based on data
function generateRecommendations(stats: any, patterns: SynchronicityPattern[], correlations: any): string[] {
  const recommendations: string[] = []

  // Stats-based recommendations
  if (stats.totalEntries < 5) {
    recommendations.push("Continue documenting your synchronicities to discover meaningful patterns.")
  } else if (stats.averageSignificance < 5) {
    recommendations.push("Consider being more mindful of subtle synchronicities that might have deeper significance.")
  }

  // Pattern-based recommendations
  if (patterns.length > 0) {
    const highSignificancePatterns = patterns.filter(p => p.significance >= 7)
    if (highSignificancePatterns.length > 0) {
      recommendations.push(`You have ${highSignificancePatterns.length} high-significance patterns. Pay attention to these recurring themes.`)
    }
  }

  // Correlation-based recommendations
  if (correlations.tagCorrelations && correlations.tagCorrelations.length > 0) {
    const strongCorrelation = correlations.tagCorrelations[0]
    if (strongCorrelation && strongCorrelation.confidence > 0.7) {
      recommendations.push(`Strong connection detected between "${strongCorrelation.tag1}" and "${strongCorrelation.tag2}" themes.`)
    }
  }

  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      "Keep tracking your synchronicities regularly to build a meaningful dataset.",
      "Pay attention to emotions and contexts surrounding your experiences.",
      "Look for recurring themes in timing, locations, or situations."
    )
  }

  return recommendations
}