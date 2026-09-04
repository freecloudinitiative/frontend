import { useThemeStore } from '@/store/themeStore'

interface AsciiProgressBarProps {
  label: string
  value: number
  width?: number
  percentagePrefix?: boolean
}

const DEFAULT_BAR_WIDTH = 20

export function AsciiProgressBar({
  label,
  value,
  width = DEFAULT_BAR_WIDTH,
  percentagePrefix = false,
}: AsciiProgressBarProps) {
  const theme = useThemeStore((s) => s.theme)
  const clamped = Math.max(0, Math.min(100, value))
  // Preserve a visible signal for any non-zero usage. With compact 10-cell
  // bars, values below 5% previously rounded to zero even while the label
  // rounded up to (for example) %5.
  const filledCount = clamped > 0 ? Math.max(1, Math.round((clamped / 100) * width)) : 0
  const filledChar = theme === 'sketch' ? '▓' : '█'
  const emptyChar = theme === 'sketch' ? '▒' : '░'
  const rounded = Math.round(clamped)
  const filled = filledChar.repeat(filledCount)
  const empty = emptyChar.repeat(width - filledCount)

  return (
    <div className="fci-progress-bar">
      <span className="fci-progress-bar-label">{label}</span>
      <span className="fci-progress-bar-track">
        <span className="fci-progress-bar-filled">{filled}</span>
        <span className="fci-progress-bar-empty">{empty}</span>
      </span>
      <span className="fci-progress-bar-label fci-progress-bar-value">
        {percentagePrefix ? `%${rounded}` : `${rounded}%`}
      </span>
    </div>
  )
}
