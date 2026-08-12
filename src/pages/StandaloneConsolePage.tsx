import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import './tui-dashboard.css'

const TerminalView = lazy(() => import('@/components/terminal/TerminalView').then((m) => ({ default: m.TerminalView })))

export function StandaloneConsolePage() {
  const { vmName } = useParams<{ vmName: string }>()

  return (
    <div className="fci-terminal-standalone">
      <Suspense fallback={<DashboardLoading label="LOADING CONSOLE..." />}>
        <TerminalView mode="mock" vmName={vmName} title={`Serial Console — ${vmName ?? ''}`} />
      </Suspense>
    </div>
  )
}
