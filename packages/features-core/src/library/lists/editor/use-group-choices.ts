"use client"

import { getAdminGroupsQuery, getStaffGroupsQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useLibraryAccess } from "../../hooks/use-library-access"

export type GroupChoices = {
  /** `loading` while the request runs; `unavailable` when the caller's role has no way to list groups. */
  state: "loading" | "ready" | "unavailable" | "error"
  groups: { id: string; name: string }[]
  retry: () => void
}

/**
 * The groups a reading list can be written for. The platform has no endpoint of "the groups I teach" yet, so a
 * teacher gets the groups they curate (`GET /staff/groups`), an administrator every active group
 * (`GET /admin/groups`), and a librarian who is neither has no list at all (then only subject and school lists can be
 * written). The missing piece for subject teachers and librarians is reported with the library work.
 */
export function useGroupChoices(): GroupChoices {
  const { isTeacher, isAdmin } = useLibraryAccess()
  const staff = useQuery({ ...getStaffGroupsQuery(), enabled: isTeacher })
  const admin = useQuery({ ...getAdminGroupsQuery({ status: "active" }), enabled: isAdmin && !isTeacher })
  const query = isTeacher ? staff : isAdmin ? admin : null
  if (query === null) return { state: "unavailable", groups: [], retry: () => undefined }
  const retry = () => void query.refetch()
  if (query.isError) return { state: "error", groups: [], retry }
  if (!query.isSuccess) return { state: "loading", groups: [], retry }
  return { state: "ready", groups: query.data.map((group) => ({ id: group.id, name: group.name })), retry }
}
