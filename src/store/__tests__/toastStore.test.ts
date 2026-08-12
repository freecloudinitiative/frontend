import { describe, it, expect, beforeEach } from 'vitest'
import { useToastStore } from '@/store/toastStore'

describe('toastStore — PR #25 Toast State Management', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('5.1: addToast adds a toast with auto-generated unique ID and default 3000ms duration', () => {
    useToastStore.getState().addToast('Compute Engine created successfully', 'success')
    const toasts = useToastStore.getState().toasts

    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Compute Engine created successfully')
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].duration).toBe(3000)
    expect(typeof toasts[0].id).toBe('number')
  })

  it('5.2: addToast with custom duration sets duration correctly', () => {
    useToastStore.getState().addToast('Custom duration info', 'info', 5000)
    const toasts = useToastStore.getState().toasts

    expect(toasts).toHaveLength(1)
    expect(toasts[0].duration).toBe(5000)
    expect(toasts[0].type).toBe('info')
  })

  it('5.3: removeToast removes a toast by ID', () => {
    const store = useToastStore.getState()
    store.addToast('Toast 1', 'info')
    store.addToast('Toast 2', 'error')

    const toastsBefore = useToastStore.getState().toasts
    expect(toastsBefore).toHaveLength(2)
    const firstId = toastsBefore[0].id

    useToastStore.getState().removeToast(firstId)
    const toastsAfter = useToastStore.getState().toasts

    expect(toastsAfter).toHaveLength(1)
    expect(toastsAfter[0].message).toBe('Toast 2')
  })

  it('3.2 & 3.3: supports multiple simultaneous toasts with unique IDs', () => {
    const store = useToastStore.getState()
    store.addToast('Success toast', 'success')
    store.addToast('Error toast', 'error')
    store.addToast('Info toast', 'info')

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(3)

    const ids = new Set(toasts.map((t) => t.id))
    expect(ids.size).toBe(3)
  })
})
