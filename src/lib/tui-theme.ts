// Typed constants mirroring the CSS custom properties defined in
// `pages/tui-dashboard.css`. Use these for programmatic theming in
// Recharts series colours and Xterm.js theme configuration.
//
// Do NOT add Tailwind utilities or --tui-* variables here — the dashboard
// design system lives exclusively in tui-dashboard.css.

/** Status values used by Compute Engines (and the /ui-preview legacy StatusBadge). */
export type TuiStatus = 'running' | 'stopped' | 'pending'

/**
 * Default-theme colour constants that mirror `--dash-*` CSS variables.
 * These values match the `default` theme block in `tui-dashboard.css` and
 * are stable across releases — theme overrides live in the CSS, not here.
 */
export const DASH_COLORS = {
  /** Page background — var(--dash-bg) */
  bg: '#000000',
  /** Panel/box border — var(--dash-border) */
  border: '#3a6ea5',
  /** Link/label accent — var(--dash-accent) */
  accent: '#4fa8dc',
  /** Active-service label / amber keybinding hint — var(--dash-label) */
  label: '#e8a020',
  /** Primary body text — var(--dash-text) */
  text: '#dcdcdc',
  /** Dimmed/secondary text — var(--dash-text-dim) */
  textDim: '#8a97a5',
  /** Hover background — var(--dash-hover-bg) */
  hoverBg: '#0d1a28',
  // Status colours — consistent across all 4 themes
  /** Running / healthy — #7ec87e */
  statusRunning: '#7ec87e',
  /** Stopped / error — #e0546a */
  statusStopped: '#e0546a',
  /** Pending / in-progress — #e8c07d */
  statusPending: '#e8c07d',
} as const

export type DashColor = keyof typeof DASH_COLORS
