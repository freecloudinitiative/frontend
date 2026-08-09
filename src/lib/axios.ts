import axios from 'axios'

/**
 * Shared axios instance used by all feature modules.
 * Base URL is driven by the VITE_API_BASE_URL env var, falling back to the
 * local mock-dev server address when the variable is not set.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request interceptor
// TODO(PR #23): wire real auth token from the OIDC session once AuthProvider
// is fully configured. For now this is a no-op placeholder.
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    // placeholder: const token = getAuthToken()
    // if (token) config.headers.Authorization = `Bearer ${token}`
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
