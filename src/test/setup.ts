import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

// MSW handlers intentionally add network jitter, and lazy chunks can take more
// than Testing Library's one-second default during the full parallel suite.
configure({ asyncUtilTimeout: 3_000 })

expect.extend(matchers)

if (typeof globalThis.ProgressEvent === 'undefined') {
  globalThis.ProgressEvent = class ProgressEvent extends Event {} as any
}
