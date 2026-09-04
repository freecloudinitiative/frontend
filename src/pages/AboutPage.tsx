import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconButton } from '@/components/ui/IconButton'

export function AboutPage() {
  const navigate = useNavigate()
  const goBack = () => navigate('/dashboard')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        e.preventDefault()
        goBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goBack])

  return (
    <div
      className="fci-app-container"
      style={{
        minHeight: '100vh',
        background: 'var(--dash-bg)',
        color: 'var(--dash-text)',
        fontFamily: "'Courier New', Courier, monospace",
        padding: '24px 16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid var(--dash-border)',
            paddingBottom: '12px',
          }}
        >
          <IconButton
            variant="back"
            placement="inline"
            onClick={goBack}
            title="Back to Dashboard"
            ariaLabel="Back to Dashboard"
          />
          <div style={{ color: 'var(--dash-label)', fontSize: '13px', letterSpacing: '0.08em' }}>
            FREE CLOUD INITIATIVE // TECHNICAL MANIFESTO
          </div>
        </div>

        {/* 1. Mission Statement */}
        <div className="fci-box fci-panel-titled" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div className="fci-box-label">[ MISSION_STATEMENT ]</div>
          <p style={{ margin: '0 0 10px 0', lineHeight: 1.6, color: 'var(--dash-text)' }}>
            Free Cloud Initiative exists to democratize enterprise cloud infrastructure management through lightweight, ultra-responsive, retro Terminal User Interfaces (TUI).
          </p>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--dash-text-dim)', fontSize: '13px' }}>
            Modern cloud consoles have become bloated with Javascript overhead, multi-megabyte bundles, and sluggish navigation. We believe developers and system architects deserve high-throughput tools that render instantly, run flawlessly on modest hardware, and prioritize keyboard-driven flow.
          </p>
        </div>

        {/* 2. Architectural Decisions */}
        <div className="fci-box fci-panel-titled" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div className="fci-box-label">[ ARCHITECTURAL_DECISIONS ]</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ color: 'var(--dash-label)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                » Zero-Bloat State Architecture
              </div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                TanStack Query manages asynchronous server state caching, background invalidation, and optimistic mutations. Zustand provides fast, lightweight UI state management without React context re-render thrashing.
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--dash-label)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                » Pure CSS TUI Design System
              </div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                Zero heavy UI framework abstractions. The entire interface is built using standard HTML5 semantic elements and targeted plain CSS custom properties (`--dash-*`), delivering pristine retro monospace terminal boxes with floating top labels.
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--dash-label)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                » Deterministic MSW & WebSocket Layer
              </div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                Mock Service Worker (MSW) intercepts network traffic to deliver robust mock REST endpoints. WebSocket streaming bridges Xterm.js to live serial terminal environments behind feature toggles.
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--dash-label)', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                » Flat Tab Bed Routing
              </div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '13px', lineHeight: 1.5 }}>
                Resource-scoped URL routing (`/services/:serviceId/:resourceId/:tab`) provides durable deep links to instance views, instant keyboard tab switching, and seamless back/forward browser history support.
              </div>
            </div>
          </div>
        </div>

        {/* 3. Performance Commitments */}
        <div className="fci-box fci-panel-titled" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div className="fci-box-label">[ PERFORMANCE_COMMITMENTS ]</div>
          <div className="fci-metricrow" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '11px' }}>RENDER LATENCY</div>
              <div style={{ color: '#7ec87e', fontSize: '18px', fontWeight: 'bold' }}>&lt; 50ms</div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '12px' }}>Sub-50ms UI update loop</div>
            </div>
            <div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '11px' }}>BUNDLE STRATEGY</div>
              <div style={{ color: 'var(--dash-accent)', fontSize: '18px', fontWeight: 'bold' }}>CODE-SPLIT</div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '12px' }}>Lazy loaded Monaco & Xterm</div>
            </div>
            <div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '11px' }}>CSS OVERHEAD</div>
              <div style={{ color: '#7ec87e', fontSize: '18px', fontWeight: 'bold' }}>ZERO-JS</div>
              <div style={{ color: 'var(--dash-text-dim)', fontSize: '12px' }}>Zero runtime CSS-in-JS costs</div>
            </div>
          </div>
        </div>

        {/* 4. Open Source Philosophy & Tech Stack Matrix */}
        <div className="fci-box fci-panel-titled" style={{ marginBottom: '24px', padding: '16px 20px' }}>
          <div className="fci-box-label">[ TECH_STACK_MATRIX ]</div>
          <table className="fci-table" style={{ width: '100%', marginTop: '8px' }}>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Technology</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--dash-label)' }}>Frontend Framework</td>
                <td>React 18 + TypeScript (Strict)</td>
                <td style={{ color: 'var(--dash-text-dim)' }}>Type-safe UI component architecture</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--dash-label)' }}>Data Layer</td>
                <td>TanStack Query v5 + TanStack Table v8</td>
                <td style={{ color: 'var(--dash-text-dim)' }}>Server cache invalidation & high-perf tables</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--dash-label)' }}>Terminal & Charts</td>
                <td>Xterm.js + Recharts</td>
                <td style={{ color: 'var(--dash-text-dim)' }}>Serial console emulator & metrics visualization</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--dash-label)' }}>Auth & Mocking</td>
                <td>Authentik OIDC + MSW v2</td>
                <td style={{ color: 'var(--dash-text-dim)' }}>Standardized auth tokens & mock REST API</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', marginTop: '12px', paddingBottom: '24px' }}>
          <button
            type="button"
            className="fci-btn fci-btn-primary"
            onClick={goBack}
          >
            Return to Dashboard Console
          </button>
        </div>
      </div>
    </div>
  )
}
