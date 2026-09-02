import { lazy, Suspense } from 'react'
import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { mintConsoleTicket } from '@/features/console/api'
import { buildTerminalWsUrl, type UrlProvider } from '@/lib/websocket'
import { getRuntimeConfig } from '@/lib/runtimeConfig'
import './tui-dashboard.css'

const TerminalView = lazy(() => import('@/components/terminal/TerminalView').then((m) => ({ default: m.TerminalView })))

export function StandaloneConsolePage() {
  const { computeEngineId } = useParams<{ computeEngineId: string }>()
  const [searchParams] = useSearchParams()
  const computeEngineName = searchParams.get('name')?.trim() || computeEngineId
  const realTerminalEnabled = getRuntimeConfig().enableRealTerminal

  const urlProvider = useMemo<UrlProvider | undefined>(() => {
    if (!realTerminalEnabled || !computeEngineId) return undefined
    return async () => {
      const { ticket } = await mintConsoleTicket(computeEngineId)
      return buildTerminalWsUrl(computeEngineId, ticket)
    }
  }, [realTerminalEnabled, computeEngineId])

  return (
    <div className="fci-terminal-standalone">
      <Suspense fallback={<DashboardLoading label="LOADING CONSOLE..." />}>
        <TerminalView
          computeEngineId={computeEngineId}
          computeEngineName={computeEngineName}
          title={`Serial Console — ${computeEngineName ?? ''}`}
          urlProvider={urlProvider}
          hideActions
        />
      </Suspense>
    </div>
  )
}
