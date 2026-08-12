import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore } from '@/store/themeStore'
import type { ServiceId } from '@/lib/mockServiceData'
import { serviceIdToSlug } from '@/lib/mockServiceData'

// ── Command definitions ───────────────────────────────────────────────────────

interface PaletteCommand {
  prefix: string
  description: string
  category: 'nav' | 'action'
  danger?: boolean
}

const COMMANDS: PaletteCommand[] = [
  // Service navigation
  { prefix: ':vm',  description: 'Switch to Virtual Machines', category: 'nav' },
  { prefix: ':db',  description: 'Switch to Database',         category: 'nav' },
  { prefix: ':iam', description: 'Switch to IAM',              category: 'nav' },
  { prefix: ':net', description: 'Switch to Network',          category: 'nav' },
  { prefix: ':str', description: 'Switch to Storage',          category: 'nav' },
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
}: CommandPaletteProps) {
  const theme = useThemeStore((state) => state.theme)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset query + selection whenever the palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(-1)
      const raf = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(raf)
    }
  }, [isOpen])

  // Reset active index whenever the filtered list changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  if (!isOpen) return null

  // ── Filter commands by current query ─────────────────────────────────────
  const filtered =
    query.trim() === ''
      ? COMMANDS
      : COMMANDS.filter(
          (c) =>
            c.prefix.includes(query.toLowerCase()) ||
            c.description.toLowerCase().includes(query.toLowerCase())
        )

  // ── Check if query exactly matches a command prefix ───────────────────────
  const exactMatch = COMMANDS.find((c) => c.prefix === query.trim().toLowerCase())

  // ── Execute a command ─────────────────────────────────────────────────────
  function executeCommand(cmd: PaletteCommand) {
    switch (cmd.prefix) {
      case ':vm':  selectService('VM');       break
      case ':db':  selectService('Database'); break
      case ':iam': selectService('IAM');      break
      case ':net': selectService('Network');  break
      case ':str': selectService('Storage');  break
      case ':crt': {
        const slug = activeService ? serviceIdToSlug(activeService) : 'vm'
        navigate(`/services/${slug}/create`)
        break
      }
      case ':dlt': {
        if (selectedRow) openDeleteFlow()
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
      if (filtered.length === 0) return
      const next = activeIndex < filtered.length - 1 ? activeIndex + 1 : 0
      setActiveIndex(next)
      scrollItemIntoView(next)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filtered.length === 0) return
      const prev = activeIndex > 0 ? activeIndex - 1 : filtered.length - 1
      setActiveIndex(prev)
      scrollItemIntoView(prev)
      return
    }

    if (e.key === 'Enter') {
      // Priority: arrow-highlighted > exact prefix match > single result
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        executeCommand(filtered[activeIndex])
      } else if (exactMatch) {
        executeCommand(exactMatch)
      } else if (filtered.length === 1) {
        executeCommand(filtered[0])
      }
    }
  }

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
        <div className="fci-palette-input-wrap">
          <span className="fci-palette-prompt">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            className="fci-palette-input"
            placeholder="Type a command prefix, e.g. :vm  :db  :crt  :dlt …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

        {/* ── Command list ───────────────────────────────────────────────── */}
        <div
          ref={listRef}
          id="fci-palette-listbox"
          className="fci-palette-commands"
          role="listbox"
          aria-label="Available commands"
        >
          {filtered.length === 0 ? (
            <div className="fci-palette-no-results">No matching commands</div>
          ) : (
            filtered.map((cmd, idx) => {
              const isHighlighted = idx === activeIndex
              const isExact = !isHighlighted && cmd.prefix === query.trim().toLowerCase()
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
            })
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
