import type { TuiStatus } from '@/lib/tui-theme'

interface StatusBadgeProps {
  status: TuiStatus
}

const STATUS_LABEL: Record<TuiStatus, string> = {
  running: 'running',
  stopped: 'stopped',
  pending: 'pending',
}

const STATUS_CLASSES: Record<TuiStatus, string> = {
  running: 'bg-tui-running',
  stopped: 'bg-tui-stopped',
  pending: 'bg-tui-pending',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm text-tui-fg">
      <span className={`h-2 w-2 rounded-full ${STATUS_CLASSES[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}
