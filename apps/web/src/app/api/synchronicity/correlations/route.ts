import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SynchronicityCorrelationService } from '@/lib/synchronicityCorrelationService'

// GET /api/synchronicity/correlations - Analyze correlations in user's synchronicity data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisType = searchParams.get('type') || 'all' // all, tags, emotions, temporal, significance
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.3')
    const minOccurrences = parseInt(searchParams.get('minOccurrences') || '3')
    const timeframe = searchParams.get('timeframe') // optional: last-30-days, last-90-days, etc.

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const correlationService = new SynchronicityCorrelationService(user.id)

    const result: any = {
      analysisType,
      parameters: {
        minConfidence,
        minOccurrences,
        timeframe
      },
      generatedAt: new Date().toISOString()
    }

    // Perform different types of correlation analysis
    switch (analysisType) {
      case 'tags':
        result.tagCorrelations = await correlationService.analyzeTagCorrelations(minConfidence, minOccurrences)
        break

      case 'emotions':
        result.emotionCorrelations = await correlationService.analyzeEmotionCorrelations(minConfidence, minOccurrences)
        break

      case 'temporal':
        result.temporalPatterns = await correlationService.analyzeTemporalPatterns()
        break

      case 'significance':
        result.significancePatterns = await correlationService.analyzeSignificancePatterns()
        break

      case 'all':
      default:
        // Perform comprehensive analysis
        const [tagCorrelations, emotionCorrelations, temporalPatterns, significancePatterns] = await Promise.all([
          correlationService.analyzeTagCorrelations(minConfidence, minOccurrences),
          correlationService.analyzeEmotionCorrelations(minConfidence, minOccurrences),
          correlationService.analyzeTemporalPatterns(),
          correlationService.analyzeSignificancePatterns()
        ])

        result.tagCorrelations = tagCorrelations
        result.emotionCorrelations = emotionCorrelations
        result.temporalPatterns = temporalPatterns
        result.significancePatterns = significancePatterns
        break
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Synchronicity correlations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/synchronicity/correlations - Generate custom correlation analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      entryIds,
      analysisTypes = ['tags', 'emotions'],
      customParameters = {}
    } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate entry IDs belong to user
    if (entryIds && entryIds.length > 0) {
      const { data: userEntries, error: entriesError } = await supabase
        .from('synchronicity_entries')
        .select('id')
        .eq('user_id', user.id)
        .in('id', entryIds)

      if (entriesError || userEntries.length !== entryIds.length) {
        return NextResponse.json(
          { error: 'Some entry IDs are invalid or do not belong to user' },
          { status: 400 }
        )
      }
    }

    const correlationService = new SynchronicityCorrelationService(user.id)
    const results = await correlationService.performCustomAnalysis(
      entryIds,
      analysisTypes,
      customParameters
    )

    return NextResponse.json({
      customAnalysis: results,
      entryIds,
      analysisTypes,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Synchronicity correlations POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}