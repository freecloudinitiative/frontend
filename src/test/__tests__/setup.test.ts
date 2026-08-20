/**
 * Guard tests: ensures ProgressEvent, window.matchMedia, and ResizeObserver
 * are globally available in every Vitest worker via src/test/polyfills.ts.
 *
 * If any of these assertions fail it means polyfills.ts was removed, reordered,
 * or incorrectly guarded — which would cause:
 *   - "ReferenceError: ProgressEvent is not defined" (unhandled rejection from
 *     @mswjs/interceptors createEvent() when SUPPORTS_PROGRESS_EVENT is stale)
 *   - "EnvironmentTeardownError: Closing rpc while 'onUserConsoleLog' was pending"
 *     (from xterm/matchMedia or ResizeObserver throws racing with worker teardown)
 *
 * These tests fail loudly rather than the error silently becoming a false-positive
 * warning buried in CI output.
 */
import { describe, it, expect } from 'vitest'

describe('globalThis.ProgressEvent polyfill (src/test/polyfills.ts)', () => {
  it('is defined on globalThis', () => {
    expect(typeof globalThis.ProgressEvent).toBe('function')
  })

  it('is our polyfill class — unconditionally assigned even when native ProgressEvent exists', () => {
    // polyfills.ts must NOT use `if (typeof globalThis.ProgressEvent === 'undefined')`.
    // On Node 18+, a native ProgressEvent exists and satisfies that typeof check, so the
    // guard would skip our assignment. But the native class is unreachable as a bare
    // identifier inside @mswjs/interceptors' VM execution context in Vitest workers,
    // causing "ReferenceError: ProgressEvent is not defined" in CI.
    // Our polyfill class must always be on globalThis so the bare identifier resolves
    // to the same object the interceptor cached in SUPPORTS_PROGRESS_EVENT.
    const ev = new globalThis.ProgressEvent('test')
    expect(ev).toBeInstanceOf(Event)
    expect(typeof ev.lengthComputable).toBe('boolean')
    expect(typeof ev.loaded).toBe('number')
    expect(typeof ev.total).toBe('number')
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
