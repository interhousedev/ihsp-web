"use client"

import { getStaffGroupsQuery, type GroupItem } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export interface CuratedGroups {
  groups: GroupItem[]
  isCurator: boolean
  isPending: boolean
  isError: boolean
  refetch: () => void
}

/**
 * The groups the teacher curates (`GET /v1/staff/groups`). "My group" is shown when this is not empty. A failed
 * request is reported through `isError` (the shell shows it with a retry) and keeps "My group" visible, so a curator
 * never loses the section silently; its pages show their own empty state for a teacher without groups.
 */
export function useCuratedGroups(): CuratedGroups {
  const query = useQuery(getStaffGroupsQuery())
  const groups = query.data ?? []
  return {
    groups,
    isCurator: groups.length > 0 || query.isError,
    isPending: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
