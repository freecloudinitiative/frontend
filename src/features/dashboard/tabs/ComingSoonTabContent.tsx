import type { ServiceId } from '@/lib/mockServiceData'

interface ComingSoonTabContentProps {
  serviceId: ServiceId
}

export function ComingSoonTabContent({ serviceId }: ComingSoonTabContentProps) {
  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        textAlign: 'center',
        padding: '56px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '260px',
      }}
    >
      <div
        className="fci-blink"
        style={{
          fontSize: 20,
          color: 'var(--dash-accent)',
          marginBottom: 14,
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}
      >
        [ COMING SOON ]
      </div>
      <div
        style={{
          color: 'var(--dash-text-dim)',
          fontSize: 13,
          maxWidth: 520,
          margin: '0 auto',
          lineHeight: 1.6,
        }}
      >
        {serviceId} automated management, provisioning, and cluster orchestration features are under active development for Free Cloud Initiative.
      </div>
    </div>
  )
}
