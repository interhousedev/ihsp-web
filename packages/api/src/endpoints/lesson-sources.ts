// Lesson materials per subject (admin, teacher) and the "hide EMIS sources" rule of a teacher's group.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  EmisSourcesHidden,
  EmisSourcesHiddenBody,
  LessonSourcePage,
  LessonSourcesParams,
} from "../types/lesson-sources"

/** GET /v1/admin/subjects/{subject_id}/lesson-sources — admin. */
export function getAdminLessonSources(
  subjectId: string,
  params?: LessonSourcesParams,
  opts?: RequestOptions,
): Promise<LessonSourcePage> {
  return api.get<LessonSourcePage>(`/v1/admin/subjects/${seg(subjectId)}/lesson-sources`, { ...opts, query: params })
}
export const getAdminLessonSourcesQuery = (subjectId: string, params?: LessonSourcesParams) =>
  queryOptions({
    queryKey: keys.admin.lessonSources(subjectId, params),
    queryFn: ({ signal }) => getAdminLessonSources(subjectId, params, { signal }),
  })

/** GET /v1/staff/subjects/{subject_id}/lesson-sources — the teacher's own lessons; `403 links/not-teaching-subject`. */
export function getStaffLessonSources(
  subjectId: string,
  params?: LessonSourcesParams,
  opts?: RequestOptions,
): Promise<LessonSourcePage> {
  return api.get<LessonSourcePage>(`/v1/staff/subjects/${seg(subjectId)}/lesson-sources`, { ...opts, query: params })
}
export const getStaffLessonSourcesQuery = (subjectId: string, params?: LessonSourcesParams) =>
  queryOptions({
    queryKey: keys.staffSubjects.lessonSources(subjectId, params),
    queryFn: ({ signal }) => getStaffLessonSources(subjectId, params, { signal }),
  })

/** GET /v1/staff/subjects/{subject_id}/groups/{group_id}/emis-sources-hidden — teacher. */
export function getStaffEmisSourcesHidden(
  subjectId: string,
  groupId: string,
  opts?: RequestOptions,
): Promise<EmisSourcesHidden> {
  return api.get<EmisSourcesHidden>(
    `/v1/staff/subjects/${seg(subjectId)}/groups/${seg(groupId)}/emis-sources-hidden`,
    opts,
  )
}
export const getStaffEmisSourcesHiddenQuery = (subjectId: string, groupId: string) =>
  queryOptions({
    queryKey: keys.staffSubjects.emisHidden(subjectId, groupId),
    queryFn: ({ signal }) => getStaffEmisSourcesHidden(subjectId, groupId, { signal }),
  })

/** PUT /v1/staff/subjects/{subject_id}/groups/{group_id}/emis-sources-hidden — teacher. */
export function putStaffEmisSourcesHidden(
  subjectId: string,
  groupId: string,
  body: EmisSourcesHiddenBody,
  opts?: RequestOptions,
): Promise<EmisSourcesHidden> {
  return api.put<EmisSourcesHidden>(
    `/v1/staff/subjects/${seg(subjectId)}/groups/${seg(groupId)}/emis-sources-hidden`,
    body,
    opts,
  )
}
