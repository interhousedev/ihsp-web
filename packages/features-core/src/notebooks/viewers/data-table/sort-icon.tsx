import { IconArrowDown, IconArrowUp, IconArrowsSort } from "@ihsp/ui"
import type { SortState } from "./sort-rows"

/** The arrow on a sortable header: both ways while unsorted, up for ascending, down for descending. */
export function SortIcon({ sort, columnKey }: { sort: SortState; columnKey: string }) {
  if (!sort || sort.key !== columnKey) return <IconArrowsSort aria-hidden className="text-muted-foreground size-4" />
  return sort.direction === "asc" ? (
    <IconArrowUp aria-hidden className="size-4" />
  ) : (
    <IconArrowDown aria-hidden className="size-4" />
  )
}
