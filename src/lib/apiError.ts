export interface ApiErrorEnvelope {
  code: string
  message: string
  request_id?: string
  details?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Type guard for the structured envelope: `{ error: { code, message, ... } }`. */
export function isApiErrorEnvelope(value: unknown): value is { error: ApiErrorEnvelope } {
  try {
    if (!isRecord(value) || !isRecord(value.error)) return false

    const envelope = value.error
    return (
      typeof envelope.code === 'string' &&
      typeof envelope.message === 'string' &&
      (envelope.request_id === undefined || typeof envelope.request_id === 'string') &&
      (envelope.details === undefined || isRecord(envelope.details))
    )
  } catch {
    return false
  }
}

function getResponseData(error: unknown): unknown {
  if (!isRecord(error) || !isRecord(error.response)) return undefined
  return error.response.data
}

/**
 * Extracts a human-readable message from any thrown value.
 * Resolution order:
 *   1. structured envelope
 *   2. legacy string body
 *   3. axios/Error message
 *   4. the provided fallback
 * Never returns a non-string. Never throws.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  try {
    const data = getResponseData(error)
    if (isApiErrorEnvelope(data)) return data.error.message

    if (isRecord(data) && typeof data.error === 'string') return data.error
    if (isRecord(error) && typeof error.message === 'string') return error.message
  } catch {
    // Fall through to the guaranteed string fallback.
  }

  return fallback
}

/** Returns the machine-readable code when present, else null. */
export function getApiErrorCode(error: unknown): string | null {
  try {
    const data = getResponseData(error)
    return isApiErrorEnvelope(data) ? data.error.code : null
  } catch {
    return null
  }
}

/** Returns the request ID when present, else null. Used for support/debug display. */
export function getApiErrorRequestId(error: unknown): string | null {
  try {
    const data = getResponseData(error)
    return isApiErrorEnvelope(data) ? (data.error.request_id ?? null) : null
  } catch {
    return null
  }
}
