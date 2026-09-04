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
import { useBucketMetrics } from '@/features/storage/hooks'
import { formatBytes } from '@/lib/format'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'
import { ErrorRetry } from './shared/ErrorRetry'
import { NoInstanceSelectedFallback } from './shared/NoInstanceSelectedFallback'

const ONE_TB = 1024 ** 4

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
    <div style={{ marginTop: 14, minWidth: 0, width: '100%' }}>
      <div className="fci-section-title">{title}</div>
      <div style={{ height: 140, minWidth: 0, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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

export interface StorageMetricsTabProps {
  selectedBucketId: string | null
  dim: string
}

export function StorageMetricsTab({ selectedBucketId, dim }: StorageMetricsTabProps) {
  const { data: metrics, isLoading, isError, refetch } = useBucketMetrics(selectedBucketId ?? undefined)

  if (!selectedBucketId) {
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
        <div style={{ color: dim, marginTop: 14 }}>No metrics available for this bucket.</div>
      </div>
    )
  }

  const latest = metrics[metrics.length - 1]
  const sizePct = Math.round((latest.totalSize / ONE_TB) * 100)

  const readOpsData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.readOps }))
  const writeOpsData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.writeOps }))
  const objectCountData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp), value: point.objectCount }))

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Metrics</div>
      <AsciiProgressBar label="Size" value={sizePct} width={20} />
      <div style={{ color: dim, fontSize: '0.78rem', marginTop: 4 }}>
        {formatBytes(latest.totalSize)} of 1 TB · {latest.objectCount} objects
      </div>
      <MetricChart title="Read Ops" color="#4fa8dc" data={readOpsData} />
      <MetricChart title="Write Ops" color="#e8c07d" data={writeOpsData} />
      <MetricChart title="Object Count" color="#7ec87e" data={objectCountData} />
    </div>
  )
}
