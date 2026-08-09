import { useThemeStore, type ThemeId } from '@/store/themeStore'

const THEMES: { id: ThemeId; label: string; bg: string; border: string }[] = [
  { id: 'beige', label: 'Beige', bg: '#ece0c8', border: '#9c7a45' },
  { id: 'mono', label: 'Black & white', bg: '#000000', border: '#ffffff' },
  { id: 'default', label: 'Default', bg: '#000000', border: '#3a6ea5' },
  { id: 'navy', label: 'Dark navy', bg: '#0a0e1a', border: '#3a4166' },
]

export function ThemeSwitcher() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  return (
    <div className="fci-theme-switcher">
      {THEMES.map((option) => (
        <button
          key={option.id}
          type="button"
          title={option.label}
          aria-label={`${option.label} theme`}
          aria-pressed={theme === option.id}
          className={`fci-theme-btn${theme === option.id ? ' fci-theme-btn-active' : ''}`}
          style={{ background: option.bg, borderColor: option.border }}
          onClick={() => setTheme(option.id)}
        />
      ))}
    </div>
  )
}
