import { useState, useEffect } from 'react'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useNetwork, useNetworks, useUpdateNetworkSettings } from '@/features/network/hooks'
import { useToastStore } from '@/store/toastStore'

interface NetworkSettingsPageProps {
  onBack: () => void
  selectedRowId?: string | null
}

const TOGGLE_OPTIONS = ['Enabled', 'Disabled']

export function NetworkSettingsPage({ onBack, selectedRowId }: NetworkSettingsPageProps) {
  const { data: networks } = useNetworks()
  const activeNetworkId = selectedRowId || networks?.[0]?.id || ''
  const { data: network } = useNetwork(activeNetworkId)
  const updateSettings = useUpdateNetworkSettings()
  const addToast = useToastStore((state) => state.addToast)

  const [dnsServers, setDnsServers] = useState('8.8.8.8, 1.1.1.1')
  const [gatewayIp, setGatewayIp] = useState('10.0.0.1')
  const [autoCidrAllocation, setAutoCidrAllocation] = useState('Enabled')

  useEffect(() => {
    if (network) {
      if (network.gateway) setGatewayIp(network.gateway)
    }
  }, [network])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeNetworkId) {
      addToast('No network selected for settings update', 'error')
      return
    }

    updateSettings.mutate(
      {
        id: activeNetworkId,
        settings: {
          dnsServers,
          gatewayIp,
          autoCidrAllocation: autoCidrAllocation === 'Enabled',
        },
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
      <button
        type="button"
        className="fci-linkbtn fci-action-back fci-box-key-top"
        onClick={onBack}
        aria-label="Back"
        title="Back"
      >
        &lt;&lt;
      </button>

      <div className="fci-split-layout" style={{ marginTop: 14 }}>
        <div className="fci-split-fields">
          <form onSubmit={handleSubmit} noValidate>
            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="net-dns" className="fci-box-label">Custom DNS Servers</label>
                <TerminalInput
                  id="net-dns"
                  type="text"
                  value={dnsServers}
                  onChange={(e) => setDnsServers(e.target.value)}
                  placeholder="8.8.8.8, 1.1.1.1"
                />
              </div>
              <div className="fci-fieldbox">
                <label htmlFor="net-gateway" className="fci-box-label">Default Gateway IP</label>
                <TerminalInput
                  id="net-gateway"
                  type="text"
                  value={gatewayIp}
                  onChange={(e) => setGatewayIp(e.target.value)}
                  placeholder="10.0.0.1"
                />
              </div>
            </div>

            <div className="fci-fieldrow">
              <TerminalSelect
                id="net-auto-cidr"
                label="Automatic Subnet CIDR Allocation"
                value={autoCidrAllocation}
                options={TOGGLE_OPTIONS}
                onChange={(val) => setAutoCidrAllocation(val)}
              />
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
