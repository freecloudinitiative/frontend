import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { useDatabaseMetrics } from '@/features/database/hooks'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import { ErrorRetry } from './shared/ErrorRetry'

function formatTimeLabel(timestamp: string) {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function MetricChart({
  title,
  color,
  data,
}: {
  title: string
  color: string
  data: { time: string; value: number }[]
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="fci-section-title">{title}</div>
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="var(--dash-border-subtle)" strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="var(--dash-text-dim)" tick={{ fill: 'var(--dash-text-dim)', fontSize: 11 }} />
            <YAxis
              stroke="var(--dash-text-dim)"
              tick={{ fill: 'var(--dash-text-dim)', fontSize: 11 }}
              width={40}
            />
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: '1px solid var(--dash-border-subtle)' }}
              labelStyle={{ color: 'var(--dash-text)' }}
            />
            <Line type="monotone" dataKey="value" name={title} stroke={color} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function DatabaseMetricsTab({
  selectedDatabaseId,
  maxConnections,
  dim,
}: {
  selectedDatabaseId: string | null
  maxConnections?: number
  dim: string
}) {
  const { data: metrics, isLoading, isError, refetch } = useDatabaseMetrics(selectedDatabaseId ?? undefined)

  if (!selectedDatabaseId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div style={{ color: dim }}>Select a database to view metrics</div>
      </div>
    )
  }

  if (isError && !metrics) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <ErrorRetry resourceLabel="metrics" onRetry={() => refetch()} />
      </div>
    )
  }

  if (isLoading || !metrics) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div style={{ marginTop: 14 }}><DashboardLoading label="LOADING METRICS..." /></div>
      </div>
    )
  }

  if (metrics.length === 0) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div style={{ color: dim, marginTop: 14 }}>No metrics data available yet.</div>
      </div>
    )
  }

  const latest = metrics[metrics.length - 1]
  const connectionsPct = maxConnections ? Math.round((latest.connections / maxConnections) * 100) : 0

  const connectionsData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.connections }))
  const qpsData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.queriesPerSecond }))
  const diskIoData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.diskIO }))

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Metrics</div>
      <AsciiProgressBar label="CPU" value={latest.cpuUsage} width={20} />
      <AsciiProgressBar label="Mem" value={latest.memoryUsage} width={20} />
      <AsciiProgressBar label="Conn" value={connectionsPct} width={20} />
      <MetricChart title="Connections" color="#4fa8dc" data={connectionsData} />
      <MetricChart title="Queries/sec" color="#e8c07d" data={qpsData} />
      <MetricChart title="Disk I/O" color="#7ec87e" data={diskIoData} />
    </div>
  )
}
