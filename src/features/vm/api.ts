import apiClient from '@/lib/axios'
import type { CreateVmInput, UpdateVmInput, Vm, VmMetricPoint } from './types'

export async function getVms(): Promise<Vm[]> {
  const { data } = await apiClient.get<Vm[]>('/api/vms')
  return data
}

export async function getVm(id: string): Promise<Vm> {
  const { data } = await apiClient.get<Vm>(`/api/vms/${id}`)
  return data
}

export async function createVm(input: CreateVmInput): Promise<Vm> {
  const { data } = await apiClient.post<Vm>('/api/vms', input)
  return data
}

export async function deleteVm(id: string): Promise<void> {
  await apiClient.delete(`/api/vms/${id}`)
}

export async function patchVm(id: string, partial: UpdateVmInput): Promise<Vm> {
  const { data } = await apiClient.patch<Vm>(`/api/vms/${id}`, partial)
  return data
}

export async function getVmMetrics(id: string): Promise<VmMetricPoint[]> {
  const { data } = await apiClient.get<VmMetricPoint[]>(`/api/vms/${id}/metrics`)
  return data
}
