import { useContext, useEffect } from 'react'
import { AuthContext } from 'react-oidc-context'
import { setAuthToken } from '@/lib/axios'

/**
 * Keeps lib/axios.ts's module-level auth token in sync with the OIDC
 * session. Must be rendered inside AuthProvider only.
 */
export function AuthTokenSync() {
  const auth = useContext(AuthContext)

  useEffect(() => {
    setAuthToken(auth?.user?.access_token ?? null)
  }, [auth?.user?.access_token])

  return null
}
