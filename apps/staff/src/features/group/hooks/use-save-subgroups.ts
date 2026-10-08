"use client"

import { keys, putStaffSubgroups, type GroupDetail, type SubgroupAssignmentsBody } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/** `PUT /v1/staff/groups/{id}/subgroups` (STF-12): the saved group replaces the cached one and the lists refresh. */
export function useSaveSubgroups(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation<GroupDetail, unknown, SubgroupAssignmentsBody>({
    mutationFn: (body) => putStaffSubgroups(groupId, body),
    onSuccess: (group) => {
      queryClient.setQueryData<GroupDetail>(keys.staff.groups.detail(groupId), group)
      void queryClient.invalidateQueries({ queryKey: keys.staff.groups.students(groupId) })
      void queryClient.invalidateQueries({ queryKey: keys.staff.groups.list() })
    },
  })
}
