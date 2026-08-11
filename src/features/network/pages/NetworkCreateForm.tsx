import { useState } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateNetwork } from '@/features/network/hooks'
import type { CreateNetworkInput, NetworkType } from '@/features/network/types'

const TYPE_OPTIONS: { value: NetworkType; label: string }[] = [
  { value: 'vpc', label: 'VPC' },
  { value: 'subnet', label: 'Subnet' },
  { value: 'public', label: 'Public' },
]

interface FormState {
  vpcName: string
  cidrBlock: string
  type: NetworkType
}

type FormErrors = Partial<Record<keyof FormState, string>>

const IPV4_CIDR_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[12]?[0-9])$/

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.vpcName.trim()) {
    errors.vpcName = 'VPC name is required'
  }
  const cidr = form.cidrBlock.trim()
  if (!cidr) {
    errors.cidrBlock = 'CIDR block is required'
  } else if (!IPV4_CIDR_REGEX.test(cidr)) {
    errors.cidrBlock = 'Must be a valid IPv4 CIDR (e.g. 10.0.0.0/16)'
  }
  return errors
}

export function NetworkCreateForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<FormState>({ vpcName: '', cidrBlock: '', type: 'vpc' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const createNetwork = useCreateNetwork()

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCancel() {
    setForm({ vpcName: '', cidrBlock: '', type: 'vpc' })
    onCancel()
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const input: CreateNetworkInput = {
      vpcName: form.vpcName.trim(),
      cidrBlock: form.cidrBlock.trim(),
      type: form.type,
    }

    createNetwork.mutate(input, {
      onSuccess: () => {
        setShowSuccess(true)
        setForm({ vpcName: '', cidrBlock: '', type: 'vpc' })
        onSuccess()
      },
    })
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create Network</div>
      <button
        type="button"
        className="fci-linkbtn fci-action-back fci-box-key-top"
        onClick={handleCancel}
        aria-label="Back"
        title="Back"
      >
        &lt;&lt;
      </button>

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldbox">
              <label htmlFor="network-create-name" className="fci-box-label">VPC Name</label>
              <TerminalInput
                id="network-create-name"
                type="text"
                hasError={Boolean(errors.vpcName)}
                value={form.vpcName}
                onChange={(e) => setField('vpcName', e.target.value)}
              />
              {errors.vpcName && <div className="fci-form-error">{errors.vpcName}</div>}
            </div>

            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="network-create-cidr" className="fci-box-label">CIDR Block</label>
                <TerminalInput
                  id="network-create-cidr"
                  type="text"
                  hasError={Boolean(errors.cidrBlock)}
                  value={form.cidrBlock}
                  onChange={(e) => setField('cidrBlock', e.target.value)}
                />
                {errors.cidrBlock && <div className="fci-form-error">{errors.cidrBlock}</div>}
              </div>
              <TerminalSelect
                id="network-create-type"
                label="Type"
                value={form.type}
                options={TYPE_OPTIONS}
                onChange={(value) => setField('type', value as NetworkType)}
              />
            </div>

            {createNetwork.isError && (
              <div className="fci-form-error" style={{ marginBottom: 14 }}>
                {createNetwork.error instanceof Error ? createNetwork.error.message : 'Failed to create network'}
              </div>
            )}

            {showSuccess && (
              <div style={{ color: '#7ec87e', fontSize: 12, marginBottom: 14 }}>Network created successfully</div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="submit"
                className="fci-linkbtn fci-action-add"
                style={{ padding: '6px 14px' }}
                disabled={createNetwork.isPending}
              >
                {createNetwork.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                className="fci-linkbtn fci-action-edit"
                style={{ padding: '6px 14px' }}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="fci-split-info">
          <h3>About Network Creation</h3>
          <p>Provisions a new virtual network in the current project — a VPC, subnet, or public network.</p>
          <p>The CIDR block defines the network's private IP address range and cannot overlap with existing networks.</p>
          <p>Firewall rules, routes, and peering connections can be configured once the network is created.</p>
        </div>
      </div>
    </div>
  )
}
