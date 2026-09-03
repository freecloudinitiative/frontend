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
  sentMessages: (string | Uint8Array)[] = []

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    // Simulate async connection open
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) this.onopen()
    }, 0)
  }

  send(data: string | Uint8Array) {
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a provider that resolves synchronously (on the next microtask). */
function makeProvider(url: string) {
  return () => Promise.resolve(url)
}

/** Returns a provider that rejects with the given error. */
function makeFailingProvider(message = 'mint failed') {
  return () => Promise.reject(new Error(message))
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

  // ── buildTerminalWsUrl ──────────────────────────────────────────────────────

  describe('buildTerminalWsUrl', () => {
    afterEach(() => {
      delete window.__FCI_CONFIG__
    })

    it('constructs correct URL pattern', () => {
      const url = buildTerminalWsUrl('ce-123', 'tok-abc')
      expect(url).toContain('/ws/terminal/ce-123')
    })

    it('appends ?ticket= query parameter', () => {
      window.__FCI_CONFIG__ = { wsBaseUrl: 'wss://console.example.com' }
      const url = buildTerminalWsUrl('ce-1', 'my-ticket')
      expect(url).toBe('wss://console.example.com/ws/terminal/ce-1?ticket=my-ticket')
    })

    it('URL-encodes the ticket value', () => {
      window.__FCI_CONFIG__ = { wsBaseUrl: 'wss://console.example.com' }
      const ticket = 'tok/with special=chars&more'
      const url = buildTerminalWsUrl('ce-1', ticket)
      expect(url).toContain(`?ticket=${encodeURIComponent(ticket)}`)
      // Must NOT contain raw special characters in the ticket portion
      expect(url).not.toContain('tok/with special')
    })

    it('uses the configured wsBaseUrl verbatim when present', () => {
      window.__FCI_CONFIG__ = { wsBaseUrl: 'wss://console.example.com' }
      expect(buildTerminalWsUrl('ce-1', 'tok')).toBe('wss://console.example.com/ws/terminal/ce-1?ticket=tok')
    })

    it('trims a trailing slash from the configured base to avoid a double slash', () => {
      window.__FCI_CONFIG__ = { wsBaseUrl: 'wss://console.example.com/' }
      expect(buildTerminalWsUrl('ce-1', 'tok')).toBe('wss://console.example.com/ws/terminal/ce-1?ticket=tok')
    })

    it('derives a same-origin ws: base when wsBaseUrl is empty and real terminal is enabled', () => {
      window.__FCI_CONFIG__ = { enableRealTerminal: true, wsBaseUrl: '' }
      // jsdom's default test origin is http://localhost:3000
      expect(buildTerminalWsUrl('ce-1', 'tok')).toBe(`ws://${window.location.host}/ws/terminal/ce-1?ticket=tok`)
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

      expect(buildTerminalWsUrl('ce-1', 'tok')).toBe(`wss://${originalLocation.host}/ws/terminal/ce-1?ticket=tok`)

      Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
    })

    it('never falls back to a hardcoded localhost host when a base is configured empty', () => {
      window.__FCI_CONFIG__ = { enableRealTerminal: true, wsBaseUrl: '' }
      expect(buildTerminalWsUrl('ce-1', 'tok')).not.toContain('localhost:8080')
    })
  })

  // ── Provider invocation contract ────────────────────────────────────────────

  it('provider is invoked once per open attempt: three retries mint three tickets', async () => {
    const provider = vi.fn().mockResolvedValue('ws://localhost:8080/ws/terminal/ce-1?ticket=tok')
    const ws = new TerminalWebSocket(provider, { reconnect: true, maxRetries: 3 })

    ws.connect()

    // First open — provider called once; await microtask queue so the promise resolves
    await Promise.resolve()
    expect(provider).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(10) // trigger MockWebSocket onopen

    // Unexpected close #1 → schedules retry
    MockWebSocket.instances[0].simulateUnexpectedClose()
    vi.advanceTimersByTime(1000) // 1s backoff
    await Promise.resolve()
    expect(provider).toHaveBeenCalledTimes(2)

    // Unexpected close #2 → schedules retry
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[1].simulateUnexpectedClose()
    vi.advanceTimersByTime(2000) // 2s backoff
    await Promise.resolve()
    expect(provider).toHaveBeenCalledTimes(3)
  })

  it('a rejecting provider fires onError with no unhandled rejection', async () => {
    const provider = makeFailingProvider('ticket service unavailable')
    const ws = new TerminalWebSocket(provider, { reconnect: false })
    const onError = vi.fn()
    ws.onError(onError)

    ws.connect()

    // A rejected Promise needs two microtask flushes:
    // tick 1 — the Promise itself rejects
    // tick 2 — the .catch() handler in _openSocket() executes
    await Promise.resolve()
    await Promise.resolve()

    expect(onError).toHaveBeenCalledTimes(1)
    const event = onError.mock.calls[0][0] as ErrorEvent
    expect(event.message).toContain('ticket service unavailable')
    // No socket should have been created
    expect(MockWebSocket.instances.length).toBe(0)
  })

  it('disconnect() during an in-flight provider call opens no socket', async () => {
    let resolveProvider!: (url: string) => void
    const provider = () =>
      new Promise<string>((resolve) => {
        resolveProvider = resolve
      })

    const ws = new TerminalWebSocket(provider, { reconnect: false })
    ws.connect()

    // Provider is now in flight; disconnect before it resolves
    ws.disconnect()

    // Now resolve the provider
    resolveProvider('ws://localhost:8080/ws/terminal/ce-1?ticket=tok')
    await Promise.resolve()

    // No socket should have been opened
    expect(MockWebSocket.instances.length).toBe(0)
  })

  // ── Existing connection tests (adapted for urlProvider) ─────────────────────

  it('connects to WebSocket and receives messages', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'))
    const onData = vi.fn()
    ws.onData(onData)

    ws.connect()
    await Promise.resolve() // resolve provider
    vi.advanceTimersByTime(10)

    const socketInstance = MockWebSocket.instances[0]
    expect(socketInstance.url).toBe('ws://localhost:8080/ws/terminal/ce-1')

    socketInstance.simulateMessage('welcome banner\r\n')
    expect(onData).toHaveBeenCalledWith('welcome banner\r\n')
  })

  it('sends data when connection is open', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'))
    ws.connect()
    await Promise.resolve()
    vi.advanceTimersByTime(10)

    const socketInstance = MockWebSocket.instances[0]
    ws.send('ls -la\r')

    expect(socketInstance.sentMessages).toEqual(['ls -la\r'])
  })

  it('buffers data sent while CONNECTING and flushes on socket open', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'))
    ws.connect()

    // Send while provider is still resolving (no socket yet)
    ws.send('early command\r')

    await Promise.resolve() // socket created (readyState = CONNECTING)
    const socketInstance = MockWebSocket.instances[0]
    expect(socketInstance.sentMessages).toEqual([])

    // Advance timer to trigger onopen
    vi.advanceTimersByTime(10)

    // Should flush buffered input
    expect(socketInstance.sentMessages).toEqual(['early command\r'])
  })

  it('reconnects automatically with backoff on unexpected close', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'), {
      reconnect: true,
      maxRetries: 3,
    })
    const onClose = vi.fn()
    ws.onClose(onClose)

    ws.connect()
    await Promise.resolve()
    vi.advanceTimersByTime(10)
    expect(MockWebSocket.instances.length).toBe(1)

    // Unexpected close #1 (1s backoff)
    MockWebSocket.instances[0].simulateUnexpectedClose()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(MockWebSocket.instances.length).toBe(1)

    vi.advanceTimersByTime(1000)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(2)

    // Unexpected close #2 (2s backoff)
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[1].simulateUnexpectedClose()
    expect(onClose).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(2000)
    await Promise.resolve()
    expect(MockWebSocket.instances.length).toBe(3)
  })

  it('emits onRetryExhausted when maxRetries is reached', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'), {
      reconnect: true,
      maxRetries: 2,
    })
    const onRetryExhausted = vi.fn()
    ws.onRetryExhausted(onRetryExhausted)

    ws.connect()
    await Promise.resolve()
    vi.advanceTimersByTime(10)

    // Retry #1
    MockWebSocket.instances[0].simulateUnexpectedClose()
    vi.advanceTimersByTime(1000)
    await Promise.resolve()

    // Retry #2
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[1].simulateUnexpectedClose()
    vi.advanceTimersByTime(2000)
    await Promise.resolve()

    // Final unexpected close when max retries exceeded
    vi.advanceTimersByTime(10)
    MockWebSocket.instances[2].simulateUnexpectedClose()

    expect(onRetryExhausted).toHaveBeenCalledTimes(1)
  })

  it('disconnect() prevents reconnect attempts and suppresses callbacks', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'), {
      reconnect: true,
      maxRetries: 3,
    })
    const onClose = vi.fn()
    const onRetryExhausted = vi.fn()
    ws.onClose(onClose)
    ws.onRetryExhausted(onRetryExhausted)

    ws.connect()
    await Promise.resolve()
    vi.advanceTimersByTime(10)

    // Explicit clean disconnect
    ws.disconnect()
    vi.advanceTimersByTime(5000)

    // Should NOT trigger onClose or reconnect or onRetryExhausted
    expect(onClose).not.toHaveBeenCalled()
    expect(onRetryExhausted).not.toHaveBeenCalled()
    expect(MockWebSocket.instances.length).toBe(1)
  })
  it('sends a resize as a 0x01-prefixed control frame the gateway can parse', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'))
    ws.connect()
    await Promise.resolve()
    vi.advanceTimersByTime(10)

    ws.sendResize(120, 30)

    const frame = MockWebSocket.instances[0].sentMessages.at(-1)
    expect(frame).toBeInstanceOf(Uint8Array)
    const bytes = frame as Uint8Array
    // FrameControl, per terminal-gateway internal/ws/protocol.go. Keystrokes
    // stay unprefixed strings, so the prefix is what separates the two.
    expect(bytes[0]).toBe(0x01)
    expect(JSON.parse(new TextDecoder().decode(bytes.slice(1)))).toEqual({
      type: 'resize',
      cols: 120,
      rows: 30,
    })
  })

  it('restates the size on reconnect, since the new PTY starts at the default', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'), {
      reconnect: true,
      maxRetries: 3,
    })
    ws.connect()
    await Promise.resolve()
    vi.advanceTimersByTime(10)
    ws.sendResize(120, 30)

    MockWebSocket.instances[0].simulateUnexpectedClose()
    vi.advanceTimersByTime(5000)
    await Promise.resolve()
    vi.advanceTimersByTime(10)

    const resent = MockWebSocket.instances[1].sentMessages.filter(
      (m): m is Uint8Array => m instanceof Uint8Array && m[0] === 0x01,
    )
    expect(resent).toHaveLength(1)
  })

  it('sizes the PTY before delivering input that was typed while connecting', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'))
    ws.connect()
    // Order as a user produces it: they resize, then type, both before open.
    ws.sendResize(120, 30)
    ws.send('whoami\r')
    await Promise.resolve()
    vi.advanceTimersByTime(10)

    // Input delivered to a PTY still at its default 80 columns is echoed and
    // wrapped at the wrong width -- the exact defect the resize frame exists
    // to prevent -- so the resize has to go first.
    const sent = MockWebSocket.instances[0].sentMessages
    const resizeAt = sent.findIndex((m) => m instanceof Uint8Array)
    const inputAt = sent.indexOf('whoami\r')
    expect(resizeAt).toBeGreaterThanOrEqual(0)
    expect(inputAt).toBeGreaterThanOrEqual(0)
    expect(resizeAt).toBeLessThan(inputAt)
  })

  it('holds a resize sent before the socket opens and delivers it on open', async () => {
    const ws = new TerminalWebSocket(makeProvider('ws://localhost:8080/ws/terminal/ce-1'))
    ws.connect()
    ws.sendResize(100, 40)
    await Promise.resolve()
    vi.advanceTimersByTime(10)

    const frames = MockWebSocket.instances[0].sentMessages.filter(
      (m): m is Uint8Array => m instanceof Uint8Array,
    )
    expect(frames).toHaveLength(1)
    expect(JSON.parse(new TextDecoder().decode(frames[0].slice(1))).cols).toBe(100)
  })
})
