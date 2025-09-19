import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SynchronicityEntry } from '@/types/spiritual'

// GET /api/synchronicity/entries - List user's synchronicity entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const minSignificance = parseInt(searchParams.get('minSignificance') || '1')
    const maxSignificance = parseInt(searchParams.get('maxSignificance') || '10')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from('synchronicity_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('significance', minSignificance)
      .lte('significance', maxSignificance)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add date filters
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    // Add search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Add tags filter
    if (tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Error fetching synchronicity entries:', error)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('synchronicity_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('significance', minSignificance)
      .lte('significance', maxSignificance)

    if (startDate) countQuery = countQuery.gte('date', startDate)
    if (endDate) countQuery = countQuery.lte('date', endDate)
    if (search) countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    if (tags.length > 0) countQuery = countQuery.overlaps('tags', tags)

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting synchronicity entries:', countError)
    }

    return NextResponse.json({
      entries: entries || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Synchronicity entries GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/synchronicity/entries - Create new synchronicity entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      date,
      tags = [],
      significance,
      context,
      emotions = [],
      patterns = []
    } = body

    // Validate required fields
    if (!title || !description || !date || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, date, context' },
        { status: 400 }
      )
    }

    if (!significance || significance < 1 || significance > 10) {
      return NextResponse.json(
        { error: 'Significance must be between 1 and 10' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Insert new entry
    const { data: entry, error } = await supabase
      .from('synchronicity_entries')
      .insert({
        user_id: user.id,
        title,
        description,
        date,
        tags,
        significance,
        context,
        emotions,
        patterns
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating synchronicity entry:', error)
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
    }

    return NextResponse.json({ entry }, { status: 201 })

  } catch (error) {
    console.error('Synchronicity entries POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}