import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SynchronicityPatternService } from '@/lib/synchronicityPatternService'

// GET /api/synchronicity/patterns - List user's discovered patterns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const minSignificance = parseInt(searchParams.get('minSignificance') || '1')
    const minFrequency = parseInt(searchParams.get('minFrequency') || '1')

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    const { data: patterns, error } = await supabase
      .from('synchronicity_patterns')
      .select('*')
      .eq('user_id', user.id)
      .gte('significance', minSignificance)
      .gte('frequency', minFrequency)
      .order('discovered_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching synchronicity patterns:', error)
      return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('synchronicity_patterns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('significance', minSignificance)
      .gte('frequency', minFrequency)

    if (countError) {
      console.error('Error counting synchronicity patterns:', countError)
    }

    return NextResponse.json({
      patterns: patterns || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Synchronicity patterns GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/synchronicity/patterns - Create new pattern or trigger auto-discovery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...patternData } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'discover') {
      // Auto-discover patterns
      const patternService = new SynchronicityPatternService(user.id)
      const discoveredPatterns = await patternService.discoverPatterns()

      return NextResponse.json({
        patterns: discoveredPatterns,
        message: `Discovered ${discoveredPatterns.length} new patterns`
      })
    } else {
      // Manual pattern creation
      const {
        name,
        description,
        entry_ids = [],
        significance
      } = patternData

      // Validate required fields
      if (!name || !description || !significance) {
        return NextResponse.json(
          { error: 'Missing required fields: name, description, significance' },
          { status: 400 }
        )
      }

      if (significance < 1 || significance > 10) {
        return NextResponse.json(
          { error: 'Significance must be between 1 and 10' },
          { status: 400 }
        )
      }

      // Verify that all entry_ids belong to the user
      if (entry_ids.length > 0) {
        const { data: userEntries, error: entriesError } = await supabase
          .from('synchronicity_entries')
          .select('id')
          .eq('user_id', user.id)
          .in('id', entry_ids)

        if (entriesError || userEntries.length !== entry_ids.length) {
          return NextResponse.json(
            { error: 'Some entry IDs are invalid or do not belong to user' },
            { status: 400 }
          )
        }
      }

      // Insert new pattern
      const { data: pattern, error } = await supabase
        .from('synchronicity_patterns')
        .insert({
          user_id: user.id,
          name,
          description,
          entry_ids,
          frequency: entry_ids.length,
          significance
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating synchronicity pattern:', error)
        return NextResponse.json({ error: 'Failed to create pattern' }, { status: 500 })
      }

      return NextResponse.json({ pattern }, { status: 201 })
    }

  } catch (error) {
    console.error('Synchronicity patterns POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}