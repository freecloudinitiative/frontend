import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore } from '@/store/themeStore'
import { useToastStore } from '@/store/toastStore'
import { Input } from '@/components/ui/Input'
import type { ServiceId } from '@/features/dashboard/serviceCatalog'
import { serviceIdToSlug } from '@/features/dashboard/serviceCatalog'
import type { GlobalSearchResult } from '@/features/dashboard/useGlobalSearch'

// ── Command definitions ───────────────────────────────────────────────────────

interface PaletteCommand {
  prefix: string
  description: string
  category: 'nav' | 'action'
  danger?: boolean
}

const COMMANDS: PaletteCommand[] = [
  // Service navigation
  { prefix: ':ce',  description: 'Switch to Compute Engine',   category: 'nav' },
  { prefix: ':db',  description: 'Switch to Database',         category: 'nav' },
  { prefix: ':iam', description: 'Switch to IAM',              category: 'nav' },
  { prefix: ':net', description: 'Switch to Network',          category: 'nav' },
  { prefix: ':str', description: 'Switch to Storage',          category: 'nav' },
  { prefix: ':lb',  description: 'Switch to Load Balancer',   category: 'nav' },
  { prefix: ':k8s', description: 'Switch to Kubernetes',      category: 'nav' },
  { prefix: ':es',  description: 'Switch to Elasticsearch',   category: 'nav' },
  { prefix: ':kfk', description: 'Switch to Kafka',           category: 'nav' },
  { prefix: ':about', description: 'Technical Project Manifesto (/about)', category: 'nav' },
  { prefix: ':acc', description: 'My Account Settings (/account)', category: 'nav' },
  // Actions
  { prefix: ':crt', description: 'Create — open creation form for active service', category: 'action' },
  { prefix: ':dlt', description: 'Delete — trigger delete flow for selected item', category: 'action', danger: true },
]

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  activeService: ServiceId | null
  selectedRow: { id: string; name: string } | null
  selectService: (id: ServiceId) => void
  openDeleteFlow: () => void
  navigate: (path: string) => void
  resourceResults?: GlobalSearchResult[]
  onSelectResource?: (result: GlobalSearchResult) => void
  /** Called whenever the palette input query changes — used by parent to drive global search */
  onQueryChange?: (query: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CommandPalette({
  isOpen,
  onClose,
  activeService,
  selectedRow,
  selectService,
  openDeleteFlow,
  navigate,
  resourceResults = [],
  onSelectResource = () => {},
  onQueryChange = () => {},
}: CommandPaletteProps) {
  const theme = useThemeStore((state) => state.theme)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const invokerRef = useRef<HTMLElement | null>(null)

  // Capture the invoking element when opening; restore focus on close
  useEffect(() => {
    if (isOpen) {
      invokerRef.current = document.activeElement as HTMLElement | null
    } else if (invokerRef.current) {
      if (document.body.contains(invokerRef.current)) {
        invokerRef.current.focus()
      }
      invokerRef.current = null
    }
  }, [isOpen])

  // Reset query + selection whenever the palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      onQueryChange('')
      setActiveIndex(-1)
      const raf = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(raf)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset active index whenever the filtered list changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  if (!isOpen) return null

  // ── Filter commands by current query ─────────────────────────────────────
  const normalizedQuery = query.trim().toLowerCase()

  // Prefix queries (start with ':') → show only commands, no resources
  const isCommandQuery = normalizedQuery.startsWith(':') || normalizedQuery === ''

  const filteredCommands =
    normalizedQuery === ''
      ? COMMANDS
      : COMMANDS.filter(
          (c) =>
            c.prefix.includes(normalizedQuery) ||
            c.description.toLowerCase().includes(normalizedQuery)
        )

  // Resource results are shown only when not a command query
  const filteredResources: GlobalSearchResult[] = isCommandQuery ? [] : resourceResults

  // Total items for unified keyboard navigation: commands first, then resources
  const totalItems = filteredCommands.length + filteredResources.length
  const commandsLength = filteredCommands.length

  // ── Check if query exactly matches a command prefix ───────────────────────
  const exactMatch = COMMANDS.find((c) => c.prefix === normalizedQuery)

  // ── Execute a command ─────────────────────────────────────────────────────
  function executeCommand(cmd: PaletteCommand) {
    switch (cmd.prefix) {
      case ':ce':  selectService('Compute Engine'); break
      case ':db':  selectService('Database'); break
      case ':iam': selectService('IAM');      break
      case ':net': selectService('Network');       break
      case ':str': selectService('Storage');       break
      case ':lb':  selectService('Load Balancer'); break
      case ':k8s': selectService('Kubernetes');    break
      case ':es':  selectService('Elasticsearch'); break
      case ':kfk': selectService('Kafka');         break
      case ':about': navigate('/about');           break
      case ':acc':   navigate('/account');         break
      case ':crt': {
        const slug = activeService ? serviceIdToSlug(activeService) : 'compute-engine'
        navigate(`/services/${slug}/create`)
        break
      }
      case ':dlt': {
        if (selectedRow) {
          openDeleteFlow()
        } else {
          useToastStore.getState().addToast('No item selected to delete', 'info')
        }
        break
      }
    }
    onClose()
  }

  // ── Scroll the highlighted item into view ─────────────────────────────────
  function scrollItemIntoView(index: number) {
    if (!listRef.current) return
    const item = listRef.current.children[index] as HTMLElement | undefined
    item?.scrollIntoView?.({ block: 'nearest' })
  }

  // ── Keyboard handler ──────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (totalItems === 0) return
      const next = activeIndex < totalItems - 1 ? activeIndex + 1 : 0
      setActiveIndex(next)
      scrollItemIntoView(next)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (totalItems === 0) return
      const prev = activeIndex > 0 ? activeIndex - 1 : totalItems - 1
      setActiveIndex(prev)
      scrollItemIntoView(prev)
      return
    }

    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < commandsLength) {
        // Highlighted item is a command
        executeCommand(filteredCommands[activeIndex])
      } else if (activeIndex >= commandsLength && activeIndex < totalItems) {
        // Highlighted item is a resource
        const resourceIdx = activeIndex - commandsLength
        onSelectResource(filteredResources[resourceIdx])
        onClose()
      } else if (exactMatch) {
        executeCommand(exactMatch)
      } else if (filteredCommands.length === 1 && filteredResources.length === 0) {
        executeCommand(filteredCommands[0])
      } else if (filteredCommands.length === 0 && filteredResources.length === 1) {
        onSelectResource(filteredResources[0])
        onClose()
      }
    }
  }

  const showResourceSection = filteredResources.length > 0
  const showNoResults = totalItems === 0 && normalizedQuery !== ''

  return createPortal(
    <div
      className="fci-palette-overlay"
      data-theme={theme}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="fci-palette-container">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="fci-palette-header">
          <span className="fci-palette-title">⌘ COMMAND PALETTE</span>
          <button
            type="button"
            className="fci-modal-close"
            onClick={onClose}
            aria-label="Close Command Palette"
          >
            ✕
          </button>
        </div>

        {/* ── Input ─────────────────────────────────────────────────────── */}
        <div className="fci-palette-input-wrap" style={{ '--fci-chars': query.length } as React.CSSProperties}>
          <span className="fci-palette-prompt">&gt;</span>
          <Input
            ref={inputRef}
            type="text"
            className="fci-palette-input"
            placeholder="Type a command (:ce  :db  :crt  :dlt) or search resources…"
            value={query}
            onChange={(e) => {
              const v = e.target.value
              setQuery(v)
              onQueryChange(v.trim().toLowerCase())
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-controls="fci-palette-listbox"
            aria-activedescendant={
              activeIndex >= 0 ? `fci-palette-item-${activeIndex}` : undefined
            }
          />
        </div>

        {/* ── Combined list ──────────────────────────────────────────────── */}
        <div
          ref={listRef}
          id="fci-palette-listbox"
          className="fci-palette-commands"
          role="listbox"
          aria-label="Commands and resources"
        >
          {showNoResults ? (
            <div className="fci-palette-no-results">No matching commands or resources</div>
          ) : (
            <>
              {/* Commands section */}
              {filteredCommands.map((cmd, idx) => {
                const isHighlighted = idx === activeIndex
                const isExact = !isHighlighted && cmd.prefix === normalizedQuery
                const isActive = isHighlighted || isExact
                return (
                  <button
                    key={cmd.prefix}
                    id={`fci-palette-item-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`fci-palette-cmd-item${isActive ? ' fci-palette-cmd-active' : ''}${cmd.danger ? ' fci-palette-cmd-danger' : ''}`}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="fci-palette-cmd-prefix">{cmd.prefix}</span>
                    <span className="fci-palette-cmd-desc">{cmd.description}</span>
                    <span className={`fci-palette-cmd-badge fci-palette-badge-${cmd.category}`}>
                      {cmd.category}
                    </span>
                  </button>
                )
              })}

              {/* Resources section (only when not a command-prefix query) */}
              {showResourceSection && (
                <>
                  <div className="fci-palette-divider" aria-hidden="true">
                    ── Resources ──
                  </div>
                  {filteredResources.map((result, idx) => {
                    const listIdx = commandsLength + idx
                    const isActive = listIdx === activeIndex
                    return (
                      <button
                        key={`${result.serviceId}-${result.id}`}
                        id={`fci-palette-item-${listIdx}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`fci-palette-resource-item${isActive ? ' fci-palette-cmd-active' : ''}`}
                        onClick={() => { onSelectResource(result); onClose() }}
                        onMouseEnter={() => setActiveIndex(listIdx)}
                      >
                        <span className={`fci-palette-resource-badge fci-gsb-${result.typeBadge}`}>
                          {result.typeBadge}
                        </span>
                        <span className="fci-palette-resource-name">{result.name}</span>
                        <span className="fci-palette-resource-subtitle">{result.subtitle}</span>
                      </button>
                    )
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer hint ───────────────────────────────────────────────── */}
        <div className="fci-palette-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵ Enter</kbd> execute</span>
          <span><kbd>Esc</kbd> close</span>
          {activeService && (
            <span className="fci-palette-active-svc">
              active: <strong>{activeService}</strong>
              {selectedRow && <> · selected: <strong>{selectedRow.name}</strong></>}
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
