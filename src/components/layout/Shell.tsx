import { ContextBar } from '@/components/layout/ContextBar'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Divider } from '@/components/ui/Divider'
import { Panel } from '@/components/ui/Panel'

export function Shell() {
  return (
    <div className="h-screen bg-tui-bg p-1">
      <Panel className="h-full">
        <div className="flex h-full">
          <Sidebar />
          <Divider orientation="vertical" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
            <Header />
            <Divider />
            <ContextBar />
            <Divider />
            <main className="min-h-0 flex-1 overflow-y-auto pl-4">
              {/* Route content will render here via <Outlet /> once routing is wired up in PR #4 */}
              <p className="text-tui-fg/60">Content outlet placeholder</p>
            </main>
          </div>
        </div>
      </Panel>
    </div>
  )
}
