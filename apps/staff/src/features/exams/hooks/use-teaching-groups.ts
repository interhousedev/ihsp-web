"use client"

import { getStaffGroupsQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { teachingGroups, type TeachingGroup } from "../utils/teaching"
import { useTeachingTimetable } from "./use-teaching-timetable"

type TeachingGroupsQuery = {
  data: TeachingGroup[] | undefined
  isPending: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * The groups the teacher curates plus the groups they teach in the next weeks, shaped like a query result so the
 * page can show the loading, error and empty states. It fails only when both requests fail.
 */
export function useTeachingGroups(): TeachingGroupsQuery {
  const curated = useQuery(getStaffGroupsQuery())
  const timetable = useTeachingTimetable()
  const settled = !curated.isPending && !timetable.isPending
  const data = useMemo(
    () => (settled ? teachingGroups(curated.data ?? [], timetable.data ?? []) : undefined),
    [settled, curated.data, timetable.data],
  )
  const failed = settled && curated.isError && timetable.isError
  return {
    data: failed ? undefined : data,
    isPending: !settled,
    isError: failed,
    error: curated.error ?? timetable.error,
    refetch: () => {
      void curated.refetch()
      void timetable.refetch()
    },
  }
}
