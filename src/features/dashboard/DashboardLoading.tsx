interface DashboardLoadingProps {
  label?: string
  style?: React.CSSProperties
}

export function DashboardLoading({ label = 'LOADING...', style }: DashboardLoadingProps) {
  return (
    <span className="fci-blink" style={{ color: 'var(--dash-text-dim)', letterSpacing: '0.08em', ...style }}>
      [ {label} ]
    </span>
  )
}
