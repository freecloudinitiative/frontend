import { describe, expect, it } from 'vitest'
import { getApiErrorCode, getApiErrorMessage, getApiErrorRequestId } from '@/lib/apiError'

describe('getApiErrorMessage', () => {
  const fallback = 'Fallback message'
  const cases: Array<{ name: string; input: unknown; expected: string }> = [
    {
      name: 'structured envelope',
      input: { response: { data: { error: { code: 'x', message: 'boom' } } } },
      expected: 'boom',
    },
    {
      name: 'legacy string body',
      input: { response: { data: { error: 'legacy string' } } },
      expected: 'legacy string',
    },
    {
      name: 'error message after an unrecognized response body',
      input: { response: { data: {} }, message: 'Request failed' },
      expected: 'Request failed',
    },
    {
      name: 'response without data',
      input: { response: { status: 502 } },
      expected: fallback,
    },
    {
      name: 'native Error',
      input: new Error('network down'),
      expected: 'network down',
    },
    { name: 'undefined', input: undefined, expected: fallback },
    { name: 'bare string', input: 'a bare string', expected: fallback },
    {
      name: 'structured-looking body with a non-string message',
      input: { response: { data: { error: { message: null } } } },
      expected: fallback,
    },
  ]

  it.each(cases)('resolves $name to a string', ({ input, expected }) => {
    const result = getApiErrorMessage(input, fallback)

    expect(result).toBe(expected)
    expect(typeof result).toBe('string')
  })
})

describe('API error metadata accessors', () => {
  it('extracts the code and request ID from a structured envelope', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 'resource_not_found',
            message: 'Database not found',
            request_id: 'request-123',
          },
        },
      },
    }

    expect(getApiErrorCode(error)).toBe('resource_not_found')
    expect(getApiErrorRequestId(error)).toBe('request-123')
  })

  it.each([
    { response: { data: { error: 'legacy string' } } },
    undefined,
  ])('returns null for legacy and absent shapes', (error) => {
    expect(getApiErrorCode(error)).toBeNull()
    expect(getApiErrorRequestId(error)).toBeNull()
  })
})
