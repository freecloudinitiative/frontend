/**
 * Inline "failed to load" error state with a Retry button, shared by every
 * tab that surfaces a React Query error (metrics, bucket objects, …).
 */
export function ErrorRetry({ resourceLabel, onRetry }: { resourceLabel: string; onRetry: () => void }) {
  return (
    <div role="alert" style={{ color: 'var(--dash-status-down)', marginTop: 14 }}>
      ⚠️ Failed to load {resourceLabel}.{' '}
      <button
        type="button"
        onClick={onRetry}
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
  )
}
