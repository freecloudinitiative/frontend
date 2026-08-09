import type { TuiStatus } from '@/lib/tui-theme'

interface StatusBadgeProps {
  status: TuiStatus
}

const STATUS_LABEL: Record<TuiStatus, string> = {
  running: 'RUNNING',
  stopped: 'STOPPED',
  pending: 'PENDING',
}

const STATUS_CLASSES: Record<TuiStatus, string> = {
  running: 'text-tui-running',
  stopped: 'text-tui-stopped',
  pending: 'text-tui-pending',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`font-mono text-sm ${STATUS_CLASSES[status]}`}>
      [ {STATUS_LABEL[status]} ]
    </span>
  )
}
