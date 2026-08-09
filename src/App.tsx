import { UiPreview } from '@/app/UiPreview'

function App() {
  if (window.location.pathname === '/ui-preview') {
    return <UiPreview />
  }

  return (
    <div>
      <p>TUI Cloud Dashboard — scaffold OK</p>
    </div>
  )
}

export default App
