import { COMPUTE_ENGINE_CONSTRAINTS } from '@/lib/apiConstraints'

/**
 * Product cap on the disk size the create form will let a customer ask for.
 *
 * This is a UI policy, not the API contract, which is why it does not live in
 * lib/apiConstraints.ts: that module is a verbatim transcription of the Go
 * validator and must keep saying what the service actually accepts
 * (10-1000 GB, compute_engine.go:323, with a matching `disk BETWEEN 10 AND
 * 1000` CHECK on compute_engines).
 */
const UI_DISK_MAX_GIB = 25

/** Values the text field itself may hold while the customer is editing. */
export const COMPUTE_ENGINE_DISK_INPUT = {
  min: 0,
  max: UI_DISK_MAX_GIB,
} as const

/**
 * The bounds the Disk (GB) field enforces.
 *
 * The window may only ever narrow the API's: `min` is the service's own
 * minimum and `max` is clamped to the service's maximum. A UI floor below the
 * service's would let the form submit a payload that the service rejects with
 * a 400 and the database refuses regardless -- the customer would get an
 * opaque failure toast in place of the inline error the form can give them.
 *
 * To make 25 GB the real limit rather than a client-side one, change
 * compute_engine.go and the migration's CHECK constraint first, then update
 * COMPUTE_ENGINE_CONSTRAINTS.diskGib; this module follows automatically.
 */
export const COMPUTE_ENGINE_DISK_UI = {
  min: COMPUTE_ENGINE_CONSTRAINTS.diskGib.min,
  max: Math.min(UI_DISK_MAX_GIB, COMPUTE_ENGINE_CONSTRAINTS.diskGib.max),
} as const

/**
 * Keystroke filter for the Disk (GB) field: keeps the box from ever holding
 * something that is not a plain integer within the cap. Returns the previous
 * value when the edit would produce one, so the rejected keystroke is simply
 * dropped. Values *below* the minimum stay typeable -- a customer on their way
 * to "12" passes through "1", and blocking that would make the field feel
 * broken. The floor is reported by validation on submit instead.
 */
export function clampDiskInput(next: string, previous: string): string {
  if (next === '') return next
  if (!/^\d+$/.test(next)) return previous
  const value = Number(next)
  return value < COMPUTE_ENGINE_DISK_INPUT.min || value > COMPUTE_ENGINE_DISK_INPUT.max
    ? previous
    : next
}
