import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { ServiceId } from '@/lib/mockServiceData'
import type { RoutedTab } from './constants'
import type { ToastType } from '@/store/toastStore'

/**
 * All the callbacks that the hook needs to perform its actions.
 * Passed in from DashboardPage so the hook stays pure (no direct state).
 */
export interface UseKeyboardShortcutsOptions {
  /** Disable all keyboard shortcuts (e.g. on mobile viewports) */
  disabled?: boolean
  /** Whether the Command Palette is currently open */
  commandPaletteOpen: boolean
  /** Open the Command Palette */
  openCommandPalette: () => void
  /** Close the Command Palette */
  closeCommandPalette: () => void
  /** Close any open modal in DashboardPage */
  closeModal: () => void
  /** Close profile / region dropdowns and service-box focus */
  closeDropdowns: () => void
  /** Ref to the global search bar <input> in the header */
  globalSearchRef: RefObject<HTMLInputElement | null>
  /** The currently selected row (null = nothing selected) */
  selectedRow: { id: string; name: string } | null
  /** The active service */
  activeService: ServiceId | null | undefined
  /** Navigate to a given service */
  selectService: (id: ServiceId) => void
  /** Navigate to a given tab slug */
  selectTab: (slug: RoutedTab) => void
  /** Open delete flow for the selected item in the active service */
  openDeleteFlow: () => void
  /** Show a toast message */
  addToast: (message: string, type: ToastType, duration?: number) => void
  /** Whether any modal is currently open */
  modalOpen: boolean
}

/**
 * Attaches global keyboard shortcuts to the document.
 * All shortcuts (except `/`, `a`, and `Escape`) are blocked when an
 * input / textarea / select is focused.
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    disabled,
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    closeModal,
    closeDropdowns,
    globalSearchRef,
    selectedRow,
    activeService,
    selectService,
    selectTab,
    openDeleteFlow,
    addToast,
    modalOpen,
  } = options

  useEffect(() => {
    if (disabled) return

    function isInputFocused(): boolean {
      const tag = document.activeElement?.tagName?.toUpperCase()
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key
      const ctrl = e.ctrlKey || e.metaKey

      // ── Escape ─────────────────────────────────────────────────────────────
      // Always fires — closes palette, modal, dropdowns, or blurs focused input
      if (key === 'Escape') {
        if (commandPaletteOpen) {
          closeCommandPalette()
          return
        }
        if (modalOpen) {
          closeModal()
          return
        }
        closeDropdowns()
        if (isInputFocused()) {
          ;(document.activeElement as HTMLElement).blur()
        }
        return
      }

      // ── `/` or `a` → open Command Palette ─────────────────────────────────
      // Fires even when an input is focused (it opens the palette overlay);
      // but only if the palette is not already open.
      if (!commandPaletteOpen && (key === '/' || key === 'a') && !isInputFocused()) {
        e.preventDefault()
        openCommandPalette()
        return
      }

      // ── All remaining shortcuts are blocked while an input is focused ──────
      if (isInputFocused()) return

      // ── Ctrl+S / Cmd+S → focus global search bar ──────────────────────────
      if (ctrl && key === 's') {
        e.preventDefault()
        globalSearchRef.current?.focus()
        globalSearchRef.current?.select()
        return
      }

      // ── Ctrl+C → copy selected row name to clipboard ───────────────────────
      if (ctrl && key === 'c') {
        if (selectedRow) {
          e.preventDefault()
          navigator.clipboard
            .writeText(selectedRow.name)
            .then(() => addToast(`Copied: ${selectedRow.name}`, 'success'))
            .catch(() => addToast('Copy failed', 'error'))
        }
        // No row selected → fall through to system copy (no preventDefault)
        return
      }

      // ── Ctrl+D → open delete confirmation modal ────────────────────────────
      if (ctrl && key === 'd') {
        if (selectedRow) {
          e.preventDefault()
          openDeleteFlow()
        }
        return
      }

      // ── Ctrl+I → switch to Info tab ────────────────────────────────────────
      if (ctrl && key === 'i') {
        if (selectedRow) {
          e.preventDefault()
          selectTab('info')
        }
        return
      }

      // ── Single-key service switches (V D I N S) ───────────────────────────
      // Only when no modifier keys are held and no input is focused
      if (!ctrl && !e.altKey && !e.shiftKey) {
        switch (key) {
          case 'v': case 'V':
            if (activeService !== 'VM')       { selectService('VM');       return }
            break
          case 'd': case 'D':
            if (activeService !== 'Database') { selectService('Database'); return }
            break
          case 'i': case 'I':
            if (activeService !== 'IAM')      { selectService('IAM');      return }
            break
          case 'n': case 'N':
            if (activeService !== 'Network')  { selectService('Network');  return }
            break
          case 's': case 'S':
            if (activeService !== 'Storage')  { selectService('Storage');  return }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    disabled,
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    closeModal,
    closeDropdowns,
    globalSearchRef,
    selectedRow,
    activeService,
    selectService,
    selectTab,
    openDeleteFlow,
    addToast,
    modalOpen,
  ])
}
