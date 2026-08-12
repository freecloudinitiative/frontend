import { useMemo } from 'react'
import type { ServiceId } from '@/lib/mockServiceData'
import type { Vm } from '@/features/vm/types'
import type { Database } from '@/features/database/types'
import type { IamUser } from '@/features/iam/types'
import type { Bucket } from '@/features/storage/types'
import type { Network } from '@/features/network/types'

// ── Result type ───────────────────────────────────────────────────────────────

export interface GlobalSearchResult {
  id: string
  name: string
  status: string
  serviceId: ServiceId
  serviceSlug: string
  subtitle: string  // e.g. "IST · running" or "postgres · IST"
  typeBadge: string // short badge text, e.g. "vm" | "db" | "iam" | "net" | "str"
}

// ── Input datasets ────────────────────────────────────────────────────────────

export interface GlobalSearchDatasets {
  vms: Vm[]
  databases: Database[]
  iamUsers: IamUser[]
  buckets: Bucket[]
  networks: Network[]
}

// ── Ranking helper ────────────────────────────────────────────────────────────

function rank(name: string, q: string): number {
  const n = name.toLowerCase()
  if (n === q) return 0
  if (n.startsWith(q)) return 1
  if (n.includes(q)) return 2
  return 3
}

// ── Match helper: checks id, name, status, region, and a type field ──────────

function matches(fields: string[], q: string): boolean {
  return fields.some((f) => f.toLowerCase().includes(q))
}

// ── Hook ──────────────────────────────────────────────────────────────────────

const MAX_RESULTS = 20

export function useGlobalSearch(
  datasets: GlobalSearchDatasets,
  query: string,
): GlobalSearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 1) return []

    const results: GlobalSearchResult[] = []

    // VMs
    for (const vm of datasets.vms) {
      if (matches([vm.id, vm.name, vm.status, vm.region, vm.os, vm.zone], q)) {
        results.push({
          id: vm.id,
          name: vm.name,
          status: vm.status,
          serviceId: 'VM',
          serviceSlug: 'vm',
          subtitle: `${vm.region} · ${vm.os} · ${vm.status}`,
          typeBadge: 'vm',
        })
      }
    }

    // Databases
    for (const db of datasets.databases) {
      if (matches([db.id, db.name, db.status, db.region, db.engine, db.zone], q)) {
        results.push({
          id: db.id,
          name: db.name,
          status: db.status,
          serviceId: 'Database',
          serviceSlug: 'database',
          subtitle: `${db.region} · ${db.engine} · ${db.status}`,
          typeBadge: 'db',
        })
      }
    }

    // IAM Users
    for (const user of datasets.iamUsers) {
      if (matches([user.id, user.name, user.status, user.region, user.role, user.email], q)) {
        results.push({
          id: user.id,
          name: user.name,
          status: user.status,
          serviceId: 'IAM',
          serviceSlug: 'iam',
          subtitle: `${user.region} · ${user.role} · ${user.status}`,
          typeBadge: 'iam',
        })
      }
    }

    // Buckets
    for (const bucket of datasets.buckets) {
      if (matches([bucket.id, bucket.bucketName, bucket.status, bucket.region, bucket.access], q)) {
        results.push({
          id: bucket.id,
          name: bucket.bucketName,
          status: bucket.status,
          serviceId: 'Storage',
          serviceSlug: 'storage',
          subtitle: `${bucket.region} · ${bucket.access} · ${bucket.status}`,
          typeBadge: 'str',
        })
      }
    }

    // Networks
    for (const net of datasets.networks) {
      if (matches([net.id, net.vpcName, net.status, net.region, net.type, net.cidrBlock], q)) {
        results.push({
          id: net.id,
          name: net.vpcName,
          status: net.status,
          serviceId: 'Network',
          serviceSlug: 'network',
          subtitle: `${net.region} · ${net.type} · ${net.cidrBlock}`,
          typeBadge: 'net',
        })
      }
    }

    // Sort: exact name match first, starts-with second, contains third
    results.sort((a, b) => rank(a.name, q) - rank(b.name, q))

    return results.slice(0, MAX_RESULTS)
  }, [datasets, query])
}
