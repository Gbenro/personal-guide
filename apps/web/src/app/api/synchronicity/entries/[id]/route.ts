import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/synchronicity/entries/[id] - Get specific entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: entry, error } = await supabase
      .from('synchronicity_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ entry })

  } catch (error) {
    console.error('Synchronicity entry GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/synchronicity/entries/[id] - Update specific entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      title,
      description,
      date,
      tags,
      significance,
      context,
      emotions,
      patterns
    } = body

    // Validate significance if provided
    if (significance !== undefined && (significance < 1 || significance > 10)) {
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

    // Update entry
    const { data: entry, error } = await supabase
      .from('synchronicity_entries')
      .update({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date }),
        ...(tags !== undefined && { tags }),
        ...(significance !== undefined && { significance }),
        ...(context !== undefined && { context }),
        ...(emotions !== undefined && { emotions }),
        ...(patterns !== undefined && { patterns }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !entry) {
      return NextResponse.json({ error: 'Entry not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ entry })

  } catch (error) {
    console.error('Synchronicity entry PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/synchronicity/entries/[id] - Delete specific entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete entry
    const { error } = await supabase
      .from('synchronicity_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting synchronicity entry:', error)
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Synchronicity entry DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}