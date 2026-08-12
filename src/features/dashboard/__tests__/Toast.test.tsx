import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastContainer } from '@/features/dashboard/Toast'
import { useToastStore } from '@/store/toastStore'

describe('ToastContainer — PR #25 Toast Component UI & Lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('1.1: renders success toast with correct icon, class, and accessibility attributes', () => {
    useToastStore.getState().addToast('Compute Engine created successfully', 'success')
    render(<ToastContainer />)

    const toastElement = screen.getByRole('alert')
    expect(toastElement).toBeDefined()
    expect(toastElement.classList.contains('fci-toast-success')).toBe(true)
    expect(toastElement.getAttribute('aria-live')).toBe('assertive')
    expect(screen.getByText('✓')).toBeDefined()
    expect(screen.getByText('Compute Engine created successfully')).toBeDefined()
  })

  it('1.2: renders error toast with red icon and error class', () => {
    useToastStore.getState().addToast('Operation failed', 'error')
    render(<ToastContainer />)

    const toastElement = screen.getByRole('alert')
    expect(toastElement.classList.contains('fci-toast-error')).toBe(true)
    expect(screen.getByText('✗')).toBeDefined()
    expect(screen.getByText('Operation failed')).toBeDefined()
  })

  it('1.3: renders info toast with blue icon and info class', () => {
    useToastStore.getState().addToast('Compute Engine status updated', 'info')
    render(<ToastContainer />)

    const toastElement = screen.getByRole('alert')
    expect(toastElement.classList.contains('fci-toast-info')).toBe(true)
    expect(screen.getByText('ℹ')).toBeDefined()
    expect(screen.getByText('Compute Engine status updated')).toBeDefined()
  })

  it('3.1: auto-dismisses toast after 3000ms', () => {
    useToastStore.getState().addToast('Auto dismiss toast', 'success', 3000)
    render(<ToastContainer />)

    expect(screen.getByText('Auto dismiss toast')).toBeDefined()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('dismisses toast manually when clicked', () => {
    useToastStore.getState().addToast('Click to dismiss', 'info')
    render(<ToastContainer />)

    const toastElement = screen.getByRole('alert')
    fireEvent.click(toastElement)

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('dismisses toast via native close button click', () => {
    useToastStore.getState().addToast('Close button test', 'info')
    render(<ToastContainer />)

    const closeButton = screen.getByRole('button', { name: 'Dismiss notification' })
    fireEvent.click(closeButton)

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('dismisses toast via keyboard (Enter / Space key)', () => {
    useToastStore.getState().addToast('Keyboard dismiss test', 'info')
    render(<ToastContainer />)

    const toastElement = screen.getByRole('alert')
    fireEvent.keyDown(toastElement, { key: 'Enter' })

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('3.2: renders multiple toasts stacked vertically', () => {
    useToastStore.getState().addToast('First Toast', 'success')
    useToastStore.getState().addToast('Second Toast', 'error')
    useToastStore.getState().addToast('Third Toast', 'info')

    render(<ToastContainer />)

    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(3)
    expect(alerts[0].textContent).toContain('First Toast')
    expect(alerts[1].textContent).toContain('Second Toast')
    expect(alerts[2].textContent).toContain('Third Toast')
  })
})
