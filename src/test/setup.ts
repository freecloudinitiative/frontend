import '@testing-library/jest-dom'
import { expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

if (typeof globalThis.ProgressEvent === 'undefined') {
  if (typeof window !== 'undefined' && typeof window.ProgressEvent !== 'undefined') {
    globalThis.ProgressEvent = window.ProgressEvent
  } else {
    globalThis.ProgressEvent = class ProgressEvent extends Event {
      lengthComputable = false
      loaded = 0
      total = 0
      constructor(type: string, eventInitDict?: ProgressEventInit) {
        super(type, eventInitDict)
        if (eventInitDict) {
          this.lengthComputable = eventInitDict.lengthComputable ?? false
          this.loaded = eventInitDict.loaded ?? 0
          this.total = eventInitDict.total ?? 0
        }
      }
    } as unknown as typeof globalThis.ProgressEvent
  }
}
