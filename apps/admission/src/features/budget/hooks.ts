"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { patchListEntry } from "../chooser/api"
import { useList } from "../chooser/hooks"
import { getBudget } from "./api"
import type { FeeStatus } from "./types"

const KEY = ["admission", "budget"] as const

export function useBudget() {
  return useQuery({ queryKey: KEY, queryFn: ({ signal }) => getBudget(signal) })
}

/** Sets the application-fee status of a list entry; the budget and the list reload afterwards (new `lock_version`). */
export function useFeeStatus() {
  const client = useQueryClient()
  const list = useList()
  return useMutation({
    mutationFn: ({ entryId, status }: { entryId: string; status: FeeStatus }) => {
      const entry = list.data?.find((item) => item.id === entryId)
      if (!entry) return Promise.reject(new Error("entry not in the list"))
      return patchListEntry(entryId, { lock_version: entry.lock_version, fee_status: status })
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: KEY })
      void client.invalidateQueries({ queryKey: ["admission", "list"] })
    },
  })
}
