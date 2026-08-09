import { useState } from 'react'

interface Shortcut {
  key: string
  label: string
}

interface QuickLink {
  id: string
  label: string
  detail: string
}

const SHORTCUTS: Shortcut[] = [
  { key: 'b', label: 'back' },
  { key: 'd', label: 'Delete' },
  { key: 'r', label: 'Restart' },
  { key: 'e', label: 'Edit' },
  { key: '?', label: 'Help' },
]

const QUICK_LINKS: QuickLink[] = [
  { id: 'grafana', label: 'Grafana', detail: '(shortcuts of grafana)' },
  { id: 'docs', label: 'Docs', detail: '' },
]

export function ContextBar() {
  const [openLinkId, setOpenLinkId] = useState<string | null>(null)

  return (
    <div className="flex shrink-0 gap-16 pl-4">
      <ul>
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.key}>
            <span className="text-tui-accent">{`<${shortcut.key}>`}</span> {shortcut.label}
          </li>
        ))}
      </ul>

      <ul>
        {QUICK_LINKS.map((link) => {
          const expanded = openLinkId === link.id
          return (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => setOpenLinkId(expanded ? null : link.id)}
                aria-expanded={expanded}
                className="text-left text-tui-fg hover:text-tui-accent"
              >
                [{expanded ? '▼' : '>'}] {link.label}
              </button>
              {expanded && link.detail && <div className="pl-4 text-tui-fg/60">... {link.detail}</div>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
