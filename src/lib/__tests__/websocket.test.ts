import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildTerminalWsUrl, TerminalWebSocket } from '../websocket'

// ── Mock WebSocket Server / Client Fake ─────────────────────────────────────
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  static instances: MockWebSocket[] = []
  url: string
  readyState: number = 0 // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
  onmessage: ((event: { data: unknown }) => void) | null = null
  onopen: (() => void) | null = null
  onclose: ((event: { wasClean: boolean; code: number; reason: string }) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  sentMessages: string[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    // Simulate async connection open
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) this.onopen()
    }, 0)
  }

  send(data: string) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = 3
    if (this.onclose) {
      this.onclose({ wasClean: true, code: 1000, reason: 'Normal closure' })
    }
  }

  // Helper for test assertions: simulate backend sending data to client
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage({ data })
    }
  }

  // Helper for test assertions: simulate unexpected drop
  simulateUnexpectedClose() {
    this.readyState = 3
    if (this.onclose) {
      this.onclose({ wasClean: false, code: 1006, reason: 'Abnormal Closure' })
    }
  }

  // Helper for test assertions: simulate socket error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

describe('TerminalWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('buildTerminalWsUrl constructs correct URL pattern', () => {
    const url = buildTerminalWsUrl('ce-123')
    expect(url).toContain('/ws/terminal/ce-123')
  })

  describe('buildTerminalWsUrl base resolution', () => {
    afterEach(() => {
      delete window.__FCI_CONFIG__
    })

    it('uses the configured wsBaseUrl verbatim when present', () => {
      window.__FCI_CONFIG__ = { wsBaseUrl: 'wss://console.example.com' }
      expect(buildTerminalWsUrl('ce-1')).toBe('wss://console.example.com/ws/terminal/ce-1')
    })

    it('trims a trailing slash from the configured base to avoid a double slash', () => {
      window.__FCI_CONFIG__ = { wsBaseUrl: 'wss://console.example.com/' }
      expect(buildTerminalWsUrl('ce-1')).toBe('wss://console.example.com/ws/terminal/ce-1')
    })

    it('derives a same-origin ws: base when wsBaseUrl is empty and real terminal is enabled', () => {
      window.__FCI_CONFIG__ = { enableRealTerminal: true, wsBaseUrl: '' }
      // jsdom's default test origin is http://localhost:3000
      expect(buildTerminalWsUrl('ce-1')).toBe(`ws://${window.location.host}/ws/terminal/ce-1`)
    })

    it('derives a same-origin wss: base when the page is served over https', () => {
      const originalLocation = window.location
      // jsdom's window.location.protocol isn't directly writable; replace the
      // whole object for the duration of this test.
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, protocol: 'https:', host: originalLocation.host },
        writable: true,
        configurable: true,
      })
      window.__FCI_CONFIG__ = { enableRealTerminal: true, wsBaseUrl: '' }

      expect(buildTerminalWsUrl('ce-1')).toBe(`wss://${originalLocation.host}/ws/terminal/ce-1`)

      Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
    })

    it('never falls back to a hardcoded localhost host when a base is configured empty', () => {
      window.__FCI_CONFIG__ = { enableRealTerminal: true, wsBaseUrl: '' }
      expect(buildTerminalWsUrl('ce-1')).not.toContain('localhost:8080')
    })
  })

  it('connects to WebSocket and receives messages', async () => {
    const ws = new TerminalWebSocket('ws://localhost:8080/ws/terminal/ce-1')
    const onData = vi.fn()
    ws.onData(onData)

    ws.connect()
    vi.advanceTimersByTime(10)

    const socketInstance = MockWebSocket.instances[0]
    expect(socketInstance.url).toBe('ws://localhost:8080/ws/terminal/ce-1')

    socketInstance.simulateMessage('welcome banner\r\n')
    expect(onData).toHaveBeenCalledWith('welcome banner\r\n')
  })

  it('sends data when connection is open', () => {
    const ws = new TerminalWebSocket('ws://localhost:8080/ws/terminal/ce-1')
    ws.connect()
    vi.advanceTimersByTime(10)

    const socketInstance = MockWebSocket.instances[0]
    ws.send('ls -la\r')

    expect(socketInstance.sentMessages).toEqual(['ls -la\r'])
  })

  it('buffers data sent while CONNECTING and flushes on socket open', () => {
    const ws = new TerminalWebSocket('ws://localhost:8080/ws/terminal/ce-1')
    ws.connect()

    // Send while CONNECTING (readyState = 0)
    ws.send('early command\r')

    const socketInstance = MockWebSocket.instances[0]
    expect(socketInstance.sentMessages).toEqual([])

    // Advance timer to trigger onopen
    vi.advanceTimersByTime(10)

    // Should flush buffered input
    expect(socketInstance.sentMessages).toEqual(['early command\r'])
  })

  it('reconnects automatically with backoff on unexpected close', () => {
    const ws = new TerminalWebSocket('ws://localhost:8080/ws/terminal/ce-1', {
      reconnect: true,
      maxRetries: 3,
    })
    const onClose = vi.fn()
    ws.onClose(onClose)

    ws.connect()
    vi.advanceTimersByTime(10)
    expect(MockWebSocket.instances.length).toBe(1)

    // Unexpected close #1 (1s backoff)
    MockWebSocket.instances[0].simulateUnexpectedClose()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(MockWebSocket.instances.length).toBe(1)

    vi.advanceTimersByTime(1000)
    expect(MockWebSocket.instances.length).toBe(2)

    // Unexpected close #2 (2s backoff)
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[1].simulateUnexpectedClose()
    expect(onClose).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(2000)
    expect(MockWebSocket.instances.length).toBe(3)
  })

  it('emits onRetryExhausted when maxRetries is reached', () => {
    const ws = new TerminalWebSocket('ws://localhost:8080/ws/terminal/ce-1', {
      reconnect: true,
      maxRetries: 2,
    })
    const onRetryExhausted = vi.fn()
    ws.onRetryExhausted(onRetryExhausted)

    ws.connect()
    vi.advanceTimersByTime(10)

    // Retry #1
    MockWebSocket.instances[0].simulateUnexpectedClose()
    vi.advanceTimersByTime(1000)

    // Retry #2
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[1].simulateUnexpectedClose()
    vi.advanceTimersByTime(2000)

    // Final unexpected close when max retries exceeded
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[2].simulateUnexpectedClose()

    expect(onRetryExhausted).toHaveBeenCalledTimes(1)
  })

  it('disconnect() prevents reconnect attempts and suppresses callbacks', () => {
    const ws = new TerminalWebSocket('ws://localhost:8080/ws/terminal/ce-1', {
      reconnect: true,
      maxRetries: 3,
    })
    const onClose = vi.fn()
    const onRetryExhausted = vi.fn()
    ws.onClose(onClose)
    ws.onRetryExhausted(onRetryExhausted)

    ws.connect()
    vi.advanceTimersByTime(10)

    // Explicit clean disconnect
    ws.disconnect()
    vi.advanceTimersByTime(5000)

    // Should NOT trigger onClose or reconnect or onRetryExhausted
    expect(onClose).not.toHaveBeenCalled()
    expect(onRetryExhausted).not.toHaveBeenCalled()
    expect(MockWebSocket.instances.length).toBe(1)
  })
})
