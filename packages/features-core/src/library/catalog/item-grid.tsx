"use client"

import type { ItemCard } from "@ihsp/api"
import { cn } from "@ihsp/ui"
import { cardKey } from "./card-utils"
import { ItemCardView } from "./item-card"

export type ItemGridLayout = "grid" | "list"

/** The cards of a result list in a responsive grid (2 columns on phones) or a single-column list. */
export function ItemGrid({
  items,
  layout = "grid",
  label,
  className,
}: {
  items: readonly ItemCard[]
  layout?: ItemGridLayout
  /** Accessible name of the list. */
  label?: string
  className?: string
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        layout === "grid"
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "flex flex-col gap-3",
        className,
      )}
    >
      {items.map((item) => (
        <li key={cardKey(item)} className="min-w-0">
          <ItemCardView item={item} layout={layout} className="h-full" />
        </li>
      ))}
    </ul>
  )
}
