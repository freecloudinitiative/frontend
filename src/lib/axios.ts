import axios from 'axios'

/**
 * Shared axios instance used by all feature modules.
 * Base URL is driven by the VITE_API_BASE_URL env var. When not set, requests
 * are made relative to the current origin — required so MSW's browser worker
 * (which only intercepts same-origin requests) can mock them in dev.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request interceptor — attaches the OIDC access token, when present.
// The interceptor runs outside React, so AuthTokenSync (rendered inside
// AuthProvider) keeps this module-level variable in sync with the session.
// ---------------------------------------------------------------------------
let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---------------------------------------------------------------------------
// Response interceptor — centralised error handling so React Query's error
// states receive the error automatically, while still giving us one place to
// add logging / toast notifications later.
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[apiClient] Request failed:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
      })
    }
    // Pass the error through so React Query can pick it up
    return Promise.reject(error)
  },
)

export default apiClient
