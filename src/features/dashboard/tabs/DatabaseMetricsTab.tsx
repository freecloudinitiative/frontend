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
import { ErrorRetry } from './shared/ErrorRetry'
import { NoInstanceSelectedFallback } from './shared/NoInstanceSelectedFallback'

function formatTimeLabel(timestamp: string) {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function MetricChart({
  title,
  color,
  data,
  unit,
  domain,
}: {
  title: string
  color: string
  data: { time: string; value: number }[]
  unit?: string
  domain?: [number | string, number | string]
}) {
  return (
    <div style={{ marginTop: 14, minWidth: 0, width: '100%' }}>
      <div className="fci-section-title">{title}</div>
      <div style={{ height: 140, minWidth: 0, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data}>
            <CartesianGrid stroke="var(--dash-border-subtle)" strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="var(--dash-text-dim)" tick={{ fill: 'var(--dash-text-dim)', fontSize: 11 }} />
            <YAxis
              domain={domain}
              unit={unit}
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
  maxConnections: _maxConnections,
  dim,
}: {
  selectedDatabaseId: string | null
  maxConnections?: number
  dim: string
}) {
  const { data: metrics, isLoading, isError, refetch } = useDatabaseMetrics(selectedDatabaseId ?? undefined)

  if (!selectedDatabaseId) {
    return <NoInstanceSelectedFallback />
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

  const cpuData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.cpuUsage }))
  const memoryData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.memoryUsage }))
  const connectionsData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.connections }))
  const qpsData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.queriesPerSecond }))
  const diskIoData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.diskIO }))

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Metrics</div>
      <MetricChart title="vCPU" color="#4fa8dc" data={cpuData} domain={[0, 100]} unit="%" />
      <MetricChart title="Memory" color="#e8c07d" data={memoryData} domain={[0, 100]} unit="%" />
      <MetricChart title="Connections" color="#60a5fa" data={connectionsData} />
      <MetricChart title="Queries/sec" color="#f472b6" data={qpsData} />
      <MetricChart title="Disk I/O" color="#7ec87e" data={diskIoData} />
    </div>
  )
}
