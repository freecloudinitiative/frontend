import { createElement } from 'react'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { SERVICE_DATASETS, type ServiceRow } from '@/features/dashboard/serviceCatalog'

type CellInfo = { getValue: () => unknown }

/**
 * Column widths in px. The table is `table-layout: fixed`, so these are the
 * layout: a value longer than its column ellipsizes rather than stretching the
 * table and squeezing the detail panel next to it. Leftover width is shared
 * between columns in proportion to these numbers, so they read as ratios as
 * much as absolute sizes. Endpoint is the widest because it holds a service
 * FQDN; it still truncates, with the full value on hover.
 */
const WIDTH = {
  id: 78,
  /** Names are user-chosen and unbounded, so this is a comfortable size, not a fit. */
  name: 135,
  status: 73,
  /** Engine, MFA. */
  engine: 75,
  /** Version, Mem, Storage, Size, Role, Type, Region — short, self-limiting values. */
  compact: 60,
  /** vCPU and Size: "16 vCPU", "14.6 GB" — a little wider than compact. */
  compactPlus: 66,
  /**
   * Endpoint holds a service FQDN, far longer than any column could show in a
   * ten-column table. It takes what is left once the bounded columns are
   * satisfied and truncates, with the full value on hover and in Details.
   */
  endpoint: 79,
  /** OS, IP, CIDR, Gateway, Last Login, Objects — fits a 15-character IPv4 address. */
  medium: 122,
  /** Access — fits "Public-read-write". */
  wide: 145,
} as const

/**
 * Weight of the trailing actions column. It carries fixed-size UI (two metric
 * bars and two buttons) rather than text, so it is the one column that must
 * not be squeezed.
 */
export const ACTIONS_COLUMN_WIDTH = 198

function idColumn(): ColumnDef<ServiceRow> {
  return {
    accessorKey: 'id',
    header: '#',
    size: WIDTH.id,
    cell: (info: CellInfo) => String(info.getValue() ?? '').slice(0, 8),
  }
}

function textColumn(key: keyof ServiceRow, header: string, size: number): ColumnDef<ServiceRow> {
  return { accessorKey: key, header, size }
}

function coloredColumn(
  key: keyof ServiceRow,
  header: string,
  colors: Record<string, string> | undefined,
  size: number,
  fallback = 'var(--dash-text)',
): ColumnDef<ServiceRow> {
  return {
    accessorKey: key,
    header,
    size,
    cell: (info: CellInfo) => {
      const value = String(info.getValue() ?? '')
      const color = colors?.[value] ?? fallback
      return createElement('span', { style: { color } }, value)
    },
  }
}

export function getComputeEngineColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors } = SERVICE_DATASETS['Compute Engine']
  return [
    idColumn(),
    textColumn('name', 'Name', WIDTH.name),
    coloredColumn('status', 'Status', statusColors, WIDTH.status),
    textColumn('col3', 'OS', WIDTH.medium),
    textColumn('col4', 'IP', WIDTH.medium),
    textColumn('col5', 'Mem', WIDTH.compact),
    textColumn('col6', 'vCPU', WIDTH.compactPlus),
  ]
}

export function getDatabaseColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors } = SERVICE_DATASETS.Database
  return [
    idColumn(),
    textColumn('name', 'Name', WIDTH.name),
    coloredColumn('status', 'Status', statusColors, WIDTH.status),
    textColumn('col3', 'Engine', WIDTH.engine),
    textColumn('col7', 'Version', WIDTH.compact),
    textColumn('col4', 'Endpoint', WIDTH.endpoint),
    textColumn('col5', 'Mem', WIDTH.compact),
    textColumn('col6', 'Storage', WIDTH.compact),
    textColumn('col8', 'vCPU', WIDTH.compactPlus),
  ]
}

export function getIamColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors } = SERVICE_DATASETS.IAM
  return [
    idColumn(),
    textColumn('name', 'User', WIDTH.name),
    coloredColumn('status', 'Status', statusColors, WIDTH.status),
    textColumn('col3', 'Role', WIDTH.compact),
    textColumn('col4', 'Last Login', WIDTH.medium),
    textColumn('col5', 'MFA', WIDTH.engine),
    textColumn('region', 'Region', WIDTH.compact),
  ]
}

export function getNetworkColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors } = SERVICE_DATASETS.Network
  return [
    idColumn(),
    textColumn('name', 'Name', WIDTH.name),
    coloredColumn('status', 'Status', statusColors, WIDTH.status),
    textColumn('col3', 'Type', WIDTH.compact),
    textColumn('col4', 'CIDR', WIDTH.medium),
    textColumn('region', 'Region', WIDTH.compact),
    textColumn('col5', 'Gateway', WIDTH.medium),
  ]
}

export function getStorageColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors, col3Colors, col5Colors } = SERVICE_DATASETS.Storage
  return [
    idColumn(),
    textColumn('name', 'Name', WIDTH.name),
    coloredColumn('status', 'Status', statusColors, WIDTH.status),
    coloredColumn('col3', 'Access', col3Colors, WIDTH.wide),
    textColumn('col4', 'Size', WIDTH.compactPlus),
    textColumn('region', 'Region', WIDTH.compact),
    coloredColumn('col5', 'Objects', col5Colors, WIDTH.medium, 'var(--dash-text-dim)'),
  ]
}
