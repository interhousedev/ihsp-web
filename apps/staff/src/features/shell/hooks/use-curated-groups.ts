"use client"

import { getStaffGroupsQuery, type GroupItem } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/**
 * The groups the teacher curates (`GET /v1/staff/groups`). "My group" is shown only when this is not empty, so
 * `isCurator` stays false while the request is loading or failed.
 */
export function useCuratedGroups(): { groups: GroupItem[]; isCurator: boolean; isPending: boolean } {
  const query = useQuery(getStaffGroupsQuery())
  const groups = query.data ?? []
  return { groups, isCurator: groups.length > 0, isPending: query.isPending }
}
