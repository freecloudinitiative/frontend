import { IconButton } from '@/components/ui/IconButton'
import { AnimatedPlaceholder } from '@/features/dashboard/tabs/shared/AnimatedPlaceholder'

interface KubernetesSettingsPageProps {
  onBack: () => void
}

const PLANNED_FEATURES = [
  'Node pool scaling policies',
  'Cluster autoscaler configuration',
  'Kubernetes version upgrades',
  'Workload identity & RBAC bindings',
]

export function KubernetesSettingsPage({ onBack }: KubernetesSettingsPageProps) {
  return (
    <div className="fci-detail-panel fci-panel-titled" style={{ gridColumn: '1 / -1' }}>
      <div className="fci-box-label">Kubernetes Settings</div>
      <IconButton variant="back" placement="notch" onClick={onBack} title="Back" ariaLabel="Back" />

      <AnimatedPlaceholder
        label="COMING SOON"
        subtitle="Kubernetes settings are under active development for Free Cloud Initiative."
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
