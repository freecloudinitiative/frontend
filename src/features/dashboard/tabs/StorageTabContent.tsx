import { lazy, Suspense } from 'react'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { useBucketFiles } from '@/features/storage/hooks'
import { formatBytes, formatDate } from '@/lib/format'
import { DASH_COLORS } from '@/lib/theme'
import { ErrorRetry } from './shared/ErrorRetry'
import { NoInstanceSelectedFallback } from './shared/NoInstanceSelectedFallback'

const StorageMetricsTab = lazy(() => import('./StorageMetricsTab').then((m) => ({ default: m.StorageMetricsTab })))

interface StorageTabContentProps {
  tab: RoutedTab
  selectedBucketId: string | null
  bucketName?: string
}

export function StorageTabContent({ tab, selectedBucketId }: StorageTabContentProps) {
  const { dim, label, amber } = DASH_COLORS

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
    if (!selectedBucketId) {
      return <NoInstanceSelectedFallback />
    }

    return (
      <Suspense fallback={<div className="fci-tab-content"><DashboardLoading label="LOADING METRICS..." /></div>}>
        <StorageMetricsTab selectedBucketId={selectedBucketId} dim={dim} />
      </Suspense>
    )
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
    return <NoInstanceSelectedFallback />
  }

  if (isError && !files) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Bucket Contents</div>
        <ErrorRetry resourceLabel="objects" onRetry={() => refetch()} />
      </div>
    )
  }

  if (isLoading || !files) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">Bucket Contents</div>
        <div style={{ marginTop: 14 }}><DashboardLoading label="LOADING OBJECTS..." /></div>
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
                <td style={{ color: dim }}>{formatDate(file.lastModified)}</td>
                <td>{file.storageClass.toUpperCase()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
