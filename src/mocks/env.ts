/**
 * Helper to determine whether Mock Service Worker (MSW) should be initialized.
 * Mocks are enabled only by an explicit non-production environment. Unknown
 * values fail closed so a typo cannot expose the simulated control plane.
 * Production builds never include mock handlers; deploying one with appEnv set
 * to nonprod still serves the real API.
 */
export function shouldStartMsw(
  appEnv: string | undefined = import.meta.env.VITE_APP_ENV,
  isDev: boolean = import.meta.env.DEV,
): boolean {
  return isDev && appEnv === 'nonprod'
}
