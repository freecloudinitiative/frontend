/**
 * TerminalWebSocket — manages a WebSocket connection for the Xterm.js terminal.
 *
 * URL pattern: ws://<host>/ws/terminal/:ceId
 * Base URL comes from the container runtime config (`wsBaseUrl`).
 *
 * Features:
 *  - Automatic reconnect on unexpected close (exponential back-off, max 3 retries by default).
 *  - Explicit onRetryExhausted callback fired when maxRetries is reached.
 *  - Clean disconnect() that suppresses reconnect and does NOT fire fallback callbacks.
 */

import { getRuntimeConfig } from '@/lib/runtimeConfig'

type DataCallback = (data: string) => void
type CloseCallback = () => void
type ErrorCallback = (event: Event) => void
type RetryExhaustedCallback = () => void

export interface TerminalWebSocketOptions {
  reconnect?: boolean
  maxRetries?: number
}

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

  private sendQueue: string[] = []
  private readonly maxQueueSize = 100

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

    ws.onopen = () => {
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
 * Build a terminal WebSocket URL for a given Compute Engine ID.
 * e.g. buildTerminalWsUrl('abc-123') → 'wss://console.example.com/ws/terminal/abc-123'
 *
 * The base URL is resolved per call rather than once at module scope: in the
 * container the value arrives via /config.js, which may not have been applied
 * to `window.__FCI_CONFIG__` at the time this module is first evaluated.
 */
export function buildTerminalWsUrl(ceId: string): string {
  const configured = getRuntimeConfig().wsBaseUrl
  const baseUrl = (configured || deriveSameOriginWsBase()).replace(/\/+$/, '')
  return `${baseUrl}/ws/terminal/${encodeURIComponent(ceId)}`
}
