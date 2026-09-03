import { useThemeStore } from '@/store/themeStore'

interface AsciiProgressBarProps {
  label: string
  value: number
  width?: number
}

const DEFAULT_BAR_WIDTH = 20

export function AsciiProgressBar({ label, value, width = DEFAULT_BAR_WIDTH }: AsciiProgressBarProps) {
  const theme = useThemeStore((s) => s.theme)
  const clamped = Math.max(0, Math.min(100, value))
  const filledCount = Math.round((clamped / 100) * width)
  const filledChar = theme === 'sketch' ? '▓' : '█'
  const emptyChar = theme === 'sketch' ? '▒' : '░'
  const rounded = Math.round(clamped)
  const filled = filledChar.repeat(filledCount)
  const empty = emptyChar.repeat(width - filledCount)

  return (
    <div className="fci-progress-bar">
      <span className="fci-progress-bar-label">{label}</span>
      <span className="fci-progress-bar-filled">{filled}</span>
      <span className="fci-progress-bar-empty">{empty}</span>
      <span className="fci-progress-bar-label">{rounded}%</span>
    </div>
  )
}
