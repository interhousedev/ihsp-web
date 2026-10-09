// LMS — authoring: drafts, steps, checkpoints, publishing, versions, staff, settings, preview.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page, PageParams } from "../types/common"
import type {
  CheckpointBody,
  CourseCreateBody,
  CourseCreator,
  CourseDraft,
  CourseSettingsBody,
  CourseStaffBody,
  CourseStaffPatchBody,
  DraftMetaBody,
  InviteCodeResponse,
  OutlineOpsBody,
  PendingChanges,
  PublishBody,
  RestoreRevisionBody,
  RevisionItem,
  StepCreateBody,
  StepDiff,
  StepDraft,
  StepDraftBody,
  VersionCompare,
  VersionCompareParams,
  VersionItem,
  VersionView,
} from "../types/lms-authoring"
import type { CourseStaffItem, StepView } from "../types/lms-learning"

/** POST /v1/lms/courses — lms_admin or lms_creator (a creator becomes the owner). */
export function postLmsCourses(body: CourseCreateBody, opts?: RequestOptions): Promise<CourseDraft> {
  return api.post<CourseDraft>("/v1/lms/courses", body, opts)
}

/** GET /v1/staff/lms/creators — lms_admin; the people who hold `lms_creator`. */
export function getLmsCreators(params?: PageParams, opts?: RequestOptions): Promise<Page<CourseCreator>> {
  return api.get<Page<CourseCreator>>("/v1/staff/lms/creators", { ...opts, query: params })
}
export const getLmsCreatorsQuery = (params?: PageParams) =>
  queryOptions({
    queryKey: [...keys.lms.creators(), params ?? {}] as const,
    queryFn: ({ signal }) => getLmsCreators(params, { signal }),
  })

/** PUT /v1/staff/lms/creators/{user_id} — lms_admin; teachers and admins only (`422 id/course-creator-not-staff`). */
export function putLmsCreator(userId: string, opts?: RequestOptions): Promise<CourseCreator> {
  return api.put<CourseCreator>(`/v1/staff/lms/creators/${seg(userId)}`, undefined, opts)
}

