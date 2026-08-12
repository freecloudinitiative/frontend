import { useEffect, useRef, useState } from 'react'
import type { GlobalSearchResult } from '@/features/dashboard/useGlobalSearch'

// ── Props ─────────────────────────────────────────────────────────────────────

interface GlobalSearchOverlayProps {
  query: string
  results: GlobalSearchResult[]
  onClose: () => void
  onSelectResult: (result: GlobalSearchResult) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalSearchOverlay({
  query,
  results,
  onClose,
  onSelectResult,
}: GlobalSearchOverlayProps) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset highlight whenever results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [results])

  // Keyboard navigation — attached to the overlay div so the input can delegate
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (results.length === 0) return
      const next = activeIndex < results.length - 1 ? activeIndex + 1 : 0
      setActiveIndex(next)
      scrollIntoView(next)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length === 0) return
      const prev = activeIndex > 0 ? activeIndex - 1 : results.length - 1
      setActiveIndex(prev)
      scrollIntoView(prev)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < results.length) {
        onSelectResult(results[activeIndex])
      } else if (results.length === 1) {
        onSelectResult(results[0])
      }
    }
  }

  function scrollIntoView(index: number) {
    const el = listRef.current?.children[index] as HTMLElement | undefined
    el?.scrollIntoView?.({ block: 'nearest' })
  }

  if (query.trim().length === 0) return null

  return (
    <div
      className="fci-global-search-overlay"
      role="listbox"
      aria-label="Global search results"
      onKeyDown={handleKeyDown}
      ref={listRef}
    >
      {results.length === 0 ? (
        <div className="fci-global-search-empty">No resources found for &ldquo;{query}&rdquo;</div>
      ) : (
        results.map((result, idx) => {
          const isActive = idx === activeIndex
          return (
            <div
              key={`${result.serviceId}-${result.id}`}
              id={`fci-global-result-${idx}`}
              role="option"
              aria-selected={isActive}
              className={`fci-global-search-result${isActive ? ' fci-global-search-result-active' : ''}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelectResult(result)
              }}
            >
              <span className={`fci-global-search-badge fci-gsb-${result.typeBadge}`}>
                {result.typeBadge}
              </span>
              <span className="fci-global-search-name">{result.name}</span>
              <span className="fci-global-search-subtitle">{result.subtitle}</span>
            </div>
          )
        })
      )}
    </div>
  )
}
