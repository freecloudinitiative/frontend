/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'tui-bg': 'var(--tui-bg)',
        'tui-fg': 'var(--tui-fg)',
        'tui-accent': 'var(--tui-accent)',
        'tui-border': 'var(--tui-border)',
        'tui-running': 'var(--tui-status-running)',
        'tui-stopped': 'var(--tui-status-stopped)',
        'tui-pending': 'var(--tui-status-pending)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
