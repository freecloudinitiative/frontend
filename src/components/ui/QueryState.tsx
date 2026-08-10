import type { ReactNode } from 'react'
import { Panel } from './Panel'

interface QueryStateProps<T> {
  isLoading: boolean
  isError: boolean
  data: T | undefined
  children: (data: T) => ReactNode
  emptyMessage?: string
}

export function QueryState<T>({
  isLoading,
  isError,
  data,
  children,
  emptyMessage = 'Not found',
}: QueryStateProps<T>) {
  if (isLoading) {
    return (
      <Panel>
        <p>Loading…</p>
      </Panel>
    )
  }

  if (isError || data === undefined) {
    return (
      <Panel>
        <p className="text-tui-stopped">{emptyMessage}</p>
      </Panel>
    )
  }

  return <>{children(data)}</>
}