/** DELETE /v1/staff/lms/creators/{user_id} — lms_admin; `204`. */
export function deleteLmsCreator(userId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/staff/lms/creators/${seg(userId)}`, opts)
}

/** GET /v1/lms/courses/{id}/draft — course:edit or view_drafts. */
export function getLmsCourseDraft(courseId: string, opts?: RequestOptions): Promise<CourseDraft> {
  return api.get<CourseDraft>(`/v1/lms/courses/${seg(courseId)}/draft`, opts)
}
export const getLmsCourseDraftQuery = (courseId: string) =>
  queryOptions({
    queryKey: keys.lms.draft(courseId),
    queryFn: ({ signal }) => getLmsCourseDraft(courseId, { signal }),
  })

/** PUT /v1/lms/courses/{id}/draft/meta — course:edit. */
export function putLmsCourseDraftMeta(
  courseId: string,
  body: DraftMetaBody,
  opts?: RequestOptions,
): Promise<CourseDraft> {
  return api.put<CourseDraft>(`/v1/lms/courses/${seg(courseId)}/draft/meta`, body, opts)
}

/** POST /v1/lms/courses/{id}/draft/outline — course:edit; sections and steps operations. */
export function postLmsCourseDraftOutline(
  courseId: string,
  body: OutlineOpsBody,
  opts?: RequestOptions,
): Promise<CourseDraft> {
  return api.post<CourseDraft>(`/v1/lms/courses/${seg(courseId)}/draft/outline`, body, opts)
}

/** POST /v1/lms/courses/{id}/steps — course:edit. */
export function postLmsCourseSteps(courseId: string, body: StepCreateBody, opts?: RequestOptions): Promise<StepDraft> {
  return api.post<StepDraft>(`/v1/lms/courses/${seg(courseId)}/steps`, body, opts)
}

/** GET /v1/lms/steps/{id}/draft — course:edit or view_drafts. */
export function getLmsStepDraft(stepId: string, opts?: RequestOptions): Promise<StepDraft> {
  return api.get<StepDraft>(`/v1/lms/steps/${seg(stepId)}/draft`, opts)
}
export const getLmsStepDraftQuery = (stepId: string) =>
  queryOptions({
    queryKey: keys.lms.stepDraft(stepId),
    queryFn: ({ signal }) => getLmsStepDraft(stepId, { signal }),
  })

/** PUT /v1/lms/steps/{id}/draft — course:edit; `409 common/conflict` carries `params.theirs: StepDraft`. */
export function putLmsStepDraft(stepId: string, body: StepDraftBody, opts?: RequestOptions): Promise<StepDraft> {
  return api.put<StepDraft>(`/v1/lms/steps/${seg(stepId)}/draft`, body, opts)
}

/** POST /v1/lms/steps/{id}/discard — course:edit; drops the step's pending change. */
export function postLmsStepDiscard(stepId: string, opts?: RequestOptions): Promise<StepDraft> {
  return api.post<StepDraft>(`/v1/lms/steps/${seg(stepId)}/discard`, undefined, opts)
}

/** POST /v1/lms/steps/{id}/checkpoints — course:edit. */
export function postLmsStepCheckpoints(
  stepId: string,
  body: CheckpointBody,
  opts?: RequestOptions,
): Promise<RevisionItem> {
  return api.post<RevisionItem>(`/v1/lms/steps/${seg(stepId)}/checkpoints`, body, opts)
}

/** GET /v1/lms/steps/{id}/history — course:edit. */
export function getLmsStepHistory(stepId: string, opts?: RequestOptions): Promise<RevisionItem[]> {
  return api.get<RevisionItem[]>(`/v1/lms/steps/${seg(stepId)}/history`, opts)
}
export const getLmsStepHistoryQuery = (stepId: string) =>
  queryOptions({
    queryKey: keys.lms.history(stepId),
    queryFn: ({ signal }) => getLmsStepHistory(stepId, { signal }),
  })

/** POST /v1/lms/steps/{id}/restore — course:edit. */
export function postLmsStepRestore(
  stepId: string,
  body: RestoreRevisionBody,
  opts?: RequestOptions,
): Promise<StepDraft> {
  return api.post<StepDraft>(`/v1/lms/steps/${seg(stepId)}/restore`, body, opts)
}

/** GET /v1/lms/steps/{id}/diff — course:edit; live content against the draft. */
export function getLmsStepDiff(stepId: string, opts?: RequestOptions): Promise<StepDiff> {
  return api.get<StepDiff>(`/v1/lms/steps/${seg(stepId)}/diff`, opts)
}
export const getLmsStepDiffQuery = (stepId: string) =>
  queryOptions({ queryKey: keys.lms.diff(stepId), queryFn: ({ signal }) => getLmsStepDiff(stepId, { signal }) })

/** GET /v1/lms/courses/{id}/pending — course:edit. */
export function getLmsCoursePending(courseId: string, opts?: RequestOptions): Promise<PendingChanges> {
  return api.get<PendingChanges>(`/v1/lms/courses/${seg(courseId)}/pending`, opts)
}
export const getLmsCoursePendingQuery = (courseId: string) =>
  queryOptions({
    queryKey: keys.lms.pending(courseId),
    queryFn: ({ signal }) => getLmsCoursePending(courseId, { signal }),
  })

/** POST /v1/lms/courses/{id}/publish — course:publish; `409 lms/draft-changed` when `draft_seq` moved. */
export function postLmsCoursePublish(courseId: string, body: PublishBody, opts?: RequestOptions): Promise<VersionItem> {
  return api.post<VersionItem>(`/v1/lms/courses/${seg(courseId)}/publish`, body, opts)
}

/** POST /v1/lms/courses/{id}/discard — course:edit; discards all pending changes. */
export function postLmsCourseDiscard(courseId: string, opts?: RequestOptions): Promise<CourseDraft> {
  return api.post<CourseDraft>(`/v1/lms/courses/${seg(courseId)}/discard`, undefined, opts)
}

/** GET /v1/lms/courses/{id}/versions — course staff. */
export function getLmsCourseVersions(courseId: string, opts?: RequestOptions): Promise<VersionItem[]> {
  return api.get<VersionItem[]>(`/v1/lms/courses/${seg(courseId)}/versions`, opts)
}
export const getLmsCourseVersionsQuery = (courseId: string) =>
  queryOptions({
    queryKey: keys.lms.versions(courseId),
    queryFn: ({ signal }) => getLmsCourseVersions(courseId, { signal }),
  })

/** GET /v1/lms/courses/{id}/versions/{number} — course staff. */
export function getLmsCourseVersion(courseId: string, number: number, opts?: RequestOptions): Promise<VersionView> {
  return api.get<VersionView>(`/v1/lms/courses/${seg(courseId)}/versions/${seg(number)}`, opts)
}
export const getLmsCourseVersionQuery = (courseId: string, number: number) =>
  queryOptions({
    queryKey: keys.lms.version(courseId, number),
    queryFn: ({ signal }) => getLmsCourseVersion(courseId, number, { signal }),
  })

/** GET /v1/lms/courses/{id}/compare?a=&b= — course staff. */
export function getLmsCourseCompare(
  courseId: string,
  params: VersionCompareParams,
  opts?: RequestOptions,
): Promise<VersionCompare> {
  return api.get<VersionCompare>(`/v1/lms/courses/${seg(courseId)}/compare`, { ...opts, query: params })
}
export const getLmsCourseCompareQuery = (courseId: string, params: VersionCompareParams) =>
  queryOptions({
    queryKey: keys.lms.compare(courseId, params.a, params.b),
    queryFn: ({ signal }) => getLmsCourseCompare(courseId, params, { signal }),
  })

/** POST /v1/lms/courses/{id}/versions/{number}/restore — course:edit. */
export function postLmsCourseVersionRestore(
  courseId: string,
  number: number,
  opts?: RequestOptions,
): Promise<CourseDraft> {
  return api.post<CourseDraft>(`/v1/lms/courses/${seg(courseId)}/versions/${seg(number)}/restore`, undefined, opts)
}

/** GET /v1/lms/courses/{id}/staff — course staff. */
export function getLmsCourseStaff(courseId: string, opts?: RequestOptions): Promise<CourseStaffItem[]> {
  return api.get<CourseStaffItem[]>(`/v1/lms/courses/${seg(courseId)}/staff`, opts)
}
export const getLmsCourseStaffQuery = (courseId: string) =>
  queryOptions({
    queryKey: keys.lms.staff(courseId),
    queryFn: ({ signal }) => getLmsCourseStaff(courseId, { signal }),
  })

/** POST /v1/lms/courses/{id}/staff — course:manage_staff or lms_admin; unknown login gives `404 id/user-not-found`. */
export function postLmsCourseStaff(
  courseId: string,
  body: CourseStaffBody,
  opts?: RequestOptions,
): Promise<CourseStaffItem> {
  return api.post<CourseStaffItem>(`/v1/lms/courses/${seg(courseId)}/staff`, body, opts)
}

/** PATCH /v1/lms/courses/{id}/staff/{user_id} — course:manage_staff or lms_admin. */
export function patchLmsCourseStaff(
  courseId: string,
  userId: string,
  body: CourseStaffPatchBody,
  opts?: RequestOptions,
): Promise<CourseStaffItem> {
  return api.patch<CourseStaffItem>(`/v1/lms/courses/${seg(courseId)}/staff/${seg(userId)}`, body, opts)
}

/** DELETE /v1/lms/courses/{id}/staff/{user_id} — course:manage_staff or lms_admin; `204`. */
export function deleteLmsCourseStaff(courseId: string, userId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/lms/courses/${seg(courseId)}/staff/${seg(userId)}`, opts)
}

