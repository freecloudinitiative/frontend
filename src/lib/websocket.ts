/**
 * TerminalWebSocket — manages a WebSocket connection for the Xterm.js terminal.
 *
 * URL pattern: ws://<host>/ws/terminal/:vmId
 * Configurable base URL via VITE_WS_BASE_URL env var.
 *
 * Features:
 *  - Automatic reconnect on unexpected close (exponential back-off, max 3 retries by default).
 *  - Explicit onRetryExhausted callback fired when maxRetries is reached.
 *  - Clean disconnect() that suppresses reconnect and does NOT fire fallback callbacks.
 */

type DataCallback = (data: string) => void
type CloseCallback = () => void
type ErrorCallback = (event: Event) => void
type RetryExhaustedCallback = () => void

export interface TerminalWebSocketOptions {
  reconnect?: boolean
  maxRetries?: number
}

const BASE_URL = (import.meta.env.VITE_WS_BASE_URL as string | undefined) ?? 'ws://localhost:8080'

export class TerminalWebSocket {
  private url: string
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

  constructor(url: string, options: TerminalWebSocketOptions = {}) {
    this.url = url
    this.reconnect = options.reconnect ?? true
    this.maxRetries = options.maxRetries ?? 3
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  connect(): void {
    this.intentionalClose = false
    this._openSocket()
  }

  disconnect(): void {
    this.intentionalClose = true
    this._cancelRetry()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    }
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
    const ws = new WebSocket(this.url)
    this.ws = ws

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
 * Build a terminal WebSocket URL for a given VM ID.
 * e.g. buildTerminalWsUrl('abc-123') → 'ws://localhost:8080/ws/terminal/abc-123'
 */
export function buildTerminalWsUrl(vmId: string): string {
  return `${BASE_URL}/ws/terminal/${encodeURIComponent(vmId)}`
}
