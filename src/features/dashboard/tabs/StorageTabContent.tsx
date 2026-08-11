import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RoutedTab } from '@/features/dashboard/constants'
import { useBucketFiles, useBucketMetrics } from '@/features/storage/hooks'
import { formatBytes } from '@/features/storage/format'
import { AsciiProgressBar } from '@/components/ui/AsciiProgressBar'

interface StorageTabContentProps {
  tab: RoutedTab
  selectedBucketId: string | null
  bucketName?: string
}

const ONE_TB = 1024 ** 4

export function StorageTabContent({ tab, selectedBucketId }: StorageTabContentProps) {
  const dim = 'var(--dash-text-dim)'
  const label = 'var(--dash-label)'
  const amber = '#e8c07d'

  // ── Objects ───────────────────────────────────────────────────────────────
  if (tab === 'objects') {
    return <ObjectsTab selectedBucketId={selectedBucketId} dim={dim} label={label} />
  }

  // ── Access (Storage) ──────────────────────────────────────────────────────
  if (tab === 'access') {
    return (
      <div className="fci-tab-content">
        {/* TODO: no access-policy endpoint exists yet — this table is static demo data. */}
        <div className="fci-section-title">IAM Bindings</div>
        <table className="fci-table">
          <thead><tr><th>Principal</th><th>Role</th><th>Condition</th></tr></thead>
          <tbody>
            <tr><td style={{ color: label }}>serviceAccount:app@proj.iam</td><td>roles/storage.objectViewer</td><td style={{ color: dim }}>—</td></tr>
            <tr><td style={{ color: label }}>user:root@HEAD</td><td>roles/storage.admin</td><td style={{ color: dim }}>—</td></tr>
            <tr><td style={{ color: label }}>allUsers</td><td>roles/storage.objectViewer</td><td style={{ color: amber }}>path prefix: /public/</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── Metrics (Storage) ─────────────────────────────────────────────────────
  if (tab === 'metrics') {
    return <MetricsTab selectedBucketId={selectedBucketId} dim={dim} />
  }

  return null
}

function ObjectsTab({
  selectedBucketId,
  dim,
  label,
}: {
  selectedBucketId: string | null
  dim: string
  label: string
}) {
  const { data: files, isLoading, isError, refetch } = useBucketFiles(selectedBucketId ?? undefined)

  if (!selectedBucketId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Bucket Contents</div>
        <div style={{ color: dim }}>Select a bucket to view objects.</div>
      </div>
    )
  }

  if (isError && !files) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Bucket Contents</div>
        <div style={{ color: 'var(--dash-status-down)', marginTop: 14 }}>
          ⚠️ Failed to load objects.{' '}
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

  if (isLoading || !files) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Bucket Contents</div>
        <div className="fci-blink" style={{ color: dim, marginTop: 14 }}>⏳ Loading objects…</div>
      </div>
    )
  }

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">Bucket Contents</div>
      <table className="fci-table">
        <thead><tr><th>Key</th><th>Size</th><th>Modified</th><th>Class</th></tr></thead>
        <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: dim, padding: '1.5rem 0' }}>
                No objects in this bucket.
              </td>
            </tr>
          ) : (
            files.map((file) => (
              <tr key={file.id}>
                <td style={{ color: label }}>{file.key}</td>
                <td>{formatBytes(file.size)}</td>
                <td style={{ color: dim }}>{new Date(file.lastModified).toLocaleDateString()}</td>
                <td>{file.storageClass.toUpperCase()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

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

function MetricsTab({ selectedBucketId, dim }: { selectedBucketId: string | null; dim: string }) {
  const { data: metrics, isLoading, isError, refetch } = useBucketMetrics(selectedBucketId ?? undefined)

  if (!selectedBucketId) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div style={{ color: dim }}>Select a bucket to view metrics</div>
      </div>
    )
  }

  if (isError && !metrics) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
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

  if (isLoading || !metrics || metrics.length === 0) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Metrics</div>
        <div className="fci-blink" style={{ color: dim, marginTop: 14 }}>⏳ Loading metrics…</div>
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
