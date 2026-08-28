export type StrictDecodeResult<T> =
  | { ok: true; value: T }
  | { ok: false; unknown: string[] }

/**
 * Mirrors the unknown-field rejection performed by httpx.DecodeJSON.
 * Unlike encoding/json, report every unknown key so contract drift can be
 * fixed in one pass.
 */
export function decodeStrict<T>(body: unknown, allowed: readonly string[]): StrictDecodeResult<T> {
  if (typeof body !== 'object' || body === null) {
    return { ok: true, value: body as T }
  }

  const allowedKeys = new Set(allowed)
  const unknown = Object.keys(body).filter((key) => !allowedKeys.has(key))
  return unknown.length > 0
    ? { ok: false, unknown }
    : { ok: true, value: body as T }
}
