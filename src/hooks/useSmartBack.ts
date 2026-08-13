import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Custom hook to standardise dynamic back button navigation.
 * Uses history popping (`navigate(-1)`) if session history exists,
 * or falls back to `defaultFallback` route (e.g. '/dashboard') when accessed directly.
 */
export function useSmartBack(defaultFallback: string = '/dashboard') {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(() => {
    // Check if internal browser history exists for this session
    const hasHistoryState = window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0
    const isNotDefaultLocation = location.key !== 'default'

    if (hasHistoryState || isNotDefaultLocation) {
      navigate(-1)
    } else {
      navigate(defaultFallback, { replace: true })
    }
  }, [navigate, location.key, defaultFallback])
}
