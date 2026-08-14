import axios from 'axios'
import { getApiErrorCode, getApiErrorRequestId } from '@/lib/apiError'
import { getRuntimeConfig } from '@/lib/runtimeConfig'

/**
 * Shared axios instance used by all feature modules.
 * Base URL is driven by the VITE_API_BASE_URL env var. When not set, requests
 * are made relative to the current origin — required so MSW's browser worker
 * (which only intercepts same-origin requests) can mock them in dev.
 */
const apiClient = axios.create({
  baseURL: getRuntimeConfig().apiBaseUrl,
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
    // The instance-wide 'application/json' default (above) overrides axios's
    // own FormData handling, which otherwise auto-generates the multipart
    // boundary. Clear it here so uploads (e.g. importData) get a valid
    // Content-Type set by the adapter instead of a boundary-less one.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type')
      } else {
        delete config.headers['Content-Type']
      }
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
    if (error.response?.status === 401) {
      authToken = null
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fci:auth-unauthorized'))
      }
    }
    if (import.meta.env.DEV) {
      console.error('[apiClient] Request failed:', {
        url: error.config?.url,
        status: error.response?.status,
        code: getApiErrorCode(error),
        requestId: getApiErrorRequestId(error),
        message: error.message,
      })
    }
    // Pass the error through so React Query can pick it up
    return Promise.reject(error)
  },
)

export default apiClient
