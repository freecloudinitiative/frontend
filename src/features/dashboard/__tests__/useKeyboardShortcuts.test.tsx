/**
 * useKeyboardShortcuts hook unit tests
 * Tests shortcut key event listener, input focus guards, mobile disable flag, and action dispatchers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
    activeService: 'VM',
    selectService: vi.fn(),
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

  it('triggers selectService when service single key (v, d, i, n, s) is pressed', () => {
    const selectService = vi.fn()
    render(<TestComponent options={{ activeService: 'VM', selectService }} />)

    fireEvent.keyDown(document, { key: 'd' })
    expect(selectService).toHaveBeenCalledWith('Database')

    fireEvent.keyDown(document, { key: 'i' })
    expect(selectService).toHaveBeenCalledWith('IAM')

    fireEvent.keyDown(document, { key: 'n' })
    expect(selectService).toHaveBeenCalledWith('Network')

    fireEvent.keyDown(document, { key: 's' })
    expect(selectService).toHaveBeenCalledWith('Storage')
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
    Object.assign(navigator, {
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

  it('does NOT trigger single-key service switches when disabled is true (mobile mode)', () => {
    const selectService = vi.fn()
    const openCommandPalette = vi.fn()
    render(<TestComponent options={{ disabled: true, selectService, openCommandPalette }} />)

    fireEvent.keyDown(document, { key: '/' })
    fireEvent.keyDown(document, { key: 'd' })
    fireEvent.keyDown(document, { key: 's', ctrlKey: true })

    expect(openCommandPalette).not.toHaveBeenCalled()
    expect(selectService).not.toHaveBeenCalled()
  })

  it('blocks single-key shortcuts when an input element is active/focused', () => {
    const selectService = vi.fn()
    const { getByTestId } = render(<TestComponent options={{ selectService }} />)

    const input = getByTestId('regular-input')
    input.focus()

    fireEvent.keyDown(document, { key: 'd' })
    expect(selectService).not.toHaveBeenCalled()
  })
})