/** PATCH /v1/lms/courses/{id}/settings — course:edit. */
export function patchLmsCourseSettings(
  courseId: string,
  body: CourseSettingsBody,
  opts?: RequestOptions,
): Promise<CourseDraft> {
  return api.patch<CourseDraft>(`/v1/lms/courses/${seg(courseId)}/settings`, body, opts)
}

/** POST /v1/lms/courses/{id}/invite-code — course:manage_staff; rotates the code. */
export function postLmsCourseInviteCode(courseId: string, opts?: RequestOptions): Promise<InviteCodeResponse> {
  return api.post<InviteCodeResponse>(`/v1/lms/courses/${seg(courseId)}/invite-code`, undefined, opts)
}

/** GET /v1/lms/courses/{id}/preview/steps/{step_id} — course:view_drafts; draft render. */
export function getLmsCoursePreviewStep(courseId: string, stepId: string, opts?: RequestOptions): Promise<StepView> {
  return api.get<StepView>(`/v1/lms/courses/${seg(courseId)}/preview/steps/${seg(stepId)}`, opts)
}
export const getLmsCoursePreviewStepQuery = (courseId: string, stepId: string) =>
  queryOptions({
    queryKey: keys.lms.preview(courseId, stepId),
    queryFn: ({ signal }) => getLmsCoursePreviewStep(courseId, stepId, { signal }),
  })

// --- Names used by the app plans ---

export const postCourse = postLmsCourses
