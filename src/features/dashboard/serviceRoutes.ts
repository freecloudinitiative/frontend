import type { RoutedTab } from '@/features/dashboard/constants'

const SERVICE_LEVEL_TABS = new Set<RoutedTab>(['info', 'create'])

export function isInstanceScopedTab(tab: RoutedTab): boolean {
  return !SERVICE_LEVEL_TABS.has(tab)
}

export function serviceTabPath(serviceSlug: string, tab: RoutedTab, resourceId?: string | null): string {
  const base = `/services/${serviceSlug}`
  if (resourceId && isInstanceScopedTab(tab)) {
    return `${base}/${encodeURIComponent(resourceId)}/${tab}`
  }
  return `${base}/${tab}`
}

export function serviceResourcePath(serviceSlug: string, resourceId: string, tab: RoutedTab = 'details'): string {
  return serviceTabPath(serviceSlug, tab, resourceId)
}
