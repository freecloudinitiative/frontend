import { createElement } from 'react'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { SERVICE_DATASETS, type ServiceRow } from '@/features/dashboard/serviceCatalog'

type CellInfo = { getValue: () => unknown }

function idColumn(): ColumnDef<ServiceRow> {
  return {
    accessorKey: 'id',
    header: '#',
    cell: (info: CellInfo) => String(info.getValue() ?? '').slice(0, 8),
  }
}

function textColumn(key: keyof ServiceRow, header: string): ColumnDef<ServiceRow> {
  return { accessorKey: key, header }
}

function coloredColumn(
  key: keyof ServiceRow,
  header: string,
  colors: Record<string, string> | undefined,
  fallback = 'var(--dash-text)',
): ColumnDef<ServiceRow> {
  return {
    accessorKey: key,
    header,
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
    textColumn('name', 'Name'),
    coloredColumn('status', 'Status', statusColors),
    textColumn('col3', 'OS'),
    textColumn('col4', 'IP'),
    textColumn('col5', 'Mem'),
    textColumn('col6', 'CPU'),
  ]
}

export function getDatabaseColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors } = SERVICE_DATASETS.Database
  return [
    idColumn(),
    textColumn('name', 'Name'),
    coloredColumn('status', 'Status', statusColors),
    textColumn('col3', 'Engine'),
    textColumn('col4', 'Endpoint'),
    textColumn('col5', 'Mem'),
    textColumn('col6', 'Storage'),
  ]
}

export function getIamColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors } = SERVICE_DATASETS.IAM
  return [
    idColumn(),
    textColumn('name', 'User'),
    coloredColumn('status', 'Status', statusColors),
    textColumn('col3', 'Role'),
    textColumn('col4', 'Last Login'),
    textColumn('col5', 'MFA'),
    textColumn('region', 'Region'),
  ]
}

export function getNetworkColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors } = SERVICE_DATASETS.Network
  return [
    idColumn(),
    textColumn('name', 'Name'),
    coloredColumn('status', 'Status', statusColors),
    textColumn('col3', 'Type'),
    textColumn('col4', 'CIDR'),
    textColumn('region', 'Region'),
    textColumn('col5', 'Gateway'),
  ]
}

export function getStorageColumns(): ColumnDef<ServiceRow>[] {
  const { statusColors, col3Colors, col5Colors } = SERVICE_DATASETS.Storage
  return [
    idColumn(),
    textColumn('name', 'Name'),
    coloredColumn('status', 'Status', statusColors),
    coloredColumn('col3', 'Access', col3Colors),
    textColumn('col4', 'Size'),
    textColumn('region', 'Region'),
    coloredColumn('col5', 'Objects', col5Colors, 'var(--dash-text-dim)'),
  ]
}
