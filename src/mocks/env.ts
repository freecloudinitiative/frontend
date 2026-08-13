/**
 * Helper to determine whether Mock Service Worker (MSW) should be initialized.
 * Returns true for 'nonprod' or undefined/default environments; false for 'prod'.
 */
export function shouldStartMsw(
  appEnv: string | undefined = import.meta.env.VITE_APP_ENV,
): boolean {
  return appEnv !== 'prod'
}
