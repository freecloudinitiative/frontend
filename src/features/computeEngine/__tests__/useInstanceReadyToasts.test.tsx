import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToastStore } from '@/store/toastStore'
import {
  resetInstanceReadyTracking,
  useInstanceReadyToasts,
} from '@/features/computeEngine/useInstanceReadyToasts'
import type { ComputeEngine, ComputeEngineStatus } from '@/features/computeEngine/types'

const mocks = vi.hoisted(() => ({ engines: undefined as ComputeEngine[] | undefined }))

// The hook's contract is about the *edge* between two polls, so the poll is
// what these cases drive directly. Standing up React Query and MSW would only
// add a way for the assertions to be about network timing instead.
vi.mock('@/features/computeEngine/hooks', () => ({
  useComputeEngines: () => ({ data: mocks.engines }),
}))

function engine(id: string, name: string, status: ComputeEngineStatus): ComputeEngine {
  return {
    id, name, status,
    cpu: 1, memory: 1024, disk: 12, diskType: 'SSD',
    ipAddress: status === 'running' ? '10.42.1.129' : null,
    os: 'Ubuntu 22.04', region: 'IST', zone: 'ist-a',
    instanceType: 'shared', autoBackups: false,
    createdAt: '2026-09-04T12:14:00Z',
  }
}

function messages() {
  return useToastStore.getState().toasts.map((toast) => toast.message)
}

beforeEach(() => {
  resetInstanceReadyTracking()
  useToastStore.setState({ toasts: [] })
  mocks.engines = undefined
})

describe('useInstanceReadyToasts', () => {
  it('announces an instance that finishes provisioning', () => {
    mocks.engines = [engine('a', 'xyzs', 'pending')]
    const { rerender } = renderHook(() => useInstanceReadyToasts())
    expect(messages()).toEqual([])

    act(() => { mocks.engines = [engine('a', 'xyzs', 'running')] })
    rerender()

    expect(messages()).toEqual(['The instance xyzs is now ready.'])
    expect(useToastStore.getState().toasts[0].type).toBe('success')
  })

  // A reload lands on instances that are already running. Announcing those
  // would replay news the customer has seen, once per page load.
  it('says nothing about an instance already running when first observed', () => {
    mocks.engines = [engine('a', 'xyzs', 'running')]
    const { rerender } = renderHook(() => useInstanceReadyToasts())
    rerender()

    expect(messages()).toEqual([])
  })

  it('announces once, not on every subsequent poll', () => {
    mocks.engines = [engine('a', 'xyzs', 'pending')]
    const { rerender } = renderHook(() => useInstanceReadyToasts())

    act(() => { mocks.engines = [engine('a', 'xyzs', 'running')] })
    rerender()
    act(() => { mocks.engines = [engine('a', 'xyzs', 'running')] })
    rerender()

    expect(messages()).toEqual(['The instance xyzs is now ready.'])
  })

  // DashboardOverview and DashboardPage both mount this against one shared
  // query. Two readers of the same transition must still produce one toast.
  it('does not double-announce when mounted more than once', () => {
    mocks.engines = [engine('a', 'xyzs', 'pending')]
    const first = renderHook(() => useInstanceReadyToasts())
    const second = renderHook(() => useInstanceReadyToasts())

    act(() => { mocks.engines = [engine('a', 'xyzs', 'running')] })
    first.rerender()
    second.rerender()

    expect(messages()).toEqual(['The instance xyzs is now ready.'])
  })

  it('announces a restart, which passes back through pending', () => {
    mocks.engines = [engine('a', 'xyzs', 'running')]
    const { rerender } = renderHook(() => useInstanceReadyToasts())

    act(() => { mocks.engines = [engine('a', 'xyzs', 'pending')] })
    rerender()
    act(() => { mocks.engines = [engine('a', 'xyzs', 'running')] })
    rerender()

    expect(messages()).toEqual(['The instance xyzs is now ready.'])
  })

  it('names each instance that becomes ready', () => {
    mocks.engines = [engine('a', 'xyzs', 'pending'), engine('b', 'other', 'pending')]
    const { rerender } = renderHook(() => useInstanceReadyToasts())

    act(() => { mocks.engines = [engine('a', 'xyzs', 'running'), engine('b', 'other', 'running')] })
    rerender()

    expect(messages()).toEqual([
      'The instance xyzs is now ready.',
      'The instance other is now ready.',
    ])
  })

  // A pending instance carrying a message has stopped progressing; the list
  // query stops polling it. It must not be announced as ready.
  it('says nothing while an instance is still pending', () => {
    mocks.engines = [engine('a', 'xyzs', 'pending')]
    const { rerender } = renderHook(() => useInstanceReadyToasts())

    act(() => { mocks.engines = [{ ...engine('a', 'xyzs', 'pending'), message: 'insufficient quota' }] })
    rerender()

    expect(messages()).toEqual([])
  })

  it('forgets an instance that disappears, so a reused id is announced again', () => {
    mocks.engines = [engine('a', 'xyzs', 'running')]
    const { rerender } = renderHook(() => useInstanceReadyToasts())

    act(() => { mocks.engines = [] })
    rerender()
    act(() => { mocks.engines = [engine('a', 'xyzs', 'pending')] })
    rerender()
    act(() => { mocks.engines = [engine('a', 'xyzs', 'running')] })
    rerender()

    expect(messages()).toEqual(['The instance xyzs is now ready.'])
  })
})
