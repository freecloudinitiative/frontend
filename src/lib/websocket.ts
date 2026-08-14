/**
 * TerminalWebSocket — manages a WebSocket connection for the Xterm.js terminal.
 *
 * URL pattern: wss://<host>/ws/terminal/:ceId?ticket=<short-lived-ticket>
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
type WebSocketUrlFactory = () => Promise<string>

export interface TerminalWebSocketOptions {
  reconnect?: boolean
  maxRetries?: number
}

import { getRuntimeConfig } from '@/lib/runtimeConfig'

export class TerminalWebSocket {
  private url: string | WebSocketUrlFactory
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

  constructor(url: string | WebSocketUrlFactory, options: TerminalWebSocketOptions = {}) {
    this.url = url
    this.reconnect = options.reconnect ?? true
    this.maxRetries = options.maxRetries ?? 3
  }

  private sendQueue: string[] = []
  private readonly maxQueueSize = 100

  // ── Public API ─────────────────────────────────────────────────────────────

  connect(): void {
    this.intentionalClose = false
    void this._openSocket()
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

  private async _openSocket(): Promise<void> {
    let resolvedUrl: string
    try {
      resolvedUrl = typeof this.url === 'function' ? await this.url() : this.url
    } catch {
      if (this.intentionalClose) return
      this.errorCallback?.(new Event('error'))
      if (this.reconnect && this.retryCount < this.maxRetries) this._scheduleRetry()
      else this._onRetryExhausted()
      return
    }

    if (this.intentionalClose) return
    const ws = new WebSocket(resolvedUrl)
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
        void this._openSocket()
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
 * Build an authenticated terminal WebSocket URL. The ticket is deliberately
 * short-lived and scoped by the backend to one user and Compute Engine.
 */
export function buildTerminalWsUrl(ceId: string, ticket: string): string {
  if (!ticket) throw new Error('A console session ticket is required')
  const configuredBase = getRuntimeConfig().wsBaseUrl
  const sameOriginBase = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  const baseUrl = configuredBase || sameOriginBase
  return `${baseUrl}/ws/terminal/${encodeURIComponent(ceId)}?ticket=${encodeURIComponent(ticket)}`
}
