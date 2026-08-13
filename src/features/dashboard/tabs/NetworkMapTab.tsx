import { useState } from 'react'
import type { Network, Subnet, SubnetType } from '@/features/network/types'
import { DASH_COLORS } from '@/lib/theme'

interface NetworkMapTabProps {
  selectedNetwork: Network | null
}

const TYPE_COLORS: Record<SubnetType, string> = {
  public: '#7ec87e',   // Green
  private: '#b388ff',  // Purple
  isolated: '#e8c07d', // Amber
}

export function NetworkMapTab({ selectedNetwork }: NetworkMapTabProps) {
  const { label, dim } = DASH_COLORS
  const [filterType, setFilterType] = useState<SubnetType | 'all'>('all')
  const [selectedSubnetId, setSelectedSubnetId] = useState<string | null>(null)

  if (!selectedNetwork) {
    return (
      <div className="fci-tab-content" style={{ color: dim }}>
        Select a network to view its Network Map.
      </div>
    )
  }

  const subnets = selectedNetwork.subnets ?? []
  const filteredSubnets = subnets.filter(
    (subnet) => filterType === 'all' || subnet.type === filterType
  )

  const activeSubnet = subnets.find((s) => s.id === selectedSubnetId) ?? filteredSubnets[0] ?? null

  return (
    <div className="fci-tab-content">
      {/* ── Toolbar & Filter Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div>
          <div className="fci-section-title" style={{ margin: 0, fontSize: '0.95rem' }}>
            Topology Map — <span style={{ color: label }}>{selectedNetwork.vpcName}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: dim, marginTop: 2 }}>
            VPC node topology along with connected subnets ({subnets.length} total)
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {(['all', 'public', 'private', 'isolated'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              style={{
                fontSize: '0.72rem',
                padding: '3px 9px',
                borderRadius: '3px',
                border: filterType === type ? '1px solid var(--dash-label)' : '1px solid rgba(255, 255, 255, 0.15)',
                background: filterType === type ? 'rgba(79, 168, 220, 0.15)' : 'transparent',
                color: filterType === type ? 'var(--dash-label)' : dim,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
              }}
            >
              {type} {type !== 'all' ? `(${subnets.filter((s) => s.type === type).length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ── Visual Graph Canvas ─────────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(79, 168, 220, 0.2)',
          borderRadius: '4px',
          padding: '20px 16px',
          position: 'relative',
        }}
      >
        {/* ROOT VPC NODE */}
        <div
          style={{
            maxWidth: 360,
            margin: '0 auto 24px auto',
            padding: '12px 16px',
            background: 'rgba(20, 30, 45, 0.9)',
            border: '2px solid #4fa8dc',
            borderRadius: '6px',
            boxShadow: '0 0 15px rgba(79, 168, 220, 0.25)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#4fa8dc',
              marginBottom: 4,
              textTransform: 'uppercase',
            }}
          >
            ❖ VPC Root Node
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            {selectedNetwork.vpcName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span style={{ background: 'rgba(79, 168, 220, 0.15)', color: '#4fa8dc', padding: '2px 8px', borderRadius: '3px', border: '1px solid rgba(79, 168, 220, 0.3)' }}>
              CIDR: {selectedNetwork.cidrBlock}
            </span>
            <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: dim, padding: '2px 8px', borderRadius: '3px' }}>
              Region: {selectedNetwork.region} ({selectedNetwork.zone})
            </span>
            <span
              style={{
                background: selectedNetwork.status === 'active' ? 'rgba(126, 200, 126, 0.15)' : 'rgba(224, 84, 106, 0.15)',
                color: selectedNetwork.status === 'active' ? '#7ec87e' : '#e0546a',
                padding: '2px 8px',
                borderRadius: '3px',
                textTransform: 'capitalize',
              }}
            >
              {selectedNetwork.status}
            </span>
          </div>
        </div>

        {/* CONNECTING FLOW CONNECTOR */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '-12px 0 16px 0', zIndex: 1 }}>
          <div
            style={{
              width: 2,
              height: 20,
              background: 'linear-gradient(to bottom, #4fa8dc, rgba(79, 168, 220, 0.2))',
              boxShadow: '0 0 6px #4fa8dc',
            }}
          />
        </div>

        {/* SUBNET NODES GRID */}
        {filteredSubnets.length === 0 ? (
          <div style={{ textAlign: 'center', color: dim, fontSize: '0.85rem', padding: '16px 0' }}>
            No subnets found matching the selected filter.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            {filteredSubnets.map((subnet) => {
              const isSelected = activeSubnet?.id === subnet.id
              const accentColor = TYPE_COLORS[subnet.type]

              return (
                <div
                  key={subnet.id}
                  onClick={() => setSelectedSubnetId(subnet.id)}
                  style={{
                    background: isSelected ? 'rgba(30, 45, 65, 0.95)' : 'rgba(15, 23, 35, 0.8)',
                    border: `1.5px solid ${isSelected ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '5px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 0 12px ${accentColor}40` : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: '2px',
                        color: accentColor,
                        background: `${accentColor}20`,
                        border: `1px solid ${accentColor}50`,
                      }}
                    >
                      {subnet.type}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: dim }}>{subnet.zone}</span>
                  </div>

                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {subnet.name}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: label, fontFamily: 'monospace', marginBottom: 8 }}>
                    {subnet.cidrBlock}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: dim, paddingTop: 6, borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                    <span>GW: <strong style={{ color: '#ccc' }}>{subnet.gateway}</strong></span>
                    <span>{subnet.resourceCount ?? 0} resources</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── SUB-INSPECTOR PANEL FOR SELECTED SUBNET ────────────────────── */}
      {activeSubnet && (
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: 'rgba(15, 25, 38, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          }}
        >
          <div className="fci-section-title" style={{ fontSize: '0.85rem', marginBottom: 8 }}>
            Subnet Details — <span style={{ color: TYPE_COLORS[activeSubnet.type] }}>{activeSubnet.name}</span>
          </div>

          <div className="fci-metricrow" style={{ marginTop: 6 }}>
            <div>
              Subnet CIDR: <span style={{ color: label }}>{activeSubnet.cidrBlock}</span>
            </div>
            <div>
              Gateway: <span style={{ color: label }}>{activeSubnet.gateway}</span>
            </div>
            <div>
              Subnet Type: <span style={{ color: TYPE_COLORS[activeSubnet.type], textTransform: 'capitalize' }}>{activeSubnet.type}</span>
            </div>
            <div>
              Zone: <span style={{ color: label }}>{activeSubnet.zone}</span>
            </div>
            <div>
              Status:{' '}
              <span style={{ color: activeSubnet.status === 'active' ? '#7ec87e' : '#e0546a' }}>
                {activeSubnet.status}
              </span>
            </div>
            <div>
              Attached Instances: <span style={{ color: label }}>{activeSubnet.resourceCount ?? 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
