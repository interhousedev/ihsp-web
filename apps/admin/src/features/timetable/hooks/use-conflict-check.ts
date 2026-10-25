"use client"

import { postTimetableCheck, type Conflict, type TimetableEntryInput } from "@ihsp/api"
import { useDebounce } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

const CHECK_DELAY_MS = 400

/**
 * Live conflict check of the entry being edited (ACA-8): after a short pause in typing the entry is sent to
 * `POST /v1/admin/timetable/check`. `pending` stays true while a check is due or running, so the dialog can keep
 * "Save" disabled until the answer is in. Conflicts with the entry's own previous version are dropped (`ownId`).
 */
export function useConflictCheck(input: TimetableEntryInput | null, ownId?: string) {
  const key = input ? JSON.stringify(input) : null
  const settled = useDebounce(key, CHECK_DELAY_MS)
  const settledInput = useMemo(() => (settled ? (JSON.parse(settled) as TimetableEntryInput) : null), [settled])
  const query = useQuery({
    queryKey: ["admin", "timetable-check", settled],
    queryFn: () => postTimetableCheck(settledInput as TimetableEntryInput),
    enabled: settledInput !== null,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  })
  const waiting = key !== settled
  const conflicts: Conflict[] =
    (key === settled ? query.data?.conflicts : undefined)?.filter(
      (conflict) => ownId === undefined || conflict.with_entry_id !== ownId,
    ) ?? []
  return {
    conflicts,
    pending: key !== null && (waiting || query.isFetching),
    failed: key !== null && !waiting && query.isError,
    checked: key !== null && !waiting && query.isSuccess,
  }
}
