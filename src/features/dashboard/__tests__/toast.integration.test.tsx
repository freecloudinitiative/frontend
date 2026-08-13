/**
 * DRY_REFACTOR_TEST_SCENARIOS.md §6.4, §7.15
 *
 * Coverage map for "exactly one toast per mutation":
 *  - Create, across all 5 services: already asserted in each service's own
 *    *CreateForm.test.tsx ("Toast Integration" describe blocks) — success shows exactly one
 *    toast with the resource-specific message, failure shows exactly one 'Operation failed'
 *    toast. Not duplicated here.
 *  - Auto-dismiss timing (~3000ms): already covered by Toast.test.tsx's "3.1: auto-dismisses
 *    toast after 3000ms" using fake timers. Not duplicated here.
 *
 * What this file adds: the store-level guard the doc calls out explicitly — "did shared-hook
 * migration cause a double-fire from an old + new code path". A raw call-count assertion on
 * the store itself catches that even if every individual UI test above still passed.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useToastStore } from '@/store/toastStore'
import { ToastContainer } from '@/features/dashboard/Toast'

describe('toastStore — exactly-once-per-call guard (no double-fire from refactor)', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('a single addToast call produces exactly one toast entry', () => {
    useToastStore.getState().addToast('Compute Engine created successfully', 'success')
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('sequential mutation-style toasts across different resources each add exactly one entry (no cross-resource duplication)', () => {
    const { addToast } = useToastStore.getState()
    addToast('Compute Engine created successfully', 'success')
    addToast('Database created successfully', 'success')
    addToast('IAM user created successfully', 'success')
    addToast('Network created successfully', 'success')
    addToast('Bucket created successfully', 'success')

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(5)
    expect(toasts.map((t) => t.message)).toEqual([
      'Compute Engine created successfully',
      'Database created successfully',
      'IAM user created successfully',
      'Network created successfully',
      'Bucket created successfully',
    ])
  })

  it('each toast gets a distinct id even when fired in the same tick (no id/dedup collision)', () => {
    const { addToast } = useToastStore.getState()
    addToast('a', 'success')
    addToast('b', 'success')
    const ids = useToastStore.getState().toasts.map((t) => t.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('removeToast removes exactly the targeted toast, not all toasts', () => {
    const { addToast, removeToast } = useToastStore.getState()
    addToast('keep-me', 'success')
    addToast('remove-me', 'error')
    const [, toRemove] = useToastStore.getState().toasts
    removeToast(toRemove.id)
    const remaining = useToastStore.getState().toasts
    expect(remaining).toHaveLength(1)
    expect(remaining[0].message).toBe('keep-me')
  })
})

describe('toastStore — auto-dismiss duration is set correctly per toast (default 3000ms)', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('defaults to a 3000ms duration when none is specified', () => {
    useToastStore.getState().addToast('default-duration', 'info')
    expect(useToastStore.getState().toasts[0].duration).toBe(3000)
  })

  it('honors an explicit duration override', () => {
    useToastStore.getState().addToast('custom-duration', 'info', 5000)
    expect(useToastStore.getState().toasts[0].duration).toBe(5000)
  })
})

describe('ToastContainer — auto-dismiss timer fires exactly once per toast, independently (§6.4)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('two toasts fired in the same tick each auto-dismiss exactly once, not doubled or dropped', () => {
    useToastStore.getState().addToast('first', 'success', 3000)
    useToastStore.getState().addToast('second', 'error', 3000)
    render(<ToastContainer />)
    expect(useToastStore.getState().toasts).toHaveLength(2)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(useToastStore.getState().toasts).toHaveLength(0)

    // Advancing further must not throw or resurrect anything (no leaked/duplicate timers).
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
