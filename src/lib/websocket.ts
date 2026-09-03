/**
 * TerminalWebSocket — manages a WebSocket connection for the Xterm.js terminal.
 *
 * URL pattern: ws://<host>/ws/terminal/:ceId?ticket=<opaque>
 * Base URL comes from the container runtime config (`wsBaseUrl`).
 *
 * Features:
 *  - Automatic reconnect on unexpected close (exponential back-off, max 3 retries by default).
 *  - Explicit onRetryExhausted callback fired when maxRetries is reached.
 *  - Clean disconnect() that suppresses reconnect and does NOT fire fallback callbacks.
 *  - URL is resolved via an async provider on every open attempt. Because
 *    terminal-gateway redeems tickets via GetDel (single-use), each retry
 *    must obtain a fresh ticket — the provider is called once per attempt.
 */

import { getRuntimeConfig } from '@/lib/runtimeConfig'

type DataCallback = (data: string) => void
type CloseCallback = () => void
type ErrorCallback = (event: Event) => void
type RetryExhaustedCallback = () => void

/** Async factory called once per socket-open attempt. Must resolve to a full WebSocket URL. */
export type UrlProvider = () => Promise<string>

export interface TerminalWebSocketOptions {
  reconnect?: boolean
  maxRetries?: number
}

export class TerminalWebSocket {
  private urlProvider: UrlProvider
  private reconnect: boolean
  private maxRetries: number

  private ws: WebSocket | null = null
  private retryCount = 0
  private retryTimer: ReturnType<typeof setTimeout> | null = null

  /** True after an explicit disconnect() call — suppresses all reconnect/callback logic. */
  private intentionalClose = false

  private dataCallback: DataCallback | null = null
  private closeCallback: CloseCallback | null = null
  private errorCallback: ErrorCallback | null = null
  private retryExhaustedCallback: RetryExhaustedCallback | null = null

  constructor(urlProvider: UrlProvider, options: TerminalWebSocketOptions = {}) {
    this.urlProvider = urlProvider
    this.reconnect = options.reconnect ?? true
    this.maxRetries = options.maxRetries ?? 3
  }

  private sendQueue: string[] = []
  private readonly maxQueueSize = 100

  /**
   * Latest terminal size, resent on every (re)connect. Unlike keystrokes a
   * resize is not queued: only the newest one matters, and a reconnected
   * session starts a fresh PTY at the default 80x24 that must be corrected
   * again.
   */
  private pendingResize: { cols: number; rows: number } | null = null

  // ── Public API ─────────────────────────────────────────────────────────────

  connect(): void {
    this.intentionalClose = false
    this._openSocket()
  }

