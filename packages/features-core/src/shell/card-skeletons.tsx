"use client"

import { Skeleton, cn } from "@ihsp/ui"

/** A grid of card placeholders for `StateView`'s and `QueryState`'s `skeleton` slot. Sets `className` for its gap. */
export function CardSkeletons({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-32 w-full rounded-xl" />
        </li>
      ))}
    </ul>
  )
}
