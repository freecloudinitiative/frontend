export const tuiTheme = {
  colors: {
    bg: '#0a0e0a',
    fg: '#d4f5d4',
    accent: '#33ff66',
    border: '#2f6b3f',
    status: {
      running: '#33ff66',
      stopped: '#ff4d4d',
      pending: '#f5d33c',
    },
  },
  fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
} as const

export type TuiTheme = typeof tuiTheme
export type TuiStatus = keyof typeof tuiTheme.colors.status
