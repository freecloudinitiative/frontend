import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TerminalView } from '../TerminalView'

// Fake WebSocket implementation to control events in component tests
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  static instances: MockWebSocket[] = []
  url: string
  readyState: number = 0
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: { wasClean: boolean; code: number; reason: string }) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    setTimeout(() => {
      this.readyState = 1
    }, 0)
  }

  send = vi.fn()
  close = vi.fn().mockImplementation(() => {
    this.readyState = 3
    if (this.onclose) {
      this.onclose({ wasClean: true, code: 1000, reason: 'Closed' })
    }
  })

  simulateMessage(data: string) {
    if (this.onmessage) this.onmessage({ data })
  }

  simulateClose(wasClean = false) {
    this.readyState = 3
    if (this.onclose) this.onclose({ wasClean, code: 1006, reason: 'Connection dropped' })
  }
}

// Track Terminal instance methods to assert terminal.write calls
const mockTerminalWrite = vi.fn()
const mockTerminalDispose = vi.fn()

vi.mock('@xterm/xterm', () => {
  return {
    Terminal: class {
      open = vi.fn()
      loadAddon = vi.fn()
      write = mockTerminalWrite
      writeln = vi.fn()
      clear = vi.fn()
      dispose = mockTerminalDispose
      onData = vi.fn().mockReturnValue({ dispose: vi.fn() })
    },
  }
})

vi.mock('@xterm/addon-fit', () => {
  return {
    FitAddon: class {
      fit = vi.fn()
    },
  }
})

globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

describe('TerminalView — Reconnect & Fallback Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    MockWebSocket.instances = []
    mockTerminalWrite.mockClear()
    mockTerminalDispose.mockClear()
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('displays reconnecting message on unexpected WebSocket closure', async () => {
    render(
      <TerminalView
        mode="websocket"
        wsUrl="ws://localhost:8080/ws/terminal/vm-42"
        vmName="test-vm"
      />,
    )

    // Open connection
    vi.advanceTimersByTime(10)
    expect(MockWebSocket.instances.length).toBe(1)

    // Trigger unexpected close
    MockWebSocket.instances[0].simulateClose(false)

    // Should write reconnecting notice
    expect(mockTerminalWrite).toHaveBeenCalledWith('\r\n[Connection lost. Reconnecting...]\r\n')
  })

  it('falls back to mock mode when maxRetries are exhausted', () => {
    render(
      <TerminalView
        mode="websocket"
        wsUrl="ws://localhost:8080/ws/terminal/vm-42"
        vmName="test-vm"
      />,
    )

    // Open connection
    vi.advanceTimersByTime(10)

    // Fail attempt #1
    MockWebSocket.instances[0].simulateClose(false)
    vi.advanceTimersByTime(1000)

    // Fail attempt #2
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[1].simulateClose(false)
    vi.advanceTimersByTime(2000)

    // Fail attempt #3
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[2].simulateClose(false)
    vi.advanceTimersByTime(4000)

    // Fail attempt #4 (maxRetries = 3 exhausted)
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[3].simulateClose(false)

    // Should display failure message
    expect(mockTerminalWrite).toHaveBeenCalledWith(
      '\r\n[Connection failed. Falling back to mock mode.]\r\n',
    )
  })

  it('unmounting during active WebSocket connection performs clean disconnect without triggering retry exhaustion', () => {
    const { unmount } = render(
      <TerminalView
        mode="websocket"
        wsUrl="ws://localhost:8080/ws/terminal/vm-42"
        vmName="test-vm"
      />,
    )

    vi.advanceTimersByTime(10)
    expect(MockWebSocket.instances.length).toBe(1)

    unmount()

    // Advancing timer after unmount should NOT trigger any new WebSocket instances or fallback text
    vi.advanceTimersByTime(10000)
    expect(mockTerminalWrite).not.toHaveBeenCalledWith(
      '\r\n[Connection failed. Falling back to mock mode.]\r\n',
    )
  })
})
