import apiClient from '@/lib/axios'

/**
 * Generic REST CRUD wrapper shared by every feature's `api.ts`. Each of the
 * five services (`compute-engines`, `databases`, `iam/users`, `networks`,
 * `buckets`) exposed the identical list/get/create/delete/settings request
 * shape, differing only by base path and payload types — this factory
 * collapses that into one implementation.
 */
export function createResourceApi<T, CreateInput = Partial<T>, UpdateInput = Partial<T>>(basePath: string) {
  return {
    list: async (): Promise<T[]> => {
      const { data } = await apiClient.get<T[]>(basePath)
      return data
    },
    get: async (id: string): Promise<T> => {
      const { data } = await apiClient.get<T>(`${basePath}/${id}`)
      return data
    },
    create: async (input: CreateInput): Promise<T> => {
      const { data } = await apiClient.post<T>(basePath, input)
      return data
    },
    remove: async (id: string): Promise<void> => {
      await apiClient.delete(`${basePath}/${id}`)
    },
    patch: async (id: string, partial: UpdateInput): Promise<T> => {
      const { data } = await apiClient.patch<T>(`${basePath}/${id}`, partial)
      return data
    },
    updateSettings: async (id: string, settings: Record<string, unknown>): Promise<T> => {
      const { data } = await apiClient.patch<T>(`${basePath}/${id}/settings`, settings)
      return data
    },
  }
}
