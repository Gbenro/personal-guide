import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await createUser(email, password, fullName)

    return NextResponse.json({
      message: 'User created successfully',
      user: { id: user.id, email: user.email, full_name: user.full_name }
    })
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}