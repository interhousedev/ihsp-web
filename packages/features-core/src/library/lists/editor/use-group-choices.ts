"use client"

import { getLibraryMyGroupsQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useLibraryAccess } from "../../hooks/use-library-access"

export type GroupChoices = {
  /** `loading` while the request runs; `idle` when the caller cannot write lists (no request is made). */
  state: "idle" | "loading" | "ready" | "error"
  groups: { id: string; name: string }[]
  retry: () => void
}

/**
 * The groups a reading list can be written for: `GET /v1/library/my-groups` gives a teacher the groups they teach or
 * curate and a librarian or administrator every group. A caller who cannot write lists gets no request at all.
 */
export function useGroupChoices(): GroupChoices {
  const { canWriteLists } = useLibraryAccess()
  const query = useQuery({ ...getLibraryMyGroupsQuery(), enabled: canWriteLists })
  const retry = () => void query.refetch()
  if (!canWriteLists) return { state: "idle", groups: [], retry }
  if (query.isError) return { state: "error", groups: [], retry }
  if (!query.isSuccess) return { state: "loading", groups: [], retry }
  return { state: "ready", groups: query.data.map((group) => ({ id: group.id, name: group.name })), retry }
}
