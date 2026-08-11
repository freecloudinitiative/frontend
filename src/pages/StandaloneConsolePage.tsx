import { useParams } from 'react-router-dom'
import { TerminalView } from '@/components/terminal/TerminalView'
import './tui-dashboard.css'

export function StandaloneConsolePage() {
  const { vmName } = useParams<{ vmName: string }>()

  return (
    <div className="fci-terminal-standalone">
      <TerminalView mode="mock" vmName={vmName} title={`Serial Console — ${vmName ?? ''}`} />
    </div>
  )
}
