'use client'

import { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'

// Inner providers that need access to auth context
function InnerProviders({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  return (
    <RealtimeProvider userId={user?.id}>
      {children}
    </RealtimeProvider>
  )
}

// Main app providers wrapper
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <InnerProviders>
          {children}
        </InnerProviders>
      </AuthProvider>
    </QueryProvider>
  )
}