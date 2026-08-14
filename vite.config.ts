import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@monaco-editor') || id.includes('node_modules/monaco-editor')) return 'vendor-monaco'
          if (id.includes('node_modules/sql-formatter')) return 'vendor-sql-formatter'
          if (id.includes('node_modules/recharts')) return 'vendor-charts'
          if (id.includes('node_modules/@xterm')) return 'vendor-terminal'
          if (id.includes('node_modules/@tanstack')) return 'vendor-query'
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/react-oidc-context') ||
            id.includes('node_modules/zustand') ||
            id.includes('node_modules/axios')
          ) {
            return 'vendor-core'
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    typecheck: { tsconfig: './tsconfig.test.json' },
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
