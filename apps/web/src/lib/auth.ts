// NextAuth configuration for Railway PostgreSQL
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './supabase'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  full_name?: string
  preferred_personality?: 'mentor' | 'coach' | 'friend'
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          // Check user exists
          const result = await db.query(
            'SELECT id, email, full_name, password_hash FROM users WHERE email = $1',
            [credentials.email]
          )

          const user = result.rows[0]
          if (!user) return null

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!isValid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
}

export async function createUser(email: string, password: string, fullName?: string) {
  const hashedPassword = await bcrypt.hash(password, 12)

  const result = await db.query(
    'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
    [email, hashedPassword, fullName]
  )

  return result.rows[0]
}