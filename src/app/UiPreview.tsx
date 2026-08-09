import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TuiStatus } from '@/lib/tui-theme'

const STATUSES: TuiStatus[] = ['running', 'stopped', 'pending']

export function UiPreview() {
  return (
    <div className="min-h-screen space-y-6 p-6">
      <h1 className="text-lg text-tui-accent">/ui-preview</h1>

      <Panel title="Panel">
        <p>This is a panel with a title bar and a bordered, square-cornered body.</p>
      </Panel>

      <Panel title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button variant="danger" disabled>
            Disabled Danger
          </Button>
        </div>
      </Panel>

      <Panel title="StatusBadge">
        <div className="flex flex-wrap items-center gap-4">
          {STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Panel>
    </div>
  )
}
