import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { createMockShell } from './mockShell'
import { TerminalWebSocket, type UrlProvider } from '@/lib/websocket'
import { useToastStore } from '@/store/toastStore'

interface TerminalViewProps {
  mode?: 'mock' | 'websocket'
  computeEngineName?: string
  title?: string
  hideActions?: boolean
  /**
   * Async factory that resolves to a fully-qualified WebSocket URL
   * (including the ?ticket= query parameter).
   * Called once per connection attempt so every retry mints a fresh ticket.
   * Required in 'websocket' mode; ignored in 'mock' mode.
   */
  urlProvider?: UrlProvider
}

export function TerminalView({
  mode = 'mock',
  computeEngineName,
  title = 'Serial Console',
  hideActions = false,
  urlProvider,
}: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const addToast = useToastStore((state) => state.addToast)

  // When retry is exhausted we fall back to mock mode internally.
  const [effectiveMode, setEffectiveMode] = useState<'mock' | 'websocket'>(mode)

  // Reset effective mode when the prop changes (e.g. flag toggled at runtime).
  useEffect(() => {
    setEffectiveMode(mode)
  }, [mode])

  // ── Mock mode ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (effectiveMode !== 'mock') return
    const container = containerRef.current
    if (!container) return

    const terminal = new Terminal({
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: '#0a0a0a',
        foreground: '#dcdcdc',
        cursor: '#7ec87e',
        selectionBackground: '#1e3a52',
      },
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)

    const safeFit = () => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        fitAddon.fit()
      }
    }
    safeFit()

    const shell = createMockShell(computeEngineName ?? 'ce-instance')
    let line = ''

    terminal.writeln(shell.getWelcomeBanner())
    terminal.write(`\r\n${shell.getPrompt()}`)

    const disposable = terminal.onData((data) => {
      // Process char-by-char: paste events deliver multi-char chunks, not just single keystrokes.
      for (const ch of data) {
        if (ch === '\r') {
          terminal.write('\r\n')
          const { output, clear } = shell.runCommand(line)
          if (clear) {
            terminal.clear()
          } else if (output) {
            terminal.write(`${output.replace(/\n/g, '\r\n')}\r\n`)
          }
          terminal.write(shell.getPrompt())
          line = ''
          continue
        }

        if (ch === '\x7f') {
          if (line.length > 0) {
            line = line.slice(0, -1)
            terminal.write('\b \b')
          }
          continue
        }

        if (ch === '\x03') {
          terminal.write('^C\r\n')
          terminal.write(shell.getPrompt())
          line = ''
          continue
        }

        if (ch >= ' ' && ch <= '~') {
          line += ch
          terminal.write(ch)
        }
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      safeFit()
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      disposable.dispose()
      terminal.dispose()
    }
  }, [effectiveMode, computeEngineName])

  // ── WebSocket mode ───────────────────────────────────────────────────────
  useEffect(() => {
    if (effectiveMode !== 'websocket') return
    if (!urlProvider) return

    const container = containerRef.current
    if (!container) return

    const terminal = new Terminal({
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: '#0a0a0a',
        foreground: '#dcdcdc',
        cursor: '#7ec87e',
        selectionBackground: '#1e3a52',
      },
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)

    const safeFit = () => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        fitAddon.fit()
      }
    }
    safeFit()

    const ws = new TerminalWebSocket(urlProvider, { reconnect: true, maxRetries: 3 })

    // WebSocket → terminal
    ws.onData((data) => {
      terminal.write(data)
    })

    // Unexpected close while retrying — inform user
    ws.onClose(() => {
      terminal.write('\r\n[Connection lost. Reconnecting...]\r\n')
    })

    // Provider rejection (failed ticket mint) or socket error — surface to user
    ws.onError((event) => {
      const message =
        event instanceof ErrorEvent && event.message
          ? `Console connection error: ${event.message}`
          : 'Console connection error. Please try again.'
      addToast(message, 'error', 6000)
    })

    // All retries exhausted — fall back to mock mode
    ws.onRetryExhausted(() => {
      addToast('Could not connect to console after multiple attempts. Falling back to simulation mode.', 'error', 8000)
      terminal.write('\r\n[Connection failed. Falling back to mock mode.]\r\n')
      terminal.dispose()
      setEffectiveMode('mock')
    })

    // Terminal input → WebSocket
    const disposable = terminal.onData((data) => {
      ws.send(data)
    })

    const resizeObserver = new ResizeObserver(() => {
      safeFit()
    })
    resizeObserver.observe(container)

    ws.connect()

    return () => {
      // Intentional unmount/cleanup — disconnect without triggering fallback
      ws.disconnect()
      resizeObserver.disconnect()
      disposable.dispose()
      terminal.dispose()
    }
  }, [effectiveMode, urlProvider, addToast])

  // ── Keyboard: exit fullscreen ────────────────────────────────────────────
  useEffect(() => {
    if (!isFullscreen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  function openInNewTab() {
    const url = `/console/${encodeURIComponent(computeEngineName ?? 'ce-instance')}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const header = !hideActions && (
    <div className="fci-terminal-header">
      <span className="fci-section-title" style={{ position: 'static' }}>{title}</span>
      <div className="fci-terminal-actions">
        <button
          type="button"
          className="fci-terminal-btn"
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          onClick={() => setIsFullscreen((value) => !value)}
        >
          {isFullscreen ? '⤦' : '⛶'}
        </button>
        <button
          type="button"
          className="fci-terminal-btn"
          title="Open in new tab"
          onClick={openInNewTab}
        >
          ↗
        </button>
      </div>
    </div>
  )

  // In websocket mode with no provider supplied, show a clear error rather than a blank canvas.
  const terminalBody =
    effectiveMode === 'websocket' && !urlProvider ? (
      <div className="fci-terminal-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-dim)' }}>
        WebSocket URL not configured.
      </div>
    ) : (
      <div ref={containerRef} className="fci-terminal-container" role="group" aria-label={title} />
    )

  if (isFullscreen) {
    return (
      <div className="fci-terminal-fullscreen">
        {header}
        {terminalBody}
      </div>
    )
  }

  return (
    <div className="fci-terminal-wrapper">
      {header}
      {terminalBody}
    </div>
  )
}
