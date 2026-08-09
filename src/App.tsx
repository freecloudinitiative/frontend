import { UiPreview } from '@/app/UiPreview'
import { Shell } from '@/components/layout/Shell'

function App() {
  if (window.location.pathname === '/ui-preview') {
    return <UiPreview />
  }

  return <Shell />
}

export default App
