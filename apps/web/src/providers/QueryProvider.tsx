'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each component tree
  // This ensures no shared state between different app instances
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep inactive data for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed queries once
        retry: 1,
        // Retry delay of 1 second
        retryDelay: 1000,
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Don't refetch on reconnect (Supabase handles this)
        refetchOnReconnect: false,
        // Error handling
        throwOnError: false,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
        // Retry delay of 1 second
        retryDelay: 1000,
        // Error handling
        throwOnError: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}