/**
 * Shared status/accent colors for the `fci-*` dashboard tabs. Every tab
 * component previously redeclared these same literals locally.
 */
export const DASH_COLORS = {
  dim: 'var(--dash-text-dim)',
  label: 'var(--dash-label)',
  green: '#7ec87e',
  amber: '#e8c07d',
  red: '#e0546a',
} as const
