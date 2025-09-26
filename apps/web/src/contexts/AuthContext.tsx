'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/lib/simple-auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const { user } = await response.json()
        setUser(user)
      } else {
        // 401 is expected for non-authenticated users
        setUser(null)
      }
    } catch (error) {
      console.log('Auth check failed (expected for first visit):', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      })
      const result = await response.json()

      if (response.ok) {
        setUser(result.user)
        return { data: result, error: null }
      } else {
        return { data: null, error: result }
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const result = await response.json()

      if (response.ok) {
        setUser(result.user)
        return { data: result, error: null }
      } else {
        return { data: null, error: result }
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/me', { method: 'DELETE' })
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}