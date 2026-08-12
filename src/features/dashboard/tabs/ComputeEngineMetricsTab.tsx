import { useState } from 'react'
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
import { useComputeEngineMetrics } from '@/features/computeEngine/hooks'
import type { MetricRange } from '@/features/computeEngine/types'

const RANGE_OPTIONS: { value: MetricRange; label: string }[] = [
  { value: '30m', label: 'Last 30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '3h', label: '3 hours' },
  { value: '1w', label: '1 week' },
]

function formatTimeLabel(timestamp: string, range: MetricRange) {
  const date = new Date(timestamp)
  if (range === '1w') {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  }
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
              domain={[0, 100]}
              unit="%"
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

export function ComputeEngineMetricsTab({ selectedComputeEngineId, dim }: { selectedComputeEngineId: string | null; dim: string }) {
  const [range, setRange] = useState<MetricRange>('1h')
  const { data: metrics, isLoading, isError, refetch } = useComputeEngineMetrics(selectedComputeEngineId ?? undefined, range)

  const rangeSelector = (
    <div className="fci-range-selector">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === range ? 'fci-range-btn fci-range-btn-active' : 'fci-range-btn'}
          onClick={() => setRange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  if (!selectedComputeEngineId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div style={{ color: dim }}>Select a Compute Engine to view metrics</div>
      </div>
    )
  }

  if (isError && !metrics) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        {rangeSelector}
        <div style={{ color: 'var(--dash-status-down)', marginTop: 14 }}>
          ⚠️ Failed to load metrics.{' '}
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              background: 'transparent',
              border: '1px solid var(--dash-border-subtle)',
              color: 'var(--dash-text)',
              padding: '2px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
              marginLeft: '6px',
              fontSize: '11px',
            }}
          >
            ↻ Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !metrics) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        {rangeSelector}
        <div style={{ marginTop: 14 }}><DashboardLoading label="LOADING METRICS..." /></div>
      </div>
    )
  }

  const cpuData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp, range), value: point.cpu }))
  const memoryData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp, range), value: point.memory }))
  const diskData = metrics.map((point) => ({ time: formatTimeLabel(point.timestamp, range), value: point.disk }))

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Metrics</div>
      {rangeSelector}
      <MetricChart title="CPU" color="#4fa8dc" data={cpuData} />
      <MetricChart title="Memory" color="#e8c07d" data={memoryData} />
      <MetricChart title="Disk" color="#7ec87e" data={diskData} />
    </div>
  )
}
