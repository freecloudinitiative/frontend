/**
 * Global polyfills required before any test module is imported.
 *
 * This file is listed FIRST in vite.config.ts test.setupFiles so that every
 * Vitest worker loads it before any other module. The ordering matters:
 * @mswjs/interceptors caches `SUPPORTS_PROGRESS_EVENT = typeof ProgressEvent !== "undefined"`
 * as a module-level const at import time. If ProgressEvent is not on globalThis
 * when the interceptor is first evaluated, it falls back to its own polyfill
 * and the real ProgressEvent class (added later by jsdom) is never used.
 * That mismatch causes "ReferenceError: ProgressEvent is not defined" when the
 * interceptor later calls `new ProgressEvent(...)` after the module has already
 * set SUPPORTS_PROGRESS_EVENT = false.
 *
 * Fix strategy: polyfill ProgressEvent here, unconditionally, with no imports
 * (so this file has no side-effects that could trigger the interceptor itself).
 * Once this file runs, any subsequent import of @mswjs/interceptors will see
 * SUPPORTS_PROGRESS_EVENT = true and use the native-ish class.
 *
 * Why not upgrade msw? msw 2.15.0 is the current latest 2.x release; no patch
 * is available that changes this behaviour. The interceptor deliberately keeps
 * its own ProgressEventPolyfill for React Native compatibility — the module-
 * level const is the coupling point, not a bug per se.
 *
 * Why not rely on jsdom's ProgressEvent? In the jsdom environment jsdom
 * defines ProgressEvent on window, but the interceptor checks the bare global
 * (not window.ProgressEvent). In Node workers that start before jsdom attaches
 * its globals, the bare global check fails. Assigning globalThis.ProgressEvent
 * explicitly — before any other import — ensures it is always present.
 *
 * window.matchMedia polyfill
 * --------------------------
 * jsdom does not implement window.matchMedia. Any component or library that
 * calls matchMedia during a test (e.g. @xterm/xterm's DPR detection, React
 * responsive-layout hooks) would otherwise throw
 *   "TypeError: this._parentWindow.matchMedia is not a function"
 * which (a) pollutes stderr and (b) can produce an unhandled rejection that
 * races with the Vitest worker environment teardown, causing the spurious
 *   "EnvironmentTeardownError: Closing rpc while 'onUserConsoleLog' was pending"
 * reported as "Errors  1 error" in the full suite.
 * A no-op stub is sufficient: it returns a MediaQueryList whose `matches` is
 * always false, which is the correct default for a headless environment.
 * Individual tests that need specific breakpoint behaviour override it with
 * their own vi.fn() mock as before — the stub does not interfere.
 */

// ── ProgressEvent ─────────────────────────────────────────────────────────────

if (typeof globalThis.ProgressEvent === 'undefined') {
  // Prefer the jsdom-provided class if already available (e.g. in environments
  // where jsdom initialises before this file loads).
  if (typeof window !== 'undefined' && typeof window.ProgressEvent !== 'undefined') {
    globalThis.ProgressEvent = window.ProgressEvent
  } else {
    // Minimal polyfill: satisfies @mswjs/interceptors createEvent() which only
    // needs lengthComputable, loaded and total on ProgressEvent instances.
    globalThis.ProgressEvent = class ProgressEvent extends Event {
      readonly lengthComputable: boolean
      readonly loaded: number
      readonly total: number

      constructor(type: string, eventInitDict?: ProgressEventInit) {
        super(type, eventInitDict)
        this.lengthComputable = eventInitDict?.lengthComputable ?? false
        this.loaded = eventInitDict?.loaded ?? 0
        this.total = eventInitDict?.total ?? 0
      }
    } as unknown as typeof globalThis.ProgressEvent
  }
}

// ── window.matchMedia ─────────────────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined, // deprecated but kept for legacy compat
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  })
}

// ── ResizeObserver ────────────────────────────────────────────────────────────
// jsdom does not implement ResizeObserver. @xterm/xterm (and React components
// using it) call `new ResizeObserver(...)` in useEffect, which throws a
// ReferenceError that produces console.error output. If that output arrives
// during Vitest worker environment teardown the RPC channel is already closing,
// causing "EnvironmentTeardownError: Closing rpc while 'onUserConsoleLog' was
// pending". The no-op stub prevents the throw; tests that need real observation
// can override globalThis.ResizeObserver with their own vi.fn() class.

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

