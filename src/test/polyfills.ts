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
 * C) Vitest jsdom teardown race (the bug triggered by PR #80):
 *    Vitest's jsdom environment sets up ProgressEvent on globalThis via
 *    populateGlobal(globalThis, dom.window). Its teardown function removes all
 *    populated keys with `keys.forEach(key => delete global[key])`. If any XHR
 *    that MSW is handling fires its respondWith() callback asynchronously after
 *    jsdom has torn down, createEvent() runs with SUPPORTS_PROGRESS_EVENT still
 *    `true` (locked at module-load time) but the bare ProgressEvent identifier
 *    is now undefined — producing:
 *      ReferenceError: ProgressEvent is not defined
 *      at createEvent (XMLHttpRequest-Dw6Wm-UU.mjs:91)
 *    This manifests as an "Unhandled Rejection" attributed to whichever test
 *    file happened to be running in the same worker at that moment.
 *
 *    Note: making the property non-configurable (configurable:false) so that
 *    `delete globalThis.ProgressEvent` silently no-ops sounds appealing, but
 *    the Vitest jsdom teardown runs in strict-mode ESM and a `delete` of a
 *    non-configurable property throws TypeError instead of being silent. That
 *    approach replaces 1 unhandled rejection with 90 teardown errors.
 *
 *    The fix for mode C is in the individual test file: after server.close(),
 *    yield control back to the event loop (setTimeout 0) so the in-flight XHR
 *    resolves and fires its ProgressEvent load callback BEFORE jsdom tears down.
 *    See RegionFilter.test.tsx afterAll.
 *
 * Fix (modes A + B): ALWAYS assign our polyfill class to globalThis.ProgressEvent,
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

// ── Blob.prototype.stream / arrayBuffer / text ──────────────────────────────
// jsdom's Blob implementation does not implement Blob.prototype.stream().
// When axios performs a request with responseType: 'blob', @mswjs/interceptors
// intercepts the XMLHttpRequest load event and creates a FetchResponse(xhr.response)
// where xhr.response is a jsdom Blob. Undici's extractBody() detects a Blob-like
// object (via Symbol.toStringTag === 'Blob') and invokes object.stream().
// Without Blob.prototype.stream, this throws:
//   TypeError: object.stream is not a function at extractBody (undici)
// which crashes MSW's XHR interceptor and hangs/times out the test.

function polyfillBlob(blobCtor: typeof Blob | undefined) {
  if (!blobCtor || !blobCtor.prototype) return

  if (typeof blobCtor.prototype.arrayBuffer !== 'function') {
    blobCtor.prototype.arrayBuffer = function arrayBuffer() {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(this)
      })
    }
  }

  if (typeof blobCtor.prototype.text !== 'function') {
    blobCtor.prototype.text = function text() {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(this)
      })
    }
  }

  if (typeof blobCtor.prototype.stream !== 'function') {
    blobCtor.prototype.stream = function stream() {
      const blob = this
      return new ReadableStream({
        async start(controller) {
          try {
            const buffer = await blob.arrayBuffer()
            controller.enqueue(new Uint8Array(buffer))
            controller.close()
          } catch (err) {
            controller.error(err)
          }
        },
      })
    }
  }
}

if (typeof globalThis.Blob !== 'undefined') {
  polyfillBlob(globalThis.Blob)
}
if (typeof window !== 'undefined' && typeof window.Blob !== 'undefined' && window.Blob !== globalThis.Blob) {
  polyfillBlob(window.Blob)
}

