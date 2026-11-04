import { Card } from "@ihsp/ui"
import type { ReactNode } from "react"

/** The header of a group page section: the heading and the muted facts next to it. */
export function GroupHeader({ id, title, meta }: { id: string; title: string; meta?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {meta}
    </header>
  )
}

/**
 * The student list of a group, shared by the curator's group and a taught subject group. Each page renders its own
 * row; an optional column header sits above the rows on wide screens.
 */
export function StudentList<T>({
  items,
  getKey,
  renderItem,
  label,
  columns,
}: {
  items: readonly T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  label?: string
  columns?: ReactNode
}) {
  return (
    <Card className="gap-0 p-0">
      {columns}
      <ul aria-label={label} className="divide-border flex flex-col divide-y">
        {items.map((item) => (
          <li key={getKey(item)}>{renderItem(item)}</li>
        ))}
      </ul>
    </Card>
  )
}
