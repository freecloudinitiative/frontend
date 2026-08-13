import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/** Standard `{ all, detail }` query-key pair shared by every feature. */
export function createResourceKeys(name: string) {
  return {
    all: [name] as const,
    detail: (id: string) => [name, id] as const,
  }
}

interface ResourceHooksConfig<TListItem, TDetail, CreateInput> {
  keys: { all: readonly unknown[]; detail: (id: string) => readonly unknown[] }
  list: () => Promise<TListItem[]>
  get: (id: string) => Promise<TDetail>
  create: (input: CreateInput) => Promise<TListItem>
  remove: (id: string) => Promise<void>
  updateSettings?: (id: string, settings: Record<string, unknown>) => Promise<TListItem>
}

/**
 * Generic React Query hook set shared by every feature's `hooks.ts`. Each of
 * the five services reimplemented the same list/detail/create/delete/
 * settings hooks, differing only by the wrapped api functions and the
 * invalidated query key — this factory collapses that into one
 * implementation. Feature-specific hooks (metrics, imports, etc.) stay
 * hand-written alongside the factory output.
 *
 * `TDetail` defaults to `TListItem` but can be overridden for features (e.g.
 * IAM) whose detail endpoint returns a richer shape than the list endpoint.
 */
export function createResourceHooks<TListItem, TDetail = TListItem, CreateInput = Partial<TListItem>>(
  config: ResourceHooksConfig<TListItem, TDetail, CreateInput>,
) {
  function useList() {
    return useQuery({ queryKey: config.keys.all, queryFn: config.list })
  }

  function useDetail(id: string | undefined) {
    return useQuery({
      queryKey: config.keys.detail(id ?? ''),
      queryFn: () => config.get(id!),
      enabled: Boolean(id),
    })
  }

  function useCreate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: CreateInput) => config.create(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: config.keys.all })
      },
    })
  }

  function useRemove() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => config.remove(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: config.keys.all })
      },
    })
  }

  function useUpdateSettings() {
    const { updateSettings } = config
    if (!updateSettings) {
      throw new Error('createResourceHooks: updateSettings was not configured for this resource')
    }
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, settings }: { id: string; settings: Record<string, unknown> }) =>
        updateSettings(id, settings),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: config.keys.all })
      },
    })
  }

  return { useList, useDetail, useCreate, useRemove, useUpdateSettings }
}
