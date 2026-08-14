import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { createMockShell } from './mockShell'
import { TerminalWebSocket } from '@/lib/websocket'
import { isProductionRuntime } from '@/lib/runtimeConfig'

interface TerminalViewProps {
  mode?: 'mock' | 'websocket'
  computeEngineId?: string
  computeEngineName?: string
  title?: string
  hideActions?: boolean
  /** WebSocket URL for 'websocket' mode (e.g. ws://host/ws/terminal/:ceId) */
  wsUrl?: string
  /** Called for every connection attempt so reconnects receive a fresh ticket. */
  wsUrlFactory?: () => Promise<string>
}

export function TerminalView({ mode = 'mock', computeEngineId, computeEngineName, title = 'Serial Console', hideActions = false, wsUrl, wsUrlFactory }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
    const websocketTarget = wsUrlFactory ?? wsUrl
    if (!websocketTarget) return

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

    const ws = new TerminalWebSocket(websocketTarget, { reconnect: true, maxRetries: 3 })

    // WebSocket → terminal
    ws.onData((data) => {
      terminal.write(data)
    })

    // Unexpected close while retrying — inform user
    ws.onClose(() => {
      terminal.write('\r\n[Connection lost. Reconnecting...]\r\n')
    })

    // Never disguise a failed production session as a functioning mock shell.
    ws.onRetryExhausted(() => {
      if (isProductionRuntime()) {
        terminal.write('\r\n[Connection failed. Console session closed.]\r\n')
      } else {
        terminal.write('\r\n[Connection failed. Falling back to mock mode.]\r\n')
        terminal.dispose()
        setEffectiveMode('mock')
      }
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
  }, [effectiveMode, wsUrl, wsUrlFactory])

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
    const url = `/console/${encodeURIComponent(computeEngineId ?? computeEngineName ?? 'ce-instance')}`
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

  // In websocket mode with no URL supplied, show a clear error rather than a blank canvas.
  const terminalBody =
    effectiveMode === 'websocket' && !wsUrl && !wsUrlFactory ? (
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
