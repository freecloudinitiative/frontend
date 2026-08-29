import { useState } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useCreateNetwork } from '@/features/network/hooks'
import type { CreateNetworkInput, NetworkType, Region } from '@/features/network/types'
import { useEntityForm } from '@/lib/useEntityForm'

const REGION_OPTIONS = [
  { value: 'IST', label: 'IST' },
  { value: 'ANK', label: 'ANK', disabled: true },
]

const TYPE_OPTIONS: { value: NetworkType; label: string }[] = [
  { value: 'vpc', label: 'VPC' },
  { value: 'subnet', label: 'Subnet' },
  { value: 'public', label: 'Public' },
]

interface FormState {
  vpcName: string
  cidrBlock: string
  type: NetworkType
  region: Region
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

const INITIAL_FORM_STATE: FormState = { vpcName: '', cidrBlock: '', type: 'vpc', region: 'IST' }

export function NetworkCreateForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE)
  const createNetwork = useCreateNetwork()

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const { errors, handleCancel, handleSubmit } = useEntityForm<FormState, FormErrors, CreateNetworkInput>({
    form,
    resetForm: () => setForm(INITIAL_FORM_STATE),
    validate,
    buildInput: (form) => ({
      vpcName: form.vpcName.trim(),
      cidrBlock: form.cidrBlock.trim(),
      type: form.type,
      region: form.region,
    }),
    mutate: createNetwork.mutate,
    successMessage: 'Network created successfully',
    logLabel: 'NetworkCreateForm submit',
    onCancel,
    onSuccess,
  })

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Create Network</div>
      <IconButton variant="back" placement="notch" onClick={handleCancel} title="Back" ariaLabel="Back" />

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
              <TerminalSelect
                id="network-create-region"
                label="Region"
                value={form.region}
                options={REGION_OPTIONS}
                onChange={(value) => setField('region', value as Region)}
              />
            </div>


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
