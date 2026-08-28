import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { afterEach, expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'
import { waitForPendingRequests } from './server'

// MSW handlers intentionally add network jitter, and lazy chunks can take more
// than Testing Library's one-second default during the full parallel suite.
configure({ asyncUtilTimeout: 3_000 })

expect.extend(matchers)

// MSW responses may still be dispatching XHR progress events when a test's
// assertions finish. Drain them before jsdom tears down ProgressEvent.
afterEach(async () => {
  await waitForPendingRequests()
})

if (typeof globalThis.ProgressEvent === 'undefined') {
  globalThis.ProgressEvent = class ProgressEvent extends Event {} as any
}
