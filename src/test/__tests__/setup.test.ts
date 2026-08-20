/**
 * Guard test: ensures ProgressEvent and window.matchMedia are globally
 * available in every Vitest worker.
 *
 * @mswjs/interceptors evaluates
 *   `const SUPPORTS_PROGRESS_EVENT = typeof ProgressEvent !== "undefined"`
 * once at module load time. If this assertion fails it means polyfills.ts was
 * either not loaded or loaded after the interceptor module, which will cause
 * "ReferenceError: ProgressEvent is not defined" as an unhandled rejection
 * during any test that triggers MSW's XHR interceptor.
 *
 * window.matchMedia must exist because jsdom omits it. Without it @xterm/xterm
 * throws "TypeError: this._parentWindow.matchMedia is not a function" during
 * render, producing a console.error that races with Vitest worker teardown and
 * causes "EnvironmentTeardownError: Closing rpc while onUserConsoleLog was
 * pending" — reported as "Errors  1 error" in the full suite.
 *
 * This test is the lint canary: if someone removes or reorders polyfills.ts
 * from vite.config.ts setupFiles, this file fails loudly rather than the error
 * silently turning into a false-positive warning buried in CI output.
 */
import { describe, it, expect } from 'vitest'

describe('globalThis.ProgressEvent polyfill (src/test/polyfills.ts)', () => {
  it('is defined on globalThis', () => {
    expect(typeof globalThis.ProgressEvent).toBe('function')
  })

  it('is constructible with just a type string', () => {
    const ev = new globalThis.ProgressEvent('load')
    expect(ev.type).toBe('load')
    expect(ev.lengthComputable).toBe(false)
    expect(ev.loaded).toBe(0)
    expect(ev.total).toBe(0)
  })

  it('accepts ProgressEventInit fields', () => {
    const ev = new globalThis.ProgressEvent('progress', {
      lengthComputable: true,
      loaded: 42,
      total: 100,
    })
    expect(ev.lengthComputable).toBe(true)
    expect(ev.loaded).toBe(42)
    expect(ev.total).toBe(100)
  })

  it('is an instance of Event', () => {
    const ev = new globalThis.ProgressEvent('load')
    expect(ev instanceof Event).toBe(true)
  })
})

describe('window.matchMedia polyfill (src/test/polyfills.ts)', () => {
  it('is defined on window', () => {
    expect(typeof window.matchMedia).toBe('function')
  })

  it('returns a MediaQueryList-shaped object', () => {
    const mql = window.matchMedia('(max-width: 768px)')
    expect(mql).toBeDefined()
    expect(typeof mql.matches).toBe('boolean')
    expect(typeof mql.media).toBe('string')
    expect(mql.media).toBe('(max-width: 768px)')
  })

  it('defaults matches to false (headless environment has no viewport)', () => {
    const mql = window.matchMedia('(max-width: 1450px)')
    expect(mql.matches).toBe(false)
  })
})

describe('globalThis.ResizeObserver polyfill (src/test/polyfills.ts)', () => {
  it('is defined on globalThis', () => {
    expect(typeof globalThis.ResizeObserver).toBe('function')
  })

  it('is instantiable and exposes observe/unobserve/disconnect', () => {
    const ro = new globalThis.ResizeObserver(() => {})
    expect(typeof ro.observe).toBe('function')
    expect(typeof ro.unobserve).toBe('function')
    expect(typeof ro.disconnect).toBe('function')
  })
})
