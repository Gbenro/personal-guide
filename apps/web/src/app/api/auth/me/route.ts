import { NextRequest, NextResponse } from 'next/server'
import { getUserFromCookies } from '@/lib/simple-auth'

export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || ''
    const user = getUserFromCookies(cookies)

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, full_name: user.full_name }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out successfully' })

  // Clear auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  return response
}