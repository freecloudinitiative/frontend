export type TuiStatus = 'running' | 'stopped' | 'pending'

interface TuiThemeTokens {
  label: string
  colors: {
    bg: string
    fg: string
    accent: string
    border: string
    status: Record<TuiStatus, string>
  }
  fontFamily: string
}

export type ThemeName = 'default'

const monoFontFamily = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace"

export const themes: Record<ThemeName, TuiThemeTokens> = {
  default: {
    label: 'Retro',
    colors: {
      bg: '#000000',
      fg: '#ffffff',
      accent: '#ffffff',
      border: '#ffffff',
      status: {
        running: '#00ff00',
        stopped: '#808080',
        pending: '#ffff00',
      },
    },
    fontFamily: monoFontFamily,
  },
}

export const defaultThemeName: ThemeName = 'default'
export const tuiTheme = themes[defaultThemeName]
