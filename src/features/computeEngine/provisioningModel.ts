import type { InstanceType } from './types'

/**
 * The form's labels are not the API's values: compute-service speaks
 * 'shared' and 'dedicated'. Kept as one table so a label change cannot
 * drift from the value that actually gets sent.
 */
const PROVISIONING_MODELS = [
  { label: 'Standard', instanceType: 'shared' as const },
  { label: 'Dedicated', instanceType: 'dedicated' as const },
]

/**
 * Dedicated runs the instance in a Kata Containers VM, which needs a node
 * pool the cluster may not have. The API rejects it outright in that case,
 * so offer it only when the cluster says it can schedule it -- and while
 * the answer is still loading, leave it disabled rather than briefly
 * offering a choice that might be withdrawn.
 */
export function provisioningModelOptions(available: readonly string[] | undefined) {
  return PROVISIONING_MODELS.map(({ label, instanceType }) => ({
    value: label,
    label,
    disabled: !available?.includes(instanceType),
  }))
}

export function instanceTypeFor(provisioningModel: string): InstanceType {
  return PROVISIONING_MODELS.find((m) => m.label === provisioningModel)?.instanceType ?? 'shared'
}

/**
 * The model actually in effect, which is not always the one in the store.
 * The create form's state outlives the form: leaving without cancelling or
 * creating keeps the selection, so a customer who picked Dedicated on a
 * cluster that supported it can reopen the form later — or on a cluster
 * that no longer does — with Dedicated still selected but greyed out. Both
 * the select and the payload read this, so what is shown and what is sent
 * cannot disagree, and a create the API would reject with "this cluster
 * cannot currently run instance type dedicated" is never sent at all.
 *
 * While capability is still loading nothing is available, so this reads
 * Standard. In practice that is invisible: the answer is cached for five
 * minutes, so a reopened form has it immediately, and a genuinely cold load
 * has a store that still holds the Standard default.
 */
export function effectiveProvisioningModel(selected: string, available: readonly string[] | undefined): string {
  return available?.includes(instanceTypeFor(selected)) ? selected : PROVISIONING_MODELS[0].label
}
