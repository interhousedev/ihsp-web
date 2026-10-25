// Academic — group curriculum from EMIS.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { CurriculumSyncResult, CurriculumView } from "../types/curriculum"

/** GET /v1/me/curriculum — student; `null` while the group has no stored curriculum. */
export function getMeCurriculum(opts?: RequestOptions): Promise<CurriculumView | null> {
  return api.get<CurriculumView | null>("/v1/me/curriculum", opts)
}
export const getMeCurriculumQuery = () =>
  queryOptions({
    queryKey: keys.me.curriculum(),
    queryFn: ({ signal }) => getMeCurriculum({ signal }),
  })

/** GET /v1/admin/groups/{id}/curriculum — admin; `null` while the group has no stored curriculum. */
export function getAdminGroupCurriculum(id: string, opts?: RequestOptions): Promise<CurriculumView | null> {
  return api.get<CurriculumView | null>(`/v1/admin/groups/${seg(id)}/curriculum`, opts)
}
export const getAdminGroupCurriculumQuery = (id: string) =>
  queryOptions({
    queryKey: keys.admin.groups.curriculum(id),
    queryFn: ({ signal }) => getAdminGroupCurriculum(id, { signal }),
  })

/** POST /v1/admin/groups/{id}/curriculum/sync — admin; fetches the curriculum from EMIS with a student of the group. */
export function postAdminGroupCurriculumSync(id: string, opts?: RequestOptions): Promise<CurriculumSyncResult> {
  return api.post<CurriculumSyncResult>(`/v1/admin/groups/${seg(id)}/curriculum/sync`, {}, opts)
}
