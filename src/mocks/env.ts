/**
 * Helper to determine whether Mock Service Worker (MSW) should be initialized.
 * Mocks are enabled only by an explicit non-production environment. Unknown
 * values fail closed so a typo cannot expose the simulated control plane.
 */
export function shouldStartMsw(
  appEnv: string | undefined = import.meta.env.VITE_APP_ENV,
): boolean {
  return appEnv === 'nonprod'
}
