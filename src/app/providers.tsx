import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from 'react-oidc-context'
import type { ReactNode } from 'react'
import { getOidcConfig } from '@/lib/oidc'
import { AuthTokenSync } from '@/components/auth/AuthTokenSync'
import { SessionTimeoutGuard } from '@/components/auth/SessionTimeoutGuard'
import { handleSigninCallback } from '@/lib/authCallbacks'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const oidcConfig = getOidcConfig()

  const body = oidcConfig ? (
    <AuthProvider {...oidcConfig} onSigninCallback={handleSigninCallback}>
      <AuthTokenSync />
      <SessionTimeoutGuard />
      {children}
    </AuthProvider>
  ) : (
    children
  )

  return (
    <QueryClientProvider client={queryClient}>
      {body}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
