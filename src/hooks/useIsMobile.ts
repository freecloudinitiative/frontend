import { useState, useEffect } from 'react'

const MOBILE_MEDIA_QUERY = '(max-width: 768px)'
const COMPACT_MEDIA_QUERY = '(max-width: 1450px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}

export function useIsCompact(): boolean {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(COMPACT_MEDIA_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(COMPACT_MEDIA_QUERY)
    setIsCompact(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsCompact(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isCompact
}
