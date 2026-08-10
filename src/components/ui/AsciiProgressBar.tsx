interface AsciiProgressBarProps {
  label: string
  value: number
  width?: number
}

const DEFAULT_BAR_WIDTH = 20

export function AsciiProgressBar({ label, value, width = DEFAULT_BAR_WIDTH }: AsciiProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const filledCount = Math.round((clamped / 100) * width)
  const filled = '█'.repeat(filledCount)
  const empty = '░'.repeat(width - filledCount)

  return (
    <div className="fci-progress-bar">
      <span className="fci-progress-bar-label">{label}</span>
      <span className="fci-progress-bar-filled">{filled}</span>
      <span className="fci-progress-bar-empty">{empty}</span>
      <span className="fci-progress-bar-label">{clamped}%</span>
    </div>
  )
}
