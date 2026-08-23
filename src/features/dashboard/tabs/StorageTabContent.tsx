import { lazy, Suspense } from 'react'
import type { RoutedTab } from '@/features/dashboard/constants'
import { DashboardLoading } from '@/features/dashboard/DashboardLoading'
import { useBucketAccessPolicies, useBucketFiles } from '@/features/storage/hooks'
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
  const { dim, label } = DASH_COLORS

  // ── Objects ───────────────────────────────────────────────────────────────
  if (tab === 'objects') {
    return <ObjectsTab selectedBucketId={selectedBucketId} dim={dim} label={label} />
  }

  // ── Access (Storage) ──────────────────────────────────────────────────────
  if (tab === 'access') {
    return <AccessTab selectedBucketId={selectedBucketId} dim={dim} label={label} />
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

function AccessTab({
  selectedBucketId,
  dim,
  label,
}: {
  readonly selectedBucketId: string | null
  readonly dim: string
  readonly label: string
}) {
  const { data: policies, isLoading, isError, refetch } = useBucketAccessPolicies(selectedBucketId ?? undefined)

  if (!selectedBucketId) {
    return <NoInstanceSelectedFallback />
  }

  if (isError) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">IAM Bindings</div>
        <ErrorRetry resourceLabel="access policies" onRetry={() => refetch()} />
      </div>
    )
  }

  if (isLoading || !policies) {
    return (
      <div className="fci-tab-content">
        <div className="fci-section-title">IAM Bindings</div>
        <div style={{ marginTop: 14 }}><DashboardLoading label="LOADING ACCESS POLICIES..." /></div>
      </div>
    )
  }

  return (
    <div className="fci-tab-content">
      <div className="fci-section-title">IAM Bindings</div>
      <div
        style={{
          marginTop: 10,
          marginBottom: 16,
          padding: '10px 14px',
          borderLeft: '3px solid #c8891a',
          background: 'rgba(200, 137, 26, 0.08)',
          borderRadius: '0 4px 4px 0',
          fontSize: '0.83rem',
          lineHeight: 1.55,
          color: 'var(--dash-text)',
        }}
      >
        <strong style={{ color: '#c8891a', display: 'block', marginBottom: 4 }}>
          ⚠ Access policies are recorded but not enforced in v1.
        </strong>{' '}
        Access is controlled by account and bucket isolation, not per-principal rules.
      </div>
      <table className="fci-table">
        <thead><tr><th>Principal</th><th>Permission</th><th>Resource</th><th>Created</th></tr></thead>
        <tbody>
          {policies.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: dim, padding: '1.5rem 0' }}>
                No access policies for this bucket.
              </td>
            </tr>
          ) : (
            policies.map((policy) => (
              <tr key={policy.id}>
                <td style={{ color: label }}>{policy.principal}</td>
                <td>{policy.permission}</td>
                <td>{policy.resource}</td>
                <td style={{ color: dim }}>{formatDate(policy.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
