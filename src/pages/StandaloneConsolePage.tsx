import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { createComputeEngineConsoleSession } from '@/features/computeEngine/api'
import { buildTerminalWsUrl } from '@/lib/websocket'
import { getRuntimeConfig } from '@/lib/runtimeConfig'
import './tui-dashboard.css'

const TerminalView = lazy(() => import('@/components/terminal/TerminalView').then((m) => ({ default: m.TerminalView })))

export function StandaloneConsolePage() {
  const { computeEngineId } = useParams<{ computeEngineId: string }>()
  const realTerminalEnabled = getRuntimeConfig().enableRealTerminal
  const wsUrlFactory = realTerminalEnabled && computeEngineId
    ? async () => {
        const session = await createComputeEngineConsoleSession(computeEngineId)
        return buildTerminalWsUrl(computeEngineId, session.ticket)
      }
    : undefined

  return (
    <div className="fci-terminal-standalone">
      <Suspense fallback={<DashboardLoading label="LOADING CONSOLE..." />}>
        <TerminalView
          mode={realTerminalEnabled ? 'websocket' : 'mock'}
          computeEngineId={computeEngineId}
          computeEngineName={computeEngineId}
          title={`Serial Console — ${computeEngineId ?? ''}`}
          wsUrlFactory={wsUrlFactory}
        />
      </Suspense>
    </div>
  )
}
