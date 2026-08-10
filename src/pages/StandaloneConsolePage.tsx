import { useParams } from 'react-router-dom'
import { TerminalView } from '@/components/terminal/TerminalView'
import './tui-dashboard.css'

export function StandaloneConsolePage() {
  const { vmName } = useParams<{ vmName: string }>()

  return (
    <div className="fci-terminal-fullscreen" style={{ position: 'static', height: '100vh', width: '100vw' }}>
      <TerminalView mode="mock" vmName={vmName ? decodeURIComponent(vmName) : undefined} title={`Serial Console — ${vmName ?? ''}`} />
    </div>
  )
}