  disconnect(): void {
    this.intentionalClose = true
    this.sendQueue = []
    this._cancelRetry()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    } else if (!this.intentionalClose) {
      // Buffer input typed while connecting / reconnecting (bounded to maxQueueSize)
      if (this.sendQueue.length >= this.maxQueueSize) {
        this.sendQueue.shift()
      }
      this.sendQueue.push(data)
    }
  }

  /**
   * Tell the server the terminal's size, as a FrameControl (0x01) binary
   * frame carrying a JSON ControlMessage — the wire format
   * terminal-gateway's internal/ws/protocol.go defines. Keystrokes stay
   * unprefixed strings, which that parser reads as raw input.
   *
   * Without this the PTY keeps its default 80 columns however wide the
   * browser terminal is drawn, so the shell wraps its line early and
   * redraws over the prompt.
   */
  sendResize(cols: number, rows: number): void {
    this.pendingResize = { cols, rows }
    this._flushResize()
  }

  private _flushResize(): void {
    if (!this.pendingResize) return
    if (this.ws?.readyState !== WebSocket.OPEN) return
    const body = JSON.stringify({ type: 'resize', ...this.pendingResize })
    const encoded = new TextEncoder().encode(body)
    const frame = new Uint8Array(encoded.length + 1)
    frame[0] = 0x01
    frame.set(encoded, 1)
    this.ws.send(frame)
  }

  onData(callback: DataCallback): void {
    this.dataCallback = callback
  }

  onClose(callback: CloseCallback): void {
    this.closeCallback = callback
  }

  onError(callback: ErrorCallback): void {
    this.errorCallback = callback
  }

  onRetryExhausted(callback: RetryExhaustedCallback): void {
    this.retryExhaustedCallback = callback
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private _openSocket(): void {
    // Resolve the URL asynchronously (each call mints a fresh ticket).
    this.urlProvider()
      .then((url) => {
        // If disconnect() was called while the provider was in flight, discard
        // the resolved URL and do not open a socket.
        if (this.intentionalClose) return

        const ws = new WebSocket(url)
        this.ws = ws

        ws.onopen = () => {
          // Size first. A reconnect gets a brand-new PTY at the default 80
          // columns, and anything typed while the socket was opening is
          // waiting in the queue -- delivered before the resize, the shell
          // would echo and wrap it at the wrong width, which is the very
          // thing this frame exists to prevent.
          this._flushResize()

          // Flush buffered messages upon open
          while (this.sendQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
            const queued = this.sendQueue.shift()
            if (queued !== undefined) {
              this.ws.send(queued)
            }
          }
        }

        ws.onmessage = (event: MessageEvent) => {
          if (this.dataCallback) {
            this.dataCallback(event.data as string)
          }
        }

        ws.onclose = (event: CloseEvent) => {
          // Intentional close (component unmount / explicit disconnect) — do nothing.
          if (this.intentionalClose) return

          if (this.closeCallback) {
            this.closeCallback()
          }

          if (this.reconnect && this.retryCount < this.maxRetries) {
            this._scheduleRetry()
          } else if (!event.wasClean) {
            // Unexpected close and retries exhausted (or reconnect disabled).
            this._onRetryExhausted()
          }
        }

        ws.onerror = (event: Event) => {
          if (this.intentionalClose) return
          if (this.errorCallback) {
            this.errorCallback(event)
          }
        }
      })
      .catch((err: unknown) => {
        // Provider rejection (e.g. failed ticket mint). Route to the error
        // callback so callers can show a toast, then follow the normal retry
        // path (if retries remain) so reconnect behaviour is unchanged.
        if (this.intentionalClose) return

        if (this.errorCallback) {
          // Synthesise an ErrorEvent so the existing callback signature is satisfied.
          const syntheticEvent = new ErrorEvent('error', {
            message: err instanceof Error ? err.message : 'Failed to obtain WebSocket URL',
            error: err,
          })
          this.errorCallback(syntheticEvent)
        }

        if (this.reconnect && this.retryCount < this.maxRetries) {
          this._scheduleRetry()
        } else {
          this._onRetryExhausted()
        }
      })
  }

  private _scheduleRetry(): void {
    this.retryCount++
    // Exponential back-off: 1s, 2s, 4s …
    const delayMs = 1000 * Math.pow(2, this.retryCount - 1)
    this.retryTimer = setTimeout(() => {
      if (!this.intentionalClose) {
        this._openSocket()
      }
    }, delayMs)
  }

  private _cancelRetry(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  private _onRetryExhausted(): void {
    if (this.retryExhaustedCallback) {
      this.retryExhaustedCallback()
    }
  }
}

/**
 * An explicitly empty wsBaseUrl is a supported production configuration: nginx
 * proxies /ws/ same-origin, so the terminal gateway needs no separate host
 * (see getProductionConfigErrors in runtimeConfig.ts, which accepts this case
 * without error). Derive the same-origin ws:/wss: equivalent of the current
 * page instead of guessing — never fall back to a hardcoded host in the
 * browser, since that silently points production traffic at the developer's
 * own machine.
 */
function deriveSameOriginWsBase(): string {
  if (typeof window === 'undefined') return 'ws://localhost:8080'
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

/**
 * Build a terminal WebSocket URL for a given Compute Engine ID and a
 * single-use ticket.  The ticket is appended as a query parameter because
 * browsers cannot set an Authorization header on a WebSocket upgrade.
 *
 * e.g. buildTerminalWsUrl('abc-123', 'tok-xyz')
 *   → 'wss://console.example.com/ws/terminal/abc-123?ticket=tok-xyz'
 *
 * The base URL is resolved per call rather than once at module scope: in the
 * container the value arrives via /config.js, which may not have been applied
 * to `window.__FCI_CONFIG__` at the time this module is first evaluated.
 */
export function buildTerminalWsUrl(ceId: string, ticket: string): string {
  const configured = getRuntimeConfig().wsBaseUrl
  const baseUrl = (configured || deriveSameOriginWsBase()).replace(/\/+$/, '')
  return `${baseUrl}/ws/terminal/${encodeURIComponent(ceId)}?ticket=${encodeURIComponent(ticket)}`
}
