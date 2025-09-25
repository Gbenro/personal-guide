'use client'

import { createContext, useContext } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  const user = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    full_name: session.user.name
  } as User : null

  const loading = status === 'loading'

  const handleSignUp = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      })
      const result = await response.json()
      return { data: result, error: response.ok ? null : result }
    } catch (error) {
      return { data: null, error }
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })
    return { data: result, error: result?.error ? new Error(result.error) : null }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
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