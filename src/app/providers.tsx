import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from 'react-oidc-context'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// TODO(PR #23): replace with real Authentik config
// These are placeholder values — real OIDC config will be wired in PR #23.
// The AuthProvider is included here so `useAuth()` is safely callable
// anywhere in the app without crashing.
const oidcConfig = {
  authority: 'http://fake-authority',           // TODO(PR #23): replace with real Authentik URL
  client_id: 'fake-client-id',                  // TODO(PR #23): replace with real client ID
  redirect_uri: 'http://localhost:5173/callback', // TODO(PR #23): update to real callback URL
}

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider {...oidcConfig}>
        {children}
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
