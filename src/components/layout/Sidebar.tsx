import { useSidebarStore } from '@/store/sidebarStore'

interface ServiceItem {
  id: string
  label: string
}

const SERVICES: ServiceItem[] = [
  { id: 'vm', label: 'VM' },
  { id: 'database', label: 'Database' },
  { id: 'iam', label: 'IAM' },
  { id: 'network', label: 'Network' },
  { id: 'storage', label: 'Storage' },
]

export function Sidebar() {
  const openSectionIds = useSidebarStore((state) => state.openSectionIds)
  const toggle = useSidebarStore((state) => state.toggle)

  return (
    <nav className="flex h-full w-52 shrink-0 flex-col overflow-y-auto">
      {SERVICES.map((service) => {
        const expanded = openSectionIds.has(service.id)
        return (
          <div key={service.id}>
            <button
              type="button"
              onClick={() => toggle(service.id)}
              aria-expanded={expanded}
              className={`flex w-full items-center gap-1 px-2 py-0.5 text-left font-mono ${
                expanded ? 'bg-tui-accent text-tui-bg' : 'text-tui-fg hover:bg-tui-accent hover:text-tui-bg'
              }`}
            >
              <span>[{expanded ? '▼' : '>'}]</span>
              <span>{service.label}</span>
            </button>
            {expanded && (
              <div className="px-2 py-0.5 pl-7 text-tui-fg/60">{service.label} pages coming soon</div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
