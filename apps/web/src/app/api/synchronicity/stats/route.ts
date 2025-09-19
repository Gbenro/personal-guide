import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SynchronicityStatsService } from '@/lib/synchronicityStatsService'

// GET /api/synchronicity/stats - Get user's synchronicity statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'all' // all, year, month, week
    const includePatterns = searchParams.get('includePatterns') === 'true'
    const includeCorrelations = searchParams.get('includeCorrelations') === 'true'

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const statsService = new SynchronicityStatsService(user.id)

    // Calculate date range based on timeframe
    let startDate: Date | undefined
    const now = new Date()

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = undefined
    }

    // Get basic stats
    const basicStats = await statsService.getBasicStats(startDate)

    // Get additional data if requested
    const result: any = {
      ...basicStats,
      timeframe,
      generatedAt: new Date().toISOString()
    }

    if (includePatterns) {
      result.patternAnalysis = await statsService.getPatternAnalysis()
    }

    if (includeCorrelations) {
      result.correlations = await statsService.getCorrelationAnalysis()
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Synchronicity stats GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}