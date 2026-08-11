import { useState } from 'react'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardModal } from '@/features/dashboard/DashboardModal'
import { TerminalInput } from '@/components/TerminalInput'
import { TerminalSelect } from '@/components/TerminalSelect'
import { useAddFirewallRule, useDeleteFirewallRule } from '@/features/network/hooks'
import type {
  CreateFirewallRuleInput,
  FirewallAction,
  FirewallDirection,
  FirewallProtocol,
  Network,
} from '@/features/network/types'

interface NetworkTabContentProps {
  tab: RoutedTab
  selectedNetwork: Network | null
}

const DIRECTION_OPTIONS: { value: FirewallDirection; label: string }[] = [
  { value: 'ingress', label: 'Ingress' },
  { value: 'egress', label: 'Egress' },
]
const PROTOCOL_OPTIONS: { value: FirewallProtocol; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: 'all', label: 'All' },
]
const ACTION_OPTIONS: { value: FirewallAction; label: string }[] = [
  { value: 'allow', label: 'Allow' },
  { value: 'deny', label: 'Deny' },
]

const EMPTY_RULE: CreateFirewallRuleInput = {
  name: '',
  direction: 'ingress',
  protocol: 'tcp',
  portRange: '',
  source: '',
  action: 'allow',
}

export function NetworkTabContent({ tab, selectedNetwork }: NetworkTabContentProps) {
  const label = 'var(--dash-label)'
  const green = '#7ec87e'
  const amber = '#e8c07d'
  const red = '#e0546a'

  const [addRuleOpen, setAddRuleOpen] = useState(false)
  const [ruleForm, setRuleForm] = useState<CreateFirewallRuleInput>(EMPTY_RULE)
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const addFirewallRule = useAddFirewallRule(selectedNetwork?.id ?? '')
  const deleteFirewallRule = useDeleteFirewallRule(selectedNetwork?.id ?? '')

  function setRuleField<K extends keyof CreateFirewallRuleInput>(key: K, value: CreateFirewallRuleInput[K]) {
    setRuleForm((prev) => ({ ...prev, [key]: value }))
  }

  function closeAddRule() {
    setAddRuleOpen(false)
    setRuleForm(EMPTY_RULE)
    setFormError(null)
  }

  function handleAddRuleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!ruleForm.name.trim() || !ruleForm.portRange.trim() || !ruleForm.source.trim()) {
      setFormError('Name, Port Range, and Source are required')
      return
    }
    addFirewallRule.mutate(
      {
        name: ruleForm.name.trim(),
        direction: ruleForm.direction,
        protocol: ruleForm.protocol,
        portRange: ruleForm.portRange.trim(),
        source: ruleForm.source.trim(),
        action: ruleForm.action,
      },
      {
        onSuccess: () => closeAddRule(),
        onError: (error) => setFormError(error instanceof Error ? error.message : 'Failed to add rule'),
      },
    )
  }

  function confirmDeleteRule() {
    if (!deleteRuleId) return
    deleteFirewallRule.mutate(deleteRuleId, {
      onSuccess: () => setDeleteRuleId(null),
    })
  }

  // ── Firewall ──────────────────────────────────────────────────────────────
  if (tab === 'firewall') {
    if (!selectedNetwork) {
      return (
        <div className="fci-tab-content" style={{ color: 'var(--dash-text-dim)' }}>
          Select a network to view its firewall rules.
        </div>
      )
    }

    return (
      <div className="fci-tab-content">
        <div className="fci-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Firewall Rules</span>
          <button
            type="button"
            className="fci-linkbtn fci-action-add"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => setAddRuleOpen(true)}
          >
            + Add Rule
          </button>
        </div>
        {selectedNetwork.firewallRules.length === 0 ? (
          <div style={{ color: 'var(--dash-text-dim)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No firewall rules configured.</div>
        ) : (
          <table className="fci-table">
            <thead>
              <tr>
                <th>Name</th><th>Direction</th><th>Protocol</th><th>Port</th><th>Source</th><th>Action</th><th></th>
              </tr>
            </thead>
            <tbody>
              {selectedNetwork.firewallRules.map((rule) => (
                <tr key={rule.id}>
                  <td style={{ color: label }}>{rule.name}</td>
                  <td>{rule.direction.toUpperCase()}</td>
                  <td>{rule.protocol.toUpperCase()}</td>
                  <td>{rule.portRange}</td>
                  <td>{rule.source}</td>
                  <td style={{ color: rule.action === 'allow' ? green : red }}>{rule.action.toUpperCase()}</td>
                  <td>
                    <button
                      type="button"
                      title="Delete rule"
                      onClick={() => setDeleteRuleId(rule.id)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        background: 'transparent',
                        border: '1px solid #e0546a',
                        color: '#e0546a',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <DashboardModal isOpen={addRuleOpen} onClose={closeAddRule} title="Add Firewall Rule">
          <form onSubmit={handleAddRuleSubmit} noValidate>
            <div className="fci-fieldbox">
              <label htmlFor="fw-rule-name" className="fci-box-label">Name</label>
              <TerminalInput
                id="fw-rule-name"
                type="text"
                value={ruleForm.name}
                onChange={(e) => setRuleField('name', e.target.value)}
              />
            </div>
            <div className="fci-fieldrow">
              <TerminalSelect
                id="fw-rule-direction"
                label="Direction"
                value={ruleForm.direction}
                options={DIRECTION_OPTIONS}
                onChange={(value) => setRuleField('direction', value as FirewallDirection)}
              />
              <TerminalSelect
                id="fw-rule-protocol"
                label="Protocol"
                value={ruleForm.protocol}
                options={PROTOCOL_OPTIONS}
                onChange={(value) => setRuleField('protocol', value as FirewallProtocol)}
              />
            </div>
            <div className="fci-fieldrow">
              <div className="fci-fieldbox">
                <label htmlFor="fw-rule-port" className="fci-box-label">Port Range</label>
                <TerminalInput
                  id="fw-rule-port"
                  type="text"
                  value={ruleForm.portRange}
                  onChange={(e) => setRuleField('portRange', e.target.value)}
                />
              </div>
              <div className="fci-fieldbox">
                <label htmlFor="fw-rule-source" className="fci-box-label">Source</label>
                <TerminalInput
                  id="fw-rule-source"
                  type="text"
                  value={ruleForm.source}
                  onChange={(e) => setRuleField('source', e.target.value)}
                />
              </div>
            </div>
            <TerminalSelect
              id="fw-rule-action"
              label="Action"
              value={ruleForm.action}
              options={ACTION_OPTIONS}
              onChange={(value) => setRuleField('action', value as FirewallAction)}
            />
            {formError && (
              <div style={{ color: '#e0546a', margin: '10px 0', fontSize: '0.85rem' }}>✗ {formError}</div>
            )}
            <div className="fci-modal-actions">
              <button type="button" className="fci-modal-btn" onClick={closeAddRule} disabled={addFirewallRule.isPending}>
                Cancel
              </button>
              <button type="submit" className="fci-modal-btn" disabled={addFirewallRule.isPending}>
                {addFirewallRule.isPending ? 'Adding…' : 'Add Rule'}
              </button>
            </div>
          </form>
        </DashboardModal>

        <DashboardModal isOpen={deleteRuleId !== null} onClose={() => setDeleteRuleId(null)} title="Confirm Delete">
          <p className="fci-modal-message">Delete this firewall rule?</p>
          <p className="fci-modal-sub">This action cannot be undone.</p>
          <div className="fci-modal-actions">
            <button type="button" className="fci-modal-btn" onClick={() => setDeleteRuleId(null)} disabled={deleteFirewallRule.isPending}>
              Cancel
            </button>
            <button type="button" className="fci-modal-btn fci-modal-btn-danger" onClick={confirmDeleteRule} disabled={deleteFirewallRule.isPending}>
              {deleteFirewallRule.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </DashboardModal>
      </div>
    )
  }

  // ── Routes ────────────────────────────────────────────────────────────────
  if (tab === 'routes') {
    if (!selectedNetwork) {
      return (
        <div className="fci-tab-content" style={{ color: 'var(--dash-text-dim)' }}>
          Select a network to view its route table.
        </div>
      )
    }
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Route Table</div>
        {selectedNetwork.routes.length === 0 ? (
          <div style={{ color: 'var(--dash-text-dim)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No routes configured.</div>
        ) : (
          <table className="fci-table">
            <thead><tr><th>Destination</th><th>Next Hop</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {selectedNetwork.routes.map((route) => (
                <tr key={route.id}>
                  <td style={{ color: label }}>{route.destination}</td>
                  <td>{route.nextHop}</td>
                  <td>{route.priority}</td>
                  <td style={{ color: route.status === 'active' ? green : amber }}>
                    {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  // ── Peering ───────────────────────────────────────────────────────────────
  if (tab === 'peering') {
    if (!selectedNetwork) {
      return (
        <div className="fci-tab-content" style={{ color: 'var(--dash-text-dim)' }}>
          Select a network to view its peering connections.
        </div>
      )
    }
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">VPC Peering Connections</div>
        {selectedNetwork.peerings.length === 0 ? (
          <div style={{ color: 'var(--dash-text-dim)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No peering connections configured.</div>
        ) : (
          <table className="fci-table">
            <thead><tr><th>Peer VPC</th><th>Region</th><th>CIDR</th><th>Status</th></tr></thead>
            <tbody>
              {selectedNetwork.peerings.map((peering) => (
                <tr key={peering.id}>
                  <td style={{ color: label }}>{peering.peerVpc}</td>
                  <td>{peering.peerRegion}</td>
                  <td>{peering.peerCidr}</td>
                  <td
                    style={{
                      color: peering.status === 'active' ? green : peering.status === 'failed' ? red : amber,
                    }}
                  >
                    {peering.status.charAt(0).toUpperCase() + peering.status.slice(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="fci-section-title" style={{ marginTop: 14 }}>Shared Services</div>
        <div className="fci-metricrow">
          <div>DNS resolution: <span style={{ color: green }}>Enabled</span></div>
          <div>Route export: <span style={{ color: green }}>Enabled</span></div>
          <div>MTU: <span style={{ color: label }}>1460</span></div>
          <div>Encryption: <span style={{ color: amber }}>Optional</span></div>
        </div>
      </div>
    )
  }

  return null
}
