import { IconButton } from '@/components/ui/IconButton'
import { AnimatedPlaceholder } from '@/features/dashboard/tabs/shared/AnimatedPlaceholder'

interface LoadBalancerSettingsPageProps {
  onBack: () => void
}

const PLANNED_FEATURES = [
  'Target group management',
  'Health check configuration',
  'Listener & routing rules',
  'SSL/TLS certificate binding',
]

export function LoadBalancerSettingsPage({ onBack }: LoadBalancerSettingsPageProps) {
  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Load Balancer Settings</div>
      <IconButton variant="back" placement="notch" onClick={onBack} title="Back" ariaLabel="Back" />

      <AnimatedPlaceholder
        label="COMING SOON"
        subtitle="Load Balancer settings are under active development for Free Cloud Initiative."
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -20, paddingBottom: 24 }}>
        <ul style={{ textAlign: 'left', fontSize: 13, color: 'var(--dash-text-dim)', lineHeight: 1.8 }}>
          {PLANNED_FEATURES.map((feature) => (
            <li key={feature}>» {feature}</li>
          ))}
        </ul>
        <div style={{ marginTop: 20 }}>
          <IconButton variant="back" onClick={onBack} title="Back to Dashboard" ariaLabel="Back to Dashboard" />
        </div>
      </div>
    </div>
  )
}
