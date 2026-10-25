"use client"

import { useState } from "react"
import type { PendingItem } from "./add-types"

/** The ticked items of the picking tabs, kept while the student switches tabs. */
export function useAddSelection() {
  const [picked, setPicked] = useState<ReadonlyMap<string, PendingItem>>(new Map())
  return {
    items: [...picked.values()],
    size: picked.size,
    has: (key: string) => picked.has(key),
    toggle: (item: PendingItem) =>
      setPicked((current) => {
        const next = new Map(current)
        if (next.has(item.key)) next.delete(item.key)
        else next.set(item.key, item)
        return next
      }),
    clear: () => setPicked(new Map()),
  }
}

export type AddSelection = ReturnType<typeof useAddSelection>
