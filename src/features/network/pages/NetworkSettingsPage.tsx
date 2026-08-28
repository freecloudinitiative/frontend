import { useState, useEffect } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useNetwork, useNetworks, useUpdateNetworkSettings } from '@/features/network/hooks'
import { useToastStore } from '@/store/toastStore'

interface NetworkSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const TOGGLE_OPTIONS = ['Enabled', 'Disabled']

function isValidIpAddress(value: string): boolean {
  const ipv4Parts = value.split('.')
  if (ipv4Parts.length === 4) {
    return ipv4Parts.every((part) => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255)
  }

  if (!value.includes(':') || /[^0-9a-fA-F:.%]/.test(value)) return false
  const zoneIndex = value.indexOf('%')
  const address = zoneIndex >= 0 ? value.slice(0, zoneIndex) : value
  const zone = zoneIndex >= 0 ? value.slice(zoneIndex + 1) : ''
  if (zoneIndex >= 0 && !zone) return false

  const halves = address.split('::')
  if (halves.length > 2) return false
  const countGroups = (half: string) => {
    if (!half) return 0
    return half.split(':').reduce((count, group) => {
      if (!group) return Number.NaN
      if (group.includes('.')) return isValidIpAddress(group) ? count + 2 : Number.NaN
      return /^[0-9a-fA-F]{1,4}$/.test(group) ? count + 1 : Number.NaN
    }, 0)
  }
  const groups = countGroups(halves[0]) + countGroups(halves[1] ?? '')
  return halves.length === 2 ? groups < 8 : groups === 8
}

export function NetworkSettingsPage({ onBack, selectedRowId }: NetworkSettingsPageProps) {
  const { data: networks } = useNetworks()
  const activeNetworkId = selectedRowId || networks?.[0]?.id || ''
  const { data: network } = useNetwork(activeNetworkId)
  const updateSettings = useUpdateNetworkSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [dnsServers, setDnsServers] = useState('8.8.8.8, 1.1.1.1')
  const [gatewayIp, setGatewayIp] = useState('10.0.0.1')
  const [autoCidrAllocation, setAutoCidrAllocation] = useState('Enabled')
  const [gatewayError, setGatewayError] = useState<string | null>(null)

  useEffect(() => {
    if (network) {
      setGatewayIp(network.gateway || '')
      setGatewayError(null)
    }
  }, [network])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeNetworkId) {
      addToast('No network selected for settings update', 'error')
      return
    }

    const gateway = gatewayIp.trim()
    const gatewayChanged = network !== undefined && gateway !== network.gateway
    if (gatewayChanged && gateway && !isValidIpAddress(gateway)) {
      setGatewayError('Enter a valid IP address')
      return
    }
    setGatewayError(null)

    const settings = gatewayChanged && gateway ? { gateway } : {}

    updateSettings.mutate(
      {
        id: activeNetworkId,
        settings,
      },
      {
        onSuccess: () => {
          addToast(`Network settings updated for ${network?.vpcName || activeNetworkId}`, 'success')
        },
        onError: () => {
          addToast('Failed to update Network settings', 'error')
        },
      },
    )
  }

  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Network Settings {network ? `— ${network.vpcName}` : ''}</div>
      <IconButton variant="back" placement="notch" onClick={onBack} title="Back" ariaLabel="Back" />

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <div className="fci-field-with-help">
                <div className="fci-fieldbox">
                  <label htmlFor="net-dns" className="fci-box-label">Custom DNS Servers</label>
                  <TerminalInput
                    id="net-dns"
                    type="text"
                    value={dnsServers}
                    onChange={(e) => setDnsServers(e.target.value)}
                    placeholder="8.8.8.8, 1.1.1.1"
                    disabled
                  />
                </div>
                <p className="fci-field-help">Not available in v1.</p>
              </div>
              <div className="fci-fieldbox">
                <label htmlFor="net-gateway" className="fci-box-label">Default Gateway IP</label>
                <TerminalInput
                  id="net-gateway"
                  type="text"
                  value={gatewayIp}
                  onChange={(e) => setGatewayIp(e.target.value)}
                  placeholder="10.0.0.1"
                  hasError={Boolean(gatewayError)}
                />
                {gatewayError && <div className="fci-form-error">{gatewayError}</div>}
              </div>
            </div>

            <div className="fci-fieldrow">
              <div className="fci-field-with-help">
                <TerminalSelect
                  id="net-auto-cidr"
                  label="Automatic Subnet CIDR Allocation"
                  value={autoCidrAllocation}
                  options={TOGGLE_OPTIONS}
                  onChange={(val) => setAutoCidrAllocation(val)}
                  disabled
                />
                <p className="fci-field-help">Not available in v1.</p>
              </div>
            </div>

            <div className="fci-form-actions" style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="fci-btn fci-btn-primary"
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </button>
              <button type="button" className="fci-btn fci-btn-secondary" onClick={onBack}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
