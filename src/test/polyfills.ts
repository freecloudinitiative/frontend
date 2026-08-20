/**
 * Global polyfills required before any test module is imported.
 *
 * This file is listed FIRST in vite.config.ts test.setupFiles so that every
 * Vitest worker loads it before any other module.
 *
 * ── ProgressEvent ────────────────────────────────────────────────────────────
 *
 * @mswjs/interceptors evaluates
 *   const SUPPORTS_PROGRESS_EVENT = typeof ProgressEvent !== "undefined"
 * as a module-level const at import time, and later uses the bare identifier
 *   const ProgressEventClass = SUPPORTS_PROGRESS_EVENT ? ProgressEvent : ProgressEventPolyfill
 * inside createEvent().
 *
 * Two failure modes exist depending on the host Node.js version:
 *
 * A) Node < 18 (no native ProgressEvent):
 *    SUPPORTS_PROGRESS_EVENT = false, so ProgressEventPolyfill is used and
 *    "new ProgressEvent(...)" later throws ReferenceError when some code path
 *    still references the bare ProgressEvent identifier.
 *
 * B) Node 18+ (native ProgressEvent on globalThis in Node's fetch API layer):
 *    SUPPORTS_PROGRESS_EVENT = true. BUT in Vitest's VM execution context for
 *    worker processes, the native Node.js ProgressEvent may not be reachable as
 *    a bare identifier inside the interceptor's ESM module scope, even though
 *    `typeof ProgressEvent !== "undefined"` returned true at module-load time.
 *    This is a VM sandbox vs. Node native global visibility mismatch: the module
 *    loads in one context where the native global is visible, but createEvent()
 *    runs in another where it is not.
 *
 * Fix: ALWAYS assign our polyfill class to globalThis.ProgressEvent,
 * unconditionally. This guarantees:
 *   1. SUPPORTS_PROGRESS_EVENT = true (our class is defined before the module
 *      loads, because setupFiles run first).
 *   2. The bare `ProgressEvent` identifier in createEvent() resolves to our
 *      class — the same object that was on globalThis when the const was set.
 *   3. The class has the correct interface (lengthComputable, loaded, total).
 *
 * We deliberately do NOT guard with `if (typeof globalThis.ProgressEvent === 'undefined')`
 * because in Node 18+ the native class satisfies the typeof check but can still
 * be unreachable as a bare identifier inside the interceptor's VM scope.
 *
 * Why not upgrade msw? 2.15.0 is the current latest 2.x; this is not a bug in
 * msw per se — the interceptor deliberately keeps its own ProgressEventPolyfill
 * for React Native, and the module-level const is the intentional design.
 *
 * ── window.matchMedia ────────────────────────────────────────────────────────
 *
 * jsdom does not implement window.matchMedia. Components that call it (e.g.
 * @xterm/xterm DPR detection, responsive hooks) throw
 *   TypeError: this._parentWindow.matchMedia is not a function
 * which pollutes stderr and can race with Vitest worker teardown, causing the
 *   EnvironmentTeardownError: Closing rpc while 'onUserConsoleLog' was pending
 * reported as "Errors  1 error". A no-op stub returning matches:false is the
 * standard headless-environment solution. Tests that need specific breakpoint
 * behaviour override it with vi.fn() as usual.
 *
 * ── ResizeObserver ───────────────────────────────────────────────────────────
 *
 * jsdom does not implement ResizeObserver. @xterm/xterm calls it in a useEffect,
 * producing console.error output that causes the same teardown race described
 * above. The no-op stub prevents the throw.
 */

// ── ProgressEvent ─────────────────────────────────────────────────────────────
// Unconditional assignment — see the long comment above for why the `if` guard
// is intentionally absent.

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

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
