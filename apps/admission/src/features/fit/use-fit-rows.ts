"use client"

import { useMemo } from "react"
import { useList } from "../chooser/hooks"
import type { ListEntry } from "../chooser/types"
import { useListFit } from "./api"
import { byTotal, knownShare, toUniFit, type UniFit, type Weights } from "./fit-model"

export type FitRow = { entry: ListEntry; fit: UniFit }

/**
 * The student's list joined with its fit, best total first and unknown last. `fit` is a grey ring (every axis
 * missing) for an entry the fit endpoint did not return yet, so a row never disappears while the fit loads.
 */
export function useFitRows() {
  const list = useList()
  const fit = useListFit()
  const rows = useMemo<FitRow[]>(() => {
    const byEntry = new Map((fit.data?.items ?? []).map((item) => [item.list_entry_id, item]))
    const all = (list.data ?? []).map((entry): FitRow => {
      const item = byEntry.get(entry.id)
      return { entry, fit: item ? toUniFit(item) : toUniFit({ total: null, axes: [] }) }
    })
    return byTotal(all, (row) => (row.fit.total === null ? null : row.fit.total * (0.5 + 0.5 * knownShare(row.fit))))
  }, [list.data, fit.data])
  const weights: Weights | undefined = fit.data?.weights
  return {
    rows,
    weights,
    isPending: list.isPending || fit.isPending,
    error: list.error ?? fit.error,
    refetch: () => {
      void list.refetch()
      void fit.refetch()
    },
  }
}
