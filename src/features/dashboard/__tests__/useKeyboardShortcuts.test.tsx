/**
 * useKeyboardShortcuts hook unit tests
 * Tests shortcut key event listener, input focus guards, mobile disable flag, and action dispatchers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useKeyboardShortcuts, type UseKeyboardShortcutsOptions } from '../useKeyboardShortcuts'
import { useRef } from 'react'

function TestComponent({ options }: { options: Partial<UseKeyboardShortcutsOptions> }) {
  const dummyInputRef = useRef<HTMLInputElement>(null)
  const defaultOptions: UseKeyboardShortcutsOptions = {
    commandPaletteOpen: false,
    openCommandPalette: vi.fn(),
    closeCommandPalette: vi.fn(),
    closeModal: vi.fn(),
    closeDropdowns: vi.fn(),
    globalSearchRef: dummyInputRef,
    selectedRow: { id: 'row-1', name: 'my-instance' },
    selectTab: vi.fn(),
    openDeleteFlow: vi.fn(),
    addToast: vi.fn(),
    modalOpen: false,
    ...options,
  }

  useKeyboardShortcuts(defaultOptions)

  return (
    <div>
      <input ref={dummyInputRef} data-testid="global-search" type="text" />
      <input data-testid="regular-input" type="text" />
    </div>
  )
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('triggers openCommandPalette when "/" or "a" key is pressed', () => {
    const openCommandPalette = vi.fn()
    render(<TestComponent options={{ openCommandPalette }} />)

    fireEvent.keyDown(document, { key: '/' })
    expect(openCommandPalette).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'a' })
    expect(openCommandPalette).toHaveBeenCalledTimes(2)
  })

  it('triggers closeCommandPalette when Escape is pressed while palette is open', () => {
    const closeCommandPalette = vi.fn()
    render(<TestComponent options={{ commandPaletteOpen: true, closeCommandPalette }} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closeCommandPalette).toHaveBeenCalledTimes(1)
  })

  it('triggers closeModal when Escape is pressed while modal is open', () => {
    const closeModal = vi.fn()
    render(<TestComponent options={{ modalOpen: true, closeModal }} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closeModal).toHaveBeenCalledTimes(1)
  })

  it('does not treat ordinary document typing as a service shortcut', () => {
    render(<TestComponent options={{}} />)

    for (const key of 'SELECT') {
      fireEvent.keyDown(document, { key })
    }

    expect(document.activeElement).toBe(document.body)
  })

  it('triggers openDeleteFlow on Ctrl+D when a row is selected', () => {
    const openDeleteFlow = vi.fn()
    render(<TestComponent options={{ selectedRow: { id: '1', name: 'item-1' }, openDeleteFlow }} />)

    fireEvent.keyDown(document, { key: 'd', ctrlKey: true })
    expect(openDeleteFlow).toHaveBeenCalledTimes(1)
  })

  it('triggers selectTab("info") on Ctrl+I when a row is selected', () => {
    const selectTab = vi.fn()
    render(<TestComponent options={{ selectedRow: { id: '1', name: 'item-1' }, selectTab }} />)

    fireEvent.keyDown(document, { key: 'i', ctrlKey: true })
    expect(selectTab).toHaveBeenCalledWith('info')
  })

  it('copies selected row name on Ctrl+C and invokes addToast', async () => {
    const addToast = vi.fn()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: writeTextMock },
    })

    render(
      <TestComponent
        options={{
          selectedRow: { id: '1', name: 'my-database' },
          addToast,
        }}
      />
    )

    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })

    expect(writeTextMock).toHaveBeenCalledWith('my-database')
    await Promise.resolve()
    expect(addToast).toHaveBeenCalledWith('Copied: my-database', 'success')
  })

  it('handles Ctrl+C gracefully and triggers copy-failed toast when clipboard API is unavailable', () => {
    const addToast = vi.fn()
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: undefined,
    })

    render(
      <TestComponent
        options={{
          selectedRow: { id: '1', name: 'my-database' },
          addToast,
        }}
      />
    )

    fireEvent.keyDown(document, { key: 'c', ctrlKey: true })

    expect(addToast).toHaveBeenCalledWith('Copy failed', 'error')
  })

  it('does NOT trigger single-key service switches when disabled is true (mobile mode)', () => {
    const openCommandPalette = vi.fn()
    render(<TestComponent options={{ disabled: true, openCommandPalette }} />)

    fireEvent.keyDown(document, { key: '/' })
    fireEvent.keyDown(document, { key: 'd' })
    fireEvent.keyDown(document, { key: 's', ctrlKey: true })

    expect(openCommandPalette).not.toHaveBeenCalled()
  })

  it('leaves ordinary typing alone when an input element is active/focused', () => {
    const openCommandPalette = vi.fn()
    const { getByTestId } = render(<TestComponent options={{ openCommandPalette }} />)

    const input = getByTestId('regular-input')
    input.focus()

    fireEvent.keyDown(document, { key: 'd' })
    expect(openCommandPalette).not.toHaveBeenCalled()
  })
})
