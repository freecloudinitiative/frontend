/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'tui-bg': 'var(--tui-bg)',
        'tui-fg': 'var(--tui-fg)',
        'tui-accent': 'var(--tui-accent)',
        'tui-highlight': 'var(--tui-highlight)',
        'tui-border': 'var(--tui-border)',
        'tui-running': 'var(--tui-status-running)',
        'tui-stopped': 'var(--tui-status-stopped)',
        'tui-pending': 'var(--tui-status-pending)',
        'tui-vm': 'var(--tui-service-vm)',
        'tui-database': 'var(--tui-service-database)',
        'tui-iam': 'var(--tui-service-iam)',
        'tui-network': 'var(--tui-service-network)',
        'tui-storage': 'var(--tui-service-storage)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
