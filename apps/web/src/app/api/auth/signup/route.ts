import { NextRequest, NextResponse } from 'next/server'
import { createUser, signToken } from '@/lib/simple-auth'

export async function POST(request: NextRequest) {
  console.log('🚀 Simple signup route called')
  console.log('🌍 Environment check:', {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV
  })

  try {
    const body = await request.json()
    console.log('📝 Signup request body:', { email: body.email, hasPassword: !!body.password, fullName: body.fullName })
    const { email, password, fullName } = body

    if (!email || !password) {
      console.log('❌ Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('👤 About to create user...')
    const user = await createUser(email, password, fullName)
    console.log('✅ User created successfully:', user)

    console.log('🔐 About to sign token...')
    const token = signToken(user)
    console.log('✅ Token signed successfully')

    const response = NextResponse.json({
      message: 'User created successfully',
      user: { id: user.id, email: user.email, full_name: user.full_name }
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error: any) {
    console.error('💥 Signup error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    })

    if (error.code === '23505') {
      console.log('User already exists error')
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    console.error('💥 Unhandled signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}